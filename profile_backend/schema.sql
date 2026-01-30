create table if not exists users (
  id bigserial primary key,
  auth0_sub text unique not null,
  email text,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists user_profiles (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  display_name text,
  avatar_url text,
  home_city text,
  default_lat double precision,
  default_lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists saved_locations (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  campsite_id text not null,
  created_at timestamptz not null default now(),
  unique(user_id, campsite_id)
);

create table if not exists user_notes (
  id bigserial primary key,
  user_id bigint not null references users(id) on delete cascade,
  campsite_id text,
  note text not null,
  created_at timestamptz not null default now()
);
