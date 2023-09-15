// const vscode = require('vscode');
import * as vscode from 'vscode';

export default class Codai {
  static getQuestion() {
    const e = vscode.window.activeTextEditor!;
    const d = e.document!;
    const s = e.selection;
    if (s.isEmpty) {
      const pos = s.active;
      const textBeforeCursor = new vscode.Range(0, 0, pos.line, pos.character);
      return d.getText(textBeforeCursor);
    } else {
      return d.getText(s);
    }
  }

  static async pasteStreamingResponse(s: string, prependNewline: boolean) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      await editor.edit((editBuilder) => {
        const position = editor.selection.end;
        editBuilder.insert(position, s);
      });
    } else {
      vscode.window.showErrorMessage('No active text editor found.');
    }
  }
}
