# Handover guide

## Read first

1. [00-project-charter.md](../00-project-charter.md)  
2. [03-evidence-register.md](../03-evidence-register.md)  
3. [implementation-status.md](./implementation-status.md)  

## Run locally

[DEVELOPMENT.md](../../../DEVELOPMENT.md)

## Entry points

| Surface | URL |
| --- | --- |
| Tools hub (Sirraya-style) | http://localhost:3000/hub |
| Document Pro | /hub/document-pro |
| Doc Editor | /hub/doc-editor |
| ML Studio | /hub/ml-studio |
| Quantum Academy | /academy |
| TSP API (Sirraya client) | POST http://localhost:8000/api/v3/solve-tsp |

## REA deeper capture

```powershell
.\sirraya\scripts\setup-rea.ps1
# if unhealthy:
npx rea-agents setup
```

Then follow [rea-mcp-setup.md](../operations/rea-mcp-setup.md).

## Tests

```powershell
.\.venv\Scripts\python.exe -m pytest api\tests sirraya\api\tests -q
.\sirraya\scripts\link-sirraya-dev.ps1
cd web
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test:e2e
```
