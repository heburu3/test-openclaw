# Reels: Инвансан (первая гора)

Исходники монтажа Reels про подъём на Инвансан (Сеул, 338 м). Готовые ролики
лежат в `renders/` (H.264, 18 Мбит/с), исходные клипы и голос в репозиторий не кладутся.

Звук в роликах: закадровый голос и синтезированные звуковые эффекты
(`scripts/make_sfx.py`: свуш, поп, тик, динь, затвор). Звук исходных клипов отключён.

Два варианта, обе композиции 1080×1920, 30 fps, ~37 с:

- `InwangsanMinimal`: фразовые субтитры, мягкие переходы, вертикальная шкала подъёма.
- `InwangsanDynamic`: субтитры по словам с подсветкой, жёсткие склейки с наездами
  на ключевых словах, профиль маршрута сверху.

## Как собрать

1. Установить [OpenMontage](https://github.com/calesthio/OpenMontage) (`make setup`).
2. Скопировать `remotion/remotion.config.ts` в `OpenMontage/remotion-composer/`
   (рендер через локальный Chromium), а `remotion/*.ts*` в
   `OpenMontage/remotion-composer/src/inwangsan/`, и зарегистрировать обе композиции
   в `src/Root.tsx` (`variant: "minimal"` / `"dynamic"`).
3. Подготовить клипы: `scripts/prep_clip.sh <исходник> <id> <стабилизация 0|1>`
   (id и отрезки см. в `remotion/timeline.ts`). Положить в
   `remotion-composer/public/inwangsan/`: клипы, `vo.wav` (голос), `summit.jpg`
   (фото), а также `sfx_*.wav` из `python scripts/make_sfx.py <папка>`.
4. Рендер: `npx remotion render src/index.tsx InwangsanMinimal out.mp4 --video-bitrate 18M`, затем
   нормализация звука: `ffmpeg -i out.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5 final.mp4`.

## Голос

Дубль 2. Оговорка («Наша с Илоной первая гора» сказано дважды) вырезана. Длинные
паузы сжаты до ~0,22 с (перед финальным «Наверное.» до 0,4 с) скриптом
`scripts/tighten_vo.py`; его вывод вставляется в `VO_CUTS` в `remotion/timeline.ts`,
и все тайминги пересчитываются автоматически. Таймкоды слов получены через
whisper.cpp (модель base) и вручную сверены с текстом сценария.
