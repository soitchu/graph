export abstract class GraphExtension {
    window: GraphWindow;
    canvas = document.createElement("canvas");
    ctx = this.canvas.getContext("2d", {
        willReadFrequently: true
    });

    doubleBufferCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
    doubleBufferCtx = this.doubleBufferCanvas.getContext("2d", {
        willReadFrequently: true
    });

    constructor(window: GraphWindow) {
        this.window = window;
        this.initialize();
        this.resize(window.graphInstance.canvas.width, window.graphInstance.canvas.height);
    }

    resize(width: number, height: number) {
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

    abstract redraw(): Promise<void>;
    abstract resizeCallback(width: number, height: number): Promise<void>;
}