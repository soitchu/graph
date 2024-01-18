let payload: XYWorkerPayload;
let result = [0, 0];
let YValues: Array<number> = [];
let lastHeight = 0;

let MAX_ITERATION = 500;

const colors: { [key: string]: number[] } = {
    "0": [173, 216, 230],
    "1": [255, 255, 143],
};

function mandelbrot(c) {
    let z = [0, 0], n = 0, p = [0, 0], d = 0;

    do {
        const sq1 = Math.pow(z[0], 2);
        const sq2 = Math.pow(z[1], 2);

        p[0] = sq1 - sq2; 
        p[1] = 2 * z[0] * z[1];

        z[0] = p[0] + c[0];
        z[1] = p[1] + c[1];

        d = sq1 + sq2;
        n += 1;
    } while (d <= 4 && n < MAX_ITERATION)
    
    result[0] = d <= 2 ? 0 : 1 
    result[1] = 255 * (n / MAX_ITERATION);
}


function mandelbrotSlow(c) {
    let z = [0, 0], n = 0, p, d;

    do {
        p = [
            Math.pow(z[0], 2) - Math.pow(z[1], 2),
            2 * z[0] * z[1]
        ];

        z = [
            p[0] + c[0],
            p[1] + c[1]
        ];

        d = Math.hypot(z[0], z[1]);
        n += 1
    } while (d <= 2 && n < MAX_ITERATION)
    
    result[0] = d <= 2 ? 0 : 1 
    result[1] = 255 * (n / MAX_ITERATION);
}


function cal(x: number, y: number): void {
    // modify result
    // the first value of the result is the colorId
    // the second value is the intensity of the color. Must
    // be between 0 and 255, and an Integer
    mandelbrot([x, y]);
    // mandelbrot([x, y]);
    // result[0] = (x > y) ? 0 : 1;
    // result[1] = 180;
}

function changeImageBufferX() {
    let xIndex = payload.x.xIndexStart;
    const canvasImageData = new Uint8Array(payload.sharedMemory);
    const imageDataLength = canvasImageData.length;
    const width = payload.width;
    const translateX = payload.translate.x * payload.scale;
    const translateY = payload.translate.y * payload.scale;
    const scale = payload.scale;

    for (let i = payload.x.start; i < payload.x.end; i++) {
        calX((i - translateX) / scale);

        for (let j = 0; j < YValues.length; j++) {
            const yCoords = YValues[j];
            let iniX = i;
            let iniY = -yCoords * payload.scale + translateY;

            if (isNaN(iniY)) {
                continue;
            }

            // Converting to integer
            iniX = iniX | iniX;
            iniY = iniY | iniY;

            const start = iniY * (width * 4) + iniX * 4;
            const offset = start;

            if (offset < imageDataLength && offset >= 0) {
                canvasImageData[offset] = 255;
                canvasImageData[offset + 1] = 255;
                canvasImageData[offset + 2] = 255;
                canvasImageData[offset + 3] = 255;
            }
        }

        xIndex++;
    }

    postMessage(payload.responseId);
}

function changeImageBuffer() {
    const canvasImageData = new Uint8Array(payload.sharedMemory);
    const canvasWidth = payload.width;
    const canvasHeight = payload.height;
    const translateX = payload.translate.x;
    const translateY = payload.translate.y;
    const scale = payload.scale;

    for (let i = payload.x.start; i < payload.x.end; i++) {
        for (var j = 0; j < canvasHeight; j++) {

            cal(
                i / scale - translateX, 
                -(j / scale - translateY)
            );

            const val = result;
            const opacity = val[1];
            const colorId = val[0];
            const pixelPos = (j * canvasWidth + i) * 4;

            if (pixelPos >= canvasImageData.length) {
                continue;
            }

            if (colorId in colors) {
                const color = colors[colorId];

                canvasImageData[pixelPos + 0] = color[0];
                canvasImageData[pixelPos + 1] = color[1];
                canvasImageData[pixelPos + 2] = color[2];
                canvasImageData[pixelPos + 3] = opacity;
            }

        }

    }

    postMessage(payload.responseId);
}

onmessage = function (event: MessageEvent) {
    payload = event.data;
    
    MAX_ITERATION = payload.config[0].MAX_ITERATION;

    if (payload.onlyX) {
        changeImageBufferX();
    } else {
        changeImageBuffer();
    }
};