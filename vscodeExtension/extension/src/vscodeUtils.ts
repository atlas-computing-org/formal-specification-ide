import * as vscode from 'vscode';

export const openOrRevealDocument = async (filePath: string, column?: vscode.ViewColumn) => {
    if (!filePath) {
        vscode.window.showErrorMessage(`filePath is required`);
        return null
    }

    try {
        const col = column || vscode.ViewColumn.One;
        const openDocument = vscode.workspace.textDocuments.find(
            doc => doc.uri.fsPath === filePath
        );

        if (openDocument) {
            return vscode.window.showTextDocument(openDocument, col);
        } else {
            const doc = await vscode.workspace.openTextDocument(filePath);
            return vscode.window.showTextDocument(doc, {preview: false, viewColumn: col});
        }
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to open file: ${error}`)
        return null
    }
}

export const goToSelection = async (filePath: string, selection: vscode.Selection) => {
    const editor = await openOrRevealDocument(filePath);
    if (editor) {
        try {
            editor.selection = selection;
            editor.revealRange(selection, vscode.TextEditorRevealType.InCenter);
        } catch (error) {
            vscode.window.showErrorMessage(`Error going to selection: ${error}`);
        }
    }
}

export const goToPosition = async (filePath: string, position: vscode.Position) => {
    const editor = await openOrRevealDocument(filePath);
    if (editor) {
        try {
            const selection = new vscode.Selection(position, position);
            editor.selection = selection;
            editor.revealRange(selection, vscode.TextEditorRevealType.InCenter);
        } catch (error) {
            vscode.window.showErrorMessage(`Error going to position: ${error}`);
        }
    }
}