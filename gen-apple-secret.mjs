import { createSign } from 'crypto'
import { readFileSync } from 'fs'

// ↓ 여기 세 값만 채우세요
const TEAM_ID   = '38855GARHR'           // Apple Developer 팀 ID (10자리)
const KEY_ID    = 'P93N37F69K'           // Key ID (10자리)
const P8_FILE   = './AuthKey_P93N37F69K.p8'  // .p8 파일 경로
// ↑ ↑ ↑

const CLIENT_ID = 'com.jelleo01.pokemonmap'
const privateKey = readFileSync(P8_FILE, 'utf8')

const header  = Buffer.from(JSON.stringify({ alg: 'ES256', kid: KEY_ID })).toString('base64url')
const now     = Math.floor(Date.now() / 1000)
const payload = Buffer.from(JSON.stringify({
  iss: TEAM_ID,
  iat: now,
  exp: now + 15_552_000,   // 180일 유효
  aud: 'https://appleid.apple.com',
  sub: CLIENT_ID,
})).toString('base64url')

const data = `${header}.${payload}`
const sign = createSign('SHA256')
sign.update(data)
const sig = sign.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' }).toString('base64url')

console.log('\n=== Supabase Secret Key (아래 내용 복사) ===\n')
console.log(`${data}.${sig}`)
console.log('\n===\n')
