import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { fetchScores, type ScoreEntry } from '../api/leaderboard'
import { MouseGlyph } from './GameBoard'

type MainMenuProps = {
  bestLevelsCompleted: number
  onPlay: () => void
  onContinue?: () => void
  skin?: 'modern' | 'arcade'
}

export function MainMenu({ bestLevelsCompleted, onPlay, onContinue, skin = 'modern' }: MainMenuProps) {
  const [top3, setTop3] = useState<ScoreEntry[]>([])

  useEffect(() => {
    fetchScores(3)
      .then(setTop3)
      .catch(() => {/* non-fatal — show empty leaderboard */})
  }, [])

  if (skin === 'arcade') {
    return <ArcadeMenu onPlay={onPlay} onLeaderboard={() => {}} />
  }

  const avatarColor = (i: number) => {
    if (i === 0) return 'bg-gold'
    if (i === 1) return 'bg-magenta'
    return 'bg-cyan'
  }
  const rankColor = (i: number) => {
    if (i === 0) return 'text-gold'
    if (i === 1) return 'text-muted'
    return 'text-cyan'
  }

  return (
    <motion.div
      className="relative flex h-full w-full flex-col overflow-hidden rounded-[46px] border border-white/[.08] bg-gradient-to-b from-[#0e0a16] to-base font-display shadow-[0_24px_60px_-20px_rgba(33,230,255,.3)]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
    >
      {/* Status bar */}
      <div className="flex items-center justify-between px-[30px] pt-4 text-sm font-semibold text-ink">
        <span>9:41</span>
        <span className="inline-block h-[11px] w-[17px] rounded-[3px] border-[1.5px] border-ink" />
      </div>

      <div className="flex flex-1 flex-col px-[26px] pb-[26px] pt-[38px]">
        {/* Logo lockup */}
        <div className="flex items-center gap-[14px]">
          <div className="relative h-[52px] w-[52px] flex-none">
            <MouseGlyph size={52} />
          </div>
          <h1 className="text-[22px] font-bold leading-[1.05] tracking-[-.01em] text-ink">
            Vermin&apos;s<br />Vengeance
          </h1>
        </div>

        <p className="mt-[14px] text-sm leading-relaxed text-muted">
          Push blocks, corner the cats, and climb the weekly ladder.
        </p>

        <button
          type="button"
          onClick={onPlay}
          className="mt-[26px] w-full rounded-pill bg-cyan py-[18px] text-lg font-bold text-[#06222a] shadow-[0_12px_30px_-8px_rgba(33,230,255,.8)] transition active:scale-95"
        >
          Play&nbsp;&nbsp;▸
        </button>

        {bestLevelsCompleted > 0 && onContinue && (
          <button
            type="button"
            onClick={onContinue}
            className="mt-3 w-full rounded-pill border border-white/[.08] bg-white/5 py-[15px] font-semibold text-[#C9BEE6] transition active:scale-95"
          >
            Continue · Level {bestLevelsCompleted + 1}
          </button>
        )}

        {/* Leaderboard card */}
        <div className="mt-[22px] rounded-card border border-white/[.07] bg-white/[.04] px-4 pb-2 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-bold text-ink">Leaderboard</span>
            <span className="font-mono text-[11px] tracking-[.12em] text-magenta-soft">THIS WEEK</span>
          </div>
          {top3.length === 0 ? (
            <p className="py-2 text-center text-xs text-muted-2">Loading scores…</p>
          ) : (
            <ul className="flex flex-col">
              {top3.map((entry, i) => (
                <li
                  key={entry.id}
                  className={`flex items-center gap-3 px-1 py-[9px] ${i === top3.length - 1 ? 'rounded-b-xl bg-cyan/5 px-3' : i === 0 ? '' : 'border-t border-white/5'}`}
                >
                  <span className={`w-5 font-mono text-[13px] font-bold ${rankColor(i)}`}>
                    {i + 1}
                  </span>
                  <span className={`h-[26px] w-[26px] rounded-lg ${avatarColor(i)}`} />
                  <span className="flex-1 text-sm font-semibold text-ink">{entry.name}</span>
                  <span className="font-mono text-[13px] font-bold text-[#C9BEE6]">
                    {entry.score.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-auto flex justify-center pt-[14px]">
          <span className="block h-[5px] w-32 rounded-full bg-white/30" />
        </div>
      </div>
    </motion.div>
  )
}

function ArcadeMenu({ onPlay, onLeaderboard }: { onPlay: () => void; onLeaderboard: () => void }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center overflow-hidden rounded-[28px] border border-magenta/35 bg-[radial-gradient(120%_80%_at_50%_0%,#1a0f24_0%,#0b0710_60%)] font-display shadow-[0_0_40px_-8px_rgba(255,46,151,.45)]">
      <div className="scanlines absolute inset-0" />
      <div className="relative flex h-full w-full flex-col items-center px-[30px] pb-[30px] pt-[54px]">
        <span className="font-mono text-[11px] font-bold tracking-[.42em] text-cyan text-glow-cy">
          ARCADE MODE
        </span>
        <div className="mt-4">
          <MouseGlyph size={46} />
        </div>
        <div className="mt-[30px] text-center">
          <div className="text-chromatic text-[44px] font-bold leading-[.92] tracking-[-.02em] text-ink">
            VERMIN&apos;S
          </div>
          <div className="text-chromatic mt-1 text-[44px] font-bold leading-[.92] tracking-[-.02em] text-ink">
            VENGEANCE
          </div>
        </div>
        <p className="mt-4 text-sm font-medium text-muted">Trap the cats. Rule the maze.</p>

        <div className="mt-auto flex w-full flex-col gap-[14px]">
          <button
            type="button"
            onClick={onPlay}
            className="w-full rounded-2xl bg-magenta py-[18px] text-xl font-bold uppercase tracking-[.14em] text-base shadow-glow-mg transition active:scale-95"
          >
            ▶ Play
          </button>
          <button
            type="button"
            onClick={onLeaderboard}
            className="w-full rounded-2xl border-[1.5px] border-cyan/55 py-4 font-semibold uppercase tracking-[.1em] text-cyan shadow-glow-cy-soft transition active:scale-95"
          >
            ◆ Leaderboard
          </button>
        </div>
      </div>
    </div>
  )
}
