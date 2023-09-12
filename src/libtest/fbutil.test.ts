import * as assert from 'assert';
import Fbutil from '../lib/fbutil';

describe('Fbutil', () => {
  it('inc', () => {
    let r = Fbutil.inc(6);
    assert.strictEqual(r,7);
  });
  it('dec', () => {
    let r = Fbutil.dec(6);
    assert.strictEqual(r,5);
  });
});
