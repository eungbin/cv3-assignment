import type { BroadcastType } from '../types.js'

const ASSIGNMENT_URLS: Record<BroadcastType, string> = {
  lb: 'https://live.ecomm-data.com/assignment?type=lb',
  hs: 'https://live.ecomm-data.com/assignment?type=hs',
}

const REQUEST_TIMEOUT_MS = 10_000

export type AssignmentHtmlFetcher = (type: BroadcastType) => Promise<string>

export class AssignmentFetchError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'AssignmentFetchError'
  }
}

export const fetchAssignmentHtml: AssignmentHtmlFetcher = async (type) => {
  try {
    const response = await fetch(ASSIGNMENT_URLS[type], {
      headers: {
        accept: 'text/html',
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      throw new AssignmentFetchError(
        `원본 페이지가 HTTP ${response.status}로 응답했습니다.`,
      )
    }

    const html = await response.text()

    if (html.trim() === '') {
      throw new AssignmentFetchError('원본 페이지의 HTML이 비어 있습니다.')
    }

    return html
  } catch (error) {
    if (error instanceof AssignmentFetchError) {
      throw error
    }

    throw new AssignmentFetchError('원본 페이지를 가져오지 못했습니다.', {
      cause: error,
    })
  }
}
