//initializes and reuses the same Auth0 client throughout the app runtime.

import { createAuth0Client } from '@auth0/auth0-spa-js';

let auth0Client: any = null;

export async function getAuth0Client() {
  if (!auth0Client) {
    const domain = process.env.EXPO_PUBLIC_AUTH0_DOMAIN!;
    const clientId = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID!;
    const audience = process.env.EXPO_PUBLIC_AUTH0_AUDIENCE;

    auth0Client = await createAuth0Client({
      domain,
      clientId,

      authorizationParams: {
        redirect_uri: `${window.location.origin}/auth/callback`,
        ...(audience ? { audience } : {}),
        scope: 'openid profile email offline_access',
      },

      cacheLocation: 'localstorage',
      useRefreshTokens: true,
    });
  }

  return auth0Client;
}
