# #130 / #132 / #137: install targeting, mirror, and market acceptance

2026-11-05, 1.6.75. **The maintainer is aware that Windows full-transaction acceptance is blocked by a Defender intercept, and has explicitly approved the release; this limitation remains unresolved.**

## Fix scope

- #130: bounded reads of the same app's old Desktop CLI and the new `@deepseek-ai/dsh` manifest bin; the new shell's Node wrapper, bundled pnpm, and lock-recovery runner are reused. Missing or out-of-bounds values error out; the workspace, profile, and user directories are not scanned to pick another install. The installer distinguishes the old desktop and new web default profiles and preserves custom profiles.
- Versions inside the archive are read-only diagnostic evidence, not writable paths. Not-unpacked, missing component, and mixed-version cases are each reported separately. A corrupted existing app directory is not substituted with the archive's healthy files.
- #132: mirror settings are persisted and used uniformly for metadata checks and downloads. The mirror and its redirect chain never receive the Token. Install still enforces this repository's official release URLs, official digests, SHA256, and package identity checks; an unreachable official digest still fails.
- #137: the index reads the compatibility range per release. Older versions without a declared range keep the old range; user compatibility exemptions are not modified.

No host patch definitions, prompt content, or user permissions were modified. No model-bypass capability was tested or claimed. No formal DSH settings, proxy, or process was operated on.

## Verification

- Default Node regression: 553 items, 532 passed, 21 conditional skips, 0 failed.
- Panel tests: 29 passed; community bundle, format, version, and release-package import checks passed.
- Mac CLI-only isolated Electron: real CLI/pnpm first install, 1.6.74 upgrade, old-dependency alias migration, backup, rollback, re-upgrade, and install/rollback failure recovery all passed. User content added after the backup was checked to still be preserved. The OS sandbox forbids writes to the formal app, the user DSH home, and log directories.
- Windows original install package: DSH Desktop 0.13.2 / kernel 0.2.2-alpha.2; extracted from the installer without installing or launching the GUI. SHA512 matches the release metadata; Authenticode is Valid. Under real Electron, CLI targeting, archive version diagnostics, web profile initialization, and the packed pnpm/runner `--version` all passed.
- Windows isolated Electron: 43 component / real-TLS tests passed; Mac isolated Electron: 24 corresponding targeting / mirror / real-TLS tests passed.
- Windows Node full regression passed (platform-conditional items skipped as declared); the PowerShell 5.1 wrapper component test passed. Neither of these substitutes for a real install.
- Windows **full install failed**, so the final acceptance of upgrade and rollback has not passed and cannot be substituted by the item above.
- Mac public-mirror on-device test: through the explicit `https://gh-proxy.org/`, the release list was queried and the existing 1.6.74 downloaded; independent official digest and package verification passed. The test carried no Token. Mirror availability is only this observation, not a service guarantee.
- Real DSH 0.2.2-rc.1's `evaluatePluginCompatibility`: the generated 1.6.74 index accepts rc.1 and still rejects 0.3.0; the 66 historical release records were each processed.

The install checks above did not start a model, call apply, start a host service, or click through the GUI market; dependency caches may have been reused, so this is not a full-network cold install.

## Windows blocker: the real failure is kept

The first real install found that the package-manager environment the wrapper needs was not propagated; this was fixed. Afterward, the new profile's `pnpm add` returned `ERR_PNPM_UNKNOWN`, specifically a store-file open failure. Reading the Defender detection record confirmed that isolation happened in the same test run:

- Detection name: `Backdoor:PHP/Chopper.E!dha`, ThreatID `2147891541`.
- Original file in the release package: `skills/redteam/unauth-exploit.md`.
- SHA512 of that file: `96bce1192f61f904f9ce13e95e2afd0fd75ddffe4cba022e1de01f61ad592e4f87f949bfe74f06c07afe34215c8e62aa750dce58be5765eda389bfea4a706506`, matching the pnpm store target.
- This file's SHA512 is identical in the published 1.6.74 and the candidate package; it was not modified in this run. The one earlier success on the cache-reuse path does not prove a fresh install or that the problem is gone.
- The failed install report restored the previous dependency/manifest and kept the snapshot; this observation does not equal passing the full upgrade/rollback matrix.

Defense was not disabled, no allowlist entry was added, the file was not deleted / encoded / renamed to dodge detection, and no file was submitted to Microsoft. The isolation log is preserved; it cannot be claimed as a false positive at this point. After reviewing the above real results, the maintainer explicitly requested merging and releasing. The release notes keep this failed on-machine acceptance; the release authorization is not equated with the fault being fixed or full acceptance passing.

## Reproduction entry

`check-update-layout-runtime.mjs` must run in Electron Node mode with a marked isolated fixture; arguments are the fixture root, that fixture's CLI, the published baseline TGZ, and the candidate TGZ. Mac forbids the formal .app runtime and applies write restrictions. The script performs real install transactions and does not fabricate profiles or consent records.

`test/desktop-cli-130.test.mjs` covers old/new directory layouts, manifest out-of-bounds, unrelated workspace/home directories, the shared resolver, and pnpm boundaries; `test/update-mirror.test.mjs` covers source rejection, Token isolation, redirects, authoritative digest failure, and old preference preservation. Component tests are not a substitute for a real full transaction.

REA static evidence `ev_3087f8712b65694554ba319dc8aae1add4d0d7ecbccb294943cd9d7ab8702015` parses the extracted packaged-pnpm-invocation module; the static result does not prove runtime success. Plain source reads of the package's wrapper/main plus the real child-process tests above together confirm the required environment contract.
