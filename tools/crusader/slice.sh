#!/bin/bash

mkdir -p tmp

mutool draw -r150 -o cr_labels.png "HIRES/CR-labels.pdf"

pngtopnm cr_labels.png | pnmcut -left 206 -top 399 > tmp/labels.ppm

pnmcut -left 0 -width 124 < tmp/labels.ppm > tmp/col1.ppm
pnmcut -left 124 -width 124 < tmp/labels.ppm > tmp/col2.ppm
pnmcut -left 248 -width 124 < tmp/labels.ppm > tmp/col3.ppm
pnmcut -left 372 -width 124 < tmp/labels.ppm > tmp/col4.ppm
pnmcut -left 496 -width 124 < tmp/labels.ppm > tmp/col5.ppm
pnmcut -left 620 -width 124 < tmp/labels.ppm > tmp/col6.ppm
pnmcut -left 744 -width 124 < tmp/labels.ppm > tmp/col7.ppm

for C in $(seq 7)
do
	pnmcut -top 0 -height 124 < tmp/col$C.ppm > tmp/block_1$C.ppm
	pnmcut -top 124 -height 124 < tmp/col$C.ppm > tmp/block_2$C.ppm
	pnmcut -top 248 -height 124 < tmp/col$C.ppm > tmp/block_3$C.ppm
	pnmcut -top 372 -height 124 < tmp/col$C.ppm > tmp/block_4$C.ppm
	pnmcut -top 496 -height 124 < tmp/col$C.ppm > tmp/block_5$C.ppm
	pnmcut -top 620 -height 124 < tmp/col$C.ppm > tmp/block_6$C.ppm
	pnmcut -top 744 -height 124 < tmp/col$C.ppm > tmp/block_7$C.ppm
	pnmcut -top 868 -height 124 < tmp/col$C.ppm > tmp/block_8$C.ppm
	pnmcut -top 992 -height 124 < tmp/col$C.ppm > tmp/block_9$C.ppm
done

for B in tmp/block_*.ppm
do
	pnmcut 2 2 120 120 $B | pnmtopng > tmp/$(basename $B .ppm).png
done

optipng -strip all tmp/block_*.png
