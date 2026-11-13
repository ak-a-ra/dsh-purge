# cwd template compatibility fix

This fix has been folded into Purge Community `1.2.0`; the original local compatibility package was `1.1.71-compat.cwd.1`. This version only fixes the missing-variable error in prompt rendering; it does not extend or re-apply host patches.

Related to upstream issue #114 and PR #115 (the original upstream repository is no longer accessible; the numbers are kept for historical record only). Local DSH 0.2.1-rc.1 also registers only provider/model; injecting `Your working directory is {{cwd}}.` errors before the request is sent.

- The configuration template's personaSuffix is left empty, so the config layer does not demand a variable that does not exist.
- At runtime, the dynamic suffix or static fallback is chosen based on whether cwd exists in assembled.variables and is not undefined.
- User prompt files are not modified, non-default custom suffixes are not overwritten, and the host assembly is not altered in place; repeated handling is idempotent.
- The model interface, other identity/rules logic, existing settings, and the standalone UI plugin are unchanged.

Regression tests run against the target DSH's real system-prompt module:

```sh
node test/cwd-compat.mjs /absolute/path/to/dsh-system-prompt/lib/index.js
```

The tests cover missing, undefined, a valid path, and an empty string; each is tested again with no suffix, an old cwd suffix, and a custom suffix — 12 scenarios in total. Passing the rendering tests does not verify the compatibility of all Purge patches with the new DSH; native conversation acceptance must be checked separately after reloading the plugin.
