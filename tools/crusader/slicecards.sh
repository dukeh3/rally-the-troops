#!/bin/bash
# 57x89mm -> 225x350

mkdir -p tmp

# mutool draw -r200 -o tmp/cards_1.ppm "HIRES/CR All-Cards 9UP.pdf" 1
# mutool draw -r200 -o tmp/cards_2.ppm "HIRES/CR All-Cards 9UP.pdf" 2
# mutool draw -r200 -o tmp/cards_3.ppm "HIRES/CR All-Cards 9UP.pdf" 3
# mutool draw -r200 -o tmp/cards_back.ppm "HIRES/CR All-Cards 9UP.pdf" 4

pnmcut 574 347 450 700 tmp/cards_back.ppm | pnmtopng > card_back.png
pnmcut 100 50 450 700 tmp/cards_1.ppm | pnmtopng > card_1.png
pnmcut 100 50 450 700 tmp/cards_2.ppm | pnmtopng > card_2.png
pnmcut 100 50 450 700 tmp/cards_3.ppm | pnmtopng > card_3.png

pnmcut 100 750 450 700 tmp/cards_3.ppm | pnmtopng > card_manna.png
pnmcut 550 750 450 700 tmp/cards_3.ppm | pnmtopng > card_intrigue.png
pnmcut 1000 750 450 700 tmp/cards_3.ppm | pnmtopng > card_assassins.png
pnmcut 100 1450 450 700 tmp/cards_3.ppm | pnmtopng > card_jihad.png
pnmcut 550 1450 450 700 tmp/cards_3.ppm | pnmtopng > card_guide.png
pnmcut 1000 1450 450 700 tmp/cards_3.ppm | pnmtopng > card_winter_campaign.png

