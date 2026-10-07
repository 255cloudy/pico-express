import CustomTcpServer from '../../../server.ts';
import type { dataCallbachFn, closeCallbachFn } from '../../../server.ts';

// do the server stuff
const dataCb: dataCallbachFn = (socket, data) => {
  socket.write(`all good sir string received: ${data}`);
  console.log(`byes read: ${socket.bytesRead}\n  data: ${data}`);
};
const closeCb: closeCallbachFn = (socket) => {
  console.log(` is socket closed ${socket.closed}`);
};
const server = new CustomTcpServer(dataCb, closeCb);
server.startServer('localhost', 10000);
