import { formatDateTime } from './problems.js';

export function exportToXLSX(problems) {
  // Build CSV content that Excel opens correctly as tabular data
  const headers = [
    'Problem Name', 'Platform', 'Difficulty', 'Status',
    'Topics', 'URL', 'Added On', 'Solved On',
    'Last Revised', 'Next Revision Due', 'Attempts', 'Notes',
  ];

  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = problems.map((p) => [
    escape(p.name),
    escape(p.platform),
    escape(p.difficulty),
    escape(p.status),
    escape((p.topics || []).join('; ')),
    escape(p.url),
    escape(formatDateTime(p.createdAt)),
    escape(formatDateTime(p.solvedAt)),
    escape(formatDateTime(p.lastRevisedAt)),
    escape(formatDateTime(p.nextRevisionDue)),
    escape(p.attempts),
    escape(p.notes),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

  // BOM so Excel opens UTF-8 correctly
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `dsa-tracker-${datestamp()}.csv`);
}

export function exportToJSON(problems) {
  const blob = new Blob([JSON.stringify(problems, null, 2)], {
    type: 'application/json',
  });
  triggerDownload(blob, `dsa-tracker-${datestamp()}.json`);
}

export async function importFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data)) throw new Error('Invalid format');
        resolve(data);
      } catch {
        reject(new Error('Could not parse JSON file'));
      }
    };
    reader.readAsText(file);
  });
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function datestamp() {
  return new Date().toISOString().slice(0, 10);
}