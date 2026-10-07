import * as crypto from 'crypto';
import sharp from 'sharp';

// Parse command line arguments
// Usage: npx tsx load-test.ts <numRequests> <maxStringLength>
const args = process.argv.slice(2);
const baseUrl = 'http://localhost:10000/api';
const numRequests = parseInt(args[0], 10) || 10;
const maxStringLength = parseInt(args[1], 10) || 64;

/**
 * Generates a random string with a random length between 1 and maxLen.
 */
function generateRandomString(maxLen: number): string {
  const currentLength = Math.floor(Math.random() * maxLen) + 1;
  return crypto
    .randomBytes(Math.ceil(currentLength / 2))
    .toString('hex')
    .slice(0, currentLength);
}

/**
 * Generates a URL with massive query parameters.
 */
function generateLongUrl(base: string, maxLen: number): string {
  const urlObj = new URL(base);
  const paramCount = Math.floor(Math.random() * 10) + 5; // 5 to 14 query params

  for (let i = 0; i < paramCount; i++) {
    urlObj.searchParams.append(
      `q_${generateRandomString(4)}`,
      generateRandomString(maxLen)
    );
  }

  // Add an extra heavy payload parameter
  urlObj.searchParams.append('heavyPayload', generateRandomString(maxLen * 2));
  return urlObj.toString();
}

/**
 * Generates a record of random custom headers.
 */
function generateRandomHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const headerCount = Math.floor(Math.random() * 8) + 4; // 4 to 11 custom headers

  for (let i = 0; i < headerCount; i++) {
    headers[`x-custom-${generateRandomString(5)}`] = generateRandomString(16);
  }

  return headers;
}

/**
 * Generates a large randomized Cookie string.
 */
function generateRandomCookies(): string {
  const cookieCount = Math.floor(Math.random() * 8) + 4; // 4 to 11 cookies
  const cookies: string[] = [];

  for (let i = 0; i < cookieCount; i++) {
    cookies.push(`${generateRandomString(5)}=${generateRandomString(12)}`);
  }

  return cookies.join('; ');
}

/**
 * Sends a single HTTP request with randomized methods, heavy query params, headers, cookies, and payloads.
 */
async function sendRequest(
  targetBaseUrl: string,
  id: number,
  maxLen: number
): Promise<void> {
  const start = performance.now();

  // Randomize HTTP Method (GET vs POST)
  const method = Math.random() < 0.5 ? 'GET' : 'POST';
  const targetUrl = generateLongUrl(targetBaseUrl, maxLen);

  // Base headers + random custom headers + cookies
  const headers: Record<string, string> = {
    'X-Request-ID': id.toString(),
    Cookie: generateRandomCookies(),
    ...generateRandomHeaders(),
  };

  let body: Buffer | string | undefined = undefined;
  let description = `${method} | `;

  if (method === 'POST') {
    // 50% chance for image vs text payload on POST requests
    const isImageRequest = Math.random() < 0.5;

    if (isImageRequest) {
      const width = Math.floor(Math.random() * 300) + 100;
      const height = Math.floor(Math.random() * 300) + 100;

      const imageBuffer = await sharp({
        create: {
          width,
          height,
          channels: 3,
          background: {
            r: Math.floor(Math.random() * 256),
            g: Math.floor(Math.random() * 256),
            b: Math.floor(Math.random() * 256),
          },
        },
      })
        .png()
        .toBuffer();

      headers['Content-Type'] = 'image/png';
      body = imageBuffer;
      description += `Image (${width}x${height} PNG, ${imageBuffer.length} bytes)`;
    } else {
      const randomData = generateRandomString(maxLen);
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify({
        requestId: id,
        payloadLength: randomData.length,
        payload: randomData,
        timestamp: Date.now(),
      });
      description += `JSON Text (${randomData.length} chars)`;
    }
  } else {
    description += `Query-only / Empty Body`;
  }

  try {
    const response = await fetch(targetUrl, {
      method,
      headers,
      body: method === 'POST' ? body : undefined, // Standard fetch behavior: GET shouldn't contain a body
    });

    const duration = (performance.now() - start).toFixed(2);
    console.log(
      `[Request #${id}] ${description} | Status: ${response.status} | Duration: ${duration}ms`
    );
  } catch (error: any) {
    const duration = (performance.now() - start).toFixed(2);
    console.error(
      `[Request #${id}] Failed after ${duration}ms: ${error.message}`
    );
  }
}

async function main() {
  if (isNaN(numRequests) || isNaN(maxStringLength)) {
    console.error(
      'Error: numRequests and maxStringLength must be valid numbers.'
    );
    console.log('Usage: npx tsx load-test.ts <numRequests> <maxStringLength>');
    process.exit(1);
  }

  console.log(`\n--- Advanced Load Test Configuration ---`);
  console.log(`Target Base URL:   ${baseUrl}`);
  console.log(`Total Requests:    ${numRequests}`);
  console.log(`Max Length Factor: ${maxStringLength}`);
  console.log(
    `Features:          GET/POST Randomization, Heavy Query Parameters, Random Custom Headers, Large Cookies, Mixed Text/Image Payloads`
  );
  console.log(`----------------------------------------\n`);

  const startTime = performance.now();
  const requestPromises: Promise<void>[] = [];

  for (let i = 1; i <= numRequests; i++) {
    requestPromises.push(sendRequest(baseUrl, i, maxStringLength));
  }

  await Promise.all(requestPromises);

  const totalDuration = ((performance.now() - startTime) / 1000).toFixed(2);
  console.log(`\nCompleted ${numRequests} requests in ${totalDuration}s.`);
}

main();
