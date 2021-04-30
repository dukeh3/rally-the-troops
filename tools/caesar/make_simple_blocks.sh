#!/bin/bash
mkdir -p tmp
node make_simple_blocks.js
for SVG in tmp/army-*.svg
do
	PNG=$(basename "$SVG" .svg).png
	inkscape --export-png="tmp/$PNG" -w 96 -h 96 "$SVG"
done
for I in $(seq 6)
do
	convert tmp/army-$I-*.png -append tmp/sum-$I.png
done
convert +append tmp/sum-*.png simple.png
optipng -strip all simple.png
