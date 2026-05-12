# Verify Supabase Realtime Setup

If messages aren't appearing in real-time, follow these steps to diagnose:

## 1. Check Browser Console

Open the browser console (F12) and look for `[Realtime]` logs when:

- The chat tab loads (should see "Setting up subscription" and "Successfully subscribed")
- Someone sends a message (should see "Received message")

**Expected logs:**

```
[Realtime] Setting up subscription for sweepstake: <uuid>
[Realtime] Subscription status: SUBSCRIBED
[Realtime] Successfully subscribed to chat channel
```

**When another user sends a message:**

```
[Realtime] Received message: {payload}
[Realtime] Processing message from other user
[Realtime] Adding new message to state
```

## 2. Check Connection Status

Look at the chat UI - there's a connection indicator in the top-right of the chat:

- 🟢 Green dot = Connected (good!)
- 🟡 Yellow pulsing = Connecting (wait a moment)
- 🔴 Red dot = Disconnected or Error (problem!)

## 3. Verify Supabase Realtime is Enabled

**Via Supabase Dashboard:**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Database** → **Replication**
4. Find `chat_messages` in the table list
5. Toggle it **ON** if it's not already enabled

**Via SQL (alternative):**

```sql
-- Check if replication is enabled
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'chat_messages';

-- If no results, enable it:
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
```

## 4. Check RLS Policies

Run this SQL in Supabase SQL Editor:

```sql
-- Check if RLS is disabled (should return 'f')
SELECT relrowsecurity
FROM pg_class
WHERE relname = 'chat_messages';

-- If it returns 't', disable RLS:
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
```

## 5. Test Realtime Directly

Open two browser windows side-by-side:

1. Log in as different users in each
2. Join the same sweepstake
3. Open the chat tab in both
4. Verify both show "Connected" (green dot)
5. Send a message from Window 1
6. Check console in Window 2 for `[Realtime] Received message`

## 6. Common Issues & Fixes

### Issue: Status shows "Connecting" forever (yellow pulsing)

**Cause:** Realtime replication not enabled
**Fix:** Enable in Database → Replication (step 3 above)

### Issue: Status shows "Connected" but no messages appear

**Cause:**

- RLS policies blocking reads
- Wrong filter in subscription
- Browser console shows errors

**Fix:**

- Disable RLS (step 4)
- Check browser console for errors
- Verify `sweepstake_id` filter matches

### Issue: Console shows "CHANNEL_ERROR"

**Cause:** Invalid subscription configuration
**Fix:**

- Check Supabase project settings
- Verify API keys are correct
- Check Supabase project is not paused

### Issue: Messages appear after refresh but not in real-time

**Cause:** Subscription not receiving events (most common: replication disabled)
**Fix:** Enable replication (step 3)

## 7. Network/Firewall Check

If connection shows "Disconnected":

1. Check if WebSocket connections are blocked by firewall/proxy
2. Verify `wss://` connections are allowed
3. Test on different network (e.g., mobile hotspot)

## Still Not Working?

Run this complete diagnostic:

```sql
-- 1. Check table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'chat_messages'
);

-- 2. Check replication status
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';

-- 3. Check RLS status
SELECT tablename, relrowsecurity
FROM pg_class
JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
WHERE nspname = 'public'
AND relname = 'chat_messages';

-- 4. Test insert (should work)
INSERT INTO chat_messages (sweepstake_id, user_id, message)
VALUES (
  '<your-sweepstake-id>',
  '<your-user-id>',
  'Test message'
);
```

Share the results if you need more help debugging.
