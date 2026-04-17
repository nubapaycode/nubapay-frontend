export class FetchError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'FetchError'
    this.status = status
  }
}

export async function fetcher<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    throw new FetchError(`HTTP error ${res.status}`, res.status)
  }
  return res.json() as Promise<T>
}
