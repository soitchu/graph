const config = {
    fontSize: 14
};
export class Graph {
    constructor(canvas, height, width, drawY = false, coordinatesScale) {
        this.shouldDrawY = false;
        this.bifurConfig = {
            inUse: false,
            translate: {
                start: [0, 0],
                end: [0, 0]
            },
            scale: 1
        };
        this.extensions = [];
        this.elementary = 100;
        this.coordsSize = 0;
        this.scaleAnchor = {
            x: 0,
            y: 0,
        };
        this.currentCoords = {
            x: 0,
            y: 0,
        };
        this.currentInitial = {
            x: 0,
            y: 0,
        };
        this.toDrawX = [];
        this.toDrawY = [];
        this.toDrawLines = [];
        this.toDrawLyapLines = [];
        this.toDrawCirles = [];
        this.toDrawIneq = [];
        this.toDrawLyapunov = [];
        this.wheelTimeout = null;
        this.xAxisNums = [];
        this.yAxisNums = [];
        this.webWorkerIter = 0;
        this.translate = {
            "x": 0,
            "y": 0,
            "iniX": 0,
            "iniY": 0,
        };
        this.drag = {
            "ini": {
                "x": 0,
                "y": 0,
            },
            "check": 0,
        };
        this.workers = [];
        this.workersLyapunov = Array(navigator.hardwareConcurrency * 2);
        this.drawY = false;
        this.coordinatesScale = {
            x: 1,
            y: 1
        };
        if (coordinatesScale) {
            this.coordinatesScale = coordinatesScale;
        }
        this.drawY = drawY;
        this.shouldDrawY = drawY;
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d", {
        // desynchronized: true
        });
        this.ctx.imageSmoothingEnabled = false;
        canvas.height = height;
        canvas.width = width;
        this.bifurHelper = new OffscreenCanvas(width, height);
        this.bifurHelperCtx = this.bifurHelper.getContext("2d", { willReadFrequently: true });
        this.backBufferCanvas = new OffscreenCanvas(width, height);
        this.backBufferCtx = this.backBufferCanvas.getContext("2d", { willReadFrequently: true });
        this.lyapHelper = new OffscreenCanvas(width, height);
        this.lyapHelperCtx = this.lyapHelper.getContext("2d", { willReadFrequently: true });
        this.numberCanvas = document.createElement("canvas");
        this.numberCtx = this.numberCanvas.getContext("2d", { willReadFrequently: true });
        this.scale = 1;
        this.ctx.lineWidth = 2;
        this.elementary = width;
        this.coordsSize = 0;
        this.translate.y = canvas.height;
        // this.scaleUp(100, this, 0, canvas.height);
        const self = this;
        this.canvas.addEventListener("mousedown", (event) => {
            this.scaleAnchor.x = event.offsetX;
            this.scaleAnchor.y = event.offsetY;
            this.down(event.offsetX, event.offsetY, event.ctrlKey);
        });
        this.canvas.addEventListener("wheel", (event) => {
            self.mouseWheelEvent(event, self);
        });
        this.canvas.addEventListener("mousemove", (event) => {
            this.move(event.offsetX, event.offsetY);
        }, { 'passive': true });
        this.canvas.addEventListener("mouseup", (event) => {
            this.up(event.offsetX, event.offsetY);
        });
        // for (let i = 0; i < 16; i++) {
        //     this.workers[i] = new Worker("worker2.js");
        // }
    }
    resize(width, height) {
        for (const ext of this.extensions) {
            ext.resize(width, height);
        }
        this.canvas.height = height;
        this.canvas.width = width;
        this.numberCanvas.height = height;
        this.numberCanvas.width = width;
        this.elementary = width;
        this.bifurHelper = new OffscreenCanvas(width, height);
        this.bifurHelperCtx = this.bifurHelper.getContext("2d", { willReadFrequently: true });
        this.backBufferCanvas = new OffscreenCanvas(width, height);
        this.backBufferCtx = this.backBufferCanvas.getContext("2d", { willReadFrequently: true });
        this.lyapHelper = new OffscreenCanvas(width, height);
        this.lyapHelperCtx = this.lyapHelper.getContext("2d", { willReadFrequently: true });
        this.ctx.imageSmoothingEnabled = false;
        this.redraw();
    }
    drawGridAndNums() {
        this.numberCtx.lineWidth = 2;
        this.numberCtx.strokeStyle = "#000000ff";
        this.numberCtx.strokeStyle = "#89CFF033";
        this.numberCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        this.drawNums();
    }
    redraw(shouldDrawBifur = 1, step = 0) {
        this.drawGridAndNums();
        if (step === 0) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
        for (const ext of this.extensions) {
            ext.redraw();
        }
        this.drawPoints();
        this.drawLines();
        this.drawGraphX();
        this.drawGraphY();
        this.drawGraphIneq();
        this.updateCoords();
        this.bifurConfig.inUse = false;
    }
    addGraph(config) {
        switch (config.type) {
            case "drawGraphX":
                this.toDrawX.push(config);
                break;
            case "drawGraphY":
                this.toDrawY.push(config);
                break;
            case "drawGraphIneq":
                this.toDrawIneq.push(config);
                break;
            case "drawGraphLyapunov":
                this.toDrawLyapunov.push(config);
                break;
            case "drawLines":
                config["slope"] = (config.from.y - config.to.y) / (config.from.x - config.to.x);
                this.toDrawLines.push(config);
                break;
            case "drawCircle":
                this.toDrawCirles.push(config);
                break;
        }
    }
    canvasToGraphCoords(x, y) {
        return [
            x / this.scale - this.translate.x,
            -y / this.scale + this.translate.y
        ];
    }
    graphToCanvasCoords(x, y) {
        return [
            (x + this.translate.x) * this.scale,
            (-y + this.translate.y) * this.scale,
        ];
    }
    scaleUp(inc, self, x = 0, y = 0) {
        if (!this.bifurConfig.inUse) {
            this.updateInterCanvas();
        }
        self.scale += inc;
        let scale = self.scale;
        self.translate.x += -((x * (scale) / (scale - inc)) - x) / scale;
        self.translate.y += -((y * (scale) / (scale - inc)) - y) / scale;
        const start = self.bifurConfig.translate.start;
        const end = self.bifurConfig.translate.end;
        const startCoords = self.graphToCanvasCoords(start[0], start[1]);
        const endCoords = self.graphToCanvasCoords(end[0], end[1]);
        self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
        self.ctx.drawImage(self.bifurHelper, startCoords[0], startCoords[1], Math.abs(endCoords[0] - startCoords[0]), Math.abs(endCoords[1] - startCoords[1]));
        // refactor
        for (const ext of self.extensions) {
            ext.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
            ext.ctx.drawImage(ext.doubleBufferCanvas, startCoords[0], startCoords[1], Math.abs(endCoords[0] - startCoords[0]), Math.abs(endCoords[1] - startCoords[1]));
        }
        self.drawGridAndNums();
        self.bifurConfig.inUse = true;
    }
    ImageDataToBlob(imageData) {
        const w = imageData.width;
        const h = imageData.height;
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = w;
        canvas.height = h;
        ctx.putImageData(imageData, 0, 0);
        return new Promise((resolve) => {
            canvas.toBlob(resolve);
        });
    }
    drawLyapunovLinear() {
        var _a;
        let prevX;
        let prevY;
        let ctx = this.ctx;
        ctx.strokeStyle = (_a = window["strokeStyle"]) !== null && _a !== void 0 ? _a : "black";
        for (var i = 0; i < this.elementary; i++) {
            const xCoord = -this.translate.x + (this.canvas.width / this.scale) * (i / this.elementary);
            let yCoord = this.lyapInstance.lyapunovExponentFx(xCoord, 1, this.lyapInstance);
            if (!isFinite(yCoord) || (prevY && !isFinite(prevY))) {
                continue;
            }
            // We are drawing lines to make it obvious when 
            // it spikes
            this.addGraph({
                type: "drawLines",
                from: {
                    x: prevX,
                    y: prevY
                },
                to: {
                    x: xCoord,
                    y: yCoord
                }
            });
            prevX = xCoord;
            prevY = yCoord;
        }
    }
    drawPoints() {
        const scale = this.scale;
        const height = this.canvas.height;
        const width = this.canvas.width;
        const offsetSize = 1;
        const offsetMid = Math.floor(offsetSize / 2);
        const offsetRealMid = offsetSize / 2;
        const offsets = [];
        const strengths = [];
        for (let i = 0; i < offsetSize; i++) {
            for (let j = 0; j < offsetSize; j++) {
                const x = (offsetMid - i);
                const y = (offsetMid - j);
                if (Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)) < 5) {
                    offsets.push(width * x * 4 - 4 * y);
                }
            }
        }
        const offsetLen = offsets.length;
        // This is way faster than drawing the rectangles manually 
        // using .fillRect or .rect
        const imageData = new ImageData(width, height);
        const imageDataArray = imageData.data;
        const imageDataLength = imageDataArray.length;
        const translateX = this.translate.x * scale;
        const translateY = this.translate.y * scale;
        const lineWidth = this.ctx.lineWidth;
        const strokeStyle = this.ctx.strokeStyle;
        this.ctx.lineWidth = 2;
        this.ctx.strokeStyle = "white";
        this.ctx.beginPath();
        this.ctx.arc(translateX, translateY, 1 * scale, 0, 2 * Math.PI);
        this.ctx.stroke();
        if (lineWidth) {
            this.ctx.lineWidth = lineWidth;
        }
        if (strokeStyle) {
            this.ctx.strokeStyle = strokeStyle;
        }
        for (let i = 0; i < this.toDrawCirles.length; i++) {
            let iniX = (this.toDrawCirles[i].coords.x) * scale + translateX;
            let iniY = (-this.toDrawCirles[i].coords.y) * scale + translateY;
            iniX = iniX | iniX;
            iniY = iniY | iniY;
            if (iniX >= (width - 1) || iniX < 0) {
                continue;
            }
            const start = iniY * (width * 4) + iniX * 4;
            for (let i = 0; i < offsetLen; i++) {
                const offset = offsets[i] + start;
                if (offset < imageDataLength && offset >= 0) {
                    imageDataArray[offset] = 255;
                    imageDataArray[offset + 1] = 255;
                    imageDataArray[offset + 2] = 255;
                    imageDataArray[offset + 3] = 255;
                }
            }
        }
        this.bifurHelperCtx.putImageData(imageData, 0, 0);
        this.ctx.drawImage(this.bifurHelper, 0, 0);
    }
    drawLines() {
        const toDrawLines = this.toDrawLines;
        const ctx = this.ctx;
        ctx.beginPath();
        this.ctx.strokeStyle = "blue";
        for (var i = 0; i < toDrawLines.length; i++) {
            let fromX = toDrawLines[i].from.x;
            let fromY = toDrawLines[i].from.y;
            let toX = toDrawLines[i].to.x;
            let toY = toDrawLines[i].to.y;
            let iniX = (fromX + this.translate.x) * this.scale;
            let iniY = (-fromY + this.translate.y) * this.scale;
            let finalX = (toX + this.translate.x) * this.scale;
            let finalY = (-toY + this.translate.y) * this.scale;
            if (finalX > 100000000000000000000 || finalY > 100000000000000000000 || iniX > 100000000000000000000 || iniY > 100000000000000000000) {
                continue;
            }
            ctx.moveTo(iniX, iniY);
            ctx.lineTo(finalX, finalY);
        }
        ctx.stroke();
    }
    isInFrame(x, y) {
        return (x > (-this.translate.x - this.canvas.width / this.scale) &&
            x < (-this.translate.x + (2 * this.canvas.width) / this.scale) &&
            y < (this.translate.y + this.canvas.height / this.scale) &&
            y > (this.translate.y - (2 * this.canvas.height) / this.scale));
    }
    isInFrameX(x) {
        return (x > (-this.translate.x) &&
            x < (-this.translate.x + (this.canvas.width) / this.scale));
    }
    isInFrameY(y) {
        return (y < (this.translate.y) &&
            y > (this.translate.y - (this.canvas.height) / this.scale));
    }
    drawGraphX() {
        var _a;
        let prevX;
        let prevY;
        let ctx = this.ctx;
        ctx.strokeStyle = (_a = window["strokeStyle"]) !== null && _a !== void 0 ? _a : "white";
        for (var j = 0; j < this.toDrawX.length; j++) {
            ctx.beginPath();
            let setCheck = false;
            for (var i = 0; i < this.elementary; i++) {
                let x = -this.translate.x + (this.canvas.width / this.scale) * (i / this.elementary);
                if (!setCheck) {
                    prevX = this.xFunc(x, this.toDrawX[j].xFunc);
                    prevY = this.yFunc(prevX, this.toDrawX[j].yFunc);
                    if (this.isInFrame(prevX, prevY)) {
                        setCheck = true;
                    }
                }
                else {
                    let xCoord = this.xFunc(x, this.toDrawX[j].xFunc);
                    let yCoord = this.yFunc(xCoord, this.toDrawX[j].yFunc);
                    if (this.toDrawX[j].constraintsX(xCoord) && this.toDrawX[j].constraintsY(yCoord)) {
                        if (this.isInFrame(prevX, prevY) && this.isInFrame(xCoord, yCoord)) {
                            ctx.moveTo((prevX + this.translate.x) * (this.scale), (-prevY + this.translate.y) * (this.scale));
                            ctx.lineTo((xCoord + this.translate.x) * (this.scale), (-yCoord + this.translate.y) * (this.scale));
                        }
                    }
                    prevX = xCoord;
                    prevY = yCoord;
                }
            }
            ctx.stroke();
        }
        ctx.strokeStyle = "black";
    }
    drawGraphY() {
        let prevX;
        let prevY;
        let ctx = this.ctx;
        for (var j = 0; j < this.toDrawY.length; j++) {
            ctx.beginPath();
            let setCheck = false;
            for (var i = 0; i < this.elementary; i++) {
                let y = this.translate.y - (this.canvas.height / this.scale) * (i / this.elementary);
                if (!setCheck) {
                    prevY = this.yFunc(y, this.toDrawY[j].yFunc);
                    prevX = this.xFunc(prevY, this.toDrawY[j].xFunc);
                    if (this.isInFrame(prevX, prevY)) {
                        setCheck = true;
                    }
                }
                else {
                    let yCoord = this.yFunc(y, this.toDrawY[j].yFunc);
                    let xCoord = this.xFunc(yCoord, this.toDrawY[j].xFunc);
                    if (this.toDrawY[j].constraintsX(xCoord) && this.toDrawY[j].constraintsY(yCoord) && this.isInFrame(prevX, prevY) && this.isInFrame(xCoord, yCoord)) {
                        ctx.moveTo((prevX + this.translate.x) * (this.scale), (-prevY + this.translate.y) * (this.scale));
                        ctx.lineTo((xCoord + this.translate.x) * (this.scale), (-yCoord + this.translate.y) * (this.scale));
                    }
                    prevX = xCoord;
                    prevY = yCoord;
                }
            }
            ctx.stroke();
        }
    }
    drawBifurcation() {
    }
    addExtension(ext) {
        this.extensions.push(ext);
    }
    drawGraphLyapunov() {
    }
    drawGraphIneq() {
        // todo test
        if (this.toDrawIneq.length == 0) {
            return;
        }
        for (var iterIn = 0; iterIn < this.toDrawIneq.length; iterIn++) {
            let ctx = this.ctx;
            // ctx.fillStyle = this.toDrawIneq[iterIn].yFunc;
            let temp1 = (x) => { return (x); };
            let temp2 = (y) => { return y; };
            let temp3 = this.toDrawIneq[iterIn].comparison;
            let boolArr = new Array(this.elementary);
            for (var i = 0; i < this.elementary; i++) {
                boolArr[i] = new Array(this.elementary);
            }
            let x = -this.translate.x + (this.canvas.width / this.scale) * (0 / this.elementary);
            let y = (-this.translate.y + (this.canvas.height / this.scale) * (0 / this.elementary));
            let yIni = y;
            let xHelper = (this.canvas.width / this.scale) * (1 / this.elementary);
            let yHelper = (this.canvas.height / this.scale) * (1 / this.elementary);
            let start = performance.now();
            for (var i = 0; i < this.elementary; i++) {
                y = yIni;
                for (var j = 0; j < this.elementary; j++) {
                    let xCoord = this.xFunc(x, temp1);
                    let yCoord = this.yFunc(-y, temp2);
                    let bool = temp3(xCoord, yCoord);
                    boolArr[i][j] = bool;
                    y += yHelper;
                }
                x += xHelper;
            }
            console.log(`Move took ${performance.now() - start} milliseconds.`);
            let rectLengths = [];
            for (var i = 0; i < this.elementary; i++) {
                rectLengths.push([]);
                let count = 0;
                let lastBool = true;
                let check;
                for (var j = 0; j < this.elementary; j++) {
                    if (boolArr[j][i] == lastBool) {
                        count++;
                        check = false;
                    }
                    else {
                        check = true;
                        rectLengths[i].push(count);
                        count = 1;
                    }
                    lastBool = boolArr[j][i];
                }
                if (!check) {
                    rectLengths[i].push(count);
                }
            }
            console.log(`Move took ${performance.now() - start} milliseconds.`);
            ctx.beginPath();
            for (var i = 0; i < this.elementary; i++) {
                let padding = 0;
                let yP = (-this.translate.y + (this.canvas.height / this.scale) * (i / this.elementary));
                for (var j = 0; j < rectLengths[i].length; j++) {
                    let cur = rectLengths[i][j] * (this.canvas.width / (this.elementary));
                    if ((j % 2) == 0) {
                        ctx.rect(padding, (yP + this.translate.y) * this.scale, cur, (this.canvas.height) * (1 / this.elementary));
                        padding += cur;
                    }
                    else {
                        padding += cur;
                    }
                }
            }
            ctx.fill();
        }
    }
    drawNums() {
        let xAxisNums = this.xAxisNums;
        let yAxisNums = this.yAxisNums;
        let ctx = this.numberCtx;
        ctx.font = `${config.fontSize}px Arial`;
        for (var i = 0; i < xAxisNums.length; i++) {
            let val = xAxisNums[i][0] / this.coordinatesScale.x;
            if (Math.abs(val) >= 10000) {
                val = Math.floor(val).toExponential();
            }
            else {
                val = Math.floor(val * -10e8) / 10e8;
            }
            let yL = this.translate.y * this.scale + config.fontSize;
            if (yL < config.fontSize) {
                yL = config.fontSize;
                ctx.fillStyle = "#808080";
            }
            else if (yL > (this.canvas.height)) {
                yL = this.canvas.height;
                ctx.fillStyle = "#808080";
            }
            else {
                ctx.fillStyle = "#808080";
            }
            ctx.fillText((val).toString(), xAxisNums[i][1], yL);
        }
        for (var i = 0; i < yAxisNums.length; i++) {
            let val = yAxisNums[i][0] / this.coordinatesScale.y;
            if (Math.abs(val) >= 10000) {
                val = Math.floor(val).toExponential();
            }
            else {
                val = Math.floor(val * 10e8) / 10e8;
            }
            let textWidth = ctx.measureText(val).width;
            let xL = this.translate.x * this.scale - textWidth - 5;
            if (xL < config.fontSize) {
                xL = 0;
                ctx.fillStyle = "#808080";
            }
            else if (xL > (this.canvas.width - textWidth)) {
                xL = this.canvas.width - textWidth;
                ctx.fillStyle = "#808080";
            }
            else {
                ctx.stroke();
                ctx.fillStyle = "#808080";
            }
            // if (val === 0) {
            //     continue;
            // }
            ctx.fillText(val.toString(), xL, yAxisNums[i][1]);
        }
    }
    drawGrid() {
        let ctx = this.numberCtx;
        let lineWidth = ctx.lineWidth;
        this.xAxisNums = [];
        this.yAxisNums = [];
        ctx.beginPath();
        ctx.moveTo(this.translate.x * this.scale, 0);
        ctx.lineTo(this.translate.x * this.scale, this.canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, this.translate.y * this.scale);
        ctx.lineTo(this.canvas.width, this.translate.y * this.scale);
        ctx.stroke();
        ctx.save();
        let distance = 100;
        let itersX = this.canvas.width * (this.scale) / (distance) + 1;
        distance = (this.canvas.width / (Math.floor(3 + itersX % 3))) / this.scale;
        let temp = Math.pow(10, Math.floor(Math.log10(distance)));
        distance = Math.floor(distance / Math.pow(10, Math.floor(Math.log10(distance))));
        // if (!distance) {
        //     distance = 1;
        // }
        distance = distance * temp;
        let distanceHelper = distance;
        distance = distance * this.scale;
        itersX = this.canvas.width / (distance) + 1;
        let iniX = this.translate.x * this.scale - Math.floor((this.translate.x * this.scale) / distance) * distance - distance;
        let iniXHelper = (-Math.floor((this.translate.x) / distanceHelper) * (distanceHelper)) - distanceHelper;
        for (var i = 0; i <= itersX; i++) {
            let xCoord = (this.canvas.width / this.scale) * (i / itersX);
            let x = (-iniXHelper);
            for (var j = 1; j < 4; j++) {
                ctx.strokeStyle = '#B2BEB5';
                ctx.lineWidth = lineWidth / 6;
                ctx.beginPath();
                ctx.moveTo(iniX + (distance / 4) * j, 0);
                ctx.lineTo(iniX + (distance / 4) * j, this.canvas.height);
                ctx.stroke();
            }
            ctx.strokeStyle = '#808080';
            ctx.lineWidth = lineWidth / 2;
            ctx.beginPath();
            ctx.moveTo(iniX, 0);
            ctx.lineTo(iniX, this.canvas.height);
            ctx.stroke();
            this.xAxisNums.push([x, iniX]);
            iniX += distance;
            iniXHelper += distanceHelper;
        }
        let itersY = this.canvas.height / (distance) + 1;
        let iniY = this.translate.y * this.scale - Math.floor((this.translate.y * this.scale) / distance) * distance - distance;
        let iniYHelper = (-Math.floor((this.translate.y) / distanceHelper) * (distanceHelper)) - distanceHelper;
        for (var i = 0; i <= itersY; i++) {
            let y = (-iniYHelper);
            ctx.beginPath();
            for (var j = 1; j < 4; j++) {
                ctx.strokeStyle = '#B2BEB5';
                ctx.lineWidth = lineWidth / 6;
                ctx.moveTo(0, iniY + (distance / 4) * j);
                ctx.lineTo(this.canvas.width, iniY + (distance / 4) * j);
            }
            ctx.stroke();
            ctx.strokeStyle = '#808080';
            ctx.lineWidth = lineWidth / 2;
            ctx.beginPath();
            ctx.moveTo(0, iniY);
            ctx.lineTo(this.canvas.width, iniY);
            ctx.stroke();
            this.yAxisNums.push([y, iniY]);
            iniY += distance;
            iniYHelper += distanceHelper;
        }
        ctx.restore();
    }
    updateInterCanvas() {
        const currentCoordsTopLeft = this.canvasToGraphCoords(0, 0);
        const currentCoordsBotRight = this.canvasToGraphCoords(this.canvas.width, this.canvas.height);
        this.bifurConfig.translate.start = currentCoordsTopLeft;
        this.bifurConfig.translate.end = currentCoordsBotRight;
        this.bifurHelperCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.bifurHelperCtx.drawImage(this.canvas, 0, 0);
        for (const ext of this.extensions) {
            ext.doubleBufferCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ext.doubleBufferCtx.drawImage(ext.canvas, 0, 0);
        }
    }
    down(x, y, ctrlKey) {
        this.updateInterCanvas();
        this.drag.ini.x = x;
        this.drag.ini.y = y;
        this.translate.iniX = this.translate.x;
        this.translate.iniY = this.translate.y;
        this.drag.check = 1;
        this.currentInitial.x = (this.translate.x + ((x - this.translate.x) / (this.scale) - this.translate.x) * (this.scale)) / (this.scale);
        this.currentInitial.y = (-this.translate.y - ((y - this.translate.y) / (this.scale) - this.translate.y) * (this.scale)) / (this.scale);
    }
    up(x, y) {
        this.drag.check = 0;
        this.redraw();
    }
    move(x, y) {
        // this.currentCoords.x = (this.translate.x + ((x - this.translate.x) / (this.scale) - this.translate.x) * (this.scale)) / (this.scale);
        // this.currentCoords.y = (-this.translate.y - ((y - this.translate.y) / (this.scale) - this.translate.y) * (this.scale)) / (this.scale);
        if (this.drag.check) {
            this.translate.x = this.translate.iniX - (this.drag.ini.x - x) / this.scale;
            this.translate.y = this.translate.iniY - (this.drag.ini.y - y) / this.scale;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            const start = this.bifurConfig.translate.start;
            const newCoords = this.graphToCanvasCoords(start[0], start[1]);
            for (const ext of this.extensions) {
                ext.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                ext.ctx.drawImage(ext.doubleBufferCanvas, newCoords[0], newCoords[1]);
            }
            this.ctx.drawImage(this.bifurHelper, newCoords[0], newCoords[1]);
            this.bifurConfig.inUse = true;
            this.drawGridAndNums();
        }
        // console.log(x, y);
        // this.updateCoords();
    }
    updateCoords() {
        this.ctx.font = `${15}px Arial`;
        this.ctx.fillStyle = "";
        let coords = `(${this.currentCoords.x} , ${this.currentCoords.y})`;
        let coordsSize = this.ctx.measureText(coords).width;
        this.coordsSize = coordsSize;
    }
    mouseWheelEvent(event, self) {
        event.preventDefault();
        let x = (-self.translate.x - ((event.offsetX - self.translate.x) / (self.scale) - self.translate.x) * (self.scale)) / (self.scale);
        let y = (-self.translate.y - ((event.offsetY - self.translate.y) / (self.scale) - self.translate.y) * (self.scale)) / (self.scale);
        if (event.deltaY < -1) {
            if (self.scale <= 1) {
                self.scaleUp(self.scale / 10, self, event.offsetX, event.offsetY);
            }
            else {
                self.scaleUp(Math.max(0.1, Math.pow(self.scale, 0.8)), self, event.offsetX, event.offsetY);
            }
        }
        else if (event.deltaY > 1) {
            if (self.scale <= 1) {
                self.scaleUp(-self.scale / 10, self, event.offsetX, event.offsetY);
            }
            else {
                self.scaleUp(Math.min(-0.1, -Math.pow(self.scale, 0.8)), self, event.offsetX, event.offsetY);
            }
        }
    }
    xFunc(t, func) {
        return func(t);
    }
    yFunc(t, func) {
        return func(t);
    }
}
