import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const SOURCE_PROJECT = 'trip-fafb1'
const DEST_PROJECT = 'jee-production'
const FIREBASE_TOOLS_PATH = 'C:/Users/User/.config/configstore/firebase-tools.json'
const SOURCE_SERVICE_ACCOUNT_PATH = 'C:/trip/service-account.json'
const FIREBASE_CLI_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com'
const FIREBASE_CLI_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi'
const TOP_LEVEL_COLLECTIONS = ['usernames', 'pushSubscriptions', 'trips']
const TRIP_SUBCOLLECTIONS = ['people', 'receipts', 'photos', 'settlements', 'schedule', 'messages']
const COMMIT_BATCH_SIZE = 200

async function main() {
  const writeMode = process.argv.includes('--write')
  const sourceCreds = JSON.parse(fs.readFileSync(SOURCE_SERVICE_ACCOUNT_PATH, 'utf8'))
  const firebaseTools = JSON.parse(fs.readFileSync(FIREBASE_TOOLS_PATH, 'utf8'))

  const sourceToken = await getServiceAccountAccessToken(sourceCreds)
  const destToken = await getUserAccessToken(firebaseTools.tokens)

  const summary = []

  for (const collectionName of TOP_LEVEL_COLLECTIONS) {
    const docs = await listCollectionDocs(SOURCE_PROJECT, sourceToken, collectionName)
    summary.push({ path: collectionName, count: docs.length })

    if (writeMode && docs.length > 0) {
      await commitDocs(DEST_PROJECT, destToken, docs)
    }

    if (collectionName === 'trips') {
      for (const tripDoc of docs) {
        for (const subcollection of TRIP_SUBCOLLECTIONS) {
          const subPath = `trips/${tripDoc.id}/${subcollection}`
          const subDocs = await listCollectionDocs(SOURCE_PROJECT, sourceToken, subPath)
          summary.push({ path: subPath, count: subDocs.length })

          if (writeMode && subDocs.length > 0) {
            await commitDocs(DEST_PROJECT, destToken, subDocs)
          }
        }
      }
    }
  }

  console.log(writeMode ? 'Firestore migration complete.' : 'Firestore migration dry run complete.')
  summary.forEach((item) => {
    console.log(`${item.path}: ${item.count}`)
  })
}

async function listCollectionDocs(projectId, accessToken, collectionPath) {
  const docs = []
  let nextPageToken = ''

  do {
    const url = new URL(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionPath}`)
    url.searchParams.set('pageSize', '1000')
    if (nextPageToken) {
      url.searchParams.set('pageToken', nextPageToken)
    }

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) {
      throw new Error(`Failed to read ${collectionPath}: ${await response.text()}`)
    }

    const data = await response.json()
    const pageDocs = (data.documents || []).map((doc) => ({
      id: doc.name.split('/').pop(),
      relativePath: doc.name.split('/documents/')[1],
      fields: doc.fields || {},
    }))

    docs.push(...pageDocs)
    nextPageToken = data.nextPageToken || ''
  } while (nextPageToken)

  return docs
}

async function commitDocs(projectId, accessToken, docs) {
  for (let index = 0; index < docs.length; index += COMMIT_BATCH_SIZE) {
    const chunk = docs.slice(index, index + COMMIT_BATCH_SIZE)
    const writes = chunk.map((doc) => ({
      update: {
        name: `projects/${projectId}/databases/(default)/documents/${doc.relativePath}`,
        fields: doc.fields,
      },
    }))

    const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ writes }),
    })

    if (!response.ok) {
      throw new Error(`Failed to write batch for ${chunk[0]?.relativePath || 'unknown path'}: ${await response.text()}`)
    }
  }
}

async function getServiceAccountAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000)
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64UrlEncode(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))

  const signer = crypto.createSign('RSA-SHA256')
  signer.update(`${header}.${payload}`)
  const signature = signer.sign(serviceAccount.private_key, 'base64url')

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${payload}.${signature}`,
    }),
  })

  const data = await response.json()
  if (!data.access_token) {
    throw new Error(`Failed to get source access token: ${JSON.stringify(data)}`)
  }

  return data.access_token
}

async function getUserAccessToken(tokens) {
  if (tokens.access_token && Date.now() < (tokens.expires_at || 0) - 60_000) {
    return tokens.access_token
  }

  const response = await fetch('https://www.googleapis.com/oauth2/v3/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: FIREBASE_CLI_CLIENT_ID,
      client_secret: FIREBASE_CLI_CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  const data = await response.json()
  if (!data.access_token) {
    throw new Error(`Failed to refresh destination access token: ${JSON.stringify(data)}`)
  }

  return data.access_token
}

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
