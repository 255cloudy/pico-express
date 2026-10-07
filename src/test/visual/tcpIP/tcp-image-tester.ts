import sharp from 'sharp';

// --- CONFIGURATION ---
const TOTAL_REQUESTS = 10;
const URL = 'http://localhost:10000';
const MIN_SIZE = 16;
const MAX_SIZE = 128;
// ---------------------

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function sendImages() {
  console.log(`Starting to send ${TOTAL_REQUESTS} random images to ${URL}...`);

  for (let i = 1; i <= TOTAL_REQUESTS; i++) {
    const width = getRandomInt(MIN_SIZE, MAX_SIZE);
    const height = getRandomInt(MIN_SIZE, MAX_SIZE);

    // Random background colors for each image
    const r = getRandomInt(0, 255);
    const g = getRandomInt(0, 255);
    const b = getRandomInt(0, 255);

    try {
      // Create a small random-sized PNG buffer using sharp
      const imageBuffer = await sharp({
        create: {
          width: width,
          height: height,
          channels: 3,
          background: { r, g, b },
        },
      })
        .png()
        .toBuffer();

      // Send via native fetch
      const response = await fetch(URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'image/png',
        },
        body: imageBuffer,
      });

      console.log(
        `[${i}/${TOTAL_REQUESTS}] Sent ${width}x${height} PNG (${imageBuffer.length} bytes) - Status: ${response.status}`
      );
    } catch (error) {
      console.error(
        `[${i}/${TOTAL_REQUESTS}] Failed to send request:`,
        error instanceof Error ? error.message : error
      );
      break;
    }
  }

  console.log('Finished sending all images!');
}

sendImages();
