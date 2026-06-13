export function computeStats(problems) {
  const total = problems.length;
  const solved = problems.filter((p) => p.status === 'solved' || p.solvedAt).length;
  const revision = problems.filter((p) => p.status === 'revision').length;
  const unsolved = problems.filter((p) => p.status === 'unsolved').length;

  const byDifficulty = { easy: 0, medium: 0, hard: 0 };
  problems.forEach((p) => {
    if (p.difficulty && byDifficulty[p.difficulty] !== undefined) {
      byDifficulty[p.difficulty]++;
    }
  });

  const topicCount = {};
  problems.forEach((p) => {
    (p.topics || []).forEach((t) => {
      topicCount[t] = (topicCount[t] || 0) + 1;
    });
  });

  const streak = computeStreak(problems);

  return { total, solved, revision, unsolved, byDifficulty, topicCount, streak };
}

function computeStreak(problems) {
  const solvedDates = new Set(
    problems
      .filter((p) => p.solvedAt)
      .map((p) => new Date(p.solvedAt).toDateString())
  );

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (solvedDates.has(d.toDateString())) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}