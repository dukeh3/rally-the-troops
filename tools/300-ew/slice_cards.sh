#
# mutool draw -r150 -o card_en_%02d.raw.png 300_Cards_Front_EN_v2.pdf
# mutool draw -r150 -o card_back.raw.png 300_Cards_back.pdf 1
mutool draw -r200 -o card_en_%02d.raw.png HIRES/300_Cards_Front_EN_v2.pdf
mutool draw -r200 -o card_back.raw.png HIRES/300_Cards_back.pdf 1
# 617 x 817
for F in card_*.raw.png
do
	B=$(basename $F .raw.png)
	# pngtopnm $F | pnmcut 48 48 375 525 | pnmtopng > $B.png
	# pngtopnm $F | pnmcut 65 65 500 700 | pnmtopng > $B.png
	pngtopnm $F | pnmcut 58 58 500 700 | pnmtopng > $B.png
done
#rm -f *.raw.png
