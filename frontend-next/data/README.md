# Standings data

The matchweek dashboard fetches current standings, saved predicted standings,
and fixtures directly from the backend for the selected league. Set
`NEXT_PUBLIC_API_URL` to the backend origin (with or without `/api`).

Predicted tables are the latest saved database snapshots. The API does not
provide their update time or individual fixture scores, so the dashboard does
not infer either from differences between tables. Fixture cards request fresh
individual predictions; they may differ from the saved table. Missing predicted snapshots
and backend failures are shown as errors; current standings and fixtures load
independently.

The JSON snapshots and snapshot scripts in this directory are legacy offline
artifacts. They are not used by the dashboard or the team selector.
