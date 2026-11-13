# Installing or migrating Purge from the plugin market

For a first install, search dsh-market for `kingcharleslzy-ai/dsh-purge`. Confirm the repository author and the package name `dsh-purge-community`; same-name mirrors are not the same release source. Do not run `dsh plugin add dsh-purge` or the bare package name `dsh-purge-community`: this project is distributed via GitHub Releases and does not depend on those two npm names.

## Already on an old version: migrate directly, do not uninstall first

If the market says "already installed as dsh-purge," that does not mean the community edition is installed. The two packages share the same entry ID; force-enabling both at the same time conflicts. Use the [macOS / Windows install entry in the README](../README.md); it verifies source and SHA256, backs up first, then migrates to the current profile. **Do not uninstall first, delete DSH_HOME, or clear prompts.**

1. Confirm the target DSH, data directory, and profile. Run the installer's `--dry-run` (Windows `-DryRun`) to check; when paths are not unique, specify explicitly. Do not copy another user's directories as-is.
2. Drop the dry-run flag and run the migration. Other install operations may need to be ended beforehand; stopping chat or auto-restarting DSH is not required.
3. The installer preserves prompts, rules, update preferences, permissions, other plugins, and old package files. Only the Purge bundle and recognized old-package `name` references are switched; configuration values and comments are kept.
4. After success, record the `backup_id`. When the user is free, manually quit and reopen to verify the loaded version; install, applying host patches, and restart are three separate actions, and the latter two are not performed automatically.

### Agents must note

- The official host CLI's install rules are the same, but third-party markets may add directory filtering, duplicate-install protection, source conversion, and load verification. A plugin listed on the market web page does not mean its `index.json` includes it.
- A missing npm publication does not mean there is no install package. The standalone index is <https://kingcharleslzy-ai.github.io/dsh-purge/index.json>, and the Git version pins the full commit SHA. A third-party index omission should be fixed in the generator; npm metadata must not be faked and integrity checks must not be weakened.
- Migration recognizes only the standard entries for `dsh-purge`, redteam, presets, store, and ui. Manual `insert`, unknown IDs, dynamic package names, and broken YAML stay failed with dependencies restored; report the specific entry conflict and do not delete parameters or blindly disable entries to make the error go away.
- `migrated_references` is the count of package references actually rewritten. 0 does not mean failure: when no explicit old-package override exists, no configuration change is needed. After success, also check that the enabled list contains only the community package, the configuration merge has no duplicate IDs, and the user's configuration values are still there.
- Rollback uses `purge-community rollback <backup_id>`, which restores the old package entry and keeps the current configuration values. Concurrent configuration changes, a corrupt migration record, or a failed restore must be reported explicitly with the restore directory kept; the existence of a backup must not be treated as a successful rollback.
- On failure, request only the sanitized market name/version, DSH version, OS, install source, and error codes; do not collect full prompts, keys, configurations, or backups.

## Tests and boundaries

`scripts/check-market-migration-runtime.mjs <official-CLI> <old-tgz> <candidate-tgz>` creates a fresh isolated home and performs a real install, configuration merge, rollback, re-upgrade, and failure recovery, checking private-content sentinels. It does not start the host or run the plugin's apply and is not a full model-behavior test. It must be run on both Mac and Windows.

The migration notice in the third-party dsh-market and the community index generator must be merged and published by its maintainers. Our new standalone installer can be used for the migration in the meantime; it cannot be claimed that updating Purge changes the market's interception logic while Purge is not yet loaded.
