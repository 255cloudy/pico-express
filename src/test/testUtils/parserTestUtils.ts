import { HTTPParser } from 'http-parser-js';
import type { Header } from '../../parser/stateParser.ts';

export interface ParsedRequest {
  shouldKeepAlive: boolean;
  upgrade: boolean;
  method: string;
  url: string;
  versionMajor: number;
  versionMinor: number;
  headers: string[];
  body: Buffer;
  trailers: string[];
}

export interface ParsedResponse {
  shouldKeepAlive: boolean;
  upgrade: boolean;
  statusCode: number;
  statusMessage: string;
  versionMajor: number;
  versionMinor: number;
  headers: string[];
  body: Buffer;
  trailers: string[];
}

export function parseRequest(input: Buffer): ParsedRequest {
  const parser = new HTTPParser(HTTPParser.REQUEST);
  let complete = false;
  let shouldKeepAlive = false;
  let upgrade = false;
  let method = '';
  let url = '';
  let versionMajor = 0;
  let versionMinor = 0;
  let headers: string[] = [];
  let trailers: string[] = [];
  let bodyChunks: Buffer[] = [];

  // Type assertion used for dynamic symbol assignment on the parser object
  (parser as any)[HTTPParser.kOnHeadersComplete] = function (req: any) {
    shouldKeepAlive = req.shouldKeepAlive;
    upgrade = req.upgrade;
    method = HTTPParser.methods[req.method] as string;
    url = req.url;
    versionMajor = req.versionMajor;
    versionMinor = req.versionMinor;
    headers = req.headers;
  };

  (parser as any)[HTTPParser.kOnBody] = function (
    chunk: Buffer,
    offset: number,
    length: number
  ) {
    bodyChunks.push(chunk.slice(offset, offset + length));
  };

  // This is actually the event for trailers, go figure.
  (parser as any)[HTTPParser.kOnHeaders] = function (t: string[]) {
    trailers = t;
  };

  (parser as any)[HTTPParser.kOnMessageComplete] = function () {
    complete = true;
  };

  parser.execute(input);
  parser.finish();

  if (!complete) {
    throw new Error('Could not parse request');
  }

  const body = Buffer.concat(bodyChunks);

  return {
    shouldKeepAlive,
    upgrade,
    method,
    url,
    versionMajor,
    versionMinor,
    headers,
    body,
    trailers,
  };
}

export function packHeaders(headers: string[]) {
  const packedHeaders: Header[] = [];
  if (headers.length % 2 !== 0) {
    console.log('array should be even');
    return undefined;
  }
  for (let i = 0; i < headers.length; i++) {
    packedHeaders.push({
      [headers[i]]: headers[i + 1],
    });
  }
  return packedHeaders;
}

export function parseResponse(input: Buffer): ParsedResponse {
  const parser = new HTTPParser(HTTPParser.RESPONSE);
  let complete = false;
  let shouldKeepAlive = false;
  let upgrade = false;
  let statusCode = 0;
  let statusMessage = '';
  let versionMajor = 0;
  let versionMinor = 0;
  let headers: string[] = [];
  let trailers: string[] = [];
  let bodyChunks: Buffer[] = [];

  (parser as any)[HTTPParser.kOnHeadersComplete] = function (res: any) {
    shouldKeepAlive = res.shouldKeepAlive;
    upgrade = res.upgrade;
    statusCode = res.statusCode;
    statusMessage = res.statusMessage;
    versionMajor = res.versionMajor;
    versionMinor = res.versionMinor;
    headers = res.headers;
  };

  (parser as any)[HTTPParser.kOnBody] = function (
    chunk: Buffer,
    offset: number,
    length: number
  ) {
    bodyChunks.push(chunk.slice(offset, offset + length));
  };

  // This is actually the event for trailers, go figure.
  (parser as any)[HTTPParser.kOnHeaders] = function (t: string[]) {
    trailers = t;
  };

  (parser as any)[HTTPParser.kOnMessageComplete] = function () {
    complete = true;
  };

  parser.execute(input);
  parser.finish();

  if (!complete) {
    throw new Error('Could not parse');
  }

  const body = Buffer.concat(bodyChunks);

  return {
    shouldKeepAlive,
    upgrade,
    statusCode,
    statusMessage,
    versionMajor,
    versionMinor,
    headers,
    body,
    trailers,
  };
}

export function flattenHeaders(headers: Header[]): string[] {
  return headers.flatMap((header) =>
    Object.entries(header).flatMap(([key, value]) => [key.trim(), value.trim()])
  );
}
