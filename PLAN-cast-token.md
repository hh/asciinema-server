# Feature: Pre-allocated Cast Token

## Summary

When a streaming **session** starts (recording begins), pre-generate the `cast_token` that will be used for the eventual recording URL (`/a/{cast_token}`). This allows clients to know the permanent recording URL while streaming is in progress.

## Branch Name
`feature/pre-allocated-cast-token`

## Current Behavior
1. Stream resource created → `public_token` and `producer_token` generated
2. Streaming session starts → `start_recording()` → `create_asciicast_file()` creates temp file
3. Streaming session ends → `end_recording()` → `Recordings.create_asciicast()` generates NEW `secret_token`
4. Recording URL is unknown until after session ends

## New Behavior
1. Stream resource created → `public_token` and `producer_token` generated (unchanged)
2. Streaming session starts → `create_asciicast_file()` generates `cast_token`, stores in state
3. API can return `cast_url` for active sessions via stream info endpoint
4. Streaming session ends → `end_recording()` passes `cast_token` to `create_asciicast()`
5. Recording URL is known from the start of each session

**Key insight**: One stream can have multiple recording sessions. Each session gets its own `cast_token` at start time.

## Files to Modify

### 1. StreamServer State - Store cast_token
**File:** `lib/asciinema/streaming/stream_server.ex`

Add `cast_token` to initial state (~line 75):
```elixir
state = %{
  stream_id: stream_id,
  stream: stream,
  vt: nil,
  vt_size: nil,
  last_event_id: 0,
  path: nil,
  writer: nil,
  user_agent: nil,
  dvr_mode: false,
  cast_token: nil  # ADD THIS
}
```

### 2. StreamServer - Generate Token at Recording Start
**File:** `lib/asciinema/streaming/stream_server.ex`

Update `create_asciicast_file` function (~line 398-450):
```elixir
defp create_asciicast_file(
       state,
       cols,
       rows,
       term_init,
       theme
     ) do
  mode = recording_mode()
  dvr_mode = mode == :dvr

  # Generate cast_token at recording start
  cast_token = Crypto.random_token(16)

  path =
    if dvr_mode do
      live_path = build_live_recording_path(state.stream)
      archive_existing_dvr(live_path)
      live_path
    else
      Briefly.create!()
    end

  timestamp = Timex.to_unix(Timex.now())
  # ... rest of function ...

  %{state |
    path: path,
    writer: writer,
    dvr_mode: dvr_mode,
    cast_token: cast_token  # ADD THIS
  }
end
```

### 3. StreamServer - Pass Token to create_asciicast
**File:** `lib/asciinema/streaming/stream_server.ex`

Update `end_recording` function (~line 369-396):
```elixir
defp end_recording(%{writer: writer} = state) do
  Logger.info("stream/#{state.stream_id}: creating recording")

  :ok = V3.close(writer)

  upload = %Plug.Upload{
    path: state.path,
    content_type: "application/x-asciicast",
    filename: "stream.cast"
  }

  fields = %{
    stream_id: state.stream_id,
    user_agent: state.user_agent,
    secret_token: state.cast_token  # ADD THIS - use pre-allocated token
  }

  {:ok, _} = Recordings.create_asciicast(state.stream.user, upload, fields)

  unless state.dvr_mode do
    File.rm(state.path)
  end

  %{state | path: nil, writer: nil, dvr_mode: false, cast_token: nil}
end
```

### 4. Recordings Context - Accept Optional Token
**File:** `lib/asciinema/recordings.ex`

Update `create_asciicast` function (~line 182-213):
```elixir
def create_asciicast(user, %Plug.Upload{filename: filename} = upload, fields \\ %{}) do
  # Use provided secret_token or generate new one
  secret_token = fields[:secret_token] || generate_secret_token()

  attrs =
    Map.merge(
      %{
        filename: filename,
        visibility: user.default_recording_visibility,
        secret_token: secret_token  # Use the variable
      },
      Map.delete(fields, :secret_token)  # Remove from fields to avoid duplication
    )
  # ... rest of function ...
end
```

### 5. StreamServer - Expose cast_token via Handle Call
**File:** `lib/asciinema/streaming/stream_server.ex`

Add a handle_call to query current cast_token (~line 150):
```elixir
@impl true
def handle_call(:get_cast_token, _from, state) do
  {:reply, state.cast_token, state}
end
```

Add public function:
```elixir
def get_cast_token(stream_id) do
  case Registry.lookup(Streaming.Registry, stream_id) do
    [{pid, _}] -> GenServer.call(pid, :get_cast_token)
    [] -> nil
  end
end
```

### 6. API - Include cast_url in Stream Info
**File:** `lib/asciinema_web/controllers/api/stream_json.ex`

Update the stream JSON rendering to include `cast_url` when available:
```elixir
def render("show.json", %{stream: stream}) do
  base = %{
    id: stream.id,
    # ... existing fields ...
    url: url(~p"/s/#{stream}"),
    ws_producer_url: ws_producer_url(stream)
  }

  # Add cast_url if there's an active session with a cast_token
  case Streaming.StreamServer.get_cast_token(stream.id) do
    nil -> base
    token -> Map.put(base, :cast_url, url(~p"/a/#{token}"))
  end
end
```

## API Response Examples

### During Active Streaming Session
```json
{
  "id": 141,
  "title": "tinkerbell",
  "url": "https://asciinema.mcclimans.net/s/IRmeP3woTw8Areo7",
  "ws_producer_url": "wss://asciinema.mcclimans.net/ws/S/7BdIPCiNQdHWEYuq",
  "cast_url": "https://asciinema.mcclimans.net/a/XyZ123AbC456"
}
```

### No Active Session (stream idle)
```json
{
  "id": 141,
  "title": "tinkerbell",
  "url": "https://asciinema.mcclimans.net/s/IRmeP3woTw8Areo7",
  "ws_producer_url": "wss://asciinema.mcclimans.net/ws/S/7BdIPCiNQdHWEYuq"
}
```

Note: `cast_url` is only present when there's an active recording session. Once the stream ends and the recording is created, query the recordings API or parse the stream page to find it.

## Testing

1. Start streaming to a stream:
   ```bash
   asciinema session --stream-remote wss://server/ws/S/{producer_token} -- echo "test"
   ```

2. While streaming is active, query the stream API:
   ```bash
   curl -u "user:$INSTALL_ID" "https://server/api/v1/streams/{id}"
   ```

   Should return `cast_url` in response.

3. Let stream end properly, verify recording exists at the pre-allocated `cast_url`.

4. Start a new session on the same stream - should get a NEW `cast_url`.

## Backward Compatibility

- Old recordings (created without pre-allocated token) work unchanged
- Old streams continue to work - they just won't have `cast_url` until a new session starts
- The `secret_token` field in recordings accepts the pre-allocated value but doesn't require it
- Existing behavior (generate new token) still works if no `cast_token` is provided

## Rollback Plan

If issues arise:
1. Remove the `cast_token` from StreamServer state
2. Remove the `secret_token` field passing in `end_recording`
3. `create_asciicast` falls back to generating new token as before
4. No database migration needed - this is all in-memory state

## Future Enhancements

Once server support is complete:
1. **CLI**: Parse `cast_url` from API response, display to user
2. **ob-tmux**: Store `cast_url` in org file metadata at stream start
3. **Player**: Could show "recording will be available at..." during live streams
