import * as vscode from 'vscode';
import * as Codai from './codai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
const openai = new OpenAI({});
const outputChannel = vscode.window.createOutputChannel('Codai');
let abortController: AbortController | null = null;

import { parse, chatGpt, sleep } from './lib/fbutil';

export function activate(context: vscode.ExtensionContext) {
  // Stop Genarating button
  const stopGeneratingButton = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left
  );
  stopGeneratingButton.text = 'Stop Generating';
  stopGeneratingButton.command = 'codai.stopGenerating';
  context.subscriptions.push(stopGeneratingButton);

  context.subscriptions.push(
    vscode.commands.registerCommand('codai.stopGenerating', () => {
      console.log({ abort: abortController });
      abortController?.abort();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('codai.chat_completion', async () => {
      abortController = new AbortController();
      stopGeneratingButton.show();
      const content = Codai.getQuestion();
      const c = Codai.getConfig();
      const messages_ = await parse(content, c);
      const messages = await Promise.all(
        messages_.map((m) => {
          return chatGpt(m, c);
        })
      );
      outputChannel.appendLine(
        Codai.messagesToString(messages) + `->${c.model}`
      );
      const lid: string = vscode.window.activeTextEditor?.document.languageId!;
      try {
        const stream = await openai.chat.completions.create(
          {
            messages,
            model: c.model,
            stream: true,
          },
          {
            signal: abortController.signal,
          }
        );
        let first = true;
        // await sleep(3000);
        for await (const part of stream) {
          if (abortController.signal.aborted) {
            throw new vscode.CancellationError();
          }
          let d;
          if ((d = part.choices[0]?.delta)) {
            if (first && lid === 'markdown') {
              first = false;
              await c.out(`${d.role}:\n${d.content}`);
            } else {
              await c.out(d.content!);
            }
          }
        }
      } catch (error) {
        if (error instanceof vscode.CancellationError) {
          console.log('Request was aborted');
        } else {
          console.error('An error occurred:', error);
        }
      } finally {
        stopGeneratingButton.hide();
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('codai.dalle', async () => {
      await Codai.dalle();
    })
  );
  const client = new Anthropic();
  context.subscriptions.push(
    vscode.commands.registerCommand('codai.claude_completion', async () => {
      abortController = new AbortController();
      const content = Codai.getQuestion();
      const messages_ = await parse(content, Codai.getConfig());
      const messages = messages_.map((m) => {
        return m as Anthropic.Messages.MessageParam;
      });
      stopGeneratingButton.show();
      try {
        const stream = await client.messages.stream(
          // eslint-disable-next-line @typescript-eslint/naming-convention
          { messages, model: 'claude-3-5-sonnet-20240620', max_tokens: 1024 },
          { signal: abortController.signal }
        );
        for await (const message of stream) {
          //   await sleep(50);
          if (abortController.signal.aborted) {
            console.log('<cancel>');
            throw new vscode.CancellationError();
          }

          //   console.log(message);
          if (message.type === 'message_start') {
            Codai.pasteStreamingResponse(`${message.message.role}: `);
          }
          if (
            message.type === 'content_block_delta' &&
            message.delta?.type === 'text_delta'
          ) {
            Codai.pasteStreamingResponse(message.delta.text);
          }
        }
      } catch (error) {
        if (error instanceof vscode.CancellationError) {
          console.log('Generation was stopped');
        } else {
          console.log(`An error occurred: ${error}`);
        }
      } finally {
        abortController = null;
        stopGeneratingButton.hide();
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
