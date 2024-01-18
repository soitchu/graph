import { GraphExtension } from "../../../utils/GraphExtension.js";
import { GraphWindow } from "../../../utils/GraphWindow.js";

export class XLineExtension extends GraphExtension {
    workers: Array<Worker> = Array(navigator.hardwareConcurrency);
    currentResponses: number = 0;
    responseId: number = 0;
    sharedMemory: SharedArrayBuffer;
    config: ExtensionConfig[];
    usesOnlyX = false;
    redrawResolve: Function;
    currentImageData: ImageData;

    constructor(window: GraphWindow, workerURL: string, config: ExtensionConfig[], usesOnlyX = false) {
        super(window);

        const height = window.graphInstance.canvas.height;
        const width = window.graphInstance.canvas.width;
        const self = this;

        this.sharedMemory = new SharedArrayBuffer(width * 4 * 8);
        this.usesOnlyX = usesOnlyX;
        this.config = config;
        this.currentImageData = this.ctx.getImageData(0, 0, width, height);

        for (let i = 0; i < this.workers.length; i++) {
            if (!(this.workers[i] instanceof Worker)) {
                this.workers[i] = new Worker(workerURL);
            }
        }

        for (let i = 0; i < this.workers.length; i++) {
            this.workers[i].onmessage = function (event: MessageEvent) {
                const data = event.data;

                if (data == self.responseId) {
                    self.currentResponses++;

                    if (self.currentResponses == self.workers.length) {
                        self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
                        const lineData = new Float64Array(self.sharedMemory);
                        // console.log(lineData);

                        self.ctx.beginPath();
                        self.ctx.strokeStyle = "white";

                        for (let j = 0; j < lineData.length; j += 4) {
                            if(lineData[j] === lineData[j + 2]){
                                continue;
                            }
                            
                            self.ctx.moveTo(
                                lineData[j + 0],
                                lineData[j + 1]
                            );

                            self.ctx.lineTo(
                                lineData[j + 2],
                                lineData[j + 3]
                            );
                        }

                        self.ctx.stroke();
                        self.redrawResolve();
                    }
                }
            };
        }
    }

    async resizeCallback(width: number, height: number) {
        this.currentImageData = this.ctx.getImageData(0, 0, width, height);
        this.sharedMemory = new SharedArrayBuffer(width * 8 * 4);
    }

    async redraw(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.redrawResolve = resolve;
            this.currentResponses = 0;
            this.responseId++;

            const graph = this.window.graphInstance;
            const canvasWidth = this.canvas.width;
            const canvasHeight = this.canvas.height;

            if (this.usesOnlyX) {
                // Takes about 0.1ms - 0.2ms, but there's probably a
                // better way to do this, since the GC will have to
                // take care of it
                this.sharedMemory = new SharedArrayBuffer(this.canvas.width * 4 * 8);
            }

            const sharedMemory = this.sharedMemory;

            const xStart = -graph.translate.x + (graph.canvas.width / graph.scale) * (0 / graph.elementary);
            const xFin = -graph.translate.x + (graph.canvas.width / graph.scale);

            const yStart = -graph.translate.y + (graph.canvas.height / graph.scale) * (0 / graph.elementary);
            const yFin = -graph.translate.y + (graph.canvas.height / graph.scale);

            const xIndex = canvasWidth / this.workers.length;

            for (var i = 0; i < this.workers.length; i++) {
                this.workers[i].postMessage(
                    {
                        config: this.config,
                        responseId: this.responseId,
                        sharedMemory,
                        height: canvasHeight,
                        width: canvasWidth,
                        onlyX: this.usesOnlyX,
                        translate: this.window.graphInstance.translate,
                        scale: this.window.graphInstance.scale,
                        x: {
                            xIndexStart: Math.floor(xIndex * i),
                            start: Math.floor(i / this.workers.length * canvasWidth),
                            end: Math.floor((i + 1) / this.workers.length * canvasWidth),
                            step: (graph.canvas.width / graph.scale) * (1 / graph.elementary)
                        },
                        y: {
                            end: -yFin,
                            start: -yStart,
                            step: (canvasHeight / graph.scale) * (1 / canvasHeight)
                        }
                    } as XYWorkerPayload
                );
            }
        });
    }
}