// Single source of truth for actions: commands (package.json is generated from it),
// the "Add…" quick pick and the view menus.
export type Group = "run" | "app" | "R" | "dev" | "web" | "deploy" | "agents";

export interface Action {
  id: string;
  label: string;
  group: Group;
  /** R code to send; {name} is replaced by the name asked from the user */
  r: string;
  name?: boolean;
  /** file to open once created, relative to the project root */
  file?: string;
  icon: string;
}

export const ACTIONS: Action[] = [
  { id: "runApp", label: "Run app", group: "run", r: "golem::run_dev()", icon: "play" },
  { id: "test", label: "Test", group: "run", r: "devtools::test()", icon: "beaker" },
  { id: "check", label: "Check", group: "run", r: "devtools::check()", icon: "checklist" },
  { id: "document", label: "Document and reload", group: "run", r: "golem::document_and_reload()", icon: "book" },

  { id: "addFavicon", label: "Favicon", group: "app", r: "golem::use_favicon()", file: "inst/app/www/favicon.ico", icon: "add" },
  { id: "addUiServerFiles", label: "ui.R / server.R files", group: "app", r: "golem::add_ui_server_files()", file: "inst/app/ui.R", icon: "add" },
  { id: "addRecommendedTests", label: "Recommended tests", group: "app", r: "golem::use_recommended_tests()", file: "tests/testthat/test-golem-recommended.R", icon: "add" },
  { id: "addReadme", label: "README.Rmd", group: "app", r: "golem::use_readme_rmd(open = FALSE)", file: "README.Rmd", icon: "add" },

  { id: "addModule", label: "Module", group: "R", r: 'golem::add_module("{name}", with_test = TRUE, open = FALSE)', name: true, file: "R/mod_{name}.R", icon: "add" },
  { id: "addFct", label: "Function (fct)", group: "R", r: 'golem::add_fct("{name}", with_test = TRUE, open = FALSE)', name: true, file: "R/fct_{name}.R", icon: "add" },
  { id: "addUtils", label: "Utils", group: "R", r: 'golem::add_utils("{name}", with_test = TRUE, open = FALSE)', name: true, file: "R/utils_{name}.R", icon: "add" },
  { id: "addEmptyFile", label: "R file (empty)", group: "R", r: 'golem::add_empty_file("{name}.R", dir = "R", open = FALSE)', name: true, file: "R/{name}.R", icon: "add" },
  { id: "addR6", label: "R6 class", group: "R", r: 'golem::add_r6("{name}", with_test = TRUE, open = FALSE)', name: true, file: "R/class_{name}.R", icon: "add" },

  { id: "addDevScript", label: "Dev script", group: "dev", r: 'golem::add_empty_file("{name}.R", dir = "dev", open = FALSE)', name: true, file: "dev/{name}.R", icon: "add" },

  { id: "addJs", label: "JS file", group: "web", r: 'golem::add_js_file("{name}", open = FALSE)', name: true, file: "inst/app/www/{name}.js", icon: "file-code" },
  { id: "addJsHandler", label: "JS handler", group: "web", r: 'golem::add_js_handler("{name}", open = FALSE)', name: true, file: "inst/app/www/{name}.js", icon: "zap" },
  { id: "addJsInputBinding", label: "JS input binding", group: "web", r: 'golem::add_js_input_binding("{name}", open = FALSE)', name: true, file: "inst/app/www/{name}-input.js", icon: "arrow-right" },
  { id: "addJsOutputBinding", label: "JS output binding", group: "web", r: 'golem::add_js_output_binding("{name}", open = FALSE)', name: true, file: "inst/app/www/{name}-output.js", icon: "arrow-left" },
  { id: "addCss", label: "CSS file", group: "web", r: 'golem::add_css_file("{name}", open = FALSE)', name: true, file: "inst/app/www/{name}.css", icon: "paintcan" },
  { id: "addSass", label: "Sass file", group: "web", r: 'golem::add_sass_file("{name}", open = FALSE)', name: true, file: "inst/app/www/{name}.sass", icon: "paintcan" },
  { id: "addHtmlTemplate", label: "HTML template", group: "web", r: 'golem::add_html_template("{name}", open = FALSE)', name: true, file: "inst/app/www/{name}.html", icon: "file" },
  { id: "addPartialHtmlTemplate", label: "Partial HTML template", group: "web", r: 'golem::add_partial_html_template("{name}", open = FALSE)', name: true, file: "inst/app/www/{name}.html", icon: "file-submodule" },

  { id: "addDockerfile", label: "Dockerfile (renv)", group: "deploy", r: "golem::add_dockerfile_with_renv(open = FALSE)", file: "deploy/Dockerfile", icon: "package" },
  { id: "addDockerfileShinyproxy", label: "Dockerfile ShinyProxy (renv)", group: "deploy", r: "golem::add_dockerfile_with_renv_shinyproxy(open = FALSE)", file: "deploy/Dockerfile", icon: "package" },
  { id: "addDockerfileHeroku", label: "Dockerfile Heroku (renv)", group: "deploy", r: "golem::add_dockerfile_with_renv_heroku(open = FALSE)", file: "deploy/Dockerfile", icon: "package" },
  { id: "addPositConnect", label: "Posit Connect file", group: "deploy", r: "golem::add_positconnect_file(open = FALSE)", file: "app.R", icon: "cloud-upload" },
  { id: "addRstudioConnect", label: "RStudio Connect file", group: "deploy", r: "golem::add_rstudioconnect_file(open = FALSE)", file: "app.R", icon: "cloud-upload" },
  { id: "addShinyappsio", label: "shinyapps.io file", group: "deploy", r: "golem::add_shinyappsio_file(open = FALSE)", file: "app.R", icon: "cloud-upload" },
  { id: "addShinyServer", label: "Shiny Server file", group: "deploy", r: "golem::add_shinyserver_file(open = FALSE)", file: "app.R", icon: "server" },
  { id: "addRscignore", label: ".rscignore", group: "deploy", r: "golem::add_rscignore_file(open = FALSE)", file: ".rscignore", icon: "eye-closed" },
  { id: "addGithubAction", label: "GitHub Action (deploy)", group: "deploy", r: "golem::add_github_action(open = FALSE)", icon: "github" },
  { id: "addGitlabCi", label: "GitLab CI (deploy)", group: "deploy", r: "golem::add_gitlab_ci(open = FALSE)", file: ".gitlab-ci.yml", icon: "git-merge" },

  { id: "addClaudeSkills", label: "Claude skills", group: "agents", r: "golem::use_claude_skills()", icon: "sparkle" },
  { id: "addAgentSkills", label: "Agent skills (AGENTS.md)", group: "agents", r: "golem::use_agent_skills()", icon: "sparkle" },
];

/** golem function behind an action, if any */
export const golemFn = (a: Action): string | undefined => /golem::(\w+)/.exec(a.r)?.[1];

/** commands that are not plain R calls */
export const META = [
  { id: "add", label: "Add…", icon: "add" },
  { id: "goTo", label: "Go to…", icon: "go-to-file" },
  { id: "refresh", label: "Refresh", icon: "refresh" },
  { id: "testFile", label: "Test this file", icon: "beaker" },
  { id: "addTest", label: "Add test", icon: "new-file" },
  { id: "openTest", label: "Open test", icon: "go-to-file" },
  { id: "addFctToModule", label: "Add fct to module", icon: "symbol-method" },
  { id: "addUtilsToModule", label: "Add utils to module", icon: "symbol-misc" },
];
