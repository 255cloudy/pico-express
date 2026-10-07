// this is just a basic parser that just uses naive string manipulation
class BasicParser {
  private currBuffer: Buffer = Buffer.alloc(0);
  public currString: String = '';

  public push(chunk: Buffer) {
    const totallength = this.currBuffer.length + chunk.length;
    this.currBuffer = Buffer.concat([this.currBuffer, chunk], totallength);
    this.currString = this.currBuffer.toString();
  }

  public containsRequestLine(): Boolean {
    return this.currString.includes('\r\n');
  }
  public containsHeaders(): Boolean {
    return this.currString.includes('\r\n\r\n');
  }
  public containsBody(): Boolean {
    if (this.containsRequestLine() && this.containsHeaders()) {
      const bodyRegex = /\r\n\r\n([\s\S]+)$/;
      return this.currString.match(bodyRegex) ? true : false;
    }
    return false;
  }
}
export default BasicParser;
