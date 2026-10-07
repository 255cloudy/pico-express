// Core net.Server TCP listener & connection manager

import net, { Socket } from 'net';
import BasicParser from './parser/basicParser.ts';

export type dataCallbachFn = (socket: Socket, chunk: Buffer) => void;
export type closeCallbachFn = (socket: Socket) => void;

class tcpBuffer {
  private chunks: Buffer[] = [];
  public totalLength: number = 0;

  public push(chunk: Buffer) {
    this.chunks.push(chunk);
    this.totalLength += chunk.length;
  }

  public flush() {
    this.chunks = [];
    this.totalLength = 0;
  }

  public concat() {
    return Buffer.concat(this.chunks);
  }

  public [Symbol.iterator]() {
    return this.chunks[Symbol.iterator]();
  }
}

class CustomTcpServer {
  private tcpIpServer: net.Server;
  private datacallback: dataCallbachFn;
  private closecallback: closeCallbachFn;
  private currentBuffer: tcpBuffer;
  constructor(datacallback: dataCallbachFn, closeCallback: closeCallbachFn) {
    this.currentBuffer = new tcpBuffer();
    this.datacallback = datacallback;
    this.closecallback = closeCallback;
    this.tcpIpServer = net.createServer((socket) => {
      //lets set the thing to convert the buffer  to utf-8 strings for testing only
      //   socket.setEncoding('utf-8');
      const parser = new BasicParser();
      socket.on('data', (chunk) => {
        // im supposed to do something here to initiate the framework stuff and handle develeoper stuff
        // console.log(`Received from client: ${data}`);
        // const stringedBuffer = Buffer.isBuffer(data) ? String(data) : data;
        // datacallback(socket, data as Buffer);
        this.currentBuffer.push(chunk as Buffer);
        console.log(`chunk length: ${chunk.length}`);
        // datacallback(socket, chunk as Buffer);
        parser.push(chunk as Buffer);
        if (parser.containsRequestLine()) {
          console.log(`yaaaay got the request line: ${parser.currString}`);
        }
        if (parser.containsHeaders()) {
          console.log(`yaaaay got the headers: ${parser.currString}`);
        }
        if (parser.containsBody()) {
          console.log(`yaaaay got the body line: ${parser.currString}`);
        } else {
          console.log('no body here ');
        }
      });

      socket.on('end', () => {
        // this will handle the gracefull shutdowns and the rest
        closeCallback(socket);
        console.log('Client disconnected');
      });

      // Handle errors
      socket.on('error', (err) => {
        // im sure this will be necessary for some reason
        closeCallback(socket);
        console.error('Socket error:', err);
      });
    });
  }
  startServer(host: string, port: number) {
    this.tcpIpServer.listen((port = port), (host = host));
    console.log(`server started.Listening at ${host}:${port}`);
  }
}

export default CustomTcpServer;
