import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const sourceList = [
  "Adzuna API",
  "Reed API",
  "Find a job / DWP",
  "Jooble API",
  "The Muse API",
  "Remotive API",
];

const keywordFamilies = {
  "data analyst": [
    "data analyst",
    "insight analyst",
    "business analyst",
    "commercial analyst",
    "bi analyst",
    "reporting analyst",
    "customer analyst",
    "data consultant",
    "investment analyst",
    "operations analyst",
    "marketing analyst",
  ],
  junior: ["junior", "entry level", "entry-level", "graduate", "associate", "assistant", "trainee", "early career"],
  sql: ["sql", "postgresql", "mysql", "database", "querying"],
  excel: ["excel", "spreadsheet", "pivot table", "power query", "vlookup", "xlookup"],
  "power bi": ["power bi", "dashboard", "dax", "reporting", "business intelligence"],
  python: ["python", "pandas", "numpy", "data cleaning", "automation"],
  remote: ["remote", "home based", "work from home"],
  hybrid: ["hybrid", "flexible working"],
};

const demoJobs = [
  {
    companyName: "Northstar Retail",
    jobTitle: "Junior Insight Analyst",
    workMode: "Hybrid",
    salary: "GBP 30,000 - GBP 35,000",
    url: "https://example.com/jobs/junior-insight-analyst",
    source: "Demo",
    location: "London",
    workType: "Full time",
    experienceLevel: "Entry",
    created: new Date().toISOString(),
    description:
      "Entry-level insight analyst role using SQL, Excel, Power BI dashboards, customer segmentation, ecommerce trends, stakeholder presentations and campaign reporting.",
  },
  {
    companyName: "FinSight Partners",
    jobTitle: "Investment Data Analyst",
    workMode: "On-site",
    salary: "Not mentioned",
    url: "https://example.com/jobs/investment-data-analyst",
    source: "Demo",
    location: "London",
    workType: "Full time",
    experienceLevel: "Mid",
    created: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    description:
      "Analyse financial performance, prepare reporting packs, clean data in Excel, monitor trends, support senior stakeholders and present analysis to investment teams.",
  },
  {
    companyName: "MarketPulse",
    jobTitle: "Business Analyst - Customer Operations",
    workMode: "Remote",
    salary: "GBP 32,000",
    url: "https://example.com/jobs/business-analyst-customer-ops",
    source: "Demo",
    location: "United Kingdom",
    workType: "Contract",
    experienceLevel: "Entry",
    created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    description:
      "Business analyst role focused on operations, customer insight, process reporting, requirements gathering, dashboards, performance tracking and communication with cross-functional teams.",
  },
  {
    companyName: "GrowthLab Commerce",
    jobTitle: "E-commerce Data Consultant",
    workMode: "Hybrid",
    salary: "GBP 35,000 - GBP 42,000",
    url: "https://example.com/jobs/ecommerce-data-consultant",
    source: "Demo",
    location: "Manchester",
    workType: "Full time",
    experienceLevel: "Mid",
    created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    description:
      "Consulting role building ecommerce dashboards, SQL reporting, marketing analytics, retention analysis, product performance insight and client-facing recommendations.",
  },
];

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function textFrom(value) {
  return String(value || "").toLowerCase();
}

function expandKeywords(keywords) {
  const terms = new Set();
  keywords
    .flatMap((item) => String(item).split(/[,\n]+/))
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .forEach((term) => {
      terms.add(term);
      Object.entries(keywordFamilies).forEach(([family, synonyms]) => {
        if (term.includes(family) || synonyms.some((synonym) => term.includes(synonym))) {
          synonyms.forEach((synonym) => terms.add(synonym));
        }
      });
    });

  return [...terms];
}

function countMatches(text, terms) {
  const haystack = textFrom(text);
  return terms.reduce((count, term) => count + (haystack.includes(term.toLowerCase()) ? 1 : 0), 0);
}

function metricScore(text, terms, cap = 4) {
  return Math.min(100, Math.round((countMatches(text, terms) / cap) * 100));
}

function inferWorkMode(text) {
  const value = textFrom(text);
  if (/\bremote|work from home|home based\b/.test(value)) return "Remote";
  if (/\bhybrid|flexible working\b/.test(value)) return "Hybrid";
  if (/\bon-site|onsite|office based|office-based\b/.test(value)) return "On-site";
  return "Not-Specified";
}

function inferWorkType(text) {
  const value = textFrom(text);
  if (/\bintern|internship|placement\b/.test(value)) return "Internship";
  if (/\bcontract|fixed term|temporary|temp\b/.test(value)) return "Contract";
  if (/\bpart time|part-time\b/.test(value)) return "Part time";
  return "Full time";
}

function inferExperienceLevel(text) {
  const value = textFrom(text);
  if (/\bsenior|lead|principal|manager|head of\b/.test(value)) return "Senior";
  if (/\bmid|experienced|specialist|consultant\b/.test(value)) return "Mid";
  if (/\bjunior|entry|entry-level|graduate|assistant|associate|trainee\b/.test(value)) return "Entry";
  return "Not specified";
}

function inferSalary(text) {
  const value = String(text || "");
  const match = value.match(/(?:GBP|£)\s?\d{2,3}(?:,\d{3})?(?:\s?[-–]\s?(?:GBP|£)?\s?\d{2,3}(?:,\d{3})?)?/i);
  return match ? match[0].replace(/£/g, "GBP ") : "Not mentioned";
}

function scoreJob(job, cvText, expandedKeywords) {
  const titleText = `${job.jobTitle} ${job.description}`;
  const allText = `${job.jobTitle} ${job.companyName} ${job.location} ${job.description}`;
  const cv = textFrom(cvText);
  const technical = ["sql", "excel", "power bi", "python", "power query", "dashboard", "reporting", "data cleaning"];
  const analytical = ["analysis", "insight", "trend", "segmentation", "performance", "tracking", "forecast", "kpi"];
  const domains = ["e-commerce", "ecommerce", "customer", "marketing", "finance", "operations", "sales", "retail", "media"];
  const seniority = ["junior", "entry-level", "entry level", "graduate", "assistant", "associate", "trainee"];
  const soft = ["stakeholder", "communication", "teamwork", "presentation", "customer-facing", "customer service"];
  const evidence = ["project", "dashboard", "recommendation", "improved", "reduced", "increased", "%", "sql", "power bi"];

  const cvAvailable = cv.length > 80;
  const metrics = {
    titleRelevance: metricScore(titleText, expandedKeywords, 3),
    technicalSkills: cvAvailable ? Math.round((metricScore(allText, technical, 5) + metricScore(cv, technical, 5)) / 2) : metricScore(allText, technical, 5),
    analyticalExperience: cvAvailable ? Math.round((metricScore(allText, analytical, 4) + metricScore(cv, analytical, 4)) / 2) : metricScore(allText, analytical, 4),
    domainRelevance: cvAvailable ? Math.round((metricScore(allText, domains, 3) + metricScore(cv, domains, 3)) / 2) : metricScore(allText, domains, 3),
    seniorityFit: metricScore(`${job.jobTitle} ${job.description}`, seniority, 2),
    softSkills: cvAvailable ? Math.round((metricScore(allText, soft, 2) + metricScore(cv, soft, 2)) / 2) : metricScore(allText, soft, 2),
    evidenceStrength: cvAvailable ? metricScore(cv, evidence, 4) : metricScore(allText, evidence, 4),
  };

  const weighted =
    metrics.titleRelevance * 0.15 +
    metrics.technicalSkills * 0.25 +
    metrics.analyticalExperience * 0.2 +
    metrics.domainRelevance * 0.1 +
    metrics.seniorityFit * 0.1 +
    metrics.softSkills * 0.1 +
    metrics.evidenceStrength * 0.1;

  return {
    ...job,
    salary: job.salary || inferSalary(job.description),
    workMode: job.workMode || inferWorkMode(job.description),
    workType: job.workType || inferWorkType(job.description),
    experienceLevel: job.experienceLevel || inferExperienceLevel(`${job.jobTitle} ${job.description}`),
    matchRating: Number((weighted / 10).toFixed(1)),
    metrics,
  };
}

function normalizeJob(job) {
  return {
    companyName: job.companyName || job.company || "Unknown company",
    jobTitle: job.jobTitle || job.title || "Untitled role",
    workMode: job.workMode || inferWorkMode(`${job.title} ${job.description} ${job.location}`),
    salary: job.salary || inferSalary(`${job.description} ${job.salary_min || ""} ${job.salary_max || ""}`),
    url: job.url || job.redirect_url || job.absolute_url || "#",
    source: job.source || "Unknown",
    location: job.location || "Not specified",
    workType: job.workType || inferWorkType(`${job.title} ${job.description}`),
    experienceLevel: job.experienceLevel || inferExperienceLevel(`${job.title} ${job.description}`),
    created: job.created || job.createdAt || job.publicationDate || null,
    description: job.description || job.content || "",
  };
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { "user-agent": "JobMatchFinder/1.0", ...options.headers } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

function buildKeywordQuery(keywords) {
  return keywords.slice(0, 12).join(" ");
}

async function searchAdzuna({ keywords, location, filters }) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return [];
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: "30",
    what_or: buildKeywordQuery(keywords),
    where: location || "United Kingdom",
    sort_by: "date",
    "content-type": "application/json",
  });
  if (filters.postedWithin) params.set("max_days_old", String(filters.postedWithin));
  if (filters.workType === "full-time") params.set("full_time", "1");
  if (filters.workType === "part-time") params.set("part_time", "1");
  if (filters.workType === "contract") params.set("contract", "1");

  const data = await fetchJson(`https://api.adzuna.com/v1/api/jobs/gb/search/1?${params}`);
  return (data.results || []).map((item) =>
    normalizeJob({
      companyName: item.company?.display_name,
      jobTitle: item.title,
      salary: item.salary_min ? `GBP ${Math.round(item.salary_min).toLocaleString()}${item.salary_max ? ` - GBP ${Math.round(item.salary_max).toLocaleString()}` : ""}` : "Not mentioned",
      url: item.redirect_url,
      source: "Adzuna API",
      location: item.location?.display_name,
      created: item.created,
      description: item.description,
    })
  );
}

async function searchReed({ keywords, location, filters }) {
  const apiKey = process.env.REED_API_KEY;
  if (!apiKey) return [];
  const params = new URLSearchParams({
    keywords: buildKeywordQuery(keywords),
    locationName: location || "United Kingdom",
    resultsToTake: "30",
  });
  if (filters.workType === "full-time") params.set("fullTime", "true");
  if (filters.workType === "part-time") params.set("partTime", "true");
  if (filters.workType === "contract") params.set("contract", "true");
  if (filters.experienceLevel === "entry") params.set("graduate", "true");

  const auth = Buffer.from(`${apiKey}:`).toString("base64");
  const data = await fetchJson(`https://www.reed.co.uk/api/1.0/search?${params}`, {
    headers: { authorization: `Basic ${auth}` },
  });
  return (data.results || []).map((item) =>
    normalizeJob({
      companyName: item.employerName,
      jobTitle: item.jobTitle,
      salary: item.minimumSalary || item.maximumSalary ? `GBP ${item.minimumSalary || "?"} - GBP ${item.maximumSalary || "?"}` : "Not mentioned",
      url: item.jobUrl,
      source: "Reed API",
      location: item.locationName,
      created: item.date,
      description: item.jobDescription || item.description,
    })
  );
}

async function searchJooble({ keywords, location, filters }) {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) return [];
  const data = await fetchJson(`https://jooble.org/api/${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      keywords: buildKeywordQuery(keywords),
      location: location || "United Kingdom",
      page: 1,
      ResultOnPage: 30,
      period: filters.postedWithin || undefined,
    }),
  });
  return (data.jobs || []).map((item) =>
    normalizeJob({
      companyName: item.company,
      jobTitle: item.title,
      salary: item.salary || "Not mentioned",
      url: item.link,
      source: "Jooble API",
      location: item.location,
      created: item.updated,
      description: item.snippet,
    })
  );
}

async function searchMuse({ keywords, location }) {
  const params = new URLSearchParams({
    page: "1",
    descending: "true",
  });
  if (keywords.length) params.set("keyword", buildKeywordQuery(keywords));
  if (location) params.append("location", location);

  const data = await fetchJson(`https://www.themuse.com/api/public/jobs?${params}`);
  return (data.results || []).map((item) =>
    normalizeJob({
      companyName: item.company?.name,
      jobTitle: item.name,
      salary: "Not mentioned",
      url: item.refs?.landing_page,
      source: "The Muse API",
      location: item.locations?.map((place) => place.name).join(", "),
      created: item.publication_date,
      description: item.contents,
    })
  );
}

async function searchRemotive({ keywords }) {
  const params = new URLSearchParams();
  if (keywords.length) params.set("search", buildKeywordQuery(keywords));
  const data = await fetchJson(`https://remotive.com/api/remote-jobs?${params}`);
  return (data.jobs || []).map((item) =>
    normalizeJob({
      companyName: item.company_name,
      jobTitle: item.title,
      workMode: "Remote",
      salary: item.salary || "Not mentioned",
      url: item.url,
      source: "Remotive API",
      location: item.candidate_required_location || "Remote",
      created: item.publication_date,
      description: item.description,
    })
  );
}

async function searchDwp() {
  return [];
}

function createdWithin(job, days) {
  if (!days || !job.created) return true;
  const created = new Date(job.created);
  if (Number.isNaN(created.getTime())) return true;
  return Date.now() - created.getTime() <= Number(days) * 24 * 60 * 60 * 1000;
}

function passesFilters(job, filters) {
  if (!createdWithin(job, filters.postedWithin)) return false;
  if (filters.workType && filters.workType !== "any" && textFrom(job.workType) !== filters.workType.replace("-", " ")) return false;
  if (filters.experienceLevel && filters.experienceLevel !== "any" && textFrom(job.experienceLevel) !== filters.experienceLevel) return false;
  return true;
}

async function runSearch(payload) {
  const keywords = expandKeywords(payload.keywords || []);
  const location = payload.location || "United Kingdom";
  const filters = {
    postedWithin: Number(payload.postedWithin || 7),
    workType: payload.workType || "any",
    experienceLevel: payload.experienceLevel || "any",
  };
  const connectorInput = { keywords, location, filters };
  const connectors = [
    searchAdzuna(connectorInput),
    searchReed(connectorInput),
    searchDwp(connectorInput),
    searchJooble(connectorInput),
    searchMuse(connectorInput),
    searchRemotive(connectorInput),
  ];

  const settled = await Promise.allSettled(connectors);
  const jobs = settled.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
  const fallbackUsed = jobs.length === 0;
  const searchedJobs = fallbackUsed ? demoJobs : jobs;
  const filtered = searchedJobs
    .map(normalizeJob)
    .filter((job) => {
      const text = `${job.jobTitle} ${job.description} ${job.location}`.toLowerCase();
      return keywords.length === 0 || keywords.some((keyword) => text.includes(keyword.toLowerCase()));
    })
    .map((job) => scoreJob(job, payload.cvText || "", keywords))
    .filter((job) => passesFilters(job, filters))
    .sort((a, b) => b.matchRating - a.matchRating);

  return {
    jobs: filtered,
    expandedKeywords: keywords,
    fallbackUsed,
    supportedSources: sourceList,
    connectorNotes: {
      readyWithoutCompanySlugs: ["Adzuna API", "Reed API", "Jooble API", "The Muse API", "Remotive API"],
      needsEnvironmentKeys: ["ADZUNA_APP_ID + ADZUNA_APP_KEY", "REED_API_KEY", "JOOBLE_API_KEY"],
      dwpNote: "A stable official Find a job / DWP search API is not currently exposed in this prototype.",
    },
  };
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(root, safePath);
  try {
    const body = await readFile(filePath);
    res.writeHead(200, { "content-type": mimeTypes[extname(filePath)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/api/sources") return json(res, 200, { sources: sourceList, keywordFamilies });
    if (req.method === "POST" && req.url === "/api/search") return json(res, 200, await runSearch(await readBody(req)));
    return serveStatic(req, res);
  } catch (error) {
    json(res, 500, { error: error.message });
  }
}).listen(port, () => {
  console.log(`Job Match Finder running at http://localhost:${port}`);
});
