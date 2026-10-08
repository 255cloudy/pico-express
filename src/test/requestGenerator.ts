import * as fs from 'fs';

function generateHttpRequests(
  filename: string,
  numberOfRequests: number
): void {
  const methods = ['GET', 'POST'];
  const basePaths = [
    '/api/v1/users',
    '/api/v1/products',
    '/api/v1/orders',
    '/search',
    '/checkout',
    '/status',
    '/auth/session',
  ];
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    'PostmanRuntime/7.29.2',
    'curl/7.68.0',
  ];

  const rawRequests: string[] = [];

  for (let i = 0; i < numberOfRequests; i++) {
    const method = methods[Math.floor(Math.random() * methods.length)];
    const randomPath = basePaths[Math.floor(Math.random() * basePaths.length)];

    let path = randomPath;
    if (method === 'GET' && Math.random() > 0.5) {
      path += `?id=${Math.floor(Math.random() * 500)}&active=true`;
    }

    // 1. Define standard request headers
    const headers: string[] = [
      `${method} ${path} HTTP/1.1`,
      `Host: www.example.com`,
      `User-Agent: ${userAgents[Math.floor(Math.random() * userAgents.length)]}`,
      `Accept: */*`,
      `Connection: keep-alive`,
    ];

    let body = '';

    // 2. Add body and content-length for POST requests
    if (method === 'POST') {
      const payload = JSON.stringify({
        item_id: Math.floor(Math.random() * 1000),
        action: 'create',
        timestamp: Date.now(),
      });
      body = payload;
      headers.push(`Content-Type: application/json`);
      headers.push(`Content-Length: ${Buffer.byteLength(body, 'utf8')}`);
    }

    // 3. Assemble the full HTTP message (Headers + empty line separator + optional Body)
    let fullRequest = headers.join('\r\n') + '\r\n\r\n';
    if (body) {
      fullRequest += body;
    }

    rawRequests.push(fullRequest);
  }

  // 4. Join all complete HTTP messages using the '\0' delimiter
  fs.writeFileSync(filename, rawRequests.join('\0'), 'utf-8');
  console.log(
    `Successfully wrote ${numberOfRequests} HTTP requests (with headers) to "${filename}" with '\\0' delimiters.`
  );
}

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error(
    'Usage: npx ts-node generate-requests.ts <filename> <numberOfRequests>'
  );
  console.error('Example: npx ts-node generate-requests.ts requests.txt 20');
  process.exit(1);
}

const filename = args[0];
const numberOfRequests = parseInt(args[1], 10);

if (isNaN(numberOfRequests) || numberOfRequests <= 0) {
  console.error('Error: <numberOfRequests> must be a valid positive number.');
  process.exit(1);
}

generateHttpRequests(filename, numberOfRequests);
