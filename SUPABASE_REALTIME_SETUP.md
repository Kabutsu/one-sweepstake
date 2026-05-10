# Supabase Realtime Setup for Chat

This document describes the Supabase Realtime configuration needed for the chat feature.

## Database Configuration

The `chat_messages` table is already defined in the schema. To enable Realtime subscriptions, you need to:

### 1. Enable Realtime for the chat_messages table

In Supabase Dashboard:
1. Go to Database > Replication
2. Find the `chat_messages` table
3. Enable replication for this table

Or via SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
```

### 2. Row Level Security (RLS)

The application uses its own JWT-based authentication system (not Supabase Auth). Access control is handled at the application level via tRPC middleware, which verifies that users are participants in the sweepstake before allowing them to read or send messages.

For the Realtime subscription, RLS should be **disabled** on the `chat_messages` table since the application handles authorization:

```sql
-- Disable RLS on chat_messages (application handles authorization)
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
```

The application ensures security by:
- Verifying user authentication via JWT tokens before allowing any tRPC calls
- Checking participant membership in the `getMessages` and `sendMessage` procedures
- Filtering Realtime messages client-side to only show messages from the current sweepstake

## Environment Variables

Ensure the following environment variables are set in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Your Supabase publishable (anon) key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (server-side only)

## How It Works

1. **Message History**: Messages are fetched via tRPC with cursor-based pagination (50 messages per page)
2. **Real-time Updates**: New messages are broadcast via Supabase Realtime using Postgres Changes
3. **Optimistic Updates**: When sending a message, it appears immediately (optimistically) and is confirmed when the server responds
4. **Infinite Scrolling**: Scrolling to the top loads more message history
5. **Connection Status**: Visual indicator shows the Realtime connection status

## Features

- ✅ Real-time message broadcasting
- ✅ Optimistic updates for sent messages
- ✅ Infinite scrolling for message history
- ✅ Auto-scroll to latest message
- ✅ New message indicator when scrolled up
- ✅ Connection status indicator
- ✅ Mobile-responsive design
- ✅ Message timestamps
- ✅ User display names and avatars
