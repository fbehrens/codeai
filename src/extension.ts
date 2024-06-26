import * as vscode from 'vscode';
import * as Codai from './codai';
import * as Fbutil from './lib/fbutil';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  // Stop Genarating button
  const stopGeneratingButton = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );
  stopGeneratingButton.text = 'Stop Generating';
  stopGeneratingButton.command = 'codai.stopGenerating';
  context.subscriptions.push(stopGeneratingButton);

  let tokenSource: vscode.CancellationTokenSource | undefined;

  async function chatCompletion() {
    stopGeneratingButton.show();
    tokenSource = new vscode.CancellationTokenSource();
    const text = Codai.getQuestion();
    if (text !== null) {
      await Codai.chat({ token: tokenSource.token });
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
      await chatCompletion();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('codai.dalle', async () => {
      await Codai.dalle();
    })
  );
}
