# System context

```mermaid
C4Context
  title QuantumWalk / Sirraya program context
  Person(learner, Learner, Browser user)
  System(qw, QuantumWalk, Education platform)
  System_Ext(google, Google OAuth, Identity)
  System_Ext(sirraya_ref, tools.sirraya.org, Reference UI only)

  Rel(learner, qw, Uses)
  Rel(learner, sirraya_ref, Observes behavior)
  Rel(qw, google, Authenticates)
```

Learners use QuantumWalk for simulation-grounded academy content. Sirraya is an **external reference**, not a runtime dependency.
