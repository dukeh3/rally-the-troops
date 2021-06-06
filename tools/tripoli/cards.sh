#!/bin/bash
mkdir -p uncropped cropped cards

# mutool draw -r200 -o uncropped/us_card_%d.ppm HIRES/Final_America_Deck.pdf
# mutool draw -r200 -o uncropped/tr_card_%d.ppm HIRES/Final_Tripoli_Deck.pdf

# remove duplicates
rm -f uncropped/us_card_7.ppm
rm -f uncropped/us_card_8.ppm
rm -f uncropped/us_card_9.ppm
rm -f uncropped/tr_card_6.ppm
rm -f uncropped/tr_card_8.ppm
rm -f uncropped/tr_card_10.ppm

for IN in uncropped/*.ppm
do
	TMP=cropped/$(basename $IN .ppm).ppm
	JPG=cards/$(basename $IN .ppm).jpg

	echo Cropping and compressing $JPG
	# center crop 548 x 748 -> 500x700

	# convert -crop 500x700+24+24 $IN $TMP
	# brighten the cards somewhat
	convert -level 0%,95%,1.1 -crop 500x700+24+24 $IN $TMP

	# convert to jpeg with no chrominance subsampling to avoid color bleed in title text
	mozjpeg -sample 1x1 -outfile $JPG $TMP
done
