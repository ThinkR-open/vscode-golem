import { execFile } from "child_process";

export interface GolemInfo {
  version: string;
  exports: Set<string>;
}

/** Queries the golem installed for the project (renv-aware since Rscript runs from the project root). */
export function detectGolem(cwd: string): Promise<GolemInfo | undefined> {
  const code = 'cat(as.character(utils::packageVersion("golem")), getNamespaceExports("golem"), sep = "\\n")';
  return new Promise((resolve) => {
    execFile("Rscript", ["-e", code], { cwd, timeout: 30000 }, (err, stdout) => {
      if (err) return resolve(undefined);
      const lines = stdout.split(/\r?\n/);
      const version = lines.find((l) => /^\d+\.\d+/.test(l)) ?? "";
      resolve({ version, exports: new Set(lines.filter((l) => /^\w+$/.test(l))) });
    });
  });
}
