interface ErrorPayload {
  detail?: string | Array<{ msg?: string }>
}

export async function parseApiError(response: Response, fallbackMessage: string): Promise<string> {
  try {
    const payload = (await response.json()) as ErrorPayload

    if (typeof payload.detail === "string") {
      return payload.detail
    }

    if (Array.isArray(payload.detail) && payload.detail.length > 0) {
      const firstMessage = payload.detail[0]?.msg
      if (firstMessage) {
        return firstMessage
      }
    }
  } catch {
    return fallbackMessage
  }

  return fallbackMessage
}
