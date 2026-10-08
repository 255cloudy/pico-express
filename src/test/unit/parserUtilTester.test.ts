import test, { describe } from 'node:test';
import { findHeader } from '../../parser/parserUtils.ts';
import type { Header } from '../../parser/stateParser.ts';
import assert from 'node:assert';

describe('Test for parser utility functions', () => {
  test('test that (findHeader ) function can get a header', () => {
    const allHeaders: Header[] = [
      { 'content-type': 'application/json' },
      { authorization: 'Bearer token123' },
      { host: 'localhost:3000' },
    ];
    const authHeader = findHeader(allHeaders, (h) => 'authorization' in h);
    if (authHeader) {
      assert.equal(authHeader['authorization'], 'Bearer token123');
    }
  });
});
