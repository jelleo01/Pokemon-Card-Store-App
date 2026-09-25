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

const upgrade = await readFile(new URL('../supabase/migrations/202609250002_points_weekly_access.sql', import.meta.url), 'utf8')

test('20 P welcome, seven-day unlocks, UUID aliases, expiry and private counts', async () => {
  const db = await setup()
  try {
    // Buy before upgrade: the seven-day window honors the original purchase.
    await asUser(db, alice)
    await db.exec(`select card_open_place('PC-0001','${visit}')`)
    await db.exec('reset role')
    await db.exec(upgrade)
    assert.equal(await balance(db, alice), 15, 'only missing 10 welcome points are added')
    assert.equal(await balance(db, bob), 20)
    await db.exec(upgrade)
    assert.equal(await balance(db, alice), 15, 'upgrade is idempotent')
    const charlie = '10000000-0000-0000-0000-000000000003'
    await db.exec(`insert into auth.users(id) values ('${charlie}'); insert into profiles(id,trainer_id) values ('${charlie}','charlie');`)
    assert.equal(await balance(db, charlie), 20, 'new signup gets 20 directly')
    // Represent the same seeded shop by its UUID and by its map ID.
    await db.exec(`update shops set name=c.name, lat=c.lat, lng=c.lng from card_place_catalog c where shops.id='${shop}' and c.place_key='PC-0001';
      insert into posts(id,user_id,shop_id,category,body) values ('${report}','${bob}','${shop}','news','카드 없음 확인');`)
    await asUser(db, alice)
    const summaries = (await db.query('select * from card_place_summaries()')).rows
    assert.equal(Number(summaries.find(s => s.place_key === 'PC-0001').news_count), 1)
    assert.equal(Number(summaries.find(s => s.place_key === shop).news_count), 1)
    assert.ok(summaries.find(s => s.place_key === shop).expires_at)
    const expiry = summaries.find(s => s.place_key === 'PC-0001').expires_at
    await db.exec(`select card_open_place('${shop}','40000000-0000-0000-0000-000000000020')`)
    assert.equal(await balance(db, alice), 15, 'same place via UUID is free within seven days')
    const current = (await db.query(`select card_place_details('40000000-0000-0000-0000-000000000020') as d`)).rows[0].d
    assert.equal(current.posts.length, 1)
    assert.equal(new Date(current.expires_at).getTime(), new Date(expiry).getTime(), 'free visits do not extend expiry')
    await db.exec(`reset role; update card_place_unlocks set expires_at=now()-interval '1 second' where user_id='${alice}';`)
    await asUser(db, alice)
    await assert.rejects(db.exec(`select card_place_details('${visit}')`), /PLACE_ACCESS_EXPIRED/)
    await db.exec(`select card_open_place('PC-0001','${visit}')`)
    assert.equal(await balance(db, alice), 15, 'expired retry token does not silently charge')
    await db.exec(`select card_open_place('PC-0001','40000000-0000-0000-0000-000000000021')`)
    assert.equal(await balance(db, alice), 10, 'new explicit purchase after expiry costs 5')
    await asUser(db, bob)
    await assert.rejects(db.exec(`select card_place_details('${visit}')`), /PAID_VISIT_REQUIRED/)
    await assert.rejects(db.exec(`select card_place_details_v1('${visit}')`), /permission denied/)
    await assert.rejects(db.exec(`update card_place_unlocks set expires_at=now()+interval '1 year'`), /permission denied/)
    await asUser(db, null)
    await assert.rejects(db.exec('select * from card_place_summaries()'), /permission denied/)
  } finally { await db.close() }
})

test('likes on questions award once; private app feedback awards 15 regardless of rating', async () => {
  const db = await setup()
  try {
    await db.exec(upgrade)
    await asUser(db, alice)
    await db.exec(`insert into posts(id,user_id,shop_id,category,body) values ('${question}','${alice}','${shop}','ask','재입고가 언제인가요?')`)
    const own = (await db.query(`select card_set_like('${question}',true) as r`)).rows[0].r
    assert.equal(own.awarded, 0)
    await asUser(db, bob)
    const like = (await db.query(`select card_set_like('${question}',true) as r`)).rows[0].r
    assert.equal(like.awarded, 1)
    assert.equal(like.hearts, 2)
    assert.equal(await balance(db, bob), 21)
    assert.equal((await db.query(`select card_set_like('${question}',true) as r`)).rows[0].r.awarded, 0)
    await db.exec(`select card_set_like('${question}',false)`)
    assert.equal((await db.query(`select card_set_like('${question}',true) as r`)).rows[0].r.awarded, 0)
    await db.exec(`insert into comments(post_id,user_id,body) values ('${question}','${bob}','저도 궁금해요')`)
    assert.equal(await balance(db, bob), 22)
    await assert.rejects(db.exec("select card_submit_feedback(6,'bad','invalid rating')"), /check constraint/)
    assert.equal(await balance(db, bob), 22)
    assert.equal((await db.query("select card_submit_feedback(1,'개선 요청','지도가 느려요. 개선해 주세요.') as reward")).rows[0].reward, 15)
    assert.equal(await balance(db, bob), 37, 'one star earns the full reward')
    assert.equal((await db.query("select card_submit_feedback(5,'재시도','같은 요청 다시 전송') as reward")).rows[0].reward, 0)
    assert.equal(await balance(db, bob), 37)
    await assert.rejects(db.exec("update card_app_feedback set rating=5"), /permission denied/)
    await assert.rejects(db.exec("delete from card_app_feedback"), /permission denied/)
    await asUser(db, alice)
    assert.equal((await db.query('select * from card_app_feedback')).rows.length, 0, 'feedback is private')
    await db.exec(`reset role; insert into admins(user_id) values ('${alice}')`)
    await asUser(db, alice)
    assert.equal((await db.query('select * from card_app_feedback')).rows.length, 1, 'operators can read feedback')
    await asUser(db, null)
    await assert.rejects(db.exec("select card_submit_feedback(5,'test','test feedback')"), /permission denied/)
  } finally { await db.close() }
})
