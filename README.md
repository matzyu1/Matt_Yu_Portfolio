# Matz Yu Portfolio Website

Live site: [https://matt-yu.com](https://matt-yu.com/)

This repository contains the source code for my main personal portfolio website. The site presents my data analytics projects, dashboard work, technical skills, work experience, volunteering experience, and contact links.

## Purpose

The purpose of this portfolio is to give recruiters and hiring teams a clear view of my current work as an entry-level data analyst candidate. It is focused on practical projects using SQL, Excel, Power Query, Power BI, and related tools.

This repo is intended to stay focused on the main portfolio website. Larger standalone AI or job-search projects should live in their own repositories later.

## Main Site Sections

- Home and contact details
- About
- Skills
- Featured projects
- Experience
- Volunteering
- Currently learning

## Tech Stack

- HTML
- CSS
- JavaScript
- GitHub Pages
- Custom domain via `CNAME`

## Project Structure

```text
.
|-- .github/
|   `-- workflows/
|       `-- deploy-pages.yml
|-- archive/
|   |-- job-search.html
|   `-- job-match-finder/
|-- assets/
|   |-- Matt-Yu-Data-Analyst-CV.pdf
|   `-- projects/
|-- docs/
|   `-- design-system/
|       `-- personal-portfolio/
|-- scripts/
|   |-- ship-to-github.cmd
|   `-- ship-to-github.ps1
|-- .gitignore
|-- CNAME
|-- index.html
|-- README.md
|-- script.js
`-- style.css
```

## Project Notes

- `index.html`, `style.css`, `script.js`, `assets/`, `CNAME`, and `.github/workflows/deploy-pages.yml` are the main files used by the live portfolio.
- `archive/job-search.html` is an older standalone job-search page. It is not linked from the main portfolio navigation.
- `archive/job-match-finder/` is a standalone job-matching app prototype. It should eventually move to a separate repository, likely named `recruiter-ai-screening-assistant`.
- `docs/design-system/personal-portfolio/` stores design-system notes used while improving the portfolio UI.
- `scripts/ship-to-github.ps1` and `scripts/ship-to-github.cmd` are personal helper scripts for committing and pushing portfolio updates. They do not contain private keys or credentials.

## Future Improvements

- Add dedicated case-study pages for selected projects.
- Move standalone AI/job-search apps into separate repositories.
- Add better project filtering once there are more projects.
- Review image sizes periodically so the homepage stays fast.
- Keep project descriptions updated as new work is completed.

## GitHub Repo Presentation

Suggested GitHub About description:

```text
Personal portfolio website for my data, AI and creative projects.
```

Suggested topics:

```text
portfolio
github-pages
html
css
javascript
data-analytics
ai-projects
```
