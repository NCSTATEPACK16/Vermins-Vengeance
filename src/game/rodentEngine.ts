import {
  type Direction,
  type GameSnapshot,
  type Tile,
  type Vec,
  GRID_SIZE,
} from './types'

const W = GRID_SIZE
const H = GRID_SIZE
const CHEESE_POINTS = 100

/** Moves of Super Mouse granted by picking up a powerup tile. */
export const SUPER_MOUSE_TURNS = 10

export function dirDelta(dir: Direction): Vec {
  switch (dir) {
    case 'up':
      return { x: 0, y: -1 }
    case 'down':
      return { x: 0, y: 1 }
    case 'left':
      return { x: -1, y: 0 }
    case 'right':
      return { x: 1, y: 0 }
  }
}

function cloneGrid(grid: Tile[][]): Tile[][] {
  return grid.map((row) => row.slice())
}

function emptyGrid(): Tile[][] {
  const g: Tile[][] = []
  for (let y = 0; y < H; y++) {
    const row: Tile[] = []
    for (let x = 0; x < W; x++) row.push('empty')
    g.push(row)
  }
  return g
}

function hasCheese(grid: Tile[][]): boolean {
  for (const row of grid) {
    for (const tile of row) {
      if (tile === 'cheese') return true
    }
  }
  return false
}

function withResolvedStatus(snapshot: GameSnapshot): GameSnapshot {
  if (snapshot.status === 'lost') return snapshot
  if (snapshot.cats.length === 0 && !hasCheese(snapshot.grid)) {
    return { ...snapshot, status: 'levelComplete' }
  }
  return { ...snapshot, status: 'playing' }
}

function buildLevel(level: number, score: number): GameSnapshot {
  const grid = emptyGrid()

  for (let x = 0; x < W; x++) {
    grid[0][x] = 'wall'
    grid[H - 1][x] = 'wall'
  }
  for (let y = 0; y < H; y++) {
    grid[y][0] = 'wall'
    grid[y][W - 1] = 'wall'
  }

  const blocks: Vec[] = [
    { x: 4, y: 4 },
    { x: 5, y: 4 },
    { x: 14, y: 4 },
    { x: 15, y: 4 },
    { x: 4, y: 14 },
    { x: 5, y: 14 },
    { x: 14, y: 14 },
    { x: 15, y: 14 },
    { x: 9, y: 7 },
    { x: 10, y: 7 },
    { x: 9, y: 12 },
    { x: 10, y: 12 },
    { x: 7, y: 9 },
    { x: 12, y: 9 },
    { x: 7, y: 10 },
    { x: 12, y: 10 },
    { x: 8, y: 8 },
    { x: 11, y: 8 },
    { x: 8, y: 11 },
    { x: 11, y: 11 },
  ]
  for (const b of blocks) grid[b.y][b.x] = 'block'

  // Loop 2: seed a cracked block and a powerup tile for demonstration.
  // Full level-design integration comes in a later loop.
  grid[3][10] = 'cracked'
  grid[6][10] = 'powerup'

  const mouse: Vec = { x: 10, y: 10 }
  const catSpawns: Vec[] = [
    { x: 10, y: 5 },
    { x: 6, y: 10 },
    { x: 14, y: 10 },
    { x: 5, y: 5 },
    { x: 15, y: 15 },
    { x: 5, y: 15 },
    { x: 15, y: 5 },
  ]
  const catCount = Math.min(2 + level, catSpawns.length)
  const cats = catSpawns.slice(0, catCount)

  return { grid, mouse, cats, status: 'playing', level, score, superMouseTurns: 0 }
}

/** Border walls; inner blocks + actors placed for a playable prototype. */
export function createInitialState(): GameSnapshot {
  return buildLevel(1, 0)
}

export function continueToNextLevel(snapshot: GameSnapshot): GameSnapshot {
  return buildLevel(snapshot.level + 1, snapshot.score)
}

function catAt(cats: Vec[], x: number, y: number): boolean {
  return cats.some((c) => c.x === x && c.y === y)
}

/**
 * Tiles that block cat movement.
 * 'cracked' acts as a physical obstacle for cats (they cannot smash through it).
 */
function tileBlocksCatMove(t: Tile): boolean {
  return t === 'wall' || t === 'block' || t === 'cracked'
}

function canMouseEnterTile(t: Tile): boolean {
  return t === 'empty' || t === 'cheese' || t === 'powerup'
}

/** Push destination must be strictly empty (not cheese, not cracked, not powerup). */
function canPushOnto(t: Tile): boolean {
  return t === 'empty'
}

function isOutOfBounds(x: number, y: number): boolean {
  return x < 0 || x >= W || y < 0 || y >= H
}

function canSlideCatOnto(
  grid: Tile[][],
  cats: Vec[],
  x: number,
  y: number,
): boolean {
  if (isOutOfBounds(x, y)) return false
  if (catAt(cats, x, y)) return false
  const t = grid[y][x]
  return t === 'empty' || t === 'cheese'
}

/**
 * A side is "closed" for trapping only if it is out of bounds, wall, block, or cracked.
 * Mouse, another cat, empty, cheese, or powerup leaves that side open.
 */
function isSideClosedForTrap(
  grid: Tile[][],
  mouse: Vec,
  cats: Vec[],
  self: Vec,
  nx: number,
  ny: number,
): boolean {
  if (nx < 0 || nx >= W || ny < 0 || ny >= H) return true
  if (mouse.x === nx && mouse.y === ny) return false
  if (cats.some((c) => c.x === nx && c.y === ny && !(c.x === self.x && c.y === self.y)))
    return false
  const t = grid[ny][nx]
  return t === 'wall' || t === 'block' || t === 'cracked'
}

/** True if the tile counts as a block-like obstacle (block or cracked). */
function isBlockLike(t: Tile): boolean {
  return t === 'block' || t === 'cracked'
}

export function checkTrapped(snapshot: GameSnapshot): GameSnapshot {
  if (snapshot.status !== 'playing') return snapshot

  const grid = cloneGrid(snapshot.grid)
  const mouse = { ...snapshot.mouse }
  const surviving: Vec[] = []

  for (const cat of snapshot.cats) {
    const northClosed = isSideClosedForTrap(grid, mouse, snapshot.cats, cat, cat.x, cat.y - 1)
    const southClosed = isSideClosedForTrap(grid, mouse, snapshot.cats, cat, cat.x, cat.y + 1)
    const westClosed  = isSideClosedForTrap(grid, mouse, snapshot.cats, cat, cat.x - 1, cat.y)
    const eastClosed  = isSideClosedForTrap(grid, mouse, snapshot.cats, cat, cat.x + 1, cat.y)

    const trappedByAllSides = northClosed && southClosed && westClosed && eastClosed

    // Wall + any block-like tile on the same axis triggers the squeeze trap.
    const trappedByWallAndBlock =
      (grid[cat.y][cat.x - 1] === 'wall' && isBlockLike(grid[cat.y][cat.x + 1])) ||
      (isBlockLike(grid[cat.y][cat.x - 1]) && grid[cat.y][cat.x + 1] === 'wall') ||
      (grid[cat.y - 1][cat.x] === 'wall' && isBlockLike(grid[cat.y + 1][cat.x])) ||
      (isBlockLike(grid[cat.y - 1][cat.x]) && grid[cat.y + 1][cat.x] === 'wall')

    if (trappedByAllSides || trappedByWallAndBlock) {
      grid[cat.y][cat.x] = 'cheese'
    } else {
      surviving.push({ ...cat })
    }
  }

  return withResolvedStatus({
    ...snapshot,
    grid,
    mouse,
    cats: surviving,
  })
}

export function moveMouse(snapshot: GameSnapshot, dir: Direction): GameSnapshot {
  if (snapshot.status !== 'playing') return snapshot

  const d = dirDelta(dir)
  const mx = snapshot.mouse.x + d.x
  const my = snapshot.mouse.y + d.y

  if (mx < 0 || mx >= W || my < 0 || my >= H) return snapshot

  const grid = cloneGrid(snapshot.grid)
  const cats = snapshot.cats.map((c) => ({ ...c }))

  const targetTile = grid[my][mx]

  if (catAt(cats, mx, my)) return snapshot

  let mouse: Vec
  let score = snapshot.score
  let superMouseTurns = snapshot.superMouseTurns

  if (targetTile === 'cracked') {
    // Cracked block: shatter in place, mouse moves through.
    // Cannot be pushed — the mouse simply walks into it and it breaks.
    grid[my][mx] = 'empty'
    mouse = { x: mx, y: my }

  } else if (targetTile === 'wall' && superMouseTurns > 0) {
    // Super Mouse: smash through a wall tile (wall is destroyed, mouse moves there).
    grid[my][mx] = 'empty'
    mouse = { x: mx, y: my }

  } else if (tileBlocksCatMove(targetTile) && targetTile !== 'block') {
    // Normal wall (or cracked without super — already handled above): blocked.
    return snapshot

  } else if (targetTile === 'block') {
    // ── Block push logic (unchanged from Loop 1) ──────────────────────────
    const blockCells: Vec[] = []
    let cx = mx
    let cy = my
    while (cx >= 0 && cx < W && cy >= 0 && cy < H && grid[cy][cx] === 'block') {
      blockCells.push({ x: cx, y: cy })
      cx += d.x
      cy += d.y
    }

    if (isOutOfBounds(cx, cy)) return snapshot

    const pushedCatPositions: Vec[] = []
    while (!isOutOfBounds(cx, cy) && catAt(cats, cx, cy)) {
      pushedCatPositions.push({ x: cx, y: cy })
      cx += d.x
      cy += d.y
    }

    const beyondX = cx
    const beyondY = cy

    if (pushedCatPositions.length === 0) {
      if (!canPushOnto(grid[beyondY][beyondX])) return snapshot
      for (const p of blockCells) grid[p.y][p.x] = 'empty'
      for (const p of blockCells) {
        grid[p.y + d.y][p.x + d.x] = 'block'
      }
    } else {
      const crush =
        isOutOfBounds(beyondX, beyondY) ||
        grid[beyondY][beyondX] === 'wall' ||
        grid[beyondY][beyondX] === 'block'

      if (crush) {
        const lastCat = pushedCatPositions[pushedCatPositions.length - 1]
        for (const p of blockCells) grid[p.y][p.x] = 'empty'

        const lastIdx = cats.findIndex((c) => c.x === lastCat.x && c.y === lastCat.y)
        if (lastIdx >= 0) cats.splice(lastIdx, 1)
        grid[lastCat.y][lastCat.x] = 'cheese'

        for (let i = 0; i < pushedCatPositions.length - 1; i++) {
          const p = pushedCatPositions[i]
          const c = cats.find((cc) => cc.x === p.x && cc.y === p.y)
          if (c) {
            c.x += d.x
            c.y += d.y
          }
        }

        for (const p of blockCells) {
          const nx = p.x + d.x
          const ny = p.y + d.y
          if (nx === lastCat.x && ny === lastCat.y) continue
          grid[ny][nx] = 'block'
        }
      } else {
        if (!canSlideCatOnto(grid, cats, beyondX, beyondY)) return snapshot
        if (grid[beyondY][beyondX] === 'block') return snapshot

        for (const p of blockCells) grid[p.y][p.x] = 'empty'

        for (const p of pushedCatPositions) {
          const c = cats.find((cc) => cc.x === p.x && cc.y === p.y)
          if (c) {
            c.x += d.x
            c.y += d.y
          }
        }

        if (grid[beyondY][beyondX] === 'cheese') grid[beyondY][beyondX] = 'empty'

        for (const p of blockCells) {
          grid[p.y + d.y][p.x + d.x] = 'block'
        }
      }
    }
    mouse = { x: mx, y: my }

  } else if (canMouseEnterTile(targetTile)) {
    // ── Normal tile entry: empty, cheese, or powerup ──────────────────────
    mouse = { x: mx, y: my }
    if (targetTile === 'cheese') {
      score += CHEESE_POINTS
      grid[my][mx] = 'empty'
    } else if (targetTile === 'powerup') {
      grid[my][mx] = 'empty'
      superMouseTurns = SUPER_MOUSE_TURNS
    }

  } else {
    return snapshot
  }

  // Every successful move consumes one Super Mouse turn (floor at 0).
  const nextSuperMouseTurns = Math.max(0, superMouseTurns - 1)

  let next: GameSnapshot = {
    ...snapshot,
    grid,
    mouse,
    cats,
    score,
    superMouseTurns: nextSuperMouseTurns,
    status: 'playing',
  }
  next = checkTrapped(next)
  if (next.status === 'levelComplete') return next

  if (next.cats.some((c) => c.x === next.mouse.x && c.y === next.mouse.y)) {
    return { ...next, status: 'lost' }
  }

  return withResolvedStatus(next)
}

function tryCatStep(cat: Vec, mouse: Vec, grid: Tile[][], cats: Vec[], selfIdx: number): Vec | null {
  const dxTotal = mouse.x - cat.x
  const dyTotal = mouse.y - cat.y

  const h: Vec = { x: Math.sign(dxTotal), y: 0 }
  const v: Vec = { x: 0, y: Math.sign(dyTotal) }
  const preferHorizontalFirst = Math.abs(dxTotal) >= Math.abs(dyTotal)
  const ordered: Vec[] = preferHorizontalFirst ? [h, v] : [v, h]

  const uniq: Vec[] = []
  for (const cand of ordered) {
    if (cand.x === 0 && cand.y === 0) continue
    if (!uniq.some((u) => u.x === cand.x && u.y === cand.y)) uniq.push(cand)
  }

  for (const d of uniq) {
    const nx = cat.x + d.x
    const ny = cat.y + d.y
    if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue
    const t = grid[ny][nx]
    if (tileBlocksCatMove(t)) continue
    const blockedByCat = cats.some(
      (c, i) => i !== selfIdx && c.x === nx && c.y === ny,
    )
    if (blockedByCat) continue
    return { x: nx, y: ny }
  }

  return null
}

export function stepCats(snapshot: GameSnapshot): GameSnapshot {
  if (snapshot.status !== 'playing') return snapshot

  const grid = cloneGrid(snapshot.grid)
  const mouse = { ...snapshot.mouse }
  const cats = snapshot.cats.map((c) => ({ ...c }))

  for (let i = 0; i < cats.length; i++) {
    const step = tryCatStep(cats[i], mouse, grid, cats, i)
    if (step) cats[i] = step

    if (cats[i].x === mouse.x && cats[i].y === mouse.y) {
      return { ...snapshot, grid, mouse, cats, status: 'lost' }
    }
  }

  let next: GameSnapshot = { ...snapshot, grid, mouse, cats, status: 'playing' }
  next = checkTrapped(next)
  return withResolvedStatus(next)
}
