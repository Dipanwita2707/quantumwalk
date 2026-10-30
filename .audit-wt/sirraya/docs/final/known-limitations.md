# Known limitations

1. REA MCP not registered until you run `npx rea-agents setup` (see [rea-mcp-setup.md](../operations/rea-mcp-setup.md)).  
2. Document Pro lacks e-signatures, sealing, and docx export.  
3. Doc Editor has no cloud sync or AI provider integration.  
4. ML Studio is a visualization toy, not a training pipeline.  
5. 6-city Grover uses 10-qubit statevector simulation — may be slow; not NISQ hardware.  
6. QAOA/VQE share Grover sampling backend with algorithm label (honest placeholder).  
7. Not production-ready until OAuth E2E, backup drill, and full CI E2E on your machine.  
