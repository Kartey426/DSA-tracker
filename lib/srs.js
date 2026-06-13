// Simple spaced repetition intervals (days)
const INTERVALS = [1, 3, 7, 14, 30];

export function getNextRevisionDate(problem) {
  const attempts = problem.revisionCount || 0;
  const days = INTERVALS[Math.min(attempts, INTERVALS.length - 1)];
  return Date.now() + days * 24 * 60 * 60 * 1000;
}

export function isDueForRevision(problem) {
  if (problem.status !== 'revision') return false;
  if (!problem.nextRevisionDue) return true;
  return Date.now() >= problem.nextRevisionDue;
}

export function getDueProblems(problems) {
  return problems.filter(isDueForRevision);
}