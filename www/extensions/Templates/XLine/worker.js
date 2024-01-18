let payload;
let result = [0, 0];
let YValues = [];
let lastHeight = 0;
const colors = {
    "0": [173, 216, 230],
    "1": [255, 255, 143],
};
function calX(x) {
    return x * x;
}
function canvasToGraphCoords(x, y) {
    return [
        x / payload.scale - payload.translate.x,
        -y / payload.scale - payload.translate.y,
    ];
}
function changeImageBufferX() {
    let xIndex = payload.x.xIndexStart;
    const lineData = new Float64Array(payload.sharedMemory);
    const height = payload.height;
    let lastYCoord = undefined;
    let lastXCoord = undefined;
    for (let i = payload.x.start; i <= payload.x.end; i += 1) {
        const xCoords = canvasToGraphCoords(i, 0)[0];
        const yCoords = calX(xCoords);
        let iniX = (xCoords + payload.translate.x) * payload.scale;
        let iniY = (-yCoords + payload.translate.y) * payload.scale;
        if (isNaN(iniY)) {
            continue;
        }
        const offset = (i) * 4;
        if (lastYCoord !== undefined &&
            (iniY >= 0 || lastYCoord >= 0) &&
            (iniY <= height || lastYCoord <= height)) {
            lineData[offset] = lastXCoord;
            lineData[offset + 1] = lastYCoord;
            lineData[offset + 2] = iniX;
            lineData[offset + 3] = iniY;
        }
        else {
            lastYCoord = undefined;
        }
        lastYCoord = iniY;
        lastXCoord = iniX;
        xIndex++;
    }
    postMessage(payload.responseId);
}
onmessage = function (event) {
    payload = event.data;
    changeImageBufferX();
};
