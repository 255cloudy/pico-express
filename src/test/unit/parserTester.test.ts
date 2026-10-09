import { describe, test, before } from 'node:test';
import { readNullDelimitedRequests } from '../testUtils/testDataUtils.ts';
import { parseRequest } from '../testUtils/parserTestUtils.ts';
// import type { ParsedRequest } from '../testUtils/parserTestUtils.ts';
import { Parser, postable } from '../../parser/stateParser.ts';
import type { Header } from '../../parser/stateParser.ts';
import assert from 'node:assert';
import { cwd } from 'node:process';
import { flattenHeaders } from '../testUtils/parserTestUtils.ts';

describe('See if our parser can parse the request line ', () => {
  let requests: Buffer[];

  before(() => {
    requests = readNullDelimitedRequests(
      `${cwd()}/src/test/testData/small-requests.txt`
    );
  });

  test('correct method parsed', () => {
    for (let i = 0; i < requests.length; i++) {
      const myParser = new Parser();
      myParser.feed(requests[i]);
      const correctRequest = parseRequest(requests[i]);
      assert.equal(myParser.tokens['method'], correctRequest.method);
    }
  });
  test('correct path parsed', () => {
    for (let i = 0; i < requests.length; i++) {
      const myParser = new Parser();
      myParser.feed(requests[i]);
      const correctRequest = parseRequest(requests[i]);
      assert.equal(myParser.tokens['url'], correctRequest.url);
    }
  });

  test('correct version parsed', () => {
    for (let i = 0; i < requests.length; i++) {
      const myParser = new Parser();
      myParser.feed(requests[i]);
      const correctRequest = parseRequest(requests[i]);
      assert.equal(
        myParser.tokens['version'],
        `HTTP/${correctRequest.versionMajor}.${correctRequest.versionMinor}`
      );
    }
  });

  test('correct Headers passed', () => {
    for (let i = 0; i < requests.length; i++) {
      const myParser = new Parser();
      myParser.feed(requests[i]);
      const correctRequest = parseRequest(requests[i]);
      const flat = flattenHeaders(myParser.tokens['headers'] as Header[]);
      assert.deepStrictEqual(flat, correctRequest.headers);
    }
  });
});

describe('Test if parser parses the body correctly', () => {
  let requests: Buffer[];

  before(() => {
    requests = readNullDelimitedRequests(
      `${cwd()}/src/test/testData/small-requests.txt`
    );
  });
  test('body has the same length ', () => {
    for (let i = 0; i < 2; i++) {
      const myParser = new Parser();
      myParser.feed(requests[i]);
      const correctRequest = parseRequest(requests[i]);
      assert.equal(myParser.tokens['method'], correctRequest.method);
      assert.equal(myParser.tokens['method'], 'POST');
      assert.equal(myParser.tokens['body'].length, correctRequest.body.length);
      assert.deepStrictEqual(myParser.tokens['body'], correctRequest.body);
    }
  });
  test('body buffers are the same  ', () => {
    for (let i = 0; i < requests.length; i++) {
      const myParser = new Parser();
      myParser.feed(requests[i]);
      const correctRequest = parseRequest(requests[i]);
      assert.equal(myParser.tokens['method'], correctRequest.method);
      if (postable.find((p) => p === myParser.tokens['method'])) {
        assert.deepStrictEqual(myParser.tokens['body'], correctRequest.body);
      }
    }
  });
});
