import { describe, it, expect } from 'vitest';
import { GRID_SIZE } from './types';

/*
 * Engine test suite for rodentEngine.ts (the source of truth).
 *
 * STATUS: scaffold. The `it.todo(...)` entries below are the full QA checklist
 * derived from HANDOFF.md's "Game rules (this build)". They show up as pending
 * in the Vitest report and do NOT fail the build.
 *
 * To finish: confirm the real exports/signatures from rodentEngine.ts and
 * types.ts (e.g. moveMouse, stepCats, checkTrapped, the level builder, the
 * Tile union, the position shape, GameSnapshot fields), then turn each todo
 * into a real `it(...)` with a built fixture snapshot and assertions.
 *
 * Suggested helpers once the API is known:
 *   - buildSnapshot({ mouse, cats, blocks, walls, cheese, level }) -> GameSnapshot
 *   - tileAt(snapshot, x, y) -> Tile
 */

describe('grid constants', () => {
  it('uses a 20x20 board', () => {
    expect(GRID_SIZE).toBe(20);
  });
});

describe('mouse movement', () => {
  it.todo('moves one cell orthogonally into an empty tile');
  it.todo('moves into a cheese tile and consumes it for +100 score');
  it.todo('does not move into or through a wall');
  it.todo('ignores diagonal / non-orthogonal inputs');
  it.todo('stays put when blocked with no pushable block ahead');
});

describe('chain push', () => {
  it.todo('pushes a single block one tile when space is free behind it');
  it.todo('pushes a connected line of blocks one tile as a unit');
  it.todo('refuses to push a block line backed by a wall (no movement)');
  it.todo('refuses to push a block line backed by another cat');
});

describe('wall squeeze -> cheese', () => {
  it.todo('converts a cat to cheese when a pushed block line pins it against a wall');
  it.todo('does not convert a cat that still has an open side after the push');
});

describe('cat stepping (greedy pursuit)', () => {
  it.todo('steps one cell toward the mouse, preferring the larger axis separation');
  it.todo('cannot move through walls, blocks, or other cats');
  it.todo('does not stack two cats on the same tile (treats cats as obstacles)');
  it.todo('falls back to the secondary axis when the primary axis is blocked');
});

describe('trapping (enclosure / reachability)', () => {
  it.todo('marks a cat trapped when all four sides are closed');
  it.todo('marks a cat trapped when block+wall pin it on opposite sides');
  it.todo('treats mouse, another cat, cheese, or empty as an OPEN side (not trapped)');
  it.todo('re-checks trapping after the player move AND after each cat tick');
  it.todo('converts a newly trapped cat into a cheese tile');
});

describe('win / lose / level flow', () => {
  it.todo("sets status to 'lost' when a cat occupies the mouse cell after a move");
  it.todo("sets status to 'lost' when a cat reaches the mouse cell on a cat tick");
  it.todo('clears the level when no cats and no cheese remain on the grid');
  it.todo('spawns min(2 + level, 7) cats when building a level');
  it.todo('builds a fresh 20x20 level with border walls and the fixed block layout');
});

describe('scoring', () => {
  it.todo('adds exactly 100 points per cheese eaten');
});
