const form = document.querySelector("#search-form");
const keywordInput = document.querySelector("#keyword-input");
const addKeywordButton = document.querySelector("#add-keyword");
const keywordChips = document.querySelector("#keyword-chips");
const locationInput = document.querySelector("#location");
const postedWithinInput = document.querySelector("#posted-within");
const workTypeInput = document.querySelector("#work-type");
const experienceLevelInput = document.querySelector("#experience-level");
const cvFileInput = document.querySelector("#cv-file");
const expandedKeywords = document.querySelector("#expanded-keywords");
const resultsBody = document.querySelector("#results-body");
const resultHeading = document.querySelector("#result-heading");
const sourceStrip = document.querySelector("#source-strip");
const notice = document.querySelector("#notice");
const clearResultsButton = document.querySelector("#clear-results");
const serverStatus = document.querySelector("#server-status");

let keywordFamilies = {};
let keywords = ["data analyst", "junior"];
let cvText = "";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeUrl(value) {
  try {
    const url = new URL(String(value || ""), window.location.href);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "#";
  } catch {
    return "#";
  }
}

function splitTerms(value) {
  return value
    .split(/[,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function expandLocally(terms) {
  const expanded = new Set();
  terms.forEach((term) => {
    const lower = term.toLowerCase();
    expanded.add(lower);
    Object.entries(keywordFamilies).forEach(([family, synonyms]) => {
      if (lower.includes(family) || synonyms.some((synonym) => lower.includes(synonym))) {
        synonyms.forEach((synonym) => expanded.add(synonym));
      }
    });
  });
  return [...expanded];
}

function updateKeywordPreview() {
  const terms = expandLocally(keywords);
  expandedKeywords.textContent = terms.length > 0 ? terms.slice(0, 24).join(", ") : "Add keywords to preview related terms.";
}

function renderKeywords() {
  keywordChips.innerHTML = keywords
    .map(
      (keyword) => `
        <button class="keyword-chip" type="button" data-keyword="${escapeHtml(keyword)}" aria-label="Remove ${escapeHtml(keyword)}">
          <span>${escapeHtml(keyword)}</span>
          <span aria-hidden="true">x</span>
        </button>
      `
    )
    .join("");
  updateKeywordPreview();
}

function addKeyword(value) {
  splitTerms(value).forEach((term) => {
    const normalised = term.toLowerCase();
    if (!keywords.some((keyword) => keyword.toLowerCase() === normalised)) {
      keywords.push(term);
    }
  });
  keywordInput.value = "";
  renderKeywords();
}

function getPayload() {
  return {
    keywords,
    location: locationInput.value.trim(),
    postedWithin: postedWithinInput.value,
    workType: workTypeInput.value,
    experienceLevel: experienceLevelInput.value,
    cvText,
  };
}

function ratingClass(score) {
  if (score >= 8) return "high";
  if (score >= 6) return "medium";
  return "low";
}

function showNotice(message) {
  notice.hidden = false;
  notice.textContent = message;
}

function renderJobs(jobs) {
  if (!jobs.length) {
    resultsBody.innerHTML = `<tr><td colspan="6" class="empty-cell">No close matches found. Try broader keywords or a wider date range.</td></tr>`;
    return;
  }

  resultsBody.innerHTML = jobs
    .map(
      (job) => `
        <tr>
          <td>
            <strong>${escapeHtml(job.companyName)}</strong>
            <span class="source-name">${escapeHtml(job.source)}</span>
          </td>
          <td>
            <strong>${escapeHtml(job.jobTitle)}</strong>
            <span class="job-meta">${escapeHtml(job.location)} · ${escapeHtml(job.workType)} · ${escapeHtml(job.experienceLevel)}</span>
          </td>
          <td>${escapeHtml(job.workMode)}</td>
          <td>${escapeHtml(job.salary)}</td>
          <td><span class="rating ${ratingClass(job.matchRating)}">${job.matchRating}/10</span></td>
          <td><a href="${escapeHtml(safeUrl(job.url))}" target="_blank" rel="noopener noreferrer">Open</a></td>
        </tr>
      `
    )
    .join("");
}

async function loadSources() {
  try {
    const response = await fetch("/api/sources");
    const data = await response.json();
    keywordFamilies = data.keywordFamilies || {};
    sourceStrip.innerHTML = data.sources.map((source) => `<span>${escapeHtml(source)}</span>`).join("");
    serverStatus.textContent = "Ready";
    renderKeywords();
  } catch {
    serverStatus.textContent = "Backend unavailable";
    sourceStrip.innerHTML = "";
  }
}

async function runSearch() {
  if (!keywords.length) {
    showNotice("Add at least one keyword before searching.");
    return;
  }

  resultHeading.textContent = "Searching...";
  notice.hidden = true;
  const response = await fetch("/api/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(getPayload()),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Search failed");

  renderJobs(data.jobs);
  resultHeading.textContent = `${data.jobs.length} matched roles`;
  expandedKeywords.textContent = data.expandedKeywords.slice(0, 24).join(", ");
  if (data.fallbackUsed) {
    showNotice("Showing demo roles because no live API returned data. Add API keys on the backend for Adzuna, Reed or Jooble coverage.");
  }
}

addKeywordButton.addEventListener("click", () => addKeyword(keywordInput.value));

keywordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addKeyword(keywordInput.value);
  }
});

keywordChips.addEventListener("click", (event) => {
  const chip = event.target.closest(".keyword-chip");
  if (!chip) return;
  keywords = keywords.filter((keyword) => keyword !== chip.dataset.keyword);
  renderKeywords();
});

cvFileInput.addEventListener("change", async () => {
  const file = cvFileInput.files[0];
  cvText = "";
  if (!file) return;
  try {
    const text = await file.text();
    const readable = text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
    if (readable.length < 120) {
      showNotice("CV uploaded, but this file did not expose much readable text in the browser. TXT files currently score best.");
      return;
    }
    cvText = readable;
    showNotice("CV loaded for match rating.");
  } catch {
    showNotice("The browser could not read this CV file. TXT files currently score best.");
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await runSearch();
  } catch (error) {
    resultHeading.textContent = "Search failed";
    showNotice(error.message);
  }
});

clearResultsButton.addEventListener("click", () => {
  resultsBody.innerHTML = `<tr><td colspan="6" class="empty-cell">Add keywords, choose filters, then search.</td></tr>`;
  resultHeading.textContent = "Ready when you are";
  notice.hidden = true;
});

loadSources();
