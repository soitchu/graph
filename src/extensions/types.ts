type ExtensionConfig = (SliderConfig | NumberConfig | ButtonConfig)[];

interface BaseConfig {
    id: string,
    storeInLocalStorage: boolean
}

interface SliderConfig extends BaseConfig {
    type: "slider",
    max: number,
    min: number,
    step: number,
    default: number
};

interface NumberConfig extends BaseConfig {
    type: "number",
    default: number,
    value: number
}

interface ButtonConfig extends BaseConfig {
    type: "button",
    value: string,
    callback: Function
}

interface XYWorkerPayload {
    action: "payload" | "halt",
    config: ExtensionConfig[],
    responseId: number,
    sharedMemory: SharedArrayBuffer,
    indexSharedBuffer?: SharedArrayBuffer,
    height: number,
    width: number,
    onlyX: boolean,
    translate: {
        x: number,
        y: number
    },
    scale: number,
    x: {
        xIndexStart: number,
        start: number,
        end: number,
        step: number
    },
    y: {
        end: number,
        start: number,
        step: number
    }
}