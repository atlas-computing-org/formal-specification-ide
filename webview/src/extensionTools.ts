
import { Selection, Position } from './App';

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