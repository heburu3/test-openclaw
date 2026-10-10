// Inwangsan Reel: shared timeline data for both edit variants.
// All times are in seconds of the final video. VO starts at VO_OFFSET.

export const FPS = 30;
export const VO_OFFSET = 0.2;
export const DURATION = 40;

// Word timings measured on vo_timed.wav (whisper.cpp, then hand-corrected to the
// script text). Times are VO-relative; `phrases` below shifts them by VO_OFFSET.
type RawWord = [number, string];
const RAW_PHRASES: { end: number; words: RawWord[] }[] = [
  { end: 1.32, words: [[0.04, "Гора"], [0.3, "для"], [0.49, "новичков…"]] },
  { end: 2.8, words: [[1.32, "Короче,"], [1.82, "это"], [2.03, "Инвансан,"]] },
  { end: 4.08, words: [[2.8, "прямо"], [3.15, "посреди"], [3.78, "Сеула."]] },
  { end: 5.54, words: [[4.08, "338"], [4.77, "метров."]] },
  { end: 7.04, words: [[5.54, "Наша"], [5.79, "с"], [5.92, "Илоной"], [6.34, "первая"], [6.64, "гора,"]] },
  { end: 8.5, words: [[7.04, "и"], [7.08, "мы"], [7.12, "думали,"], [7.52, "что"], [7.67, "будет"], [7.97, "легко."]] },
  { end: 9.36, words: [[8.55, "Но"], [8.71, "в"], [8.76, "самом"], [8.96, "начале"]] },
  { end: 10.52, words: [[9.36, "нас"], [9.5, "встретил"], [9.84, "крутой"], [10.0, "подъём,"]] },
  { end: 11.36, words: [[10.52, "и"], [10.58, "устали"], [11.0, "мы"], [11.14, "уже"]] },
  { end: 12.56, words: [[11.36, "за"], [11.52, "первые"], [11.76, "десять"], [12.14, "минут."]] },
  { end: 14.25, words: [[12.75, "Останавливались,"], [13.62, "наверное,"]] },
  { end: 15.01, words: [[14.25, "раз"], [14.44, "десять."]] },
  { end: 15.99, words: [[15.1, "Сидели"], [15.38, "на"], [15.52, "камнях,"]] },
  { end: 17.04, words: [[15.99, "болтали,"], [16.55, "шутили."]] },
  { end: 18.4, words: [[17.04, "Никуда"], [17.42, "не"], [17.54, "торопились."]] },
  { end: 19.64, words: [[18.6, "Приятно"], [19.02, "удивило,"]] },
  { end: 20.87, words: [[19.64, "что"], [19.7, "тропы"], [19.97, "здесь"], [20.25, "безопасные,"]] },
  { end: 22.2, words: [[20.87, "но"], [20.97, "при"], [21.27, "этом"], [21.38, "интересные."]] },
  { end: 23.52, words: [[22.33, "Полтора"], [22.74, "часа"], [23.04, "спустя"]] },
  { end: 24.61, words: [[23.52, "мы"], [23.64, "были"], [23.95, "наверху."]] },
  { end: 25.52, words: [[24.61, "Ноги"], [25.03, "дрожат,"]] },
  { end: 27.44, words: [[25.52, "а"], [25.6, "настроение"], [26.44, "лучше"], [26.74, "некуда."]] },
  { end: 28.8, words: [[27.44, "Сделали"], [27.96, "пару"], [28.27, "фоток,"]] },
  { end: 30.5, words: [[28.8, "а"], [28.87, "вид"], [29.08, "там"], [29.28, "очень"], [29.63, "красивый."]] },
  { end: 31.93, words: [[30.61, "Это"], [30.91, "было"], [31.2, "классное"], [31.65, "время"]] },
  { end: 33.2, words: [[31.93, "и"], [31.98, "отличный"], [32.45, "первый"], [32.78, "опыт."]] },
  { end: 34.17, words: [[33.3, "Следующая"], [33.87, "гора"]] },
  { end: 35.3, words: [[34.17, "будет"], [34.54, "повыше."]] },
  { end: 37.2, words: [[36.18, "Наверное."]] },
];

export type Word = { t: number; text: string };
export type Phrase = { start: number; end: number; words: Word[] };

export const phrases: Phrase[] = RAW_PHRASES.map((p) => ({
  start: p.words[0][0] + VO_OFFSET,
  end: p.end + VO_OFFSET,
  words: p.words.map(([t, text]) => ({ t: t + VO_OFFSET, text })),
}));

// Words that get a punch-in zoom in the dynamic variant.
export const EMPHASIS = new Set(["новичков…", "338", "крутой", "десять.", "наверху.", "красивый.", "повыше.", "Наверное."]);
export const emphasisTimes: number[] = phrases
  .flatMap((p) => p.words)
  .filter((w) => EMPHASIS.has(w.text))
  .map((w) => w.t);

export type Shot = {
  src: string; // file in public/inwangsan, .mp4 video or .jpg still
  from: number;
  to: number;
  srcStart?: number;
  rate?: number;
};

export const shots: Shot[] = [
  { src: "climbA.mp4", from: 0, to: 1.6, srcStart: 4.0 },
  { src: "trail.mp4", from: 1.6, to: 4.3, srcStart: 0.4 },
  { src: "pano.mp4", from: 4.3, to: 5.8, srcStart: 0.5 },
  { src: "trail.mp4", from: 5.8, to: 8.75, srcStart: 7.3 },
  { src: "climbB.mp4", from: 8.75, to: 10.8, srcStart: 4.0 },
  { src: "climbA.mp4", from: 10.8, to: 12.95, srcStart: 6.4 },
  { src: "trail.mp4", from: 12.95, to: 15.2, srcStart: 16.8 },
  { src: "rock.mp4", from: 15.2, to: 18.7, srcStart: 0.5 },
  { src: "wall.mp4", from: 18.7, to: 20.6, srcStart: 0.2 },
  { src: "ropes.mp4", from: 20.6, to: 22.5, srcStart: 0.4 },
  { src: "arrive.mp4", from: 22.5, to: 24.8, srcStart: 2.6 },
  { src: "summitrock.mp4", from: 24.8, to: 27.6, srcStart: 0.3 },
  { src: "summit.jpg", from: 27.6, to: 30.8 },
  { src: "summitpano.mp4", from: 30.8, to: 33.4, srcStart: 0.5 },
  { src: "peaks.mp4", from: 33.4, to: 36.3, srcStart: 0, rate: 0.85 },
  { src: "pano.mp4", from: 36.3, to: DURATION, srcStart: 5.5 },
];

// Infographic beats (video seconds).
export const BEATS = {
  location: [1.75, 4.25],
  altitude: [4.3, 5.8],
  progress: [5.8, 27.6], // route progress indicator visible
  climbStart: 8.75,
  summit: 24.15, // "наверху."
  timer: [8.9, 12.9],
  rests: [12.95, 15.2],
  chipSafe: 20.45,
  chipFun: 21.58,
  chipsEnd: 22.5,
  duration: [22.53, 24.8], // "Полтора часа" .. summit badge
  photo: 27.6,
  endCard: 37.3,
};

export const sec = (s: number) => Math.round(s * FPS);
