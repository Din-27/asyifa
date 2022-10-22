import argon2 from "@node-rs/argon2";
import { cpus } from "os";

const [password] = process.argv.slice(2);

if (!password) {
  console.error("Usage: node hashPassword.js <password>");
  process.exit(1);
}

const CORES = cpus().length;

argon2
  .hash(password, { algorithm: argon2.Algorithm.Argon2i, parallelism: CORES })
  .then(console.log);
