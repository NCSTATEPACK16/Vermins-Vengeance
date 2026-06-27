export type Tile = 'empty' | 'wall' | 'block' | 'cracked' | 'cheese' | 'powerup'

export type Direction = 'up' | 'down' | 'left' | 'right'

export type GameStatus = 'playing' | 'levelComplete' | 'lost'

export const GRID_SIZE = 20

export type Vec = { x: number; y: number }

export type GameSnapshot = {
  grid: Tile[][]
  mouse: Vec
  cats: Vec[]
  status: GameStatus
  level: number
  score: number
  /** Remaining moves of Super Mouse power-up. 0 = inactive. */
  superMouseTurns: number
}
