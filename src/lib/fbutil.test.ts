import { describe, it, expect } from 'vitest';
import { ChatCompletionContentPartImage } from 'openai/resources/chat/completions';
import Fbutil, { Detail } from './fbutil';

const detail: Detail = 'low';
const dir = '/Users/fb/Documents/Github/codeai/examples';

describe('Fbutil', () => {
  describe('parse', async () => {
    const dialog = `## ignore
this
# system: ignore this sytem message
# system: Lorem: Ipsum bla
## user: Hello Hello,
I am here.
assistant:  How are you?
user: I am`;
    it('default', async () => {
      const result = await Fbutil.parse(dialog, detail, dir, false);
      expect(result).toStrictEqual([
        { role: 'system', content: 'Lorem: Ipsum bla' },
        { role: 'user', content: 'Hello Hello,\nI am here.' },
        { role: 'assistant', content: 'How are you?' },
        { role: 'user', content: 'I am' },
      ]);
    });
    it('onePrompt', async () => {
      const resultOnly = await Fbutil.parse(dialog, detail, dir, true);
      expect(resultOnly).toStrictEqual([
        { role: 'system', content: 'Lorem: Ipsum bla' },
        { role: 'user', content: 'I am' },
      ]);
    });
  });
  describe('Image', async () => {
    it('http', async () => {
      const result = await Fbutil.parse(
        `user: Hello Hello![](http://image)`,
        detail,
        dir,
        false
      );
      expect(result).toStrictEqual([
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Hello Hello' },
            {
              type: 'image_url',
              // eslint-disable-next-line @typescript-eslint/naming-convention
              image_url: {
                url: 'http://image',
                detail,
              },
            },
          ],
        },
      ]);
    });
    it('local base64', async () => {
      const result = await Fbutil.parse(
        `user: Hello Hello![](fbehrens.jpeg)`,
        detail,
        dir,
        false
      );
      const image = result[0].content![1] as ChatCompletionContentPartImage;
      const base64 = image.image_url.url;
      expect(base64).toMatch(/^data:image\/jpeg;base64,/);
      expect(base64.length).toBe(1883);
    });
  });
});
console.log(new Date().toLocaleTimeString());
