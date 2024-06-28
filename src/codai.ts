import * as vscode from 'vscode';
import * as Fbutil from './lib/fbutil';
import * as path from 'path';
import OpenAI from 'openai';
import { Detail } from './lib/fbutil';

const openai = new OpenAI({});
export type Config = {
  model: string;
  detail: Detail;
  out: (a: string) => void;
  dir: string;
  languageId: string;
  languageSystemPrompts?: Record<string, string>;
};

export function getConfig({
  file = vscode.window.activeTextEditor?.document.uri.path!,
  languageId = vscode.window.activeTextEditor?.document.languageId!,
  out = pasteStreamingResponse(languageId),
}): Config {
  const config = vscode.workspace.getConfiguration('codai');
  return {
    model: config.get('model')!,
    detail: config.get('detail')!,
    languageSystemPrompts: config.get('languageSystemPrompts')!,
    dir: path.dirname(file),
    out,
    languageId,
  };
}

export function getQuestion(c: Config): string {
  const e = vscode.window.activeTextEditor!;
  const d = e.document!;
  const s = e.selection;
  if (s.isEmpty && c.languageId === 'markdown') {
    const pos = s.active;
    const textBeforeCursor = new vscode.Range(0, 0, pos.line, pos.character);
    return d.getText(textBeforeCursor);
  } else if (!s.isEmpty) {
    if (c.languageId in c.languageSystemPrompts!) {
      const result = `system:${c.languageSystemPrompts![c.languageId]}
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

function pasteStreamingResponse(languageId: string) {
  const editor = vscode.window.activeTextEditor!;
  let first = true;
  return async (s: string) => {
    const output = first && languageId === 'markdown' ? `assistant:\n${s}` : s;
    first = false;
    await editor.edit((editBuilder) => {
      const position = editor.selection.end;
      editBuilder.insert(position, output);
    });
  };
}

export function messagesToString(mess: Fbutil.Message[]): string {
  return mess
    .map((m) => {
      return m.role + ': ' + m.content + '\n';
    })
    .join('\n');
}

export async function dalle() {
  async function doDalle(prompt: string): Promise<string> {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
    });
    return response.data[0].url as string;
  }
  const editor = vscode.window.activeTextEditor!;
  const position = editor.selection.active;
  const line = editor.document.lineAt(position.line);
  const prompt: string = line.text;
  const url: string = await doDalle(prompt);
  const newPosition = position.with(position.line, Number.MAX_VALUE);
  editor.edit((editBuilder) => {
    editBuilder.insert(newPosition, `\n![](${url})`);
  });
}
