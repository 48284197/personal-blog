type ErrorBody = {
  message?: unknown
  error?: unknown
  issues?: unknown
}

function stringifyIssue(issue: unknown) {
  if (!issue) return ''
  if (typeof issue === 'string') return issue
  try {
    return JSON.stringify(issue)
  } catch {
    return ''
  }
}

export async function getResponseErrorMessage(response: Response, fallback: string) {
  let detail = ''

  try {
    const contentType = response.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const body = (await response.json()) as ErrorBody
      detail =
        (typeof body.message === 'string' && body.message.trim()) ||
        (typeof body.error === 'string' && body.error.trim()) ||
        stringifyIssue(body.issues)
    } else {
      detail = (await response.text()).trim()
    }
  } catch {
    detail = ''
  }

  const status = `${response.status} ${response.statusText}`.trim()
  return detail ? `${fallback}：${detail}（${status}）` : `${fallback}（${status}）`
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}
