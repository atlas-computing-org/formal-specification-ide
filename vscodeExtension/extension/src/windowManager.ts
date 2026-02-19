import * as vscode from 'vscode';
import { devLandingPage } from './dev.html';
import path from 'path';
import { handleMessages, Message } from './handleMessages';
import { generateRandomString } from './utils';

export class WebviewManager {
    public static currentPanel: WebviewManager | undefined;

    private _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        if (WebviewManager.currentPanel) {
            WebviewManager.currentPanel._panel.reveal(vscode.ViewColumn.Two);
        } else {
            const panel = vscode.window.createWebviewPanel(
                'spec-mapper-webview',
                'spec-mapper',
                vscode.ViewColumn.Two,
                {
                    enableScripts: true,
                    localResourceRoots: [
                        vscode.Uri.file(path.join(extensionUri.fsPath, 'media'))
                    ]
                },
            );

            WebviewManager.currentPanel = new WebviewManager(panel);
        }
    }

    private constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;
        this._panel.webview.html = devLandingPage

        const disposeListenet = this._panel.onDidDispose(() => this.dispose());
        this._disposables.push(disposeListenet);

        const msgEventListener = this._panel.webview.onDidReceiveMessage(
            (msg: Message) => this.receiveMessage(msg),
        );
        this._disposables.push(msgEventListener);
    }

    private receiveMessage(message: Message) {
        vscode.window.showInformationMessage(`WebViewManager received message: ${JSON.stringify(message)}`);
        handleMessages(message);
    }

    public sendMessage(message: Message) {
        this._panel.webview.postMessage({
            ...message,
            id: generateRandomString(),
            origin: 'extension'
        });
    }

    public dispose() {
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
        WebviewManager.currentPanel = undefined;
    }
}

