import * as vscode from 'vscode';
import Codai from './codai';
import Fbutil from './lib/fbutil';

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('codai');
  //   let disposable0 = vscode.commands.registerCommand('codai.helloWorld', () => {
  //     vscode.window.showInformationMessage('Hello World from codai!');
  //   });
  //   context.subscriptions.push(disposable0);

  let disposable1 = vscode.commands.registerCommand(
    'codai.chat_completion',
    () => {
      const model = config.get<string>('model')!; // ! is non-null assertion operator
      const text = Codai.getQuestion();
      if (text !== null) {
        Fbutil.chat(text, model, Codai.pasteStreamingResponse);
      }
    }
  );
  context.subscriptions.push(disposable1);
}

export function deactivate() {}
