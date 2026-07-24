import type { BroadcastType, CategoryMap } from '../types.js'

const ASSIGNMENT_URLS: Record<BroadcastType, string> = {
  lb: 'https://live.ecomm-data.com/assignment?type=lb',
  hs: 'https://live.ecomm-data.com/assignment?type=hs',
}

const CATEGORY_METADATA_URL =
  'https://live.ecomm-data.com/api/home/gnb'
const REQUEST_TIMEOUT_MS = 10_000

export type AssignmentHtmlFetcher = (type: BroadcastType) => Promise<string>
export type CategoryMapFetcher = () => Promise<CategoryMap>

export class AssignmentFetchError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'AssignmentFetchError'
  }
}

const isCategoryMap = (value: unknown): value is CategoryMap => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  return Object.values(value).every(
    (category) =>
      typeof category === 'object' &&
      category !== null &&
      !Array.isArray(category) &&
      ('pid' in category
        ? category.pid === null || typeof category.pid === 'number'
        : false) &&
      'name' in category &&
      typeof category.name === 'string',
  )
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

export const fetchCategoryMap: CategoryMapFetcher = async () => {
  try {
    const response = await fetch(CATEGORY_METADATA_URL, {
      body: JSON.stringify({}),
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        domain: 'ecomm-data.com',
      },
      method: 'POST',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      throw new AssignmentFetchError(
        `카테고리 메타데이터가 HTTP ${response.status}으로 응답했습니다.`,
      )
    }

    const data: unknown = await response.json()

    if (
      typeof data !== 'object' ||
      data === null ||
      !('cats' in data) ||
      !isCategoryMap(data.cats)
    ) {
      throw new AssignmentFetchError(
        '카테고리 메타데이터의 구조가 올바르지 않습니다.',
      )
    }

    return data.cats
  } catch (error) {
    if (error instanceof AssignmentFetchError) {
      throw error
    }

    throw new AssignmentFetchError(
      '카테고리 메타데이터를 가져오지 못했습니다.',
      {
        cause: error,
      },
    )
  }
}
