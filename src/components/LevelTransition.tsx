import { motion } from 'framer-motion'

type LevelTransitionProps = {
  level: number
  score: number
  onContinue: () => void
}

/** Overlay shown over the board when a level is cleared. */
export function LevelTransition({ level, score, onContinue }: LevelTransitionProps) {
  return (
    <motion.div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 rounded-3xl bg-base/80 backdrop-blur-sm font-display"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className="flex flex-col items-center gap-1 text-center"
        initial={{ scale: 0.8, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 20 }}
      >
        <p className="font-mono text-[11px] uppercase tracking-[.3em] text-cyan-soft">
          Level Cleared
        </p>
        <p className="font-mono text-3xl font-bold text-ink">Level {level}</p>
        <p className="font-mono text-sm tabular-nums text-muted">{score.toLocaleString()} pts</p>
      </motion.div>

      <motion.button
        type="button"
        onClick={onContinue}
        whileTap={{ scale: 0.96 }}
        className="rounded-pill border border-cyan/50 bg-cyan/[.12] px-6 py-[13px] font-semibold text-cyan-soft shadow-glow-cy-soft transition active:scale-95"
      >
        Continue to level {level + 1}
      </motion.button>
    </motion.div>
  )
}
