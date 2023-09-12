import OpenAI from 'openai';
const openai = new OpenAI({
    // apiKey: 'my api key', // defaults to process.env["OPENAI_API_KEY"]
});
export default class Fbutil{
    static inc(n: number) {
        return n + 1;
    };
    static dec(n: number) {
        return n - 1;
    }
    static async chat(content:string): Promise<string|null> {
        const params: OpenAI.Chat.ChatCompletionCreateParams = {
          messages: [{ role: 'user', content: content }],
          model: 'gpt-3.5-turbo',
        };
        const completion: OpenAI.Chat.ChatCompletion = await openai.chat.completions.create(params);
        return completion.choices[0].message.content;
    }
}
