import type { ReactNode } from 'react'
import type { GameSnapshot } from '../game/types'
import { GameBoard, MouseGlyph } from './GameBoard'

type GameHUDProps = {
  snapshot: GameSnapshot
  initialCatCount: number
  isPaused: boolean
  onPause: () => void
  onResume: () => void
  onSwipe: (dir: 'up' | 'down' | 'left' | 'right') => void
  skin?: 'modern' | 'arcade'
  children?: ReactNode
}

export function GameHUD({
  snapshot,
  initialCatCount,
  isPaused,
  onPause,
  onResume,
  onSwipe,
  skin = 'modern',
  children,
}: GameHUDProps) {
  const { level, score, cats } = snapshot
  const catsLeft = cats.length
  const progressPct = initialCatCount > 0 ? Math.max(0, (catsLeft / initialCatCount) * 100) : 0

  if (skin === 'arcade') {
    return (
      <ArcadeHUD
        snapshot={snapshot}
        initialCatCount={initialCatCount}
        isPaused={isPaused}
        onPause={onPause}
        onResume={onResume}
        onSwipe={onSwipe}
      >
        {children}
      </ArcadeHUD>
    )
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[46px] border border-white/[.08] bg-gradient-to-b from-[#0e0a16] to-base font-display shadow-[0_24px_60px_-20px_rgba(255,46,151,.25)]">
      {/* Status bar */}
      <div className="flex items-center justify-between px-[30px] pt-4 text-sm font-semibold text-ink">
        <span>9:41</span>
        <span className="inline-block h-[11px] w-[17px] rounded-[3px] border-[1.5px] border-ink" />
      </div>

      <div className="flex flex-1 flex-col px-[26px] pb-[26px] pt-[30px]">
        {/* Top row: level + score + pause */}
        <div className="flex items-center gap-3">
          <div className="rounded-pill border border-cyan/35 bg-cyan/[.12] px-[14px] py-2 font-mono text-[13px] font-bold text-cyan-soft">
            LV {level}
          </div>
          <div className="flex-1 text-center">
            <div className="font-mono text-[9px] tracking-[.24em] text-muted-2">SCORE</div>
            <div className="font-mono text-2xl font-bold tabular-nums text-ink">
              {score.toLocaleString()}
            </div>
          </div>
          <button
            type="button"
            onClick={isPaused ? onResume : onPause}
            className="flex h-[42px] w-[42px] items-center justify-center rounded-[13px] border border-white/10 bg-white/5 font-bold text-ink transition active:scale-95"
            aria-label={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? '▶' : 'II'}
          </button>
        </div>

        {/* Sub-row: lives + cats left */}
        <div className="mt-[18px] flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-[.18em] text-muted">LIVES</span>
          <MouseGlyph size={16} />
          <div className="flex-1" />
          <span className="font-mono text-[10px] tracking-[.14em] text-magenta-soft">
            {catsLeft} CATS LEFT
          </span>
        </div>

        {/* Cats progress bar */}
        <div className="mt-2 h-[4px] overflow-hidden rounded-full bg-white/[.06]">
          <div
            className="h-full bg-gradient-to-r from-magenta to-gold transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Board */}
        <div className="relative flex flex-1 items-center justify-center">
          <GameBoard
            snapshot={snapshot}
            onSwipe={onSwipe}
            skin={skin}
            surfaceProps={{
              tabIndex: 0,
              className: 'w-[328px] aspect-square',
              'aria-label': 'Game board — use arrow keys or swipe to move',
            }}
          />
          {children}
        </div>

        {/* Hint + home indicator */}
        <p className="text-center text-xs font-medium text-muted-2">
          Swipe or use arrow keys to push blocks
        </p>
        <div className="mt-[14px] flex justify-center">
          <span className="block h-[5px] w-32 rounded-full bg-white/30" />
        </div>
      </div>

      {/* Pause overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-5 rounded-[46px] bg-base/80 backdrop-blur-sm">
          <p className="font-mono text-[11px] tracking-[.3em] text-muted">PAUSED</p>
          <button
            type="button"
            onClick={onResume}
            className="rounded-pill bg-cyan px-8 py-[17px] font-bold text-[#06222a] shadow-glow-cy transition active:scale-95"
          >
            Resume
          </button>
        </div>
      )}
    </div>
  )
}

function ArcadeHUD({
  snapshot,
  initialCatCount,
  isPaused,
  onPause,
  onResume,
  onSwipe,
  children,
}: Omit<GameHUDProps, 'skin'>) {
  const { level, score, cats } = snapshot
  const catsLeft = cats.length
  const progressPct = initialCatCount > 0 ? Math.max(0, (catsLeft / initialCatCount) * 100) : 0

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-cyan/30 bg-base font-display shadow-[0_0_40px_-8px_rgba(33,230,255,.4)]">
      <div className="scanlines absolute inset-0 z-[5]" />

      <div className="relative flex flex-1 flex-col px-[22px] pb-[26px] pt-[46px]">
        {/* Stat bar */}
        <div className="flex items-stretch gap-[10px]">
          <div className="flex-1 rounded-chip border border-magenta/30 bg-gradient-to-b from-magenta/[.14] to-magenta/[.04] px-[13px] py-[11px]">
            <div className="font-mono text-[9px] tracking-[.22em] text-magenta-soft">SCORE</div>
            <div className="mt-0.5 font-mono text-[22px] font-bold tabular-nums text-ink">
              {score.toLocaleString()}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-chip bg-magenta px-4 py-2 shadow-glow-mg-soft">
            <div className="font-mono text-[9px] tracking-[.22em] text-base/70">LEVEL</div>
            <div className="font-mono text-2xl font-bold text-base">
              {String(level).padStart(2, '0')}
            </div>
          </div>
          <div className="flex-1 rounded-chip border border-cyan/30 bg-gradient-to-b from-cyan/[.14] to-cyan/[.04] px-[13px] py-[11px]">
            <div className="font-mono text-[9px] tracking-[.22em] text-cyan-soft">CATS</div>
            <div className="mt-0.5 font-mono text-[22px] font-bold tabular-nums text-ink">
              {String(catsLeft).padStart(2, '0')}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 font-mono text-[10px] tracking-[.16em] text-muted">
          <span>CATS LEFT</span>
          <div className="h-[5px] flex-1 overflow-hidden rounded-full bg-white/[.06]">
            <div
              className="h-full bg-gradient-to-r from-magenta to-gold transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          <GameBoard
            snapshot={snapshot}
            onSwipe={onSwipe}
            skin="arcade"
            surfaceProps={{
              tabIndex: 0,
              className: 'w-[336px] aspect-square',
              'aria-label': 'Game board — use arrow keys or swipe to move',
            }}
          />
          {children}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={isPaused ? onResume : onPause}
            className="flex h-[50px] w-[50px] items-center justify-center rounded-[14px] border border-white/10 bg-white/5 text-lg font-bold text-ink transition active:scale-95"
          >
            {isPaused ? '▶' : 'II'}
          </button>
          <div className="flex-1 text-center font-mono text-[11px] tracking-[.18em] text-muted-2">
            SWIPE TO PUSH BLOCKS
          </div>
          <div className="flex gap-[5px]">
            <span className="h-[14px] w-[14px] rounded bg-cyan" />
            <span className="h-[14px] w-[14px] rounded bg-magenta" />
            <span className="h-[14px] w-[14px] rounded bg-gold" />
          </div>
        </div>
      </div>

      {isPaused && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-5 rounded-[28px] bg-base/80 backdrop-blur-sm">
          <p className="font-mono text-[11px] tracking-[.3em] text-muted">PAUSED</p>
          <button
            type="button"
            onClick={onResume}
            className="rounded-2xl bg-magenta px-8 py-[17px] font-bold uppercase tracking-[.14em] text-base shadow-glow-mg transition active:scale-95"
          >
            Resume
          </button>
        </div>
      )}
    </div>
  )
}
