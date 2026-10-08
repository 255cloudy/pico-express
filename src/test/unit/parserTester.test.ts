import { describe, test, before } from 'node:test';
import { readNullDelimitedRequests } from '../testUtils/testDataUtils.ts';
import { parseRequest } from '../testUtils/parserTestUtils.ts';
import type { ParsedRequest } from '../testUtils/parserTestUtils.ts';
import { Parser } from '../../parser/stateParser.ts';
import type { Header } from '../../parser/stateParser.ts';
import assert from 'node:assert';
import { cwd } from 'node:process';
import { flattenHeaders } from '../testUtils/parserTestUtils.ts';

describe('See if our parser can parse the request line ', () => {
  let requests: Buffer[];

  before(
    // use my utils to get a few requests
    () => {
      requests = readNullDelimitedRequests(
        `${cwd()}/src/test/testData/small-requests.txt`
      );
      //   preParsedRequests = [...requests.map((req) => parseRequest(req))];
    }
  );

  test('correct method parsed', () => {
    for (let i = 0; i < requests.length; i++) {
      const myParser = new Parser();
      myParser.feed(requests[i]);
      const correctRequest = parseRequest(requests[i]);
      //   console.log(`------------------------ ${i}--------------------------`);
      //   console.log(myParser.tokens);
      //   console.log(correctRequest);
      //   console.log(`------------------------ ${i}--------------------------`);
      assert.equal(myParser.tokens['method'], correctRequest.method);
    }
  });
  test('correct path parsed', () => {
    for (let i = 0; i < requests.length; i++) {
      const myParser = new Parser();
      myParser.feed(requests[i]);
      const correctRequest = parseRequest(requests[i]);
      //   console.log(`------------------------ ${i}--------------------------`);
      //   console.log(myParser.tokens);
      //   console.log(correctRequest);
      //   console.log(`------------------------ ${i}--------------------------`);
      assert.equal(myParser.tokens['url'], correctRequest.url);
    }
  });

  test('correct version parsed', () => {
    for (let i = 0; i < requests.length; i++) {
      const myParser = new Parser();
      myParser.feed(requests[i]);
      const correctRequest = parseRequest(requests[i]);
      //   console.log(`------------------------ ${i}--------------------------`);
      //   console.log(myParser.tokens);
      //   console.log(correctRequest);
      //   console.log(`------------------------ ${i}--------------------------`);
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
      //   console.log(`------------------------ ${i}--------------------------`);
      //   console.log(myParser.tokens);
      //   console.log(correctRequest);
      //   console.log(`------------------------ ${i}--------------------------`);
      const flat = flattenHeaders(myParser.tokens['headers'] as Header[]);
      assert.deepStrictEqual(flat, correctRequest.headers);
    }
  });
});
