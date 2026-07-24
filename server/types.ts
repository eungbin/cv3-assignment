export type BroadcastType = 'lb' | 'hs'

export interface CategoryMetadata {
  pid: number | null
  name: string
}

export type CategoryMap = Record<string, CategoryMetadata>

export interface BroadcastRow {
  rank: string
  title: string
  platform: string
  category: string
  broadcastTime: string[]
  audience: string
  sales: string
  revenue: string
  productCount: string
}

export interface BroadcastTable {
  type: BroadcastType
  audienceLabel: '조회수' | '시청률'
  rows: BroadcastRow[]
}
