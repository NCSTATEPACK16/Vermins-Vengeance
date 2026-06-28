import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { GameSnapshot } from '../game/types'
import { loadBestScore, saveBestScore } from '../game/highScorePoints'
import { fetchScores, submitScore } from '../api/leaderboard'
import { GameBoard } from './GameBoard'

type GameOverProps = {
  snapshot: GameSnapshot
  finalScore: number
  levelsCleared: number
  onRetry: () => void
  onHome: () => void
  skin?: 'modern' | 'arcade'
}

export function GameOver({
  snapshot,
  finalScore,
  levelsCleared,
  onRetry,
  onHome,
  skin = 'modern',
}: GameOverProps) {
  const [name, setName] = useState('')
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [rank, setRank] = useState<number | null>(null)
  const [isHighScore, setIsHighScore] = useState(false)
  const [delta, setDelta] = useState(0)
  const didInit = useRef(false)

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    const prev = loadBestScore()
    if (finalScore > prev) {
      setIsHighScore(true)
      setDelta(finalScore - prev)
      saveBestScore(finalScore)
    }
  }, [finalScore])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitState !== 'idle') return
    const trimmed = name.trim().slice(0, 20) || 'Anon'
    setSubmitState('sending')
    try {
      await submitScore({ name: trimmed, score: finalScore, levels_cleared: levelsCleared })
      const scores = await fetchScores(50)
      const pos = scores.findIndex((s) => s.score <= finalScore)
      setRank(pos >= 0 ? pos + 1 : scores.length + 1)
      setSubmitState('done')
    } catch {
      setSubmitState('idle')
    }
  }

  if (skin === 'arcade') {
    return <ArcadeGameOver finalScore={finalScore} isHighScore={isHighScore} onRetry={onRetry} onHome={onHome} />
  }

  return (
    <motion.div
      className="absolute inset-0 z-30 flex h-full w-full flex-col overflow-hidden rounded-[46px] border border-white/[.08] bg-base font-display"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Blurred board background */}
      <div className="absolute inset-0 flex justify-center pt-20 opacity-50 blur-[3px] saturate-[1.1] pointer-events-none">
        <GameBoard
          snapshot={snapshot}
          skin="modern"
          surfaceProps={{ className: 'w-[300px] aspect-square !p-0 !bg-transparent !shadow-none !ring-0' }}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(11,7,16,.55)] via-[rgba(11,7,16,.85)] to-base pointer-events-none" />

      {/* Bottom sheet */}
      <div className="relative flex h-full flex-col justify-end p-[26px]">
        <motion.div
          className="rounded-[30px] border border-white/10 bg-[rgba(20,16,28,.92)] px-6 pb-[22px] pt-[26px] shadow-sheet backdrop-blur-lg"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.1 }}
        >
          <div className="mb-[18px] flex justify-center">
            <span className="block h-[5px] w-[42px] rounded-full bg-white/[.18]" />
          </div>

          <div className="text-center">
            <h1 className="text-[28px] font-bold tracking-[-.01em] text-ink">Game Over</h1>
            <p className="mt-1 text-[13px] font-medium text-muted">
              Cornered on level {snapshot.level}
            </p>
          </div>

          <div className="mt-[22px] flex gap-3">
            <div className="flex-1 rounded-[18px] border border-cyan/25 bg-cyan/[.08] px-2 py-4 text-center">
              <div className="font-mono text-[9px] tracking-[.2em] text-cyan-soft">SCORE</div>
              <div className="mt-0.5 font-mono text-[28px] font-bold tabular-nums text-ink">
                {finalScore.toLocaleString()}
              </div>
            </div>
            <div className="flex-1 rounded-[18px] border border-gold/25 bg-gold/[.08] px-2 py-4 text-center">
              <div className="font-mono text-[9px] tracking-[.2em] text-gold">RANK</div>
              <div className="mt-0.5 font-mono text-[28px] font-bold tabular-nums text-ink">
                {submitState === 'done' && rank !== null ? `#${rank}` : '—'}
              </div>
            </div>
          </div>

          {isHighScore && (
            <p className="mt-[10px] text-center text-xs font-semibold text-cyan-soft">
              ▲ New personal best · +{delta.toLocaleString()}
            </p>
          )}

          {submitState !== 'done' ? (
            <form onSubmit={handleSubmit} className="mt-5">
              <label className="mb-2 block font-mono text-[11px] tracking-[.16em] text-muted-2">
                DISPLAY NAME
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                className="w-full rounded-xl border border-cyan/45 bg-white/5 px-4 py-[14px] font-semibold text-ink ring-4 ring-cyan/10 outline-none focus:border-cyan"
              />
              <button
                type="submit"
                disabled={submitState === 'sending'}
                className="mt-[18px] w-full rounded-pill bg-cyan py-[17px] font-bold text-[#06222a] shadow-[0_12px_28px_-8px_rgba(33,230,255,.8)] transition active:scale-95 disabled:opacity-60"
              >
                {submitState === 'sending' ? 'Saving…' : 'Submit Score'}
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={onRetry}
              className="mt-[18px] w-full rounded-pill bg-cyan py-[17px] font-bold text-[#06222a] shadow-[0_12px_28px_-8px_rgba(33,230,255,.8)] transition active:scale-95"
            >
              Play Again
            </button>
          )}

          <button
            type="button"
            onClick={onHome}
            className="mt-[10px] w-full rounded-pill py-[14px] font-semibold text-muted transition active:scale-95"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    </motion.div>
  )
}

function ArcadeGameOver({
  finalScore,
  isHighScore,
  onRetry,
  onHome,
}: {
  finalScore: number
  isHighScore: boolean
  onRetry: () => void
  onHome: () => void
}) {
  return (
    <motion.div
      className="absolute inset-0 z-30 flex h-full w-full flex-col items-center overflow-hidden rounded-[28px] border border-magenta/40 bg-base font-display shadow-[0_0_44px_-8px_rgba(255,46,151,.5)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_45%,rgba(11,7,16,.55),#0b0710_80%)]" />
      <div className="scanlines absolute inset-0" />

      <div className="relative flex h-full w-full flex-col items-center px-7 pb-7 pt-[54px]">
        <h1 className="text-glow-mg text-[38px] font-bold tracking-[.04em] text-magenta">
          GAME OVER
        </h1>
        <p className="mt-1.5 font-mono text-[11px] tracking-[.3em] text-muted">
          THE CATS GOT YOU
        </p>

        <div className="mt-[30px] text-center">
          <div className="font-mono text-[10px] tracking-[.3em] text-cyan-soft">FINAL SCORE</div>
          <div className="mt-1 font-mono text-[52px] font-bold tabular-nums text-ink text-glow-cy">
            {finalScore.toLocaleString()}
          </div>
        </div>

        {isHighScore && (
          <div className="animate-vv-pulse mt-4 rounded-pill border border-gold/50 bg-gold/[.12] px-4 py-[7px] font-mono text-[11px] font-bold tracking-[.18em] text-gold">
            ★ NEW HIGH SCORE ★
          </div>
        )}

        {/* Static initials display — not functional in this build */}
        <div className="mt-[26px] text-center">
          <div className="mb-3 font-mono text-[10px] tracking-[.26em] text-muted">
            ENTER YOUR INITIALS
          </div>
          <div className="flex justify-center gap-3">
            {['_', '_', '_'].map((ch, i) => (
              <div
                key={i}
                className="flex h-16 w-[54px] items-center justify-center rounded-xl border-2 border-white/[.14] bg-white/[.04] font-mono text-[32px] font-bold text-muted"
              >
                {ch}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="w-full rounded-2xl bg-magenta py-[17px] text-lg font-bold uppercase tracking-[.14em] text-base shadow-glow-mg transition active:scale-95"
          >
            ↻ Retry
          </button>
          <button
            type="button"
            onClick={onHome}
            className="w-full rounded-2xl border-[1.5px] border-cyan/50 py-[15px] font-semibold uppercase tracking-[.12em] text-cyan transition active:scale-95"
          >
            Main Menu
          </button>
        </div>
      </div>
    </motion.div>
  )
}
