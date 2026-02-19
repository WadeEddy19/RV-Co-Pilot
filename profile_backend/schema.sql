create table users (
  auth0_sub text primary key,                 
  name text,                                  
  email text,                                 
  avatar_url text,                            
  created_at timestamptz not null default now(),
  last_login_at timestamptz not null default now()
);

create table saved_locations (
  auth0_sub text not null references users(auth0_sub) on delete cascade,
  campsite_id text not null,
  created_at timestamptz not null default now(),
  primary key (auth0_sub, campsite_id)
);

create index if not exists idx_saved_locations_user on saved_locations(auth0_sub);

create table user_notes (
  id bigserial primary key,                   
  auth0_sub text not null references users(auth0_sub) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_notes_user on user_notes(auth0_sub);