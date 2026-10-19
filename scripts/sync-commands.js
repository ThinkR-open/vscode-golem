// Regenerates contributes.commands in package.json from the compiled catalog.
const fs = require("fs");
const { ACTIONS, META } = require("../out/catalog.js");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
pkg.contributes.commands = [
  ...ACTIONS.map((a) => ({ command: `golem.${a.id}`, title: `Golem: ${a.group === "run" ? "" : "Add "}${a.label}`, icon: `$(${a.icon})` })),
  ...META.map((m) => ({ command: `golem.${m.id}`, title: `Golem: ${m.label}`, icon: `$(${m.icon})` })),
];

// Gate every menu entry and palette item on the golem function it needs (context keys set by the extension).
const fnOf = Object.fromEntries(ACTIONS.map((a) => [`golem.${a.id}`, (/golem::(\w+)/.exec(a.r) || [])[1]]));
const gate = (cmd) => (fnOf[cmd] ? `golem.has.${fnOf[cmd]}` : "golem.active");
for (const key of ["view/title", "view/item/context", "editor/context"]) {
  for (const m of pkg.contributes.menus[key]) {
    m.when = m.when.replace(/ && golem\.(has\.\w+|active)$/, "") + " && " + gate(m.command);
  }
}
const hidden = pkg.contributes.menus.commandPalette.filter((m) => m.when === "false");
pkg.contributes.menus.commandPalette = [
  ...hidden,
  ...pkg.contributes.commands.filter((c) => !hidden.some((h) => h.command === c.command)).map((c) => ({ command: c.command, when: gate(c.command) })),
];
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
