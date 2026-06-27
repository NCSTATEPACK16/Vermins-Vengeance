import { describe, it, expect } from 'vitest';
import { GRID_SIZE, type Vec, type Tile, type GameSnapshot } from './types';
import {
  dirDelta,
  moveMouse,
  stepCats,
  checkTrapped,
  createInitialState,
  continueToNextLevel,
} from './rodentEngine';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** 20×20 grid with border walls and optional extra tiles. */
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

/**
 * Minimal snapshot for unit tests.
 * Defaults: mouse (10,10), no cats, level 1, score 0, status 'playing'.
 */
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

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('grid constants', () => {
  it('GRID_SIZE is 20', () => {
    expect(GRID_SIZE).toBe(20);
  });
});

describe('dirDelta', () => {
  it('up   → {x:0, y:-1}', () => expect(dirDelta('up')).toEqual({ x: 0, y: -1 }));
  it('down → {x:0, y:1}',  () => expect(dirDelta('down')).toEqual({ x: 0, y: 1 }));
  it('left → {x:-1, y:0}', () => expect(dirDelta('left')).toEqual({ x: -1, y: 0 }));
  it('right→ {x:1, y:0}',  () => expect(dirDelta('right')).toEqual({ x: 1, y: 0 }));
});

describe('createInitialState', () => {
  it('creates a 20×20 grid', () => {
    const s = createInitialState();
    expect(s.grid.length).toBe(20);
    expect(s.grid[0].length).toBe(20);
  });

  it('places border walls on all four edges', () => {
    const s = createInitialState();
    for (let i = 0; i < GRID_SIZE; i++) {
      expect(s.grid[0][i]).toBe('wall');
      expect(s.grid[19][i]).toBe('wall');
      expect(s.grid[i][0]).toBe('wall');
      expect(s.grid[i][19]).toBe('wall');
    }
  });

  it('spawns 3 cats on level 1 (min(2+1, 7))', () => {
    expect(createInitialState().cats.length).toBe(3);
  });

  it('starts mouse at (10, 10)', () => {
    expect(createInitialState().mouse).toEqual({ x: 10, y: 10 });
  });

  it('starts score at 0, status playing', () => {
    const s = createInitialState();
    expect(s.score).toBe(0);
    expect(s.status).toBe('playing');
  });
});

describe('continueToNextLevel', () => {
  it('increments the level', () => {
    const next = continueToNextLevel(createInitialState());
    expect(next.level).toBe(2);
  });

  it('preserves the score', () => {
    const next = continueToNextLevel(snap({ level: 3, score: 500 }));
    expect(next.score).toBe(500);
  });

  it('ramps cat count: min(2+level, 7)', () => {
    // level 1 → next=2 → 4 cats
    expect(continueToNextLevel(snap({ level: 1 })).cats.length).toBe(4);
    // level 3 → next=4 → 6 cats
    expect(continueToNextLevel(snap({ level: 3 })).cats.length).toBe(6);
    // level 4 → next=5 → 7 cats (cap)
    expect(continueToNextLevel(snap({ level: 4 })).cats.length).toBe(7);
    // level 5 → next=6 → still 7 (hard cap from catSpawns.length)
    expect(continueToNextLevel(snap({ level: 5 })).cats.length).toBe(7);
  });
});

describe('mouse movement — moveMouse', () => {
  it('moves one cell into an empty tile', () => {
    // Distant cat keeps the board non-empty so withResolvedStatus stays 'playing'
    const result = moveMouse(
      snap({ mouse: { x: 5, y: 5 }, cats: [{ x: 15, y: 15 }] }),
      'up',
    );
    expect(result.mouse).toEqual({ x: 5, y: 4 });
    expect(result.status).toBe('playing');
  });

  it('is blocked by a cat (snapshot unchanged)', () => {
    const s = snap({ mouse: { x: 5, y: 5 }, cats: [{ x: 5, y: 4 }] });
    const result = moveMouse(s, 'up');
    expect(result.mouse).toEqual({ x: 5, y: 5 });
  });

  it('is blocked by a wall (border)', () => {
    // mouse at (1,5) moving left hits the border wall at x=0
    const result = moveMouse(snap({ mouse: { x: 1, y: 5 } }), 'left');
    expect(result.mouse).toEqual({ x: 1, y: 5 });
  });

  it('eats cheese and adds 100 points', () => {
    const s = snap({
      mouse: { x: 5, y: 5 },
      tiles: [{ x: 5, y: 4, tile: 'cheese' }],
      score: 0,
    });
    const result = moveMouse(s, 'up');
    expect(result.mouse).toEqual({ x: 5, y: 4 });
    expect(result.score).toBe(100);
    expect(result.grid[4][5]).toBe('empty');
  });

  it('is a no-op when status is "lost"', () => {
    const s = snap({ mouse: { x: 5, y: 5 }, status: 'lost' });
    expect(moveMouse(s, 'up')).toBe(s);
  });

  it('is a no-op when status is "levelComplete"', () => {
    const s = snap({ mouse: { x: 5, y: 5 }, status: 'levelComplete' });
    expect(moveMouse(s, 'up')).toBe(s);
  });
});

describe('block pushing — moveMouse', () => {
  it('pushes a single block one tile into empty space; mouse occupies the block\'s old position', () => {
    // mouse(5,5) → block(5,4) → empty(5,3)
    const s = snap({
      mouse: { x: 5, y: 5 },
      tiles: [{ x: 5, y: 4, tile: 'block' }],
    });
    const result = moveMouse(s, 'up');
    expect(result.mouse).toEqual({ x: 5, y: 4 });
    expect(result.grid[3][5]).toBe('block'); // block slid to (5,3)
    expect(result.grid[4][5]).toBe('empty'); // old block tile cleared
  });

  it('pushes a connected chain of blocks as a unit', () => {
    // mouse(5,6) → block(5,5) → block(5,4) → empty(5,3)
    const s = snap({
      mouse: { x: 5, y: 6 },
      tiles: [
        { x: 5, y: 5, tile: 'block' },
        { x: 5, y: 4, tile: 'block' },
      ],
    });
    const result = moveMouse(s, 'up');
    expect(result.mouse).toEqual({ x: 5, y: 5 });
    expect(result.grid[4][5]).toBe('block'); // first block slid
    expect(result.grid[3][5]).toBe('block'); // second block slid
    expect(result.grid[5][5]).toBe('empty'); // first block's old tile cleared
  });

  it('refuses to push a block into a wall (snapshot unchanged)', () => {
    // mouse(5,5) → block(5,4) → wall(5,3)
    const s = snap({
      mouse: { x: 5, y: 5 },
      tiles: [
        { x: 5, y: 4, tile: 'block' },
        { x: 5, y: 3, tile: 'wall' },
      ],
    });
    const result = moveMouse(s, 'up');
    expect(result.mouse).toEqual({ x: 5, y: 5 }); // unmoved
    expect(result.grid[4][5]).toBe('block');        // block unmoved
  });

  it('refuses to push a block into a cheese tile (canPushOnto requires empty, not cheese)', () => {
    // mouse(5,5) → block(5,4) → cheese(5,3)  ← cheese is NOT a valid push destination
    const s = snap({
      mouse: { x: 5, y: 5 },
      tiles: [
        { x: 5, y: 4, tile: 'block' },
        { x: 5, y: 3, tile: 'cheese' },
      ],
    });
    const result = moveMouse(s, 'up');
    expect(result.mouse).toEqual({ x: 5, y: 5 });
    expect(result.grid[4][5]).toBe('block');
  });
});

describe('wall squeeze (crush) — moveMouse', () => {
  it('crushes a cat to cheese when the block pins it against a wall', () => {
    // mouse(5,6) → block(5,5) → cat(5,4) → wall(5,3)
    const s = snap({
      mouse: { x: 5, y: 6 },
      cats: [{ x: 5, y: 4 }],
      tiles: [
        { x: 5, y: 5, tile: 'block' },
        { x: 5, y: 3, tile: 'wall' },
      ],
    });
    const result = moveMouse(s, 'up');
    expect(result.cats.length).toBe(0);
    expect(result.grid[4][5]).toBe('cheese'); // cat position → cheese
    expect(result.mouse).toEqual({ x: 5, y: 5 });
    expect(result.status).toBe('playing'); // cheese remains on board
  });

  it('also traps using the border wall (wall at y=0)', () => {
    // mouse(5,3) → block(5,2) → cat(5,1) → border-wall(5,0)
    const s = snap({
      mouse: { x: 5, y: 3 },
      cats: [{ x: 5, y: 1 }],
      tiles: [{ x: 5, y: 2, tile: 'block' }],
    });
    const result = moveMouse(s, 'up');
    expect(result.cats.length).toBe(0);
    expect(result.grid[1][5]).toBe('cheese');
  });
});

describe('cat sliding — moveMouse', () => {
  it('slides the cat one step when there is clear space beyond', () => {
    // mouse(5,6) → block(5,5) → cat(5,4) → empty(5,3)
    const s = snap({
      mouse: { x: 5, y: 6 },
      cats: [{ x: 5, y: 4 }],
      tiles: [{ x: 5, y: 5, tile: 'block' }],
    });
    const result = moveMouse(s, 'up');
    expect(result.cats[0]).toEqual({ x: 5, y: 3 }); // cat slid +d
    expect(result.grid[4][5]).toBe('block');          // block now where cat was
    expect(result.mouse).toEqual({ x: 5, y: 5 });
  });

  it('silently destroys cheese in the slide path without adding score', () => {
    // mouse(5,6) → block(5,5) → cat(5,4) → cheese(5,3)  ← cheese destroyed, no points
    const s = snap({
      mouse: { x: 5, y: 6 },
      cats: [{ x: 5, y: 4 }],
      tiles: [
        { x: 5, y: 5, tile: 'block' },
        { x: 5, y: 3, tile: 'cheese' },
      ],
      score: 0,
    });
    const result = moveMouse(s, 'up');
    expect(result.score).toBe(0);          // no points
    expect(result.grid[3][5]).toBe('empty'); // cheese tile cleared
    expect(result.cats[0]).toEqual({ x: 5, y: 3 }); // cat slid there
  });
});

describe('checkTrapped — enclosure detection', () => {
  it('traps a cat enclosed on all four sides by blocks', () => {
    const s = snap({
      mouse: { x: 10, y: 10 },
      cats: [{ x: 5, y: 5 }],
      tiles: [
        { x: 5, y: 4, tile: 'block' }, // north
        { x: 5, y: 6, tile: 'block' }, // south
        { x: 4, y: 5, tile: 'block' }, // west
        { x: 6, y: 5, tile: 'block' }, // east
      ],
    });
    const result = checkTrapped(s);
    expect(result.cats.length).toBe(0);
    expect(result.grid[5][5]).toBe('cheese');
  });

  it('traps a cat squeezed between a wall and a block on one axis (trappedByWallAndBlock)', () => {
    // cat(5,1): border wall at (5,0) to the north, block at (5,2) to the south
    // Note: east and west are OPEN — single-axis squeeze is sufficient
    const s = snap({
      mouse: { x: 10, y: 10 },
      cats: [{ x: 5, y: 1 }],
      tiles: [{ x: 5, y: 2, tile: 'block' }], // border wall at y=0 already set
    });
    const result = checkTrapped(s);
    expect(result.cats.length).toBe(0);
    expect(result.grid[1][5]).toBe('cheese');
  });

  it('does NOT trap a cat that has at least one open side', () => {
    // three sides closed, east open
    const s = snap({
      mouse: { x: 10, y: 10 },
      cats: [{ x: 5, y: 5 }],
      tiles: [
        { x: 5, y: 4, tile: 'block' },
        { x: 5, y: 6, tile: 'block' },
        { x: 4, y: 5, tile: 'block' },
        // (6,5) is empty
      ],
    });
    const result = checkTrapped(s);
    expect(result.cats.length).toBe(1);
    expect(result.grid[5][5]).toBe('empty');
  });

  it('treats an empty tile as open (not a closing side)', () => {
    const s = snap({
      mouse: { x: 10, y: 10 },
      cats: [{ x: 5, y: 5 }],
      tiles: [
        { x: 5, y: 4, tile: 'block' },
        { x: 4, y: 5, tile: 'block' },
        { x: 5, y: 6, tile: 'block' },
        { x: 6, y: 5, tile: 'empty' }, // explicitly empty east
      ],
    });
    expect(checkTrapped(s).cats.length).toBe(1);
  });

  it('treats a cheese tile as open (not a closing side)', () => {
    const s = snap({
      mouse: { x: 10, y: 10 },
      cats: [{ x: 5, y: 5 }],
      tiles: [
        { x: 5, y: 4, tile: 'block' },
        { x: 4, y: 5, tile: 'block' },
        { x: 5, y: 6, tile: 'block' },
        { x: 6, y: 5, tile: 'cheese' }, // cheese = open side
      ],
    });
    expect(checkTrapped(s).cats.length).toBe(1);
  });

  it('treats the mouse position as open (not a closing side)', () => {
    const s = snap({
      mouse: { x: 6, y: 5 }, // mouse is east of cat
      cats: [{ x: 5, y: 5 }],
      tiles: [
        { x: 5, y: 4, tile: 'block' },
        { x: 4, y: 5, tile: 'block' },
        { x: 5, y: 6, tile: 'block' },
        // east (6,5) is mouse position — must be open
      ],
    });
    expect(checkTrapped(s).cats.length).toBe(1);
  });

  it('treats an adjacent cat as open (not a closing side)', () => {
    // cat0 at (5,5), cat1 at (6,5); three sides closed, east = cat1 = open
    const s = snap({
      mouse: { x: 10, y: 10 },
      cats: [{ x: 5, y: 5 }, { x: 6, y: 5 }],
      tiles: [
        { x: 5, y: 4, tile: 'block' },
        { x: 4, y: 5, tile: 'block' },
        { x: 5, y: 6, tile: 'block' },
      ],
    });
    expect(checkTrapped(s).cats.length).toBe(2); // neither cat trapped
  });

  it('sets status to levelComplete when the last cat is trapped and no cheese is on the board', () => {
    // Trap last cat → cat becomes cheese (hasCheese=true) → still 'playing'.
    // Must eat that cheese to reach levelComplete.
    // This test verifies the two-step requirement.
    const s = snap({
      mouse: { x: 5, y: 5 },
      cats: [],          // no cats
      tiles: [{ x: 5, y: 4, tile: 'cheese' }], // one cheese left
      score: 0,
    });
    const result = moveMouse(s, 'up'); // eat last cheese, no cats
    expect(result.status).toBe('levelComplete');
    expect(result.score).toBe(100);
  });

  it('is a no-op when status is not "playing"', () => {
    const s = snap({ status: 'lost', cats: [{ x: 5, y: 5 }] });
    expect(checkTrapped(s)).toBe(s);
  });
});

describe('cat stepping — stepCats', () => {
  it('moves one cell toward the mouse horizontally when |dx| > |dy|', () => {
    // cat(5,5), mouse(10,5): dx=5, dy=0 → move right
    const s = snap({ mouse: { x: 10, y: 5 }, cats: [{ x: 5, y: 5 }] });
    const result = stepCats(s);
    expect(result.cats[0]).toEqual({ x: 6, y: 5 });
  });

  it('moves one cell toward the mouse vertically when |dy| > |dx|', () => {
    // cat(5,5), mouse(5,10): dx=0, dy=5 → move down
    const s = snap({ mouse: { x: 5, y: 10 }, cats: [{ x: 5, y: 5 }] });
    const result = stepCats(s);
    expect(result.cats[0]).toEqual({ x: 5, y: 6 });
  });

  it('prefers horizontal when |dx| === |dy| (tie-break)', () => {
    // cat(5,5), mouse(8,8): dx=3, dy=3 → prefer horizontal → move right
    const s = snap({ mouse: { x: 8, y: 8 }, cats: [{ x: 5, y: 5 }] });
    const result = stepCats(s);
    expect(result.cats[0]).toEqual({ x: 6, y: 5 });
  });

  it('falls back to the secondary axis when the primary is blocked', () => {
    // cat(5,5), mouse(8,8): prefer horizontal; block east at (6,5) → fall back vertical → move down
    const s = snap({
      mouse: { x: 8, y: 8 },
      cats: [{ x: 5, y: 5 }],
      tiles: [{ x: 6, y: 5, tile: 'block' }],
    });
    const result = stepCats(s);
    expect(result.cats[0]).toEqual({ x: 5, y: 6 });
  });

  it('cannot move through a wall — stays put', () => {
    // cat(5,5), mouse(10,5): wants to go right, wall at (6,5), dy=0 so no fallback
    const s = snap({
      mouse: { x: 10, y: 5 },
      cats: [{ x: 5, y: 5 }],
      tiles: [{ x: 6, y: 5, tile: 'wall' }],
    });
    const result = stepCats(s);
    expect(result.cats[0]).toEqual({ x: 5, y: 5 });
    expect(result.status).toBe('playing');
  });

  it('cannot move through a block — stays put', () => {
    const s = snap({
      mouse: { x: 10, y: 5 },
      cats: [{ x: 5, y: 5 }],
      tiles: [{ x: 6, y: 5, tile: 'block' }],
    });
    expect(stepCats(s).cats[0]).toEqual({ x: 5, y: 5 });
  });

  it('does not stack two cats on the same tile (treats other cats as obstacles)', () => {
    // cat0(5,5), cat1(6,5), mouse(10,5): cat0 tries right → blocked by cat1 → stays
    // cat1 then moves right to (7,5)
    const s = snap({
      mouse: { x: 10, y: 5 },
      cats: [{ x: 5, y: 5 }, { x: 6, y: 5 }],
    });
    const result = stepCats(s);
    expect(result.cats[0]).toEqual({ x: 5, y: 5 }); // blocked
    expect(result.cats[1]).toEqual({ x: 7, y: 5 }); // moved freely
  });

  it('sets status to "lost" when a cat reaches the mouse cell', () => {
    // cat(5,5), mouse(6,5): one step away → cat lands on mouse → lost
    const s = snap({ mouse: { x: 6, y: 5 }, cats: [{ x: 5, y: 5 }] });
    expect(stepCats(s).status).toBe('lost');
  });

  it('is a no-op when status is "lost"', () => {
    const s = snap({ status: 'lost', cats: [{ x: 5, y: 5 }] });
    expect(stepCats(s)).toBe(s);
  });
});

describe('scoring', () => {
  it('adds exactly 100 points per cheese tile eaten', () => {
    const s = snap({
      mouse: { x: 5, y: 5 },
      tiles: [{ x: 5, y: 4, tile: 'cheese' }],
      score: 0,
    });
    expect(moveMouse(s, 'up').score).toBe(100);
  });

  it('accumulates score across multiple cheese pickups', () => {
    let s = snap({ mouse: { x: 5, y: 5 }, score: 0 });
    // place cheese above and below using manual grid edits
    s = { ...s, grid: makeGrid([{ x: 5, y: 4, tile: 'cheese' }, { x: 5, y: 3, tile: 'cheese' }]) };
    let result = moveMouse(s, 'up'); // eat first cheese → 100
    result = moveMouse(result, 'up'); // eat second cheese → 200
    expect(result.score).toBe(200);
  });
});

describe('level completion — status transitions', () => {
  it('stays "playing" after trapping last cat (cat becomes cheese — must still eat it)', () => {
    // Cat enclosed → converted to cheese → hasCheese=true → still playing
    const s = snap({
      mouse: { x: 10, y: 10 },
      cats: [{ x: 5, y: 5 }],
      tiles: [
        { x: 5, y: 4, tile: 'block' },
        { x: 5, y: 6, tile: 'block' },
        { x: 4, y: 5, tile: 'block' },
        { x: 6, y: 5, tile: 'block' },
      ],
    });
    const result = checkTrapped(s);
    expect(result.cats.length).toBe(0);
    expect(result.grid[5][5]).toBe('cheese');
    expect(result.status).toBe('playing'); // NOT levelComplete — cheese remains
  });

  it('sets "levelComplete" when all cats are gone and no cheese remains', () => {
    // Eat the last cheese with no cats active
    const s = snap({
      mouse: { x: 5, y: 5 },
      cats: [],
      tiles: [{ x: 5, y: 4, tile: 'cheese' }],
    });
    expect(moveMouse(s, 'up').status).toBe('levelComplete');
  });

  it('stays "playing" when cats remain even if no cheese', () => {
    // No cheese on grid, 1 cat alive — can't be levelComplete
    const s = snap({ mouse: { x: 10, y: 10 }, cats: [{ x: 5, y: 5 }] });
    expect(checkTrapped(s).status).toBe('playing');
  });
});

// ─── Known gaps (spec vs. implementation) ─────────────────────────────────────

describe('spec vs. implementation notes', () => {
  it.todo(
    'diagonal slip: HANDOFF mentions cats slipping through catty-cornered blocks, ' +
    'but tryCatStep only tries orthogonal moves — not currently implemented',
  );
});
