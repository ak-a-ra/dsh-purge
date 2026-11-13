# DSH Store: main plugin path and compatibility declaration

This page addresses the two metadata issues in [DSH Store #1650](https://github.com/AI-Scarlett/DSH-Store/issues/1650). DSH Store is a third-party market; its static inclusion rules are not the DSH official plugin spec and do not equal runtime acceptance.

## The single install target

- Repository: `https://github.com/kingcharleslzy-ai/dsh-purge`
- **Plugin path (optional): `.`**
- manifest: `package.json`
- package name: `dsh-purge-community`
- bundle: `cordis.patch.yml`

[Open the application form with the main plugin directory already filled in](https://github.com/AI-Scarlett/DSH-Store/issues/new?template=plugin-submission.yml&repository=https%3A%2F%2Fgithub.com%2Fkingcharleslzy-ai%2Fdsh-purge&plugin-path=.). Confirm the path box is still `.` before submitting. The form currently says "leave the root directory blank," but its `safeRelativeDirectory()` treats an empty value as auto-discovery; a multi-plugin repository then produces `SUBMISSION_PACKAGE_AMBIGUOUS`. An explicit `.` is what means the root directory.

`packages/purge-panel` is a reserved standalone panel package and is not this main plugin's install target. Do not delete it or change functionality to eliminate the discovery ambiguity. Do not use `tree/master` as a reliable root-directory selection; in the current resolver it still falls back to auto-discovery.

## What the compatibility declaration means

`package.json` uses the `dsh.compatibility.dsh`, `profiles`, and `dshReleases` fields the market actually reads; the Node.js range remains the existing `engines.node >=18`. No `engines.dsh` install blocker is added here, and the plugin's existing host targeting and runtime behavior are unchanged.

| DSH full version | Declaration | Basis and limitations |
| --- | --- | --- |
| 0.2.1-rc.1 / rc.2 / rc.3 | compatible | Previously supported versions verified on isolated hosts; see the README compatibility table, maintenance records, and CI |
| 0.2.1-rc.4 | unknown | No equivalent full evidence for this version; not inferred from adjacent versions |
| 0.2.1-rc.5 | compatible | [1.6.62 host source verification](maintenance-1.6.62.md) and [1.6.63 on-device diagnostics](maintenance-1.6.63.md); this is the author's host-compatibility declaration |
| 0.2.2-alpha.2 | unknown | Verification for this version is incomplete; a version-range hit alone does not make it compatible |

The range describes the target host API release line; the exact version status is the market's compatibility declaration. `compatible` here does not mean end-to-end acceptance on every platform, install method, or feature. Per-release `dshOperations` records for the current pinned Commit are not provided; the market should keep install/start/uninstall/rollback evidence as unknown rather than moving old records to the new Commit automatically. Windows Defender detections are an independent install-environment issue; metadata cannot exempt them.

## Re-checks and boundaries

- This is a metadata correction; it keeps the main branch's existing SemVer (currently 1.6.64), does not replace existing Release assets, and does not mix an unpublished installer candidate into the market application.
- The market re-pins the default branch's full Commit; select the root directory explicitly at submission time. If the source changes, the same version needs a new Commit re-check.
- Resolving these two issues does not equal being listed. Dependencies, permissions, static source, and protected host operations are still reviewed under the market's original rules; a failure keeps its specific reason.
- No features are deleted, permissions hidden, compatibility faked, or scan results tampered with in order to pass market checks. The main plugin includes host-maintenance capabilities and should be disclosed as such; whether the market accepts such plugins is decided by its rules and maintainers.

## 2026-10-30 pinned-source pre-check

Using DSH Store's own checker, submit Commit `66e6c77a316450da08648458e25da3438e278c46` and run a read-only pre-check against the public fix commit `96e88852ec3532e12a11955088a3c2e1d216364e`:

- Path left blank: `SUBMISSION_PACKAGE_AMBIGUOUS` reproduced, with candidates `.` and `packages/purge-panel`.
- Explicit `.`: only the root `package.json` and `cordis.patch.yml` are read; the panel manifest is no longer read and the directory ambiguity disappears.
- The market's `inferredCompatibility()` can read the exact version declarations; rc.4/alpha.2 stay unknown, rc.5 is compatible, and the per-item operational evidence is empty rather than a faked passed.
- The full pre-check still stops at the Bundle stage: `SUBMISSION_PATCH_AMBIGUOUS: Unsupported Patch inline sequence requires review`. This is a separate gate; the first two fixes cannot be claimed as the whole pre-check passing.

The existing Bundle contains `inject: [systemPrompt, tools]`, an old-plugin `disabled` migration entry, and a `!!js` path configuration; the market's bounded parser accepts only narrower syntax and operations. Even with string quoting, the later syntax/operations still need independent review. The Bundle is kept as-is; no configuration is deleted, no functionality is downgraded, and the market checker is not tampered with.
