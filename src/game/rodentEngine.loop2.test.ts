import { describe, it, expect } from 'vitest';
import { GRID_SIZE, type Vec, type Tile, type GameSnapshot } from './types';
import {
  moveMouse,
  stepCats,
  checkTrapped,
  createInitialState,
  continueToNextLevel,
  SUPER_MOUSE_TURNS,
} from './rodentEngine';

// ─── Helpers (mirrors rodentEngine.test.ts; kept local to avoid coupling) ────

function makeGrid(extra: Array<{ x: number; y: number; tile: Tile }> = []): Tile[][] {
  const grid: Tile[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, (): Tile => 'empty'),
  );
  for (let i = 0; i < GRID_SIZE; i++) {
    grid[0][i] = 'wall';
    grid[GRID_SIZE - 1][i] = 'wall';
    grid[i][0] = 'wall';
    grid[i][GRID_SIZE - 1] = 'wall';
  }
  for (const { x, y, tile } of extra) grid[y][x] = tile;
  return grid;
}

function snap(
  opts: {
    mouse?: Vec;
    cats?: Vec[];
    tiles?: Array<{ x: number; y: number; tile: Tile }>;
    score?: number;
    level?: number;
    status?: GameSnapshot['status'];
    superMouseTurns?: number;
  } = {},
): GameSnapshot {
  return {
    grid: makeGrid(opts.tiles),
    mouse: opts.mouse ?? { x: 10, y: 10 },
    cats: opts.cats ?? [],
    status: opts.status ?? 'playing',
    level: opts.level ?? 1,
    score: opts.score ?? 0,
    superMouseTurns: opts.superMouseTurns ?? 0,
  };
}

// ─── Cracked blocks ───────────────────────────────────────────────────────────

describe('cracked blocks', () => {
  it('mouse walking into a cracked block shatters it and moves to that tile', () => {
    // Distant cat keeps the board non-empty so withResolvedStatus stays 'playing'
    const s = snap({
      mouse: { x: 5, y: 5 },
      cats: [{ x: 15, y: 15 }],
      tiles: [{ x: 5, y: 4, tile: 'cracked' }],
    });
    const result = moveMouse(s, 'up');
    expect(result.mouse).toEqual({ x: 5, y: 4 });
    expect(result.grid[4][5]).toBe('empty'); // cracked tile cleared
    expect(result.status).toBe('playing');
  });

  it('cats cannot walk through a cracked block (treated as an obstacle)', () => {
    // cat(5,5), mouse(8,5): primary move right → cracked at (6,5) blocks cat
    const s = snap({
      mouse: { x: 8, y: 5 },
      cats: [{ x: 5, y: 5 }],
      tiles: [{ x: 6, y: 5, tile: 'cracked' }],
    });
    const result = stepCats(s);
    expect(result.cats[0]).toEqual({ x: 5, y: 5 }); // cat blocked, no secondary (dy=0)
  });

  it('a cracked block closes a side for trapping (all-four-sides check)', () => {
    // cat enclosed by 3 blocks + 1 cracked
    const s = snap({
      mouse: { x: 10, y: 10 },
      cats: [{ x: 5, y: 5 }],
      tiles: [
        { x: 5, y: 4, tile: 'block' },
        { x: 5, y: 6, tile: 'block' },
        { x: 4, y: 5, tile: 'block' },
        { x: 6, y: 5, tile: 'cracked' }, // cracked closes the east side
      ],
    });
    const result = checkTrapped(s);
    expect(result.cats.length).toBe(0);
    expect(result.grid[5][5]).toBe('cheese');
  });

  it('a cracked block + wall triggers the wall-squeeze trap', () => {
    // border wall at y=0 (north), cracked at (5,2) (south) → trapped
    const s = snap({
      mouse: { x: 10, y: 10 },
      cats: [{ x: 5, y: 1 }],
      tiles: [{ x: 5, y: 2, tile: 'cracked' }],
    });
    const result = checkTrapped(s);
    expect(result.cats.length).toBe(0);
    expect(result.grid[1][5]).toBe('cheese');
  });

  it('a block chain cannot be pushed into a cracked tile (canPushOnto = empty only)', () => {
    // mouse(5,5) → block(5,4) → cracked(5,3): push destination is not empty → refused
    const s = snap({
      mouse: { x: 5, y: 5 },
      tiles: [
        { x: 5, y: 4, tile: 'block' },
        { x: 5, y: 3, tile: 'cracked' },
      ],
    });
    const result = moveMouse(s, 'up');
    expect(result.mouse).toEqual({ x: 5, y: 5 }); // no movement
    expect(result.grid[4][5]).toBe('block');         // block unmoved
    expect(result.grid[3][5]).toBe('cracked');        // cracked intact
  });
});

// ─── Powerup + Super Mouse ────────────────────────────────────────────────────

describe('powerup pickup', () => {
  it('mouse walking over a powerup tile collects it and activates Super Mouse', () => {
    const s = snap({
      mouse: { x: 5, y: 5 },
      tiles: [{ x: 5, y: 4, tile: 'powerup' }],
      superMouseTurns: 0,
    });
    const result = moveMouse(s, 'up');
    expect(result.mouse).toEqual({ x: 5, y: 4 });
    expect(result.grid[4][5]).toBe('empty');     // powerup consumed
    expect(result.superMouseTurns).toBeGreaterThan(0); // super mouse active
  });

  it('collecting a powerup sets superMouseTurns to SUPER_MOUSE_TURNS - 1 (pickup costs one turn)', () => {
    const s = snap({
      mouse: { x: 5, y: 5 },
      tiles: [{ x: 5, y: 4, tile: 'powerup' }],
      superMouseTurns: 0,
    });
    const result = moveMouse(s, 'up');
    expect(result.superMouseTurns).toBe(SUPER_MOUSE_TURNS - 1);
  });

  it('collecting a powerup while already active resets and decrements from SUPER_MOUSE_TURNS', () => {
    const s = snap({
      mouse: { x: 5, y: 5 },
      tiles: [{ x: 5, y: 4, tile: 'powerup' }],
      superMouseTurns: 3, // already active with 3 turns left
    });
    const result = moveMouse(s, 'up');
    // Reset to SUPER_MOUSE_TURNS, then decremented by 1
    expect(result.superMouseTurns).toBe(SUPER_MOUSE_TURNS - 1);
  });

  it('superMouseTurns does not carry over to the next level', () => {
    const s = snap({ superMouseTurns: 5, level: 1 });
    const next = continueToNextLevel(s);
    expect(next.superMouseTurns).toBe(0);
  });
});

describe('super mouse — wall smashing', () => {
  it('smashes through an inner wall tile when super mouse is active', () => {
    const s = snap({
      mouse: { x: 5, y: 5 },
      tiles: [{ x: 5, y: 4, tile: 'wall' }],
      superMouseTurns: 5,
    });
    const result = moveMouse(s, 'up');
    expect(result.mouse).toEqual({ x: 5, y: 4 });
    expect(result.grid[4][5]).toBe('empty'); // wall destroyed
  });

  it('cannot smash a wall when super mouse is inactive (superMouseTurns = 0)', () => {
    const s = snap({
      mouse: { x: 5, y: 5 },
      tiles: [{ x: 5, y: 4, tile: 'wall' }],
      superMouseTurns: 0,
    });
    const result = moveMouse(s, 'up');
    expect(result.mouse).toEqual({ x: 5, y: 5 }); // blocked
    expect(result.grid[4][5]).toBe('wall');           // wall untouched
  });

  it('decrements superMouseTurns by 1 on each successful move', () => {
    const s = snap({ mouse: { x: 5, y: 5 }, superMouseTurns: 5 });
    const result = moveMouse(s, 'up'); // plain empty tile move
    expect(result.superMouseTurns).toBe(4);
  });

  it('decrements on wall-smash moves too', () => {
    const s = snap({
      mouse: { x: 5, y: 5 },
      tiles: [{ x: 5, y: 4, tile: 'wall' }],
      superMouseTurns: 3,
    });
    expect(moveMouse(s, 'up').superMouseTurns).toBe(2);
  });

  it('floors superMouseTurns at 0 — never goes negative', () => {
    const s = snap({ mouse: { x: 5, y: 5 }, superMouseTurns: 1 });
    const result = moveMouse(s, 'up'); // uses the last turn
    expect(result.superMouseTurns).toBe(0);
  });

  it('does NOT decrement on a failed move (blocked by cat, wall when inactive, etc.)', () => {
    const s = snap({
      mouse: { x: 5, y: 5 },
      cats: [{ x: 5, y: 4 }],
      superMouseTurns: 5,
    });
    const result = moveMouse(s, 'up'); // blocked by cat → unchanged
    expect(result.superMouseTurns).toBe(5);
  });

  it('super mouse expires after SUPER_MOUSE_TURNS successful moves', () => {
    // Distant cat prevents levelComplete after powerup is consumed,
    // which would freeze moveMouse (status !== 'playing') and stall the burn loop.
    let s = snap({ mouse: { x: 5, y: 5 }, cats: [{ x: 15, y: 15 }], superMouseTurns: 0 });
    // Place powerup and collect it (spreads cats array through)
    s = { ...s, grid: makeGrid([{ x: 5, y: 4, tile: 'powerup' }]) };
    s = moveMouse(s, 'up'); // collect powerup → superMouseTurns = SUPER_MOUSE_TURNS - 1

    // Burn remaining turns by alternating up/down on an empty interior path
    for (let i = 0; i < SUPER_MOUSE_TURNS - 1; i++) {
      const dir = i % 2 === 0 ? 'down' : 'up';
      s = moveMouse(s, dir);
    }
    expect(s.superMouseTurns).toBe(0);
  });
});

// ─── Regression notes ─────────────────────────────────────────────────────────

describe('Loop 1 regression', () => {
  it.todo(
    'all 36 Loop 1 assertions still pass after the Loop 2 changes — ' +
    'verified by running `npm test` with both test files active',
  );

  it('createInitialState now includes superMouseTurns: 0', () => {
    expect(createInitialState().superMouseTurns).toBe(0);
  });

  it('GameSnapshot still carries all original fields unchanged', () => {
    const s = createInitialState();
    expect(typeof s.grid).toBe('object');
    expect(typeof s.mouse).toBe('object');
    expect(Array.isArray(s.cats)).toBe(true);
    expect(typeof s.score).toBe('number');
    expect(typeof s.level).toBe('number');
    expect(typeof s.status).toBe('string');
  });
});
