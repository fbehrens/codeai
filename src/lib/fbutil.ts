import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
const openai = new OpenAI({
  // apiKey: 'my api key', // defaults to process.env["OPENAI_API_KEY"]
});
type Role = 'function' | 'system' | 'user' | 'assistant';
export default class Fbutil {
  static inc(n: number) {
    return n + 1;
  }
  static async chat(
    content: string,
    model: string,
    detail: string,
    out: (param: string, arg1: boolean) => void
  ) {
    const messages = Fbutil.parse(content,detail);
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
  static parse(dialog: string, detail:string): ChatCompletionMessageParam[] {
    function encodeImage(role: Role,content:string):ChatCompletionMessageParam{
        const regexp = /\!\[[^\]]*\]\((.*?)\)/g;
        const images = [...content.matchAll(regexp)].map(match => {
            return {
                type: 'image_url',
                // eslint-disable-next-line @typescript-eslint/naming-convention
                image_url: {
                    url: match[1],
                    detail: detail}};} );
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
    const paragraphs = dialog.split(/\n(?=function:|user:|system:|assistant:|image:)/);
    for (const paragraph of paragraphs) {
      const colon = paragraph.indexOf(':');
      const r = paragraph.slice(0, colon);
      const content = paragraph.slice(colon + 1).trim();
      const role = r as Role;
      result.push( encodeImage(role,content) );
    }
    // console.log(result);
    return result;
  }
}
