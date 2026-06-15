(function () {
  const url = window.location.href;

  // Platform detection
  let platform = null;
  if (url.includes("leetcode.com/problems/")) {
    platform = "leetcode";
  } else if (/codeforces\.com\/(problemset\/problem|contest)\/[\d]+\/problem\//.test(url)) {
    platform = "codeforces";
  }

  if (!platform) return;

  const data = {
    url,
    title: document.title,
    difficulty: "",
    topics: [],
    platform,
    timestamp: Date.now(),
  };

  try {
    if (platform === "leetcode") {
      // your existing leetcode extraction
      const titleEl = document.querySelector('[data-cy="question-title"]');
      if (titleEl) data.title = titleEl.textContent.trim();

      const allEls = [...document.querySelectorAll("*")];
      for (const el of allEls) {
        const txt = el.textContent?.trim();
        if (txt === "Easy" || txt === "Medium" || txt === "Hard") {
          data.difficulty = txt.toLowerCase();
          break;
        }
      }

      const topicLinks = document.querySelectorAll('a[href*="/tag/"]');
      data.topics = [...topicLinks].map((t) => t.textContent.trim()).filter(Boolean);

    } else if (platform === "codeforces") {
      // strip " - Codeforces" from tab title
      // await new Promise(r => setTimeout(r, 500));  // wait for render
      const titleEl = document.querySelector(".problem-statement .title");
      data.title = titleEl
        ? titleEl.textContent.trim()
        : document.title.replace(" - Codeforces", "").trim();
      // data.title = document.title.replace(" - Codeforces", "").trim();

      // difficulty = rating shown in the sidebar
      const ratingEl = document.querySelector(".tag-box[title='Difficulty']");
      if (ratingEl) data.difficulty = ratingEl.textContent.trim(); // "*1400"

      // topics = the tag pills (hidden until you click, but still in DOM)
      const tagEls = document.querySelectorAll(".roundbox .tag-box");
      data.topics = [...tagEls]
        .map((t) => t.textContent.trim())
        .filter((t) => !t.startsWith("*") && t !== "");  // exclude the rating tag
    }

    chrome.storage.local.set({ dsa_current_page: data });
    injectTrackerCard(data);

  } catch (err) {
    console.error(err);
  }
})();

function injectTrackerCard(problem) {
  if (document.getElementById("dsa-tracker-card"))
    return;

  const card = document.createElement("div");

  card.id = "dsa-tracker-card";

  card.innerHTML = `
    <div style="font-weight:600;margin-bottom:6px;">
      ${problem.title}
    </div>

    <div style="font-size:12px;margin-bottom:4px;">
      ${problem.difficulty}
    </div>

    <div style="
      font-size:11px;
      color:#bbb;
      margin-bottom:10px;
    ">
      ${(problem.topics || []).slice(0, 3).join(" • ")}
    </div>

    <button id="dsa-add-btn">
      ➕ Add to Tracker
    </button>
  `;

  Object.assign(card.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    width: "260px",
    background: "#1f1f1f",
    color: "white",
    padding: "12px",
    borderRadius: "12px",
    zIndex: "999999",
    boxShadow: "0 4px 20px rgba(0,0,0,.3)",
    fontFamily: "system-ui",
  });

  document.body.appendChild(card);
  let hideTimer = setTimeout(() => {
  if (card && card.parentNode) {
    card.style.opacity = "0";

    setTimeout(() => {
      card.remove();
    }, 300);
  }
}, 10000);
  const btn = document.getElementById("dsa-add-btn");

  btn.style.width = "100%";
  btn.style.padding = "8px";
  btn.style.border = "none";
  btn.style.borderRadius = "8px";
  btn.style.cursor = "pointer";
  chrome.storage.local.get(
    ['dsa_problems'],
    (result) => {

      const problems =
        result.dsa_problems || [];

      const exists = problems.some(
        (p) => p.url === problem.url
      );

      if (exists) {
        card.querySelector(
          '#dsa-add-btn'
        ).textContent =
          '✅ Already Tracked';

        card.querySelector(
          '#dsa-add-btn'
        ).disabled = true;
      }
    }
  );
  btn.onclick = () => {
  addProblemToTracker(problem);
};
}

async function addProblemToTracker(problem) {
  chrome.storage.local.get(
    ['dsa_problems'],
    (result) => {
      const problems =
        result.dsa_problems || [];

      const exists = problems.some(
        (p) => p.url === problem.url
      );

      if (exists) {
        const btn =
          document.getElementById(
            'dsa-add-btn'
          );

        if (btn) {
          btn.textContent =
            '✅ Already Tracked';
          btn.disabled = true;
        }

        return;
      }

      problems.unshift({
        id: crypto.randomUUID(),
        name: problem.title,
        url: problem.url,
        platform:
          problem.platform || 'leetcode',
        difficulty:
          problem.difficulty || 'medium',
        topics:
          problem.topics || [],
        status: 'unsolved',
        createdAt: Date.now(),
        solvedAt: null,
        lastRevisedAt: null,
        nextRevisionDue: null,
        attempts: 0,
        notes: '',
      });

      chrome.storage.local.set({
        dsa_problems: problems,
      });

      const btn =
        document.getElementById(
          'dsa-add-btn'
        );

      if (btn) {
        btn.textContent = '✅ Added';
        btn.disabled = true;
      }
    }
  );
}