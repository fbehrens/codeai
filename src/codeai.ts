// const vscode = require('vscode');
import * as vscode from 'vscode';

export default class Codeai{

    static getTextOfCurrentEditor() {
      // Get the active text editor
      const editor = vscode.window.activeTextEditor;

      if (editor) {
        // Get the text from the editor
        const text = editor.document.getText();
        return text;
      } else {
        // No active editor found
        vscode.window.showErrorMessage('No active text editor found.');
        return null;
      }
    };
    static insertTextInCurrentEditor(textToInsert:string) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          editor.edit((editBuilder) => {
            editBuilder.insert(editor.selection.active, textToInsert);
          });
        } else {
          vscode.window.showErrorMessage('No active text editor found.');
        }
      };
    static appendTextInCurrentEditor(textToInsert:string) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          editor.edit((editBuilder) => {
            let end = editor.document.lineAt(editor.document.lineCount - 1).range.end;
            let range = new vscode.Range(end, end);
            editBuilder.insert(range.end, textToInsert);
          });
        } else {
          vscode.window.showErrorMessage('No active text editor found.');
        }
      }
}

