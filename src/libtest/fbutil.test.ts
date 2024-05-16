import * as assert from 'assert';
import Fbutil from '../lib/fbutil';
const detail = 'low';
describe('Fbutil', () => {
  it('inc', () => {
    let r = Fbutil.inc(6);
    assert.strictEqual(r, 7);
  });

  it('parse', () => {
    const dialog = `system: Lorem: Ipsum bla
user: Hello Hello,
I am here.
assistant:  How are you?
user: I am`;
    assert.deepEqual(Fbutil.parse(dialog,detail), [
      { role: 'system', content: 'Lorem: Ipsum bla' },
      { role: 'user', content: 'Hello Hello,\nI am here.' },
      { role: 'assistant', content: 'How are you?' },
      { role: 'user', content: 'I am' },
    ]);
  });
  it('image', () => {
    const dialog = `system: Lorem: Ipsum bla
user: Hello Hello![](image)`;
    assert.deepEqual(Fbutil.parse(dialog,detail), [
        { role: 'system', content: 'Lorem: Ipsum bla' },
        { role: 'user', content: [
            {   type: 'text',
                text: 'Hello Hello'},
            {   type: 'image_url',
                // eslint-disable-next-line @typescript-eslint/naming-convention
                image_url: {
                    url: 'image',
                    detail: 'low'}}
        ]
        },
    ]);
  });
});
