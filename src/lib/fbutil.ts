import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import * as fs from 'fs/promises';
import * as path from 'path';

const openai = new OpenAI({
  // apiKey: 'my api key', // defaults to process.env["OPENAI_API_KEY"]
});
type Role = 'function' | 'system' | 'user' | 'assistant';
export type Detail = 'low' | 'high';

export default class Fbutil {
  static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static async parse(
    dialog: string,
    detail: Detail,
    dir: string,
    onlylastPromt: boolean
  ): Promise<ChatCompletionMessageParam[]> {
    /**
     *
     * @param filename
     * @returns
     */
    async function encodeFileToBase64(filename: string) {
      const data = await fs.readFile(filename);
      return data.toString('base64');
    }

    /**
     * @param url local or http:
     * @returns http:// or base64 encoded local image
     */
    async function resolveUrl(url: string): Promise<string> {
      if (url.startsWith('http')) {
        return url;
      }
      const filename = path.resolve(dir, url);
      const r = await encodeFileToBase64(filename);
      return `data:image/jpeg;base64,${r}`;
    }

    const imageTag = async (match: string) => {
      const url = await resolveUrl(match);
      return {
        type: 'image_url',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        image_url: {
          url,
          detail: detail,
        },
      };
    };

    /**
     *
     * @param role
     * @param content
     * @param dir
     * @returns
     */
    async function encodeImage(
      role: Role,
      content: string,
      dir: string
    ): Promise<ChatCompletionMessageParam> {
      const regexp = /\!\[[^\]]*\]\((.*?)\)/g;
      const imagesStr = [...content.matchAll(regexp)].map((match) => match[1]);
      const images = await Promise.all(imagesStr.map(imageTag));
      if (images.length) {
        content = content.replaceAll(regexp, '');
        return {
          role,
          content: [
            {
              type: 'text',
              text: content,
            },
            ...images,
          ],
        } as ChatCompletionMessageParam;
      }
      return {
        role,
        content,
      } as ChatCompletionMessageParam;
    }
    const roles = 'function:|user:|system:|assistant:|dalle:';
    const dialog1 = dialog.replace(
      new RegExp(`\n(#+ )?(?<role>${roles})`, 'g'),
      '\n$<role>'
    ); // ## user: -> user:
    const paragraphs = dialog1.split(new RegExp(`\n(?=${roles})`));
    let result: ChatCompletionMessageParam[] = [];
    for (const paragraph of paragraphs) {
      const colon = paragraph.indexOf(':');
      const r = paragraph.slice(0, colon);
      const content = paragraph.slice(colon + 1).trim();
      const role = r as Role;
      const mes = await encodeImage(role, content, dir);
      result.push(mes);
    }
    // postprrocessing
    // start from last system prompt
    let lastSystemIndex = result.findLastIndex((e) => e.role === 'system');
    result = result.slice(lastSystemIndex);

    // onlylastPrompt
    if (onlylastPromt) {
      result = [result[0], result[result.length - 1]];
    }

    // when last is dalle => remove everything
    const last = result[result.length - 1];
    return result;
  }
}
