const crypto = require('crypto')
const fs = require('fs')

const privateKey = fs.readFileSync('/Users/macboyjr/Documents/Development/_verbatim/AuthKey_23CH33MMSH.p8', 'utf8')

const teamId  = '4HJGF8HQK2'
const keyId   = '23CH33MMSH'
const clientId = 'com.squaredthought.verbatim.web'

function b64url(buf) {
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

const now = Math.floor(Date.now() / 1000)

const header  = b64url(Buffer.from(JSON.stringify({ alg: 'ES256', kid: keyId })))
const payload = b64url(Buffer.from(JSON.stringify({
  iss: teamId,
  iat: now,
  exp: now + 86400 * 180,
  aud: 'https://appleid.apple.com',
  sub: clientId,
})))

const input = `${header}.${payload}`
const sig = crypto.sign('sha256', Buffer.from(input), { key: privateKey, dsaEncoding: 'ieee-p1363' })

console.log(`${input}.${b64url(sig)}`)
