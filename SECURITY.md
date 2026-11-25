# Security policy

Better Deezer runs inside your Deezer session and, on Windows, modifies the Deezer app. A flaw could therefore reach your account or your computer, so please report it privately.

## Supported versions

Only the [latest release](https://github.com/Gabizoc/Better-Deezer/releases/latest) receives fixes. Update with `better-deezer update` on Windows; the Chrome extension updates itself.

| Version | Supported |
|---|---|
| 1.2.x | ✅ |
| < 1.2 | ❌ |

## Report a vulnerability

Use GitHub's private reporting: **Security › Report a vulnerability** on the repository ([direct link](https://github.com/Gabizoc/Better-Deezer/security/advisories/new)). **Do not open a public issue.**

Include:

- the affected version and target (Windows app, Chrome extension, userscript);
- steps to reproduce, or a proof of concept;
- what an attacker could do with it.

You will get a reply as soon as possible. The fix ships in a new release, and the advisory is published afterwards, crediting you if you agree.

## Scope

In scope:

- the skin code (`src/`), the Chrome extension (`extension/`) and the userscript;
- the Windows scripts (`desktop/`), especially the `app.asar` patch, the installer and `better-deezer update` (download and SHA-256 check);
- theme validation: a theme must never run code or load an external resource;
- the release pipeline (`.github/workflows/`) and published files.

Out of scope:

- flaws in Deezer itself: report them to Deezer;
- issues that need an already compromised computer or browser;
- a theme you wrote yourself and imported by hand doing something you asked it to.

## Your data

Better Deezer has no server, no account and no telemetry. Fonts and assets ship inside the extension and the app. The only network requests are listed in [docs/privacy.md](docs/privacy.md).

Nobody will ever ask for your cookies, tokens or `arl` value. If someone does in the name of Better Deezer, it is not us.
