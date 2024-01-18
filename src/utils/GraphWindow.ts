import { Graph } from "./Graph.js";

export class GraphWindow {
    graphWindow: any;
    graphInstance: Graph;

    constructor(config: WindowConfig, graphInstance: Graph, title: string) {
        // @ts-ignore
        this.graphWindow = new WinBox(title, config);
        this.graphInstance = graphInstance;

        const graphWindow = this.graphWindow;

        graphWindow.body.append(graphInstance.numberCanvas);
        graphWindow.body.append(graphInstance.canvas);
        graphInstance.numberCanvas.style.position = "absolute";
        graphInstance.numberCanvas.style.top = "0";
        graphInstance.numberCanvas.style.left = "0";
        graphInstance.numberCanvas.style.pointerEvents = "none";
        graphWindow.graph = graphInstance;
        graphWindow.graph.resize(config.width, config.height - graphWindow.h);

        graphWindow.onresize = function (x: number, y: number) {
            clearTimeout(graphWindow.timeout);

            graphWindow.timeout = setTimeout(function () {
                (graphWindow.graph as Graph).resize(x, y - graphWindow.h);
            }, 100);
        }
    }
}
