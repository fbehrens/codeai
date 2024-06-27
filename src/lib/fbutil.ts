import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Config } from '../codai';

const openai = new OpenAI({
  // apiKey: 'my api key', // defaults to process.env["OPENAI_API_KEY"]
});
type Role = 'function' | 'system' | 'user' | 'assistant';
export type Message = { role: Role; content: string };

export type Detail = 'low' | 'high';

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Converts message to ChatGPT and extracts ![](url) to chatGpts ChatCompletionMessageParam
 */
export async function chatGpt(
  m: Message,
  c: Config
): Promise<ChatCompletionMessageParam> {
  async function imageTag(url: string) {
    if (!url.startsWith('http')) {
      const filename = path.resolve(c.dir, url);
      const data = await fs.readFile(filename);
      url = `data:image/jpeg;base64,${data.toString('base64')}`;
    }
    return {
      type: 'image_url',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      image_url: {
        url,
        detail: c.detail,
      },
    };
  }

  const regexp = /\!\[[^\]]*\]\((.*?)\)/g;
  const imagesStr = [...m.content.matchAll(regexp)].map((match) => match[1]);
  const images = await Promise.all(imagesStr.map(imageTag));
  if (images.length) {
    const content = m.content.replaceAll(regexp, '');
    return {
      role: m.role,
      content: [
        {
          type: 'text',
          text: content,
        },
        ...images,
      ],
    } as ChatCompletionMessageParam;
  }
  return m as ChatCompletionMessageParam;
}

/**
 *
 * @param dialog
 * @param detail
 * @param dir
 * @param onlylastPrompt
 * @returns
 */
export async function parse(dialog: string, c: Config): Promise<Message[]> {
  const roles = 'function:|user:|system:|assistant:|dalle:';
  const dialog1 = dialog.replace(
    new RegExp(`\n(#+ )?(?<role>${roles})`, 'g'),
    '\n$<role>'
  ); // ## user: -> user:
  const paragraphs = dialog1.split(new RegExp(`\n(?=${roles})`));
  //   let result: ChatCompletionMessageParam[] = [];
  let result: Message[] = [];
  for (const paragraph of paragraphs) {
    const colon = paragraph.indexOf(':');
    const r = paragraph.slice(0, colon);
    const content = paragraph.slice(colon + 1).trim();
    const role = r as Role;
    const m: Message = { role, content };
    // const mes = await encodeImage(role, content);
    result.push(m);
  }
  // postprrocessing
  // start from last system prompt
  let lastSystemIndex = result.findLastIndex((e) => e.role === 'system');
  result = result.slice(lastSystemIndex);

  // when last is dalle => remove everything
  const last = result[result.length - 1];
  return result;
}
