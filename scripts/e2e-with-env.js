#!/usr/bin/env node

/**
 * Inyecta E2E_TEST_EMAIL / E2E_TEST_PASSWORD desde .env como -e EMAIL=...
 * -e PASSWORD=... y ejecuta `maestro test`, porque Maestro no lee archivos
 * .env por su cuenta.
 *
 * Uso: node ./scripts/e2e-with-env.js [flow-o-carpeta]
 * Sin argumentos corre toda la carpeta .maestro/.
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { parseEnv } = require("@expo/env");

const envFilePath = path.resolve(process.cwd(), ".env");

if (!fs.existsSync(envFilePath)) {
  console.error(
    "No existe .env. Copiá .env.example a .env y completá las credenciales " +
      "de la cuenta de prueba (E2E_TEST_EMAIL / E2E_TEST_PASSWORD).",
  );
  process.exit(1);
}

const vars = parseEnv(fs.readFileSync(envFilePath, "utf8"), process.env);
const email = vars.E2E_TEST_EMAIL;
const password = vars.E2E_TEST_PASSWORD;

if (!email || !password) {
  console.error(
    "Faltan E2E_TEST_EMAIL y/o E2E_TEST_PASSWORD en .env. Completalas con " +
      "las credenciales de la cuenta de prueba antes de correr los E2E.",
  );
  process.exit(1);
}

const target = process.argv[2] || ".maestro/";

const result = spawnSync(
  "maestro",
  ["test", target, "-e", `EMAIL=${email}`, "-e", `PASSWORD=${password}`],
  { stdio: "inherit" },
);

if (result.error) {
  console.error(`No se pudo ejecutar maestro: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
