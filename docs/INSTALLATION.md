# Installation, upgrades, and troubleshooting

Current version **1.6.97**. For users and agents assisting with installation. Supported installer environments: Linux CLI/Web; macOS Desktop; Windows 11 PowerShell 5.1/7. Full Windows host patch and UI acceptance are separate from installer tests; a passing install does not prove all features work.

## Before installing

- Confirm user authorization, read the actual DSH version and app path, and open once to finish profile initialization.
- Default data directory `~/.dsh`; the old Desktop CLI defaults to profile `desktop`; the new desktop shell with a standalone `@deepseek-ai/dsh` CLI and CLI/Web default to `web`. Different directories/profiles must be specified explicitly; another instance is never auto-selected.
- Running tasks are kept; install does not stop processes or auto-restart. The user reopens manually after tasks finish.
- No admin rights or global Node/pnpm needed; the Desktop entry uses that app's Electron runtime and CLI. On permission problems, check the path first; blind privilege escalation is not recommended.

## Web upgrade and rollback from a pnpm source workspace

When launched from a workspace, first check the running process's entry, `DSH_HOME`, and profile. The workspace package should be `@deepseek-ai/dsh`; read the `bin.dsh` declared in its `package.json`. A link resolving to `apps/cli` is a normal layout. Upgrades and rollbacks use that package's entry.

If an old version says in the panel "cannot locate the CLI of the current DSH instance," first run the official CLI from **the same workspace** and add a SHA256-verified new release package to the current profile. For example, for the rc.2 layout in the report, run `node ./apps/cli/lib/bin.js plugin --profile web add ./dsh-purge-community.tgz` at the workspace root. The prerequisite is that the file is a verified local release package and the current terminal's DSH_HOME matches the running service; other layouts substitute according to the actual bin and profile. Wait for the user to manually reopen the service, then verify the panel upgrade and rollback.

## New desktop layout and update mirrors (1.6.75)

Both Windows `DSH Desktop.exe` and the older `DeepSeek Harness.exe` are candidates; the in-package CLI identity still needs verifying. The new layout reads its entry from `@deepseek-ai/dsh/package.json`'s `bin` and reuses the same install's `harness-node-entry.mjs`, packed pnpm, and lock-recovery launcher. Do not install global pnpm or pick another DSH just to work around "pnpm not found." When multiple candidates coexist, specify explicitly with `-DshExe`. A custom profile is always passed with `-Profile` / `--profile`; when initialization is missing, stop — do not move user data to guess a match.

`sealed_host: true` means the host was recognized inside `app.asar`; it is not yet a writable unpacked directory. Diagnostics no longer treat it as "no host," and virtual archive paths are not handed to direct file writes. When an existing unpacked directory is corrupt, missing or read failures are still reported.

The plugin's "update channel" can store an optional HTTPS mirror prefix, e.g. `https://gh-proxy.org/`. The mirror covers release queries, raw metadata, and package transfer; the GitHub Token is not sent to the mirror, including redirects initiated by the mirror. A proxy and a mirror can be used together; only the plugin's update requests are affected, and the system or model proxy is not changed. An explicitly emptied mirror is disabled; old configurations without this field remain compatible with `PURGE_GH_MIRROR`.

**The mirror is not a verification source**: install still obtains release digests through the official GitHub API, and older releases read the official SHA256SUMS when needed. GitHub is reachable through the existing update proxy. When the official verification is unreachable, stop — mirror self-reported digests are not accepted, and TLS or SHA256 is not disabled. The first-install script's download path is separate from the in-plugin update channel; a not-yet-installed plugin's update settings cannot be claimed as readable.

## Distinguish the official entry from the community installer first

- **DSH official way**: the install confirmation in the plugin UI, or `dsh plugin --profile <actual-name> add <package-source>`. It manages profile dependencies and bundles; third-party markets provide the catalog, and the host still performs the install.
- **Purge community installer**: this repository's `scripts/install.sh` / `scripts/install.ps1` and bootstrap. It adds Release download/SHA256, a persistent archive, snapshots, old-package migration, and failure recovery on top of the official CLI; it is not a DeepSeek official script.
- A first install can use either; when `dsh-purge` or a split panel is already installed, migrate with the community installer to avoid duplicate entries. Do not uninstall first, and do not install a same-named npm package.

Official sources: [CLI and bundle](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.zh.md), [plugin market](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/plugin-market.zh.md).

## Copyable commands and prerequisites

The [Installation section of the README](../README.md#installation) gives macOS, Windows, and Linux commands starting from the download, plus the official CLI commands with a fixed release TGZ. They do not require cloning this repository. Do not paste in-repo relative-path commands to a user without the source tree.

macOS assumes `/Applications/DeepSeek Harness.app` by default. Use `DSH_APP` (pointing at the `.app`) for a custom install location and `DSH_HOME` for a custom data directory; pass the same `--profile=actual-name` in both calls. Windows supports `-DshExe` (full path to the actual exe), `-DshHome`, `-Profile`, and `-Version`. When a path is not unique, stop and specify it explicitly; never guess at another copy. The macOS installer reads XML or binary plists via the system `plutil` and requires `CFBundleExecutable` to be a valid file name inside the package; missing, corrupt, out-of-bounds paths, or symlinks error out rather than falling back to a guessed executable. A renamed app can be selected explicitly with `DSH_APP`. App identity is based on the DSH host package and CLI files, not on window names or the mere presence of `app.asar`. This is layout verification, not signature or publisher authentication.

`--dry-run` / `-DryRun` checks the profile, locates the CLI, downloads the release package, and verifies SHA256; **it does not run pnpm, migrate, roll back, or do full-start verification**. Drop the flag to install for real. The default reads the latest stable Release; to pin this release, add `--version=1.6.48` to both shell invocations, or `-Version 1.6.48` to both PowerShell ones. The entry script and bootstrap still come from this repository's master; do not read the version flag as pinning every downloaded script.

After a real install, check the exit code, returned version, `backup_id`, the target profile's dependencies/bundle, and the package entry; an existing process still running old code is not an install failure. Leave the process alone; when the user is free, manually reopen and then check the running version.

### Linux CLI / Web

Verified on CachyOS x86_64 with DSH 0.2.1-rc.2. In the repo, run `sh scripts/install.sh --dry-run`, verify source and SHA256, then drop `--dry-run` to install. Defaults are the `node` / `dsh` on PATH and the `web` profile; you may set `DSH_NODE`, `PURGE_DSH_CLI`, `DSH_HOME`, `--profile=name`, and an existing Linux Electron desktop app may be pointed at explicitly with `DSH_APP`, in which case the default profile becomes `desktop`.

To install code from this branch that is not yet released, pack first and then use `--archive=/absolute/path/to/package.tgz --sha256=expected-digest`. Local packages are also verified by name, version, and repository identity; installing dependencies still needs network or cache. Full commands in the [Linux install entry in the README](../README.md#linux--cli--web).

When the system npm directory is not writable, the installer keeps the original install, copies the complete host to the user directory, and creates or switches `~/.local/bin/dsh` only after the plugin migration succeeds. A failed migration keeps the original entry; the unactivated copy is available for retry. Concurrent modification of the entry stops it, and the user's command is not overwritten. Quit the old service, start through that entry, then apply patches; a web-page refresh does not switch entries. Unrelated existing launchers are not overwritten, dry run does not copy the host, and `/usr` permissions are not modified. After updating the system DSH, explicitly choose the new system CLI and rerun the installer to create the new copy.

## Installer promises and boundaries

1. Downloads only from this repository's stable GitHub Releases, with bounded redirect sources, download size, and wait time.
2. SHA256 matches the downloaded version package only; it does not require the stable alias from the manifest to have been downloaded too; duplicate entries or mismatches stop.
3. A real install checks file paths before unpacking, verifies package name/version/repository, then invokes the release package's migrator. Dry-run stops after the SHA256 check and does not run these install phases.
4. The migrator snapshots first, saves the package in a persistent directory, and hands it to the DSH CLI, so the next resolution does not point at a cleaned-up temp file.
5. Existing prompts, rules, and other plugin configurations are not rewritten; Purge's dependency versions and enable entries are updated, and the profile lockfile is maintained by the DSH package manager.
6. A non-zero exit code is a failure; the temp download is cleaned up, the persistent snapshot is kept. No auto apply, no DSH restart.
7. When the unpacked desktop's `app/runtime` is missing/corrupt, the old link may be kept and a link to the same install's runtime created; other in-use targets or incomplete real directories are reported as conflicts. See the previous section for the Linux read-only system host's user-copy/launcher behavior. Do not promise "the installer never writes into the host directory."
8. The SHA256 belongs to the Release TGZ; the entry script and bootstrap are downloaded over this repository's HTTPS master and carry no independent signature guarantee.

## Issue #7: mirror missing a version

Log signature: `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`, with the only failing item `@dsh-ops/bash-win32-x64@<version>` and a clear reason of `version not present in registry manifest`.

During investigation, the npm official registry had 0.2.1 but the npmmirror metadata lacked the version. This state changes and must not be assumed permanently; the installer re-checks the official metadata in real time only when it meets this error.

The recovery scope is narrow: read the effective source of the current profile; only when that scope or the default source is explicitly `https://registry.npmmirror.com/`, and the official response's package name, version, publish time, SHA512, and tarball source are all complete, add `--config.@dsh-ops:registry=https://registry.npmjs.org/` to this CLI run and retry once. Other dependencies keep the original source; no `.npmrc` is written. pnpm still checks its own release age, integrity, and trust policies; a package existing officially does not mean it is necessarily allowed to install.

Private/unknown sources do not fall back; a real "release age too short," integrity/trust error, does not fall back; an official query failure or retry failure stops, no further guessing.

The market JSON first install runs DSH's package manager before the plugin is loaded, so an in-plugin fix cannot help. Retry by selecting the npm official source in the DSH install dialog, or use this version's standalone installer. Switching tarballs directly may still fail at the host's dependency verification stage. Do not claim the official DSH installer has been modified.

`HEAD https://github.com/... UND_ERR_DESTROYED` is a GitHub network problem. Keep the complete sanitized log to separate the errors; switching the npm source does not guarantee the GitHub connection is fixed.

## Startup warning: Cannot find package 'dsh-purge'

The host startup or the panel reports:

```
dsh: warning: 1 entry did not activate
dsh-purge (dsh-purge): failed to import
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'dsh-purge' imported from <profile>
```

This error means the current profile cannot resolve some entry reference; **it must not be judged as duplicate configuration from the error text alone**. A historical standalone-package example copied from the archived upstream README may leave a manual entry pointing at the old package name; dependencies not installed, broken links, the wrong profile, or a disabled bundle can also cause the import failure.

Troubleshoot in this order; do not uninstall/reinstall or bulk-delete by name prefix:

1. Confirm the erroring process's DSH, home, and profile, and the bundles actually enabled. Check that profile's dependencies, the actual package's `package.json`, and whether the link target exists. The community package name is `dsh-purge-community`; a historical dependency alias `dsh-purge` that actually resolves to the community package is also supported — **it must not be deleted on the alias alone**.
2. Before modifying, back up that profile's `cordis.patch.yml`, `package.json`, and existing lockfiles. Keep the full error, entry ID, and resolution path for cross-checking; sanitize before sharing logs.
3. Only when the bundle already provides the entry and the profile manually inserted the same entry, migrate that one duplicate. Merge the original item's **entire `config` (including prompts, unknown fields, and explicit false/empty strings)** into the profile's configuration override with the same ID; on a same-name field conflict, let the user decide which value to keep — never overwrite with a default. If the original item has entry fields whose meaning cannot be confirmed, keep and report them; do not discard on your own.
4. After verifying configuration preservation, remove only the confirmed duplicate insert. One `insert` container may hold other plugins and must be kept; an empty container is removed only when it becomes empty. Entries like `dsh-purge-redteam*` are legitimate bundle entries and **must not be deleted by prefix**; do not edit the installed package's bundle source files directly.
5. When the entry exists only in the bundle, a profile configuration override with the same `id` may be added, with no further `insert` or `name`. The following is a structure example only; a real migration must use the user's original complete configuration — do not copy the example values to overwrite:

```yaml
- id: dsh-purge
  config:
    autoUpdateOnStart: false
```

6. After cross-checking the final effective entry, dependency resolution, and kept configuration, the user chooses when to fully quit and reopen DSH; no auto restart. If it still fails, distinguish dependency, link, profile, or service faults from the full exception; **do not assume another duplicate entry and keep deleting**. When in doubt, stop the migration and keep the backup and scene.

The installer still refuses to migrate and keeps the configuration on a manual entry it cannot safely judge; this document adds no auto-delete-configuration logic. For more detail on configuration merging, see the [maintenance notes](maintenance-issue-53.md).

## Failures, backups, and rollback

- Record the failure stage, DSH/plugin versions, profile, download source, and backup_id; hide usernames, private addresses, and tokens.
- A download/verification failure has not run the migration, so no install changes should exist. A failed migration keeps the snapshot; do not delete the backup first.
- `purge-community backup` is an explicit backup; `purge-community rollback <id>` verifies the snapshot, then rolls back the plugin code and entry while keeping the current user content. The original lockfile is saved in the snapshot for cross-checking; do not blindly overwrite other plugins' new dependencies.
- If the failure prevents the plugin from starting, use the verified release package's `bin/community.js rollback <id>` together with an explicit current CLI/home/profile. See the [maintenance docs](MAINTENANCE.md).
- Generic "fix" actions are forbidden: deleting all lockfiles, clearing global caches, disabling minimumReleaseAge/trust/integrity, switching sources globally, auto-restarting, or auto re-applying host patches.

<a id="cli-rollback"></a>
## CLI rollback and command location

Rollback restores an existing plugin version from a snapshot; it is not an uninstall. An empty snapshot from before the first install has no Purge package to restore, and the CLI reports this explicitly; do not phrase it as "one-click back to not installed." Upgrade/migration snapshots of an existing version are what restore the old version.

When a panel is available, prefer a backup under "Purge → Status → Local backups" and confirm the record matches this install. When the panel is unavailable, run the CLI installed in the current profile the following way. `purge-community` is a bin inside the profile and is not guaranteed to be on the global PATH; **do not `npm install -g` to get the command**.

CLI/Web (macOS, Linux; existing Node ≥18 and this instance's `dsh` command; red team tools additionally need ≥22.5):

```sh
export DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
export DSH_PROFILE="${DSH_PROFILE:-web}"
export PURGE_DSH_CLI="$(command -v dsh)"
node "$DSH_HOME/profiles/$DSH_PROFILE/node_modules/dsh-purge-community/bin/community.js" status
```

`status` returns the `backups` array in the maintenance state. After choosing an `id` that actually exists, replace the trailing `status` in the same command with `rollback "actual-backup-ID"`; do not use an example/other-instance ID. After rollback, verify version and bundle; keep user configuration added after the rollback; the old process still needs a manual reopen by the user.

macOS Desktop (the example below is for an install whose executable is still called `DeepSeek Harness`; a custom app path changes `DSH_APP` first, and a renamed executable must use the verified name from that app's plist — never guess at another install):

```sh
export DSH_APP="${DSH_APP:-/Applications/DeepSeek Harness.app}"
export DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
export DSH_PROFILE="${DSH_PROFILE:-desktop}"
ELECTRON_RUN_AS_NODE=1 "$DSH_APP/Contents/MacOS/DeepSeek Harness" "$DSH_HOME/profiles/$DSH_PROFILE/node_modules/dsh-purge-community/bin/community.js" status
```

After choosing this instance's backup, replace the trailing `status` with `rollback "actual-backup-ID"`. This runs the maintenance command in Electron's Node mode without opening or restarting a DSH window. If the original install is corrupt, first download and verify a release package per the README, unpack it into the kept recovery directory, and use its `bin/community.js` in place of the plugin script path above; do not point at another home.

Windows Desktop: first determine the exe from the installer's error message or the actual install location; only the first line below needs the real path. An explicit process wait is used here; the `$LASTEXITCODE` after `& exe` cannot prove a GUI-subsystem program has completed.

```powershell
$DshExe = Read-Host 'Enter the full path of the current DSH exe (no quotes needed)'
if (-not (Test-Path -LiteralPath $DshExe -PathType Leaf)) { throw 'DSH exe not found' }
$env:DSH_HOME = if ($env:DSH_HOME) { $env:DSH_HOME } else { Join-Path $env:USERPROFILE '.dsh' }
$env:DSH_PROFILE = if ($env:DSH_PROFILE) { $env:DSH_PROFILE } else { 'desktop' }
$PurgeCli = Join-Path $env:DSH_HOME "profiles\$env:DSH_PROFILE\node_modules\dsh-purge-community\bin\community.js"
if (-not (Test-Path -LiteralPath $PurgeCli)) { throw 'Community CLI not found in the current profile; use the verified recovery package as described' }
$PurgeLog = Join-Path $env:TEMP ('purge-status-' + [guid]::NewGuid().ToString('N'))
$PreviousElectronMode = $env:ELECTRON_RUN_AS_NODE
try {
    $env:ELECTRON_RUN_AS_NODE = '1'
    $p = Start-Process -FilePath $DshExe -ArgumentList @(('"' + $PurgeCli + '"'), 'status') -Wait -PassThru -NoNewWindow -RedirectStandardOutput "$PurgeLog.out" -RedirectStandardError "$PurgeLog.err"
    Get-Content -LiteralPath "$PurgeLog.out", "$PurgeLog.err" -Encoding UTF8
    if ($p.ExitCode -ne 0) { throw "Maintenance command failed: $($p.ExitCode)" }
} finally { $env:ELECTRON_RUN_AS_NODE = $PreviousElectronMode }
```

Pick the backup ID from the output; change `'status'` in `-ArgumentList` to `'rollback', 'actual-backup-ID'` and run the same block. Accept only this instance's backup ID from the output; do not copy the example. When the CLI is corrupt, use the verified recovery package's `bin/community.js`, still with the current instance's exe, home, and profile. Do not restart on the user's behalf.

## Development acceptance

`node --test test/install-registry.test.mjs test/bootstrap-install.test.mjs` covers normal install, exact-error retry, private source, mixed errors, official metadata missing, network failure, SHA256 stable alias, and temp paths with child processes. `test/install-windows.ps1` verifies entry arguments, paths, exit status, and environment restoration on Windows PowerShell 5.1 and PowerShell 7. CI runs installer tests on Linux/macOS/Windows. Migration/rollback on a real DSH isolated profile is recorded separately; none of these tests substitute for full Windows DSH UI/host-patch acceptance.

## Windows historical real-runtime regression

The official Desktop is a GUI-subsystem exe, and the PowerShell call operator is insufficient to prove the install finished. The installer waits for the process via Start-Process and reads the actual exit code and UTF-8 output before deleting the temp script. CI adds a GUI-subsystem test that reads the bootstrap with a delay, preventing another fake success and MODULE_NOT_FOUND. Production installs do not need a .NET compiler; the GUI test program is compiled only by dev/CI.

The historical version was verified on real Windows 11 Pro (build 26300) with a signature-valid official Desktop 0.2.1-rc.2 runtime, a standalone app copy, and separate DSH_HOME and user-data-dir, covering download verification, install, snapshot, rollback, and settings preservation; PowerShell 5.1/7 regression passed. This evidence does not claim login, full UI, or all host patches were accepted. See the [1.6.10 record](releases/1.6.10.md).

1.6.14 fixed the lost macOS CLI execute bit and added the read-only host-status. The current version's test scope is in the [1.6.14 acceptance record](releases/1.6.14.md); do not phrase the historical Windows desktop acceptance as if this version re-ran full UI acceptance.

## 1.6.29: rollback and network

Panel rollback installs through the archive and verifies the new process loads; on failure it restores the dependency graph from before this round. The update proxy acts only on plugin requests and does not modify the system; the token goes only to the GitHub API. Environment variables must be inherited by the actual host process. An old version's corrupted link can be restored through a verified new release package via the standalone entry; do not delete user settings or global caches. Limitations and on-device methods are in the [maintenance notes](maintenance-issues-34-35.md).

## 1.6.39: slow-network updates and audit ownership

The archive budget uses `PURGE_DOWNLOAD_TIMEOUT_MS` (default 180000, range 30000–900000); the optional `PURGE_GH_MIRROR` transfers only community TGZs, and an unavailable official digest stops. A container root home needs an explicit service UID/GID; do not widen permissions or change the global proxy. Full steps, variables, and test boundaries are in the [maintenance notes](maintenance-issues-44-47.md). No auto restart.

## #52: download failure and fallback channel

The new standalone installer reports `[download] stage=archive host=github.com transport=fetch attempt=1/3 code=…`. At most two fetches and one system curl; source, certificate, and SHA256 are not relaxed because of this. First re-download the entry script and run dry-run; keeping the failure stage and error code is enough — do not paste proxy passwords, full environment variables, or signed download URLs. Details in the [download diagnostics](maintenance-issue-52.md).

## 1.6.41: update state reconciliation

The running version and the current profile's disk version are reconciled separately; an old pendingVersion does not represent the current install. Unknown versions or read failures keep warning, and an install failure is not masked by a success check. When an old version is stuck, install the new one manually first and have the user quit and reopen once manually; do not delete settings, change update switches, or auto-restart. Details in the [state migration and test notes](maintenance-update-state.md).

<a id="isolated-acceptance"></a>
## Isolated acceptance of install commands (2026-10-23)

PR #78's candidate package added five real CLI lifecycle acceptances: official first install, community bootstrapper first install, original-version migration, community upgrade, and old-alias upgrade; each still tests rollback, re-upgrade, failure recovery, and preservation of later user edits. Execution method, candidate package digest, and uncovered scope are in the [PR #78 install integrity record](pr78-runtime-integrity.md). These results do not substitute for market UI, cold-cache download, or host-feature acceptance, and they do not resolve the PR's still-open target-identification issues.

Maintainers verify this page's install protocol with `scripts/check-install-instructions-runtime.mjs`. It requires an explicit test runtime, the same copy's official CLI, an old-version archive, a verified release archive, and a test root directory; it does not accept a formal app as the macOS test runtime.

```sh
node scripts/check-install-instructions-runtime.mjs "$TEST_RUNTIME" "$TEST_DSH_CLI" "$LEGACY_TGZ" "$RELEASE_TGZ" "$TEST_FIXTURE_ROOT"
```

This is a **development acceptance command**; the variables must be real paths to test resources, not user install commands. Windows uses a standalone Desktop copy; the root needs the `.purge-install-test-fixture` marker; the test does not open desktop windows. macOS first creates a command-line copy with `node scripts/prepare-install-cli-fixture.mjs "/test-source/Contents"`, then uses the output path. The source should already be a prepared test host; a formal app is not unpacked.

macOS does not copy the top-level `Info.plist`, does not create a `.app` path, and does not launch through Finder, `open`, or LaunchServices; only the newly created test executable gets a locally dev-signed identity, and the formal app or system security policy is not modified. The acceptance script forbids writing to `/Applications`, the default `.dsh`, DSH's Application Support, and log directories via an OS sandbox, and all install child processes inherit it. Do not fall back to running the user's DSH with a "read-only formal runtime" option. If the system blocks the test, stop and inspect the test copy — do not strip the formal app's isolation, re-sign the formal app, or ask the user to reinstall.

Real acceptance this round: macOS / Windows 11, Electron 44.7.0, DSH CLI 0.2.1-rc.2, community 1.6.47, old package 1.1.71. Both platforms cover official CLI first install, the downloaded community installer's dry-run and real install, old-package migration, the snapshot list and rollback, verification of package version, bundle, and configuration content before/after migration, and that rollback keeps user configuration added after install. Each scenario uses a fresh `DSH_HOME` and a `web` profile that the CLI can initialize; this verifies the CLI/runtime carried by Desktop and the installer paths, **and does not mean desktop login, market click flow, or host patch features were tested this round**. A real user's Desktop profile still uses `desktop`; do not copy the acceptance profile as-is.

### App location boundaries (PR #78)

A target explicitly specified with `DSH_APP` / `DSH_EXE` stops after validation fails; it does not auto-switch to another app. Maintenance code does not walk mounted volumes, working directories, or arbitrary parent directories; provide the real path for custom installs. When auto-discovery is explicitly requested, known default locations and system registrations may still be queried, but multiple valid targets need a user choice.

Architecture-split runtimes are chosen by the running process's `process.arch`, not guessed across architectures. The official CLI needs `app/runtime/primary-runtime/...`, so a new link points directly at the valid architecture subdirectory. Existing real directories or links pointing at other valid directories are kept; conflicts error explicitly and are not auto-overwritten. Measured scope and reproduction steps are in the [PR #78 acceptance record](pr78-runtime-integrity.md).

### An old profile's floating download address blocking other plugins (#164)

The symptom is pnpm erroring on an address that belongs to another plugin's install, yet it is Purge's `releases/latest/download`. Disabling on the plugin page only changes the load state; the profile dependencies still participate in resolution.

After obtaining a release package that includes this fix and verifying SHA256 per the above, run the unpacked `bin/community.js migrate <verified-local-tgz-path>` from that package on the original profile. Keep the original DSH_HOME and DSH_PROFILE. The migrator replaces this project's recognized old floating address with the local persistent archive; disabled plugins stay disabled. A failed migration restores the original manifest; on error the failure message is kept for diagnostics.

### Windows official desktop update handoff (main branch)

After DSH confirms installing an official desktop update, the community edition looks for the handoff helper in the desktop and web profiles, supporting both package names `dsh-purge-community` and `dsh-purge`. A plain single-file update first compares the SHA512, target version, and DeepSeek Authenticode publisher provided by the official updater, waits for the desktop to exit normally, then runs the installer. The whole process does not auto-rewrite the updated host.

If the post-update version is unchanged, check the last record in `<DSH_HOME>/logs/official-installer/update-*/result.jsonl`. `waiting-for-exit` means the helper is still waiting for the original desktop process to exit, `failed` records the failure reason, and `installed` means the installer returned success and the target EXE's FileVersion also matches. Split packages and installs needing elevation are handled directly by the DSH official updater; check the official installer logs.
