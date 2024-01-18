import { GraphWindow } from "../../../utils/GraphWindow";

export class WebglExtension {
    window: GraphWindow;


    canvas = document.createElement("canvas");
    ctx = this.canvas.getContext("2d", {
        willReadFrequently: true
    });

    doubleBufferCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
    doubleBufferCtx = this.doubleBufferCanvas.getContext("2d", {
        willReadFrequently: true
    });


    webGLCanvas = new OffscreenCanvas(this.canvas.width, this.canvas.height);
    webGLCtx = this.webGLCanvas.getContext("webgl2", {
        willReadFrequently: true,
        premultipliedAlpha: false
    }) as WebGL2RenderingContext;

    constructor(window: GraphWindow) {
        this.window = window;
        this.initialize();
        this.resize(window.graphInstance.canvas.width, window.graphInstance.canvas.height);
    }

    createShader(glsl: string, type: number) {
        const r = this.webGLCtx.createShader(type);
        const ctx = this.webGLCtx;

        if (
            ctx.shaderSource(r, glsl),
            ctx.compileShader(r),
            ctx.getShaderParameter(r, ctx.COMPILE_STATUS)
        ) {
            return r;
        }

        console.log(ctx.getShaderInfoLog(r)), ctx.deleteShader(r);
    }


    something(e, t, n, r, i) {
        let s = e.getUniformLocation(t, r);
        "1f" === n
            ? e.uniform1f(s, i)
            : "2f" === n
                ? e.uniform2f(s, i[0], i[1])
                : "3f" === n && e.uniform3f(s, i[0], i[1], i[2]);
    }

    draw() {
        const t = this.webGLCtx.TRIANGLES;
        this.webGLCtx.drawArrays(t, 0, 6);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(
            this.webGLCanvas,
            0,
            0
        );
    }

    async initialiseShader() {
        const vertex = await (await fetch("./extensions/Templates/Webgl/vertex_shader.vert")).text();
        const fragment = await (await fetch("./extensions/Templates/Webgl/fragment_shader.frag")).text();

        const n = this.createShader(vertex, this.webGLCtx.VERTEX_SHADER),
            r = this.createShader(fragment, this.webGLCtx.FRAGMENT_SHADER);

        let e;
        const g = this.webGLCtx;
        const d = this.webGLCanvas;

        try {
            e = (function (e, t, n) {
                let r = e.createProgram();
                try {
                    e.attachShader(r, t), e.attachShader(r, n);
                } catch (e) {
                    throw "Didn't compile!";
                }
                if ((e.linkProgram(r), e.getProgramParameter(r, e.LINK_STATUS)))
                    return r;
                e.deleteProgram(r);
            })(this.webGLCtx, n, r);
        } catch (e) {
            throw "Didn't compile!";
        }

        let i = this.webGLCtx.getAttribLocation(e, "a_position"),
            s = this.webGLCtx.createBuffer();

        g.bindBuffer(g.ARRAY_BUFFER, s),
            g.bufferData(
                g.ARRAY_BUFFER,
                new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
                g.STATIC_DRAW,
            );
        let a = g.createVertexArray();
        g.bindVertexArray(a), g.enableVertexAttribArray(i);
        let o = g.FLOAT;

        const clientCanvas = this.canvas;
        
        g.vertexAttribPointer(i, 2, o, !1, 0, 0),
            (function (e, temp) {
                const t = temp.clientWidth,
                    n = temp.clientHeight;

                console.log(t, n);
                (e.width !== t || e.height !== n) && ((e.width = t), (e.height = n));
            })(d, clientCanvas),
            g.viewport(0, 0, g.canvas.width, g.canvas.height),
            g.clearColor(0, 0, 0, 0),
            g.clear(g.COLOR_BUFFER_BIT),
            g.useProgram(e),
            g.bindVertexArray(a);
        let c = g.getParameter(g.CURRENT_PROGRAM);
        this.something(g, c, "1f", "width", g.canvas.width);
        this.something(g, c, "1f", "height", g.canvas.height);
        this.draw();
    }

    resize(width: number, height: number) {
        this.webGLCanvas.width = width;
        this.webGLCanvas.height = height;

        this.doubleBufferCanvas.width = width;
        this.doubleBufferCanvas.height = height;

        this.canvas.width = width;
        this.canvas.height = height;

        this.ctx.imageSmoothingEnabled = false;
        this.initialiseShader();
        this.resizeCallback(width, height);
    }

    initialize() {
        this.window.graphWindow.body.append(this.canvas);
        this.canvas.className = "graphCanvas";
    }

    resizeCallback(width: number, height: number) { }

    redraw() {
        this.webGLCtx.deleteProgram(void 0);
        let t = this.webGLCtx;
        let n = t.getParameter(t.CURRENT_PROGRAM);
        n && this.something(t, n, "3f", "mousepos", [
            this.window.graphInstance.translate.x,
            -this.window.graphInstance.translate.y,
            this.window.graphInstance.scale
        ]);

        this.draw();
    }

    // abstract redraw(): Promise<void>;
    // abstract resizeCallback(width: number, height: number): Promise<void>;
}