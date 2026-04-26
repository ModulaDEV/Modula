# Security Policy

Thanks for taking the time to help keep Modula safe.

## Scope

Modula is a protocol on Base. The components in scope for security
disclosures are:

- The smart contracts at the addresses published on
  [modulabase.org](https://www.modulabase.org) (Registry, Factory,
  per-model Agency / App, AccessRouter).
- The MCP gateway at `mcp.modulabase.org` (and any preview hosts under
  `*.modulabase.org`).
- The public website at [modulabase.org](https://www.modulabase.org)
  and the source in this repository.
- Any official client SDK published by Modula under the `@modula/*` npm
  scope.

## Out of scope

- Third-party services Modula composes with — Base mainnet itself, the
  Coinbase x402 facilitator, Safe, USDC. Please report directly to those
  projects.
- Issues in creator-hosted model runtimes. The runtime endpoint URL in
  a model's manifest is operated by the model's creator, not by Modula.
- Self-hosted forks of this repository.

## Reporting a vulnerability

**Please do not open a public GitHub issue or pull request for a
security report.** Disclosure in public makes users worse off until a
fix is in place.

Send your report to **security@modulabase.org**. If you would like to
encrypt your report, request our PGP key at the same address; we'll
respond with a current key fingerprint within 24 hours.

Include in your report, where applicable:

- A description of the issue and its impact.
- The component, contract address, or URL affected.
- Reproduction steps or a proof-of-concept (a private gist link is fine).
- Your name or handle, if you'd like credit in the post-fix advisory.

## What to expect

| Step | When |
| --- | --- |
| **Acknowledgement**     | Within **48 hours** of your initial email. |
| **Triage + severity**   | Within **5 business days**. We'll share our assessment and the planned remediation window. |
| **Coordinated fix**     | Tracked privately. We'll keep you updated weekly until the fix is shipped. |
| **Public disclosure**   | After the fix has been deployed and observed in production. We coordinate the disclosure timeline with you. |

We follow [coordinated disclosure](https://en.wikipedia.org/wiki/Coordinated_disclosure)
and ask the same of reporters. We will not pursue legal action against
researchers acting in good faith and in accordance with this policy.

## Severity & remediation targets

| Severity | Remediation target |
| --- | --- |
| **Critical** — funds at risk, registry integrity, takeover | Hot-patch within 24 hours, public advisory within 72 hours of fix |
| **High** — privilege escalation, denial of service | Patch within 7 days |
| **Medium** — info disclosure, partial DoS | Patch within 30 days |
| **Low** — defense in depth, hardening | Bundled into the next regular release |

## Hall of fame

Reporters who responsibly disclose security issues are credited (at
their option) in:

- The release notes for the version that fixes the issue.
- A `SECURITY-HALL-OF-FAME.md` file in this repository.

## Contact

- **Email:** [security@modulabase.org](mailto:security@modulabase.org)
- **Subject prefix:** `[security]`
- **Response window:** 48 hours

Thank you for keeping Modula secure.
