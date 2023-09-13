import OpenAI from 'openai';
const openai = new OpenAI({
    // apiKey: 'my api key', // defaults to process.env["OPENAI_API_KEY"]
});
type Message = {
    role: string;
    content: string;
};
export default class Fbutil{
    static inc(n: number) {
        return n + 1;
    };
    static async chat(content:string): Promise<string|null> {
        const params: OpenAI.Chat.ChatCompletionCreateParams = {
          messages: [{ role: 'user', content: content }],
          model: 'gpt-3.5-turbo',
        };
        const completion: OpenAI.Chat.ChatCompletion = await openai.chat.completions.create(params);
        return completion.choices[0].message.content;
    };
    static parse(dialog:string): Message[] {
        const result:Message[] = [];
        const paragraphs = dialog.split(/\n(?=[A-Z]+:)/);
        for (const paragraph of paragraphs) {
            const [role, content] = paragraph.split(':').map((item) => item.trim());
            result.push({ role, content });
        };
        return result;
    }
}
