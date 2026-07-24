import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import BroadcastTable from './components/BroadcastTable'
import type { BroadcastTable as BroadcastTableData, BroadcastType } from './types'

type RequestStatus = 'idle' | 'error'

const BROADCAST_TYPES: Array<{ label: string; value: BroadcastType }> = [
  { label: '라이브 방송', value: 'lb' },
  { label: '홈쇼핑', value: 'hs' },
]

const fetchBroadcasts = async (
  type: BroadcastType,
  signal: AbortSignal,
): Promise<BroadcastTableData> => {
  const response = await fetch(`/api/broadcasts?type=${type}`, { signal })

  if (!response.ok) {
    throw new Error('방송 데이터 요청에 실패했습니다.')
  }

  return (await response.json()) as BroadcastTableData
}

function App() {
  const [selectedType, setSelectedType] = useState<BroadcastType>('lb')
  const [tables, setTables] = useState<
    Partial<Record<BroadcastType, BroadcastTableData>>
  >({})
  const [statuses, setStatuses] = useState<Record<BroadcastType, RequestStatus>>(
    {
      lb: 'idle',
      hs: 'idle',
    },
  )
  const [retryVersion, setRetryVersion] = useState(0)
  const tabRefs = useRef<Partial<Record<BroadcastType, HTMLButtonElement>>>({})

  useEffect(() => {
    const type = selectedType

    if (tables[type]) {
      return
    }

    const controller = new AbortController()

    const loadBroadcasts = async () => {
      try {
        const table = await fetchBroadcasts(type, controller.signal)

        if (controller.signal.aborted) {
          return
        }

        setTables((current) => ({ ...current, [type]: table }))
      } catch {
        if (!controller.signal.aborted) {
          setStatuses((current) => ({ ...current, [type]: 'error' }))
        }
      }
    }

    void loadBroadcasts()

    return () => {
      controller.abort()
    }
  }, [retryVersion, selectedType, tables])

  const selectAdjacentType = (
    currentType: BroadcastType,
    event: KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) {
      return
    }

    event.preventDefault()
    const nextType: BroadcastType = currentType === 'lb' ? 'hs' : 'lb'
    setSelectedType(nextType)
    tabRefs.current[nextType]?.focus()
  }

  const selectedTable = tables[selectedType]
  const selectedStatus = statuses[selectedType]
  const selectedLabel =
    BROADCAST_TYPES.find(({ value }) => value === selectedType)?.label ?? ''

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1440px] px-3 py-5 sm:px-4 sm:py-6 lg:px-6">
        <header className="mb-5 sm:flex sm:items-end sm:justify-between sm:gap-8">
          <div>
            <p className="mb-1 text-xs font-bold tracking-wide text-amber-600">
              CV3 기술 과제
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              방송 데이터
            </h1>
          </div>
          <p className="mt-2 max-w-xl text-xs leading-5 text-slate-600 sm:mt-0 sm:text-right sm:text-sm">
            라방바 데이터랩의 라이브 방송과 홈쇼핑 순위를 확인할 수 있습니다.
          </p>
        </header>

        <section
          aria-labelledby="broadcast-section-title"
          className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2
                className="text-base font-bold text-slate-950"
                id="broadcast-section-title"
              >
                방송 순위
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                유형별 최대 10개의 방송을 보여드립니다.
              </p>
            </div>

            <div
              aria-label="방송 유형"
              className="inline-flex self-start rounded-xl bg-slate-100 p-1"
              role="tablist"
            >
              {BROADCAST_TYPES.map(({ label, value }) => {
                const isSelected = selectedType === value

                return (
                  <button
                    aria-controls="broadcast-panel"
                    aria-selected={isSelected}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    id={`broadcast-tab-${value}`}
                    key={value}
                    onClick={() => setSelectedType(value)}
                    onKeyDown={(event) => selectAdjacentType(value, event)}
                    ref={(element) => {
                      tabRefs.current[value] = element ?? undefined
                    }}
                    role="tab"
                    tabIndex={isSelected ? 0 : -1}
                    type="button"
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div
            aria-labelledby={`broadcast-tab-${selectedType}`}
            aria-live="polite"
            id="broadcast-panel"
            role="tabpanel"
          >
            {selectedTable ? (
              <BroadcastTable table={selectedTable} />
            ) : selectedStatus === 'error' ? (
              <div
                aria-label="방송 데이터를 불러오지 못했습니다."
                className="flex flex-col items-center px-6 py-12 text-center"
                role="alert"
              >
                <span
                  aria-hidden="true"
                  className="mb-4 flex size-11 items-center justify-center rounded-full bg-red-50 text-lg text-red-600"
                >
                  !
                </span>
                <p className="font-semibold text-slate-900">
                  방송 데이터를 불러오지 못했습니다.
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  잠시 후 다시 시도해 주세요.
                </p>
                <button
                  className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                  onClick={() => {
                    setStatuses((current) => ({
                      ...current,
                      [selectedType]: 'idle',
                    }))
                    setRetryVersion((current) => current + 1)
                  }}
                  type="button"
                >
                  다시 시도
                </button>
              </div>
            ) : (
              <div
                aria-label="방송 데이터를 불러오는 중입니다."
                className="flex flex-col items-center px-6 py-12 text-center"
                role="status"
              >
                <span
                  aria-hidden="true"
                  className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-amber-500"
                />
                <p className="mt-4 text-sm font-medium text-slate-600">
                  {selectedLabel} 데이터를 불러오는 중입니다.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
