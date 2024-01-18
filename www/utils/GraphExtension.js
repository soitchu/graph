export class GraphExtension {
    constructor(window) {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d", {
            willReadFrequently: true
        });
        this.doubleBufferCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
        this.doubleBufferCtx = this.doubleBufferCanvas.getContext("2d", {
            willReadFrequently: true
        });
        this.window = window;
        this.initialize();
        this.resize(window.graphInstance.canvas.width, window.graphInstance.canvas.height);
    }
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.doubleBufferCanvas.width = width;
        this.doubleBufferCanvas.height = height;
        this.ctx.imageSmoothingEnabled = false;
        this.resizeCallback(width, height);
    }
    initialize() {
        this.window.graphWindow.body.append(this.canvas);
        this.canvas.className = "graphCanvas";
    }
}
