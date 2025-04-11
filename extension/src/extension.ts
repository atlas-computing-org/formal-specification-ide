import "./loadEnv";

import * as vscode from 'vscode';
import { WebviewManager } from './windowManager';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('spec-mapper.showWebview', () => {
            WebviewManager.createOrShow(context.extensionUri);
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('spec-mapper.loadFileContents', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const document = editor.document;
                const text = document.getText();

                vscode.window.showInformationMessage(`File contents (first 100 chars): ${text.substring(0, 100)}`);

                WebviewManager.currentPanel?.sendMessage({
                    command: 'alert',
                    body: "hi"
                })
            } else {
                vscode.window.showWarningMessage('No active text editor found');
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