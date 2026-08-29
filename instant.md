BlinkShare's Direct engine

                    BLINKSHARE DIRECT
                           │
                     File / Folder
                           │
                           ▼
                    Streaming Reader
                           │
                           ▼
                 ┌─────────────────────┐
                 │ Adaptive Processing │
                 │                     │
                 │ Compress?           │
                 │ Hash?               │
                 │ Chunk               │
                 └──────────┬──────────┘
                            │
                            ▼
                    Send Buffer
                            │
                     backpressure
                            │
                            ▼
                  WebRTC DataChannel
                            │
                    ═══════════════
                       INTERNET
                    ═══════════════
                            │
                            ▼
                  WebRTC DataChannel
                            │
                            ▼
                    Receive Buffer
                            │
                 ┌──────────┴──────────┐
                 │                     │
              decrypt               decompress
                 │                     │
                 └──────────┬──────────┘
                            ▼
                      Disk Writer
                            │
                            ▼
                     Complete File

Supabase

                 SUPABASE REALTIME
                       │
             signaling only
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
         Sender                 Receiver
            ╲                     ╱
             ╲                   ╱
              ════ WebRTC ══════
                    FILE

The optimization hierarchy I'd follow

If your objective is "FAST FAST", I'd prioritize things in roughly this order:

1. Direct P2P connectivity ⭐⭐⭐⭐⭐
Avoid TURN whenever possible.

2. Efficient DataChannel flow control ⭐⭐⭐⭐⭐
Keep the network pipeline full without overflowing buffers.

3. Streaming instead of loading files into RAM ⭐⭐⭐⭐⭐

4. Large, tuned chunks ⭐⭐⭐⭐

5. Parallel/pipelined disk → processing → network ⭐⭐⭐⭐

6. Web Workers for CPU-heavy processing ⭐⭐⭐⭐

7. Minimize memory copies ⭐⭐⭐

8. Adaptive compression ⭐⭐⭐
Great for text/raw data, pointless for JPEG/MP4/ZIP/etc.

9. Resume support ⭐⭐⭐
Doesn't make the initial transfer faster, but makes failures far less painful.

10. Hashing/checksums ⭐⭐
Useful for integrity, but don't let it become a bottleneck.

file-sharing/
│
├── app/
│   ├── send/
│   ├── receive/
│   ├── instant/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   │
│   ├── session/
│   └── api/
│
├── components/
│   ├── send/
│   ├── receive/
│   ├── instant/
│   │   ├── InstantSend.tsx
│   │   ├── InstantReceive.tsx
│   │   ├── InstantTransfer.tsx
│   │   ├── InstantProgress.tsx
│   │   └── InstantStatus.tsx
│   │
│   └── session/
│
├── lib/
│   └── instant/
│       ├── peer.ts
│       ├── signaling.ts
│       ├── transfer.ts
│       ├── protocol.ts
│       ├── chunker.ts
│       ├── compression.ts
│       ├── encryption.ts
│       └── types.ts
│
├── functions/
│   └── session/
│
└── supabase/
    └── functions/
