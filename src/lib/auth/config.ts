/**
 * Public auth configuration.
 *
 * CLIENT_ID is a GitHub App client identifier — public by design, safe to commit.
 * WORKER_URL is the Cloudflare Worker deployed from ../../worker/ that proxies
 * the GitHub OAuth token exchange (holds the client_secret as a CF secret).
 */

export const CLIENT_ID = 'Iv23lipPWHpw0QWj8lYF'

export const WORKER_URL = 'https://bigbook-auth-proxy.mihkel-putrinsh.workers.dev'

export const REDIRECT_URI = 'https://mitselek.github.io/bigbook/auth/callback/'

export const AUTHORIZE_URL = 'https://github.com/login/oauth/authorize'
