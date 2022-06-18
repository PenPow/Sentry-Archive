// @deno-types="https://denopkg.com/porsager/postgres@e2a8595d7aa8c3c838b83b9bca7b890c1707ad2c/types/index.d.ts"
import { default as postgres } from "https://denopkg.com/porsager/postgres@e2a8595d7aa8c3c838b83b9bca7b890c1707ad2c/deno/lib/index.js";
import { DB_INFO } from "@config";

const DATABASE_USERNAME = DB_INFO.username;
const DATABASE_PASSWORD = DB_INFO.password;
const DATABASE_NAME = DB_INFO.database;
const DATABASE_HOST = DB_INFO.host ?? "localhost";
const DATABASE_PORT = DB_INFO.port ?? "5432";
const DATABASE_MAX = 20;

export const psql = postgres({
  username: DATABASE_USERNAME,
  password: DATABASE_PASSWORD,
  database: DATABASE_NAME,
  host: DATABASE_HOST,
  port: DATABASE_PORT,
  max: DATABASE_MAX,
  /*onnotice: (data) => {
      logger.psql(`${data.severity} ${bgBrightBlack(`[${data.code}| ${data.file}:${data.line}]`)}`, data.message);
    },*/
  types: {
    bigint: postgres.BigInt,
  },
});