import OpenAI from 'openai';
const openai = new OpenAI({
  // apiKey: 'my api key', // defaults to process.env["OPENAI_API_KEY"]
});
type Role = 'function' | 'system' | 'user' | 'assistant';
type Message = {
  role: Role;
  content: string;
};
export default class Fbutil {
  static inc(n: number) {
    return n + 1;
  }
  static async chat(content: string, model: string): Promise<string | null> {
    const messages = Fbutil.parse(content);
    const params: OpenAI.Chat.ChatCompletionCreateParams = {
      messages,
      model,
    };
    console.log(params);
    const completion: OpenAI.Chat.ChatCompletion =
      await openai.chat.completions.create(params);
    const m = completion.choices[0].message;
    return `${m.role}: ${m.content}`;
  }
  static async chatAsync(
    content: string,
    model: string,
    out: (param: string, arg1: boolean) => void
  ) {
    const messages = Fbutil.parse(content);
    const params: OpenAI.Chat.ChatCompletionCreateParams = {
      messages,
      model,
      stream: true,
    };
    const stream = await openai.chat.completions.create(params);
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
  static parse(dialog: string): Message[] {
    const result: Message[] = [];
    const paragraphs = dialog.split(/\n(?=function:|user:|system:|assistant:)/);
    for (const paragraph of paragraphs) {
      const colon = paragraph.indexOf(':');
      const r = paragraph.slice(0, colon);
      const content = paragraph.slice(colon + 1).trim();
      const role = r as Role;
      result.push({ role, content });
    }
    return result;
  }
}
