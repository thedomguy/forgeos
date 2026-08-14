-- One-time Postgres bootstrap for ForgeOS. Run as the postgres superuser:
--   sudo -u postgres psql -f api/scripts/setup-db.sql
-- Then set DATABASE_URL in api/.env and run `npm run migrate`.
-- NOTE: change the password below before running on the VPS, and match it in .env.

create role forgeos with login password 'CHANGE_ME_STRONG_PASSWORD';
create database forgeos owner forgeos;
