import * as assert from 'assert';
import { ChatCompletionContentPartImage } from 'openai/resources/chat/completions';
import Fbutil from '../lib/fbutil';

const detail = 'low';
const dir = '/Users/fb/Documents/Github/codeai/examples';
describe('Fbutil', () => {
  describe('parse', async function () {
    const dialog = `## ignore
this
# system: ignore this sytem message
# system: Lorem: Ipsum bla
## user: Hello Hello,
I am here.
dalle: Picture of a cow
assistant:  How are you?
user: I am`;
    it('default', async function () {
      const result = await Fbutil.parse(dialog, detail, dir, false);
      assert.deepEqual(result, [
        { role: 'system', content: 'Lorem: Ipsum bla' },
        { role: 'user', content: 'Hello Hello,\nI am here.' },
        { role: 'assistant', content: 'How are you?' },
        { role: 'user', content: 'I am' },
      ]);
    });
    it('onePrompt', async function () {
      const resultOnly = await Fbutil.parse(dialog, detail, dir, true);
      assert.deepEqual(resultOnly, [
        { role: 'system', content: 'Lorem: Ipsum bla' },
        { role: 'user', content: 'I am' },
      ]);
    });
    it('dalle', async function () {
      const resultOnly = await Fbutil.parse(
        `# system: Lorem: Ipsum bla
## user: Hello Hello,
I am here.
dalle: Picture of a cow`,
        detail,
        dir,
        true
      );
      assert.deepEqual(resultOnly, [
        { role: 'dalle', content: 'Picture of a cow' },
      ]);
    });
  });
  describe('Image', async function () {
    it('http', async function () {
      const result = await Fbutil.parse(
        `user: Hello Hello![](http://image)`,
        detail,
        dir,
        false
      );
      assert.deepEqual(result, [
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
    it('local base64', async function () {
      const result = await Fbutil.parse(
        `user: Hello Hello![](fbehrens.jpeg)`,
        detail,
        dir,
        false
      );
      const image = result[0].content![1] as ChatCompletionContentPartImage;
      const base64 = image.image_url.url;
      assert.match(base64, /^data:image\/jpeg;base64,/);
      assert.equal(base64.length, 1883);
    });
  });
});
console.log(new Date().toLocaleTimeString());
