import * as vscode from "vscode";
import { Model, Module, FileRef } from "./model";

export type Node =
  | { kind: "group"; label: string; children: Node[] }
  | { kind: "module"; module: Module }
  | { kind: "file"; ref: FileRef; testable: boolean }
  | { kind: "dir"; label: string; uri: vscode.Uri; icon?: string };

const GROUP_ICONS: Record<string, string> = {
  app: "home", dev: "tools", functions: "symbol-method", modules: "symbol-namespace", R: "symbol-file", utils: "symbol-misc",
};

export function nodeTest(n: Node): vscode.Uri | undefined {
  return n.kind === "module" ? n.module.test : n.kind === "file" ? n.ref.test : undefined;
}

function fileItem(uri: vscode.Uri, label: string): vscode.TreeItem {
  const item = new vscode.TreeItem(label);
  item.resourceUri = uri;
  item.command = { command: "vscode.open", title: "Open", arguments: [uri] };
  return item;
}

export class GolemTree implements vscode.TreeDataProvider<Node> {
  private emitter = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.emitter.event;
  private model?: Model;

  setModel(model: Model): void {
    this.model = model;
    this.emitter.fire();
  }

  getTreeItem(n: Node): vscode.TreeItem {
    const { Collapsed } = vscode.TreeItemCollapsibleState;
    switch (n.kind) {
      case "group": {
        const item = new vscode.TreeItem(n.label, Collapsed);
        item.iconPath = new vscode.ThemeIcon(GROUP_ICONS[n.label]);
        item.contextValue = `group-${n.label}`;
        return item;
      }
      case "dir": {
        const item = new vscode.TreeItem(n.label, Collapsed);
        if (n.icon) {
          item.iconPath = new vscode.ThemeIcon(n.icon);
          item.contextValue = `group-${n.label}`;
        } else item.resourceUri = n.uri;
        return item;
      }
      case "module": {
        const item = new vscode.TreeItem(n.module.name, Collapsed);
        item.iconPath = new vscode.ThemeIcon("symbol-namespace");
        item.contextValue = n.module.test ? "module-tested" : "module-untested";
        if (!n.module.test) item.description = "no test";
        item.tooltip = n.module.main.name;
        return item;
      }
      case "file": {
        const item = fileItem(n.ref.uri, n.ref.name);
        item.contextValue = n.testable ? (n.ref.test ? "file-tested" : "file-untested") : "file";
        if (n.testable && !n.ref.test) item.description = "no test";
        return item;
      }
    }
  }

  async getChildren(n?: Node): Promise<Node[]> {
    const m = this.model;
    if (!m) return [];
    if (!n) return this.roots(m);
    switch (n.kind) {
      case "group":
        return n.children;
      case "module":
        return [
          { kind: "file", ref: n.module.main, testable: false },
          ...n.module.files.map((ref): Node => ({ kind: "file", ref, testable: true })),
        ];
      case "dir": {
        let entries: [string, vscode.FileType][] = [];
        try {
          entries = await vscode.workspace.fs.readDirectory(n.uri);
        } catch {
          return [];
        }
        return entries
          .sort(([a, ta], [b, tb]) => (ta === tb ? a.localeCompare(b) : ta === vscode.FileType.Directory ? -1 : 1))
          .map(([name, type]): Node => {
            const uri = vscode.Uri.joinPath(n.uri, name);
            return type === vscode.FileType.Directory ? { kind: "dir", label: name, uri } : { kind: "file", ref: { name, uri }, testable: false };
          });
      }
      default:
        return [];
    }
  }

  private roots(m: Model): Node[] {
    const files = (refs: FileRef[], testable: boolean): Node[] => refs.map((ref) => ({ kind: "file", ref, testable }));
    const group = (label: string, children: Node[]): Node[] => (children.length ? [{ kind: "group", label, children }] : []);
    return [
      ...group("app", files(m.app, false)),
      ...group("dev", files(m.dev, false)),
      ...group("functions", files(m.fct, true)),
      ...group("modules", m.modules.map((module): Node => ({ kind: "module", module }))),
      ...group("R", files(m.other, true)),
      ...group("utils", files(m.utils, true)),
      ...(m.www ? [{ kind: "dir", label: "www", uri: m.www, icon: "globe" } as Node] : []),
    ];
  }
}
