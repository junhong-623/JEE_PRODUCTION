# JSave Instagram feed

Read-only feed for the owned creator account **@j._save**, Instagram user ID
`17841429280714420`. The Meta app is JSave (`2359970378140581`), with Instagram
client ID `948190264518617`. OAuth requests only `instagram_business_basic`.
The registered callback is `https://jsave.jeeprod.com/instagram/callback`.

## Deployment

This is a separate Firebase codebase so it can be deployed without publishing
pending changes to other project functions:

```powershell
npm ci --prefix functions-instagram
firebase deploy --only functions:jsave-instagram --project jee-production
```

The JSave Hosting configuration rewrites `/api/instagram` to `jsaveInstagramFeed`
in `asia-southeast1`. Frontend deployments use the existing Hosting workflow.

## Credentials and renewal

- Bootstrap long-lived token: Firebase Secret Manager `JSAVE_INSTAGRAM_ACCESS_TOKEN`.
- Latest refreshed token: private Firestore document
  `jsave_integrations/instagram_connection`. No client rule grants access to this
  collection. Only the backend service account reads/writes it.
- `jsaveInstagramRenew` checks daily at 04:00 Malaysia time and renews when the
  token is at least seven days old (or within fourteen days of expiry). Tokens
  under 24 hours old are never refreshed. Renewals need no app secret.
- `bootstrap.json` contains only the initial issue/expiry timestamps. Updating
  the bootstrap secret changes its hash, which replaces the private connection
  on the next backend use.
- Revoking the application, changing relevant account access, or expiry can
  require a fresh authorization. Renewal errors are recorded without credentials
  or Meta response content.

To reconnect, complete basic-only Instagram OAuth and exchange the code on a
trusted server using the Instagram app secret. Verify `username === j._save`,
then exchange for a long-lived token. Save the token to a temporary file outside
the repository and use:

```powershell
firebase functions:secrets:set JSAVE_INSTAGRAM_ACCESS_TOKEN --data-file <absolute-token-file> --project jee-production
```

Update the non-secret timestamps in `bootstrap.json`, deploy this codebase, and
delete the temporary credential file. Never put a token or app secret in a
`VITE_*` variable, source file, public asset, URL shown to visitors, or log.

## Storage and availability

Only one feed document, `jsave_integrations/instagram_feed`, is overwritten with
the latest six posts and at most ten carousel preview URLs per post. Photos and
videos are not downloaded or stored. Video posts use the Instagram thumbnail.
No pagination history or original Graph response is retained.

The feed refreshes after one hour when requested. A short transaction lease
prevents parallel refreshes and API failures back off for one minute. Previously
loaded posts may be served for up to six hours during a temporary outage, then
the endpoint returns 503. The intro keeps a link to the Instagram profile and
offers a reload button. Public responses explicitly select post fields and never
include the connection document, access token, source hash, or pagination data.

Tests: `npx vitest run tests/jsave/instagramFeed.test.js`.

Local previews may set `VITE_JSAVE_INSTAGRAM_FEED_URL` to the public function
URL while a Hosting rewrite is awaiting deployment. This is a public URL, never
a credential; production uses the default `/api/instagram` endpoint on JSave.

Official authorization/renewal reference:
https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/business-login
