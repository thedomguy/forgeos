// Minimal forward-only migration runner. Runs every migrations/*.sql not yet applied,
// in filename order, each in its own transaction, tracked in _migrations.
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { pool } from './db';

async function main() {
  await pool.query(`create table if not exists _migrations (
    name text primary key, applied_at timestamptz not null default now())`);
  const applied = new Set(
    (await pool.query('select name from _migrations')).rows.map((r) => r.name),
  );
  const dir = join(__dirname, '..', 'migrations');
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(dir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('insert into _migrations(name) values ($1)', [file]);
      await client.query('COMMIT');
      console.log(`applied ${file}`);
    } catch (e) {
      await client.query('ROLLBACK');
      console.error(`failed ${file}`, e);
      throw e;
    } finally {
      client.release();
    }
  }
  console.log('migrations up to date');
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
