import { BifurcationExtension, config } from "./extensions/Bifurcation/BifurcationExtension.js";
import { LyapunovExtension } from "./extensions/Lyapunov/LyapunovExtension.js";
import { Graph } from "./utils/Graph.js";
import { GraphWindow } from "./utils/GraphWindow.js";
import { XYExtension } from "./extensions/Templates/XY/XYExtension.js"
import { XLineExtension } from "./extensions/Templates/XLine/XLineExtension.js";
import { WebglExtension } from "./extensions/Templates/Webgl/WebglExtension.js";

window["config"] = config;

var canvas = document.getElementById("canvas") as HTMLCanvasElement;
// @ts-ignore
const stats = new Stats();
// @ts-ignore
const gui = new dat.gui.GUI();

gui.add(config, "theta1", 0, 1).step(0.1).onFinishChange((value: number) => {
    thetaChanged();
    graphInstance2.redraw();
    graphInstance4.redraw();
}).onChange(() => {
    drawModel(true);
});

gui.add(config, "theta2", 0, 1).step(0.1).onFinishChange((value: number) => {
    thetaChanged();
    graphInstance2.redraw();
    graphInstance4.redraw();
}).onChange(() => {
    drawModel(true);
});;



let xScaling2 = 1;
xScaling2 = 50;

// stats.showPanel(1); 
// document.body.appendChild(stats.dom);

let modelCoords2 = [];
let graphInstance = new Graph(canvas, 1000, 1000, false, { x: xScaling2, y: 1 });
window["iter"] = 10000;
let graphInstance2 = new Graph(document.getElementById("canvas2") as HTMLCanvasElement, 1000, 1000, false, { x: 1, y: 1 });
let graphInstance3 = new Graph(document.getElementById("canvas3") as HTMLCanvasElement, 1000, 1000);
let graphInstance4 = new Graph(document.getElementById("canvas4") as HTMLCanvasElement, 1000, 1000, true);
let K = 3;
let nIni = 0;
let pIni = 0;
let modelCoords = [];

graphInstance2.currentInitial = { x: 2148.6024629686876, y: 5661.271679662689 };
graphInstance.currentInitial = { x: 0.004141918184170113, y: 0.0018361686569219535 };


// graphInstance2.addGraph({
//     type: "drawGraphLyapunov"
// })


function thetaChanged() {
    let c = (1 - (1 - config.theta1) * (1 - config.theta2)) / (config.theta1 * config.theta2);
    let a = (-(2 + 4 * c) - Math.sqrt(Math.pow((2 + 4 * c), 2) - 4)) / 2;
    let b = (-(2 + 4 * c) + Math.sqrt(Math.pow((2 + 4 * c), 2) - 4)) / 2;

    console.log(a, b);
    graphInstance2.toDrawY = [];
    graphInstance2.toDrawX = [];

    if (config.drawBoundaries) {
        graphInstance2.addGraph({
            type: "drawGraphY",
            xFunc: (x) => -(a),
            yFunc: (y) => y,
            constraintsX: () => true,
            constraintsY: () => true
        });

        graphInstance2.addGraph({
            type: "drawGraphY",
            xFunc: (x) => -(b),
            yFunc: (y) => y,
            constraintsX: () => true,
            constraintsY: () => true
        });
    }

    if (config.drawLyapunov) {
        graphInstance2.addGraph({
            type: "drawGraphX",
            xFunc: (x) => x,
            yFunc: (y) => -(b) * y,
            constraintsX: () => true,
            constraintsY: () => true
        });

        graphInstance2.addGraph({
            type: "drawGraphX",
            xFunc: (x) => x,
            yFunc: (y) => -(a) * y,
            constraintsX: () => true,
            constraintsY: () => true
        });

        graphInstance2.drawGraphLyapunov();
    }

}

var download = function (graphInstance, name) {
    var link = document.createElement('a');
    link.download = name + '.png';
    link.href = graphInstance.canvas.toDataURL()
    link.click();
}

let imageCount = 0;
function padding(id: string | number) {
    const idString = id.toString();
    for (let i = 0; i < (4 - idString.length); i++) {
        id = "0" + id;
    }
    return id;
}

function quarterRoot(num: number) {
    return Math.sqrt(Math.sqrt(num));
}

function square(num) {
    return num * num;
}

function drawModel(shouldDraw = true, shouldDownload = true) {
    if (shouldDraw) {
        graphInstance.toDrawCirles = [];
    }
    modelCoords = [];

    let c1 = config.chaoticAttractor.cVals.x; // n0
    let c2 = config.chaoticAttractor.cVals.y; // p0

    // nIni = config.chaoticAttractor.initialVals.x;
    // pIni = config.chaoticAttractor.initialVals.y;

    nIni = square(c2) / square(square(c1 + c2)) + 10e-10;
    pIni = square(c1) / square(square(c1 + c2)) + 10e-10;

    // console.log(Math.pow(c1, -2), Math.pow(c2, -2))

    const n = (nt: number, pt: number) => {
        return (1 - config.theta1) * nt + config.theta1 * Math.pow(quarterRoot(pt / Math.pow(c1, 2)) - Math.sqrt(pt), 2);
    };

    const p = (nt: number, pt: number) => {
        return (1 - config.theta2) * pt + config.theta2 * Math.pow(quarterRoot(nt / Math.pow(c2, 2)) - Math.sqrt(nt), 2);
    };

    let nLast = nIni; // n0
    let pLast = pIni; // p0
    for (let i = 0; i < config.chaoticAttractor.endModel; i++) {
        let nTemp = n(nLast, pLast);
        let pTemp = p(nLast, pLast);

        if (i >= config.chaoticAttractor.startModel && shouldDraw) {
            modelCoords.push({ "x": nTemp, "y": pTemp });

            graphInstance.addGraph({
                type: "drawCircle",
                coords: {
                    x: nLast * xScaling2,
                    y: pLast
                },
                radius: 2
            });
        }

        nLast = nTemp;
        pLast = pTemp;
    }

    if (shouldDraw) {
        graphInstance.redraw();
    }
}

function sleep(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
async function start() {
    config.chaoticAttractor.cVals.x = config.animation.start;

    while (true) {
        if (config.chaoticAttractor.cVals.x < config.animation.end) {
            config.chaoticAttractor.cVals.x += config.animation.step;
            drawModel(true);
        } else {
            break;
        }

        await sleep(0);
    }
}

window["draw"] = true;
graphInstance2.redraw();

function clone() {
    graphInstance.scaleAnchor = { x: 454, y: 427 };
    for (var i = 0; i < 30; i++) {
        var can = document.createElement("canvas");
        can.height = graphInstance.canvas.height;
        can.width = graphInstance.canvas.width;
        const canCtx = can.getContext('2d');
        canCtx.drawImage(graphInstance.canvas, 0, 0);
        document.body.append(can);
        graphInstance.scaleUp(graphInstance.scale * 1.1, graphInstance, graphInstance.scaleAnchor.x, graphInstance.scaleAnchor.y);

    }

}
const gw = new GraphWindow({
    height: window.innerHeight / 2,
    width: window.innerWidth / 2,
    x: 0,
    y: 0
}, graphInstance2, "Bifurcation - x");

new GraphWindow({
    height: window.innerHeight / 2,
    width: window.innerWidth / 2,
    x: 0,
    y: window.innerHeight / 2
}, graphInstance4, "Bifurcation - y");

new GraphWindow({
    height: window.innerHeight,
    width: window.innerWidth / 2,
    x: window.innerWidth / 2,
    y: 0
}, graphInstance, "Chaotic attractor");

const animationFolder = gui.addFolder("Animation");
animationFolder.add(config.animation, "start", 0, 20);
animationFolder.add(config.animation, "end", 0, 20);
animationFolder.add(config.animation, "step", 0, 1).step(10e-8);
animationFolder.add(config.animation, "ini");

function smol() {
    xScaling = 10;
    xScaling2 = 0.04;
}

graphInstance2.toDrawLyapunov = [{
    type: "drawGraphLyapunov"
}];

graphInstance2.addGraph({
    type: "drawCircle",
    coords: {
        x: 1,
        y: 0
    },
    radius: 1
});


graphInstance2.addGraph({
    type: "drawCircle",
    coords: {
        x: -0.5,
        y: Math.sqrt(3) / 2
    },
    radius: 1
});


graphInstance2.addGraph({
    type: "drawCircle",
    coords: {
        x: -0.5,
        y: -Math.sqrt(3) / 2
    },
    radius: 1
});

const lyapConfig = [{
    MAX_ITERATION: 30
}];


console.log(window.temp0 = graphInstance2);

// const w = new WebglExtension(gw);
// w.initialiseShader();

const lyapExt = new LyapunovExtension(gw, "", lyapConfig);
graphInstance2.addExtension(
    lyapExt
);
console.log(window.temp1 = lyapExt);
console.log(window.temp2 = lyapConfig);


// graphInstance2.addExtension(
//     w
// );

graphInstance2.addExtension(
    new XYExtension(gw, "./extensions/Templates/XY/worker.js", [], true)
);
const lineExtension = new XLineExtension(gw, "./extensions/Templates/XLine/worker.js", [], true);

graphInstance2.addExtension(lineExtension);
console.log(lyapExt);

const chaoticFolder = gui.addFolder("Model");

chaoticFolder.add(config, "drawLyapunov").onFinishChange((val: boolean) => {
    if (val) {
        graphInstance2.toDrawLyapunov = [{
            type: "drawGraphLyapunov"
        }];

    } else {
        graphInstance2.toDrawLyapunov = [];
    }

    thetaChanged();
});

chaoticFolder.add(config, "drawBoundaries").onFinishChange((val: boolean) => {
    thetaChanged();
});


chaoticFolder.add(config.chaoticAttractor, "startModel", 0, 100000).onFinishChange((val: number) => {
    drawModel(true);
});

chaoticFolder.add(config.chaoticAttractor, "endModel", 0, 100000).onFinishChange((val: number) => {
    drawModel(true);
    graphInstance2.redraw();
    graphInstance4.redraw();
});

chaoticFolder.add(config.chaoticAttractor, "drawLyapLines").onFinishChange((val: number) => {
    drawModel(true);
    graphInstance2.redraw();
    graphInstance4.redraw();
});

chaoticFolder.add(config.chaoticAttractor.initialVals, "x").name("Initial X").onFinishChange((val: number) => {
    drawModel(true);
    graphInstance2.redraw();
    graphInstance4.redraw();
}).listen();

chaoticFolder.add(config.chaoticAttractor.initialVals, "y").name("Initial Y").onFinishChange((val: number) => {
    drawModel(true);
    graphInstance2.redraw();
    graphInstance4.redraw();
}).listen();

chaoticFolder.add(config.chaoticAttractor.cVals, "x").name("C1").step(0.00001).onFinishChange((val: number) => {
    drawModel(true);
    graphInstance2.redraw();
    graphInstance4.redraw();
}).listen();

chaoticFolder.add(config.chaoticAttractor.cVals, "y").name("C2").step(0.00001).onFinishChange((val: number) => {
    drawModel(true);
    graphInstance2.redraw();
    graphInstance4.redraw();
}).listen();

chaoticFolder.add(window, "smol");

// const bifurcationFolder = gui.addFolder("Bifurcation");
// bifurcationFolder.add(config.bifurcation, "iterations", 0, 100000);

// 30033

// 1 .8
// .5 .5
// 1  .4
// .7 .7