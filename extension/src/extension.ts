import "./loadEnv";

import * as vscode from 'vscode';
import * as path from 'path';
import { devLandingPage } from './dev.html';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('spec-mapper.showWebview', () => {
            const panel = vscode.window.createWebviewPanel(
                'spec-mapper-webview',
                'Spec Mapper',
                vscode.ViewColumn.Two,
                {
                    enableScripts: true,
                    localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'media'))]
                }
            );
            panel.webview.html = devLandingPage;
        })
    )
}