# @pipeworx/odds-api

The Odds API MCP — sportsbook odds across 70+ books for 30+ sports leagues (NFL, NBA, MLB, NHL, soccer, MMA, golf, tennis, esports, cricket, ...).

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1856+ live data sources. This is an independent, unofficial integration — not affiliated with, endorsed by, or published by the upstream provider.

## Tools

- `list_sports(all?)` — list available sports/leagues
- `get_odds(sport_key, regions?, markets?, odds_format?, date_format?, bookmakers?, events?)` — current odds
- `get_event_odds(sport_key, event_id, regions?, markets?)` — odds for a specific event (allows more markets like player props)
- `get_scores(sport_key, days_from?)` — live + recent final scores
- `get_events(sport_key, date_format?, event_ids?)` — list upcoming + live events
- `odds_api_quota()` — credits left and used this month on the key serving the call (free; costs no upstream credit)

## Auth

- **Platform key:** gateway env `PLATFORM_ODDS_API_KEY`
- **BYO:** `?_apiKey=<key>` after registering at https://the-odds-api.com/

Free tier: 500 requests/month. Each odds-payload market counts as 1 request. `list_sports`,
`get_events` and `odds_api_quota` are free — measured 2026-09-01, they do not draw down the
balance.

When the month's credits are spent, the metered tools (`get_odds`, `get_event_odds`, `get_scores`)
return `upstream_throttled` and a hint to bring your own key. Upstream answers an exhausted balance
with **HTTP 401**, the same status as a bad key, so read the message rather than the status:
`odds_api_quota` tells the two apart. Credits reset on the plan anniversary, not on the 1st of the
month, and nothing announces the reset.

`odds_api_quota` also adds `error: "account_limited"` and a plain-English `message` once the
balance hits zero. That is what makes a spent plan visible: the monitor's platform-key board probes
this pack through `odds_api_quota` precisely because it is free to call *and* able to fail. The
board previously probed `get_events`, which keeps answering 200 on a zero balance — so the four
metered tools were dark for eleven days in August 2026 with nothing reporting it. The wording of
that message is a contract with `workers/monitor`; `tests/odds-api-quota-visibility.test.ts`
holds the two together.

## Data source

`https://api.the-odds-api.com/v4/` — `?apiKey=` query.

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "odds-api": {
      "url": "https://gateway.pipeworx.io/odds-api/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/odds-api/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1856+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

Our odds-api key is reserved for paid accounts, so an anonymous call to `POST https://gateway.pipeworx.io/v1/tools/odds_api_list_sports` needs your own key passed as `_apiKey` alongside the arguments. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/odds_api_list_sports`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Run it from npm

`@pipeworx/mcp-odds-api` is a local stdio bridge to the Pipeworx gateway: your MCP client
starts it with `npx`, and it forwards every call to the same
`https://gateway.pipeworx.io/odds-api/mcp` endpoint shown above. It needs network access;
there is no offline mode.

```json
{
  "mcpServers": {
    "odds-api": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-odds-api"]
    }
  }
}
```

Without a key it calls anonymously, capped at 50 calls a day. A free account
raises that to 200 a day: get a key at https://pipeworx.io/signup and add
`"env": { "PIPEWORX_API_KEY": "<your key>" }` to the server entry.
The key is sent as a Bearer token, the same way a hosted connection sends it,
so calls are metered and billed exactly as they are there.

It lists **only** this pack's tools by default. Set `PIPEWORX_META_TOOLS=1` to
also list `ask_pipeworx` and the other gateway-wide tools.

Behind an HTTPS proxy: Node's built-in `fetch` does not read `HTTPS_PROXY` by
default. Newer Node releases honour it when `NODE_USE_ENV_PROXY=1` is set; check
your Node version's documentation.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Odds Api data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
