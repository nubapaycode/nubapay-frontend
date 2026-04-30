/** Wrapper único para poder mockear `fetch` en tests (Jest/jsdom). */
export function browserFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, init)
}
