import knex from 'knex';
require('dotenv').config({
  path: '.env',
});

const db = knex({
  client: 'pg',
  connection: {
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USERNAME,
    port: process.env.DATABASE_PORT,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DB,
    ssl: { rejectUnauthorized: false },
  },
});

export default db;
