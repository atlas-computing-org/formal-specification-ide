import "./loadEnv";

import * as vscode from 'vscode';
import { WebviewManager } from './windowManager';
import { openOrRevealDocument } from "./vscodeUtils";

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('spec-mapper.openHomePage', () => {
            WebviewManager.createOrShow(context.extensionUri);
            WebviewManager.currentPanel?.sendMessage({command: 'navigate', body: {page: 'Home'}})
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('spec-mapper.openHelpPage', () => {
            WebviewManager.createOrShow(context.extensionUri);
            WebviewManager.currentPanel?.sendMessage({command: 'navigate', body: {page: 'Help'}})
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('spec-mapper.openDocumentationPage', () => {
            WebviewManager.createOrShow(context.extensionUri);
            WebviewManager.currentPanel?.sendMessage({command: 'navigate', body: {page: 'Documentation'}})
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('spec-mapper.openSettingsPage', () => {
            WebviewManager.createOrShow(context.extensionUri);
            WebviewManager.currentPanel?.sendMessage({command: 'navigate', body: {page: 'Settings'}})
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('spec-mapper.loadActiveFileAsDocumentation', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const document = editor.document;

                WebviewManager.createOrShow(context.extensionUri);
                WebviewManager.currentPanel?.sendMessage({
                    command: 'navigate',
                    body: {page: 'Documentation'}
                })
                WebviewManager.currentPanel?.sendMessage({
                    command: 'loadFile',
                    body: {fileName: document.fileName, text: document.getText()}
                })

            } else {
                vscode.window.showWarningMessage('No active text editor found');
            }
        })
    )

    context.subscriptions.push(
        vscode.commands.registerCommand('spec-mapper.openAndLoadFileAsDocumentation', async (uri: vscode.Uri) => {
            if (!uri) {
                vscode.window.showErrorMessage('No file selected');
                return;
            }

            await openOrRevealDocument(uri.fsPath, vscode.ViewColumn.One);
            WebviewManager.createOrShow(context.extensionUri);
            WebviewManager.currentPanel?.sendMessage({
                command: 'navigate',
                body: {page: 'Documentation'}
            })
            WebviewManager.currentPanel?.sendMessage({
                command: 'loadFile',
                body: {fileName: uri.fsPath}
            })
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
}