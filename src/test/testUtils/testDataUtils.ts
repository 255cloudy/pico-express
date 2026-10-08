import * as fs from 'fs';
function splitBufferByByte(buffer: Buffer, targetByte: number = 0): Buffer[] {
  const parts: Buffer[] = [];
  let start = 0;
  let index = buffer.indexOf(targetByte, start);

  while (index !== -1) {
    // Only push if it's a non-empty chunk (handles consecutive null bytes gracefully)
    if (index > start) {
      parts.push(buffer.subarray(start, index));
    }
    start = index + 1;
    index = buffer.indexOf(targetByte, start);
  }

  // Grab any remaining data after the final delimiter
  if (start < buffer.length) {
    parts.push(buffer.subarray(start));
  }

  return parts;
}

export function readNullDelimitedRequests(filePath: string) {
  console.log(`Reading file: ${filePath}`);

  // 1. Read the entire file as a raw binary Buffer
  const fileBuffer = fs.readFileSync(filePath);

  // 2. Split the buffer by the null byte (\0 -> 0x00)
  const rawRequests = splitBufferByByte(fileBuffer, 0x00);

  return rawRequests;
}
