const STORAGE_KEY = 'dsa_problems';

export async function getAllProblems() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] || []);
    });
  });
}

export async function saveAllProblems(problems) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEY]: problems }, resolve);
  });
}

export async function addProblem(problem) {
  const problems = await getAllProblems();
  problems.unshift(problem);
  await saveAllProblems(problems);
  return problems;
}

export async function updateProblem(id, updates) {
  const problems = await getAllProblems();
  const idx = problems.findIndex((p) => p.id === id);
  if (idx === -1) return problems;
  problems[idx] = { ...problems[idx], ...updates };
  await saveAllProblems(problems);
  return problems;
}

export async function deleteProblem(id) {
  const problems = await getAllProblems();
  const filtered = problems.filter((p) => p.id !== id);
  await saveAllProblems(filtered);
  return filtered;
}