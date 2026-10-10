// XP progression and level calculations for init.Habits
// Formula: Idempotent XP accumulation with quadratic level progression curves

import { XpProgress } from '../types';

export const XP_CONFIG = {
  BASE_XP_PER_COMPLETION: 15,
  BASE_LEVEL_MULTIPLIER: 50,
};

/**
 * Calculates the exact XP threshold required to reach level L.
 * Threshold(L) = 50 * (L - 1) * L
 * Level 1: 0 XP
 * Level 2: 100 XP
 * Level 3: 300 XP
 * Level 4: 600 XP
 * Level 5: 1,000 XP
 */
export function getXpThresholdForLevel(level: number): number {
  if (level <= 1) return 0;
  return XP_CONFIG.BASE_LEVEL_MULTIPLIER * (level - 1) * level;
}

/**
 * Computes level from total XP using the quadratic formula inversion:
 * L = floor( (1 + sqrt(1 + (4 * XP) / 50)) / 2 )
 */
export function getLevelFromXp(totalXp: number): number {
  if (!totalXp || totalXp <= 0) return 1;
  const discriminant = 1 + (4 * totalXp) / XP_CONFIG.BASE_LEVEL_MULTIPLIER;
  return Math.floor((1 + Math.sqrt(discriminant)) / 2);
}

/**
 * Computes full XP progress metadata:
 * - Current level
 * - XP bounds for the current level
 * - Progress percentage toward next level (0-100%)
 * - Remaining XP needed for next level
 */
export function getXpProgress(totalXp: number): XpProgress {
  const safeXp = Math.max(0, Math.floor(totalXp || 0));
  const level = getLevelFromXp(safeXp);

  const currentLevelFloorXp = getXpThresholdForLevel(level);
  const nextLevelCeilXp = getXpThresholdForLevel(level + 1);

  const xpInCurrentLevel = safeXp - currentLevelFloorXp;
  const xpNeededForLevel = nextLevelCeilXp - currentLevelFloorXp;

  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((xpInCurrentLevel / xpNeededForLevel) * 100))
  );

  const xpToNextLevel = Math.max(0, nextLevelCeilXp - safeXp);

  return {
    totalXp: safeXp,
    level,
    currentLevelFloorXp,
    nextLevelCeilXp,
    progressPercent,
    xpToNextLevel,
  };
}
