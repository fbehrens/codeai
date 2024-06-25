// const vscode = require('vscode');
import * as vscode from 'vscode';
import Fbutil, { Detail } from './lib/fbutil';
import OpenAI from 'openai';
import { measureMemory } from 'vm';
const openai = new OpenAI({});
const outputChannel = vscode.window.createOutputChannel('Codai');
const config = vscode.workspace.getConfiguration('codai');
interface MyObject {
  [key: string]: string;
}

export default class Codai {
  /**
   *
   * @param description
   * @returns
   */
  static async doDalle(description: string): Promise<string> {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: description,
      n: 1,
      size: '1024x1024',
    });
    return response.data[0].url as string;
  }

  /**
   *
   * @returns
   */
  static getQuestion() {
    const e = vscode.window.activeTextEditor!;
    const d = e.document!;
    const s = e.selection;
    const lid = d.languageId;
    if (s.isEmpty && lid === 'markdown') {
      const pos = s.active;
      const textBeforeCursor = new vscode.Range(0, 0, pos.line, pos.character);
      return d.getText(textBeforeCursor);
    } else if (!s.isEmpty) {
      const lsp = config.get<MyObject>('languageSystemPrompts')!;
      if (lid in lsp) {
        const result = `system:${lsp[lid]}
        user:${d.getText(s)}`;
        e.edit((editBuilder) => {
          e.selections.forEach((selection) => {
            editBuilder.delete(selection);
          });
        });
        return result;
      }
    }
    return '';
  }

  /**
   *
   * @param s
   */
  static async pasteStreamingResponse(s: string) {
    const editor = vscode.window.activeTextEditor!;
    await editor.edit((editBuilder) => {
      const position = editor.selection.end;
      editBuilder.insert(position, s);
    });
  }

  /**
   *
   * @param messages
   * @returns
   */
  static messagesToString(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
  ): string {
    let out: string = '';
    for (const m of messages) {
      out += m.role + ': ' + m.content! + '\n';
    }
    return out;
  }

  /**
   *
   * @param content
   * @param model
   * @param detail
   * @param dir
   * @param onlylastPromt
   * @param token
   * @param out
   * @returns
   */
  static async chat(
    content: string,
    model: string,
    detail: Detail,
    dir: string,
    onlylastPromt: boolean,
    token: vscode.CancellationToken,
    out: (param: string) => void
  ) {
    const messages = await Fbutil.parse(content, detail, dir, onlylastPromt);
    outputChannel.appendLine(this.messagesToString(messages) + `->${model}`);
    console.log(messages);
    console.log(`openai completion with model=${model}`);
    const stream = await openai.chat.completions.create({
      messages,
      model,
      stream: true,
    });
    const lid: string = vscode.window.activeTextEditor?.document.languageId!;
    let first = true;
    for await (const part of stream) {
      let d;
      if (token.isCancellationRequested) {
        return;
      }
      if ((d = part.choices[0]?.delta)) {
        if (first && lid === 'markdown') {
          first = false;
          await out(`${d.role}:\n${d.content}`);
        } else {
          await out(d.content!);
        }
      }
    }
  }
}
