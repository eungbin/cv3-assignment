import { Router } from 'express'
import { BroadcastParseError, parseBroadcastTable } from '../parsers/broadcasts.js'
import {
  AssignmentFetchError,
  fetchAssignmentHtml,
  type AssignmentHtmlFetcher,
} from '../services/assignment.js'
import type { BroadcastType } from '../types.js'

const isBroadcastType = (value: unknown): value is BroadcastType =>
  value === 'lb' || value === 'hs'

export const createBroadcastsRouter = (
  fetchHtml: AssignmentHtmlFetcher = fetchAssignmentHtml,
) => {
  const router = Router()

  router.get('/', async (request, response, next) => {
    const requestedType = request.query.type

    if (requestedType !== undefined && !isBroadcastType(requestedType)) {
      response.status(400).json({ error: 'type은 lb 또는 hs여야 합니다.' })
      return
    }

    const type: BroadcastType = requestedType ?? 'lb'

    try {
      const html = await fetchHtml(type)
      response.json(parseBroadcastTable(html, type))
    } catch (error) {
      if (
        error instanceof AssignmentFetchError ||
        error instanceof BroadcastParseError
      ) {
        response.status(502).json({
          error: '방송 데이터를 가져오지 못했습니다.',
        })
        return
      }

      next(error)
    }
  })

  return router
}
