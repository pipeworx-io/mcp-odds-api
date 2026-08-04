# @pipeworx/odds-api

The Odds API MCP — sportsbook odds across 70+ books for 30+ sports leagues (NFL, NBA, MLB, NHL, soccer, MMA, golf, tennis, esports, cricket, ...).

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `list_sports(all?)` — list available sports/leagues
- `get_odds(sport_key, regions?, markets?, odds_format?, date_format?, bookmakers?, events?)` — current odds
- `get_event_odds(sport_key, event_id, regions?, markets?)` — odds for a specific event (allows more markets like player props)
- `get_scores(sport_key, days_from?)` — live + recent final scores
- `get_events(sport_key, date_format?, event_ids?)` — list upcoming + live events

## Auth

- **Platform key:** gateway env `PLATFORM_ODDS_API_KEY`
- **BYO:** `?_apiKey=<key>` after registering at https://the-odds-api.com/

Free tier: 500 requests/month. Each odds-payload market counts as 1 request.

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Odds Api data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
