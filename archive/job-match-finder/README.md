# Job Match Finder

A standalone, calm job search website with:

- Keyword chips for broad, close-match searching.
- UK location, posting date, work type and experience filters.
- CV upload for match rating without exposing a CV text box in the UI.
- Weighted match rating out of 10.
- Broad-source connector hooks instead of company-specific ATS slugs.

## Run

```powershell
npm start
```

Open `http://localhost:4173`.

## Live data sources

The app is designed around broad job APIs:

- Adzuna API
- Reed API
- Find a job / DWP
- Jooble API
- The Muse API
- Remotive API

The Muse and Remotive are queried without company slugs. Adzuna, Reed and Jooble need API keys:

```powershell
$env:ADZUNA_APP_ID="your_app_id"
$env:ADZUNA_APP_KEY="your_app_key"
$env:REED_API_KEY="your_reed_key"
$env:JOOBLE_API_KEY="your_jooble_key"
npm start
```

The Find a job / DWP source is kept in the source list, but this prototype does not call a stable official search API because one is not clearly exposed for public job search use.
