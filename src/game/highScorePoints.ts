const STORAGE_KEY = 'rodents-revenge-best-score'

export function loadBestScore(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw == null) return 0
    const n = Number.parseInt(raw, 10)
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

export function saveBestScore(best: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Math.max(0, Math.floor(best))))
  } catch {
    /* ignore quota / private mode */
  }
}
