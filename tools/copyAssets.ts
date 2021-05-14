import * as shell from "shelljs";

// Copy all the view templates and assets in the public folder
shell.cp("-R", ["src/views", "src/public", "src/crt"], "dist/");
// copy .env file in dist folder
shell.cp([".env"], "dist/.env");
// create log directory
shell.mkdir("logs");
// Remove unnecessary files
shell.rm(["dist/public/js/*.ts", "dist/public/js/*.json"]);
