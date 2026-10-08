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
          break;

        case State.PARSE_URL:
          if (currChar === ' ') {
            this.tokens[this.state] = this.currTokValue;
            this.state = State.PARSE_VERSION;
            this.currTokValue = '';
          } else this.currTokValue += currChar;
          break;

        case State.PARSE_VERSION:
          if (currChar === '\r') {
            continue;
          }
          if (currChar === '\n') {
            this.tokens[this.state] = this.currTokValue;
            // console.log(this.tokens['version']);
            this.state = State.PARSE_HEADER_KEY;
            this.currTokValue = '';
          } else this.currTokValue += currChar;
          break;

        case State.PARSE_HEADER_KEY:
          if (currChar === ':') {
            this.state = State.PARSE_HEADER_VALUE;
            this.headerKey = this.currTokValue;
            this.currTokValue = '';
          } else this.currTokValue += currChar;
          break;

        case State.PARSE_HEADER_VALUE:
          if (this.crlf.includes('\r\n\r\n')) {
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
          break;

        case State.HEADER_DONE:
          // probbably get going on the whole body parsing
          this.state = State.PARSE_BODY;
          break;

        case State.PARSE_BODY:
          const contentLength = findHeader(
            this.tokens['headers'] as Header[],
            (h) => 'Content-Length' in h
          );
          console.log(contentLength);
          if (this.tokens['method'] === 'POST' && contentLength) {
            // console.log(`the character is ${String.fromCharCode(bytes[i])}`);
            const ctLen = Number(contentLength['Content-Length']);
            if (this.bodyLength <= ctLen) {
              this.bodyBuffer.push(bytes);
              this.bodyLength += bytes.length;
            } else {
              this.state = State.BODY_FINISHED;
              this.tokens['body'] = Buffer.concat(this.bodyBuffer);
            }
          }
      }
    }
  }
}

export { Parser, State };
