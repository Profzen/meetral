# PowerShell migration runner for Postgres / Supabase
# Usage: .\run-migrations.ps1 -ConnectionString "postgres://user:pass@host:5432/db"
param(
  [string]$ConnectionString = $null,
  [string]$SqlFile = "prisma/migrations/2025-12-12_add_lang_price_capacity.sql"
)

if (!(Test-Path $SqlFile)) { throw "Sql file not found: $SqlFile" }

$psql = "psql"

# support environment variable defaults if not provided
if (-not $ConnectionString) {
  $ConnectionString = $env:PG_CONNECTION; # explicit override
  if (-not $ConnectionString) { $ConnectionString = $env:DATABASE_URL }
  if (-not $ConnectionString) { $ConnectionString = $env:SUPABASE_DB_URL }
  if (-not $ConnectionString) { $ConnectionString = $env:SUPABASE_DATABASE_URL }
}

if (-not $ConnectionString) {
  Write-Host "No Postgres connection string found. Please set 'PG_CONNECTION' or 'DATABASE_URL' or 'SUPABASE_DB_URL' in your environment or pass -ConnectionString parameter." -ForegroundColor Yellow
  throw "Missing connection string. Example: set PG_CONNECTION to 'postgres://user:pass@host:5432/db'"
}

# If password is not set as env, try to pull from connection string for psql
if (-not $env:PGPASSWORD -and $ConnectionString -match "password=([^;]+)") { $env:PGPASSWORD = $Matches[1] }

# run migration
Write-Host "Running SQL migration $SqlFile against $ConnectionString"
& $psql $ConnectionString -f $SqlFile

if ($LASTEXITCODE -ne 0) { throw "Migration returned exit code $LASTEXITCODE" }

Write-Host "Migration executed successfully"