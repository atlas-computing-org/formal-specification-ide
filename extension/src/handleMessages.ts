import * as vscode from 'vscode';
import { goToPosition, goToSelection, openOrRevealDocument } from './vscodeUtils';

export type Message = {
    command: string
    body?: any
}

type ClientPosition = {
    line: number
    character: number
}

export type ClientSelection = {
    start: ClientPosition
    end: ClientPosition
    fileName: string
}

const clientPositionToVscodePosition = (position: ClientPosition): vscode.Position => {
    return new vscode.Position(position.line, position.character);
}

const clientSelectionToVscodeSelection = (selection: ClientSelection): vscode.Selection | null => {
    try {
        return new vscode.Selection(
            clientPositionToVscodePosition(selection.start),
            clientPositionToVscodePosition(selection.end)
        );
    } catch (error) {
        vscode.window.showErrorMessage(`Error converting client selection to vscode selection: ${error}`);
        return null;
    }
}

export const handleMessages = (message: Message) => {
    vscode.window.showInformationMessage(`received message: ${JSON.stringify(message)}`);

    switch (message.command) {
        case 'goToFile':
            const clientFile = message.body.fileName as string | undefined;
            if (clientFile) {
                openOrRevealDocument(clientFile);
            } else {
                vscode.window.showErrorMessage(`Invalid file: ${JSON.stringify(message.body)}`);
            }
            break;
        
        case 'goToSelection':
            const clientSelection = message.body.selection as ClientSelection;
            const selection = clientSelectionToVscodeSelection(clientSelection);
            if (selection) {
                goToSelection(clientSelection.fileName, selection);
            }
            break;
        
        case 'goToPosition':
            const clientPosition = message.body.position as ClientPosition;
            const fileName = message.body.fileName as string;
            const position = clientPositionToVscodePosition(clientPosition);
            goToPosition(fileName, position);
            break;
    }
}