const rawBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL?.trim()

if (!rawBaseUrl && import.meta.env.DEV) {
  throw new Error(
    "Missing VITE_BACKEND_BASE_URL. Add it to frontend/.env (for example: http://127.0.0.1:8000).",
  )
}

const BASE = (rawBaseUrl ?? "").replace(/\/+$/, "")

export function buildApiUrl(path: string): string {
  const normalizedPath = path.replace(/^\/+/, "")

  if (!BASE) {
    return `/${normalizedPath}`
  }

  return `${BASE}/${normalizedPath}`
}
