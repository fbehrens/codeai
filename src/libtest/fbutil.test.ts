import * as assert from 'assert';
import Fbutil from '../lib/fbutil';

describe('Fbutil', () => {

  it('inc', () => {
    let r = Fbutil.inc(6);
    assert.strictEqual(r,7);
  });

  it('parse', ()=>{
    const dialog = `system: Lorem: Ipsum bla
user: Hello Hello,
I am here.
assistant:  How are you?
user: I am`;
    assert.deepEqual(Fbutil.parse(dialog),[
        { role: 'system', content: 'Lorem: Ipsum bla' },
        { role: 'user', content: 'Hello Hello,\nI am here.' },
        { role: 'assistant', content: 'How are you?' },
        { role: 'user', content: 'I am' }
    ]);
  });
});
