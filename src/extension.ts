import * as vscode from "vscode";
import { registerCommands } from "./commands";
import { GolemTree } from "./tree";
import { Model, scanProject } from "./model";
import { lint } from "./diagnostics";
import { detectGolem } from "./golem";
import { ACTIONS, golemFn } from "./catalog";

export async function activate(ctx: vscode.ExtensionContext): Promise<void> {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri;
  if (!root) return;
  try {
    await vscode.workspace.fs.stat(vscode.Uri.joinPath(root, "DESCRIPTION"));
  } catch {
    return;
  }
  vscode.commands.executeCommand("setContext", "golem.active", true);

  const tree = new GolemTree();
  const view = vscode.window.createTreeView("golemTree", { treeDataProvider: tree });
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  status.command = "golem.runApp";
  status.tooltip = "golem::run_dev()";
  let model: Model | undefined;
  let exports: Set<string> | undefined;
  const refresh = async () => {
    model = await scanProject(root);
    tree.setModel(model);
    view.title = model.pkg;
    status.text = `$(play) ${model.pkg} ${model.version}`;
    status.show();
  };

  ctx.subscriptions.push(view, status);
  registerCommands(ctx, { root, getModel: () => model, getExports: () => exports });

  // Only offer the add_* actions the installed golem actually exports.
  detectGolem(root.fsPath).then((info) => {
    exports = info?.exports;
    for (const fn of new Set(ACTIONS.map(golemFn))) {
      if (fn) vscode.commands.executeCommand("setContext", `golem.has.${fn}`, !exports || exports.has(fn));
    }
    if (info) status.tooltip = `golem::run_dev()  ·  golem ${info.version}`;
  });
  ctx.subscriptions.push(vscode.commands.registerCommand("golem.refresh", refresh));

  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(root, "{DESCRIPTION,R/**,dev/**,tests/testthat/**,inst/app/www/**}")
  );
  watcher.onDidCreate(refresh);
  watcher.onDidDelete(refresh);
  watcher.onDidChange((uri) => uri.fsPath.endsWith("DESCRIPTION") && refresh());
  ctx.subscriptions.push(watcher);

  const coll = vscode.languages.createDiagnosticCollection("golem");
  ctx.subscriptions.push(
    coll,
    vscode.workspace.onDidOpenTextDocument((d) => lint(d, coll)),
    vscode.workspace.onDidChangeTextDocument((e) => lint(e.document, coll)),
    vscode.workspace.onDidCloseTextDocument((d) => coll.delete(d.uri))
  );
  vscode.workspace.textDocuments.forEach((d) => lint(d, coll));

  await refresh();
}

export function deactivate(): void {}
