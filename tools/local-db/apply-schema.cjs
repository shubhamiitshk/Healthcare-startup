const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run(client, file) {
  const sql = fs.readFileSync(file, 'utf8');
  await client.query(sql);
  console.log('APPLIED:', path.basename(file));
}

(async () => {
  const client = new Client({
    host: '127.0.0.1',
    port: 5433,
    user: 'catchq',
    password: 'catchq',
    database: 'catchq',
  });
  await client.connect();

  await run(client, path.join(__dirname, '../../schema.sql'));
  try {
    await run(client, path.join(__dirname, '../../bed-management-schema.sql'));
  } catch (e) {
    if (/already exists/i.test(e.message)) console.log('bed schema already applied');
    else throw e;
  }

  const tables = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`,
  );
  console.log('TABLES:', tables.rows.map((r) => r.table_name).join(', '));
  await client.end();
})().catch((e) => {
  console.error('SCHEMA FAILED:', e.message);
  process.exit(1);
});
