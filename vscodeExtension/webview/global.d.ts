// supplied as a global variable by vscode
declare function acquireVsCodeApi(): {
    postMessage: (msg: any) => void;
    getState: () => any;
    setState: (newState: any) => void;
};
