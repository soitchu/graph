var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { GraphExtension } from "../../utils/GraphExtension.js";
let xScaling = 0.00025;
let yScaling = 0.0036;
export const config = {
    theta1: 1,
    theta2: 0.6,
    animation: {
        start: 0,
        end: 0,
        step: 0.001,
        ini: () => { }
    },
    drawLyapunov: false,
    drawBoundaries: false,
    fontSize: 20,
    chaoticAttractor: {
        startModel: 10000,
        endModel: 30033,
        initialVals: {
            x: 0.00001,
            y: 0.00001
        },
        cVals: {
            x: 13,
            y: 1
        },
        drawLyapLines: false
    },
};
export class BifurcationExtension extends GraphExtension {
    constructor(window) {
        super(window);
        this.workers = Array(navigator.hardwareConcurrency * 2);
        this.currentResponses = 0;
        this.responseId = 0;
        const height = window.graphInstance.canvas.height;
        const width = window.graphInstance.canvas.width;
        this.sharedMemory = new SharedArrayBuffer(width * height * 4);
        for (let i = 0; i < this.workers.length; i++) {
            if (!(this.workers[i] instanceof Worker)) {
                this.workers[i] = new Worker("./extensions/Bifurcation/worker.js");
            }
        }
    }
    resizeCallback(width, height) {
        return __awaiter(this, void 0, void 0, function* () {
            this.sharedMemory = new SharedArrayBuffer(this.canvas.width * this.canvas.height * 4);
        });
    }
    drawPoint(x, y) {
    }
    redraw() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                var _a;
                const graph = this.window.graphInstance;
                const self = this;
                const canvasWidth = this.canvas.width;
                const canvasHeight = this.canvas.height;
                let x = -graph.translate.x + (graph.canvas.width / graph.scale) * (0 / graph.elementary);
                let xFin = -graph.translate.x + (graph.canvas.width / graph.scale);
                let countRes = 0;
                let workLen = this.workers.length;
                self.currentResponses++;
                const newImageMain = this.ctx.getImageData(0, 0, canvasWidth, canvasHeight);
                // const imageDataLength = imageDataArray.length;
                // Takes about 0.1ms - 0.2ms, but there's probably a
                // better way to do this, since the GC will have to
                // take care of it
                this.sharedMemory = new SharedArrayBuffer(this.canvas.width * this.canvas.height * 4);
                const imageDataArray = this.sharedMemory;
                for (let iu = 0; iu < this.workers.length; iu++) {
                    this.workers[iu].onmessage = function (e) {
                        if (e.data[1] == self.currentResponses) {
                            countRes++;
                            if (countRes == workLen) {
                                newImageMain.data.set(new Uint8Array(imageDataArray));
                                self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
                                self.ctx.putImageData(newImageMain, 0, 0);
                            }
                        }
                    };
                }
                this.responseId++;
                for (var i = 0; i < this.workers.length; i++) {
                    this.workers[i].postMessage([
                        x + (i / this.workers.length) * (xFin - x),
                        x + ((i + 1) / this.workers.length) * (xFin - x),
                        this.responseId,
                        Math.floor(config.chaoticAttractor.endModel),
                        config.theta1,
                        config.theta2,
                        (this.canvas.width / graph.scale) * (1 / graph.elementary),
                        (_a = window["noiseEnd"]) !== null && _a !== void 0 ? _a : 100,
                        config.chaoticAttractor.cVals,
                        config.chaoticAttractor.initialVals,
                        xScaling !== null && xScaling !== void 0 ? xScaling : 1,
                        graph.drawY,
                        yScaling !== null && yScaling !== void 0 ? yScaling : 1,
                        graph.translate,
                        graph.scale,
                        i,
                        imageDataArray,
                        this.canvas.width,
                        this.canvas.height,
                    ]);
                }
            });
        });
    }
}
