// const vscode = require('vscode');
import * as vscode from 'vscode';
import Fbutil from './lib/fbutil';
import OpenAI from 'openai';
const openai = new OpenAI({});

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

  static async chat(
    content: string,
    model: string,
    detail: string,
    dir: string,
    onlylastPromt: boolean,
    token: vscode.CancellationToken,
    out: (param: string, arg1: boolean) => void
  ) {
    console.log({ dir });
    const messages = await Fbutil.parse(content, detail, dir, onlylastPromt);
    console.log(`openai completion with model=${model}`);
    const stream = await openai.chat.completions.create({
      messages,
      model,
      stream: true,
    });
    let first = true;
    for await (const part of stream) {
      let d;
      if (token.isCancellationRequested) {
        return;
      }
      if ((d = part.choices[0]?.delta)) {
        if (first) {
          first = false;
          await out(d.role + ': ' + d.content, true);
        } else {
          await out(d.content || '', false);
        }
      }
    }
  }
}
