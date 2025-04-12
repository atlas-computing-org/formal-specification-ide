import * as vscode from 'vscode';
import {devLandingPage} from './dev.html';
import path from 'path';
import { handleMessages, Message } from './handleMessages';
import { generateRandomString } from './utils';

export class WebviewManager {
    public static currentPanel: WebviewManager | undefined;

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        if (WebviewManager.currentPanel) {
            WebviewManager.currentPanel._panel.reveal(vscode.ViewColumn.Two);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'spec-mapper-webview',
            'Spec Mapper',
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

    private constructor(panel: vscode.WebviewPanel) {
        this._panel = panel;
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.html = devLandingPage

        this._panel.webview.onDidReceiveMessage(
            handleMessages,
            null,
            this._disposables
        );
    }

    public sendMessage(message: Message) {
        this._panel.webview.postMessage({
            ...message,
            id: generateRandomString(),
            origin: 'extension'
        });
    }

    public dispose() {
        WebviewManager.currentPanel = undefined;
        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}

