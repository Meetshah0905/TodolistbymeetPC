// Netlify Edge Function: block common bot/AI crawlers from /api/*

const BLOCKED_USER_AGENTS = [
  'gptbot',
  'claudebot',
  'ccbot',
  'bytespider',
  'petalbot',
  'anthropic-ai',
  'facebookexternalhit',
];

export default async function blockBots(request: Request) {
  const url = new URL(request.url);

  // Extra safety: only act on /api/*, even though config.path also scopes it.
  if (!url.pathname.startsWith('/api/')) {
    return; // continue to next handler
  }

  const ua = request.headers.get('user-agent')?.toLowerCase() ?? '';
  const isBlocked = BLOCKED_USER_AGENTS.some((bot) => ua.includes(bot));

  if (isBlocked) {
    return new Response('Bot access denied', {
      status: 403,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
      },
    });
  }

  // Return nothing to allow the request to proceed to your function
  return;
}

export const config = {
  path: '/api/*',
};


