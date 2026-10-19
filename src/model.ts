import * as vscode from "vscode";

export interface FileRef {
  name: string;
  uri: vscode.Uri;
  test?: vscode.Uri;
}

export interface Module {
  name: string;
  main: FileRef;
  /** module-scoped fct / utils / class files */
  files: FileRef[];
  test?: vscode.Uri;
}

export interface Model {
  pkg: string;
  version: string;
  app: FileRef[];
  dev: FileRef[];
  fct: FileRef[];
  modules: Module[];
  /** R files that follow no golem convention */
  other: FileRef[];
  utils: FileRef[];
  www?: vscode.Uri;
}

async function listFiles(dir: vscode.Uri): Promise<string[]> {
  try {
    const entries = await vscode.workspace.fs.readDirectory(dir);
    return entries.filter(([, t]) => t === vscode.FileType.File).map(([n]) => n).sort();
  } catch {
    return [];
  }
}

async function exists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}

async function readText(uri: vscode.Uri): Promise<string> {
  try {
    return Buffer.from(await vscode.workspace.fs.readFile(uri)).toString("utf8");
  } catch {
    return "";
  }
}

export async function scanProject(root: vscode.Uri): Promise<Model> {
  const sub = (...p: string[]) => vscode.Uri.joinPath(root, ...p);
  const [rFiles, testFiles, devFiles, desc, hasConfig, hasWww] = await Promise.all([
    listFiles(sub("R")),
    listFiles(sub("tests", "testthat")),
    listFiles(sub("dev")),
    readText(sub("DESCRIPTION")),
    exists(sub("inst", "golem-config.yml")),
    exists(sub("inst", "app", "www")),
  ]);
  const tests = new Set(testFiles);
  const ref = (dir: vscode.Uri, name: string): FileRef => {
    const testName = `test-${name.replace(/\.R$/, "")}.R`;
    return { name, uri: vscode.Uri.joinPath(dir, name), test: tests.has(testName) ? sub("tests", "testthat", testName) : undefined };
  };

  const R = sub("R");
  const r = rFiles.filter((f) => f.endsWith(".R"));
  const modules = new Map<string, Module>();
  for (const f of r) {
    const name = /^mod_(.+)\.R$/.exec(f)?.[1];
    if (name && !/_(fct|utils|class)_/.test(name)) {
      const main = ref(R, f);
      modules.set(name, { name, main, files: [], test: main.test });
    }
  }
  const moduleNames = [...modules.keys()].sort((a, b) => b.length - a.length);
  const model: Model = { pkg: "", version: "", app: [], dev: [], fct: [], modules: [], other: [], utils: [] };
  for (const f of r) {
    if (modules.has(/^mod_(.+)\.R$/.exec(f)?.[1] ?? "")) continue;
    const owner = moduleNames.find((n) => f.startsWith(`mod_${n}_`));
    if (owner) modules.get(owner)!.files.push(ref(R, f));
    else if (f.startsWith("fct_")) model.fct.push(ref(R, f));
    else if (/^(golem_)?utils_/.test(f)) model.utils.push(ref(R, f));
    else if (/^(app_|run_app\.R$)/.test(f)) model.app.push(ref(R, f));
    else if (f !== "_disable_autoload.R") model.other.push(ref(R, f));
  }
  if (hasConfig) model.app.push({ name: "golem-config.yml", uri: sub("inst", "golem-config.yml") });
  model.dev = devFiles.filter((f) => f.endsWith(".R")).map((f) => ({ name: f, uri: sub("dev", f) }));
  model.modules = [...modules.values()].sort((a, b) => a.name.localeCompare(b.name));
  model.pkg = /^Package:\s*(\S+)/m.exec(desc)?.[1] ?? "";
  model.version = /^Version:\s*(\S+)/m.exec(desc)?.[1] ?? "";
  if (hasWww) model.www = sub("inst", "app", "www");
  return model;
}
