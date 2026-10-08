import type { Header } from './stateParser';

export function findHeader(
  headers: Header[],
  predicate: (header: Header) => boolean
): Header | undefined {
  return headers.find(predicate);
}
