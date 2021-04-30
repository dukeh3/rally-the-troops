#!/bin/bash

mkdir -p tmp/newblocks
mutool draw -r 150 -o tmp/hots_label_new.png 'HIRES/HOTS-Labels NEW.pdf' 1
pngtopnm tmp/hots_label_new.png | pnmcut -left 188 -top 233 > tmp/labels_e.ppm
pngtopnm tmp/hots_label_new.png | pnmcut -left 188 -top 740 > tmp/labels_s.ppm

for R in e s
do
	pnmcut -left   0 -width 124 < tmp/labels_$R.ppm > tmp/col1.$R.ppm
	pnmcut -left 124 -width 124 < tmp/labels_$R.ppm > tmp/col2.$R.ppm
	pnmcut -left 248 -width 124 < tmp/labels_$R.ppm > tmp/col3.$R.ppm
	pnmcut -left 372 -width 124 < tmp/labels_$R.ppm > tmp/col4.$R.ppm
	pnmcut -left 496 -width 124 < tmp/labels_$R.ppm > tmp/col5.$R.ppm
	pnmcut -left 620 -width 124 < tmp/labels_$R.ppm > tmp/col6.$R.ppm
	pnmcut -left 744 -width 124 < tmp/labels_$R.ppm > tmp/col7.$R.ppm
done

for C in $(seq 7)
do
	pnmcut -top   0 -height 124 < tmp/col$C.s.ppm > tmp/newblocks/block_1$C.ppm
	pnmcut -top 124 -height 124 < tmp/col$C.s.ppm > tmp/newblocks/block_2$C.ppm
	pnmcut -top 248 -height 124 < tmp/col$C.s.ppm > tmp/newblocks/block_3$C.ppm
	pnmcut -top 372 -height 124 < tmp/col$C.s.ppm > tmp/newblocks/block_4$C.ppm
	pnmcut -top   0 -height 124 < tmp/col$C.e.ppm > tmp/newblocks/block_6$C.ppm
	pnmcut -top 124 -height 124 < tmp/col$C.e.ppm > tmp/newblocks/block_7$C.ppm
	pnmcut -top 248 -height 124 < tmp/col$C.e.ppm > tmp/newblocks/block_8$C.ppm
	pnmcut -top 372 -height 124 < tmp/col$C.e.ppm > tmp/newblocks/block_9$C.ppm
done

for B in tmp/newblocks/block_*.ppm
do
	pnmcut 2 2 120 120 $B | pnmtopng > tmp/newblocks/$(basename $B .ppm).png
done

optipng -strip all tmp/newblocks/*.png
