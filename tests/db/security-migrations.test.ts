/**
 * Runs the real security migrations against an in-memory Postgres (PGlite) with a
 * minimal stand-in for the Supabase pieces they rely on (auth.uid(), the anon /
 * authenticated / service_role roles) and the tables + policies as they were
 * BEFORE the migrations. Acts as each kind of caller with `set role`.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const MIGRATIONS = path.resolve(__dirname, "../../supabase/migrations");
const read = (f: string) => readFileSync(path.join(MIGRATIONS, f), "utf8");

const USER = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";
const MOD = "33333333-3333-3333-3333-333333333333";
const CHANNEL = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

const PRE_MIGRATION_SCHEMA = `
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('test.uid', true), '')::uuid $$;

  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
  grant usage on schema public, auth to anon, authenticated, service_role;

  create table public.profiles (
    id uuid primary key references auth.users(id),
    role text default 'user' check (role in ('user', 'channel_author', 'moderator'))
  );
  create table public.topics (id uuid primary key, author_id uuid, title text);
  create table public.channel_pages (
    id uuid primary key default gen_random_uuid(),
    channel_id uuid not null references public.topics on delete cascade,
    slug text not null,
    title text not null
  );
  create table public.topic_content (
    id uuid default gen_random_uuid() primary key,
    topic_id uuid not null,
    page_id uuid,
    author_id uuid not null,
    type text not null default 'article',
    title text not null,
    body text,
    media_urls jsonb default '[]',
    scripture_reference text,
    moderation_status text not null default 'approved',
    moderation_note text,
    is_featured boolean not null default false
  );
  create table public.topic_content_comments (
    id uuid default gen_random_uuid() primary key,
    topic_content_id uuid not null references public.topic_content on delete cascade,
    user_id uuid not null,
    body text not null
  );
  create table public.content_reports (id uuid default gen_random_uuid() primary key, reporter_id uuid);
  create table public.bible_ai_daily_usage (
    user_id uuid not null,
    usage_date date not null default (timezone('utc', now()))::date,
    request_count integer not null default 0 check (request_count >= 0),
    primary key (user_id, usage_date)
  );

  alter table public.topics enable row level security;
  alter table public.channel_pages enable row level security;
  alter table public.profiles enable row level security;
  alter table public.topic_content enable row level security;
  alter table public.topic_content_comments enable row level security;
  alter table public.content_reports enable row level security;
  alter table public.bible_ai_daily_usage enable row level security;

  -- policies exactly as the app had them before the hardening migration
  create policy "Topics are viewable by everyone" on public.topics for select using (true);
  create policy "Authors can update own topics" on public.topics for update using (auth.uid() = author_id);
  create policy "Channel pages viewable by everyone" on public.channel_pages for select using (true);
  create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
  create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
  create policy "Topic content is viewable by everyone" on public.topic_content for select using (true);
  create policy "Authors can create topic content" on public.topic_content for insert with check (auth.uid() = author_id);
  create policy "Authors can update own topic content" on public.topic_content for update using (auth.uid() = author_id);
  -- from 20260527000000_site_moderator_role.sql
  create policy "Moderators can update topic content" on public.topic_content for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'moderator')
  );
  create policy "Comments viewable by everyone" on public.topic_content_comments for select using (true);
  create policy "Authenticated can comment" on public.topic_content_comments for insert with check (auth.uid() = user_id);
  create policy "Users can update own comments" on public.topic_content_comments for update using (auth.uid() = user_id);
  create policy "Users read own bible ai usage" on public.bible_ai_daily_usage for select to authenticated using (auth.uid() = user_id);
  create policy "Users insert own bible ai usage" on public.bible_ai_daily_usage for insert to authenticated with check (auth.uid() = user_id);
  create policy "Users update own bible ai usage" on public.bible_ai_daily_usage for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

  grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;

  insert into auth.users (id) values ('${USER}'), ('${OTHER}'), ('${MOD}');
  insert into public.profiles (id, role) values ('${USER}', 'user'), ('${OTHER}', 'user'), ('${MOD}', 'moderator');
`;

let db: PGlite;

/** Run `fn` as the given database role / app user, then go back to the superuser. */
async function as<T>(role: "anon" | "authenticated" | "service_role" | "postgres", uid: string | null, fn: () => Promise<T>) {
  await db.query(`select set_config('test.uid', $1, false)`, [uid ?? ""]);
  if (role !== "postgres") await db.exec(`set role ${role}`);
  try {
    return await fn();
  } finally {
    await db.exec("reset role");
    await db.query(`select set_config('test.uid', '', false)`);
  }
}

async function seedPost(overrides: Record<string, unknown> = {}) {
  const row = {
    topic_id: CHANNEL,
    author_id: USER,
    title: "Original title",
    body: "Original body",
    moderation_status: "approved",
    ...overrides,
  };
  const keys = Object.keys(row);
  const res = await db.query<{ id: string }>(
    `insert into public.topic_content (${keys.join(",")}) values (${keys.map((_, i) => `$${i + 1}`).join(",")}) returning id`,
    Object.values(row)
  );
  return res.rows[0].id;
}

const statusOf = async (id: string) =>
  (await db.query<{ moderation_status: string; is_featured: boolean }>(
    "select moderation_status, is_featured from public.topic_content where id = $1",
    [id]
  )).rows[0];

beforeAll(async () => {
  db = new PGlite();
  await db.exec(PRE_MIGRATION_SCHEMA);
  await db.exec(read("20261121000000_security_hardening.sql"));
  await db.exec(read("20261121000100_editorial_featured.sql"));
  await db.exec(read("20261121000200_archive_channels_pages.sql"));
});

afterAll(async () => {
  await db.close();
});

describe("profiles.role", () => {
  it("lets a user pick channel_author", async () => {
    await as("authenticated", USER, async () => {
      await db.query("update public.profiles set role = 'channel_author' where id = $1", [USER]);
    });
    const { rows } = await db.query("select role from public.profiles where id = $1", [USER]);
    expect(rows[0]).toEqual({ role: "channel_author" });
  });

  it("blocks a user from making themselves a moderator", async () => {
    await expect(
      as("authenticated", OTHER, () =>
        db.query("update public.profiles set role = 'moderator' where id = $1", [OTHER])
      )
    ).rejects.toThrow(/Not allowed to change role/);
    const { rows } = await db.query("select role from public.profiles where id = $1", [OTHER]);
    expect(rows[0]).toEqual({ role: "user" });
  });

  it("blocks changing a moderator's role through the API, but not from the SQL editor", async () => {
    await expect(
      as("authenticated", MOD, () => db.query("update public.profiles set role = 'user' where id = $1", [MOD]))
    ).rejects.toThrow(/Not allowed/);
    await db.query("update public.profiles set role = 'moderator' where id = $1", [MOD]); // trusted caller
  });
});

describe("topic_content moderation", () => {
  it("forces new posts from authors into review and unfeatured", async () => {
    await as("authenticated", USER, async () => {
      await db.query(
        `insert into public.topic_content (topic_id, author_id, title, moderation_status, is_featured, moderation_note)
         values ($1, $2, 'sneaky', 'approved', true, 'looks fine')`,
        [CHANNEL, USER]
      );
    });
    const { rows } = await db.query<{ moderation_status: string; is_featured: boolean; moderation_note: string | null }>(
      "select moderation_status, is_featured, moderation_note from public.topic_content where title = 'sneaky'"
    );
    expect(rows[0]).toEqual({ moderation_status: "pending_review", is_featured: false, moderation_note: null });
  });

  it("sends an edited post back to review", async () => {
    const id = await seedPost();
    await as("authenticated", USER, async () => {
      await db.query("update public.topic_content set body = 'changed', moderation_status = 'approved' where id = $1", [id]);
    });
    expect((await statusOf(id)).moderation_status).toBe("pending_review");
  });

  it("does not let an author undo a rejection without changing the text", async () => {
    const id = await seedPost({ moderation_status: "rejected", moderation_note: "off mission" });
    await as("authenticated", USER, async () => {
      await db.query("update public.topic_content set moderation_status = 'approved', moderation_note = null where id = $1", [id]);
    });
    const { rows } = await db.query("select moderation_status, moderation_note from public.topic_content where id = $1", [id]);
    expect(rows[0]).toEqual({ moderation_status: "rejected", moderation_note: "off mission" });
  });

  it("does not let an author feature their own post", async () => {
    const id = await seedPost();
    await as("authenticated", USER, async () => {
      await db.query("update public.topic_content set is_featured = true where id = $1", [id]);
    });
    expect(await statusOf(id)).toEqual({ moderation_status: "approved", is_featured: false });
  });

  it("lets the server, the SQL editor and moderators approve and feature posts", async () => {
    const a = await seedPost({ moderation_status: "pending_review" });
    await as("service_role", null, async () => {
      await db.query("update public.topic_content set moderation_status = 'approved' where id = $1", [a]);
    });
    expect((await statusOf(a)).moderation_status).toBe("approved");

    await db.query("update public.topic_content set is_featured = true where id = $1", [a]); // SQL editor
    expect((await statusOf(a)).is_featured).toBe(true);

    const b = await seedPost({ moderation_status: "pending_review" });
    await as("authenticated", MOD, async () => {
      await db.query("update public.topic_content set moderation_status = 'approved', is_featured = true where id = $1", [b]);
    });
    expect(await statusOf(b)).toEqual({ moderation_status: "approved", is_featured: true });
  });
});

describe("topic_content visibility", () => {
  let approved: string, pending: string, rejected: string;

  beforeAll(async () => {
    approved = await seedPost({ title: "vis-approved", moderation_status: "approved" });
    pending = await seedPost({ title: "vis-pending", moderation_status: "pending_review" });
    rejected = await seedPost({ title: "vis-rejected", moderation_status: "rejected" });
  });

  const visibleTo = async (role: "anon" | "authenticated", uid: string | null) =>
    as(role, uid, async () => {
      const { rows } = await db.query<{ title: string }>(
        "select title from public.topic_content where title like 'vis-%' order by title"
      );
      return rows.map((r) => r.title);
    });

  it("shows anonymous visitors only approved posts", async () => {
    expect(await visibleTo("anon", null)).toEqual(["vis-approved"]);
  });

  it("shows other signed-in users only approved posts", async () => {
    expect(await visibleTo("authenticated", OTHER)).toEqual(["vis-approved"]);
  });

  it("shows authors all of their own posts", async () => {
    expect(await visibleTo("authenticated", USER)).toEqual(["vis-approved", "vis-pending", "vis-rejected"]);
  });

  it("shows moderators everything", async () => {
    expect(await visibleTo("authenticated", MOD)).toEqual(["vis-approved", "vis-pending", "vis-rejected"]);
  });

  it("keeps all three rows in the table (sanity)", async () => {
    expect([approved, pending, rejected].every(Boolean)).toBe(true);
  });
});

describe("comments", () => {
  it("cannot be written directly by signed-in users", async () => {
    const post = await seedPost();
    await expect(
      as("authenticated", USER, () =>
        db.query("insert into public.topic_content_comments (topic_content_id, user_id, body) values ($1, $2, 'hi')", [post, USER])
      )
    ).rejects.toThrow(/row-level security/);
  });

  it("cannot be edited by their authors (so a moderated comment can't be swapped afterwards)", async () => {
    const post = await seedPost();
    const { rows } = await db.query<{ id: string }>(
      "insert into public.topic_content_comments (topic_content_id, user_id, body) values ($1, $2, 'original') returning id",
      [post, USER]
    ); // server / service role
    await as("authenticated", USER, async () => {
      await db.query("update public.topic_content_comments set body = 'swapped' where id = $1", [rows[0].id]);
    });
    const check = await db.query("select body from public.topic_content_comments where id = $1", [rows[0].id]);
    expect(check.rows[0]).toEqual({ body: "original" });
  });
});

describe("consume_bible_ai_quota", () => {
  const consume = (uid: string, limit: number) =>
    as("service_role", null, async () => {
      const { rows } = await db.query<{ r: { allowed: boolean; remaining: number } }>(
        "select public.consume_bible_ai_quota($1, $2) as r",
        [uid, limit]
      );
      return rows[0].r;
    });

  it("counts down and then refuses", async () => {
    expect(await consume(USER, 3)).toEqual({ allowed: true, remaining: 2 });
    expect(await consume(USER, 3)).toEqual({ allowed: true, remaining: 1 });
    expect(await consume(USER, 3)).toEqual({ allowed: true, remaining: 0 });
    expect(await consume(USER, 3)).toEqual({ allowed: false, remaining: 0 });
    expect(await consume(USER, 3)).toEqual({ allowed: false, remaining: 0 });
    const { rows } = await db.query("select request_count from public.bible_ai_daily_usage where user_id = $1", [USER]);
    expect(rows[0]).toEqual({ request_count: 3 }); // refused calls don't inflate the counter
  });

  it("tracks each user separately", async () => {
    expect(await consume(OTHER, 1)).toEqual({ allowed: true, remaining: 0 });
    expect(await consume(OTHER, 1)).toEqual({ allowed: false, remaining: 0 });
    expect((await consume(MOD, 1)).allowed).toBe(true);
  });

  it("rejects invalid input", async () => {
    expect((await consume(USER, 0)).allowed).toBe(false);
  });

  it("is not callable by signed-in users or visitors", async () => {
    for (const role of ["authenticated", "anon"] as const) {
      await expect(
        as(role, USER, () => db.query("select public.consume_bible_ai_quota($1, 30)", [USER]))
      ).rejects.toThrow(/permission denied/);
    }
  });

  it("stops users from resetting their own counter", async () => {
    await as("authenticated", USER, async () => {
      await db.query("update public.bible_ai_daily_usage set request_count = 0 where user_id = $1", [USER]);
    });
    const { rows } = await db.query("select request_count from public.bible_ai_daily_usage where user_id = $1", [USER]);
    expect(rows[0]).toEqual({ request_count: 3 });
  });

  it("stops users from inserting their own usage rows", async () => {
    await expect(
      as("authenticated", "44444444-4444-4444-4444-444444444444", () =>
        db.query("insert into public.bible_ai_daily_usage (user_id, request_count) values ($1, 0)", [
          "44444444-4444-4444-4444-444444444444",
        ])
      )
    ).rejects.toThrow(/row-level security/);
  });
});

describe("archived channels and pages", () => {
  const LIVE = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
  const SHELVED = "cccccccc-cccc-cccc-cccc-cccccccccccc";
  let livePage: string, shelvedPage: string;

  beforeAll(async () => {
    await db.query(
      `insert into public.topics (id, author_id, title, archived_at) values
         ($1, $3, 'arc-live', null), ($2, $3, 'arc-shelved', now())`,
      [LIVE, SHELVED, USER]
    );
    const mk = async (channel: string, slug: string, archived: boolean) =>
      (await db.query<{ id: string }>(
        `insert into public.channel_pages (channel_id, slug, title, archived_at)
         values ($1, $2, $2, ${archived ? "now()" : "null"}) returning id`,
        [channel, slug]
      )).rows[0].id;
    livePage = await mk(LIVE, "arc-open", false);
    shelvedPage = await mk(LIVE, "arc-hidden", true);
    await mk(SHELVED, "arc-in-shelved-channel", false);
    await seedPost({ topic_id: LIVE, page_id: livePage, title: "arc-post-live" });
    await seedPost({ topic_id: LIVE, page_id: shelvedPage, title: "arc-post-archived-page" });
    await seedPost({ topic_id: SHELVED, title: "arc-post-archived-channel" });
  });

  const seen = (role: "anon" | "authenticated", uid: string | null, table: string, col: string) =>
    as(role, uid, async () => {
      const { rows } = await db.query<Record<string, string>>(
        `select ${col} as v from public.${table} where ${col} like 'arc-%' order by ${col}`
      );
      return rows.map((r) => r.v);
    });

  it("hides archived channels from visitors and other users", async () => {
    expect(await seen("anon", null, "topics", "title")).toEqual(["arc-live"]);
    expect(await seen("authenticated", OTHER, "topics", "title")).toEqual(["arc-live"]);
  });

  it("hides archived pages, and every page of an archived channel", async () => {
    expect(await seen("anon", null, "channel_pages", "title")).toEqual(["arc-open"]);
  });

  it("hides posts on archived pages and in archived channels", async () => {
    expect(await seen("anon", null, "topic_content", "title")).toEqual(["arc-post-live"]);
    expect(await seen("authenticated", OTHER, "topic_content", "title")).toEqual(["arc-post-live"]);
  });

  it("still shows everything to the channel owner", async () => {
    expect(await seen("authenticated", USER, "topics", "title")).toEqual(["arc-live", "arc-shelved"]);
    expect(await seen("authenticated", USER, "channel_pages", "title")).toEqual([
      "arc-hidden",
      "arc-in-shelved-channel",
      "arc-open",
    ]);
    expect((await seen("authenticated", USER, "topic_content", "title")).length).toBe(3);
  });

  it("still shows everything to moderators", async () => {
    expect(await seen("authenticated", MOD, "topics", "title")).toEqual(["arc-live", "arc-shelved"]);
    expect((await seen("authenticated", MOD, "topic_content", "title")).length).toBe(3);
  });

  it("restoring a channel makes it public again; nothing was deleted", async () => {
    await as("authenticated", USER, () =>
      db.query("update public.topics set archived_at = null where id = $1", [SHELVED])
    );
    expect(await seen("anon", null, "topics", "title")).toEqual(["arc-live", "arc-shelved"]);
    expect(await seen("anon", null, "topic_content", "title")).toEqual([
      "arc-post-archived-channel",
      "arc-post-live",
    ]);
  });

  it("does not let someone else archive a channel", async () => {
    await as("authenticated", OTHER, () =>
      db.query("update public.topics set archived_at = now() where id = $1", [LIVE])
    );
    expect(await seen("anon", null, "topics", "title")).toContain("arc-live");
  });
});
