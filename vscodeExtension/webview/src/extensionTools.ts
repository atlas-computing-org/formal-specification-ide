
export type Position = {
    line: number
    character: number
}

export type Selection = {
    start: Position
    end: Position
    active: Position
    anchor: Position
    text?: string
    fileName?: string
}

const sendMessageToExtension = (command: string, body: any) => {
    window.parent.postMessage({
        command,
        body,
        origin: 'webview'
    }, '*');
}

export const goToSelection = (fileName: string, selection: Pick<Selection, 'start' | 'end'>) => {
    sendMessageToExtension('goToSelection', {selection: {...selection, fileName}});
}

export const goToFile = (fileName: string) => {
    sendMessageToExtension('goToFile', {fileName});
}

export const goToPosition = (fileName: string, position: Position) => {
    sendMessageToExtension('goToPosition', {fileName, position});
}

export const notifyVscode = (message: string, level: "info" | "warning" | "error" = "info") => {
    sendMessageToExtension('notifyVscode', {message, level});
}

export const webViewIsLoaded = () => {
    sendMessageToExtension('webViewIsLoaded', {});
}