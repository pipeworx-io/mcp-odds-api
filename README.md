# @pipeworx/odds-api

The Odds API MCP — sportsbook odds across 70+ books for 30+ sports leagues (NFL, NBA, MLB, NHL, soccer, MMA, golf, tennis, esports, cricket, ...).

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

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

Free tier: 500 requests/month. Each odds-payload market counts as 1 request. `list_sports` and
`odds_api_quota` are free — they do not draw down the balance.

When the month's credits are spent, the metered tools return `upstream_throttled` and a hint to
bring your own key. Upstream answers an exhausted balance with **HTTP 401**, the same status as a
bad key, so read the message rather than the status: `odds_api_quota` tells the two apart.
Credits reset on the plan anniversary, not on the 1st of the month.

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

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

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
