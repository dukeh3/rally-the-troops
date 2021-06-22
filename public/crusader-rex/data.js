"use strict";

const CARDS = {
	1: { name: "Assassins", event: "assassins", image: "card_assassins" },
	2: { name: "Guide", event: "guide", image: "card_guide" },
	3: { name: "Intrigue", event: "intrigue", image: "card_intrigue" },
	4: { name: "Jihad", event: "jihad", image: "card_jihad" },
	5: { name: "Manna", event: "manna", image: "card_manna" },
	6: { name: "Winter Campaign", moves: 1, image: "card_winter_campaign" },
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
	*/
	"Germania":{"x":140,"y":272},
	"France":{"x":140,"y":573},
	"England":{"x":140,"y":873},
	"FP":{"x":50,"y":2150},
	"SP":{"x":50,"y":2150},
	"Dead":{"x":50,"y":80},
};

const PORTS = [];

(function () {
	let r = 1, c = 1;

	let nomads = { Arabs: 1, Turks: 1, Kurds: 1 }

	function army(rc, owner, name, home, move, steps, combat, order, plural) {
		let id = name;
		if (order == 'Military Orders' || order == 'Pilgrims' || order == 'Turcopoles')
			id = home + " " + name;
		if (order == 'Nomads')
			id += " " + nomads[name]++;
		if (name == 'Reynald' || name == 'Raymond')
			id += " (" + home + ")";
		if (id in BLOCKS)
			throw Error("Name clash: " + id + " order:"+order + " " + JSON.stringify(nomads));
		BLOCKS[id] = {
			owner: owner,
			name: name,
			plural: plural,
			type: order.toLowerCase().replace(/ /g, "_"),
			home: home,
			move: move,
			steps: steps,
			combat: combat,
			image: rc,
		}
	}

	function frank(rc, name, home, move, steps, combat, order, plural) {
		army(rc, "Franks", name, home, move, steps, combat, order, plural);
	}
	function saracen(rc, name, home, move, steps, combat, order, plural) {
		army(rc, "Saracens", name, home, move, steps, combat, order, plural);
	}


	frank(11, "Richard",		"England",	3,	4,	"B4",	"Crusaders", 0);
	frank(12, "Philippe",		"France",	2,	4,	"B3",	"Crusaders", 0);
	frank(13, "Barbarossa",		"Germania",	2,	4,	"B3",	"Crusaders", 0);
	frank(14, "Templars",		"Jerusalem",	3,	3,	"B3",	"Military Orders", 1);
	frank(15, "Templars",		"Antioch",	3,	3,	"B3",	"Military Orders", 1);
	frank(16, "Templars",		"Gaza",		3,	3,	"B3",	"Military Orders", 1);
	frank(17, "Templars",		"Tartus",	3,	2,	"B3",	"Military Orders", 1);

	frank(21, "Robert",		"Normandy",	2,	3,	"B3",	"Crusaders", 0);
	frank(22, "Hugues",		"Bourgogne",	2,	4,	"B2",	"Crusaders", 0);
	frank(23, "Frederik",		"Germania",	2,	3,	"B2",	"Crusaders", 0);
	frank(24, "Hospitallers",	"Jerusalem",	3,	4,	"B3",	"Military Orders", 1);
	frank(25, "Hospitallers",	"Acre",		3,	3,	"B3",	"Military Orders", 1);
	frank(26, "Hospitallers",	"Krak", 	3,	2,	"B3",	"Military Orders", 1);
	frank(27, "Reynald",		"Sidon",	2,	3,	"B2",	"Outremers", 0);

	frank(31, "Crossbows",		"Aquitaine",	2,	3,	"A2",	"Crusaders", 1);
	frank(32, "Fileps",		"Flanders",	2,	3,	"B3",	"Crusaders", 0);
	frank(33, "Leopold",		"Germania",	2,	3,	"B3",	"Crusaders", 0);
	frank(34, "Conrad",		"Tyre",		2,	4,	"B3",	"Outremers", 0);
	frank(35, "Balian",		"Nablus",	2,	3,	"B2",	"Outremers", 0);
	frank(36, "Walter",		"Caesarea",	2,	3,	"B2",	"Outremers", 0);
	frank(37, "Raymond",		"Tiberias",	2,	3,	"B2",	"Outremers", 0);

	frank(41, "Turcopole",		"Antioch",	3,	3,	"A2",	"Turcopoles", 0);
	frank(42, "Pilgrims",		"Genoa",	2,	4,	"C2",	"Pilgrims", 1);
	frank(43, "Pilgrims",		"Sicily",	2,	3,	"C2",	"Pilgrims", 1);
	frank(44, "King Guy",		"Jerusalem",	2,	4,	"B2",	"Outremers", 0);
	frank(45, "Reynald",		"Kerak",	3,	2,	"B3",	"Outremers", 0);
	frank(46, "Bohemond",		"Antioch",	2,	4,	"B2",	"Outremers", 0);
	frank(47, "Raymond",		"Tripoli",	2,	4,	"B2",	"Outremers", 0);

	frank(51, "Turcopole",		"Beirut",	3,	3,	"A2",	"Turcopoles", 0);
	frank(52, "Pilgrims",		"Brittany",	2,	4,	"C2",	"Pilgrims", 1);
	frank(53, "Josselin",		"Saone",	2,	3,	"B2",	"Outremers", 0);

	army(54, "Assassins", "Assassins", "Masyaf",	0,	3,	"A3",	"Assassins", 1);

	saracen(55, "Qara-Qush",	"Egypt",	3,	3,	"B3",	"Emirs", 0);
	saracen(56, "Zangi",		"Aleppo",	3,	3,	"B2",	"Emirs", 0);
	saracen(57, "Sanjar",		"Aleppo",	3,	3,	"B2",	"Emirs", 0);

	saracen(61, "Yazkuj",		"Ashtera",	3,	2,	"B2",	"Emirs", 0);
	saracen(62, "Sulaiman",		"Artah",	3,	2,	"B2",	"Emirs", 0);
	saracen(63, "Keukburi",		"Damascus",	3,	3,	"B3",	"Emirs", 0);
	saracen(64, "Shirkuh",		"Homs",		3,	3,	"B2",	"Emirs", 0);
	saracen(65, "Jurdik",		"Zerdana",	3,	3,	"B2",	"Emirs", 0);
	saracen(66, "Bahram",		"Baalbek",	3,	3,	"B2",	"Emirs", 0);
	saracen(67, "Tuman",		"Homs",		3,	3,	"B3",	"Emirs", 0);

	saracen(71, "Taqi al Din",	"Hama",		3,	4,	"A2",	"Emirs", 0);
	saracen(72, "Al Mashtub",	"Damascus",	3,	4,	"B3",	"Emirs", 0);
	saracen(73, "Al Adil",		"Egypt",	3,	4,	"A2",	"Emirs", 0);
	saracen(74, "Saladin",		"Damascus",	3,	4,	"A3",	"Emirs", 0);
	saracen(75, "Al Aziz",		"Egypt",	3,	3,	"B2",	"Emirs", 0);
	saracen(76, "Al Afdal",		"Damascus",	3,	3,	"B3",	"Emirs", 0);
	saracen(77, "Al Zahir",		"Aleppo",	3,	3,	"A2",	"Emirs", 0);

	saracen(81, "Yuzpah",		"Egypt",	3,	4,	"B2",	"Emirs", 0);
	saracen(82, "Qaimaz",		"Banyas",	3,	3,	"B2",	"Emirs", 0);

	saracen(83, "Kurds",		"Damascus",	3,	4,	"C1",	"Nomads", 1);
	saracen(84, "Kurds",		"Damascus",	3,	4,	"C1",	"Nomads", 1);
	saracen(85, "Kurds",		"Damascus",	3,	3,	"C2",	"Nomads", 1);
	saracen(86, "Kurds",		"Damascus",	3,	3,	"C2",	"Nomads", 1);

	saracen(91, "Turks",		"Aleppo",	3,	3,	"A2",	"Nomads", 1);
	saracen(92, "Turks",		"Aleppo",	3,	3,	"A2",	"Nomads", 1);
	saracen(93, "Turks",		"Aleppo",	3,	4,	"A1",	"Nomads", 1);
	saracen(94, "Turks",		"Aleppo",	3,	4,	"A1",	"Nomads", 1);

	saracen(95, "Arabs",		"Egypt",	3,	3,	"B2",	"Nomads", 1);
	saracen(96, "Arabs",		"Egypt",	3,	3,	"B2",	"Nomads", 1);
	saracen(97, "Arabs",		"Egypt",	3,	4,	"B1",	"Nomads", 1);
	saracen(87, "Arabs",		"Egypt",	3,	4,	"B1",	"Nomads", 1);

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
		TOWNS[name].layout_major = 1-major;
		TOWNS[name].layout_minor = 1-minor;
		TOWNS[name].wrap = wrap;
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

	town('Y', 0.0, 0.0, 30,	"Pool", "FP", 0, "pool");
	town('Y', 0.0, 0.0, 30,	"Pool", "SP", 0, "pool");
	town('Y', 1.0, 1.0, 30,	"Pool", "Dead", 0, "pool");

	town('Y', 1.0, 0.5, 3,	"Staging", 		"England", 	0, "staging");
	town('Y', 1.0, 0.5, 3,	"Staging", 		"France", 	0, "staging");
	town('Y', 1.0, 0.5, 3,	"Staging", 		"Germania", 	0, "staging");


	town('X', 1.0, 0.5, 3,	"Syria",		"Aleppo",	3, "town");
	town('Y', 0.5, 0.5, 3,	"Syria",		"Artah",	1, "town");
	town('X', 1.0, 0.5, 3,	"Syria",		"Zerdana",	1, "town");
	town('X', 1.0, 0.5, 3,	"Syria",		"Hama",		1, "town");
	town('X', 1.0, 0.5, 3,	"Syria",		"Homs",		2, "town");
	town('X', 0.5, 0.5, 3,	"Syria",		"Lacum",	0, "town");
	town('X', 0.5, 0.5, 3,	"Syria",		"Qaddas",	0, "town");
	town('X', 0.5, 0.5, 3,	"Syria",		"Baalbek",	1, "town");
	town('X', 0.5, 0.5, 3,	"Syria",		"Anjar",	0, "town");
	town('X', 0.5, 0.5, 4,	"Syria",		"Damascus",	4, "town");
	town('X', 1.0, 0.5, 3,	"Syria",		"Banyas",	1, "town");
	town('X', 1.0, 0.5, 3,	"Syria",		"Ashtera",	1, "town");
	town('X', 1.0, 0.5, 3,	"Syria",		"Ajlun",	0, "town");

	town('X', 0.0, 0.5, 3,	"Antioch",		"St. Simeon",	0, "port");
	town('Y', 0.5, 0.5, 3,	"Antioch",		"Antioch",	3, "town");
	town('Y', 1.0, 0.5, 3,	"Antioch",		"Harim",	0, "town");
	town('X', 0.5, 0.5, 3,	"Antioch",		"Kassab",	0, "town");
	town('X', 0.5, 0.5, 3,	"Antioch",		"Shughur",	0, "town");
	town('X', 0.0, 0.5, 3,	"Antioch",		"Latakia",	1, "port");
	town('X', 0.5, 0.5, 3,	"Antioch",		"Saone",	1, "town");
	town('Y', 0.5, 0.5, 3,	"Antioch",		"Albara",	0, "town");
	town('X', 0.0, 0.5, 3,	"Antioch",		"Margat",	1, "port");

	town('X', 0.5, 0.5, 1,	"Masyaf",		"Masyaf",	1, "town");

	town('Y', 0.5, 0.5, 3,	"Tripoli",		"Monterrand",	0, "town");
	town('X', 0.0, 0.5, 3,	"Tripoli",		"Tartus",	1, "port");
	town('X', 1.0, 0.5, 3,	"Tripoli",		"Krak",		1, "town");
	town('X', 0.0, 0.5, 3,	"Tripoli",		"Tripoli",	2, "fortified-port");
	town('X', 0.0, 0.5, 3,	"Tripoli",		"Botron",	0, "town");

	town('X', 0.0, 0.5, 3,	"Jerusalem",	"Beirut",	2, "port");
	town('X', 0.0, 0.5, 3,	"Jerusalem",	"Sidon",	1, "port");
	town('X', 0.0, 0.5, 3,	"Jerusalem",	"Tyre",		2, "fortified-port");
	town('Y', 0.5, 0.5, 3,	"Jerusalem",	"Beaufort",	1, "town");
	town('X', 0.0, 0.5, 3,	"Jerusalem",	"Acre",		3, "port");
	town('X', 1.0, 0.5, 3,	"Jerusalem",	"Tiberias",	2, "town");
	town('Y', 1.0, 0.5, 3,	"Jerusalem",	"Legio",	0, "town");
	town('X', 1.0, 0.5, 3,	"Jerusalem",	"Baisan",	1, "town");
	town('X', 0.0, 0.5, 3,	"Jerusalem",	"Caesarea",	1, "port");
	town('X', 0.5, 0.5, 3,	"Jerusalem",	"Nablus",	1, "town");
	town('X', 0.5, 0.5, 3,	"Jerusalem",	"Damiya",	0, "town");
	town('X', 0.5, 0.5, 3,	"Jerusalem",	"Amman",	1, "town");
	town('X', 0.0, 0.5, 3,	"Jerusalem",	"Jaffa",	1, "port");
	town('Y', 0.5, 0.5, 3,	"Jerusalem",	"Ramallah",	0, "town");
	town('X', 0.5, 0.5, 3,	"Jerusalem",	"Jerusalem",	3, "town");
	town('Y', 0.5, 0.5, 3,	"Jerusalem",	"Jericho",	0, "town");
	town('X', 0.0, 0.5, 3,	"Jerusalem",	"Ascalon",	2, "port");
	town('Y', 0.5, 0.5, 3,	"Jerusalem",	"Lachish",	0, "town");
	town('X', 0.5, 0.5, 3,	"Jerusalem",	"Hebron",	1, "town");
	town('X', 1.0, 0.5, 3,	"Jerusalem",	"Kerak",	1, "town");
	town('X', 0.5, 0.5, 3,	"Jerusalem",	"Gaza",		1, "town");
	town('Y', 0.5, 0.5, 3,	"Jerusalem",	"Beersheba",	0, "town");
	town('X', 0.5, 0.5, 3,	"Jerusalem",	"Dimona",	0, "town");
	town('X', 1.0, 0.5, 3,	"Jerusalem",	"Zoar",		0, "town");

	town('X', 0.5, 0.5, 4,	"Egypt",	"Egypt",	4, "port");

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

	// off-map roads
	ROADS["Germania/St. Simeon"] = 'minor';
	ROADS["Aleppo/Germania"] = 'major';
	ROADS["Antioch/Germania"] = 'major';

	// TODO: seats and alternate seats
})();

if (typeof module != 'undefined')
	module.exports = { CARDS, BLOCKS, TOWNS, PORTS, ROADS }
