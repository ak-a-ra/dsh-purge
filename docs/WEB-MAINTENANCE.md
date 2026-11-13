# Web / Headless maintenance targeting (issue #3)

This fix is limited to instance identification in the maintenance UI, CLI, and read-only self-checks. It does not change permission selections, the patch table, prompts, or the existing cleanup strategy.

## Backup list and operation results

- The list is read when the maintenance panel is entered or re-mounted; it can be refreshed manually.
- Reading, read-failed, and no-backups-yet are displayed separately; a failure is not disguised as an empty list.
- Rollback targets are not auto-selected; when the selected backup no longer exists, the selection is cleared.
- After an update, rollback, or backup fails, only the list is re-read; write operations are not retried automatically. A restore snapshot produced during the failed run is still visible.
- HTTP 200 does not mean the operation succeeded: the JSON's `ok:false`, error arrays, and partial success all display the real result.
- A successful update shows the version and a restart notice; what needs restarting is the server-side DSH process — merely refreshing the browser does not reload the backend. The plugin does not stop or restart the service on the user's behalf.

## Current profile

Maintenance, backups, and the permission self-check share one resolver and use information in this order:

1. The profile / `PURGE_PROFILE_DIR` explicitly specified by the caller.
2. The current `DSH_HOME/profiles/<name>` directory in the host's startup arguments.
3. `--profile <name>` or `--profile=<name>`.
4. `DSH_PROFILE`.
5. The single initialized profile (a directory with a package.json).

When multiple profiles exist and there is no clear signal, error out directly; desktop is not chosen by default. An explicitly specified directory that does not exist, or a startup argument that conflicts with DSH_HOME, does not silently switch to another directory.

For example, when the service actually uses the web profile, set `DSH_PROFILE=web` in **that service's startup environment**; use `PURGE_PROFILE_DIR` for a custom directory. These variables only describe the current target; they do not set sandbox or approval permissions.

## Installing the CLI

An explicit `PURGE_DSH_CLI` still takes priority and can point at the executable launcher the current service uses or at an npm CLI's `.js/.mjs/.cjs` file.

When not specified, the installer locates the CLI only within the current startup path / target host: an npm deployment reads the `bin.dsh` declared in `@deepseek-ai/dsh`'s package.json; Desktop uses that instance's own Resources. A CLI is never guessed from PATH, another global npm install, or a different desktop application.

Child processes run the JS CLI with the current service's Node and pass the current `DSH_HOME` and the selected profile. When running `purge-community` standalone, if the target cannot be determined from the startup information, set `DSH_BASE` or `PURGE_DSH_CLI` explicitly; do not let it guess at a different install.

## Web and Desktop coexistence

The read-only self-check's "host runtime mode" targets the host path currently being checked:

- Web: the desktop app.asar check is "not applicable," the applied count and total are both 0, and this does not count as a layout failure.
- Desktop: only that target's own app.asar is checked; other desktop installs are not scanned.
- The target is unclear or unreadable: report that it cannot be determined, not treated as success.

Permission items still read only the actual profile. If the user deliberately chose permissions that require approval, the original configuration and real state are kept; nothing is auto-adjusted just to make the self-check fully green.

## Verification scope

Regressions cover React panel mount / re-entry, business failure, partial update, snapshot after failure, current/conflicting profiles, npm CLI child-process arguments, Web/Desktop coexistence, and unknown states.

The CLI execution tests use a controlled npm CLI test entry inside a temporary directory, not installed into the user's DSH, and no full end-to-end acceptance of a real Linux Web service or of all patches is claimed.
