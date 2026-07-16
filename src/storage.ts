import type { Assignment } from './types'

const KEY = 'munjiz.assignments.v2'
const LEGACY_KEY = 'munjiz.assignments.v1'

export function loadAssignments(fallback: Assignment[]): Assignment[] {
  try {
    const raw = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY)
    return raw ? (JSON.parse(raw) as Assignment[]) : fallback
  } catch {
    return fallback
  }
}

export function saveAssignments(assignments: Assignment[]): void {
  localStorage.setItem(KEY, JSON.stringify(assignments))
}

export function clearAssignments(): void {
  localStorage.removeItem(KEY)
  localStorage.removeItem(LEGACY_KEY)
}
