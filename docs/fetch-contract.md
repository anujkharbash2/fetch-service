# Fetch Service — Output Contract

## fetchPage(url, options) returns:
{
  html: string | null,
  statusCode: number | null,
  renderTimeMs: number,
  finalUrl: string,
  error: string | null,  // see error taxonomy in RUNBOOK.md
  proxyId: string | null
}