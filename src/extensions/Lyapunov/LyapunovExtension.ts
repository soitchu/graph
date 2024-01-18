import { GraphExtension } from "../../utils/GraphExtension.js";
import { GraphWindow } from "../../utils/GraphWindow.js";
import { config } from "../Bifurcation/BifurcationExtension.js";
import { XLineExtension } from "../Templates/XLine/XLineExtension.js";
import { XYExtension } from "../Templates/XY/XYExtension.js";

export class LyapunovExtension extends XYExtension {
    constructor(window: GraphWindow, workerURL: string, config: ExtensionConfig[] = [], usesOnlyX = false) {
        super(window, "./extensions/Lyapunov/worker.js", config, false);
    }
}