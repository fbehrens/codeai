import * as vscode from 'vscode';
import Codai from './codai';
import Fbutil from './lib/fbutil';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('codai');
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBar.text = 'Version124';
  statusBar.show();
  context.subscriptions.push(statusBar);

  function chatCompletion(onePromt:boolean){
    const model = config.get<string>('model')!; // ! is non-null assertion operator
    const detail = config.get<string>('detail')!;
    const dir = path.dirname(
      vscode.window.activeTextEditor?.document.uri.path!
    );
    const text = Codai.getQuestion();
    if (text !== null) {
      Fbutil.chat(text, model, detail, dir, onePromt,Codai.pasteStreamingResponse);
    }
  };

  let disposable = vscode.commands.registerCommand(
    'codai.chat_completion',
    () => {
        chatCompletion(false);
    }
  );
  context.subscriptions.push(disposable);
  disposable = vscode.commands.registerCommand(
    'codai.chat_completion_one',
    () => {
        chatCompletion(true);
    }
  );
  context.subscriptions.push(disposable);
}
