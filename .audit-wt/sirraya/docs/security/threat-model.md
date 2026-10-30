# Threat model (STRIDE-lite)

| Threat | Mitigation |
| --- | --- |
| Spoofing | Google OIDC + server sessions |
| Tampering | CSRF on writes; circuit ownership checks |
| Repudiation | Session audit via DB session rows |
| Information disclosure | Private circuits; redacted logs |
| Denial of service | Rate limits + simulation slots |
| Elevation | Server-side auth on all private APIs |

Sirraya reference site is out of scope for our deployment boundary.
