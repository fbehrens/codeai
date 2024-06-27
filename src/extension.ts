import * as vscode from 'vscode';
import * as Codai from './codai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
const openai = new OpenAI({});
const outputChannel = vscode.window.createOutputChannel('Codai');
let abortController: AbortController | null = null;

import { parse, chatGpt, sleep, Message, Config } from './lib/fbutil';

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
    vscode.commands.registerCommand('codai.dalle', async () => {
      await Codai.dalle();
    })
  );
  const client = new Anthropic();
  type ProviderParams = {
    mess: Message[];
    abortController: AbortController;
    c: Config;
  };
  type ProviderFunction = ({
    mess,
    abortController,
    c,
  }: ProviderParams) => Promise<void>;
  type ProviderName = 'claude' | 'openai';
  const providers: Record<ProviderName, ProviderFunction> = {
    claude: async ({
      mess = [],
      abortController = new AbortController(),
      c = Codai.getConfig(),
    }: ProviderParams) => {
      console.log('i am claude');
      const messages = mess.map((m) => {
        return m as Anthropic.Messages.MessageParam;
      });
      const stream = await client.messages.stream(
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { messages, model: 'claude-3-5-sonnet-20240620', max_tokens: 1024 },
        { signal: abortController.signal }
      );
      for await (const message of stream) {
        if (abortController.signal.aborted) {
          throw new vscode.CancellationError();
        }
        if (message.type === 'message_start') {
          Codai.pasteStreamingResponse(`${message.message.role}: `);
        }
        if (
          message.type === 'content_block_delta' &&
          message.delta?.type === 'text_delta'
        ) {
          c.out(message.delta.text);
        }
      }
    },
    openai: async ({
      mess = [],
      abortController = new AbortController(),
      c = Codai.getConfig(),
    }: ProviderParams) => {
      console.log('i am openai');
      const messages = await Promise.all(
        mess.map((m) => {
          return chatGpt(m, c);
        })
      );
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
      for await (const part of stream) {
        if (abortController.signal.aborted) {
          throw new vscode.CancellationError();
        }
        let d;
        if ((d = part.choices[0]?.delta)) {
          if (first && c.languageId === 'markdown') {
            first = false;
            await c.out(`${d.role}:\n${d.content}`);
          } else {
            await c.out(d.content!);
          }
        }
      }
    },
  };

  async function completion(provider: ProviderName) {
    abortController = new AbortController();
    const content = Codai.getQuestion();
    const c = Codai.getConfig();
    const mess = await parse(content, c);
    stopGeneratingButton.show();
    try {
      await providers[provider]({
        mess,
        abortController,
        c,
      });
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
  }
  context.subscriptions.push(
    vscode.commands.registerCommand('codai.openai_completion', async () => {
      await completion('openai');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('codai.claude_completion', async () => {
      await completion('claude');
    })
  );
}
