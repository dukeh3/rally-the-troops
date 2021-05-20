"use strict";

const VICTORY_TOWNS = [
	"Aleppo", "Damascus", "Egypt",
	"Antioch", "Tripoli", "Acre", "Jerusalem"
];

const CARDS = {
	1: { name: "Assassins", event: "assassins", image: "card_assassins" },
	2: { name: "Guide", event: "guide", image: "card_guide" },
	3: { name: "Intrigue", event: "intrigue", image: "card_intrigue" },
	4: { name: "Jihad", event: "jihad", image: "card_jihad" },
	5: { name: "Manna", event: "manna", image: "card_manna" },
	6: { name: "Winter Campaign", event: "winter_campaign", image: "card_winter_campaign" },
	7: { name: "3", moves: 3, image: "card_3" },
	8: { name: "3", moves: 3, image: "card_3" },
	9: { name: "3", moves: 3, image: "card_3" },
	10: { name: "3", moves: 3, image: "card_3" },
	11: { name: "3", moves: 3, image: "card_3" },
	12: { name: "3", moves: 3, image: "card_3" },
	13: { name: "2", moves: 2, image: "card_2" },
	14: { name: "2", moves: 2, image: "card_2" },
	15: { name: "2", moves: 2, image: "card_2" },
	16: { name: "2", moves: 2, image: "card_2" },
	17: { name: "2", moves: 2, image: "card_2" },
	18: { name: "2", moves: 2, image: "card_2" },
	19: { name: "2", moves: 2, image: "card_2" },
	20: { name: "2", moves: 2, image: "card_2" },
	21: { name: "2", moves: 2, image: "card_2" },
	22: { name: "1", moves: 1, image: "card_1" },
	23: { name: "1", moves: 1, image: "card_1" },
	24: { name: "1", moves: 1, image: "card_1" },
	25: { name: "1", moves: 1, image: "card_1" },
	26: { name: "1", moves: 1, image: "card_1" },
	27: { name: "1", moves: 1, image: "card_1" },
};

const BLOCKS = {};
const ROADS = {};

// From edit.html output
const TOWNS = {
	"Acre":{"x":452,"y":1566},
	"Ajlun":{"x":987,"y":1542},
	"Albara":{"x":810,"y":388},
	"Aleppo":{"x":1051,"y":108},
	"Amman":{"x":1088,"y":1838},
	"Anjar":{"x":753,"y":1129},
	"Antioch":{"x":471,"y":189},
	"Artah":{"x":865,"y":149},
	"Ascalon":{"x":367,"y":2081},
	"Ashtera":{"x":1038,"y":1419},
	"Baalbek":{"x":842,"y":1008},
	"Baisan":{"x":707,"y":1685},
	"Banyas":{"x":764,"y":1362},
	"Beaufort":{"x":605,"y":1354},
	"Beersheba":{"x":444,"y":2283},
	"Beirut":{"x":527,"y":1137},
	"Botron":{"x":540,"y":991},
	"Caesarea":{"x":402,"y":1754},
	"Damascus":{"x":1059,"y":1185},
	"Damiya":{"x":847,"y":1808},
	"Dimona":{"x":630,"y":2294},
	"Egypt":{"x":202,"y":2318},
	"Gaza":{"x":300,"y":2183},
	"Hama":{"x":1035,"y":477},
	"Harim":{"x":699,"y":124},
	"Hebron":{"x":680,"y":2109},
	"Homs":{"x":1053,"y":683},
	"Jaffa":{"x":399,"y":1923},
	"Jericho":{"x":836,"y":1931},
	"Jerusalem":{"x":680,"y":1980},
	"Kassab":{"x":426,"y":339},
	"Kerak":{"x":1008,"y":2076},
	"Krak":{"x":774,"y":726},
	"Lachish":{"x":495,"y":2148},
	"Lacum":{"x":919,"y":885},
	"Latakia":{"x":401,"y":445},
	"Legio":{"x":587,"y":1658},
	"Margat":{"x":540,"y":567},
	"Masyaf":{"x":758,"y":604},
	"Monterrand":{"x":920,"y":603},
	"Nablus":{"x":643,"y":1787},
	"Qaddas":{"x":1145,"y":916},
	"Ramallah":{"x":514,"y":1952},
	"Saone":{"x":653,"y":428},
	"Shughur":{"x":656,"y":296},
	"Sidon":{"x":493,"y":1276},
	"St. Simeon":{"x":364,"y":211},
	"Tartus":{"x":605,"y":718},
	"Tiberias":{"x":699,"y":1560},
	"Tripoli":{"x":621,"y":882},
	"Tyre":{"x":465,"y":1397},
	"Zerdana":{"x":1021,"y":300},
	"Zoar":{"x":955,"y":2278},
	/*
	"Germania1":{"x":139,"y":273},
	"Germania2":{"x":139,"y":359},
	"Germania3":{"x":138,"y":447},
	"France1":{"x":140,"y":573},
	"France2":{"x":140,"y":660},
	"France3":{"x":139,"y":747},
	"England1":{"x":139,"y":873},
	"England2":{"x":140,"y":961},
	"England3":{"x":138,"y":1047},
	"F. Pool":{"x":120,"y":2150},
	"S. Pool":{"x":120,"y":2150},
	*/
	"Germania":{"x":139,"y":273},
	"France":{"x":140,"y":573},
	"England":{"x":139,"y":873},
	"F. Pool":{"x":120,"y":2150},
	"S. Pool":{"x":120,"y":2150},
};

const PORTS = [];

(function () {
	let r = 1, c = 1;

	let nomads = { Arabs: 1, Turks: 1, Kurds: 1 }

	function army(rc, owner, name, home, move, steps, combat, order) {
		let id = name;
		if (order == 'Military Orders' || order == 'Pilgrims' || order == 'Turcopoles')
			id = home + " " + name;
		if (order == 'Nomads')
			id += " " + nomads[name]++;
		if (name == 'Reynald' || name == 'Raymond')
			id += " " + home;
		if (id in BLOCKS)
			throw Error("Name clash: " + id + " order:"+order + " " + JSON.stringify(nomads));
		BLOCKS[id] = {
			owner: owner,
			name: name,
			type: order.toLowerCase().replace(/ /g, "_"),
			home: home,
			move: move,
			steps: steps,
			combat: combat,
			image: rc,
		}
	}

	function frank(rc, name, home, move, steps, combat, order) {
		army(rc, "Frank", name, home, move, steps, combat, order);
	}
	function saracen(rc, name, home, move, steps, combat, order) {
		army(rc, "Saracen", name, home, move, steps, combat, order);
	}

	frank(13, "Barbarossa",		"Germania",	2,	4,	"B3",	"Crusaders");
	frank(23, "Frederik",		"Germania",	2,	3,	"B2",	"Crusaders");
	frank(33, "Leopold",		"Germania",	2,	3,	"B3",	"Crusaders");

	frank(11, "Richard",		"England",	3,	4,	"B4",	"Crusaders");
	frank(21, "Robert",		"England",	2,	3,	"B3",	"Crusaders");
	frank(31, "Crossbows",		"Aquitaine",	2,	3,	"A2",	"Crusaders");

	frank(12, "Philippe",		"France",	2,	4,	"B3",	"Crusaders");
	frank(22, "Hugues",		"Bourgogne",	2,	4,	"B2",	"Crusaders");
	frank(32, "Fileps",		"Flanders",	2,	3,	"B3",	"Crusaders");

	frank(42, "Pilgrims",		"Genoa",	2,	4,	"C2",	"Pilgrims");
	frank(43, "Pilgrims",		"Sicily",	2,	3,	"C2",	"Pilgrims");
	frank(52, "Pilgrims",		"Brittany",	2,	4,	"C2",	"Pilgrims");

	frank(14, "Templars",		"Jerusalem",	3,	3,	"B3",	"Military Orders");
	frank(15, "Templars",		"Antioch",	3,	3,	"B3",	"Military Orders");
	frank(16, "Templars",		"Gaza",		3,	3,	"B3",	"Military Orders");
	frank(17, "Templars",		"Tartus",	3,	3,	"B3",	"Military Orders");
	frank(24, "Hospitallers",	"Jerusalem",	3,	4,	"B3",	"Military Orders");
	frank(25, "Hospitallers",	"Acre",		3,	3,	"B3",	"Military Orders");
	frank(26, "Hospitallers",	"Krak", 	3,	2,	"B3",	"Military Orders");

	frank(27, "Reynald",		"Sidon",	2,	3,	"B2",	"Outremers");
	frank(34, "Conrad",		"Tyre",		2,	4,	"B3",	"Outremers");
	frank(35, "Balian",		"Nablus",	2,	3,	"B2",	"Outremers");
	frank(36, "Walter",		"Caesarea",	2,	3,	"B2",	"Outremers");
	frank(37, "Raymond",		"Tiberias",	2,	3,	"B2",	"Outremers");
	frank(44, "King Guy",		"Jerusalem",	2,	4,	"B2",	"Outremers");
	frank(45, "Reynald",		"Kerak",	3,	2,	"B3",	"Outremers");
	frank(46, "Bohemond",		"Antioch",	2,	4,	"B2",	"Outremers");
	frank(47, "Raymond",		"Tripoli",	2,	4,	"B2",	"Outremers");
	frank(53, "Josselin",		"Saone",	2,	3,	"B2",	"Outremers");

	frank(41, "Turcopole",		"Antioch",	3,	3,	"A2",	"Turcopoles");
	frank(51, "Turcopole",		"Beirut",	3,	3,	"A2",	"Turcopoles");

	army(54, "Assassins", "Assassins", "Masyaf",	0,	3,	"A3",	"Assassins");

	saracen(55, "Qara-Qush",	"Egypt",	3,	3,	"B3",	"Emirs");
	saracen(56, "Zangi",		"Aleppo",	3,	3,	"B2",	"Emirs");
	saracen(57, "Sanjar",		"Aleppo",	3,	3,	"B2",	"Emirs");

	saracen(61, "Yazkuj",		"Ashtera",	3,	2,	"B2",	"Emirs");
	saracen(62, "Sulaiman",		"Artah",	3,	2,	"B2",	"Emirs");
	saracen(63, "Keukburi",		"Damascus",	3,	3,	"B3",	"Emirs");
	saracen(64, "Shirkuh",		"Homs",		3,	3,	"B2",	"Emirs");
	saracen(65, "Jurdik",		"Zerdana",	3,	3,	"B2",	"Emirs");
	saracen(66, "Bahram",		"Baalbek",	3,	3,	"B2",	"Emirs");
	saracen(67, "Tuman",		"Homs",		3,	3,	"B3",	"Emirs");

	saracen(71, "Taqi al Din",	"Hama",		3,	4,	"A2",	"Emirs");
	saracen(72, "Al Mashtub",	"Damascus",	3,	4,	"B3",	"Emirs");
	saracen(73, "Al Adil",		"Egypt",	3,	4,	"A2",	"Emirs");
	saracen(74, "Saladin",		"Damascus",	3,	4,	"A3",	"Emirs");
	saracen(75, "Al Aziz",		"Egypt",	3,	3,	"B2",	"Emirs");
	saracen(76, "Al Afdal",		"Damascus",	3,	3,	"B3",	"Emirs");
	saracen(77, "Al Zahir",		"Aleppo",	3,	3,	"A2",	"Emirs");

	saracen(81, "Yuzpah",		"Egypt",	3,	4,	"B2",	"Emirs");
	saracen(82, "Qaimaz",		"Banyas",	3,	3,	"B2",	"Emirs");

	saracen(83, "Kurds",		"Damascus",	3,	4,	"C1",	"Nomads");
	saracen(84, "Kurds",		"Damascus",	3,	4,	"C1",	"Nomads");
	saracen(85, "Kurds",		"Damascus",	3,	3,	"C2",	"Nomads");
	saracen(86, "Kurds",		"Damascus",	3,	3,	"C2",	"Nomads");

	saracen(91, "Turks",		"Aleppo",	3,	3,	"A2",	"Nomads");
	saracen(92, "Turks",		"Aleppo",	3,	3,	"A2",	"Nomads");
	saracen(93, "Turks",		"Aleppo",	3,	4,	"A1",	"Nomads");
	saracen(94, "Turks",		"Aleppo",	3,	4,	"A1",	"Nomads");

	saracen(95, "Arabs",		"Egypt",	3,	3,	"B2",	"Nomads");
	saracen(96, "Arabs",		"Egypt",	3,	3,	"B2",	"Nomads");
	saracen(97, "Arabs",		"Egypt",	3,	4,	"B1",	"Nomads");
	saracen(87, "Arabs",		"Egypt",	3,	4,	"B1",	"Nomads");

	function town(axis, major, minor, wrap, region, name, rating, type) {
		TOWNS[name].region = region;
		TOWNS[name].rating = rating;
		if (type == 'port' || type == 'fortified-port')
			TOWNS[name].port = true;
		if (type == 'fortified-port')
			TOWNS[name].fortified_port = true;
		if (TOWNS[name].port)
			PORTS.push(name);
		TOWNS[name].exits = [];
		TOWNS[name].layout_axis = axis;
		TOWNS[name].layout_major = (1 - major) / 2;
		TOWNS[name].layout_minor = (1 - minor) / 2;
		TOWNS[name].wrap = wrap ? wrap : Math.max(2, rating);
	}

/*
	town('X', 0, 0, 0,	"Staging", "England1", 0, "staging");
	town('X', 0, 0, 0,	"Staging", "England2", 0, "staging");
	town('X', 0, 0, 0,	"Staging", "England3", 0, "staging");
	town('X', 0, 0, 0,	"Staging", "France1", 0, "staging");
	town('X', 0, 0, 0,	"Staging", "France2", 0, "staging");
	town('X', 0, 0, 0,	"Staging", "France3", 0, "staging");
	town('X', 0, 0, 0,	"Staging", "Germania1", 0, "staging");
	town('X', 0, 0, 0,	"Staging", "Germania2", 0, "staging");
	town('X', 0, 0, 0,	"Staging", "Germania3", 0, "staging");
*/
	town('X', 0, 0, 0,	"Staging", "England", 0, "staging", "S", 3);
	town('X', 0, 0, 0,	"Staging", "France", 0, "staging", "S", 3);
	town('X', 0, 0, 0,	"Staging", "Germania", 0, "staging", "S", 3);

	town('X', 0, 0, 0,	"Pool", "F. Pool", 0, "pool", "N", 12);
	town('X', 0, 0, 0,	"Pool", "S. Pool", 0, "pool", "N", 12);

	town('X', 1, 0, 0,	"Syria",		"Aleppo",	3, "town", "E");
	town('Y', 0, 0, 0,	"Syria",		"Artah",	1, "town", "V");
	town('X', 1, 0, 0,	"Syria",		"Zerdana",	1, "town", "E");
	town('X', 1, 0, 0,	"Syria",		"Hama",		1, "town", "E");
	town('X', 1, 0, 0,	"Syria",		"Homs",		2, "town", "E");
	town('X', 0, 0, 0,	"Syria",		"Lacum",	0, "town", "H");
	town('X', 0, 0, 0,	"Syria",		"Qaddas",	0, "town", "H");
	town('X', 0, 0, 0,	"Syria",		"Baalbek",	1, "town", "H");
	town('X', 0, 0, 0,	"Syria",		"Anjar",	0, "town", "H");
	town('X', 0, 0, 0,	"Syria",		"Damascus",	4, "town", "H");
	town('X', 1, 0, 0,	"Syria",		"Banyas",	1, "town", "E");
	town('X', 1, 0, 0,	"Syria",		"Ashtera",	1, "town", "E");
	town('X', 1, 0, 0,	"Syria",		"Ajlun",	0, "town", "E");

	town('X', 0, 0, 0,	"Antioch",		"St. Simeon",	0, "port", "W");
	town('Y', 0, 0, 0,	"Antioch",		"Antioch",	3, "town", "V");
	town('Y', 1, 0, 0,	"Antioch",		"Harim",	0, "town", "S");
	town('X', 0, 0, 0,	"Antioch",		"Kassab",	0, "town", "H");
	town('X', 0, 0, 0,	"Antioch",		"Shughur",	0, "town", "H");
	town('X', -1, 0, 0,	"Antioch",		"Latakia",	1, "port", "W");
	town('X', 0, 0, 0,	"Antioch",		"Saone",	1, "town", "H");
	town('Y', 0, 0, 0,	"Antioch",		"Albara",	0, "town", "V");
	town('X', -1, 0, 0,	"Antioch",		"Margat",	1, "port", "W");

	town('X', 0, 0, 0,	"Masyaf",		"Masyaf",	1, "town", "H");

	town('Y', 0, 0, 0,	"Tripoli",		"Monterrand",	0, "town", "V");
	town('X', -1, 0, 0,	"Tripoli",		"Tartus",	1, "port", "W");
	town('X', 1, 0, 0,	"Tripoli",		"Krak",		1, "town", "E");
	town('X', -1, 0, 0,	"Tripoli",		"Tripoli",	2, "fortified-port", "W");
	town('X', -1, 0, 0,	"Tripoli",		"Botron",	0, "town", "W");

	town('X', -1, 0, 0,	"Jerusalem",	"Beirut",	2, "port", "W");
	town('X', -1, 0, 0,	"Jerusalem",	"Sidon",	1, "port", "W");
	town('X', -1, 0, 0,	"Jerusalem",	"Tyre",		2, "fortified-port", "W");
	town('Y', 0, 0, 0,	"Jerusalem",	"Beaufort",	1, "town", "V");
	town('X', -1, 0, 0,	"Jerusalem",	"Acre",		3, "port", "W");
	town('X', 1, 0, 0,	"Jerusalem",	"Tiberias",	2, "town", "E");
	town('Y', 1, 0, 0,	"Jerusalem",	"Legio",	0, "town", "N");
	town('X', 1, 0, 0,	"Jerusalem",	"Baisan",	1, "town", "E");
	town('X', -1, 0, 0,	"Jerusalem",	"Caesarea",	1, "port", "W");
	town('X', 0, 0, 0,	"Jerusalem",	"Nablus",	1, "town", "H");
	town('X', 0, 0, 0,	"Jerusalem",	"Damiya",	0, "town", "H");
	town('X', 0, 0, 0,	"Jerusalem",	"Amman",	1, "town", "H");
	town('X', -1, 0, 0,	"Jerusalem",	"Jaffa",	1, "port", "W");
	town('Y', 0, 0, 0,	"Jerusalem",	"Ramallah",	0, "town", "V");
	town('X', 0, 0, 0,	"Jerusalem",	"Jerusalem",	3, "town", "H");
	town('Y', 0, 0, 0,	"Jerusalem",	"Jericho",	0, "town", "V");
	town('X', -1, 0, 0,	"Jerusalem",	"Ascalon",	2, "port", "W");
	town('Y', 0, 0, 0,	"Jerusalem",	"Lachish",	0, "town", "V");
	town('X', 0, 0, 0,	"Jerusalem",	"Hebron",	1, "town", "H");
	town('X', 1, 0, 0,	"Jerusalem",	"Kerak",	1, "town", "E");
	town('X', 0, 0, 0,	"Jerusalem",	"Gaza",		1, "town", "H");
	town('Y', 0, 0, 0,	"Jerusalem",	"Beersheba",	0, "town", "V");
	town('X', 0, 0, 0,	"Jerusalem",	"Dimona",	0, "town", "H");
	town('X', 1, 0, 0,	"Jerusalem",	"Zoar",		0, "town", "E");

	town('X', 0, 0, 0,	"Egypt",		"Egypt",	4, "port", "H");

	function road(A,B,type) {
		let id = (A < B) ? (A + "/" + B) : (B + "/" + A);
		ROADS[id] = type;
		TOWNS[A].exits.push(B);
		TOWNS[B].exits.push(A);
	}

	function major(A,B) { road(A,B,"major"); }
	function minor(A,B) { road(A,B,"minor"); }

	major("Antioch", "Harim");
	major("Harim", "Artah");
	major("Artah", "Aleppo");
	major("Aleppo", "Zerdana");
	major("Zerdana", "Hama");
	major("Hama", "Albara");
	major("Hama", "Monterrand");
	major("Hama", "Homs");
	major("Albara", "Shughur");
	major("Shughur", "Harim");
	major("Monterrand", "Krak");
	major("Krak", "Homs");
	major("Krak", "Tripoli");
	major("Tripoli", "Tartus");
	major("Tripoli", "Botron");
	major("Tartus", "Margat");
	major("Margat", "Latakia");
	major("Botron", "Beirut");
	major("Beirut", "Sidon");
	major("Sidon", "Tyre");
	major("Tyre", "Beaufort");
	major("Beaufort", "Banyas");
	major("Banyas", "Damascus");
	major("Damascus", "Qaddas");
	major("Qaddas", "Homs");
	major("Homs", "Lacum");
	major("Lacum", "Baalbek");
	major("Baalbek", "Anjar");
	major("Anjar", "Beaufort");
	major("Damascus", "Ashtera");
	major("Ashtera", "Ajlun");
	major("Ajlun", "Amman");
	major("Amman", "Kerak");
	major("Kerak", "Zoar");
	major("Zoar", "Hebron");
	major("Hebron", "Jerusalem");
	major("Jerusalem", "Ramallah");
	major("Ramallah", "Jaffa");
	major("Jaffa", "Ascalon");
	major("Ascalon", "Gaza");
	major("Gaza", "Egypt");
	major("Ajlun", "Tiberias");
	major("Tiberias", "Acre");
	major("Acre", "Legio");
	major("Legio", "Baisan");
	major("Baisan", "Tiberias");
	major("Baisan", "Nablus");
	major("Nablus", "Legio");
	major("Nablus", "Jerusalem");
	major("Acre", "Caesarea");
	major("Caesarea", "Jaffa");

	minor("St. Simeon", "Antioch");
	minor("Antioch", "Kassab");
	minor("Kassab", "Latakia");
	minor("Latakia", "Saone");
	minor("Saone", "Shughur");
	minor("Saone", "Albara");
	minor("Albara", "Zerdana");
	minor("Zerdana", "Artah");

	minor("Monterrand", "Homs");

	minor("Tartus", "Krak");
	minor("Krak", "Lacum");
	minor("Lacum", "Qaddas");
	minor("Tripoli", "Baalbek");
	minor("Beirut", "Anjar");
	minor("Anjar", "Damascus");
	minor("Sidon", "Beaufort");
	minor("Tiberias", "Banyas");
	minor("Banyas", "Ashtera");
	minor("Tyre", "Acre");
	minor("Caesarea", "Nablus");
	minor("Nablus", "Damiya");
	minor("Damiya", "Baisan");
	minor("Damiya", "Amman");
	minor("Amman", "Jericho");
	minor("Jericho", "Damiya");
	minor("Jericho", "Kerak");
	minor("Jericho", "Jerusalem");

	minor("Ramallah", "Ascalon");
	minor("Ascalon", "Lachish");
	minor("Lachish", "Gaza");
	minor("Gaza", "Beersheba");
	minor("Beersheba", "Egypt");
	minor("Beersheba", "Dimona");
	minor("Dimona", "Zoar");
	minor("Dimona", "Hebron");
	minor("Hebron", "Lachish");

	// TODO: seats and alternate seats
})();

if (typeof module != 'undefined')
	module.exports = { CARDS, BLOCKS, TOWNS, PORTS, ROADS }
