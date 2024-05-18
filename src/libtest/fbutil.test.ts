import * as assert from 'assert';
import Fbutil from '../lib/fbutil';
import { ChatCompletionContentPartImage } from 'openai/resources/chat/completions';

const detail = 'low';
const dir = '/Users/fb/Documents/Github/codeai/examples';
describe('Fbutil', () => {
  it('parse', async function() {
    const dialog = `## ignore
this
# system: ignore this sytem message
# system: Lorem: Ipsum bla
## user: Hello Hello,
I am here.
assistant:  How are you?
user: I am`;
    const result = await Fbutil.parse(dialog,detail,dir);
    assert.strictEqual('abcd'.replace(/b(?<letter>.)/,'_$<letter>'),'a_cd');
    assert.deepEqual(result, [
      { role: 'system', content: 'Lorem: Ipsum bla' },
      { role: 'user', content: 'Hello Hello,\nI am here.' },
      { role: 'assistant', content: 'How are you?' },
      { role: 'user', content: 'I am' },
    ]);
  });
  describe('Image',async function (){
      it('http', async function (){
          const result = await Fbutil.parse(`user: Hello Hello![](http://image)`, detail, dir);
          assert.deepEqual(result, [
              { role: 'user', content: [
                  { type: 'text',
                    text: 'Hello Hello'},
                  { type: 'image_url',
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    image_url: {
                      url: 'http://image',
                      detail } } ]
                },
            ]);
        });
      it('local base64', async function (){
          const result = await Fbutil.parse(`user: Hello Hello![](fbehrens.jpeg)`, detail, dir);
          const image  = result[0].content![1] as ChatCompletionContentPartImage;
          const base64 = image.image_url.url;
          assert.match(base64,/^data:image\/jpeg;base64,/);
          assert.equal(base64.length,1883);
        });
    });
});
console.log(new Date().toLocaleTimeString());
