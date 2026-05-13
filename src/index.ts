interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * The Odds API MCP — sportsbook odds across 70+ books, 30+ leagues
 *
 * Auth: ?apiKey= query.
 * Free tier: 500 req/mo. Each market (h2h, spreads, totals) counts as 1.
 *
 * Docs: https://the-odds-api.com/liveapi/guides/v4/
 */


const BASE = 'https://api.the-odds-api.com/v4';

const tools: McpToolExport['tools'] = [
  {
    name: 'list_sports',
    description: 'List available sports/leagues. By default returns only in-season; pass all=true to include out-of-season.',
    inputSchema: {
      type: 'object',
      properties: {
        all: { type: 'boolean', description: 'Include out-of-season sports (default false)' },
      },
    },
  },
  {
    name: 'get_odds',
    description:
      'Current odds for upcoming + live events in a league. Each market type costs 1 quota credit per region per call — pick markets carefully.',
    inputSchema: {
      type: 'object',
      properties: {
        sport_key: { type: 'string', description: 'Sport key from list_sports, e.g. "americanfootball_nfl"' },
        regions: { type: 'string', description: 'us | uk | eu | au — comma-sep (default us)' },
        markets: { type: 'string', description: 'h2h | spreads | totals | outrights — comma-sep (default h2h)' },
        odds_format: { type: 'string', description: 'american (default) | decimal' },
        date_format: { type: 'string', description: 'iso (default) | unix' },
        bookmakers: { type: 'string', description: 'Comma-sep bookmaker keys (e.g. "draftkings,fanduel") to restrict' },
        event_ids: { type: 'string', description: 'Restrict to specific event IDs (comma-sep)' },
      },
      required: ['sport_key'],
    },
  },
  {
    name: 'get_event_odds',
    description:
      'Odds for a single event — allows richer markets (player props, alt lines). Higher quota cost per call.',
    inputSchema: {
      type: 'object',
      properties: {
        sport_key: { type: 'string' },
        event_id: { type: 'string' },
        regions: { type: 'string' },
        markets: { type: 'string', description: 'Includes player_props_* markets for some leagues' },
        odds_format: { type: 'string' },
      },
      required: ['sport_key', 'event_id'],
    },
  },
  {
    name: 'get_scores',
    description: 'Live + recent final scores. Costs 2 requests per call.',
    inputSchema: {
      type: 'object',
      properties: {
        sport_key: { type: 'string' },
        days_from: { type: 'number', description: '1-3 days from now (default 1)' },
      },
      required: ['sport_key'],
    },
  },
  {
    name: 'get_events',
    description: 'Upcoming + live events for a league (without odds — useful to discover event IDs).',
    inputSchema: {
      type: 'object',
      properties: {
        sport_key: { type: 'string' },
        date_format: { type: 'string' },
        event_ids: { type: 'string' },
      },
      required: ['sport_key'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = (args._apiKey as string | undefined)?.trim();
  if (!apiKey) {
    throw new Error(
      'The Odds API requires a key. Contact the operator about platform credentials, or BYO via ?_apiKey=<key> after registering at https://the-odds-api.com/.',
    );
  }
  switch (name) {
    case 'list_sports': {
      const params = new URLSearchParams({ apiKey, all: String(args.all === true) });
      return oddsGet(`/sports?${params}`);
    }
    case 'get_odds': {
      const sportKey = reqStr(args, 'sport_key', '"americanfootball_nfl"');
      const params = new URLSearchParams({
        apiKey,
        regions: String(args.regions ?? 'us'),
        markets: String(args.markets ?? 'h2h'),
        oddsFormat: String(args.odds_format ?? 'american'),
        dateFormat: String(args.date_format ?? 'iso'),
      });
      if (args.bookmakers) params.set('bookmakers', String(args.bookmakers));
      if (args.event_ids) params.set('eventIds', String(args.event_ids));
      return oddsGet(`/sports/${encodeURIComponent(sportKey)}/odds?${params}`);
    }
    case 'get_event_odds': {
      const sportKey = reqStr(args, 'sport_key', '"americanfootball_nfl"');
      const eventId = reqStr(args, 'event_id', '"e1234abcd"');
      const params = new URLSearchParams({
        apiKey,
        regions: String(args.regions ?? 'us'),
        markets: String(args.markets ?? 'h2h'),
        oddsFormat: String(args.odds_format ?? 'american'),
      });
      return oddsGet(`/sports/${encodeURIComponent(sportKey)}/events/${encodeURIComponent(eventId)}/odds?${params}`);
    }
    case 'get_scores': {
      const sportKey = reqStr(args, 'sport_key', '"americanfootball_nfl"');
      const params = new URLSearchParams({
        apiKey,
        daysFrom: String(Math.min(3, Math.max(1, (args.days_from as number) ?? 1))),
      });
      return oddsGet(`/sports/${encodeURIComponent(sportKey)}/scores?${params}`);
    }
    case 'get_events': {
      const sportKey = reqStr(args, 'sport_key', '"americanfootball_nfl"');
      const params = new URLSearchParams({ apiKey, dateFormat: String(args.date_format ?? 'iso') });
      if (args.event_ids) params.set('eventIds', String(args.event_ids));
      return oddsGet(`/sports/${encodeURIComponent(sportKey)}/events?${params}`);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function oddsGet(path: string) {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' } });
  if (res.status === 401) throw new Error('Odds API: unauthorized — check key');
  if (res.status === 403) throw new Error('Odds API: quota exhausted');
  if (res.status === 422) {
    const t = await res.text();
    throw new Error(`Odds API bad request: ${t.slice(0, 200)}`);
  }
  if (res.status === 429) throw new Error('Odds API: rate-limit (HTTP 429)');
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Odds API error: ${res.status} ${t.slice(0, 200)}`);
  }
  return res.json();
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  }
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
