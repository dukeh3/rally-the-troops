#!/bin/bash

mkdir -p tmp

mutool draw -r200 -o tmp/card_1.ppm HIRES/cards/Hammer-1-Card.pdf
mutool draw -r200 -o tmp/card_2.ppm HIRES/cards/Hammer-2-Card.pdf
mutool draw -r200 -o tmp/card_3.ppm HIRES/cards/Hammer-3-Card.pdf
mutool draw -r200 -o tmp/card_herald.ppm HIRES/cards/Special-Card-Herald.pdf
mutool draw -r200 -o tmp/card_pillage.ppm HIRES/cards/Special-Card-Pillage.pdf
mutool draw -r200 -o tmp/card_sea_move.ppm HIRES/cards/Special-Card-Sea-Move.pdf
mutool draw -r200 -o tmp/card_truce.ppm HIRES/cards/Special-Card-Truce.pdf
mutool draw -r200 -o tmp/card_victuals.ppm HIRES/cards/Special-Card-Victuals.pdf

# card size at 200dpi = 450 x 700
# off-center: 2px sideways

for F in tmp/card_*.ppm
do
	pnmcut 110 112 450 700 $F | pnmtopng > tmp/$(basename $F .ppm).png
done

mogrify -format webp tmp/card*.png
