import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

const alice = '10000000-0000-0000-0000-000000000001'
const bob = '10000000-0000-0000-0000-000000000002'
const shop = '20000000-0000-0000-0000-000000000001'
const report = '30000000-0000-0000-0000-000000000001'
const question = '30000000-0000-0000-0000-000000000002'
const visit = '40000000-0000-0000-0000-000000000001'
const migration = await readFile(new URL('../supabase/migrations/202609250001_points_and_auth.sql', import.meta.url), 'utf8')

async function setup() {
  const db = new PGlite()
  await db.exec(`
    create role anon; create role authenticated;
    create schema auth;
    create table auth.users(id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema public, auth to anon, authenticated;
  `)
  await db.exec(await readFile(new URL('../supabase/schema.sql', import.meta.url), 'utf8'))
  await db.exec(await readFile(new URL('../supabase/admin.sql', import.meta.url), 'utf8'))
  await db.exec(`grant select, insert, update, delete on all tables in schema public to anon, authenticated;
    insert into auth.users values ('${alice}', 'alice@example.test'), ('${bob}', 'bob@example.test');
    insert into profiles(id, trainer_id) values ('${alice}', 'alice');`)
  await db.exec(migration)
  // Existing user and newly onboarded user both get exactly 10.
  await db.exec(`insert into profiles(id, trainer_id) values ('${bob}', 'bob');
    insert into shops(id,name,type,addr,lat,lng) values ('${shop}','Test shop','cvs','Seoul',37.5,127.0);`)
  return db
}
async function asUser(db, uid) {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false); set role ${uid ? 'authenticated' : 'anon'};`)
}
async function balance(db, uid) {
  return (await db.query('select balance from card_point_accounts where user_id=$1', [uid])).rows[0]?.balance
}

test('welcome, reporting, comments and likes are atomic and cannot be forged', async () => {
  const db = await setup()
  try {
    assert.equal(await balance(db, alice), 10)
    assert.equal(await balance(db, bob), 10)
    await db.exec(migration)
    assert.equal(await balance(db, alice), 10, 'migration rerun does not duplicate signup bonus')
    await asUser(db, alice)
    await db.exec(`insert into posts(id,user_id,shop_id,category,body,tags) values ('${report}','${alice}','${shop}','news','포켓몬 카드가 없어요',array['카드 없음']);`)
    assert.equal(await balance(db, alice), 13, 'negative availability report earns 3')
    await db.exec(`insert into posts(id,user_id,shop_id,category,body) values ('${question}','${alice}','${shop}','ask','언제 입고되나요?');`)
    assert.equal(await balance(db, alice), 13, 'questions do not earn report rewards')
    await db.exec(`insert into comments(post_id,user_id,body) values ('${report}','${alice}','내 글의 댓글');
      insert into hearts(post_id,user_id) values ('${report}','${alice}');`)
    assert.equal(await balance(db, alice), 13, 'no self-reaction reward')
    await asUser(db, bob)
    await db.exec(`insert into comments(post_id,user_id,body) values ('${report}','${bob}','고마워요');
      insert into hearts(post_id,user_id) values ('${report}','${bob}');`)
    assert.equal(await balance(db, bob), 12)
    await db.exec(`delete from hearts where post_id='${report}' and user_id='${bob}';
      insert into hearts(post_id,user_id) values ('${report}','${bob}');`)
    assert.equal(await balance(db, bob), 12, 're-like does not earn twice')
    const counts = (await db.query(`select hearts_count, comments_count from posts where id='${report}'`)).rows[0]
    assert.equal(counts.hearts_count, 2)
    assert.equal(counts.comments_count, 2)
    await db.exec(`insert into comments(post_id,user_id,body) values ('${question}','${bob}','질문의 답변');`)
    assert.equal(await balance(db, bob), 12)
    await assert.rejects(db.exec(`update card_point_accounts set balance=999 where user_id='${bob}'`), /permission denied/)
    await assert.rejects(db.exec(`select card_credit('${bob}',100,'fake','fake')`), /permission denied/)
    await assert.rejects(db.exec(`insert into card_point_entries(user_id,amount,reason,event_key) values ('${bob}',100,'fake','fake')`), /permission denied/)
    await assert.rejects(db.exec(`insert into posts(user_id,shop_id,category,body) values ('${alice}','${shop}','news','forged report')`), /row-level security/)
    assert.equal(await balance(db, alice), undefined, 'cannot read another wallet')
    await asUser(db, null)
    assert.equal((await db.query('select * from shops')).rows.length, 0)
    assert.equal((await db.query('select * from posts')).rows.length, 0)
    assert.equal((await db.query('select * from profiles')).rows.length, 0)
    await assert.rejects(db.exec(`select card_open_place('PC-0001','${visit}')`), /permission denied/)
  } finally { await db.close() }
})

test('place spending is validated, idempotent, private, and cannot overdraw', async () => {
  const db = await setup()
  try {
    await asUser(db, alice)
    await assert.rejects(db.exec(`select card_open_place('not-a-place','${visit}')`), /PLACE_NOT_FOUND/)
    assert.equal(await balance(db, alice), 10)
    await assert.rejects(db.exec(`select card_place_details('${visit}')`), /PAID_VISIT_REQUIRED/)
    await db.exec(`select card_open_place('PC-0001','${visit}'); select card_open_place('PC-0001','${visit}');`)
    assert.equal(await balance(db, alice), 5, 'retry charges once')
    const details = (await db.query(`select card_place_details('${visit}') as detail`)).rows[0].detail
    assert.ok(details.place.name)
    assert.deepEqual(details.posts, [])
    await assert.rejects(db.exec(`select card_open_place('PC-0002','${visit}')`), /INVALID_REQUEST/)
    await db.exec(`select card_open_place('PC-0001','40000000-0000-0000-0000-000000000002');`)
    assert.equal(await balance(db, alice), 0, 'new visit to same place charges again')
    await assert.rejects(db.exec(`select card_open_place('PC-0001','40000000-0000-0000-0000-000000000003')`), /INSUFFICIENT_POINTS/)
    assert.equal(await balance(db, alice), 0)
    assert.equal((await db.query("select * from card_point_entries where reason='place_open'")).rows.length, 2)
    await asUser(db, bob)
    await assert.rejects(db.exec(`select card_place_details('${visit}')`), /PAID_VISIT_REQUIRED/)
    await assert.rejects(db.exec(`select card_open_place('PC-0001','${visit}')`), /INVALID_REQUEST/)
    assert.equal(await balance(db, bob), 10)
    await assert.rejects(db.exec(`insert into card_place_visits values ('40000000-0000-0000-0000-000000000099','${bob}','PC-0001',now())`), /permission denied/)
  } finally { await db.close() }
})
