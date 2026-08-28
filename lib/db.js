// db.js
// Postgres connection, matching the "PostgreSQL — XP & progress" box in the pitch deck.
// Works with any Postgres, including Supabase — just set DATABASE_URL.

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes("supabase")
    ? { rejectUnauthorized: false }
    : false,
});

const SCHEMA = `
create table if not exists users (
  user_id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  xp int default 0,
  level int default 1,
  streak int default 0,
  created_at timestamp default now()
);

create table if not exists user_progress (
  user_id uuid references users(user_id) on delete cascade,
  lesson_id text not null,
  completed boolean default false,
  score int,
  primary key (user_id, lesson_id)
);

create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(user_id) on delete cascade,
  challenge_id text not null,
  submitted_data jsonb,
  result boolean,
  hints_used int default 0,
  xp_earned int default 0,
  created_at timestamp default now()
);

create table if not exists achievements (
  achievement_id text primary key,
  name text not null,
  condition_text text
);

create table if not exists user_achievements (
  user_id uuid references users(user_id) on delete cascade,
  achievement_id text references achievements(achievement_id),
  earned_at timestamp default now(),
  primary key (user_id, achievement_id)
);
`;

async function initSchema() {
  // pgcrypto gives us gen_random_uuid(); Supabase has it enabled by default.
  await pool.query(`create extension if not exists pgcrypto;`);
  await pool.query(SCHEMA);
}

module.exports = { pool, initSchema };
