import { findHeader } from './parserUtils';

enum State {
  PARSE_METHOD = 'method',
  PARSE_URL = 'url',
  PARSE_VERSION = 'version',
  PARSE_HEADER_KEY = 'key',
  PARSE_HEADER_VALUE = 'value',
  PARSE_BODY = 'body',
  HEADER_DONE = 'done',
  CSRF_ENTER = 'I',
  CSRF_OUT = 'O',
  REQUEST_FINISHED = 'complete',
  BODY_FINISHED = 'body_complete',
}
export const postable = ['POST', 'PUT', 'PATCH', 'QUERY'];

export type Header = Record<string, string>;
const isAlphabetic = (str: string): boolean => /^[A-Za-z]+$/.test(str);

class Parser {
  public state = State.PARSE_METHOD;
  public tokens: Record<string, string | Header[] | Buffer> = {};
  private currTokValue: string = '';
  private crlf = '';
  private headerKey = '';
  private headerBuffer: Header[] = [];
  private bodyBuffer: Uint8Array[] = [];
  private headlength: number = 0;
  private bodyLength: number = 0;

  public feed(bytes: Uint8Array) {
    for (let i = 0; i < bytes.length; i++) {
      // possible eror that needs to be handled
      const currChar = String.fromCharCode(bytes[i]);

      switch (this.state) {
        case State.PARSE_METHOD:
          if (currChar === ' ') {
            this.tokens[this.state] = this.currTokValue;
            this.state = State.PARSE_URL;
            this.currTokValue = '';
          } else this.currTokValue += currChar;
          this.headlength++;
          break;

        case State.PARSE_URL:
          if (currChar === ' ') {
            this.tokens[this.state] = this.currTokValue;
            this.state = State.PARSE_VERSION;
            this.currTokValue = '';
          } else this.currTokValue += currChar;
          this.headlength++;
          break;

        case State.PARSE_VERSION:
          if (currChar === '\r') {
            this.headlength++;
            continue;
          }
          if (currChar === '\n') {
            this.tokens[this.state] = this.currTokValue;
            // console.log(this.tokens['version']);
            this.state = State.PARSE_HEADER_KEY;
            this.currTokValue = '';
          } else this.currTokValue += currChar;
          this.headlength++;
          break;

        case State.PARSE_HEADER_KEY:
          if (currChar === ':') {
            this.state = State.PARSE_HEADER_VALUE;
            this.headerKey = this.currTokValue;
            this.currTokValue = '';
          } else this.currTokValue += currChar;
          this.headlength++;
          break;

        case State.PARSE_HEADER_VALUE:
          if ((this.crlf + currChar).includes('\r\n\r\n')) {
            // this.crlf = '';
            this.headerBuffer.push({
              [this.headerKey]: this.currTokValue,
            });
            this.tokens['headers'] = this.headerBuffer;
            this.state = State.HEADER_DONE;
          }
          if (this.crlf.includes('\r\n') && isAlphabetic(currChar)) {
            this.crlf = '';
            this.headerBuffer.push({
              [this.headerKey]: this.currTokValue,
            });
            // look at this error at a point
            // this.currTokValue = ''.concat(currChar);
            this.currTokValue = '';
            this.state = State.PARSE_HEADER_KEY;
          }
          if (currChar === '\r' || currChar === '\n') {
            this.crlf += currChar;
          } else {
            this.currTokValue += currChar;
          }
          this.headlength++;
          break;

        case State.HEADER_DONE:
          // probbably get going on the whole body parsing
          this.state = State.PARSE_BODY;
          i--;
          break;

        case State.PARSE_BODY:
          const method = this.tokens['method'];
          if (method === 'GET') {
            this.state = State.BODY_FINISHED;
            break;
          }

          const contentLength = findHeader(
            this.tokens['headers'] as Header[],
            (h) => 'Content-Length' in h
          );

          if (method && postable.find((m) => m === method) && contentLength) {
            const ctLen = Number(contentLength['Content-Length']);
            const bytesNeeded = ctLen - this.bodyLength;
            const bytesAvailable = bytes.length - i;
            const bytesToTake = Math.min(bytesNeeded, bytesAvailable);
            if (bytesToTake > 0) {
              const chunk = bytes.subarray(i, i + bytesToTake);
              this.bodyBuffer.push(chunk);
              this.bodyLength += chunk.length + 1;
              i += chunk.length;
            }
            if (this.bodyLength >= ctLen) {
              this.state = State.BODY_FINISHED;
              this.tokens['body'] = Buffer.concat(this.bodyBuffer);
            }
          } else {
            this.state = State.BODY_FINISHED;
          }
          break;
      }
    }
  }
}

export { Parser, State };
