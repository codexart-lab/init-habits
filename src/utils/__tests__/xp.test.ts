import { describe, it, expect } from 'vitest';
import {
  getXpThresholdForLevel,
  getLevelFromXp,
  getXpProgress,
  XP_CONFIG,
} from '../xp';

describe('xp utilities', () => {
  it('correctly calculates level thresholds', () => {
    expect(XP_CONFIG.BASE_XP_PER_COMPLETION).toBe(15);
    expect(getXpThresholdForLevel(1)).toBe(0);
    expect(getXpThresholdForLevel(2)).toBe(100);
    expect(getXpThresholdForLevel(3)).toBe(300);
    expect(getXpThresholdForLevel(4)).toBe(600);
    expect(getXpThresholdForLevel(5)).toBe(1000);
  });

  it('accurately derives level from arbitrary total XP', () => {
    expect(getLevelFromXp(0)).toBe(1);
    expect(getLevelFromXp(50)).toBe(1);
    expect(getLevelFromXp(99)).toBe(1);
    expect(getLevelFromXp(100)).toBe(2);
    expect(getLevelFromXp(250)).toBe(2);
    expect(getLevelFromXp(299)).toBe(2);
    expect(getLevelFromXp(300)).toBe(3);
    expect(getLevelFromXp(600)).toBe(4);
    expect(getLevelFromXp(1000)).toBe(5);
  });

  it('computes level progress bar percentages and remaining XP needed', () => {
    // Total XP = 50 (Halfway to Level 2 which is at 100)
    const progress50 = getXpProgress(50);
    expect(progress50.level).toBe(1);
    expect(progress50.currentLevelFloorXp).toBe(0);
    expect(progress50.nextLevelCeilXp).toBe(100);
    expect(progress50.progressPercent).toBe(50);
    expect(progress50.xpToNextLevel).toBe(50);

    // Total XP = 200 (Level 2 spans 100 to 300 = 200 span; 100 XP into it is 50%)
    const progress200 = getXpProgress(200);
    expect(progress200.level).toBe(2);
    expect(progress200.progressPercent).toBe(50);
    expect(progress200.xpToNextLevel).toBe(100);
  });

  it('maintains idempotency and handles zero and negative numbers safely', () => {
    const progress0 = getXpProgress(0);
    expect(progress0.level).toBe(1);
    expect(progress0.totalXp).toBe(0);

    const progressNeg = getXpProgress(-50);
    expect(progressNeg.level).toBe(1);
    expect(progressNeg.totalXp).toBe(0);
  });
});
