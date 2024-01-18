let config = {
    theta1: 1,
    theta2: 0.8,
    animation: {
        start: 0,
        end: 0,
        ini: 0
    },
    fontSize: 12,
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
        }
    },
};

function quarterRoot(num) {
    return Math.sqrt(Math.sqrt(num));
}

class lyapunovExponent {
    constructor() {
        // this.f = (x,y,a,b) => 1 + y - a*x*x;
        // this.g = (x,y,a,b) => b*x;
        // this.uf = (x,y,u,v,a,b) => -2*a*x*u + v;
        // this.vg = (x,y,u,v,a,b) => b*u;


        this.f = (x, y, c1, c2) => ((1 - config.theta1) * x + config.theta1 * Math.pow((quarterRoot(y / Math.pow(c1, 2)) - Math.sqrt(y)), 2));
        this.g = (x, y, c1, c2) => ((1 - config.theta2) * y + config.theta2 * Math.pow((quarterRoot(x / Math.pow(c2, 2)) - Math.sqrt(x)), 2));

        this.uf = (x, y, u, v, c1, c2) => (1 - config.theta1) * u + config.theta1 * ((-3 * Math.sqrt(y) * quarterRoot(y / Math.pow(c1, 2)) + Math.pow(y / Math.pow(c1, 2), 1 / 2) + 2 * y) / (2 * y)) * v;
        this.vg = (x, y, u, v, c1, c2) => (1 - config.theta2) * v + config.theta2 * ((-3 * Math.sqrt(x) * quarterRoot(x / Math.pow(c2, 2)) + Math.pow(x / Math.pow(c2, 2), 1 / 2) + 2 * x) / (2 * x)) * u;

        // this.f = (x,a,b,result) => Math.sqrt(x/a) - x;
        // this.g = (x,a,b,result) => Math.sqrt(x/b) - x;
        // this.uf = (x,a,b,result) => (1/2)*(Math.sqrt(1/(a*x))) - 1;
        // this.vg = (x,a,b,result) => (1/2)*(Math.sqrt(1/(b*x))) - 1;


        // this.g = (x,y,a,b) => (1 - config.theta1)*x + config.theta1*Math.pow(Math.pow(y/Math.pow(a,2),(1/4)) - Math.sqrt(y), 2);
        // this.f = (x,y,a,b) => (1 - config.theta2)*y + config.theta2*Math.pow(Math.pow(x/Math.pow(b,2),(1/4)) - Math.sqrt(x), 2);
        // this.uf = (x,y,u,v,a,b) => 0*u + ((1/2)*Math.sqrt(1/(b*y)) - 1)*v;
        // this.vg = (x,y,u,v,a,b) => 0*v + ((1/2)*Math.sqrt(1/(a*x)) - 1)*u;



    }

    lyapunovExponentFx(a, b, self) {
        if (a > 1 || a < 0 || b > 1 || b < 0) {
            return - 1;
        }
        let K = 2000;
        let x = config.chaoticAttractor.initialVals.x;
        let y = config.chaoticAttractor.initialVals.y;

        let u = 0.5;
        let v = 0.5;

        let lastU = u;
        let lastV = v;
        // console.log("Start");
        for (var i = 1; i <= K; i++) {
            let x1 = x;
            let y1 = y;
            let u1 = u;
            let v1 = v;
            x = this.f(x1, y1, a, b);
            y = this.g(x1, y1, a, b);
            u = this.uf(x1, y1, u1, v1, a, b);
            v = this.vg(x1, y1, u1, v1, a, b);

            if ((!isFinite(u) || !isFinite(v)) && !isNaN(u) && !isNaN(v)) {
                u = lastU;
                v = lastV;
                break;
            }

            lastU = u;
            lastV = v;

        }
        // console.log("End");


        // console.log(u,v,a,b);
        let val = (Math.log(Math.abs(u) + Math.abs(v)) / K);
        // console.log("here", Math.abs(u) + Math.abs(v), K);
        if (isNaN(val)) {
            return -1;
        } else {
            return val > 0 ? 1 : 0;
        }

    }


    mean(result) {
        let sum = 0;
        for (var i = 0; i < result.length; i++) {
            sum += result[i];

        }

        return (sum / result.length);
    }

    logdFdx(x, a, b, result, dfx, self) {
        return Math.log(Math.abs(dfx(x, a, b, result)));
    }

}

var theta1 = 0;
var theta2 = 1;
var checkFirst = true;
let l = new lyapunovExponent();


function reverse(array) {
    return [...array].reverse();
}

function JSC(coeff) {
    const rows = [];
    let val = Math.pow(coeff[1], 2) - 4 * coeff[0] * coeff[2];

    // if(val < 0){
    //   return -1;
    // }
    rows.push(
        coeff,
        reverse(coeff)
    );


    for (i = 2; ; i += 2) {
        let row = [];
        let mult = rows[i - 2][rows[i - 2].length - 1] / rows[i - 2][0]; // This is an/a0 as mentioned in the article.

        for (j = 0; j < rows[i - 2].length - 1; j++) {
            // Take the last 2 rows and compute the next row
            row.push(rows[i - 2][j] - rows[i - 1][j] * mult);
        }

        rows.push(row);
        rows.push(reverse(row));
        if (row.length == 1) break;
    }

    // Check is done using
    for (i = 0; i < rows.length; i += 2) {
        if (rows[i][0] <= 0) break;
    }
    //  return ;
    if (i == rows.length) {

        return true; // stable
    }
    else {
        return false; // unstable
    }

}

function float2(x, y) {
    return [x, y];
}

const roots = [
    float2(1, 0),
    float2(-0.5, Math.sqrt(3) / 2),
    float2(-0.5, -Math.sqrt(3) / 2)
];


function cdiv(z1, z2) {
    const x = z1[0], y = z1[1], a = z2[0], b = z2[1];
    return [
        (a * x + b * y) / (a * a + b * b),
        (a * y - b * x) / (a * a + b * b)
    ]
}

function func(z) {
    return cdif(cmul(cmul(z, z), z), float2(1, 0));
}

function cmul(z1, z2) {
    const a = z1[0], b = z1[1], c = z2[0], d = z2[1];

    return [
        a * c - b * d,
        a * d + b * c
    ]
}

function cadd(z1, z2) {
    const a = z1[0], b = z1[1], c = z2[0], d = z2[1];

    return [
        a + c,
        b + d
    ]
}

function cdif(z1, z2) {
    const a = z1[0], b = z1[1], c = z2[0], d = z2[1];

    return [
        a - c,
        b - d
    ]
}

function Derivative(z) {
    return cmul([3, 0], cmul(z, z));
}

// const colors = [
//     -1,
//     0,
//     1
// ]

// Array [ 3.45173400261614, 9.299443800448756 ]

// [ 1.4341015197115885, 7.2282970509726 ]
let logged = false;
const differences = [];

let MAX_ITERATION = 100;

function mandelbrot(c) {
    let z = [0, 0], n = 0, p, d;

    do {
        p = [
            Math.pow(z[0], 2) - Math.pow(z[1], 2),
            2 * z[0] * z[1]
        ];

        z = [
            p[0] + c[0],
            p[1] + c[1]
        ];

        d = Math.hypot(z[0], z[1]);
        n += 1
    } while (d <= 2 && n < MAX_ITERATION)

    return [d <= 2 ? 0 : 1, n];
}

function cal(x, y) {

    // return x > y ? [0, 500] : [1, 500];
    return mandelbrot([
        x,
        y
    ]);
    // return [l.lyapunovExponentFx(x, y, l), MAX_ITERATION / 2];
    // return [1, wasmInstance.exports.mandelbrot(x,y)];
}

function cal(x, y) {

    let z = [x, y]; //z is originally set to the pixel coordinates
    const maxIteration = 60;
    let iteration = 0;

    for (; iteration < maxIteration; iteration++) {
        // console.log(z)
        const diff = (cdiv(func(z), Derivative(z)));
        if(typeof diff === "number" && isNaN(diff)){
            break;
        }

        z = cdif(z, cdiv(func(z), Derivative(z))); //cdiv is a function for dividing complex numbers
        const tolerance = 0.000001;

        for (let i = 0; i < roots.length; i++) {
            const difference = cdif(z, roots[i]);
            //If the current iteration is close enough to a root, color the pixel.
            if (Math.abs(difference[0]) < tolerance && Math.abs(difference[1]) < tolerance) {
                return [colors[i], iteration];
            }
        }

    }


    return [-2, 0]; //If no solution is found
}


onmessage = function (e) {
    config = e.data[2];
    const canvasImageData = new Uint8Array(e.data[3])
    let c = 0;
    const canvasWidth = e.data[4];
    const canvasHeight = e.data[5];
    const forConfig = e.data[6];
    MAX_ITERATION = config.MAX_ITERATION;

    let xIndex = forConfig.x.xIndexStart;
    // console.log(forConfig, wasmInstance.exports);

    // const start = this.performance.now();
    // const length = wasmInstance.exports.e(
    //     forConfig.x.start,
    //     forConfig.x.end,
    //     forConfig.x.step,
    //     forConfig.y.start,
    //     forConfig.y.end,
    //     forConfig.y.step,
    // );


    // const result = new Uint32Array(wasmInstance.exports.a.buffer, wasmInstance.exports.d(), length);
    let index = 0;

    // console.log(this.performance.now() - start, forConfig);

    for (var i = forConfig.x.start; i < forConfig.x.end; i += forConfig.x.step) {
        let check = true;
        let yIndex = 0;

        for (var j = forConfig.y.start; j > forConfig.y.end; j -= forConfig.y.step) {
            const val = cal(i, j);
            const opacity = 255 * (val[1] / MAX_ITERATION);
            const bool = val[0];

            // const bool = result[index++];
            // const opacity = 255 * (result[index++] / 500);


            const pixelPos = (yIndex * canvasWidth + xIndex) * 4;
            if(pixelPos >= canvasImageData.length){
                continue;
            }

            if (bool === 1) {
                canvasImageData[pixelPos + 0] = 173;
                canvasImageData[pixelPos + 1] = 216;
                canvasImageData[pixelPos + 2] = 230;
                canvasImageData[pixelPos + 3] = opacity;

            } else if (bool === 0) {
                canvasImageData[pixelPos + 0] = 255;
                canvasImageData[pixelPos + 1] = 255;
                canvasImageData[pixelPos + 2] = 143;
                canvasImageData[pixelPos + 3] = opacity;
            } else if (bool === -1) {
                canvasImageData[pixelPos + 0] = 30;
                canvasImageData[pixelPos + 1] = 30;
                canvasImageData[pixelPos + 2] = 255;
                canvasImageData[pixelPos + 3] = opacity;
            }
            yIndex++;
        }
        xIndex++;
    }


    // console.log(`=================`);
    postMessage([null, e.data[1]]);
    // postMessage(([data, e.data[1]]);
}
