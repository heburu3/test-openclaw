"""Shrink long pauses in the voiceover. Prints the removed ranges (VO seconds) as JSON."""
import json, subprocess, sys
import numpy as np

SRC, DST = sys.argv[1], sys.argv[2]
SR = 48000
KEEP = 0.22          # target pause length
KEEP_PUNCHLINE = 0.40  # pause before the final "Наверное."
PUNCHLINE_AT = 35.5    # gap that contains this time keeps KEEP_PUNCHLINE

raw = subprocess.run(["ffmpeg", "-v", "error", "-i", SRC, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
x = np.frombuffer(raw, np.float32)
w = SR // 50  # 20 ms
n = len(x) // w
db = 20 * np.log10(np.sqrt((x[: n * w].reshape(n, w) ** 2).mean(1)) + 1e-9)
speech = db > np.percentile(db, 10) + 10

cuts, i = [], 0
while i < n:
    if speech[i]:
        i += 1
        continue
    j = i
    while j < n and not speech[j]:
        j += 1
    a, b = i * 0.02, j * 0.02
    keep = KEEP_PUNCHLINE if a <= PUNCHLINE_AT <= b else KEEP
    if a > 0.05 and j < n and b - a > keep + 0.05:
        cuts.append([round(a + keep / 2, 3), round(b - keep / 2, 3)])
    i = j

# assemble with 10 ms crossfades at each splice
fade = int(0.01 * SR)
out, pos = [], 0
for a, b in cuts:
    out.append(x[pos : int(a * SR) + fade].copy())
    pos = int(b * SR)
out.append(x[pos:])
y = out[0]
for seg in out[1:]:
    ramp = np.linspace(0, 1, fade, dtype=np.float32)
    y[-fade:] = y[-fade:] * (1 - ramp) + seg[:fade] * ramp
    y = np.concatenate([y, seg[fade:]])
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", DST], input=y.tobytes(), check=True)
print(json.dumps(cuts))
print(f"removed {sum(b - a for a, b in cuts):.2f}s, new length {len(y) / SR:.2f}s", file=sys.stderr)
