import EmbeddedPostgres from 'embedded-postgres';

const pg = new EmbeddedPostgres({
  databaseDir: './pgdata',
  user: 'catchq',
  password: 'catchq',
  port: 5433,
  persistent: true,
});

try {
  await pg.initialise();
} catch (e) {
  if (!/already exists/i.test(String(e))) throw e;
}
await pg.start();
try {
  await pg.createDatabase('catchq');
} catch (e) {
  if (!/already exists/i.test(String(e))) console.error(e);
}
console.log('PG_READY on localhost:5433 db=catchq user=catchq');

setInterval(() => {}, 1 << 30);
