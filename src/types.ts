type coords = { x: number, y: number };

interface GraphBase {
    xFunc: (x: number) => number,
    yFunc: (y: number) => number,
}

interface GraphXY extends GraphBase {
    type: "drawGraphX" | "drawGraphY",
    constraintsX: (x: number) => boolean,
    constraintsY: (y: number) => boolean,
}

interface GraphIneq {
    type: "drawGraphIneq",
    comparison: (x: number, y: number) => boolean;
}

interface GraphLyapunov {
    type: "drawGraphLyapunov",
}

interface GraphLineInter {
    type: "drawLines",
    from: coords,
    to: coords,
}

interface GraphLine {
    type: "drawLines",
    from: coords,
    to: coords,
    slope: number
}


interface GraphPoint {
    type: "drawCircle",
    coords: coords,
    radius: number
}

interface WindowConfig {
    height: number, 
    width: number,
    x: number,
    y: number
}
type GraphModes = GraphXY | GraphIneq | GraphLineInter | GraphLyapunov | GraphPoint;



// interface Graph {
//     type: "drawGraphX" | "drawGraphY" | "drawGraphIneq" | "drawGraphLyapunov" | "drawLines" | "drawCircle",
// }