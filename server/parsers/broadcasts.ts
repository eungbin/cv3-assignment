import { load } from 'cheerio'
import type {
  BroadcastRow,
  BroadcastTable,
  BroadcastType,
} from '../types.js'

const MAX_BROADCASTS = 10

const REQUIRED_HEADERS: Record<BroadcastType, string[]> = {
  lb: ['방송정보', '분류', '방송시간', '조회수', '판매량', '매출액', '상품수'],
  hs: ['방송정보', '분류', '방송시간', '시청률', '판매량', '매출액', '상품수'],
}

const normalizeText = (value: string) => value.replace(/\s+/gu, ' ').trim()

export class BroadcastParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BroadcastParseError'
  }
}

export const parseBroadcastTable = (
  html: string,
  type: BroadcastType,
): BroadcastTable => {
  const $ = load(html)
  const table = $('table')
    .filter((_, element) => {
      const headers = $(element)
        .find('thead th')
        .map((__, header) => normalizeText($(header).text()))
        .get()

      return headers.includes('방송정보')
    })
    .first()

  if (table.length === 0) {
    throw new BroadcastParseError('방송정보 테이블을 찾을 수 없습니다.')
  }

  const headers = table
    .find('thead th')
    .map((_, header) => normalizeText($(header).text()))
    .get()
  const requiredHeaders = REQUIRED_HEADERS[type]
  const hasRequiredHeaders = requiredHeaders.every(
    (header, index) => headers[index + 1] === header,
  )

  if (!hasRequiredHeaders) {
    throw new BroadcastParseError(
      '방송정보 테이블의 필수 헤더가 올바르지 않습니다.',
    )
  }

  const rows: BroadcastRow[] = []

  table
    .find('tbody > tr')
    .slice(0, MAX_BROADCASTS)
    .each((index, row) => {
      const cells = $(row).children('td')

      if (cells.length < 8) {
        throw new BroadcastParseError(
          `${index + 1}번째 방송 행의 셀 구성이 올바르지 않습니다.`,
        )
      }

      const informationSpans = cells
        .eq(1)
        .find('a')
        .first()
        .children('span')

      if (informationSpans.length < 2) {
        throw new BroadcastParseError(
          `${index + 1}번째 방송정보의 구성이 올바르지 않습니다.`,
        )
      }

      const platformElement = informationSpans.eq(1).clone()
      platformElement.children().remove()

      const broadcastTime = cells
        .eq(3)
        .find('span')
        .map((_, time) => normalizeText($(time).text()))
        .get()
        .filter(Boolean)

      rows.push({
        rank: normalizeText(cells.eq(0).text()),
        title: normalizeText(informationSpans.eq(0).text()),
        platform: normalizeText(platformElement.text()),
        category: normalizeText(cells.eq(2).text()),
        broadcastTime,
        audience: normalizeText(cells.eq(4).text()),
        sales: normalizeText(cells.eq(5).text()),
        revenue: normalizeText(cells.eq(6).text()),
        productCount: normalizeText(cells.eq(7).text()),
      })
    })

  return {
    type,
    audienceLabel: type === 'lb' ? '조회수' : '시청률',
    rows,
  }
}
