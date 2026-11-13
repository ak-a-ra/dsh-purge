# 1.6.62 maintenance record

## rc.5 evidence

- Source: `https://download.deepseek.com/dsh-desk/bin/mac-arm64/deepseek-harness-0.2.1-rc.5-mac-arm64.zip` (nightly feed, 2026-10-29).
- Method: extracted `app.asar` + `app.asar.unpacked`, ran `patchDrift` over the whole `@deepseek-ai` tree: `checked 82 / drifted 0`; `optionalDrift` only #76 (preset body needs no handling); `missing` only third-party targets.
- Desktop shell: after placing the app directory as `Resources/app`, #45/#46/#82/#83/#84 all apply.
- Boundary: zero source-level drift + real replacement verification; runtime behavior still needs the user to run `selfcheck`/`diagnose` after updating to confirm.

## Basis for the #107 call

- `lib/identity.js` keeps only `
`