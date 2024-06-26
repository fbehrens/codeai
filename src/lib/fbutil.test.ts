import { describe, it, expect } from 'vitest';
import {
  ChatCompletionContentPartImage,
  ChatCompletionContentPartText,
} from 'openai/resources/chat/completions';
import * as Fbutil from './fbutil';

const c: Fbutil.Config = {
  model: 'gpt-4o',
  detail: 'low',
  dir: '/Users/fb/Documents/Github/codeai/examples',
  out: (s: string) => {},
};

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
      const result = await Fbutil.parse(dialog, c);
      expect(result).toStrictEqual([
        { role: 'system', content: 'Lorem: Ipsum bla' },
        { role: 'user', content: 'Hello Hello,\nI am here.' },
        { role: 'assistant', content: 'How are you?' },
        { role: 'user', content: 'I am' },
      ]);
    });
  });
  describe('Image', async () => {
    it('http', async () => {
      const mes = await Fbutil.parse(`user: Hello Hello![](http://image)`, c);
      const result = await Fbutil.chatGpt(mes[0], c);
      expect(result).toStrictEqual({
        role: 'user',
        content: [
          { type: 'text', text: 'Hello Hello' },
          {
            type: 'image_url',
            // eslint-disable-next-line @typescript-eslint/naming-convention
            image_url: {
              url: 'http://image',
              detail: c.detail,
            },
          },
        ],
      });
    });
    it('local base64', async () => {
      const m = await Fbutil.parse(`user: Hello Hello![](fbehrens.jpeg)`, c);
      const mp = await Fbutil.chatGpt(m[0], c);

      const text = mp.content![0] as ChatCompletionContentPartText;
      expect(text).toStrictEqual({ type: 'text', text: 'Hello Hello' });

      const image = mp.content![1] as ChatCompletionContentPartImage;
      const base64 = image.image_url.url;
      expect(base64).toMatch(/^data:image\/jpeg;base64,/);
      expect(base64.length).toBe(1883);
    });
  });
});
console.log(new Date().toLocaleTimeString());
