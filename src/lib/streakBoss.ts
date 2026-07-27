export const BOSS_USER_NUMBER = 5;

export function isBossStreak(userNumber: number | null | undefined, streak: number) {
  return userNumber === BOSS_USER_NUMBER && streak >= 1000;
}
