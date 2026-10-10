import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import {
  BEATS,
  DURATION,
  FPS,
  VO_OFFSET,
  emphasisTimes,
  phrases,
  sec,
  shots,
  type Shot,
} from "./timeline";

const { fontFamily: SANS } = loadManrope("normal", {
  weights: ["500", "700", "800"],
  subsets: ["cyrillic", "latin"],
});
const { fontFamily: MONO } = loadMono("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});

export type Variant = "minimal" | "dynamic";
export type InwangsanReelProps = { variant: Variant };

const WHITE = "#FFFFFF";
const ACCENT = "#F3E59A"; // pale yellow, picked from Ilona's jacket
const SHADOW = "0 2px 14px rgba(0,0,0,0.45)";
const asset = (f: string) => staticFile(`inwangsan/${f}`);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const XFADE = 6; // frames of cross-dissolve in the minimal variant

// Fade a block in over `inF` frames and out over the last `outF` frames of `dur`.
const useInOut = (dur: number, inF = 8, outF = 8) => {
  const f = useCurrentFrame();
  return Math.min(
    interpolate(f, [0, inF], [0, 1], clamp),
    interpolate(f, [dur - outF, dur], [1, 0], clamp),
  );
};

// ---------------------------------------------------------------------------
// Footage
// ---------------------------------------------------------------------------

const punchZoom = (t: number) =>
  emphasisTimes.reduce((acc, te) => {
    const d = t - te;
    if (d < 0) return acc;
    return acc + 0.07 * Math.min(1, d * 14) * Math.exp(-d * 3.2);
  }, 0);

const ShotView: React.FC<{ shot: Shot; variant: Variant; first: boolean; dur: number }> = ({
  shot,
  variant,
  first,
  dur,
}) => {
  const f = useCurrentFrame();
  const globalT = (f + sec(shot.from) - (variant === "minimal" && !first ? XFADE : 0)) / FPS;
  const drift = interpolate(f, [0, dur], [1.0, 1.06], clamp);
  const scale = variant === "minimal" ? drift : 1.03 + (drift - 1) * 0.5 + punchZoom(globalT);
  const opacity = variant === "minimal" && !first ? interpolate(f, [0, XFADE], [0, 1], clamp) : 1;

  if (shot.src.endsWith(".jpg")) return <PhotoShot variant={variant} dur={dur} />;

  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        <OffthreadVideo
          src={asset(shot.src)}
          trimBefore={sec(shot.srcStart ?? 0)}
          playbackRate={shot.rate ?? 1}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const PhotoShot: React.FC<{ variant: Variant; dur: number }> = ({ variant, dur }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: f - 2, fps, config: { damping: 14, stiffness: 120 } });
  const rot = interpolate(enter, [0, 1], [-7, -2.5]);
  const y = interpolate(enter, [0, 1], [220, 0]);
  const inner = interpolate(f, [0, dur], [1.0, 1.08], clamp);
  const flashPeak = variant === "dynamic" ? 1 : 0.75;
  const flash = interpolate(f, [0, 2, variant === "dynamic" ? 9 : 14], [flashPeak, flashPeak, 0], clamp);
  return (
    <AbsoluteFill style={{ backgroundColor: "#111" }}>
      <AbsoluteFill style={{ transform: `scale(${1.25 + (inner - 1)})`, filter: "blur(28px) brightness(0.55)" }}>
        <Img src={asset("summit.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 260 }}>
        <div
          style={{
            width: 940,
            background: "#FBFAF6",
            padding: "22px 22px 0 22px",
            borderRadius: 6,
            boxShadow: "0 30px 60px rgba(0,0,0,0.45)",
            transform: `translateY(${y}px) rotate(${rot}deg)`,
            opacity: interpolate(f, [0, 4], [0, 1], clamp),
          }}
        >
          <div style={{ width: "100%", aspectRatio: "2000 / 1126", overflow: "hidden", borderRadius: 2 }}>
            <Img
              src={asset("summit.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${inner})` }}
            />
          </div>
          <div
            style={{
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 34,
              color: "#2B2B2B",
              padding: "26px 6px 30px",
              display: "flex",
              justifyContent: "space-between",
              letterSpacing: 1,
            }}
          >
            <span>Инвансан</span>
            <span style={{ fontFamily: MONO, fontWeight: 500, color: "#7A7A7A" }}>338 м</span>
          </div>
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: WHITE, opacity: flash }} />
    </AbsoluteFill>
  );
};

const Footage: React.FC<{ variant: Variant }> = ({ variant }) => (
  <>
    {shots.map((shot, i) => {
      const first = i === 0;
      const lead = variant === "minimal" && !first ? XFADE : 0;
      const from = sec(shot.from) - lead;
      const dur = sec(shot.to) - from;
      return (
        <Sequence key={i} from={from} durationInFrames={dur} premountFor={30}>
          <ShotView shot={shot} variant={variant} first={first} dur={dur} />
        </Sequence>
      );
    })}
  </>
);

// ---------------------------------------------------------------------------
// Subtitles
// ---------------------------------------------------------------------------

const Subtitles: React.FC<{ variant: Variant }> = ({ variant }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const idx = phrases.findIndex((p) => t >= p.start - 0.05 && t < p.end + 0.12);
  if (idx < 0) return null;
  const p = phrases[idx];
  const local = f - sec(p.start - 0.05);

  if (variant === "minimal") {
    const op = interpolate(local, [0, 4], [0, 1], clamp);
    const y = interpolate(local, [0, 6], [14, 0], clamp);
    return (
      <AbsoluteFill style={{ alignItems: "center", top: 1210 }}>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 62,
            lineHeight: 1.18,
            color: WHITE,
            textAlign: "center",
            maxWidth: 900,
            textShadow: SHADOW,
            opacity: op,
            transform: `translateY(${y}px)`,
          }}
        >
          {p.words.map((w) => w.text).join(" ")}
        </div>
      </AbsoluteFill>
    );
  }

  const hook = idx === 0;
  const spoken = p.words.filter((w) => t >= w.t - 0.03);
  const current = spoken.length - 1;
  return (
    <AbsoluteFill style={{ alignItems: "center", top: hook ? 1120 : 1200 }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          rowGap: 4,
          maxWidth: 940,
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: hook ? 100 : 76,
          lineHeight: 1.1,
          textTransform: "uppercase",
          textAlign: "center",
        }}
      >
        {spoken.map((w, i) => {
          const s = spring({ frame: f - sec(w.t - 0.03), fps, config: { damping: 14, stiffness: 240 }, durationInFrames: 7 });
          return (
            <span
              key={i}
              style={{
                color: i === current ? ACCENT : WHITE,
                transform: `scale(${interpolate(s, [0, 1], [0.7, 1], clamp)})`,
                margin: "0 9px",
                opacity: interpolate(s, [0, 0.4], [0, 1], clamp),
                textShadow: "0 3px 0 rgba(0,0,0,0.35), 0 4px 18px rgba(0,0,0,0.5)",
                display: "inline-block",
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Infographics (shared, with small per-variant differences)
// ---------------------------------------------------------------------------

const Label: React.FC<{ children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({
  children,
  size = 28,
  style,
}) => (
  <div
    style={{
      fontFamily: SANS,
      fontWeight: 700,
      fontSize: size,
      letterSpacing: size * 0.28,
      textTransform: "uppercase",
      color: WHITE,
      opacity: 0.85,
      textShadow: SHADOW,
      ...style,
    }}
  >
    {children}
  </div>
);

const LocationTag: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const op = useInOut(dur, 8, 8);
  const line = interpolate(f, [4, 22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const y = interpolate(f, [0, 10], [18, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: "absolute", left: 80, top: 290, opacity: op, transform: `translateY(${y}px)` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <svg width="30" height="40" viewBox="0 0 24 32" style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,.4))" }}>
          <path d="M12 1C6 1 1.5 5.5 1.5 11.3 1.5 19 12 31 12 31s10.5-12 10.5-19.7C22.5 5.5 18 1 12 1z" fill="none" stroke={WHITE} strokeWidth="2.2" />
          <circle cx="12" cy="11.5" r="3.6" fill={ACCENT} />
        </svg>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 58, letterSpacing: 8, color: WHITE, textShadow: SHADOW }}>
          ИНВАНСАН
        </div>
      </div>
      <div style={{ height: 2, width: 380 * line, background: WHITE, opacity: 0.8, margin: "14px 0 12px 48px" }} />
      <div style={{ marginLeft: 48, fontFamily: SANS, fontWeight: 500, fontSize: 32, color: WHITE, opacity: 0.9, textShadow: SHADOW }}>
        Сеул · Южная Корея
      </div>
    </div>
  );
};

const MOUNTAIN = "M0 150 L90 118 L150 128 L230 80 L290 96 L360 34 L400 50 L450 8 L520 70 L580 58 L640 120 L700 150";

const AltitudeCounter: React.FC<{ dur: number; variant: Variant }> = ({ dur, variant }) => {
  const f = useCurrentFrame();
  const op = useInOut(dur, 6, 6);
  const n = Math.round(interpolate(f, [2, 26], [0, 338], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const draw = interpolate(f, [0, 30], [1, 0], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 330, opacity: op }}>
      <Label size={28}>высота</Label>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 4 }}>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 250, lineHeight: 1, color: WHITE, textShadow: SHADOW }}>
          {n}
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 90, color: variant === "dynamic" ? ACCENT : WHITE, textShadow: SHADOW }}>
          м
        </div>
      </div>
      <svg width="700" height="160" viewBox="0 0 700 160" style={{ marginTop: 18, overflow: "visible" }}>
        <path d={MOUNTAIN} fill="none" stroke={WHITE} strokeWidth="3" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={draw} />
        <circle cx="450" cy="8" r="7" fill={ACCENT} opacity={draw < 0.05 ? 1 : 0} />
      </svg>
    </AbsoluteFill>
  );
};

// Progress 0..1 between climb start and summit.
const routeProgress = (t: number) =>
  interpolate(t, [BEATS.progress[0], BEATS.summit], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });

const VerticalProgress: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const op = useInOut(dur, 10, 10);
  const t = BEATS.progress[0] + f / FPS;
  const p = routeProgress(t);
  const H = 600;
  const atTop = t >= BEATS.summit;
  const pulse = atTop ? 1 + 0.5 * Math.exp(-(t - BEATS.summit) * 4) : 1;
  return (
    <div style={{ position: "absolute", left: 62, top: 560, height: H, opacity: op }}>
      <div style={{ position: "absolute", top: -48, left: -6, fontFamily: MONO, fontWeight: 700, fontSize: 26, color: atTop ? ACCENT : WHITE, textShadow: SHADOW, whiteSpace: "nowrap" }}>
        338 м
      </div>
      <div style={{ position: "absolute", left: 0, top: 0, width: 3, height: H, background: "rgba(255,255,255,0.35)", borderRadius: 2 }} />
      <div style={{ position: "absolute", left: 0, bottom: 0, width: 3, height: H * p, background: WHITE, borderRadius: 2 }} />
      <div
        style={{
          position: "absolute",
          left: -8.5,
          bottom: H * p - 10,
          width: 20,
          height: 20,
          borderRadius: 10,
          background: atTop ? ACCENT : WHITE,
          boxShadow: "0 0 0 5px rgba(255,255,255,0.25)",
          transform: `scale(${pulse})`,
        }}
      />
      <div style={{ position: "absolute", bottom: -44, left: -6, fontFamily: SANS, fontWeight: 700, fontSize: 22, letterSpacing: 4, color: WHITE, opacity: 0.8, textShadow: SHADOW }}>
        СТАРТ
      </div>
    </div>
  );
};

// Route profile across the top (dynamic variant). Points in a 840x150 box.
const PROFILE: [number, number][] = [
  [0, 140], [70, 128], [120, 100], [175, 108], [240, 70], [300, 82], [360, 52], [430, 60], [500, 30], [560, 38], [620, 12], [680, 40], [760, 90], [840, 120],
];
const PEAK_INDEX = 10;
const pointAt = (p: number): [number, number] => {
  const pts = PROFILE.slice(0, PEAK_INDEX + 1);
  const lens = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  const total = lens.reduce((a, b) => a + b, 0);
  let d = p * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i]) {
      const k = d / lens[i];
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
    }
    d -= lens[i];
  }
  return pts[pts.length - 1];
};

const RouteProfile: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const op = useInOut(dur, 10, 10);
  const t = BEATS.progress[0] + f / FPS;
  const p = routeProgress(t);
  const [x, y] = pointAt(p);
  const done = PROFILE.slice(0, PEAK_INDEX + 1).filter((q) => q[0] <= x);
  const atTop = t >= BEATS.summit;
  const full = PROFILE.map((q) => q.join(",")).join(" ");
  const walked = [...done, [x, y]].map((q) => q.join(",")).join(" ");
  const [px, py] = PROFILE[PEAK_INDEX];
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 230, opacity: op }}>
      <svg width="840" height="190" viewBox="-10 -40 860 190" style={{ overflow: "visible", filter: "drop-shadow(0 2px 8px rgba(0,0,0,.35))" }}>
        <polyline points={full} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
        <polyline points={walked} fill="none" stroke={WHITE} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x} cy={y} r={atTop ? 11 : 9} fill={atTop ? ACCENT : WHITE} />
        <text x={px} y={py - 22} fill={atTop ? ACCENT : WHITE} fontFamily={MONO} fontWeight={700} fontSize="26" textAnchor="middle">
          338 м
        </text>
        <text x={0} y={175} fill={WHITE} opacity={0.8} fontFamily={SANS} fontWeight={700} fontSize="20" letterSpacing="4">
          СТАРТ
        </text>
      </svg>
    </AbsoluteFill>
  );
};

const Timer: React.FC<{ dur: number; top: number }> = ({ dur, top }) => {
  const f = useCurrentFrame();
  const op = useInOut(dur, 8, 8);
  const p = interpolate(f, [4, dur - 24], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const secs = Math.round(p * 600);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const R = 78;
  const C = 2 * Math.PI * R;
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 300 + top, opacity: op }}>
      <div style={{ position: "relative", width: 200, height: 200 }}>
        <svg width="200" height="200" viewBox="0 0 200 200" style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,.4))" }}>
          <circle cx="100" cy="100" r={R} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="5" />
          <circle cx="100" cy="100" r={R} fill="none" stroke={p >= 1 ? ACCENT : WHITE} strokeWidth="5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - p)} transform="rotate(-90 100 100)" />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontWeight: 700, fontSize: 44, color: WHITE, textShadow: SHADOW }}>
          {mm}:{ss}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Rests: React.FC<{ dur: number; top: number }> = ({ dur, top }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = useInOut(dur, 8, 8);
  const lastAt = sec(14.64 - BEATS.rests[0]); // word "десять."
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 320 + top, opacity: op }}>
      <Label size={28}>привалы</Label>
      <div style={{ display: "flex", gap: 22, marginTop: 26, alignItems: "center" }}>
        {Array.from({ length: 10 }).map((_, i) => {
          const at = 4 + (i * (lastAt - 4)) / 9;
          const s = spring({ frame: f - at, fps, config: { damping: 12, stiffness: 200 } });
          return (
            <div key={i} style={{ width: 34, height: 34, borderRadius: 17, background: i === 9 && f >= lastAt ? ACCENT : WHITE, transform: `scale(${s})`, boxShadow: "0 2px 8px rgba(0,0,0,.35)" }} />
          );
        })}
      </div>
      <div style={{ marginTop: 22, fontFamily: MONO, fontWeight: 700, fontSize: 56, color: ACCENT, textShadow: SHADOW, opacity: interpolate(f, [lastAt, lastAt + 6], [0, 1], clamp) }}>
        ≈10
      </div>
    </AbsoluteFill>
  );
};

const Chip: React.FC<{ text: string; at: number }> = ({ text, at }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: f - at, fps, config: { damping: 13, stiffness: 180 } });
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "16px 32px 16px 22px",
        borderRadius: 60,
        background: "rgba(20,20,20,0.35)",
        border: "2px solid rgba(255,255,255,0.6)",
        backdropFilter: "blur(10px)",
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: 44,
        color: WHITE,
        opacity: interpolate(s, [0, 0.5], [0, 1], clamp),
        transform: `translateY(${interpolate(s, [0, 1], [24, 0])}px)`,
      }}
    >
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill={ACCENT} />
        <path d="M11 20.5 L17.5 27 L29 14" fill="none" stroke="#2B2B2B" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {text}
    </div>
  );
};

const Chips: React.FC<{ dur: number; top: number }> = ({ dur, top }) => {
  const op = useInOut(dur, 1, 8);
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 330 + top, gap: 22, opacity: op }}>
      <Chip text="безопасно" at={0} />
      <Chip text="интересно" at={sec(BEATS.chipFun - BEATS.chipSafe)} />
    </AbsoluteFill>
  );
};

const Duration: React.FC<{ dur: number; top: number }> = ({ dur, top }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = useInOut(dur, 6, 8);
  const mins = Math.round(interpolate(f, [2, 30], [0, 90], { ...clamp, easing: Easing.out(Easing.cubic) }));
  const summitAt = sec(BEATS.summit - BEATS.duration[0]);
  const s = spring({ frame: f - summitAt, fps, config: { damping: 12, stiffness: 160 } });
  return (
    <AbsoluteFill style={{ alignItems: "center", top: 310 + top, opacity: op }}>
      <Label size={28}>в пути</Label>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 130, color: WHITE, textShadow: SHADOW, lineHeight: 1.1 }}>
        {Math.floor(mins / 60)}:{String(mins % 60).padStart(2, "0")}
        <span style={{ fontFamily: SANS, fontSize: 54, marginLeft: 12 }}>ч</span>
      </div>
      <div
        style={{
          marginTop: 18,
          padding: "12px 30px",
          borderRadius: 40,
          background: ACCENT,
          color: "#2B2B2B",
          fontFamily: SANS,
          fontWeight: 800,
          fontSize: 36,
          letterSpacing: 6,
          transform: `scale(${s})`,
          opacity: s,
        }}
      >
        ВЕРШИНА ✓
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC<{ dur: number; variant: Variant }> = ({ dur, variant }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dim = interpolate(f, [0, 12], [0, variant === "dynamic" ? 0.45 : 0.35], clamp);
  const s = (d: number) => spring({ frame: f - d, fps, config: { damping: 14, stiffness: 140 } });
  const check = interpolate(f, [6, 22], [1, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const stats: [string, string][] = [
    ["338 м", "высота"],
    ["1,5 ч", "в пути"],
    ["≈10", "привалов"],
  ];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${dim})` }} />
      <AbsoluteFill style={{ alignItems: "center", top: 520 }}>
        <svg width="120" height="120" viewBox="0 0 120 120" style={{ opacity: s(0) }}>
          <circle cx="60" cy="60" r="54" fill="none" stroke={ACCENT} strokeWidth="5" />
          <path d="M36 62 L53 78 L86 44" fill="none" stroke={ACCENT} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={check} />
        </svg>
        <div style={{ marginTop: 24, fontFamily: SANS, fontWeight: 800, fontSize: 108, letterSpacing: 4, color: WHITE, textShadow: SHADOW, transform: `translateY(${(1 - s(3)) * 30}px)`, opacity: s(3) }}>
          ГОРА № 1
        </div>
        <div style={{ display: "flex", marginTop: 46, opacity: s(10), transform: `translateY(${(1 - s(10)) * 30}px)` }}>
          {stats.map(([v, l], i) => (
            <div key={i} style={{ width: 260, textAlign: "center", borderLeft: i ? "2px solid rgba(255,255,255,0.45)" : "none" }}>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 58, color: WHITE, textShadow: SHADOW }}>{v}</div>
              <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 24, letterSpacing: 5, color: WHITE, opacity: 0.8, textTransform: "uppercase", marginTop: 6 }}>{l}</div>
            </div>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Beat: React.FC<{ from: number; to: number; children: (dur: number) => React.ReactNode }> = ({ from, to, children }) => {
  const dur = sec(to) - sec(from);
  return (
    <Sequence from={sec(from)} durationInFrames={dur}>
      {children(dur)}
    </Sequence>
  );
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const InwangsanReel: React.FC<InwangsanReelProps> = ({ variant }) => {
  // the dynamic variant keeps a route profile at the top, so stacked graphics sit lower
  const top = variant === "dynamic" ? 190 : 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Footage variant={variant} />

      {/* legibility scrims */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.12) 22%, rgba(0,0,0,0) 34%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.42) 74%, rgba(0,0,0,0.18) 100%)" }} />

      <Beat from={BEATS.location[0]} to={BEATS.location[1]}>{(d) => <LocationTag dur={d} />}</Beat>
      <Beat from={BEATS.altitude[0]} to={BEATS.altitude[1]}>{(d) => <AltitudeCounter dur={d} variant={variant} />}</Beat>
      <Beat from={BEATS.progress[0]} to={BEATS.progress[1]}>
        {(d) => (variant === "minimal" ? <VerticalProgress dur={d} /> : <RouteProfile dur={d} />)}
      </Beat>
      <Beat from={BEATS.timer[0]} to={BEATS.timer[1]}>{(d) => <Timer dur={d} top={top} />}</Beat>
      <Beat from={BEATS.rests[0]} to={BEATS.rests[1]}>{(d) => <Rests dur={d} top={top} />}</Beat>
      <Beat from={BEATS.chipSafe} to={BEATS.chipsEnd}>{(d) => <Chips dur={d} top={top} />}</Beat>
      <Beat from={BEATS.duration[0]} to={BEATS.duration[1]}>{(d) => <Duration dur={d} top={top} />}</Beat>
      <Beat from={BEATS.endCard} to={DURATION}>{(d) => <EndCard dur={d} variant={variant} />}</Beat>

      <Subtitles variant={variant} />

      <Sequence from={sec(VO_OFFSET)}>
        <Audio src={asset("vo.wav")} />
      </Sequence>
    </AbsoluteFill>
  );
};
