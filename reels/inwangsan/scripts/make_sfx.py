"""Synthesize the minimal SFX set for the Inwangsan reel (48 kHz mono WAV)."""
import sys, wave
import numpy as np

SR = 48000
OUT = sys.argv[1] if len(sys.argv) > 1 else "."
rng = np.random.default_rng(7)


def save(name, x, peak=0.9):
    x = x / (np.abs(x).max() + 1e-9) * peak
    with wave.open(f"{OUT}/{name}.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


def t(d):
    return np.arange(int(d * SR)) / SR


def lowpass_sweep(x, cut):
    """One-pole lowpass with a per-sample cutoff (Hz)."""
    y = np.zeros_like(x); s = 0.0
    a = 1 - np.exp(-2 * np.pi * cut / SR)
    for i in range(len(x)):
        s += a[i] * (x[i] - s); y[i] = s
    return y


# whoosh: noise through a lowpass that opens and closes, soft swell envelope
d = 0.42; n = len(t(d)); u = np.linspace(0, 1, n)
cut = 250 + 5200 * np.sin(np.pi * u) ** 2
noise = rng.standard_normal(n)
wh = lowpass_sweep(noise, cut) - lowpass_sweep(noise, cut * 0.25)
save("sfx_whoosh", wh * np.sin(np.pi * u) ** 1.6, 0.8)

# pop: short pitched blip for UI elements appearing
tt = t(0.11)
f = 700 + 500 * np.exp(-tt * 40)
pop = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 38) * np.minimum(1, tt * 2000)
save("sfx_pop", pop, 0.8)

# tick: tiny click for counters and the timer
tt = t(0.03)
tick = (np.sin(2 * np.pi * 3200 * tt) + 0.4 * rng.standard_normal(len(tt))) * np.exp(-tt * 260)
save("sfx_tick", tick, 0.7)

# ding: soft two-partial bell for the summit badge and the end card
tt = t(1.4)
ding = (np.sin(2 * np.pi * 1046.5 * tt) + 0.55 * np.sin(2 * np.pi * 1568 * tt) + 0.2 * np.sin(2 * np.pi * 2093 * tt))
ding *= np.exp(-tt * 3.2) * np.minimum(1, tt * 400)
save("sfx_ding", ding, 0.75)

# shutter: two filtered noise clicks (mirror slap + curtain)
def click(d, lo, decay):
    x = rng.standard_normal(len(t(d)))
    x = x - lowpass_sweep(x, np.full(len(x), lo))
    return x * np.exp(-t(d) * decay)
sh = np.zeros(len(t(0.22)))
c1 = click(0.05, 1800, 90); c2 = click(0.08, 900, 60)
sh[: len(c1)] += c1; sh[int(0.07 * SR): int(0.07 * SR) + len(c2)] += 0.8 * c2
save("sfx_shutter", sh, 0.85)
print("ok")
