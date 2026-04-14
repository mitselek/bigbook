/**
 * Public auth configuration.
 *
 * CLIENT_ID is a GitHub App client identifier — public by design, safe to commit.
 * WORKER_URL is the Cloudflare Worker deployed from ../../worker/.
 * Both are placeholders until the PO provides real values.
 */

export const CLIENT_ID = 'REPLACE_ME_GITHUB_APP_CLIENT_ID'

export const WORKER_URL = 'REPLACE_ME_CLOUDFLARE_WORKER_URL'

export const REDIRECT_URI = 'https://mitselek.github.io/bigbook/auth/callback/'

export const AUTHORIZE_URL = 'https://github.com/login/oauth/authorize'
