import type { BroadcastTable as BroadcastTableData } from '../types'

interface BroadcastTableProps {
  table: BroadcastTableData
}

function BroadcastTable({ table }: BroadcastTableProps) {
  if (table.rows.length === 0) {
    return (
      <p className="px-6 py-12 text-center text-sm text-slate-500">
        표시할 방송이 없습니다.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] border-collapse text-left">
        <caption className="sr-only">
          {table.type === 'lb' ? '라이브 방송' : '홈쇼핑'} 순위
        </caption>
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold tracking-wide text-slate-500">
            <th className="w-12 px-3 py-2.5 text-center" scope="col">
              순위
            </th>
            <th className="min-w-60 px-3 py-2.5" scope="col">
              방송정보
            </th>
            <th className="w-28 px-3 py-2.5 whitespace-nowrap" scope="col">
              분류
            </th>
            <th className="w-28 px-3 py-2.5" scope="col">
              방송시간
            </th>
            <th className="w-24 px-3 py-2.5 text-right" scope="col">
              {table.audienceLabel}
            </th>
            <th className="w-24 px-3 py-2.5 text-right" scope="col">
              판매량
            </th>
            <th className="w-24 px-3 py-2.5 text-right" scope="col">
              매출액
            </th>
            <th className="w-20 px-3 py-2.5 text-right" scope="col">
              상품수
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {table.rows.map((row) => (
            <tr
              className="bg-white transition-colors hover:bg-amber-50/40"
              key={`${row.rank}-${row.title}`}
            >
              <td className="px-3 py-2.5 text-center text-xs font-bold text-slate-900">
                {row.rank}
              </td>
              <td className="px-3 py-2.5">
                <p className="max-w-md text-xs font-semibold leading-4 text-slate-900">
                  {row.title}
                </p>
                <p className="mt-0.5 text-[11px] leading-4 text-slate-500">
                  {row.platform}
                </p>
              </td>
              <td className="px-3 py-2.5 text-xs whitespace-nowrap text-slate-600">
                {row.category}
              </td>
              <td className="px-3 py-2.5 text-[11px] leading-4 text-slate-600">
                {row.broadcastTime.map((time) => (
                  <span className="block whitespace-nowrap" key={time}>
                    {time}
                  </span>
                ))}
              </td>
              <td className="px-3 py-2.5 text-right text-xs text-slate-700">
                {row.audience}
              </td>
              <td className="px-3 py-2.5 text-right text-xs text-slate-700">
                {row.sales}
              </td>
              <td className="px-3 py-2.5 text-right text-xs font-medium text-slate-900">
                {row.revenue}
              </td>
              <td className="px-3 py-2.5 text-right text-xs text-slate-700">
                {row.productCount}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default BroadcastTable
