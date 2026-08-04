#!/usr/bin/env node

/**
 * Ejecuta un comando de Expo inyectando primero las variables de un archivo
 * .env concreto, sin depender de NODE_ENV.
 *
 * Uso: node ./scripts/start-with-env.js <archivo-env> [...args de expo]
 * Ej.: node ./scripts/start-with-env.js .env.production start
 *
 * Expo carga sus propios .env por NODE_ENV, pero nunca sobreescribe una
 * variable que ya exista en el entorno del proceso. Por eso esto permite, por
 * ejemplo, levantar un bundle de desarrollo apuntando a la API de producción.
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
// Mismo parser (dotenv + expansión de variables) que usa Expo al cargar sus
// .env, para que este script y `expo start` interpreten el archivo igual.
const { parseEnv } = require("@expo/env");

const [envFileArg, ...expoArgs] = process.argv.slice(2);

if (!envFileArg) {
  console.error(
    "Falta el archivo de entorno.\n" +
      "Uso: node ./scripts/start-with-env.js <archivo-env> [...args de expo]",
  );
  process.exit(1);
}

const envFilePath = path.resolve(process.cwd(), envFileArg);

if (!fs.existsSync(envFilePath)) {
  console.error(`No existe el archivo de entorno: ${envFileArg}`);
  process.exit(1);
}

const vars = parseEnv(fs.readFileSync(envFilePath, "utf8"), process.env);
const keys = Object.keys(vars);

// Sin ninguna EXPO_PUBLIC_* que forzar, Expo caería en .env.development y la
// app arrancaría contra la API equivocada sin que se note. Mejor fallar.
if (!keys.some((key) => key.startsWith("EXPO_PUBLIC_"))) {
  console.error(
    `${envFileArg} no define ninguna variable EXPO_PUBLIC_*, así que no hay ` +
      `nada que forzar y Expo usaría la configuración por defecto. Abortando.`,
  );
  process.exit(1);
}

console.log(`env: forzando ${envFileArg} → ${keys.join(", ")}`);

const isWindows = process.platform === "win32";

const child = spawn(
  isWindows ? "npx.cmd" : "npx",
  ["expo", ...(expoArgs.length ? expoArgs : ["start"])],
  {
    stdio: "inherit",
    env: { ...process.env, ...vars },
  },
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(`No se pudo ejecutar expo: ${error.message}`);
  process.exit(1);
});
