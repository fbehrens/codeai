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

  const stopGeneratingButton = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );
  stopGeneratingButton.text = 'Stop Generating';
  stopGeneratingButton.command = 'codai.stopGenerating';
  stopGeneratingButton.show();
  context.subscriptions.push(stopGeneratingButton);

  let tokenSource: vscode.CancellationTokenSource | undefined;
  vscode.commands.registerCommand('codai.stopGenerating', () => {
    tokenSource?.cancel();
  });

  async function chatCompletion(onePromt: boolean) {
    stopGeneratingButton.show();
    const model = config.get<string>('model')!; // ! is non-null assertion operator
    const detail = config.get<string>('detail')!;
    const dir = path.dirname(
      vscode.window.activeTextEditor?.document.uri.path!
    );
    tokenSource = new vscode.CancellationTokenSource();
    const text = Codai.getQuestion();
    if (text !== null) {
      await Codai.chat(
        text,
        model,
        detail,
        dir,
        onePromt,
        tokenSource.token,
        Codai.pasteStreamingResponse
      );
    }
    stopGeneratingButton.hide();
  }

  const disposable1 = vscode.commands.registerCommand(
    'codai.chat_completion',
    async () => {
      await chatCompletion(false);
      //   Codai.getImage();
    }
  );
  context.subscriptions.push(disposable1);

  const disposable = vscode.commands.registerCommand(
    'codai.chat_completion_one',
    () => {
      chatCompletion(true);
    }
  );
  context.subscriptions.push(disposable);
}
