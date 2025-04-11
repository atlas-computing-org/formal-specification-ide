import * as vscode from 'vscode';

export type Message = {
    command: string
    body: any
}

export const handleMessages = (message: Message) => {
    vscode.window.showInformationMessage("received message");
}