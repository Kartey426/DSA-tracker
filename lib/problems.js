export const STATUS = {
  UNSOLVED: 'unsolved',
  SOLVED: 'solved',
  REVISION: 'revision',
};

export const DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
};

export const TOPICS = [
  'Array', 'String', 'Linked List', 'Stack', 'Queue',
  'Tree', 'Graph', 'DP', 'Recursion', 'Backtracking',
  'Binary Search', 'Sliding Window', 'Two Pointers',
  'Heap', 'Hashing', 'Greedy', 'Math', 'Bit Manipulation',
  'Trie', 'Segment Tree',
];

export function createProblem({ name, url = '', difficulty = 'medium', topics = [], platform = 'other' }) {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    url,
    platform,
    difficulty,
    topics,
    status: STATUS.UNSOLVED,
    createdAt: Date.now(),
    solvedAt: null,
    lastRevisedAt: null,
    nextRevisionDue: null,
    attempts: 0,
    notes: '',
  };
}

export function markSolved(problem) {
  return {
    ...problem,
    status: STATUS.SOLVED,
    solvedAt: Date.now(),
    attempts: problem.attempts + 1,
  };
}

export function markRevision(problem) {
  const now = Date.now();
  return {
    ...problem,
    status: STATUS.REVISION,
    lastRevisedAt: now,
    nextRevisionDue: now + 3 * 24 * 60 * 60 * 1000, // 3 days from now
  };
}

export function markUnsolved(problem) {
  return {
    ...problem,
    status: STATUS.UNSOLVED,
    solvedAt: null,
  };
}

export function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatDateTime(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function timeAgo(ts) {
  if (!ts) return '—';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}