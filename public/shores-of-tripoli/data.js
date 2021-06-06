const SPACES = [
	"United States Supply",
	"Tripolitan Supply",
	"Alexandria Harbor",
	"Algiers Harbor",
	"Algiers Patrol Zone",
	"Benghazi Harbor",
	"Derne Harbor",
	"Gibraltar Harbor",
	"Gibraltar Patrol Zone",
	"Malta Harbor",
	"Tangier Harbor",
	"Tangier Patrol Zone",
	"Tripoli Harbor",
	"Tripoli Patrol Zone",
	"Tunis Harbor",
	"Tunis Patrol Zone",
	"1801",
	"1802",
	"1803",
	"1804",
	"1805",
	"1806",
];

const PIECES = [
	"se_frigate_1", "se_frigate_2",
	"us_frigate_1", "us_frigate_2", "us_frigate_3", "us_frigate_4",
	"us_frigate_5", "us_frigate_6", "us_frigate_7", "us_frigate_8",
	"tr_frigate_1", "tr_frigate_2",
	"us_gunboat_1", "us_gunboat_2", "us_gunboat_3",
	"tr_corsair_1", "tr_corsair_2", "tr_corsair_3",
	"tr_corsair_4", "tr_corsair_5", "tr_corsair_6",
	"tr_corsair_7", "tr_corsair_8", "tr_corsair_9",
	"al_corsair_1", "al_corsair_2", "al_corsair_3",
	"al_corsair_4", "al_corsair_5", "al_corsair_6",
	"al_corsair_7", "al_corsair_8", "al_corsair_9",
	"us_marine_1", "us_marine_2", "us_marine_3", "us_marine_4",
	"ar_infantry_1", "ar_infantry_2", "ar_infantry_3", "ar_infantry_4", "ar_infantry_5",
	"ar_infantry_6", "ar_infantry_7", "ar_infantry_8", "ar_infantry_9", "ar_infantry_10",
	"tr_infantry_1", "tr_infantry_2", "tr_infantry_3", "tr_infantry_4", "tr_infantry_5",
	"tr_infantry_6", "tr_infantry_7", "tr_infantry_8", "tr_infantry_9", "tr_infantry_10",
	"tr_infantry_11", "tr_infantry_12", "tr_infantry_13", "tr_infantry_14", "tr_infantry_15",
	"tr_infantry_16", "tr_infantry_17", "tr_infantry_18", "tr_infantry_19", "tr_infantry_20",
];

const SEASONS = [ "Spring", "Summer", "Fall", "Winter" ];

if (typeof module != 'undefined')
	module.exports = { SPACES, PIECES, SEASONS }
