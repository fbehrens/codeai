// const vscode = require('vscode');
import * as vscode from 'vscode';
import * as Fbutil from './lib/fbutil';
import OpenAI from 'openai';

const openai = new OpenAI({});
const outputChannel = vscode.window.createOutputChannel('Codai');
const config = vscode.workspace.getConfiguration('codai');
interface MyObject {
  [key: string]: string;
}

/**
 *
 * @returns
 */
export function getQuestion() {
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
export async function pasteStreamingResponse(s: string) {
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
export function messagesToString(
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
export async function chat(
  content: string,
  model: string,
  detail: Fbutil.Detail,
  dir: string,
  onlylastPromt: boolean,
  token: vscode.CancellationToken,
  out: (param: string) => void
) {
  const messages = await Fbutil.parse(content, detail, dir, onlylastPromt);
  outputChannel.appendLine(messagesToString(messages) + `->${model}`);
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

export async function dalle() {
  async function doDalle(description: string): Promise<string> {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: description,
      n: 1,
      size: '1024x1024',
    });
    return response.data[0].url as string;
  }

  const editor = vscode.window.activeTextEditor!;
  const position = editor.selection.active;
  const line = editor.document.lineAt(position.line);
  console.log(line.text);
  const url: string = await doDalle(line.text);
  console.log(url);
  const newPosition = position.with(position.line, Number.MAX_VALUE);
  editor.edit((editBuilder) => {
    editBuilder.insert(newPosition, '\n' + `![](${url})`);
  });
}
