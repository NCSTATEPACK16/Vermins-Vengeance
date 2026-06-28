import { useRef, type HTMLAttributes, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { GameSnapshot, Tile } from '../game/types'

type GameBoardProps = {
  snapshot: GameSnapshot
  onSwipe?: (dir: 'up' | 'down' | 'left' | 'right') => void
  skin?: 'modern' | 'arcade'
  surfaceProps?: HTMLAttributes<HTMLDivElement>
}

const SWIPE_THRESHOLD_PX = 30

const moveSpring = { type: 'spring', stiffness: 360, damping: 30, mass: 0.9 } as const

function tileClass(tile: Tile): string {
  const base = 'min-h-0 min-w-0 aspect-square flex items-center justify-center'
  switch (tile) {
    case 'wall':
      return `${base} bg-wall shadow-tile-wall`
    case 'block':
      return `${base} rounded-tile bg-gradient-to-b from-block-top to-block-bottom shadow-tile-block`
    case 'cracked':
      return `${base} relative rounded-tile bg-gradient-to-b from-block-top to-block-bottom opacity-60 shadow-tile-block overflow-hidden`
    case 'empty':
      return `${base} bg-floor ring-1 ring-white/[.02]`
    case 'cheese':
      return `${base} z-10 rounded-tile bg-gold shadow-tile-cheese`
    case 'powerup':
      return `${base} rounded-tile bg-cyan/15`
    default:
      return base
  }
}

function tileInnerGlyph(tile: Tile): ReactNode {
  switch (tile) {
    case 'cheese':
      return (
        <div
          className="h-[56%] w-[56%] bg-base/45 [clip-path:polygon(0_100%,100%_100%,100%_0)]"
          aria-hidden
        />
      )
    case 'cracked':
      return (
        <div
          className="absolute inset-0 [background-image:repeating-linear-gradient(45deg,transparent,transparent_2px,rgba(0,0,0,0.4)_2px,rgba(0,0,0,0.4)_3px)]"
          aria-hidden
        />
      )
    case 'powerup':
      return (
        <div
          className="h-[46%] w-[46%] animate-vv-pulse rounded-full bg-cyan shadow-[0_0_10px_rgba(33,230,255,.6)]"
          aria-hidden
        />
      )
    default:
      return null
  }
}

export function GameBoard({ snapshot, onSwipe, skin = 'modern', surfaceProps }: GameBoardProps) {
  const { grid, mouse, cats } = snapshot
  const touchOrigin = useRef<{ x: number; y: number } | null>(null)

  const rows = grid.length
  const cols = grid[0]?.length ?? 0

  const cells: ReactNode[] = []
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const tile = grid[y][x]
      cells.push(
        <div key={`${x}-${y}`} className={tileClass(tile)}>
          {tileInnerGlyph(tile)}
        </div>,
      )
    }
  }

  const sizeStyle = { width: `${100 / cols}%`, height: `${100 / rows}%` }
  const posStyle = (x: number, y: number) => ({
    left: `${(x / cols) * 100}%`,
    top: `${(y / rows) * 100}%`,
  })

  const superMouse = snapshot.superMouseTurns > 0

  const chrome =
    skin === 'arcade'
      ? 'rounded-[10px] bg-[#070510] p-[3px] shadow-[0_0_0_1px_rgba(255,46,151,.25),0_0_34px_-8px_rgba(33,230,255,.5)]'
      : 'rounded-3xl bg-white/[.03] p-2 ring-1 ring-white/[.07] shadow-[0_0_40px_-12px_rgba(33,230,255,.5),inset_0_0_30px_rgba(0,0,0,.4)]'

  return (
    <div
      {...surfaceProps}
      onTouchStart={(e) => {
        surfaceProps?.onTouchStart?.(e)
        const t = e.changedTouches[0]
        touchOrigin.current = { x: t.clientX, y: t.clientY }
      }}
      onTouchEnd={(e) => {
        surfaceProps?.onTouchEnd?.(e)
        if (!onSwipe || !touchOrigin.current) return
        const t = e.changedTouches[0]
        const dx = t.clientX - touchOrigin.current.x
        const dy = t.clientY - touchOrigin.current.y
        touchOrigin.current = null
        if (Math.abs(dx) < SWIPE_THRESHOLD_PX && Math.abs(dy) < SWIPE_THRESHOLD_PX) return
        if (Math.abs(dx) >= Math.abs(dy)) {
          onSwipe(dx > 0 ? 'right' : 'left')
        } else {
          onSwipe(dy > 0 ? 'down' : 'up')
        }
      }}
      className={[
        `select-none touch-manipulation overflow-hidden ${chrome}`,
        surfaceProps?.className ?? '',
      ].join(' ')}
    >
      <div className="relative h-full w-full bg-base">
        <div className="grid grid-cols-board grid-rows-board h-full w-full gap-px">
          {cells}
        </div>

        {/* Animated actor overlay — mouse + cats glide between cells. */}
        <div className="pointer-events-none absolute inset-0">
          <motion.div
            className="absolute flex items-center justify-center"
            style={sizeStyle}
            animate={posStyle(mouse.x, mouse.y)}
            transition={moveSpring}
            aria-hidden
          >
            <motion.div
              className={[
                'relative flex h-[62%] w-[62%] items-center justify-center rounded-[30%] bg-cyan shadow-tile-mouse [transform:translateZ(0)] will-change-transform',
                superMouse ? 'ring-2 ring-gold' : '',
              ].join(' ')}
              animate={superMouse ? { scale: [1, 1.12, 1] } : { scale: 1 }}
              transition={superMouse ? { duration: 0.8, repeat: Infinity } : { duration: 0.2 }}
            >
              <div className="h-[46%] w-[46%] rounded-full bg-base/60" />
            </motion.div>
          </motion.div>

          <AnimatePresence>
            {cats.map((c, i) => (
              <motion.div
                key={`cat-${c.id ?? i}`}
                className="absolute flex items-center justify-center"
                style={sizeStyle}
                initial={{ ...posStyle(c.x, c.y), opacity: 0, scale: 0.5 }}
                animate={{ ...posStyle(c.x, c.y), opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.3 }}
                transition={moveSpring}
                aria-hidden
              >
                <div className="relative flex h-[62%] w-[62%] items-center justify-center rounded-sm bg-magenta shadow-tile-cat [transform:translateZ(0)] will-change-transform">
                  <div className="h-[46%] w-[60%] bg-base/50 [clip-path:polygon(0_100%,16%_0,40%_52%,60%_52%,84%_0,100%_100%)]" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

/** Decorative mouse icon used in logos and the lives row. */
export function MouseGlyph({ size = 16, dim = false }: { size?: number; dim?: boolean }) {
  const fill = dim ? 'bg-cyan/20' : 'bg-cyan shadow-[0_0_8px_rgba(33,230,255,.6)]'
  const ear = `absolute -top-[3px] w-[40%] aspect-square rounded-full ${dim ? 'bg-cyan/20' : 'bg-cyan'}`
  return (
    <span className="relative inline-block" style={{ width: size, height: size }}>
      <span className={`block h-full w-full rounded-[30%] ${fill}`} />
      <span className={`${ear} left-[-12%]`} />
      <span className={`${ear} right-[-12%]`} />
    </span>
  )
}
