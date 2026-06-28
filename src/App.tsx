import { AnimatePresence } from 'framer-motion'
import { MainMenu } from './components/MainMenu'
import { GameHUD } from './components/GameHUD'
import { LevelTransition } from './components/LevelTransition'
import { GameOver } from './components/GameOver'
import { useGameStore } from './store/gameStore'
import { useCatLoop } from './hooks/useCatLoop'
import { useKeyboard } from './hooks/useKeyboard'

export default function App() {
  const game = useGameStore((s) => s.snapshot)
  const screen = useGameStore((s) => s.screen)
  const bestLevelsCompleted = useGameStore((s) => s.bestLevelsCompleted)
  const initialCatCount = useGameStore((s) => s.initialCatCount)
  const isPaused = useGameStore((s) => s.isPaused)
  const move = useGameStore((s) => s.move)
  const reset = useGameStore((s) => s.reset)
  const start = useGameStore((s) => s.start)
  const toMenu = useGameStore((s) => s.toMenu)
  const nextLevel = useGameStore((s) => s.nextLevel)
  const setPaused = useGameStore((s) => s.setPaused)
  const finalScore = useGameStore((s) => s.finalScore)
  const levelsCleared = useGameStore((s) => s.levelsCleared)

  useCatLoop()
  useKeyboard()

  return (
    <div className="flex min-h-svh items-center justify-center bg-base font-display">
      <div className="relative h-[812px] w-[380px] max-h-[95svh]">
        <AnimatePresence mode="wait">
          {screen === 'menu' && (
            <MainMenu
              key="menu"
              bestLevelsCompleted={bestLevelsCompleted}
              onPlay={start}
              onContinue={start}
            />
          )}
          {screen === 'game' && (
            <GameHUD
              key="game"
              snapshot={game}
              initialCatCount={initialCatCount}
              isPaused={isPaused}
              onPause={() => setPaused(true)}
              onResume={() => setPaused(false)}
              onSwipe={move}
            >
              <AnimatePresence>
                {game.status === 'levelComplete' && (
                  <LevelTransition
                    key="level-transition"
                    level={game.level}
                    score={game.score}
                    onContinue={nextLevel}
                  />
                )}
              </AnimatePresence>
            </GameHUD>
          )}
        </AnimatePresence>

        {/* GameOver covers the full phone frame */}
        <AnimatePresence>
          {screen === 'game' && game.status === 'lost' && (
            <GameOver
              key="game-over"
              snapshot={game}
              finalScore={finalScore()}
              levelsCleared={levelsCleared()}
              onRetry={reset}
              onHome={toMenu}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
