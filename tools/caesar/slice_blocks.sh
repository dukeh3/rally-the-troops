#!/bin/bash
rm -rf tmp
mkdir tmp
for F in HIRES/labels/*.png
do
	pngtopnm $F | pnmcut 6 6 112 112 | pnmtopng > tmp/$(basename $F)
	guetzli tmp/$(basename $F) tmp/$(basename $F .png).jpg
done
optipng -strip all tmp/*.png
