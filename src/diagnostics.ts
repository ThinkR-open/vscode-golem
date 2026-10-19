import * as vscode from "vscode";
import * as path from "path";

// --- 1. inputId / outputId not wrapped in ns() inside a module UI --------------------------------
const ID_ARG = /\b(?:inputId|outputId|id)\s*=\s*"([^"]+)"/g;
const BARE_ID = /\b(\w+)\(\s*"([^"]+)"/g;
const ID_FUNS = new Set([
  "textInput", "numericInput", "selectInput", "actionButton", "checkboxInput", "sliderInput",
  "textOutput", "plotOutput", "tableOutput", "uiOutput", "htmlOutput", "verbatimTextOutput",
  "dateInput", "dateRangeInput", "fileInput", "passwordInput", "radioButtons", "checkboxGroupInput",
  "textAreaInput", "selectizeInput", "downloadButton", "actionLink", "dataTableOutput", "DTOutput",
]);

function missingNs(text: string): [number, number, string][] {
  const start = text.search(/mod_\w+_ui\s*<-\s*function/);
  if (start < 0) return [];
  const rel = text.slice(start).search(/\nmod_\w+_server\s*<-/);
  const ui = text.slice(start, rel < 0 ? text.length : start + rel);
  const out: [number, number, string][] = [];
  for (const m of ui.matchAll(ID_ARG)) out.push([start + m.index!, m[0].length, `"${m[1]}" is not wrapped in ns()`]);
  for (const m of ui.matchAll(BARE_ID)) {
    if (ID_FUNS.has(m[1])) out.push([start + m.index!, m[0].length, `"${m[2]}" is not wrapped in ns()`]);
  }
  return out;
}

// --- 2. mod_x_ui("id") without its mod_x_server("id"), and the reverse -------------------------
const UI_CALL = /\bmod_(\w+?)_ui\(\s*(?:id\s*=\s*)?(?:ns\(\s*)?"([^"]+)"/g;
const SERVER_CALL = /\bmod_(\w+?)_server\(\s*(?:id\s*=\s*)?"([^"]+)"/g;

interface Call { key: string; index: number; len: number; name: string; id: string }

function calls(text: string, re: RegExp): Call[] {
  return [...text.matchAll(re)].map((m) => ({ key: `${m[1]}|${m[2]}`, index: m.index!, len: m[0].length, name: m[1], id: m[2] }));
}

async function textOf(uri: vscode.Uri): Promise<string> {
  const open = vscode.workspace.textDocuments.find((d) => d.uri.fsPath === uri.fsPath);
  if (open) return open.getText();
  try {
    return Buffer.from(await vscode.workspace.fs.readFile(uri)).toString("utf8");
  } catch {
    return "";
  }
}

async function unpaired(doc: vscode.TextDocument): Promise<[number, number, string][]> {
  const base = path.basename(doc.fileName);
  const text = doc.getText();
  const sibling = (name: string) => vscode.Uri.joinPath(doc.uri, "..", name);
  const out: [number, number, string][] = [];
  const report = (missing: Call[], what: "ui" | "server", where: string) =>
    missing.forEach((c) => out.push([c.index, c.len, `mod_${c.name}_${what}("${c.id}") is not called in ${where}`]));

  if (base === "app_ui.R") {
    const server = new Set(calls(await textOf(sibling("app_server.R")), SERVER_CALL).map((c) => c.key));
    report(calls(text, UI_CALL).filter((c) => !server.has(c.key)), "server", "app_server.R");
  } else if (base === "app_server.R") {
    const ui = new Set(calls(await textOf(sibling("app_ui.R")), UI_CALL).map((c) => c.key));
    report(calls(text, SERVER_CALL).filter((c) => !ui.has(c.key)), "ui", "app_ui.R");
  } else if (/^mod_.*\.R$/.test(base)) {
    const ui = calls(text, UI_CALL);
    const server = calls(text, SERVER_CALL);
    const uiKeys = new Set(ui.map((c) => c.key));
    const serverKeys = new Set(server.map((c) => c.key));
    report(ui.filter((c) => !serverKeys.has(c.key)), "server", "this module");
    report(server.filter((c) => !uiKeys.has(c.key)), "ui", "this module");
  }
  return out;
}

export async function lint(doc: vscode.TextDocument, coll: vscode.DiagnosticCollection): Promise<void> {
  if (doc.languageId !== "r") return;
  const found = [...missingNs(doc.getText()), ...(await unpaired(doc))];
  coll.set(
    doc.uri,
    found.map(([offset, len, message]) => {
      const range = new vscode.Range(doc.positionAt(offset), doc.positionAt(offset + len));
      return new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Warning);
    })
  );
}
