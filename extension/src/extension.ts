import "./loadEnv";

import * as vscode from 'vscode';
import { WebviewManager } from './windowManager';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('spec-mapper.showWebview', () => {
            WebviewManager.createOrShow(context.extensionUri);
            WebviewManager.currentPanel?.sendMessage({command: 'startUp'})
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('spec-mapper.loadFileContents', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const document = editor.document;

                WebviewManager.createOrShow(context.extensionUri);
                setTimeout(() => {
                    WebviewManager.currentPanel?.sendMessage({
                        command: 'loadFile',
                        body: {fileName: document.fileName}
                    })
                }, 1000) // hack until i figure out how to quque messages for startup

            } else {
                vscode.window.showWarningMessage('No active text editor found');
            }
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('spec-mapper.getContextForSelection', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const selection = editor.selection;
                const fileName = editor.document.fileName;
                const text = editor.document.getText(selection);
                WebviewManager.currentPanel?.sendMessage({
                    command: 'getContextForSelection',
                    body: {fileName, selection, text}
                })
            }
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('spec-mapper.sayHello', () => {
            WebviewManager.currentPanel?.sendMessage({
                command: 'hello',
                body: "hi"
            })
        })
    )
}