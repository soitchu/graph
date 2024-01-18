let payload;
let result = [0, 0];
let YValues = [];
let lastHeight = 0;
const colors = {
    "0": [173, 216, 230],
    "1": [255, 255, 143],
};
function cal(x, y) {
    // modify result
    // the first value of the result is the colorId
    // the second value is the intensity of the color. Must
    // be between 0 and 255, and an Integer
    result[0] = (x > y) ? 0 : 1;
    result[1] = 180;
}
function calX(x) {
    YValues.length = 0;
    YValues.push(x * x);
    YValues.push(x * x * x);
    YValues.push(x + 10);
}
function changeImageBufferX() {
    let xIndex = payload.x.xIndexStart;
    const canvasImageData = new Uint8Array(payload.sharedMemory);
    const imageDataLength = canvasImageData.length;
    const width = payload.width;
    const translateX = payload.translate.x * payload.scale;
    const translateY = payload.translate.y * payload.scale;
    for (let i = payload.x.start; i < payload.x.end; i += payload.x.step) {
        calX(i);
        for (let j = 0; j < YValues.length; j++) {
            const yCoords = YValues[j];
            let iniX = i * payload.scale + translateX;
            let iniY = -yCoords * payload.scale + translateY;
            // Converting to integer
            iniX = iniX | iniX;
            iniY = iniY | iniY;
            if (iniX >= (width - 1) || iniX < 0) {
                continue;
            }
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
    let xIndex = payload.x.xIndexStart;
    const canvasImageData = new Uint8Array(payload.sharedMemory);
    const canvasWidth = payload.width;
    for (let i = payload.x.start; i < payload.x.end; i += payload.x.step) {
        let yIndex = 0;
        for (var j = payload.y.start; j > payload.y.end; j -= payload.y.step) {
            cal(i, j);
            const val = result;
            const opacity = val[1];
            const colorId = val[0];
            const pixelPos = (yIndex * canvasWidth + xIndex) * 4;
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
            yIndex++;
        }
        xIndex++;
    }
    postMessage(payload.responseId);
}
onmessage = function (event) {
    payload = event.data;
    if (payload.onlyX) {
        changeImageBufferX();
    }
    else {
        changeImageBuffer();
    }
};
