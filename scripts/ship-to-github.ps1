param(
  [string]$Message,
  [string]$RemoteUrl,
  [string]$Branch
)

$ErrorActionPreference = "Stop"

trap {
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}

function Write-Step {
  param([string]$Text)
  Write-Host "==> $Text" -ForegroundColor Cyan
}

function Require-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' was not found. Install it, then run ship-to-github again."
  }
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

Require-Command "git"

$insideWorkTree = git rev-parse --is-inside-work-tree 2>$null
if ($insideWorkTree -ne "true") {
  throw "This folder is not a Git repository."
}

if (-not $Branch) {
  $Branch = git branch --show-current
}

if (-not $Branch) {
  $Branch = "main"
  Write-Step "Creating branch '$Branch'"
  git checkout -b $Branch
}

$remoteNames = git remote
$hasOrigin = $remoteNames -contains "origin"
$originUrl = $null
if ($hasOrigin) {
  $originUrl = git remote get-url origin
}

if (-not $hasOrigin -or -not $originUrl) {
  if (-not $RemoteUrl) {
    throw "No GitHub remote is configured. Run: .\ship-to-github.cmd -RemoteUrl https://github.com/YOUR-USER/YOUR-REPO.git"
  }

  Write-Step "Connecting local repo to GitHub remote"
  git remote add origin $RemoteUrl
} elseif ($RemoteUrl -and $RemoteUrl -ne $originUrl) {
  Write-Step "Updating GitHub remote"
  git remote set-url origin $RemoteUrl
}

Write-Step "Checking portfolio changes"
$status = git status --porcelain
if (-not $status) {
  Write-Host "No local changes to ship. Your portfolio is already committed." -ForegroundColor Green
} else {
  if (-not $Message) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $Message = "Update portfolio ($timestamp)"
  }

  Write-Step "Committing portfolio update"
  git add -A
  git commit -m $Message
}

Write-Step "Pushing '$Branch' to GitHub"
git push -u origin $Branch

Write-Step "Triggering GitHub Pages deploy"
Write-Host "GitHub Actions will deploy the portfolio from .github/workflows/deploy-pages.yml." -ForegroundColor Green
Write-Host "Open your repository's Actions tab to watch the deployment." -ForegroundColor Green
