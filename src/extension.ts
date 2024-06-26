import * as vscode from 'vscode';
import * as Codai from './codai';
import * as Fbutil from './lib/fbutil';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('codai');

  // Stop Genarating button
  const stopGeneratingButton = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );
  stopGeneratingButton.text = 'Stop Generating';
  stopGeneratingButton.command = 'codai.stopGenerating';
  context.subscriptions.push(stopGeneratingButton);

  let tokenSource: vscode.CancellationTokenSource | undefined;

  async function chatCompletion(onePromt: boolean) {
    stopGeneratingButton.show();
    const model = config.get<string>('model')!; // ! is non-null assertion operator
    const detail = config.get<Fbutil.Detail>('detail')!;
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
  context.subscriptions.push(
    vscode.commands.registerCommand('codai.stopGenerating', () => {
      tokenSource?.cancel();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('codai.chat_completion', async () => {
      await chatCompletion(false);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('codai.dalle', async () => {
      await Codai.dalle();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('codai.chat_completion_one', () => {
      chatCompletion(true);
    })
  );
}
