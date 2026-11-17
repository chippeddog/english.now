# Security Policy

## Reporting a vulnerability

Please report security issues privately, not in public issues or pull requests.

- Preferred: use GitHub's **Report a vulnerability** button on the repository's Security tab (private vulnerability reporting).
- Alternatively, email **hello@english.now** with the subject `SECURITY`.

Include a description of the issue, steps to reproduce, and the impact you expect. We aim to acknowledge reports within 3 business days and to share a fix timeline after triage.

## Scope

In scope:

- The code in this repository (`apps/*` and `packages/*`)
- The hosted service at `english.now` and `api.english.now`

Out of scope:

- Denial of service through volumetric traffic
- Findings that require a compromised user device or browser
- Missing security headers without a demonstrated impact

## Supported versions

Only the latest commit on `main` receives security fixes.
