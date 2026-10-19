# Golem for VS Code

A sidebar, commands and checks for [golem](https://thinkr-open.github.io/golem/) Shiny applications.

Activates when the workspace contains `DESCRIPTION` and `dev/run_dev.R`.

## What you get

- **App view**: the app as golem sees it — `app`, `dev`, `functions`, `modules`, `R`, `utils`, `www`. A module groups its
  `mod_x.R` and `mod_x_fct_*.R` / `mod_x_utils_*.R`. Files without a test say so. The header shows the package name.
- **Inline actions**: `+` on every group (direct creation, or the Add… picker filtered on `app` / `www`); on a module,
  add a fct / utils; on untested files, add a test. Every `add_*` call uses `with_test = TRUE`. Right-click a tested
  file to open its test.
- **View toolbar**: Run app, Test (`devtools::test()` in the R session), Refresh; and in `…`: Add…, Go to…, Document
  and reload, Check.
- **Status bar**: `▶ pkg version` runs `golem::run_dev()`; its tooltip shows the detected golem version.
- **Palette**: `Golem: Add…` (every `golem::add_*`, app-level helpers such as favicon or README, `use_*_skills`),
  `Golem: Go to…`, `Golem: Test this file` (`devtools::test_active_file()`, also in the editor context menu), plus one
  command per action.
- **Version-aware**: at activation the extension asks the project's R (`Rscript` from the project root, so renv applies)
  which functions golem exports, and only offers those. Works with golem 0.5 and 1.x alike.
- **Diagnostics**: `inputId` without `ns()` in a module UI; `mod_x_ui("id")` without its `mod_x_server("id")` and the reverse.
- **Snippets**: `golem-module`, `moduleServer`, `ns`.

## Companion extensions

- [vscode-R](https://marketplace.visualstudio.com/items?itemName=REditorSupport.r): when installed, R code is sent to
  its terminal. Otherwise a terminal is started with `golem.rPath` (default `R`).
- `vscode-testthat`: shows `tests/testthat` in VS Code's Testing view, with run buttons in the gutter. Separate
  extension, not required.

## Install from GitHub

Not on the marketplace yet. Either build a VSIX:

```
npm install && npm run compile
npx @vscode/vsce package
code --install-extension *.vsix
```

or, to pick up every `npm run compile` without reinstalling, symlink the folder into VS Code's extensions directory and
reload the window:

```
ln -s "$(pwd)" ~/.vscode/extensions/golem
```

## Development

```
npm install
npm run compile   # also regenerates contributes.commands and menu gating from src/catalog.ts
```

Then `F5` to launch an Extension Development Host and open a golem project in it. The launch configuration also loads
`../vscode-testthat` when that folder exists next to this one.
