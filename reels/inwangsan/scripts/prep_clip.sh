#!/bin/bash
# usage: prep_clip.sh <src> <out_id> <stabilize 0|1>
set -e
SRC=$1; ID=$2; STAB=$3
OUT=/home/user/test-openclaw/OpenMontage/remotion-composer/public/inwangsan
TMP=/tmp/claude-0/-home-user-test-openclaw/fcb6963b-ef54-5587-98f3-4b148eb4fa3e/scratchpad/prep; mkdir -p $TMP
SCALE="scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,fps=30"
GRADE="eq=contrast=1.05:saturation=1.10:gamma=0.98,colorbalance=rm=0.025:bm=-0.025:rh=0.02:bh=-0.02,unsharp=5:5:0.4"
AUD="highpass=f=150,lowpass=f=9000,afftdn=nf=-35,loudnorm=I=-30:TP=-6:LRA=11"
if [ "$STAB" = "1" ]; then
  ffmpeg -v error -y -i "$SRC" -vf "$SCALE,vidstabdetect=shakiness=8:accuracy=12:result=$TMP/$ID.trf" -f null -
  VF="$SCALE,vidstabtransform=input=$TMP/$ID.trf:smoothing=24:zoom=6:optzoom=0,$GRADE"
else
  VF="$SCALE,$GRADE"
fi
ffmpeg -v error -y -i "$SRC" -vf "$VF" -af "$AUD" -c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p -g 15 -c:a aac -b:a 160k -ar 48000 -movflags +faststart "$OUT/$ID.mp4"
echo "done $ID"
