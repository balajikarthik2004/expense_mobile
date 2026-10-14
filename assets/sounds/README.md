# Sounds

## success.mp3

Played when an entry is saved — see [`src/lib/feedback.js`](../../src/lib/feedback.js),
which is the file that decides which of these is used.

## success1.wav

The original synthesised chime, kept as a fallback. Not currently referenced.
Synthesised rather than sourced, so there is no attribution or licence to track.
400ms, 44.1kHz mono 16-bit, peak 0.70 (the player attenuates further to 0.6).

Two ascending notes, C6 → G6 (a perfect fifth), sine fundamental plus a little
octave and fifth harmonic for warmth. Each note has a 4ms attack, an exponential
decay and a forced 15ms release ramp; the buffer fades over its final 5ms. Both
the first and last sample are exactly zero, which is what keeps it from clicking.

To regenerate or retune it:

```python
# make-success.py — run: python make-success.py success.wav
import math, struct, sys, wave

SR = 44100
NOTES = [
    # freq      start  dur    tau    amp
    (1046.50,   0.000, 0.170, 0.055, 0.80),  # C6
    (1567.98,   0.085, 0.300, 0.100, 1.00),  # G6
]
TOTAL, ATTACK, RELEASE, PEAK = 0.40, 0.004, 0.015, 0.70

n = int(SR * TOTAL)
buf = [0.0] * n

for freq, start, dur, tau, amp in NOTES:
    for i in range(int(SR * start), min(n, int(SR * (start + dur)))):
        u = i / SR - start
        env = min(1.0, u / ATTACK) * math.exp(-u / tau)
        left = dur - u
        if left < RELEASE:
            env *= max(0.0, left / RELEASE)
        w = 2 * math.pi * freq * u
        buf[i] += amp * env * (math.sin(w) + 0.25 * math.sin(2 * w) + 0.08 * math.sin(3 * w))

tail = int(SR * 0.005)
for i in range(n - tail, n):
    buf[i] *= (n - i) / tail

gain = PEAK / max(abs(s) for s in buf)
frames = b''.join(
    struct.pack('<h', int(max(-1.0, min(1.0, s * gain)) * 32767)) for s in buf
)

with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(frames)
```
