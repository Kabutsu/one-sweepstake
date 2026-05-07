# Product Requirements Document: One Sweepstake (2026 World Cup)

## Problem Statement

Users want to run friendly football sweepstakes with their friends for the 2026 FIFA World Cup, where participants are randomly assigned teams and can track match progress, see who's still in the competition, and chat together. Existing solutions either require manual match tracking, lack real-time updates, or are overly complex. The previous Euro 2024 app proved the concept but was tournament-specific, and the attempted OneSweepstake platform became too complex with scope creep and technical challenges around authentication and server-side rendering.

## Solution

One Sweepstake is a streamlined, mobile-first Single Page Application (SPA) that lets users create and join invite-only World Cup sweepstakes, automatically assigns teams through a random draw, displays live match scores and standings from the Football Data API, automatically tracks team eliminations, and provides real-time group chat. The app uses a simpler SPA architecture (avoiding Next.js SSR complications) while maintaining monorepo/monodeployment benefits, focuses solely on the 2026 World Cup to control scope, and implements robust authentication with magic email links.

## User Stories

1. As a sweepstake organizer, I want to create a new sweepstake for the 2026 World Cup, so that I can invite my friends to participate
2. As a sweepstake organizer, I want to receive a unique join code for my sweepstake, so that I can share it with specific people
3. As a participant, I want to join a sweepstake using a join code, so that I can participate in my friend's competition
4. As a new user, I want to sign up using only my email address (magic link), so that I don't have to remember another password
5. As a new user, I want to choose a display name during profile setup, so that my friends recognize me in the sweepstake
6. As a returning user, I want to be automatically redirected to the dashboard after clicking a magic link, so that I don't have to set up my profile again
7. As a sweepstake organizer, I want to perform a random team draw once everyone has joined, so that teams are assigned fairly
8. As a sweepstake organizer, I want to prevent new people from joining after the draw, so that the competition is locked in
9. As a participant, I want to see which team(s) I've been assigned, so that I know who I'm rooting for
10. As a participant, I want to see all other participants and their assigned teams, so that I know who's rooting for whom
11. As a participant, I want to see live match scores for World Cup games, so that I know how my team is performing
12. As a participant, I want to see when my team has been eliminated, so that I know I'm out of the competition
13. As a participant, I want to see a leaderboard showing who's still in the competition, so that I can track the standings
14. As a participant, I want to chat with other participants in real-time, so that we can banter and discuss the matches
15. As a participant, I want to see chat history when I join a conversation, so that I can catch up on what I missed
16. As a participant, I want to participate in multiple sweepstakes simultaneously, so that I can join different friend groups
17. As a participant, I want the app to work seamlessly on my phone, so that I can check scores and chat while watching matches
18. As a participant, I want to see when teams are eliminated from the group stage, so that I know if I'm still in contention
19. As a participant, I want to see bracket/knockout stage progress, so that I can follow the tournament structure
20. As a sweepstake organizer, I want to create a sweepstake even after the tournament has started, so that I'm not locked out if I'm late
21. As a participant, I want to see team logos and match details, so that the app is visually appealing and informative
22. As a user, I want to clearly see whether I'm logged in or logged out, so that I'm not confused about my session state
23. As a user, I want to log out securely, so that my account is protected on shared devices
24. As a user, I want my login session to persist across browser refreshes, so that I don't have to re-authenticate constantly
25. As a participant, I want to see match schedules and upcoming games, so that I know when to check back for updates
26. As a participant, I want to see the group stage standings, so that I can track which teams are advancing
27. As a participant, I want cached match data to load quickly, so that the app feels responsive
28. As a participant, I want to receive updated match scores within a reasonable timeframe (1-2 minutes), so that the app feels "live" without being unreliable
29. As a sweepstake organizer, I want to see how many participants have joined vs. the maximum, so that I know when to do the draw
30. As a participant, I want to see timestamp information on chat messages, so that I know when messages were sent
31. As a participant, I want to see who sent each chat message, so that I can follow the conversation
32. As the app administrator, I want to manually configure team seedings in the database, so that the draw algorithm can weight favorites vs. underdogs
33. As a participant, I want the draw to distribute teams fairly based on seeding, so that no one gets all the favorites
34. As a user, I want clear error messages when something goes wrong, so that I understand what happened
35. As a user, I want to see loading states while data is being fetched, so that I know the app is working
36. As a participant, I want to navigate between my different sweepstakes easily, so that I can manage multiple groups
37. As a participant, I want to see a dashboard showing all my active sweepstakes, so that I have a central place to start
38. As a sweepstake organizer, I want to set a maximum number of participants, so that I can control the group size
39. As a participant, I want to be prevented from joining a full sweepstake, so that I'm not confused when the draw doesn't include me
40. As a user, I want the app to work in all modern browsers (Chrome, Firefox, Safari, Edge), so that I'm not restricted in my choice
41. As a user with a slow connection, I want the app to handle network errors gracefully, so that I don't lose data or get stuck
42. As a participant, I want to see which stage of the tournament we're in (group stage, round of 16, etc.), so that I have context
43. As a participant viewing on mobile, I want a streamlined interface optimized for small screens, so that the app is usable on the go
44. As a participant viewing on desktop, I want to take advantage of the larger screen for better visibility, so that I can see more information at once
45. As a user, I want consistent styling and branding throughout the app, so that the experience feels polished
46. As a participant, I want to see a visual indicator when new chat messages arrive, so that I know to check the chat
47. As a sweepstake organizer, I want to see a clear "Draw Teams" button before the draw, so that I know how to proceed
48. As a sweepstake organizer, I want confirmation before executing the draw, so that I don't trigger it accidentally
49. As a participant, I want to see a notification or status when the draw has been completed, so that I know to check my team
50. As a user, I want the authentication flow to work reliably without showing/hiding UI elements incorrectly, so that I have confidence in the app

## Implementation Decisions

### Architecture

**Monorepo with Single Deployment**

- Use Next.js as a deployment wrapper and monorepo structure, but implement the entire frontend as a pure Single Page Application (SPA)
- Single `/pages/index.tsx` entry point that loads the React application
- React Router handles all client-side routing within that single page
- `/pages/api/*` routes provide tRPC backend endpoints
- Deploy as a single application to Vercel
- This approach provides monorepo/monodeployment benefits while avoiding Next.js SSR complications (layouts, server/client boundaries, sluggish feel)

**Technology Stack**

- Frontend: React with React Router for client-side routing
- Backend: Next.js API routes with tRPC for type-safe API calls
- Database: Supabase PostgreSQL with Drizzle ORM
- Styling: Tailwind CSS for mobile-first responsive design
- Real-time: WebSockets (Socket.io) or Supabase Realtime for chat
- External API: Football Data API for match data and team information
- Authentication: NextAuth.js with SMTP2Go email provider for magic links (fallback: Supabase Auth with robust session management)
- Deployment: Vercel

**Authentication Flow**

1. User enters email on landing page
2. Magic link sent via SMTP2Go
3. User clicks link → authenticates → checks if profile exists
4. If new user: redirect to profile setup page (enter display name)
5. If existing user: redirect to dashboard
6. Use JWT tokens with httpOnly cookies for session management
7. Implement robust "isAuthenticated" checks using a React context/hook that reliably tracks login state
8. Clear session indicators in UI (e.g., user avatar/name in header when logged in)
9. Secure logout that clears session on both client and server

**Database Schema**

- Use the existing Drizzle schema (already provided in `db/schema.ts`)
- Tournaments table: stores World Cup 2026 data (API ID, dates, seeding config)
- Sweepstakes table: each instance of a sweepstake group
- Users table: user profiles (email, display name)
- Participants table: join table linking users to sweepstakes
- Team Assignments table: which teams are assigned to which participants
- Match Cache table: cached data from Football Data API
- Chat Messages table: messages within each sweepstake
- Tournament seeding data stored in `seedingConfig` JSONB field for MVP (manual DB entry)

**Routing Structure**

- `/` - Landing page (if not logged in) or redirect to dashboard (if logged in)
- `/auth/verify` - Magic link destination for email verification
- `/auth/setup` - Profile setup for new users
- `/dashboard` - Main dashboard showing user's sweepstakes
- `/sweepstake/create` - Create new sweepstake form
- `/sweepstake/join` - Join sweepstake with code
- `/sweepstake/:id` - Individual sweepstake view (teams, chat, standings)
- `/sweepstake/:id/draw` - Draw interface for organizers (pre-draw only)
- All routes implemented as client-side routes within React Router

### Football Data API Integration

**Match Data Fetching**

- Background job (cron or interval) polls Football Data API every 1-2 minutes during active match times
- Store raw match data in `match_cache` table with `lastFetchedAt` timestamp
- Cache responses to avoid rate limits
- Update match status, scores, and scheduled times
- Match states: SCHEDULED, IN_PLAY, PAUSED, FINISHED, etc.

**Team Elimination Logic**

- After group stage: teams not in top 2 of their group are marked eliminated
- After knockout rounds: losing team is marked eliminated
- Elimination status computed from match results, not manually set
- Display elimination status on participant's team assignments

**Tournament Data Structure**

- 2026 World Cup: 48 teams, 12 groups of 4 teams each
- Group stage: 3 matches per team (round-robin within group)
- Top 2 from each group advance to round of 32 knockout stage
- Seeding data: manually configured in database for MVP (JSON structure mapping teams to seed tier/rating)

### Draw Algorithm

**Seeded Random Draw**

- Participants divided into pots based on number of teams and seeding data
- Each pot contains teams of similar strength (based on seeding config)
- Teams randomly assigned to participants, drawing from pots in order
- Ensures relatively balanced distribution of favorites vs. underdogs
- Algorithm runs server-side via tRPC mutation
- Results stored in `team_assignments` table
- Draw is one-time and irreversible (re-draw as future stretch goal)
- Lock sweepstake after draw: `drawCompletedAt` timestamp set, no new joins allowed

### Real-time Chat

**Implementation Options**

1. **Socket.io**: Custom WebSocket server integrated with Next.js API
2. **Supabase Realtime**: Use existing Supabase infrastructure for subscriptions

**Chat Features**

- Messages scoped to individual sweepstake (one chat room per sweepstake)
- Messages stored in `chat_messages` table
- Display user display name with each message
- Show timestamp for each message
- Load recent message history on joining chat (e.g., last 100 messages)
- Auto-scroll to latest message
- Simple text-only messages (no images/emojis for MVP)
- No moderation features needed

### Leaderboard and Standings

**Leaderboard Logic**

- Show all participants in the sweepstake
- Group by status: "Still In" vs. "Eliminated"
- "Still In" = at least one assigned team is not eliminated
- Order by number of teams still in competition (descending)
- Display team names, logos, and elimination status for each participant
- Winner-takes-all format: last person with a team in wins
- Optional: show 2nd place as the person with the finalist who didn't win

**Match Display**

- Show live scores for ongoing matches
- Show results for completed matches
- Show schedule for upcoming matches
- Display team logos and names
- Group stage: show group standings table
- Knockout stage: show bracket visualization

### Error Handling and Edge Cases

**Authentication Edge Cases**

- Expired magic links: show error, offer to resend
- Invalid tokens: redirect to login
- Session expiry during usage: show re-authentication prompt
- Multiple browser tabs: sync login state across tabs (use localStorage events)

**Sweepstake Edge Cases**

- Attempting to join after draw: show error message
- Attempting to join full sweepstake: show error message
- Invalid join codes: show error message
- Draw attempted with insufficient participants: require minimum (e.g., 2 participants)
- Duplicate team assignments: prevented by unique constraint in DB

**API Failures**

- Football Data API down: show cached data with "last updated" timestamp
- Rate limit exceeded: extend polling interval, show warning
- Invalid API response: log error, continue showing cached data

**Network Issues**

- Lost WebSocket connection: attempt reconnection with exponential backoff
- Failed tRPC calls: show error toast, allow retry
- Slow loading: show skeleton states and loading indicators

## Testing Decisions

### What Makes a Good Test

Tests should validate external behavior and interfaces, not implementation details. Focus on user-facing functionality and API contracts. Avoid testing internal state or private functions. Tests should be resilient to refactoring as long as behavior remains the same.

### Modules to Test

**1. Draw Algorithm**

- Test that all participants receive teams
- Test that seeding distribution is balanced
- Test edge cases (odd number of participants, insufficient teams, etc.)
- Test that the same sweepstake cannot be drawn twice
- Mock database calls and test pure logic

**2. Team Elimination Logic**

- Test that teams are correctly marked eliminated based on match results
- Test group stage elimination (not in top 2)
- Test knockout elimination (loss in single-elimination match)
- Mock match cache data and verify elimination status computation

**3. Authentication Flow**

- Test magic link generation and verification
- Test session creation and persistence
- Test logout clears session properly
- Test redirect logic (new vs. returning users)
- Mock email sending and token generation

**4. tRPC API Endpoints**

- Test each mutation and query with valid inputs
- Test error cases (unauthorized, invalid data, etc.)
- Test authorization (e.g., only creator can trigger draw)
- Use tRPC's built-in testing utilities

**5. Match Data Sync**

- Test that Football Data API responses are correctly parsed and stored
- Test cache invalidation logic
- Test handling of API errors
- Mock external API calls

### Prior Art

- The Euro 2024 app likely has tests for sweepstake creation and draw logic that can be referenced
- Use React Testing Library for component tests if needed (though focus should be on backend logic)
- tRPC provides testing patterns for API routes
- Drizzle ORM can use in-memory SQLite for database tests

### Testing Strategy

- Focus on testing the backend business logic (draw, elimination, API sync)
- Use integration tests for tRPC endpoints
- Frontend testing less critical for MVP (manual testing acceptable)
- E2E tests for critical flows (auth, create sweepstake, join, draw) can be added post-MVP

## Out of Scope

### Explicitly Excluded from MVP

1. **Multi-tournament support**: Only 2026 World Cup for initial launch. Admin panel for managing tournaments is a stretch goal.
2. **Social authentication**: No Google, Facebook, or other OAuth providers. Magic links only.
3. **Public sweepstakes**: All sweepstakes are private and invite-only with join codes.
4. **User-to-user direct messaging**: Only group chat within sweepstakes, no DMs.
5. **Betting or gambling features**: No money, wagering, or prizes integrated into the app.
6. **Historical tournament archives**: Past tournaments not displayed in MVP (stretch goal for post-World Cup).
7. **Avatar uploads**: Display name only, no profile pictures (stretch goal).
8. **Re-drawing teams**: Draw is one-time and final (stretch goal to add re-draw).
9. **Advanced admin panel**: No in-app tournament management for MVP (stretch goal).
10. **Mobile native apps**: Web-only, though mobile-first responsive design.
11. **Notifications**: No push notifications or email alerts for matches/chat.
12. **Team/player statistics**: Only basic match scores and results, no detailed stats.
13. **Custom scoring rules**: Winner-takes-all only, no point systems or customization.
14. **Sweepstake privacy settings beyond invite-only**: No public listings, discovery, or search.
15. **User profiles beyond display name**: No bios, location, favorite teams, etc.
16. **Joining after draw**: Locked after draw is completed.
17. **Chat moderation tools**: No message deletion, user blocking, or reporting.
18. **Internationalization**: English only.
19. **Accessibility features beyond basic responsive design**: WCAG compliance is not a priority for MVP.
20. **Analytics and metrics**: No user tracking or analytics dashboard.

### Potential Future Enhancements (Post-MVP)

- Admin panel for adding/editing tournaments without code changes
- Support for multiple concurrent tournaments
- Re-draw functionality for organizers
- Avatar uploads and richer user profiles
- Historical tournament archives and past sweepstake results
- Advanced chat features (reactions, threading, etc.)
- Email/push notifications for important events
- Mobile native apps (iOS/Android)
- Custom scoring rules and point systems
- Public or discoverable sweepstakes

## Further Notes

### MVP Success Criteria

The MVP is successful if:

1. Users can create and join sweepstakes before the 2026 World Cup begins
2. The draw algorithm fairly distributes teams
3. Match scores update automatically within 1-2 minutes of real results
4. Team elimination tracking works correctly
5. Real-time chat functions reliably
6. The app is usable on mobile devices
7. Authentication works without the bugs experienced in the previous OneSweepstake implementation

### Launch Timeline

- **Pre-tournament (before June 2026)**: Complete MVP and deploy to production
- **During tournament (June-July 2026)**: Monitor for bugs, ensure API integration remains stable, provide support
- **Post-tournament (August 2026+)**: Evaluate feedback, consider stretch goals and enhancements

### Development Philosophy

- **Scope control is critical**: This PRD intentionally limits scope to avoid the complexity issues of the original OneSweepstake
- **Simplicity over features**: When in doubt, leave it out. Every feature adds complexity.
- **Mobile-first**: Design and test on mobile throughout development
- **Focus on reliability**: Robust auth and stable real-time features are more important than additional features
- **Reuse what works**: The database schema is solid, Football Data integration is proven

### Technical Risks

1. **NextAuth + SMTP2Go integration**: If this proves difficult, fallback to Supabase Auth with improved implementation
2. **Real-time chat scaling**: If many sweepstakes are active during popular matches, WebSocket connections may strain resources
3. **Football Data API reliability**: Have fallback strategies if API is slow or down during critical matches
4. **Draw algorithm fairness**: Seeding data quality directly impacts perceived fairness
5. **Mobile performance**: Ensure the SPA performs well on older mobile devices

### Data Seeding for MVP

For the MVP launch, manually insert into the database:

- Tournament record for 2026 FIFA World Cup (API ID from Football Data, dates, team count)
- Seeding configuration JSON mapping the 48 teams to tiers/ratings (can be based on FIFA rankings)
- This avoids building an admin panel before the MVP is validated

Post-MVP, an admin panel can be built to manage this data dynamically.

### Branding and Design

- Simple, clean design with football/soccer theming
- World Cup official colors and branding where appropriate (without violating trademarks)
- Mobile-optimized card-based layouts
- Clear call-to-action buttons
- Minimal animations to avoid performance issues
- Focus on readability and usability over flashy design

### Security Considerations

- Magic link tokens should expire after 15-30 minutes
- Join codes should be random and sufficiently long to prevent guessing
- tRPC endpoints should validate user authentication and authorization
- Protect against SQL injection (Drizzle handles this)
- Rate limiting on sensitive endpoints (email sending, draw execution)
- HTTPS only in production
- Secure session cookies (httpOnly, secure, sameSite)
