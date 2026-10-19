-- =====================================================================
-- Focus List: cloud sync database (Supabase / Postgres)
--
-- Run this whole file once in Supabase: Dashboard -> SQL Editor -> New query
-- -> paste -> Run. It is safe to run again (everything is "if not exists" /
-- "create or replace").
--
-- Design
--   * One row per account holding that account's data as a JSON text blob
--     (tasks, habits, goals, settings). Postgres compresses it automatically.
--   * Tables have row-level security ON and NO policies, so they cannot be
--     read or written directly with the public anon key. Everything goes
--     through the functions below, which check who is calling.
--   * Two kinds of accounts:
--       - Supabase Auth users (Google / email code):  fl_pull, fl_push
--       - Username + secret key users:                fl_key_* functions
--     Keys are stored only as bcrypt hashes. After login a device gets a
--     random session token (stored only as a SHA-256 hash), so bcrypt runs
--     once per login instead of on every sync.
--   * "version" gives optimistic locking: a push must name the version it
--     was based on, otherwise the client gets "conflict", pulls, merges and
--     retries. Two devices can never silently overwrite each other.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.fl_user_data (
  id               bigint generated always as identity primary key,
  user_id          uuid unique references auth.users (id) on delete cascade,
  username         text unique,
  key_hash         text,
  failed_attempts  int not null default 0,
  locked_until     timestamptz,
  payload          text not null default '',
  version          bigint not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint fl_one_owner check ((user_id is not null) <> (username is not null)),
  constraint fl_username_format check (username is null or username ~ '^[a-z0-9][a-z0-9_.-]{2,31}$'),
  constraint fl_payload_size check (octet_length(payload) <= 1500000)
);

create table if not exists public.fl_key_sessions (
  token_hash  text primary key,
  data_id     bigint not null references public.fl_user_data (id) on delete cascade,
  created_at  timestamptz not null default now(),
  last_used   timestamptz not null default now()
);

create index if not exists fl_key_sessions_data_id on public.fl_key_sessions (data_id);

alter table public.fl_user_data enable row level security;
alter table public.fl_key_sessions enable row level security;
revoke all on public.fl_user_data from anon, authenticated;
revoke all on public.fl_key_sessions from anon, authenticated;

-- ---------------------------------------------------------------------
-- Shared helpers (not callable from the browser)
-- ---------------------------------------------------------------------

create or replace function public.fl_pull_row(p_id bigint, p_since bigint)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  r public.fl_user_data%rowtype;
begin
  select * into r from public.fl_user_data where id = p_id;
  if not found or r.version = 0 then
    return jsonb_build_object('ok', true, 'version', 0);
  end if;
  -- p_since = -1 forces a full download (used after a conflict)
  if p_since >= 0 and r.version <= p_since then
    return jsonb_build_object('ok', true, 'version', r.version, 'unchanged', true);
  end if;
  return jsonb_build_object('ok', true, 'version', r.version, 'payload', r.payload, 'updated_at', r.updated_at);
end;
$$;

create or replace function public.fl_push_row(p_id bigint, p_payload text, p_base bigint)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  cur bigint;
begin
  if p_payload is null or octet_length(p_payload) > 1500000 then
    return jsonb_build_object('ok', false, 'error', 'too_large');
  end if;
  select version into cur from public.fl_user_data where id = p_id for update;
  if cur is distinct from coalesce(p_base, 0) then
    return jsonb_build_object('ok', false, 'error', 'conflict', 'version', cur);
  end if;
  update public.fl_user_data
     set payload = p_payload, version = cur + 1, updated_at = now()
   where id = p_id;
  return jsonb_build_object('ok', true, 'version', cur + 1);
end;
$$;

create or replace function public.fl_session_row(p_token text)
returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  v_id bigint;
begin
  if p_token is null or length(p_token) < 32 then
    return null;
  end if;
  update public.fl_key_sessions
     set last_used = now()
   where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
  returning data_id into v_id;
  return v_id;
end;
$$;

create or replace function public.fl_new_session(p_id bigint)
returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  insert into public.fl_key_sessions (token_hash, data_id)
  values (encode(extensions.digest(v_token, 'sha256'), 'hex'), p_id);
  return v_token;
end;
$$;

-- ---------------------------------------------------------------------
-- Google / email accounts (Supabase Auth)
-- ---------------------------------------------------------------------

create or replace function public.fl_pull(p_since bigint default 0)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_id bigint;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_signed_in');
  end if;
  select id into v_id from public.fl_user_data where user_id = v_uid;
  if v_id is null then
    return jsonb_build_object('ok', true, 'version', 0);
  end if;
  return public.fl_pull_row(v_id, p_since);
end;
$$;

create or replace function public.fl_push(p_payload text, p_base bigint default 0)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_id bigint;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_signed_in');
  end if;
  insert into public.fl_user_data (user_id) values (v_uid)
  on conflict (user_id) do nothing;
  select id into v_id from public.fl_user_data where user_id = v_uid;
  return public.fl_push_row(v_id, p_payload, p_base);
end;
$$;

create or replace function public.fl_delete_my_data()
returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    return jsonb_build_object('ok', false, 'error', 'not_signed_in');
  end if;
  delete from public.fl_user_data where user_id = auth.uid();
  return jsonb_build_object('ok', true);
end;
$$;

-- ---------------------------------------------------------------------
-- Username + secret key accounts
-- ---------------------------------------------------------------------

create or replace function public.fl_key_register(p_username text, p_key text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_name text := lower(trim(coalesce(p_username, '')));
  v_id bigint;
begin
  if v_name !~ '^[a-z0-9][a-z0-9_.-]{2,31}$' then
    return jsonb_build_object('ok', false, 'error', 'bad_username');
  end if;
  if p_key is null or length(p_key) < 10 or length(p_key) > 200 then
    return jsonb_build_object('ok', false, 'error', 'weak_key');
  end if;
  insert into public.fl_user_data (username, key_hash)
  values (v_name, extensions.crypt(p_key, extensions.gen_salt('bf', 10)))
  on conflict (username) do nothing
  returning id into v_id;
  if v_id is null then
    return jsonb_build_object('ok', false, 'error', 'username_taken');
  end if;
  return jsonb_build_object('ok', true, 'token', public.fl_new_session(v_id), 'username', v_name);
end;
$$;

create or replace function public.fl_key_login(p_username text, p_key text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_name text := lower(trim(coalesce(p_username, '')));
  r public.fl_user_data%rowtype;
begin
  select * into r from public.fl_user_data where username = v_name for update;
  if not found then
    -- Same work as a real check, so response time does not reveal which usernames exist
    perform extensions.crypt(coalesce(p_key, ''), extensions.gen_salt('bf', 10));
    return jsonb_build_object('ok', false, 'error', 'bad_credentials');
  end if;
  if r.locked_until is not null and r.locked_until > now() then
    return jsonb_build_object('ok', false, 'error', 'locked', 'retry_after', r.locked_until);
  end if;
  if r.key_hash is null or extensions.crypt(coalesce(p_key, ''), r.key_hash) <> r.key_hash then
    -- 10 wrong keys in a row locks the account for 15 minutes
    update public.fl_user_data
       set failed_attempts = case when r.failed_attempts + 1 >= 10 then 0 else r.failed_attempts + 1 end,
           locked_until    = case when r.failed_attempts + 1 >= 10 then now() + interval '15 minutes' else null end
     where id = r.id;
    return jsonb_build_object('ok', false, 'error', 'bad_credentials');
  end if;
  if r.failed_attempts <> 0 or r.locked_until is not null then
    update public.fl_user_data set failed_attempts = 0, locked_until = null where id = r.id;
  end if;
  return jsonb_build_object('ok', true, 'token', public.fl_new_session(r.id), 'username', r.username);
end;
$$;

create or replace function public.fl_key_pull(p_token text, p_since bigint default 0)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_id bigint := public.fl_session_row(p_token);
begin
  if v_id is null then
    return jsonb_build_object('ok', false, 'error', 'session_expired');
  end if;
  return public.fl_pull_row(v_id, p_since);
end;
$$;

create or replace function public.fl_key_push(p_token text, p_payload text, p_base bigint default 0)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_id bigint := public.fl_session_row(p_token);
begin
  if v_id is null then
    return jsonb_build_object('ok', false, 'error', 'session_expired');
  end if;
  return public.fl_push_row(v_id, p_payload, p_base);
end;
$$;

create or replace function public.fl_key_logout(p_token text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.fl_key_sessions
   where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');
  return jsonb_build_object('ok', true);
end;
$$;

-- Change the secret key (needs the current key). Signs out every other device.
create or replace function public.fl_key_change(p_username text, p_key text, p_new_key text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_login jsonb := public.fl_key_login(p_username, p_key);
  v_id bigint;
begin
  if not (v_login ->> 'ok')::boolean then
    return v_login;
  end if;
  if p_new_key is null or length(p_new_key) < 10 or length(p_new_key) > 200 then
    return jsonb_build_object('ok', false, 'error', 'weak_key');
  end if;
  select id into v_id from public.fl_user_data where username = lower(trim(p_username));
  update public.fl_user_data
     set key_hash = extensions.crypt(p_new_key, extensions.gen_salt('bf', 10))
   where id = v_id;
  delete from public.fl_key_sessions where data_id = v_id;
  return jsonb_build_object('ok', true, 'token', public.fl_new_session(v_id), 'username', lower(trim(p_username)));
end;
$$;

-- Permanently delete a username account and its data.
create or replace function public.fl_key_delete(p_token text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_id bigint := public.fl_session_row(p_token);
begin
  if v_id is null then
    return jsonb_build_object('ok', false, 'error', 'session_expired');
  end if;
  delete from public.fl_user_data where id = v_id;
  return jsonb_build_object('ok', true);
end;
$$;

-- ---------------------------------------------------------------------
-- Permissions: helpers are private, only the entry points are exposed
-- ---------------------------------------------------------------------

revoke all on function public.fl_pull_row(bigint, bigint) from public, anon, authenticated;
revoke all on function public.fl_push_row(bigint, text, bigint) from public, anon, authenticated;
revoke all on function public.fl_session_row(text) from public, anon, authenticated;
revoke all on function public.fl_new_session(bigint) from public, anon, authenticated;

revoke all on function public.fl_pull(bigint) from public, anon;
revoke all on function public.fl_push(text, bigint) from public, anon;
revoke all on function public.fl_delete_my_data() from public, anon;
grant execute on function public.fl_pull(bigint) to authenticated;
grant execute on function public.fl_push(text, bigint) to authenticated;
grant execute on function public.fl_delete_my_data() to authenticated;

revoke all on function public.fl_key_register(text, text) from public;
revoke all on function public.fl_key_login(text, text) from public;
revoke all on function public.fl_key_pull(text, bigint) from public;
revoke all on function public.fl_key_push(text, text, bigint) from public;
revoke all on function public.fl_key_logout(text) from public;
revoke all on function public.fl_key_change(text, text, text) from public;
revoke all on function public.fl_key_delete(text) from public;
grant execute on function public.fl_key_register(text, text) to anon, authenticated;
grant execute on function public.fl_key_login(text, text) to anon, authenticated;
grant execute on function public.fl_key_pull(text, bigint) to anon, authenticated;
grant execute on function public.fl_key_push(text, text, bigint) to anon, authenticated;
grant execute on function public.fl_key_logout(text) to anon, authenticated;
grant execute on function public.fl_key_change(text, text, text) to anon, authenticated;
grant execute on function public.fl_key_delete(text) to anon, authenticated;
