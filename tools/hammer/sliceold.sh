#!/bin/bash

mkdir -p tmp/oldblocks
mutool draw -r 150 -o tmp/hots_label_21.png HIRES/HOTS-Label2.1.pdf 1
pngtopnm tmp/hots_label_21.png | pnmcut -left 160 -top 268 > tmp/labels.ppm

pnmcut -left 0 -width 124 < tmp/labels.ppm > tmp/col1.ppm
pnmcut -left 124 -width 124 < tmp/labels.ppm > tmp/col2.ppm
pnmcut -left 248 -width 124 < tmp/labels.ppm > tmp/col3.ppm
pnmcut -left 372 -width 124 < tmp/labels.ppm > tmp/col4.ppm
pnmcut -left 496 -width 124 < tmp/labels.ppm > tmp/col5.ppm
pnmcut -left 620 -width 124 < tmp/labels.ppm > tmp/col6.ppm
pnmcut -left 744 -width 124 < tmp/labels.ppm > tmp/col7.ppm

for C in $(seq 7)
do
	pnmcut -top 0 -height 124 < tmp/col$C.ppm > tmp/oldblocks/block_1$C.ppm
	pnmcut -top 124 -height 124 < tmp/col$C.ppm > tmp/oldblocks/block_2$C.ppm
	pnmcut -top 248 -height 124 < tmp/col$C.ppm > tmp/oldblocks/block_3$C.ppm
	pnmcut -top 372 -height 124 < tmp/col$C.ppm > tmp/oldblocks/block_4$C.ppm
	pnmcut -top 496 -height 124 < tmp/col$C.ppm > tmp/oldblocks/block_5$C.ppm
	pnmcut -top 620 -height 124 < tmp/col$C.ppm > tmp/oldblocks/block_6$C.ppm
	pnmcut -top 744 -height 124 < tmp/col$C.ppm > tmp/oldblocks/block_7$C.ppm
	pnmcut -top 868 -height 124 < tmp/col$C.ppm > tmp/oldblocks/block_8$C.ppm
	pnmcut -top 992 -height 124 < tmp/col$C.ppm > tmp/oldblocks/block_9$C.ppm
done

for B in tmp/oldblocks/block_*.ppm
do
	pnmcut 2 2 120 120 $B | pnmtopng > tmp/oldblocks/$(basename $B .ppm).png
done

optipng -strip all tmp/oldblocks/*.png
