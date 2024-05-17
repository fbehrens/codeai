import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
import * as fs from 'fs/promises';
import * as path from 'path';

const openai = new OpenAI({
  // apiKey: 'my api key', // defaults to process.env["OPENAI_API_KEY"]
});
type Role = 'function' | 'system' | 'user' | 'assistant';
export default class Fbutil {
  static async chat(
    content: string,
    model: string,
    detail: string,
    dir: string,
    out: (param: string, arg1: boolean) => void
  ) {
    console.log({dir});
    const messages = await Fbutil.parse(content,detail,dir);
    console.log(`openai completion with model=${model}`);
    const stream = await openai.chat.completions.create({
      messages,
      model,
      stream: true,
    });
    let first = true;
    for await (const part of stream) {
      let d;
      if ((d = part.choices[0]?.delta)) {
        if (first) {
          first = false;
          await out(d.role + ': ' + d.content, true);
        } else {
          await out(d.content || '', false);
        }
      }
    }
  }
  static async parse(dialog: string, detail:string, dir:string): Promise<ChatCompletionMessageParam[]> {
    async function encodeFileToBase64(filename:string) {
        const data = await fs.readFile(filename);
        return data.toString('base64');
    }

    async function resolveUrl(url:string):Promise<string>{
        if (url.startsWith('http')){
            return url;
        }
        const filename = path.resolve(dir,url);
        const r = await encodeFileToBase64(filename);
            return `data:image/jpeg;base64,${r}`;
    }

    const imageTag = async (match:string) => {
        const url = await resolveUrl(match);
        return {
            type: 'image_url',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            image_url: {
                url,
                detail: detail}};
    };

    async function encodeImage(role: Role,content:string,dir:string):Promise<ChatCompletionMessageParam>{
        const regexp = /\!\[[^\]]*\]\((.*?)\)/g;
        const imagesStr = [...content.matchAll(regexp)].map(match => match[1]);
        const images = await Promise.all(imagesStr.map(imageTag));
        if (images.length) {
            content = content.replaceAll(regexp,'');
            return {
                role,
                content: [ {
                    type: "text",
                    text: content }, ...images ]
            } as ChatCompletionMessageParam;
        }
        return {
            role,
            content
            } as ChatCompletionMessageParam;
    };
    const result: ChatCompletionMessageParam[] = [];
    const paragraphs = dialog.split(/\n(?=function:|user:|system:|assistant:|image:)/i);
    for (const paragraph of paragraphs) {
      const colon = paragraph.indexOf(':');
      const r = paragraph.slice(0, colon);
      const content = paragraph.slice(colon + 1).trim();
      const role = r as Role;
      const mes = await encodeImage(role,content,dir) ;
      result.push( mes);
    }

    let lastSystemIndex = result.findLastIndex((e)=> e.role === 'system');
    const result1 = result.slice(lastSystemIndex)
    return result1;
  }
}
