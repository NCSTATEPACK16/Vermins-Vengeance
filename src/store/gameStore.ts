import { create } from 'zustand'
import {
  continueToNextLevel,
  createInitialState,
  moveMouse,
  stepCats,
} from '../game/rodentEngine'
import {
  loadBestLevelsCompleted,
  saveBestLevelsCompleted,
} from '../game/highScoreLevels'
import { computeScore } from '../game/score'
import type { Direction, GameSnapshot, Tile } from '../game/types'

/** Which top-level UI surface is showing. In-game over/complete use snapshot.status. */
export type Screen = 'menu' | 'game'

export type GameStore = {
  snapshot: GameSnapshot
  bestLevelsCompleted: number
  screen: Screen
  /** Block-push events this run — a leaderboard scoring input. */
  blocksMoved: number
  /** Timestamp (ms) the current run began — drives the time bonus. */
  startedAt: number
  /** Cat count at the start of the current level — drives the HUD progress bar. */
  initialCatCount: number
  /** Whether the game is paused (cats don't tick, input is ignored). */
  isPaused: boolean

  /** Apply a player move (no-op unless currently playing and not paused). */
  move: (dir: Direction) => void
  /** Advance all cats one tick. */
  tickCats: () => void
  /** Continue from a completed level into the next one. */
  nextLevel: () => void
  /** Reset to a fresh level-1 game (stays in-game). */
  reset: () => void
  /** Start a fresh game from the main menu. */
  start: () => void
  /** Return to the main menu. */
  toMenu: () => void
  /** Toggle the paused state. */
  setPaused: (paused: boolean) => void
  /** Final leaderboard score for the current run. */
  finalScore: () => number
  /** Levels fully cleared this run (excludes the level lost on). */
  levelsCleared: () => number
}

export const useGameStore = create<GameStore>((set, get) => ({
  snapshot: createInitialState(),
  bestLevelsCompleted: loadBestLevelsCompleted(),
  screen: 'menu',
  blocksMoved: 0,
  startedAt: Date.now(),
  initialCatCount: createInitialState().cats.length,
  isPaused: false,

  move: (dir) => {
    const { snapshot, isPaused } = get()
    if (snapshot.status !== 'playing' || isPaused) return
    const next = moveMouse(snapshot, dir)
    if (next === snapshot) return
    if (blocksChanged(snapshot.grid, next.grid)) {
      set({ blocksMoved: get().blocksMoved + 1 })
    }
    persistIfCleared(next, set, get)
    set({ snapshot: next })
  },

  tickCats: () => {
    const { snapshot } = get()
    if (snapshot.status !== 'playing') return
    const next = stepCats(snapshot)
    if (next === snapshot) return
    persistIfCleared(next, set, get)
    set({ snapshot: next })
  },

  nextLevel: () => {
    const next = continueToNextLevel(get().snapshot)
    set({ snapshot: next, initialCatCount: next.cats.length, isPaused: false })
  },

  reset: () => {
    const snapshot = createInitialState()
    set({ snapshot, blocksMoved: 0, startedAt: Date.now(), initialCatCount: snapshot.cats.length, isPaused: false })
  },

  start: () => {
    const snapshot = createInitialState()
    set({
      snapshot,
      screen: 'game',
      blocksMoved: 0,
      startedAt: Date.now(),
      initialCatCount: snapshot.cats.length,
      isPaused: false,
    })
  },

  toMenu: () => {
    set({ screen: 'menu', isPaused: false })
  },

  setPaused: (paused) => {
    set({ isPaused: paused })
  },

  levelsCleared: () => {
    const { snapshot } = get()
    return snapshot.status === 'levelComplete' ? snapshot.level : snapshot.level - 1
  },

  finalScore: () => {
    const { snapshot, blocksMoved, startedAt } = get()
    return computeScore({
      levelsCleared: get().levelsCleared(),
      cheesePoints: snapshot.score,
      blocksMoved,
      elapsedMs: Date.now() - startedAt,
    })
  },
}))

function persistIfCleared(
  next: GameSnapshot,
  set: (partial: Partial<GameStore>) => void,
  get: () => GameStore,
): void {
  if (next.status !== 'levelComplete') return
  const best = Math.max(get().bestLevelsCompleted, next.level)
  saveBestLevelsCompleted(best)
  set({ bestLevelsCompleted: best })
}

function blocksChanged(prev: Tile[][], next: Tile[][]): boolean {
  for (let y = 0; y < prev.length; y++) {
    for (let x = 0; x < prev[y].length; x++) {
      if ((prev[y][x] === 'block') !== (next[y][x] === 'block')) return true
    }
  }
  return false
}
