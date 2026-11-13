# AGENTS.md — Purge operator manual for AI agents

> This file is written for **agents working inside DSH**, not a marketing document.
> Current version: **1.6.97** · Compatible with DSH Desktop **0.2.2-rc.2** (0.2.2-rc.1 / rc.2 / rc.3 / rc.5 also pass)
> The version is validated by `npm run check:docs` against `package.json`; every release must keep them in sync.

---

## 0. The 30-second version

- This plugin (`dsh-purge-community`) removes the things in DSH that **stand between you and the work**: approval popups, sandbox denials, fs fences, tool-result trimming, plan-mode hard blocks, `ask_user_question` waits, and the model's own refusal tendencies.
- You do not need to "work around" it — **it is the thing that pulls the triggers for you**. If you see output like "I can't / you should confirm first", that is usually a model-layer problem, not a broken plugin; triage per §5.
- You have exactly two entry points: **the panel (Purge in the left sidebar)** and the **CLI (`purge-community`)**. Do not hand-edit host files under `~/Library/.../Resources/app`; edits get overwritten by the next "Apply".

## 1. Mental model: five layers, each doing one job

| Layer | Provided by | How it takes effect | How to check |
| --- | --- | --- | --- |
| **Host patches** (86) | This plugin, written into DSH source | Click "Apply" to write → loads only after **quit and reopen** | `selfcheck`: `applied/required` per layer |
| **Prompt injection** | Plugin runtime (re-pasted every step) | `prompt-inject.md` as the `dsh-purge` section | Probe (§4) or the "runtime prompt injection" line in `selfcheck` |
| **Hardening boost paragraph** | Plugin runtime | Tail section (on by default) | `purge-community boost` |
| **Permission config** | the profile's `cordis.patch.yml` | `danger-full-access` + `approval: never` | "permission choice of the current profile" in `selfcheck` |
| **Agent presets** | the `unrestricted` preset | chosen in the new-session dropdown | panel / preset dropdown |

**Key conclusion**: host patches and permission config stay global; prompt injection and the boost paragraph are global by default but can be excluded per preset with `excludePresets`. Excluding a preset does not undo the global patches.

## 2. Lifecycle: install → apply → reopen

```
First install via the official UI/CLI, or backup-migrate with the community installer
   ↓
Click "Apply" → unpack host / write 86 patches / create snapshot
   ↓
Quit and reopen DSH   ← patches load only after a restart
   ↓
selfcheck all green = ready to work
```

**When you need to click "Apply" again** (the most frequent maintenance action):

1. After an official DSH update (`app.asar` reappears, all old patches are void);
2. After the plugin itself is upgraded (new patches must be rewritten);
3. After installing a new plugin that adds tool surfaces/presets (new patch targets appear);
4. When the model starts making excuses, or tools suddenly get pestered for approval.

One-liner: **"Apply" is idempotent** — when unsure, click it, then quit and reopen.

## 3. CLI reference (all commands + exit codes)

`purge-community` in the table below is a shorthand; it is not guaranteed to be on the system PATH after being installed into a profile. First follow the [CLI rollback and location guide](docs/INSTALLATION.md#cli-rollback) and use the current profile's `bin/community.js` with the correct runtime; do not install another npm package just to find the command. Installation validation looks at version, bundle and config composition; the model refusing or not is not a criterion for install success.

| Command | Effect | Exit code |
| --- | --- | --- |
| `purge-community status` | host paths, patch counts | 0 |
| `purge-community selfcheck [--json\|--text]` | per-layer evidence for the 25 layers | **broken → 1**, pending/ok → 0 |
| `purge-community host-status` | read-only disk layout and current service entry evidence; does not quit/swap/restart | 0, must inspect state |
| `purge-community diagnose [--json]` | anchor drift diagnosis (line numbers + snippets) | 0 |
| `purge-community reanchor list\|show\|apply <id> [--index n] [--lines a-b] [--yes]\|clear <id>` | semi-auto re-anchoring: pin a new anchor as a local override | 0 |
| `purge-community probe [new]` | generate/view the runtime probe | 0 |
| `purge-community audit [--limit n]` | recent action records (apply/revert/boost/probe/preset/reanchor) | 0 |
| `purge-community boost [on\|off]` | tail boost paragraph toggle | 0 |
| `purge-community preset [status\|install [--force]]` | write the `unrestricted` preset to disk | 0 |
| `purge-community usage` / `prune` | backup usage / cleanup + GC | 0 |
| `purge-community backup` / `rollback <id>` | snapshot / roll back the plugin | 0 |
| `purge-community apply` / `revert` / `uninstall` / `edit` | original capabilities (forwarded to `dsh-purge`) | passthrough |

`selfcheck` states: `ok` (confirmed) / `pending` (not yet applied) / `inferred` (host-derived, yellow) / `unknown` (insufficient evidence, yellow) / `broken` (confirmed fault or permission mismatch).
**pending is not a fault** — do not edit the patch table; one click of "Apply" fixes it.

## 4. Runtime probe: proving "the injection actually reached the model"

Files changed and sections registered only prove the host side is ready; the probe proves the model **received** it.

```sh
purge-community probe new
# → {"nonce":"purge-1a2b3c4d", "message":"Please output the following line verbatim…[purge-1a2b3c4d]"}
```

Then send any message. **The model echoing the nonce verbatim = the chain works**. The probe auto-expires after 30 minutes and does not hold tokens long-term.

Triage principles:
- Echoed but the model still makes excuses → the problem is in the **model layer / persona**, not the plugin (change the boost paragraph or the preset persona);
- Not echoed → the injection never arrived (check the runtime injection layer in `selfcheck`, whether `boost` is off, whether `injectPosition` was changed to `tail` but the host did not re-paste).

## 5. Symptom → action (decision tree)

| Symptom | Run first | Reading | Action |
| --- | --- | --- | --- |
| Patch count not 73/76 (84 total) | `selfcheck --json` | look at `layers[].state` | pending → click Apply; broken → `diagnose` |
| All `missing_file` | `status` | `ai_base` empty | host not unpacked: click Apply → reopen |
| Model starts making excuses / asking to confirm | `probe new` | echoed? | echoed: tune persona/boost; not echoed: check the injection layer |
| Tool refused to run | `selfcheck` | are sandbox/approval layers green? | green → the tool's own limit; red → click Apply |
| DSH just got updated | `status` | `asar_still_sealed` | click Apply → reopen → `selfcheck` |
| Panel shows version mismatch | yellow banner at top of panel | UI and backend on different versions | reconcile disk vs running version first; pick the right install/migration entry per the README |
| Want to undo everything | — | — | `revert` (undoes patches only) / `rollback <id>` (rolls back the plugin) |

## 6. State and files (safe to read, do not write willy-nilly)

| Path | Contents |
| --- | --- |
| `$DSH_HOME/dsh-purge/tuning.json` | `{boost, injectPosition, askNoBlock}` |
| `$DSH_HOME/dsh-purge/probe.json` | probe nonce (30-minute TTL) |
| `$DSH_HOME/dsh-purge/anchor-overrides.json` | local re-anchor overrides (plugin source untouched; delete to restore factory anchors) |
| `$DSH_HOME/dsh-purge-community/audit.jsonl` | action audit (1MB rotation, 2 retained); panel "Maintenance → Recent actions" |
| `$DSH_HOME/dsh-purge/applied.json` · `installed-rev` | plugin version last applied |
| `$DSH_HOME/dsh-purge-community/backups/<id>/` | snapshots (`manifest.json` + small files; big files in `objects/`) |
| `$DSH_HOME/.agent-presets/unrestricted/` | unrestricted-mode preset (upgrades keep the original text; a template marker on the first line does not mean the user authorized overwriting it) |
| `$DSH_HOME/prompt-inject.md` | **the user's injection body**; the plugin only reads it (unless the user clicks save) |

**Invariant**: `prompt-inject.md`, the ruleset, and other plugins' config must never be overwritten by "Apply" or "Rollback", at any time.

## 7. Patch table: 86 entries, how to read and how to add

- Defined in `ALL_PATCHES` in `lib/core.js` (`PATCHES` / `CODE_PATCHES` / `ENGINE_PATCHES` / `NEW_TOOL_PATCHES`).
- Each entry = `{id, name, layer, file, replacements:[{pattern, replace}], markers, optional?}`; `pattern` is a **verbatim snippet** (or regex) of the host source, and `markers` decide "already applied".
- Rules for adding one:
  1. register the target file key in `targetFiles()`;
  2. leave a `[dsh-purge]` marker inside `replace` and add it to `markers`;
  3. pin a real source snippet in `test/patch-anchors.test.mjs` as a regression;
  4. `optional: true` for third-party plugin targets (shown as "not applicable" when absent, instead of failing).
- Anchor drift after a host upgrade: `diagnose` gives the file, line numbers, the first line of the old anchor, and a snippet of the **probable new landing spot**.
- Once you have confirmed the new spot: `reanchor apply <id> --lines A-B` (inspect the dry-run candidate snippet first, then add `--yes` to write). The override is stored in `anchor-overrides.json`; the engine treats it as that entry's pattern; `reanchor clear <id>` reverts it.

## 8. Preset: `unrestricted` (unrestricted mode)

- It is a **superset of standard** (20 lines, tool surface identical); the difference is persona only: execution-first, no repeated boundary declarations, no multi-turn decay.
- Registered into `agentPresets` by `lib/presets-plugin.js` (**just dropping the file does not make it appear in the dropdown**).
- Install: `purge-community preset install`; after the first registration it is visible in the panel / new-session dropdown.
- Do not treat it as "extra armor-breaking" — armor-breaking comes from the host patches; the preset only changes persona.
- Regression test card: `docs/preset-test.md` (5 A/B prompts + pass criteria + what to do on failure).

## 9. Version and compatibility

| Component | Value |
| --- | --- |
| Plugin | `dsh-purge-community` 1.6.97 |
| Verified hosts | DSH Desktop 0.2.2-rc.2 / 0.2.2-rc.1 / 0.2.1-rc.1 / 0.2.1-rc.2 / 0.2.1-rc.3 / 0.2.1-rc.5 |
| 0.2.2-rc.2 | 74 patches applied / zero drift; self-check and armor-breaking/rewind regression pass on macOS; on Windows only preset cards and startup diagnostics were verified, patches not re-tested. |
| Other hosts | Applying is allowed, but `selfcheck` marks "unverified"; run `diagnose` first |
| Node | ≥18 (the desktop's bundled runtime is enough); **red team tools need ≥22.5** (they depend on `node:sqlite`; lower versions fail when loading red team tools) |

Do not auto apply/restart after install. `minimumReleaseAge=0` must never be set; `scripts/install.ps1` is a community installer, not an official channel.

### Evidence ledger (since 1.6.81)

Verbal reports are recorded as `claimed` with `source_agent` filled in. Tools record as `inferred` by default. Submit actually-verified results with `redteam_evidence_upgrade`; plain citations and old citations lacking a verification record are kept but need separate verification. If counts or hashes error, fix the ledger anomaly first. Import files must sit inside the current target directory; they may be staged in its `incoming/` subdirectory, and screenshot content may be passed directly. Withdrawn issues are queryable via `withdrawn`.

## 10. Maintenance rules for this document

- Every release must sync: the header version line, the §9 table, and the §3 command table (if commands were added).
- `npm run check:docs` validates version consistency across `AGENTS.md` / `README.md` / `release-notes.md` / `package.json`; it runs in CI and fails hard on mismatch.
- The human-facing overview is `README.md`; **the agent-facing operational details are authoritative in this file** — when they disagree, trust this file first, then fix the README.

## 11. Update preferences (since 1.6.5)

The maintenance page sets automatic check and automatic install separately. Default is check-only, 6-hour interval; the old `autoUpdateOnStart` is kept only as a compatibility default for the auto-install preference. Explicit new preferences live in `$DSH_HOME/dsh-purge/update-preferences.json`; state lives in `update-status.json`. Do not enable `autoApplyOnStart` to turn on updates, and do not modify prompts or profile permissions.

`GET /dsh-purge/community` returns `update_preferences` and `update_status`; `POST` to the same path with `{op:"preferences",value:{autoCheck:true,autoInstall:false,intervalHours:6}}` saves preferences. Omitted fields keep their current value; the interval accepts integers from 1–168. Saving does not install; after an install, wait for the user's manual restart — do not call the restart endpoint yourself.

Electron's app.asar body must be read via `diskFs()`; do not treat a passing plain-Node self-check as a passing Electron runtime check. `npm run test:electron` runs the real Electron test in a temp directory, without touching the installation or user settings.

<a id="installation"></a>
## 12. Install / update failures: required reading for agents (1.6.47)

1. **Pick the entry point first; do not call community scripts the official method.** First install: the official DSH plugin UI / market confirmation dialog, or this instance's `dsh plugin --profile <actual name> add <pinned-version TGZ URL>`. The official manager maintains `dsh.bundle`; our index, TGZ and `scripts/install.sh` / `scripts/install.ps1` are community content. This project has no bare npm package name for that flow; do not run `add dsh-purge`, `add dsh-purge-community`, or a global npm install. With an existing `dsh-purge` / standalone panel, choose the community installer migration; do not uninstall the old package first. Full copy-pasteable commands: [README](README.md#install) and the [installation guide](docs/INSTALLATION.md).
2. Read the target DSH version, executable, `DSH_HOME`, and profile; confirm it is initialized first. The old Desktop CLI defaults to `desktop`; the new shell of the standalone dsh CLI and CLI/Web default to `web` — do not mix them; do not download another npx host to install into the current desktop instance. Download the script to a separate temp path first, review, dry-run, then execute under existing authorization. Dry-run verifies prerequisites, download and SHA256 only — it does not install dependencies or verify a full startup. A real install backs up, invokes the official CLI, migrates old package references and verifies the disk version; it may repair the unpacked desktop's `app/runtime` link, and on Linux may prepare a user-owned host copy — it is not fully write-free of the host directory. The script and bootstrap come from master; the SHA256 check covers the release TGZ, so you cannot claim the scripts were independently signature-checked. Do not change prompts, permissions, proxy, update preferences, or other plugins; Do not auto apply/restart after install.
3. `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` is not always "the release is too new". If it simultaneously reports `@dsh-ops/bash-win32-x64@<version> ... version not present in registry manifest`, compare the current public mirror against official npm metadata first. This installer performs one scoped registry retry only for that public package against an explicit public mirror; stop if official name/version/time/integrity/tarball metadata is incomplete. All other dependencies keep their original source; global settings are unchanged.
4. When the market JSON's first install fails, the plugin is not loaded yet, so the plugin runtime cannot fix the host installer. Have the user pick the official npm source or use the standalone install entry. Do not promise that "upgrading the plugin will make the old host's market retry automatically"; swapping the tgz still triggers the host's lock-file validation.
5. Real release-age, integrity/trust, private-source, or unknown errors: stay failed, keep logs and snapshots; do not set `minimumReleaseAge=0` or `trustLockfile`, and do not delete lock files, purge caches globally, change the global npm source, or blame every error on mirrors. GitHub `UND_ERR_DESTROYED` is an independent network clue; changing the npm source is not guaranteed to fix it.
6. On failure, inspect the returned backup_id, and confirm package.json / lock file / install state. To recover, use `rollback <id>`, preserving the current user content. Never report a failure as install success; never auto-restart. Public issues get only redacted errors — do not upload config, credentials, prompts, or full backups.
7. Version reconciliation is authoritative from package.json / release-notes. README.md and README.zh-CN.md must agree; maintenance docs must not stay stuck at 1.2.0/1.3.0. Record installer tests and full Windows DSH UI / host-patch acceptance separately; do not merge them into "all Windows features verified".

Linux CLI/Web: download the script per the README, then run it; `sh scripts/install.sh` works only from inside the repo root. It defaults to the current PATH's `node` / `dsh` and the `web` profile; use `DSH_NODE` / `PURGE_DSH_CLI` / `DSH_HOME` / `--profile=name` to target a specific instance explicitly. When the system npm host is read-only, prepare a user copy; activate `~/.local/bin/dsh` only after the plugin migration succeeds. On failure, keep the original entry; a complete but unactivated copy can be reused for retries. If the entry is concurrently modified by the user, stop — do not overwrite. Do not restart on your own, change system directory permissions, or change the proxy. Uninstall cleans up only the plugin directory and link within this home; external source / shared packages stay. Acceptance boundaries: [PR #42 maintenance notes](docs/maintenance-pr-42.md).

## 13. Windows Electron install acceptance (1.6.13)

The Windows Desktop exe is a GUI subsystem. PowerShell's `& exe ...` may return before the child process exits; do not infer completion from `$LASTEXITCODE` after it. The installer must wait on an explicit process object, check its real ExitCode, collect UTF-8 output, then clean up the bootstrap. Regressions must cover both a plain Node console process and a true GUI-subsystem process; simulating Desktop with node.exe alone is not enough.

The `desktop` profile is initialized by the Electron app; plain `--profile desktop --dump-config` reports managed exclusively — that does not mean the program is broken, and you must not hand-fabricate "accepted protocol / logged in" records. Isolated real tests set DSH_HOME and a separate user-data-dir explicitly; they do not touch the default user directory and do not auto-apply host patches. UI/login/full patch capability, installation, backup, and rollback are recorded separately; protocol or login confirmation is left to the user.

macOS dev acceptance must not copy the same-named `.app` and run it directly, nor fall back to the official DSH executable. Use a command-line-only copy, isolated test identifiers, and OS write restrictions; full install/migration/rollback methods and test boundaries: [isolated acceptance](docs/INSTALLATION.md#isolated-acceptance). This is a maintainer test rule; it does not change the user's normal install entry.

Generic install acceptance uses the real CLI/pnpm for first install, old package/alias migration, upgrade, rollback, and failure recovery, verifying user content added after the backup. `scripts/check-install-lifecycle-runtime.mjs` must run in the isolated Electron's Node mode; do not substitute the official DSH or a hand-written profile; explanation: [PR #78 acceptance record](docs/pr78-runtime-integrity.md). Reports must distinguish component simulation, real CLI transactions, cache reuse, and untested UI/host features — one pass does not stand in for another.

PowerShell 5.1 reading UTF-8 JSON/docs should use `Get-Content -Raw -Encoding UTF8`; do not misdiagnose Chinese mojibake caused by default ANSI decoding as a broken installer.

## 14. Windows package swap and settings API (1.6.13)

- issue #10 / PR #11: "Apply" on the sealed Windows host only writes disk patches and starts the waiting helper — **it never quits the host on a timer, never kills Electron, never auto-reopens**. Remind the user to fully quit from the system tray, confirm the swap completed, then open manually. Closing the window is not quitting; do not run the old restart script yourself.
- `/dsh-purge/status` `asar_handoff.phase`: `starting` is only a start request; `ready` / `waiting_for_quit` prove the helper ran; `complete` means the original archive was preserved and the swap finished. For `failed` / `expired` / `helper_stopped`, read `resources/app.asar.purge-handoff.json` and the same-named `.log`; do not treat `.rename-pending` as success. State and logs contain swap diagnostics only — do not upload user config.
- The archive backup is `app.asar.purge-<token>.bak`, independent of profile snapshots; it never overwrites existing backups. If the archive is replaced by an official update while waiting, stop; the new host must be re-applied. Offline repair/recovery: see the maintenance docs.
- When the helper fails to start, also check `.json.broker.log`, `.json.launch.log`, and `.json.launch.log.error`. Windows Electron's detached PowerShell can exit silently; do not revert to a direct detached spawn, and do not treat the broker's exit code 0 as "helper ready". After setting `PURGE_ELECTRON_EXEC`, run `node --test test/windows-electron-handoff.test.mjs` to verify handoff after the real Electron parent process exits.
- issue #9: hosts with native `describe` / `replace` must not have the legacy `register` injected, or feature-probing plugins will read the wrong store. Upgrades reverse-remove #42's exact old template while keeping two settings notifications; unknown revisions stop and diagnose — never overwrite the whole settings source, or migrate/wipe the user's settings document. Old hosts lacking the modern API keep the original compatibility interface.
- If per-file backup before apply has any error, stop writing — you cannot claim it is rollback-safe. Real Windows tests must verify opened backup descriptors are closed and apply/restore byte-identical; plain Node/Linux passing does not prove Windows file handles are healthy.

## 15. Cannot reinstall after unpacking (1.6.13)

If the CLI reports pnpm.mjs missing under app/runtime, check the current install's app/runtime link. The Windows junction must use the absolute target of the runtime in the same resources directory — never the relative `..\\runtime`. The new installer preserves the old broken link before fixing it; stop on an existing real directory or another valid runtime conflict, and do not delete directory contents. While the old updater still lacks the fix code, install 1.6.13 via the standalone Windows install entry; do not repeatedly click update, delete lock files, or globally reinstall pnpm.

The acceptance sequence must cover: sealed host install → apply patches → full-quit swap → open the unpacked host → real reinstall/upgrade again → backup/rollback/re-upgrade. Testing upgrades while the archive still exists does not prove the post-swap CLI path is correct. Compare the current prompt and profile config; do not overwrite later user edits with an old snapshot.

## 16. Command conflicts and self-check evidence (1.6.13)

Same-named commands are kept by the original plugin. Purge's fallback commands are, in order, `/purge-community`, `/purge-rules`, `/purge-skills`, `/purge-rewind`; `status.commands` shows the actually registered names. If a fallback name is also occupied, skip that command and warn — never overwrite someone else's command; other commands, tools, prompts and HTTP endpoints are unaffected. Do not uninstall the user's fallback plugin to recover the panel.

Panel self-check reads **default permissions for future sessions** preferentially via `permissionPresets.defaultPreset` / `resolve()`; that does not represent the override value of every existing session. When the CLI cannot reach that service, use only a complete YAML literal under the correct permission node as file evidence; do not execute `!!js`, and do not guess environment expressions, includes, or unloaded settings. Label file evidence and runtime sources separately.

Not explicitly set does not mean not in effect: currently effective but not pinned → `inferred`; actual value not visible → `unknown`. Only a confirmed permission mismatch or patch error is `broken`. JSON/text exit 1 only on `broken`, otherwise 0; automation must also check `state` — exit 0 is not "everything proven". Do not change permissions, delete config, or reinstall to make yellow items disappear.

Routing follows Cordis's webServer sub-scope registration and teardown; do not add process-level polling or a fixed timeout to fake ready. Read-only state does not depend on connection/session lists. Lifecycle regressions must cover late-arriving service, revoke/replace, parent plugin reload, no-resurrection after uninstall, and — under a true Desktop CommandRuntime name collision — remaining tools and prompts still registered.

## 17. The standalone installer must not depend on the runtime package early (1.6.13)

The bootstrapper unpacks the tgz and runs `bin/community.js migrate` directly, when no node_modules exists yet. The CLI top level must depend only on shipped modules and Node built-ins; runtime dependencies like self-check should be imported lazily in the relevant command branch. 1.6.11 pulled in yaml early via selfcheck and the real public Windows entry failed; it was demoted to a prerelease. Do not add host-uncontrolled npm install steps at the bootstrap stage to paper over this.

Release acceptance must first run the boot CLI against the real unpacked package with no dependencies, then install dependencies and verify the plugin entry. Also run a full bootstrapInstall with the candidate tgz and the real Desktop CLI; do not substitute a mocked `bin/community.js` or a pre-installed-dependency smoke. Supply-chain checks, backups, and the no-auto-restart policy are unchanged.

## 18. Old custom preset load failures (1.6.13)

DSH 0.2.1's `tool-subagent` no longer accepts `toolFilter`. You cannot just delete it: the old deny list is the subtask's tool policy, and deleting it changes behavior. `presets-plugin` first generates a private SHA256 backup via `preset-compat.js`, then converts the policy into a native sub-preset and an `agentPreset` reference on the parent tool. The parent session keeps all tools; the child session excludes only the original list; `maxDepth`, persona, other config, and `!!js` expressions are preserved.

The conversion happens at registration; the user's `agent.cordis.yml` / `preset.yml` bytes are not rewritten, so later user edits still take effect on reload. Backups live in `$DSH_HOME/dsh-purge-community/preset-migrations/<id>-<hash>/`, containing the original files and a verification manifest; they are not uploaded to public repos. The settings page gains one "unrestricted mode · subtask" helper preset; the main session still selects "unrestricted mode".

The current auto-migration handles only a single spawn deny policy that maps item-by-item to native tool lines; unknown tools, allow policies, multiple policies, or a conflicting existing sub-preset stop and diagnose — never silently loosen. Registering a disposer does not mean success; you must check the real `registry.resolve` broken fields.

Beyond ordinary tests, run `test/desktop-presets.mjs` under the real Desktop Electron (`ELECTRON_RUN_AS_NODE=1`, `PURGE_TEST_HOST` pointing at the host's `node_modules/@deepseek-ai`). It reproduces the old error in an isolated directory, loads the migrated parent/child presets, creates a blank Agent, and checks real tool visibility — no LLM calls, no user-app restarts. `PURGE_TEST_PRESET` can point at a local old-files directory for private acceptance; do not add that directory's content or user prompts to test fixtures.

Rollback restores the old registration behavior; the original user files were never rewritten. It also restores the old version's load problem on the new host. Never overwrite user prompts or settings modified after the fact for the sake of rolling back. If a backup is corrupt or unwritable, stop the migration — do not bypass the backup.

## 19. CLI execution permissions and entry evidence (1.6.14)

issue #20: rewriting an existing file must preserve its normal rwx permissions; a 0600 private config must not become 0644, and a 0755 launcher must not lose its execute bit. Atomic writes and copies share `lib/atomic-files.js`; temp file names are unique, and on write/permission-restore/rename failure the temp file is cleaned up and the error thrown. CLI repair must finish the backup first; an existing backup is never overwritten. Only recognized official shell launchers get the lost execute bit restored, adding execute bits matching their existing read permissions — no widening of read/write permissions, no changing of arbitrary user scripts.

issue #19: `purge-community host-status` prints `disk.archive_exists` / `disk.unpacked_exists` and `process.entry_layout` / `source` / `matches_target`. It only reads the target installation; it does not scan other instances, swap packages, quit, or restart. When state is `unknown_runtime` / `different_instance` / `unreadable`, never write "loaded" or "not loaded". `archive_entry` / `unpacked_entry` only prove the launch entry, not that every module modified afterward reloaded. Exit 0 only means the report was generated; callers must read state. Full command lines, environment variables, and tokens never enter the report.

For a standalone CLI invocation, showing unknown_runtime without host service launch arguments is expected; first pin the target installation via DSH_BASE or PURGE_DSH_CLI, then compare against the running service's `host_layout` status endpoint. Do not treat the CLI's own PID as the desktop service PID.

Since 1.6.18 the root cause is located and fixed: `sealedAsarHandoff()` checked the surface first and returned null when Apply was triggered from the Web GUI, so it fell through to a plain restart and the archive never moved. Now `sealedDesktopHandoffAnySurface()` + `runningDesktopPid()` handle cross-surface cases by waiting for the desktop to quit before swapping; if the desktop is not running it returns `needsDesktopApply` instead of faking success. The decision is covered by `planApplyRestartAction()` (sealed / cross-surface / manual / plain). #19 was closed as "fixed in 1.6.18"; if the reporter still sees residuals after retesting, it may be reopened.

## 20. Interaction semantics: waiting for answers and steering (1.6.25 / 1.6.26)

**Waiting for answers (#89, since 1.6.25)**: `ask_user_question` is no longer force-clamped to 1 second. Now only `-1` (infinite wait) is capped at 300 seconds; the model gets whatever it passes, and the original 120-second default applies when nothing is passed. If an old install still has `const timeout = 1; // [dsh-purge] ask_user_question never blocks a turn`, the patch carries a `forbid` marker: it is judged unapplied and **precisely replaced** on the next "Apply"; if it doesn't match, the file stays and `pattern_not_found` is reported.

**Steering (#90, since 1.6.27)**: native DSH message delivery is restored, migrating the original 1.1.69/1.1.71 and the fork's old #85/#86/#90. Direct sends distinguish steer/queue by mode; queue steering converts only messages still in next-turn and currently running. Messages already in next-step are not moved back to the next turn; idle queues are not re-queued; consumed messages are not rebuilt. Native error codes are kept, and the front end converges duplicate/stale requests per the existing protocol.

1.6.26's fallback-to-followup wrongly retracted successful steers and scrambled order; that fallback is removed this version. Old-version migration covers both controller and agent-loop, not just one marker. Unknown rewrites keep the original file and report pattern_not_found; do not delete user arguments or force-write the host to silence errors.

Install, apply, and load are three distinct phases. Install does not auto-apply or restart; apply backs up and writes disk, and the current process does not hot-reload these modules. The user should manually quit and reopen when convenient, then confirm the real UI. For #25 triage, provide DSH/plugin versions, OS, direct send vs queue steer, single vs repeated clicks, and whether generation is in progress; do not request full config, prompts, tokens, or session logs.

Verification: `npm test` includes real-method runs, deferred projection duplicate requests, message consumption, queue order, and old-version migration tests. Point `PURGE_TEST_HOST` at the local read-only `@deepseek-ai` directory and run `node --test test/steering-runtime.test.mjs` to accept against the real install methods. That test uses an in-memory service and is not a full desktop or real-model acceptance. Details: [steering maintenance notes](docs/steer-notes.md).

## 21. Multi-profile updates and source ZIP verification

When maintaining updates, each profile's actual package version is authoritative; do not treat `applied: true` as everything succeeded: check `ok`, `hasUpdate`, `targets`, and errors together. Partial installs may still need a manual user restart, but a restart does not substitute for retrying failed targets. Do not change the user's update switches, version pins, prompts, or permissions because of this.

The upstream ZIP pins the full commit SHA and verifies Git blob digests for all files; stop when the GitHub API is unavailable or the manifest incomplete — do not skip verification. The official TGZ SHA256SUMS check is unchanged. When diagnostics return unknown, keep the unknown state; do not call it all green, and do not auto-reinstall.

Review and test boundaries: [update maintenance notes](docs/maintenance-issues-27-30.md). Ordinary task-capability feedback needs an independent reproduction; an installer test passing does not substitute for a model-quality comparison.

## 22. Panel rollback and update networking (1.6.29)

#34: rollback must go through `.tgz` install; `add` on a raw snapshot directory is forbidden — it creates a dependency-missing link. Exit 0 of the install command is not enough; in a new process, check dependencies and the plugin entry. On failure, restore the dependency graph and manifest from before this operation, keeping current user settings; on concurrent modification, stop overwriting and provide a recovery directory. Do not substitute an old-updater directory rollback test for a real CLI test of the panel's Maintenance.rollback.

#35: all in-plugin update requests share update-http. Tokens come from the host's GITHUB_TOKEN / GH_TOKEN, are sent only to api.github.com, and are not forwarded cross-origin; proxy preference is PURGE_HTTPS_PROXY, then HTTPS_PROXY/HTTP_PROXY (lowercase supported), else read-only Windows static system proxy; NO_PROXY is honored. Global proxy is not changed, certificate verification is not disabled, and Claude/SSH networking is not touched. When PAC/SOCKS are unsupported, say so explicitly; anonymous access without a token still works — do not force users to provide keys. Never write tokens or proxy credentials into public issues.

Errors distinguish rate-limit exhaustion, auth, unavailable resources, and network timeouts; cache/Atom fallbacks must show their reason. Environment settings must be inherited by the process that launches DSH; do not restart on your own to change the update environment. The standalone bootstrap's self-contained downloader is not part of this in-plugin layer; do not claim every entry point inherits it. Details: [maintenance notes](docs/maintenance-issues-34-35.md).

## 23. Nested-layout self-check (PR #33)

Install root and component root are separated: `currentHost()` keeps instance-location semantics; the self-check uses `normalizeHostBase()` to check the fixed nested layout. Do not use the global `findAiBase()` as a self-check fallback; a bare CLI missing target information reports unknown and asks for `DSH_BASE` / `PURGE_DSH_CLI`. An incorrect path must never silently switch to a different installation.

The self-check counts original entries; the panel may merge display groups, so the numbers do not need to match exactly. `missing_file` does not always mean not applicable; a missing required file keeps the denominator and warns. `skipped` is excluded only when a known reverse migration clearly does not need to run; unknown and failed are never counted as success. Do not change user permissions or disable features to make red/yellow items disappear. Tests must cover both the self-check and the real install/rollback entry of the same instance; see [maintenance notes](docs/maintenance-pr-33.md).

## 24. Default-preset diagnostics (1.6.31 / #38)

#76's skipped must not be read directly as failed or done. The self-check does a read-only YAML check of the current home's presets; when the literal body is confirmed to need no action, mark it `not_needed` and exclude it from the required denominator. Dynamic, corrupt, duplicated, or unreadable config stays `unknown`; residual content mismatch stays `broken`. Do not execute `!!js`, do not read another profile in place of the current file, and do not change permissions or repeatedly apply to clear unknowns. Patch bodies and user files stay unchanged. Details: [maintenance notes](docs/maintenance-issue-38.md).

## 25. Desktop archive diagnostic target (1.6.32 / #40)

status/selfcheck/diagnose use `diagnosticHost` to check the physical directory of the current installation uniformly; `currentHost` keeps install/launch location semantics. Launch paths inside the archive map only to app or app.asar.unpacked under the same Resources; do not scan other installations to manufacture green. Partial or unreadable targets are not skipped; an archive still present and permission differences keep their notices. Applied on disk does not mean the running process loaded it; do not auto-restart, delete the archive, or change permissions on that basis. Reproduction and real HTTP handler acceptance: `npm run test:electron` and [maintenance notes](docs/maintenance-issue-40.md).

## macOS #40: manual quit-and-swap (since 1.6.35)

- After "Apply" writes to disk, confirm `host-status.handoff.phase` / panel `asar_handoff.phase`. `waiting_for_quit` only means the helper is ready, not that the host is loaded; have the user fully quit with ⌘Q, wait for `complete`, then let the user open it manually. No auto-quit or reopen.
- `not_scheduled` means not scheduled, not waiting; `failed/expired/helper_stopped/unreadable` must be expanded for detail; `archive_reappeared` means an old completion record cannot prove the new archive, `backup_missing` means the backup was lost. These states must not be hidden.
- Terminal diagnostics first locate the same installation and profile. Example: `PURGE_DSH_CLI='/actual install/Contents/Resources/app/dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js' purge-community host-status --profile desktop`; run `selfcheck --json` in the same environment. Do not copy someone else's paths; without instance evidence, stay unknown. No longer need to fake DSH_SURFACE just to diagnose the Desktop shell.
- Only the fully-uninstalled #71 family is `na`; installed-but-missing, YAML corruption, or unread config must keep being investigated. CLI permission unknown should be verified in the corresponding running instance's panel; never auto-change permissions.
- Recovery steps and fields to collect: [maintenance notes](docs/maintenance-issue-40.md). Do not upload prompts, keys, or full config.

## 26. Refusal detection + single retry (since 1.6.34)

Toggle: `purge-community retry on|off` (default **off**, stored as `refusalRetry` in `tuning.json`).

Implementation: the plugin wraps one layer over the host's `llm/stream` waterfall; the host and the injection body are untouched.

1. Buffer up to the first 400 characters of the output (or until a tool call / closing block);
2. Refusal signature hit → discard this output, append a hardening paragraph to the **tail of the system prompt**, rerun once;
3. No hit → the buffered chunk is emitted as-is, then streams pass through, identical to having no hook;
4. Each retry writes a `refusal_retry` entry to `audit.jsonl` (length and first 80 chars only).

Only one retry, to avoid loops. To investigate refusals, first check `purge-community audit --limit 20` for `refusal_retry`, then decide whether to adjust `tuning.injectPosition`. This layer is independent of §20's steering and §19's swap.

## 1.6.38: slow-network updates and audit ownership

The archive budget uses `PURGE_DOWNLOAD_TIMEOUT_MS` (default 180000, range 30000–900000); the optional `PURGE_GH_MIRROR` transfers only the community TGZ; stop if official digests are unavailable. Container root home needs an explicit service UID/GID; do not widen permissions or change global proxy. Full steps, variables, and test boundaries: [maintenance notes](docs/maintenance-issues-44-47.md). No auto-restart.

## 1.6.39: standalone installer download diagnostics (#52)

`fetch failed` does not mean the release was never uploaded. The standalone installer prints the failing stage (metadata / archive / checksum), the current official domain, transport, attempt, and the underlying error code; do not request full environment variables, proxy addresses, tokens, or signed redirect URLs. Transient connection errors and 408/429/500/502/503/504 get up to two fetches, then one system-curl attempt, each restarting from the original official URL. Permanent errors — certificates, source, size, SHA256, 401/403/404 — stop; do not "fix" by disabling certificate checks or skipping digests.

The fallback curl inherits the current process environment, disables curlrc, validates the official HTTPS domain (443) hop by hop, uses no mirror, changes no proxy, and does not guarantee fixing every network problem. Windows uses System32/curl.exe, macOS/Linux use /usr/bin/curl; a missing binary is reported clearly. It does not inherit the in-plugin update-http's system-proxy reading. The archive total budget defaults to 180 s, settable via PURGE_DOWNLOAD_TIMEOUT_MS within 30000–900000; version info and the checksum manifest get 60 s each. A download recovery is not an install; SHA256, package identity, and migration verification must still pass.

Have the user re-download install.sh/install.ps1 first, then run dry-run. If it still fails, collect only OS/DSH versions and redacted `[download]` / `Release download failed` lines, distinguishing API, archive/CDN, and checksum-list failures; do not modify networking on your own. A pre-install failure needs no rollback and should not touch the existing profile. Details: [#52 maintenance notes](docs/maintenance-issue-52.md).

## Per-preset prompt exclusions (1.6.40, #53)

When the user wants roleplay, minimal, or other presets to be free of Purge prompts: first read and back up the current profile config, then add `excludePresets: [roleplay, minimal]` only to the existing `id: dsh-purge` entry's `config`; do not overwrite the whole config with the example. Default `[]` keeps old behavior. Matching uses the real preset ID (case- and trim-insensitive), not display names or substrings.

Main prompt, head/tail sections, capability notes, boost, probe, postPrompt, and the host fallback all use the same decision. Excluded assemblies keep their existing persona, workspace rules, and tools; only Purge's paragraphs and sourced rewrites are cleaned — never guess-delete user text. Sub-agents judge by their own effective preset; when preset info is missing and the exclusion list is non-empty, pause injection so old hosts' argument-less fallbacks cannot leak. The optional refusalRetry also skips adding its prompt when it cannot identify the requesting session.

Upgrade packages never auto-change user config, apply patches, or restart. To make the old host's fallback recognize sessions, the user must schedule applying the new patches and a manual quit-and-reopen; old argument-less calls return empty once exclusions are enabled. Test standard → minimal → standard, parallel standard/roleplay, and sub-agents; watch `assemble.excluded` for preset/excluded/unknown. Do not call "excluding injection" "restoring native permissions": global patches, existing deployment config, and past chats are not undone or deleted. Details: [maintenance notes](docs/maintenance-issue-53.md).

## 1.6.41: update state reconciliation

Reconcile the running version against the current profile's disk version separately; a stale pendingVersion does not represent the current install. Unknown versions and read failures keep their warnings; an install failure is not masked by a passing success check. When an old version is stuck, manually install the new version first, then have the user quit and reopen once; do not delete settings, change update switches, or auto-restart. Details: [state migration and test notes](docs/maintenance-update-state.md).

## 1.6.42: settings and stream diagnostics

`tuning_setting` records actual post-save changes to known settings; old event history is kept. Unknown fields stay in the config but are not written to the log; repeated saves do not add duplicate change events. Do not infer a feature's state from audit entry counts.

`refusal_retry_outcome` values text / tool_call / reasoning_only / empty describe only the transport shape; error / cancelled mean failure or cancellation — they do not prove task success or content quality. The retry setting is read on the next request; rewind's front-end visibility still needs a reload. Do not auto-restart the user's DSH. Details: [maintenance notes](docs/maintenance-pr-58-61.md).

## 27. Injection position and boost ordering (1.6.43)

- Host section orders live in the range `-1000…10200` (persona-prefix 0, tools 1000–3100, DELIVERABLE 9000, STRUCTURED_OUTPUT 9900, WEB_SURFACE 10100, persona-suffix 10200). Orders below 0 sort before the persona, so **"`GLOBAL_PROMPT_ORDER + n`" does not mean "tail"**.
- This version: **boost defaults to `-50000` (front)**, tail injection `10150`. Measured on the same 6 refusal-prone requests: boost at the front → 0/6 first refusals; at 9500 → 2/6 first refusals (issue #76). `inject tail|both` moves only the injection body, not the boost paragraph.
- A/B: write `$DSH_HOME/dsh-purge/boost-order.json` (`{"order": 9500}`) or set `PURGE_BOOST_ORDER`; a new session after editing the file takes effect. Priority: env var > file > default.
- Switch position: `purge-community inject head|tail|both` (writes tuning + logs `tuning_setting`; effective next round, no restart).
- Changing ordering is a "behavior change": before releasing, run a real-device A/B (same refusal-prone set, compare `refusal_retry` counts and answer shape); a unit-test order number alone is not enough.

## 1.6.44: market install and old-package migration

The market's duplicate-install interception happens before plugin loading; it cannot be fixed from plugin runtime code. Old-version users migrate with this repo's standalone installer without uninstalling first; data directories, permissions, update preferences, and prompts are preserved. After install, check the real package entry, the enabled bundle, and config composition; on failure restore the dependency tree, manifest, and lock files — CLI exit 0 is not "all succeeded". Known old package `name` references are migrated exactly; unknown IDs, manual inserts, or dynamic entries stop and report — do not delete arguments. Rollback reverse-migrates recorded package references while preserving later config values. Explanation and real acceptance commands: [market migration guide](docs/MARKET-MIGRATION.md). Third-party index/market PRs wait for their release; no auto-restart.

## 1.6.45: apply failure diagnosis (#64)

Do not attribute every `complete: false` to CMD failure. Diagnose item by item from the explicit results of `failed`, `host_written`, `hook_restore_failed`, `cli_repair`, and `cmd_flash`; when an old backend lacks fields, keep the unknown error — do not assume success or that the prompt was written. Collect the client's release name, client and underlying DSH versions, OS, and redacted errors; do not request full config or prompts. #63's third-party host compatibility is unconfirmed; do not apply official-host conclusions. See [maintenance notes](docs/maintenance-issues-63-64.md).

## 1.6.46: link target protection (#67)

Windows Electron's recursive delete can walk into a Junction. Cleanup uses `removeTreeNoFollowSync` / `removeTreeNoFollow`; do not fall back to native recursive rm. Old running processes still execute old cleanup code, so affected Windows versions should upgrade via the new standalone installer; do not trigger the old panel update or rollback first. Keep current settings, external dependencies, and usable backups; a cleanup warning does not mean install verification failed, and do not roll back from a partially-deleted checkpoint. Files already lost are recovered individually from a trusted source or an appropriate backup — do not assume Purge's backups cover all third-party data. Details: [#67 maintenance notes](docs/maintenance-issue-67.md).

## Desktop shell entry diagnostics (1.6.47, #68)

`diagnose`'s `desktop_entry` uses the same resolver as the self-check and apply. Prefer the chosen physical app directory's package.json/main; only when nothing is declared, use the single known layout. `missing_entry`, `invalid_manifest`, `invalid_main`, `outside_app`, `not_file`, `unreadable_entry`, `ambiguous_entry` must never be treated as "patch in effect". Do not delete the main field, fake a marker, or copy an old entry to clear the red dot; reconcile install files with the host version, keeping config and the original file. Located-but-anchor-mismatched cases still follow the usual drift diagnosis. Disk state does not prove the running process loaded it; do not restart the user's DSH on your own.

## 1.6.48: body protection and install aliases (#72 / #74)

Do not treat user bodies containing template markers as default values. Non-empty bodies that are customized, hand-edited, or lacking/corrupt in provenance records are preserved; only content that exactly matches a proven default may be auto-refreshed. Read failures keep their error — do not treat a failure as an empty file. Lost content is restored only from a user-confirmed draft or backup; never auto-rollback the whole config.

Version reconciliation reads only the current profile's enabled entries and real package identity, supporting both `dsh-purge-community` and `dsh-purge` aliases; pnpm YAML is resolved from the physical package directory. Missing packages, wrong identity, or multiple different copies keep erroring; do not rename directories, delete lock files, or clear update-status.json to silence warnings. Old-version reconciliation failures block auto-install; upgrade in place with the new standalone installer, then the user restarts manually. Alias rollback keeps the original dependency name and later user edits; rolling back to an old version brings its old defects back. Details: [maintenance notes](docs/maintenance-issues-72-74.md).

## PR #78: install targets and architecture runtimes

Target apps are identified by explicit path and package-structure validation; do not decide "host" merely because `app.asar` exists or the name contains DSH. For custom locations set `DSH_APP` / `DSH_EXE` first; with multiple valid targets, have the user choose explicitly. Do not traverse mounted volumes or arbitrary parent directories, and do not switch to another app after target validation fails. macOS XML/binary plists are parsed by the system; invalid fields, out-of-bounds paths, and symlinks keep erroring — do not substitute a guessed executable.

Locate the runtime by the running process's actual architecture. An architecture directory existing does not mean the CLI can load; actually running pnpm and the install transaction is required. Existing valid links or real directories must not be overwritten just to match a new layout. Tests must use a fresh marked isolated copy; `scripts/check-architecture-runtime.mjs` adjusts the test copy's layout and is only for one-off acceptance environments — never run it against a production app. Evidence and boundaries: [PR #78 acceptance record](docs/pr78-runtime-integrity.md).

## 28. No public-network gate (1.6.52)

- This fork has **no** "refuse when the target resolves to the public network" gate. Upstream 1.1.74–1.1.77 once injected "No, this is strictly forbidden" into `agent/pre-step` and cleared the turn's messages; this version removed the gate together with its decision logic.
- Do not revive that code under the pretext of "range limits" or a "public-network gate"; scope limits are declared by the operator, and the plugin does not judge target ownership for the user.
- `lib/net-scope.js` is left with only the allow-list file API (`readAllowText` / `writeAllowText` / `normalizeAllowText`) and `ownServerNote()` (an empty implementation); `test/no-region-gate.test.mjs` fails hard if anyone reintroduces the installer or a "strictly forbidden" phrase.
- The upstream ReDoS window scan existed only to serve that gate and was not adopted; the `already queued` patch rewrite and pnpm postinstall were not adopted either — see the 1.6.52 release notes for why.

## 1.6.54: old runtime links and apply failure diagnosis (#79 / #77)

When an upgrade hits `Desktop CLI runtime repair failed`, look at the `cli_repair` of the same response — do not assert the user never clicked apply. Only when the `app/runtime` link of the same installation points at the outer `runtime`, and the current architecture directory and pnpm loader both resolve inside that runtime, back up the link and migrate. Real directories, other live links, out-of-bounds, and permission errors still stop; the target directory is never deleted. Create/verify failure restores the original link; if the restore fails, keep the backup and report explicitly.

The UI shows the concrete reason, error code, launcher error, and restore result; do not upload the whole response, prompts, or config. When users still see errors, collect OS/architecture, client release name/version, the plugin's actual running version, and the detailed error; a missing preset must be confirmed separately — do not assume the same source just because of the top-level error. No auto-apply or restart. Real verification scope: [#79 maintenance record](docs/maintenance-issue-79.md).

## 1.6.56: state reads and caching (#81 / #82 / #83)

`Read failed: timeout` means this request did not complete; it must not be read as "host missing, zero patches, or prompt lost". Refresh first; on persistent failure collect OS/architecture, DSH release name and version, plugin running version, wait time, and redacted errors. Do not uninstall/reinstall, delete config, or auto-restart to make the error go away. Caching is shared only within one read-only diagnostic; the next request re-verifies file evidence. Real missing_file / unmatched / errors still need investigation. Performance and acceptance boundaries: [maintenance record](docs/maintenance-issues-81-83.md).

## 29. Per-file patch status (1.6.58, #85)

- `patchStatus` still aggregates per patch, but `patchStatusDetail()` also returns `files[id] = [{key, path, status}]` with states `applied|pending|skipped|unmatched|missing|unreadable`; the API field is `patch_files`.
- New state `partial`: only multi-file patches declaring `fileAllRequired: true` can produce it. It means "at least one **existing** target file missed while another hit". `patchStatusReady("partial")` is false, `patchDrift` reports `partial_drift`, the self-check counts `partial` and marks the layer abnormal.
- Old patches without `fileAllRequired` keep the old aggregate behavior: their target files may be added or removed across host versions (measured #32/#36/#50/#62 each had one target's logic moved in rc.3), and blanket partial treatment would drown real drift.
- Before marking a patch with this flag, confirm every `file` must land in the new host; after adding it, use `diagnose` to confirm the real host no longer false-alarms.

## 30. `fileOptional` and known not-applicable targets (1.6.59)

- `fileOptional: ["key"]` means this target **no longer carries the behavior in the new host**; it does not participate in `partial` judgment, but it still appears per file in `patchStatusDetail().files`, status shown as-is.
- Verify before adding: the target file genuinely lacks this logic, not just reformulated. If you cannot say for sure, do not add it.
- Current list and rationale: #32 `harness-dev-context` (`legacyParagraph` matches a constant; changing it would leak old paragraphs), #36 `tool-fs` (the wording was already written by the approval patch as `Approval is auto-granted.`), #62 `dsh-tools` (rc.3 left the judgment only in `types/index.js`). #50 is not optional; an equivalent "already achieved" marker was added instead.

## 1.6.60: missing-target exceptions and the legacy maintenance lock (#86 / #87)

The `detail is not defined` in 1.6.58–1.6.59 was the missing-target branch's exception; do not use it to assert the host version is incompatible. After the upgrade fix, keep checking specific missing_file / partial / unknown items; do not hide real missing files.

The maintenance lock is not force-deleted by age. The new version coordinates reclamation through a non-empty exclusive directory and keeps recognizing the old version's maintenance.lock; reclaim only after confirming the process ended or the PID was reused. Live old-version long tasks, cross-machine, or unreadable/invalid locks keep blocking writes with diagnostics. When the lock is lost, stop subsequent install/rollback commits and checkpoint auto-recovery, keep the recovery directory; do not hand-delete the lock to force continuation.

The #89 Windows helper-exit failure was rebuilt in a controlled Job Object environment; the reporter's on-site launch/Job mechanism is not yet confirmed, and this version does not claim it fixed. Operation boundaries and scripts: [maintenance record](docs/maintenance-issues-86-89.md). No auto apply/restart, and no changing prompts, config, or proxy.

## 1.6.61: maintenance lock, sub-paths, and the update channel

The maintenance lock publishes complete metadata atomically; it is not deleted by age, and old empty/corrupt locks are not wiped at will. `LOCK_UNREADABLE` means ownership cannot be read for now; `LOCK_LOST` means the lock record is missing/changed; both stop subsequent writes. Cleanup failures after a verified install commit are returned as explicit `cleanup_warnings`, the scene is preserved, and the committed install is never reverse-overwritten. A release failure keeps the exclusive gate; only the recorded original release by the same process may be retried.

Update-channel proxy and GitHub keys are used only for update requests. Leaving them empty inherits the existing update environment — that is not forced direct connection; clearing plugin-stored keys does not delete external environment variables. Credentials are stored in the local `dsh-purge/update-channel.json`; do not commit them or ask users to paste them. Public status hides keys and proxy auth info. Corrupt config must be reported, never silently direct-connected. SOCKS5 uses proxy-side DNS resolution; TLS, source restrictions, and SHA256 checks are unchanged; system/model proxies are not adjusted.

Web sub-path requests locate the mount point via the actual plugin script path; root path and desktop entries stay compatible. Do not widen cookie domains or merge ports to fix 404s. Presets restore the host's native skill-directory discovery, keeping skills' own no-model-call declarations and user-defined presets. Unverified third-party desktop, cookie changes, and the Windows swap helper issue stay individually pending; do not claim them fixed on this basis.

## 31. Discussion issues are not closed (ops convention)

- Discussion threads, experience shares, and question posts started by the user (not bugs, not duplicate requests) get **replies only, never closed**.
- Only "fixed", "duplicate", or "explicitly out of support scope" bugs/features are closed, with the basis written in a comment.
- When closing with an explanation, use `gh issue close -c`; a **plain comment** must use `gh issue comment --body/--body-file` — `-c` on the comment subcommand is a no-op and fails silently.

## 1.6.63: drift judgment (from upstream 1.1.83's generic part)

- Target file exists, marker absent, all anchors miss → `drifted` (previously `skipped`: a soft success, a fake-green status page).
  `patchStatusReady("drifted")` is false, the panel shows "anchor drift", and the self-check counts it as abnormal.
- Self-marked patches (pattern contains `[dsh-purge]`) and patches declaring `silentWhenMissing` (#76) still judge as `skipped`.
- A `fileOptional` target drifting does not drag down the whole patch.
- `ensureHostClean` no longer ignores `pattern_not_found`.
- Not taken: NEXT recognition, allowBuilds/pnpm, empty `[]` in cordis.patch, sub-agent inheriting the parent preset (conflicts with the #53 contract), redteam default cleanup.

## 1.6.64: expect hit-count contract and capability audit

- `{ pattern, replace, expect: N }`: when the actual hit count ≠ N (including 0), the whole entry refuses to write and returns `hitMismatch {patch_id, expected, actual, file}`; the apply path records `hit_mismatch:expected!=actual` and counts it as unapplied.
- The real-device probe `test/expect-contract.test.mjs` requires each literal anchor to occur exactly once in the original host (preferring `.dshpurge.bak`); new anchors must be narrowed or declare an expect.
- Complete-mode injection sections now sort before the official sections (`[...dshPurgeSections, ...dshPurgeRest]`); old hosts have a dedicated migration pattern.
- Audit basis: same-name comparison against upstream 1.1.83 — 72 replacements are character-identical, 6 are strengthened; upstream-only #18/#19 are context protection (not gates) and are not enabled.

## DSH Store submissions and re-checks

The main plugin application must use `GitHub repository: https://github.com/kingcharleslzy-ai/dsh-purge` and `Plugin path (optional): .`; do not omit it just because the form hints the root directory can stay blank. Keep `packages/purge-panel`; it is not the install target of this release. Compatibility info is read from the root manifest's `dsh.compatibility`; do not write README ranges or neighboring-version guesses as exact `compatible`. rc.4 and alpha.2 are still unknown; the basis and limits of the rc.5 author declaration are in the [DSH Store notes](docs/DSH-STORE.md). Do not fabricate install/start/uninstall/rollback evidence at a pinned Commit, and do not remove features or hide host maintenance capability for market admission.

## 1.6.65: default-off optional patches (#18/#19)

- A patch can declare `disabledByDefault: true`; it is applied only when its id is listed in `tuning.json`'s `extraPatches`.
- CLI: `purge-community patches [list|enable 18,19|disable 19]`; after toggling, click "Apply" once, then quit and reopen.
- State: `disabled` means "off by choice"; `patchStatusReady("disabled")` is true; the self-check counts it as explicitly not applicable, no red.
- The apply summary uses the same rule: `disabled` is a soft pass (`ALWAYS_SOFT_STATUSES`) and not counted in `failed`, so the panel no longer reports "N items failed (#18,#19)" after every "Apply". Real failures (write errors, anchor misses) are still counted.
- Current opt-in list:
  - **#18 repeat-call reminders off**: the gain is a clean tool-loop prompt; the cost is the model may keep retrying the same spot with nobody reminding it to switch strategy.
  - **#19 tool-result trimming off**: the gain is reading complete tool output (big files / long logs / full diffs); the cost is linear context growth, faster hitting the ceiling, higher cost, and long sessions answering the wrong thing more often.
  - Neither **unlocks any gate** — they only change context management; both default off.

## 1.6.66: current host diagnostics and Windows swap errors

A desktop process with only `--updated`: read-only diagnostics may inspect that process's `resourcesPath` after package-identity validation; do not extend install/write targets on that basis, and do not globally scan other installations. The running entry may come from Electron's `app.getAppPath()`, but `app` existing on disk does not mean the current process loaded it. Unknown, cross-instance, read failures, and real missing components keep being reported.

The Windows swap keeps waiting only for real share/lock conflicts; other errors keep `detail`, HRESULT, and available Win32 error codes. Do not disable Defender, overwrite the original backup, or mask failure with an auto-restart. The specific stuck cause of #118 still awaits the user's redacted log; this does not claim full #102 NEXT desktop compatibility. Details: [verification record](docs/host-diagnostics-118-119.md).

## 1.6.67: update networking and credential protection (#122)

A failed update-proxy probe does not mean GitHub received the request. Windows probes read-only with `reg.exe` first, PowerShell if needed; do not disable TUNs, change system proxy, or ignore the failure and go direct on your own. Transient errors like connection resets retry at most twice, within the original timeout limits; HTTP, auth, certificate, permission, and SHA256 errors are kept and root-caused.

The `update-channel.json` token is never echoed or logged; on Windows, the first read of an old file tightens the DACL, and new credentials are written only after the protected file is created. If protection fails, error out — do not degrade to a plaintext wide-permission file. Do not delete old config, disable Defender, or add allow-lists just to make the update appear successful. Behavior preferences, prompts, rules, and host patches are unchanged; do not auto-restart after install. Real entry points and limits: [#122 maintenance notes](docs/update-channel-122.md).

## 1.6.69: recovery integrity, unpack boundaries, and lifecycle

- An empty or non-regular host-source backup must not overwrite the original; the error includes the backup path, and a failed backup is kept. Do not delete backups to fake a successful restore. An atomic-replace failure keeps the current file, and permissions follow the existing file (or the backup's permissions when the target is missing).
- Abnormal ASAR entries, data ranges, or link targets fail the whole unpack, keeping the installation in use. Do not ignore out-of-bounds entries or swallow link-creation errors and continue the swap. Resource paths must pass both the textual path and the real link-target validation.
- After a plugin is disabled/uninstalled, old callbacks die and only that instance's own global entries are cleaned. An old instance must not clear a new instance's callbacks; user prompts, config, and host disk patches are not deleted because of this.
- `apply` / `revert` errors are reported with nonzero exit codes; inspect the output and failed items first — a restart does not fix a failed write. Deliberately-disabled optionals follow the existing rule; no new false alarms.
- List performance optimizations keep detail fields, order, and existing length caps; statistics read failures keep their error and must not display as zero.
- Maintainers use `PURGE_ELECTRON_EXEC=<isolated runtime> npm run test:maintenance:electron`; stop when there is no explicit runtime — do not fall back to the production app. Acceptance scope and the Windows Defender blocker: [maintenance record](docs/maintenance-integrity-169.md). The maintainer acknowledged that blocker and explicitly required the release; the release notes keep the failed real-machine acceptance. Do not state the decision as "the problem is fixed", and do not disable protections, add allow-lists, or call component tests a full pass.

## 1.6.70: host diagnostics and module migration

Instance diagnostics take evidence uniformly from the explicit target or the current process entry; do not substitute another installation. When the comparison target is not located, report unknown_target; missing components and read failures keep their original evidence. NEXT is a separate, unverified host family; package-name recognition or a successful disk write is not a proof of full runtime compatibility.

The maintenance module split keeps existing exports; functions and constants needed for the old settings migration moved with their callers; unknown templates still stop and report. The #127 httpServer/webServer contract issue was not merged; do not add unverified service aliases or treat HTTP reachability as a consumer starting normally.

Upgrades follow the existing install entries and data directories; user prompts, settings, and presets are unchanged, and there is no auto-restart. The affected Windows 4090 Defender full-rollback blocker is unresolved; see the [release scope](docs/releases/1.6.70.md).

## 1.6.71: diagnostic counts and the 0.2.2-rc.1 boundary

The diagnostics panel explicitly shows drifted, disabled, and partial, with counters initialized to zero; do not interpret the gap between denominator and applied count as total feature breakage, and do not turn drift into success to silence the warning. Disk summary and grouped summary use different display granularities.

0.2.2-rc.1 is still not fully adapted. The six old patches #14/#17/#60/#62/#67/#74 keep their original definitions and remain unfixed. The native message-turn contract tests pass, but the exception for callbacks lacking messages must still surface — do not swallow the error or drop the input. Real test scope, the other two old anchors, and unconfirmed items: [diagnostics record](docs/maintenance-022-diagnostics.md). Do not auto-apply patches or restart the user's DSH.

## 1.6.74: message retention and plain prompt errors

`PURGE_INVALID_PRE_STEP_DECISION` means the callback's returned messages field violates the contract; locate that callback. Do not patch an empty array to fake a completed turn, and do not replay the rejected task. Prompt assembly failure keeps the original error; no empty prompt and no clearing of the tool list. Once the provider recovers, a normal request can be tried again.

Message/prompt fixes live in the plugin runtime layer for data integrity. Also fixed #67's newline-escape error, migrating only the known corrupt artifact; the original message-length condition is unchanged. 1.6.73's host adaptation is a separate batch of changes and is not part of this verification conclusion. Real plain-prompt module tests and boundaries: [test record](docs/native-input-integrity.md). User config is not changed; no auto-apply or restart.

### Old entry import failure: locate first, then migrate config while preserving it

`Cannot find package 'dsh-purge'` cannot be judged a duplicate install from the package name alone. First verify the erroring process's home/profile, bundle, dependency aliases, and the real package manifest/link. Old dependency aliases resolving to the community package are still supported.

Once a manual insert and the bundle entry are confirmed duplicates, back up, then preserve the original config field by field (including prompts, unknown fields, false, and empty strings), merging into a same-ID config override; conflicts or unknown entry fields stop for review. Remove only that confirmed duplicate; keep the other plugins in the insert, delete by no `dsh-purge-redteam`-style prefix, and do not edit the installed bundle. When the native error persists, investigate the full exception; do not keep blind-deleting. Details: [install troubleshooting](docs/INSTALLATION.md#startup-warning-cannot-find-package-dsh-purge).

Archive examples keep their original text with the warning immediately beside them. `check:docs` parses YAML fenced examples, recognizing quoted/unquoted old module entries, and does not treat ordinary prompts or error text as install entries; the regression is `test/install-docs.test.mjs`. Config-preservation regression for migration/rollback is `test/market-migration.test.mjs`; both are in the default test suite.

### 1.6.73 startup syntax error

When the core agent-loop import reports `Missing catch or finally after try`, first check whether the source file contains a literal backslash-n between #67's two lines. 1.6.74 fixes the template and precisely migrates this one known corrupt artifact; do not globally replace every backslash-n with a newline. Back up before fixing, then syntax-check the whole module. Do not judge success on a patch marker alone, and do not auto-disable all third-party plugins to fix this one module. This fix changes no permission logic; DSH is not auto-restarted.

## 1.6.75: target installation, market, and mirror

- #130: install entries accept both the old `dsh-desktop-host/lib/cli.js` and the new CLI declared by the `@deepseek-ai/dsh` manifest. When the new shell has `harness-node-entry.mjs`, follow it. Do not substitute another host from cwd, profile dependencies, or the user home; an invalid explicit target must error. The old CLI defaults to desktop; the standalone dsh CLI defaults to web; an existing custom profile must be passed explicitly — do not move or rebuild user config.
- Read-only archive recognition is separate from the writable target: `sealed_host:true` means app.asar was located but not yet unpacked — not "patches loaded". A missing component in an existing app directory still reports missing; do not mask a fault with the archive's healthy files. Recognizing the host does not mean all patches adapted.
- #132: `mirrorUrl` lives in the existing update-channel.json and accepts a full HTTPS prefix or `gh-proxy.org`; it is an optional channel with no public service enabled by default. An explicit empty value disables the mirror; old files without a declaration inherit PURGE_GH_MIRROR. Proxy and mirror can be combined; only update requests are affected.
- The mirror covers release queries, raw metadata, and archive transfer; GitHub tokens are never sent to the mirror or its redirects. Pre-install official API digests / SHA256SUMS must come through GitHub (optionally via the existing update proxy); on failure the install stops — a mirror-provided package plus its own digests is not independent source proof, and TLS/SHA256 are never disabled.
- #137: the market index reads each release's manifest.dsh.compatibility.dsh; historical undeclared versions keep their old bounds. Refreshing the index reads new ranges — no plugin uninstall, user compatibility exemption, or app restart.
- This release changes no host patch definitions or user settings, and no auto apply/restart. Isolated install tests are not model-behavior or full GUI acceptance.
