import { XYExtension } from "../Templates/XY/XYExtension.js";
export class LyapunovExtension extends XYExtension {
    constructor(window, workerURL, config = [], usesOnlyX = false) {
        super(window, "./extensions/Lyapunov/worker.js", config, false);
    }
}
