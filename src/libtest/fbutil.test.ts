import * as assert from 'assert';
import Fbutil from '../lib/fbutil';

describe('Fbutil', () => {

  it('inc', () => {
    let r = Fbutil.inc(6);
    assert.strictEqual(r,7);
  });

  it('parse', ()=>{
    const dialog = `SYSTEM: Lorem Ipsum bla
USER: Hello Hello,
I am here.
ASSISTANT:  How are you?
USER: I am`;
    assert.deepEqual(Fbutil.parse(dialog),[
        { role: 'SYSTEM', content: 'Lorem Ipsum bla' },
        { role: 'USER', content: 'Hello Hello,\nI am here.' },
        { role: 'ASSISTANT', content: 'How are you?' },
        { role: 'USER', content: 'I am' }
    ]);
  });
});
