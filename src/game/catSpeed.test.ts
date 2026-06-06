import { describe, it, expect } from 'vitest';
import { catTickMsForLevel } from './catSpeed';

// Behavior per HANDOFF.md:
//   level 1 = 500 ms; each level divides by 1.1; capped at level 20.
//   catTickMsForLevel(level) -> Math.round(500 / 1.1 ** (level - 1)), clamped at L20.
//
// If any of these fail, it's a real finding: the docs and the implementation
// have drifted, and Loop 1's job is to surface exactly that.

describe('catTickMsForLevel', () => {
  it('starts at 500 ms on level 1', () => {
    expect(catTickMsForLevel(1)).toBe(500);
  });

  it('divides the interval by ~1.1 each level', () => {
    expect(catTickMsForLevel(2)).toBe(Math.round(500 / 1.1)); // 455
    expect(catTickMsForLevel(3)).toBe(Math.round(500 / 1.1 ** 2)); // 413
  });

  it('reaches roughly 82 ms by level 20', () => {
    expect(catTickMsForLevel(20)).toBe(82);
  });

  it('caps at the level-20 value for any higher level', () => {
    const cap = catTickMsForLevel(20);
    expect(catTickMsForLevel(21)).toBe(cap);
    expect(catTickMsForLevel(50)).toBe(cap);
    expect(catTickMsForLevel(999)).toBe(cap);
  });

  it('is strictly non-increasing from level 1 to 20', () => {
    for (let level = 2; level <= 20; level++) {
      expect(catTickMsForLevel(level)).toBeLessThanOrEqual(
        catTickMsForLevel(level - 1),
      );
    }
  });

  it('always returns a positive, finite interval', () => {
    for (let level = 1; level <= 60; level++) {
      const ms = catTickMsForLevel(level);
      expect(Number.isFinite(ms)).toBe(true);
      expect(ms).toBeGreaterThan(0);
    }
  });
});
