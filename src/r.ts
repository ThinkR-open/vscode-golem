import * as vscode from "vscode";

const NAME = "R (golem)";

/** Sends R code to the vscode-R terminal when the extension is installed, else to our own R terminal. */
export async function sendR(code: string): Promise<void> {
  const ext = vscode.extensions.getExtension("REditorSupport.r");
  if (ext) {
    if (!ext.isActive) await ext.activate();
    await vscode.commands.executeCommand("r.runCommand", code);
    return;
  }
  let term = vscode.window.terminals.find((t) => t.name === NAME);
  if (!term) {
    term = vscode.window.createTerminal({ name: NAME, cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath });
    term.sendText(vscode.workspace.getConfiguration("golem").get<string>("rPath", "R"));
  }
  term.show(true);
  term.sendText(code);
}
