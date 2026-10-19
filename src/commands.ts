import * as vscode from "vscode";
import { sendR } from "./r";
import { ACTIONS, Action, Group, golemFn } from "./catalog";
import { Model } from "./model";
import { Node, nodeTest } from "./tree";

interface Deps {
  root: vscode.Uri;
  getModel: () => Model | undefined;
  /** exports of the installed golem; undefined when unknown */
  getExports: () => Set<string> | undefined;
}

async function askName(prompt: string): Promise<string | undefined> {
  return vscode.window.showInputBox({
    prompt,
    validateInput: (v) => (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(v) ? null : "Letters, digits and _ only"),
  });
}

async function openWhenCreated(root: vscode.Uri, relPath: string): Promise<void> {
  const uri = vscode.Uri.joinPath(root, relPath);
  for (let i = 0; i < 20; i++) {
    try {
      await vscode.workspace.fs.stat(uri);
      await vscode.window.showTextDocument(uri);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
}

async function runAction(a: Action, root: vscode.Uri): Promise<void> {
  let name = "";
  if (a.name) {
    const n = await askName(`${a.label}: name`);
    if (!n) return;
    name = n;
  }
  await sendR(a.r.replace("{name}", name));
  if (a.file) await openWhenCreated(root, a.file.replace("{name}", name));
}

interface AddItem extends vscode.QuickPickItem {
  action?: Action;
}

async function pickAdd(deps: Deps, only?: Group): Promise<void> {
  const items: AddItem[] = [];
  let group = "";
  const exports = deps.getExports();
  const available = (a: Action) => !exports || !golemFn(a) || exports.has(golemFn(a)!);
  for (const a of ACTIONS.filter((a) => a.group !== "run" && (!only || a.group === only) && available(a))) {
    if (a.group !== group) {
      group = a.group;
      items.push({ label: group, kind: vscode.QuickPickItemKind.Separator });
    }
    items.push({ label: a.label, description: /golem::\w+/.exec(a.r)?.[0], action: a });
  }
  const pick = await vscode.window.showQuickPick(items, { placeHolder: "Add to the app", matchOnDescription: true });
  if (pick?.action) await runAction(pick.action, deps.root);
}

interface GoItem extends vscode.QuickPickItem {
  uri: vscode.Uri;
}

async function pickGoTo(m: Model): Promise<void> {
  const items: GoItem[] = [];
  const add = (icon: string, uris: { name: string; uri: vscode.Uri }[], description?: string) =>
    uris.forEach((f) => items.push({ label: `$(${icon}) ${f.name}`, description, uri: f.uri }));
  add("tools", m.dev, "dev");
  add("home", m.app, "app");
  for (const mod of m.modules) add("symbol-namespace", [mod.main, ...mod.files], `module ${mod.name}`);
  add("symbol-method", m.fct, "fct");
  add("symbol-misc", m.utils, "utils");
  add("symbol-file", m.other);
  const pick = await vscode.window.showQuickPick(items, { placeHolder: "Go to file", matchOnDescription: true });
  if (pick) await vscode.window.showTextDocument(pick.uri);
}

async function addToModule(n: Node, kind: "fct" | "utils", root: vscode.Uri): Promise<void> {
  if (n?.kind !== "module") return;
  const name = await askName(`${kind} name for module ${n.module.name}`);
  if (!name) return;
  await sendR(`golem::add_${kind}("${name}", module = "${n.module.name}", with_test = TRUE, open = FALSE)`);
  await openWhenCreated(root, `R/mod_${n.module.name}_${kind}_${name}.R`);
}

async function addTest(n: Node, root: vscode.Uri): Promise<void> {
  if (n?.kind === "module") {
    await sendR(`golem::use_module_test("${n.module.name}", open = FALSE)`);
    await openWhenCreated(root, `tests/testthat/test-mod_${n.module.name}.R`);
  } else if (n?.kind === "file") {
    const base = n.ref.name.replace(/\.R$/, "");
    await sendR(`usethis::use_test("${base}", open = FALSE)`);
    await openWhenCreated(root, `tests/testthat/test-${base}.R`);
  }
}

async function testFile(arg?: vscode.Uri): Promise<void> {
  const uri = arg instanceof vscode.Uri ? arg : vscode.window.activeTextEditor?.document.uri;
  if (uri) await sendR(`devtools::test_active_file(${JSON.stringify(uri.fsPath)})`);
}

export function registerCommands(ctx: vscode.ExtensionContext, deps: Deps): void {
  const reg = (id: string, cb: (...args: any[]) => unknown) =>
    ctx.subscriptions.push(vscode.commands.registerCommand(`golem.${id}`, cb));

  for (const a of ACTIONS) reg(a.id, () => runAction(a, deps.root));
  reg("add", (n?: Node) => pickAdd(deps, n?.kind === "dir" ? "web" : n?.kind === "group" && n.label === "app" ? "app" : undefined));
  reg("goTo", () => {
    const m = deps.getModel();
    if (m) return pickGoTo(m);
  });
  reg("addFctToModule", (n: Node) => addToModule(n, "fct", deps.root));
  reg("addUtilsToModule", (n: Node) => addToModule(n, "utils", deps.root));
  reg("addTest", (n: Node) => addTest(n, deps.root));
  reg("testFile", (arg?: vscode.Uri) => testFile(arg));
  reg("openTest", (n: Node) => {
    const t = nodeTest(n);
    if (t) return vscode.window.showTextDocument(t);
  });
}

