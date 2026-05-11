# Match Polling Setup

## Overview

The match caching system automatically adapts its polling frequency based on tournament status:

- **Pre-tournament** (30 days before → start): Poll once per day
- **Active tournament** (start → end): Poll every 2 minutes  
- **Post-tournament** (end → 2 days after): Poll once per day
- **Outside window**: No polling

Old matches (>30 days after completion) are automatically cleaned up to save database space.

## Endpoints

### `GET /api/polling-recommendation`

Returns recommended polling intervals for all active tournaments.

**Response:**
```json
{
  "recommendedIntervalMinutes": 2,
  "tournaments": [{
    "tournamentId": "...",
    "tournamentName": "FIFA World Cup",
    "shouldPoll": true,
    "intervalMinutes": 2,
    "reason": "Tournament in progress: frequent polling for live scores",
    "tournamentPhase": "active"
  }]
}
```

### `POST/GET /api/poll-matches`

Fetches and caches matches from Football Data API. Requires authentication.

**Headers:**
```
Authorization: Bearer <CRON_SECRET>
```

**Response:**
```json
{
  "message": "Match polling completed",
  "timestamp": "2026-06-11T12:00:00Z",
  "results": [{
    "tournamentId": "...",
    "tournamentName": "FIFA World Cup",
    "phase": "active",
    "recommendedIntervalMinutes": 2,
    "created": 5,
    "updated": 67,
    "deleted": 2
  }]
}
```

## Setup Options

### 1. Vercel Cron (Recommended for Vercel deployments)

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/poll-matches",
      "schedule": "*/2 * * * *"
    }
  ]
}
```

**Note:** Vercel cron doesn't support dynamic intervals, so this polls every 2 minutes regardless of tournament phase. This is fine during active tournaments but wastes API calls pre-tournament. Consider using an external service for adaptive polling.

### 2. GitHub Actions (Adaptive polling)

Create `.github/workflows/poll-matches.yml`:
```yaml
name: Poll Match Data

on:
  schedule:
    # Check every 2 hours to see if we should poll
    - cron: '0 */2 * * *'
  workflow_dispatch: # Allow manual triggers

jobs:
  poll:
    runs-on: ubuntu-latest
    steps:
      - name: Check polling recommendation
        id: check
        run: |
          RECOMMENDATION=$(curl -s https://yourdomain.com/api/polling-recommendation)
          SHOULD_POLL=$(echo $RECOMMENDATION | jq -r '.tournaments[0].shouldPoll')
          INTERVAL=$(echo $RECOMMENDATION | jq -r '.recommendedIntervalMinutes')
          echo "should_poll=$SHOULD_POLL" >> $GITHUB_OUTPUT
          echo "interval=$INTERVAL" >> $GITHUB_OUTPUT

      - name: Poll matches
        if: steps.check.outputs.should_poll == 'true'
        run: |
          curl -X POST https://yourdomain.com/api/poll-matches \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### 3. External Cron Service (e.g., cron-job.org)

For adaptive polling, create two jobs:

**Job 1: Pre-tournament (Once daily at 3am)**
- URL: `https://yourdomain.com/api/poll-matches`
- Schedule: `0 3 * * *`
- Header: `Authorization: Bearer <CRON_SECRET>`
- Active: May 12 - June 10, 2026

**Job 2: Active tournament (Every 2 minutes)**
- URL: `https://yourdomain.com/api/poll-matches`
- Schedule: `*/2 * * * *`
- Header: `Authorization: Bearer <CRON_SECRET>`
- Active: June 11 - July 19, 2026

### 4. Manual Polling

For development or one-off updates:
```bash
pnpm cache:populate
```

Or hit the endpoint directly:
```bash
curl -X POST http://localhost:3000/api/poll-matches \
  -H "Authorization: Bearer your-cron-secret"
```

## Environment Variables

```bash
# .env.local
CRON_SECRET=your-random-secret-key
FOOTBALL_DATA_API_KEY=your-football-data-api-key
```

Generate a secure `CRON_SECRET`:
```bash
openssl rand -base64 32
```

## Monitoring

Check polling status:
```bash
curl https://yourdomain.com/api/polling-recommendation
```

This returns current recommendations without triggering a poll.
