// Netlify Function: protected + rate-limited example endpoint
// Public URL (after redirects) will be: /api/example

type NetlifyEvent = {
  headers: Record<string, string | undefined>;
};

export const handler = async (event: NetlifyEvent) => {
  // --- Basic API key protection --------------------------------------------
  const headers = event.headers || {};
  // Normalize header lookup (Netlify lowercases headers in practice)
  const providedKey =
    headers['x-api-key'] ??
    headers['X-API-KEY'] ??
    headers['x-api-key'.toLowerCase()];

  const expectedKey = process.env.MY_API_KEY;

  if (!expectedKey) {
    // Fail closed if misconfigured instead of crashing
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        error: 'Server misconfiguration: missing MY_API_KEY',
      }),
    };
  }

  if (!providedKey || providedKey !== expectedKey) {
    return {
      statusCode: 401,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }
  // -------------------------------------------------------------------------

  try {
    // Your actual API logic goes here; keep it simple and safe
    const data = {
      message: 'Protected API success',
      time: new Date().toISOString(),
    };

    return {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (error) {
    // Avoid unhandled exceptions causing 502/500s
    console.error('Error in example function:', error);

    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};

// Netlify per-function rate limiting configuration
export const config = {
  // The public path where this function should be exposed
  path: '/api/example',

  rateLimit: {
    // 60 requests...
    windowLimit: 60,
    // ...per 60 seconds
    windowSize: 60,

    // Per IP, and include domain when supported
    aggregateBy: ['ip', 'domain'] as const,

    // Default behavior: Netlify returns 429 JSON when limit exceeded
    action: 'rate_limit' as const,

    // Alternative option (commented):
    // action: 'rewrite' as const,
    // to: '/rate_limited.html',
  },
};


