// Idempotently provision a login. Usage:
//   npx tsx src/ensure-user.ts <identifier> <password> [name]
//
// The `email` column doubles as the login identifier, so a plain username works
// (the login route accepts non-email identifiers — see routes/auth.ts). Re-running
// with a different password resets it rather than erroring, which makes this safe
// to call from a deploy or by hand.
import bcrypt from 'bcryptjs';
import { pool, one } from './db';
import { seedUser } from './seed';

async function main() {
  const [identifier, password, name] = process.argv.slice(2);
  if (!identifier || !password) {
    console.error('usage: tsx src/ensure-user.ts <identifier> <password> [name]');
    process.exit(1);
  }

  const id = identifier.toLowerCase();
  const hash = await bcrypt.hash(password, 10);
  const existing = await one<{ id: string }>('select id from users where email = $1', [id]);

  if (existing) {
    await pool.query('update users set password_hash = $2 where id = $1', [existing.id, hash]);
    console.log(`updated password for existing user '${id}'`);
  } else {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const rows = await client.query(
        `insert into users (email, password_hash, name, tz)
         values ($1, $2, $3, $4) returning id`,
        [id, hash, name || 'Rahul', 'Asia/Kolkata'],
      );
      // Same demo dataset a signup would get, so the Health module isn't empty.
      await seedUser(client, rows.rows[0].id, 'Asia/Kolkata');
      await client.query('COMMIT');
      console.log(`created user '${id}'`);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
