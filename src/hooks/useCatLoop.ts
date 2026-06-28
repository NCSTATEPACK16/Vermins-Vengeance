import { useEffect } from 'react'
import { catTickMsForLevel } from '../game/catSpeed'
import { getLevelConfig } from '../game/levels'
import { useGameStore } from '../store/gameStore'

export function useCatLoop(): void {
  const status = useGameStore((s) => s.snapshot.status)
  const level = useGameStore((s) => s.snapshot.level)
  const screen = useGameStore((s) => s.screen)
  const isPaused = useGameStore((s) => s.isPaused)
  const tickCats = useGameStore((s) => s.tickCats)

  useEffect(() => {
    if (screen !== 'game' || status !== 'playing' || isPaused) return
    const multiplier = getLevelConfig(level).tickMultiplier ?? 1
    const ms = Math.round(catTickMsForLevel(level) * multiplier)
    const id = window.setInterval(tickCats, ms)
    return () => window.clearInterval(id)
  }, [screen, status, level, tickCats, isPaused])
}
