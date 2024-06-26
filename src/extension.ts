import * as vscode from 'vscode';
import * as Codai from './codai';
import Anthropic from '@anthropic-ai/sdk';

import { parse } from './lib/fbutil';

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
    await Codai.chat({ token: tokenSource.token });
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
  const client = new Anthropic();
  let abortController: AbortController | null = null;
  context.subscriptions.push(
    vscode.commands.registerCommand('codai.claude_completion', async () => {
      abortController = new AbortController();
      const content = Codai.getQuestion();
      const messages_ = await parse(content, Codai.getConfig());
      const messages = messages_.map((m) => {
        return m as Anthropic.Messages.MessageParam;
      });
      try {
        const stream = await client.messages.stream(
          // eslint-disable-next-line @typescript-eslint/naming-convention
          { messages, model: 'claude-3-5-sonnet-20240620', max_tokens: 1024 },
          { signal: abortController.signal }
        );
        for await (const message of stream) {
          //   console.log(message);
          if (
            message.type === 'content_block_delta' &&
            message.delta?.type === 'text_delta'
          ) {
            Codai.pasteStreamingResponse(message.delta.text);
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            vscode.window.showInformationMessage('Generation was stopped');
          } else {
            vscode.window.showErrorMessage(
              `An error occurred: ${error.message}`
            );
          }
        }
      } finally {
        abortController = null;
      }
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('codai.stopClaude', () => {
      if (abortController) {
        abortController.abort();
      }
    })
  );
}
