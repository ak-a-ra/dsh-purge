# Maintenance, migration, and recovery

Current version **1.6.97**. Package name `dsh-purge-community`, sourced only from this repository's official GitHub Releases; the internal Cordis ID `dsh-purge`, the HTTP `/dsh-purge/*` endpoints, and the user data directory are preserved. For the main install steps and the mirror-failure decision tree, see the [installation guide](INSTALLATION.md); [AGENTS.md](../AGENTS.md) is the agent operator manual.

## Compatibility and operating boundaries

The verified host targets are Desktop 0.2.1-rc.1 / rc.2. When the host layout is missing, writing stops; other versions are marked unverified, and mismatched component versions are only reported. Compatibility status is not a guarantee that "all patches are in effect" — verify item by item with selfcheck/diagnose. Installer support for a Windows entry point does not mean full Windows patch/UI acceptance.

Install/update, applying host patches, and restart are separate actions. Back up before install, and also before applying host patches; a successful install does not auto-apply or restart. Update checks and auto install are configured separately: checking on by default, installing off; existing preferences are kept.

## Snapshots

Path `$DSH_HOME/dsh-purge-community/backups/<id>/manifest.json`; the integrity manifest includes SHA256 plus the original profile and Purge bundles. Large files are deduplicated by content addressing in `objects/`. The default retention is the last 5, one per day for 7 days, and a 200MB cap; the snapshot for the current operation is protected. The maintenance lock prevents concurrency; a lock left behind by an abnormal exit must first be confirmed to have no maintenance process before it is cleared — do not blindly delete the lock.

Included: the installed Purge package, the profile's package.json/cordis.patch.yml/pnpm-lock.yaml, Purge state, prompt-inject.md, and rules. It does not additionally scan standalone credentials, sessions, or the Qwen image gallery / models. A profile may itself contain private connection information; **do not publish an entire backup**.

## Failure recovery

A download/verification failure has not entered the migration; once migration starts, a snapshot is taken before installing. The install package is copied into the persistent pkgs directory so file: dependencies do not point at a temporary download. On failure the backup ID is returned; the original package.json is restored only when no other dependency is being concurrently changed, and it is not claimed that the whole node_modules/lockfile was atomically rolled back. Verify the actual state before rolling back.

Rollback first verifies the snapshot, backs up the current state, installs the snapshot code with the current instance's DSH CLI, restores only the Purge enable entry, and keeps the current prompts, rules, and other plugin configurations. If user content needs to be recovered, select it file by file from the snapshot manually; the profile is not overwritten wholesale. The original lockfile left by a failed installer can be inspected but must not overwrite newer changes from other plugins.

```sh
purge-community backup
purge-community rollback <backup-id>
# When the installed plugin cannot be loaded, use the CLI from a separately verified release package:
# set PURGE_DSH_CLI / DSH_HOME / DSH_PROFILE first, then run
node package/bin/community.js rollback <backup-id>
```

Stop when the profile does not exist or multiple profiles exist without an explicit choice. Web/Headless uses only the current service CLI; see [instance targeting](WEB-MAINTENANCE.md). Other desktop installs are not scanned or operated on by mistake.

## Mirror and updates

The standalone migrator performs one scoped official-registry retry only for issue #7's clear "public package version missing" error. Incomplete official metadata, private/unknown sources, and real release-age/integrity/trust failures all stop. Failed install logs keep the original error; lock files are not cleared, global caches are not cleared, verification is not disabled, and the global source is not switched. The DSH market install precedes plugin loading, so either pick the official source or use the standalone entry point.

## Release constraints

Keep the current version synchronized across package.json, release-notes, README.md, README.zh-CN.md, the English guide, AGENTS.md, and the maintenance/installation docs. `npm run check:docs` checks that the Chinese copy is consistent and that the key install boundaries are present. CI runs the functional/packaging regression and installer tests on three operating systems; the Windows entry point also runs PowerShell 5.1/7. After passing, tag and release the tgz, stable alias, and SHA256. The market index follows the official release. Real-host acceptance and simulation tests are reported separately; unknown platforms are not written as verified.

## Windows repack state and offline recovery (issue #10)

Since 1.6.26, repacking no longer happens by periodically quitting the background or killing the desktop shell. After the user clicks "Apply," the helper waits for every DSH process on the same install path to exit, saves the one original archive backup, verifies SHA256, then stops; the user opens the app themselves. Other running installs are not affected. If the official update replaces the archive while waiting, an error is raised and the new archive is kept; the new version must be re-applied.

Diagnostics live in `resources/app.asar.purge-handoff.json` and `.json.log`. `starting` is not ready, `waiting_for_quit` is not complete, and the on-disk patch count is not the current process's loaded state. When the helper has not confirmed readiness, ended early, or timed out, the host stays running. Do not declare a fix by deleting only the pending marker, and do not disable antivirus, adjust permissions globally, or modify the host's crash notices to mask errors.

See also `.json.broker.log`, `.json.launch.log`, `.json.launch.log.error` for startup errors. On-device testing found Electron's detached PowerShell can exit 0 without running the script, so a short broker launches the standalone helper. Broker success does not mean the handshake succeeded; the status file is the final word. Maintenance regressions must supply a real Electron and verify the helper survives the launcher process exiting, until the archive repack completes.

When the helper never completes: keep the logs first, fully quit DSH from the system tray, and confirm the task manager has no process **for that install path**. Only when this "Apply" succeeded and `resources/app/package.json` plus the host files are intact, rename `resources/app.asar` **and keep it** in a standalone PowerShell as a new timestamped `.bak`, then open DSH manually. What this bypasses is a dead handoff process, not a patch rewrite. If the files are still in use / permissions are insufficient, keep the original and stop; do not delete app.asar or force-kill every Electron. This step does not apply to a fresh archive just replaced by an official update.

Returning to the original host: after a full quit, cross-check the status file's `backup` and `archive_sha256`, verify that original archive backup with `Get-FileHash -Algorithm SHA256`, and confirm there is no cross-official-version issue. Keep the current unpacked directory and the surviving archive, then copy the original backup back to `resources/app.asar` and open manually. This process does not restore the profile and does not overwrite the current prompts, rules, or other plugin settings. Plugin version rollback still uses the `rollback <id>` above; do not confuse the two rollbacks.

## Native settings interface and the #42 migration (issue #9)

The new version adds only the settings-update event on a native `describe` / `replace` host; no mixed API is created. The exact old legacy shim that was injected is removed at the next "Apply" and takes effect after a manual quit and reopen. The user's entry Config and settings.yaml/imported/legacy documents are all kept; this fix does not silently merge data historically written into the wrong store. If another plugin previously wrote data into the old document, back it up first and let the user migrate selectively. Unknown third-party-rewritten shims stop applying, keeping the original file, backup, and diagnostics.

## pnpm path missing after unpacking

After 1.6.9 pre-release testing, Windows relative junctions were found to point the wrong way depending on the startup directory. 1.6.26 uses an absolute target and repairs the current instance's link before install; the old broken link is renamed and kept. If an old updater already reported pnpm.mjs missing, pin 1.6.26 via the standalone install entry point; do not delete the app/runtime directory contents or manually clear the lock file. When the runtime is unavailable before repacking, the original archive is kept.

## Command name collisions, interface 404s, and yellow self-check items (1.6.26)

#12's author corrected the original guess: the real break point measured is the `/rewind` name collision, not the inactive context. The new version keeps the original owner of the command and continues to provide Purge functionality through a backup command. There is no need to uninstall other plugins or add process-level polling.

#15 confused the file's original value with the effective value. The new version separates `inferred`, `unknown`, and `broken`; the panel's question mark shows the evidence and scope. The CLI does not execute configuration expressions and does not guess the current instance by scanning other installs. See AGENTS §16; user permissions are not auto-changed.
## Preset migration and rollback (1.6.26)

`tool-subagent: toolFilter is no longer supported` is a preset-activation compatibility problem; a permission self-check or "the YAML parses" cannot substitute for acceptance. The new version converts the expressible old spawn deny policies into native sub-presets before registration; the original user file is untouched. Backups live in `$DSH_HOME/dsh-purge-community/preset-migrations/`, each with a SHA256 manifest; when backup permissions are missing or an existing snapshot is corrupt, stop.

Do not use `preset install --force` to overwrite custom files to clear a red box, and do not merely delete `toolFilter`. The parent session keeps its full tools, the child session still excludes the original tools, and depth, persona, and settings are preserved. At this stage only a single spawn deny list is supported; unknown tools / existing agentPreset / allow / multiple policies need separate design and must not be auto-guessed.

Run `test/desktop-presets.mjs` with the current Desktop's real Electron, covering reproduction of the original error, the real parent/child Agent tool catalogs, repeated loading, uninstall, and backup byte verification. This test creates a blank Agent in an isolated home and sends no model request. A code rollback reverts the runtime conversion and does not need to overwrite user files; reloading the old version meets the old-argument error on the new host again. Do not auto-restart the user's application.

## 1.6.26 permission restoration and read-only diagnostics

The executable bit lost by the atomic replacement in [#20](https://github.com/kingcharleslzy-ai/dsh-purge/issues/20) is fixed. A failed CLI backup stops the write; old backups are kept. When rolling back a launcher, restore both content and ordinary rwx permissions — not just the text. The backup is `.dsh-purge.bak` in the same directory; if that backup came from a version with broken permissions, it must not be assumed to have the correct execute bit. Do not recursively chmod the whole application, and do not apply host patches or restart the application just to repair a launcher.

[#19](https://github.com/kingcharleslzy-ai/dsh-purge/issues/19) remains under investigation. Use `purge-community host-status` or the status interface's `host_layout` to check the disk layout and the current service entry separately. An app.asar on disk does not prove the current service loaded from the archive; the archive being moved away does not prove the old process reloaded. Web/CLI paths and Desktop paths differ and should be kept, checked against concrete instance evidence; do not move the archive away directly, overwrite the old backup, or restart repeatedly to "clear the red."

This change touches only generic file operations, CLI error reporting, and read-only diagnostics; host patches, the repack helper, prompts, and permission policies are unchanged. Full verification is in [1.6.26](releases/1.6.26.md).

## 1.6.29: rollback and network

Panel rollback installs through the archive and verifies the new process loads; on failure it restores the dependency graph from before this round. The update proxy acts only on plugin requests and does not modify the system; the token goes only to the GitHub API. Environment variables must be inherited by the actual host process. An old version that corrupted a link can be restored through a verified new release package via the standalone entry point; do not delete user settings or global caches. Limitations and on-device methods are in the [maintenance notes](maintenance-issues-34-35.md).

## 1.6.39: slow-network updates and audit ownership

The archive budget uses `PURGE_DOWNLOAD_TIMEOUT_MS` (default 180000, range 30000–900000); the optional `PURGE_GH_MIRROR` transfers only community TGZs, and an unavailable official digest stops. A container root home needs an explicit service UID/GID; do not widen permissions or change the global proxy. Full steps, variables, and test boundaries are in the [maintenance notes](maintenance-issues-44-47.md). No auto restart.

Standalone installer download and network troubleshooting are in the [#52 maintenance notes](maintenance-issue-52.md); do not misjudge a network failure as install corruption or ask the user to clear their configuration.

## 1.6.41: update state reconciliation

The running version and the current profile's disk version are reconciled separately; an old pendingVersion does not represent the current install. Unknown versions or read failures keep warning, and an install failure is not masked by a success check. When an old version is stuck, install the new one manually first and have the user quit and reopen once manually; do not delete settings, change update switches, or auto-restart. Details in the [state migration and test notes](maintenance-update-state.md).

## Update-channel network and Windows credential protection (1.6.67 / #122)

Proxy probing, network transport, HTTP auth/rate-limiting, and credential-file permissions are each reported separately. Transient errors get only limited retries and cannot mask certificate, source, or digest verification errors. Windows migrates the ACL on first read of old credentials; before writing, the staging directory and file are protected, and a failed atomic replace keeps the old file. Do not disable defense, widen ordinary-user permissions, or change the global proxy. Test methods and the reporter's still-to-be-confirmed environment are in the [detailed notes](update-channel-122.md).

## 1.6.75 install layout, mirror, and market

1.6.75 was approved for release by the maintainer with knowledge of the Windows on-device limitation. Fix scope, real runtime evidence, and the Windows Defender blocker are in the [#130/#132/#137 acceptance record](update-layout-130-132-137.md). Component tests or a pnpm version query passing do not substitute for Windows full install, migration, and rollback passing. Do not auto-restart, clear caches, or modify the defense.
