// const vscode = require('vscode');
import * as vscode from 'vscode';

export default class Codai {
  static getTextOfCurrentEditor() {
    const editor = vscode.window.activeTextEditor;

    if (editor) {
      const text = editor.document.getText();
      return text;
    } else {
      vscode.window.showErrorMessage('No active text editor found.');
      return null;
    }
  }

  static async appendTextInCurrentEditor(s: string, prependNewline: boolean) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      const lastLine = editor.document.lineCount - 1;
      const lastLineRange = editor.document.lineAt(lastLine).range;
      const endPosition = new vscode.Position(
        lastLine,
        lastLineRange.end.character
      );
      if (prependNewline && lastLineRange.end.character) {
        s = '\n' + s;
      }
      await editor.edit((editBuilder) => {
        editBuilder.insert(endPosition, s);
      });
    } else {
      vscode.window.showErrorMessage('No active text editor found.');
    }
  }
}
