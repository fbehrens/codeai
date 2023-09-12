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
    }
    static insertTextInCurrentEditor(textToInsert:string) {
        // Get the active text editor
        const editor = vscode.window.activeTextEditor;

        if (editor) {
          // Insert the text at the current cursor position
          editor.edit((editBuilder) => {
            editBuilder.insert(editor.selection.active, textToInsert);
          });
        } else {
          // No active editor found
          vscode.window.showErrorMessage('No active text editor found.');
        }
      }
}

