"use strict";

const CARDS = {
	1: {
		name: "Herald",
		event: "herald",
		image: "card_herald",
		text: "Name an enemy noble (not Moray). Roll a die to convert him to your side at current strength.\n1-4  Success\n5-6  Failure\nIf a battle results, resolve it now with the defecting noble as the attacker."
	},
	2: {
		name: "Pillage",
		event: "pillage",
		image: "card_pillage",
		text: "Pillage one enemy group adjacent to a friendly group. The enemy blocks take two (2) hits (applied as per combat losses).\nPillaged step(s) may be added to friendly blocks in the pillaging group."
	},
	3: {
		name: "Sea Move",
		event: "sea_move",
		image: "card_sea_move",
		text: "Move one (1) or two (2) blocks from one coastal area to one other friendly (not vacant) coastal area (including England).\nThe Norse cannot use this card."
	},
	4: {
		name: "Truce",
		event: "truce",
		image: "card_truce",
		text: "Opponent can move, but not attack. Scots cannot enter England."
	},
	5: {
		name: "Victuals",
		event: "victuals",
		image: "card_victuals",
		text: "Distribute three (3) steps among friendly blocks in one group."
	},
	6: { name: "a 3", moves: 3, image: "card_3" },
	7: { name: "a 3", moves: 3, image: "card_3" },
	8: { name: "a 3", moves: 3, image: "card_3" },
	9: { name: "a 2", moves: 2, image: "card_2" },
	10: { name: "a 2", moves: 2, image: "card_2" },
	11: { name: "a 2", moves: 2, image: "card_2" },
	12: { name: "a 2", moves: 2, image: "card_2" },
	13: { name: "a 2", moves: 2, image: "card_2" },
	14: { name: "a 2", moves: 2, image: "card_2" },
	15: { name: "a 2", moves: 2, image: "card_2" },
	16: { name: "a 2", moves: 2, image: "card_2" },
	17: { name: "a 2", moves: 2, image: "card_2" },
	18: { name: "a 2", moves: 2, image: "card_2" },
	19: { name: "a 1", moves: 1, image: "card_1" },
	20: { name: "a 1", moves: 1, image: "card_1" },
	21: { name: "a 1", moves: 1, image: "card_1" },
	22: { name: "a 1", moves: 1, image: "card_1" },
	23: { name: "a 1", moves: 1, image: "card_1" },
	24: { name: "a 1", moves: 1, image: "card_1" },
	25: { name: "a 1", moves: 1, image: "card_1" },
};

let BLOCKS = {}

let AREAS = {
	"England": { x: 1360, y: 1750 },
	"Ross": { x: 583, y: 376 },
	"Garmoran": { x: 466, y: 573 },
	"Moray": { x: 644, y: 599 },
	"Strathspey": { x: 973, y: 436 },
	"Buchan": { x: 1218, y: 518 },
	"Lochaber": { x: 435, y: 766 },
	"Badenoch": { x: 834, y: 635 },
	"Mar": { x: 974, y: 709 },
	"Angus": { x: 1099, y: 820 },
	"Argyll": { x: 433, y: 1099 },
	"Atholl": { x: 714, y: 904 },
	"Lennox": { x: 626, y: 1244 },
	"Mentieth": { x: 748, y: 1067 },
	"Fife": { x: 966, y: 1089 },
	"Carrick": { x: 675, y: 1446 },
	"Lanark": { x: 830, y: 1375 },
	"Lothian": { x: 973, y: 1236 },
	"Selkirk": { x: 1015, y: 1379 },
	"Dunbar": { x: 1187, y: 1287 },
	"Galloway": { x: 685, y: 1667 },
	"Annan": { x: 946, y: 1566 },
	"Teviot": { x: 1151, y: 1424 },

	"E. Bag": { x: 150, y: 1900 },
	"S. Bag": { x: 150, y: 50 },
}

let BORDERS = {};

(function () {
	function border(A,B,T) {
		if (A > B)
			[A, B] = [B, A];
		let id = A + "/" + B;
		AREAS[A].exits.push(B);
		AREAS[B].exits.push(A);
		BORDERS[id] = T;
	}

	for (let a in AREAS) {
		AREAS[a].cathedral = false;
		AREAS[a].home = null;
		AREAS[a].coastal = false;
		AREAS[a].exits = [];
	}

	AREAS["Strathspey"].cathedral = true;
	AREAS["Lennox"].cathedral = true;
	AREAS["Fife"].cathedral = true;

	AREAS["Ross"].home = "Ross";
	AREAS["Moray"].home = "Moray";
	AREAS["Buchan"].home = "Buchan";
	AREAS["Lochaber"].home = "Comyn";
	AREAS["Badenoch"].home = "Comyn";
	AREAS["Mar"].home = "Mar";
	AREAS["Angus"].home = "Angus";
	AREAS["Argyll"].home = "Argyll";
	AREAS["Atholl"].home = "Atholl";
	AREAS["Lennox"].home = "Lennox";
	AREAS["Mentieth"].home = "Mentieth";
	AREAS["Carrick"].home = "Bruce";
	AREAS["Lanark"].home = "Steward";
	AREAS["Dunbar"].home = "Dunbar";
	AREAS["Galloway"].home = "Galloway";
	AREAS["Annan"].home = "Bruce";

	AREAS["England"].limit = 0;
	AREAS["Ross"].limit = 1;
	AREAS["Garmoran"].limit = 0;
	AREAS["Moray"].limit = 2;
	AREAS["Strathspey"].limit = 1;
	AREAS["Buchan"].limit = 2;
	AREAS["Lochaber"].limit = 1;
	AREAS["Badenoch"].limit = 2;
	AREAS["Mar"].limit = 1;
	AREAS["Angus"].limit = 2;
	AREAS["Argyll"].limit = 2;
	AREAS["Atholl"].limit = 1;
	AREAS["Lennox"].limit = 1;
	AREAS["Mentieth"].limit = 3;
	AREAS["Fife"].limit = 2;
	AREAS["Carrick"].limit = 1;
	AREAS["Lanark"].limit = 2;
	AREAS["Lothian"].limit = 2;
	AREAS["Selkirk"].limit = 0;
	AREAS["Dunbar"].limit = 2;
	AREAS["Galloway"].limit = 1;
	AREAS["Annan"].limit = 2;
	AREAS["Teviot"].limit = 1;

	function red(A,B) { border(A,B,"minor"); }
	function black(A,B) { border(A,B,"major"); }
	function northsea(A) { AREAS[A].coastal = true; }
	function irishsea(A) { AREAS[A].coastal = true; }

	black("Buchan", "Angus")
	black("Buchan", "Mar")
	black("Carrick", "Annan")
	black("Carrick", "Lanark")
	black("England", "Annan")
	black("England", "Dunbar")
	black("Fife", "Angus")
	black("Fife", "Mentieth")
	black("Lanark", "Mentieth")
	black("Lennox", "Carrick")
	black("Lennox", "Lanark")
	black("Lennox", "Mentieth")
	black("Lothian", "Dunbar")
	black("Lothian", "Lanark")
	black("Lothian", "Mentieth")
	black("Moray", "Lochaber")
	black("Moray", "Strathspey")
	black("Selkirk", "Teviot")
	black("Strathspey", "Badenoch")
	black("Strathspey", "Buchan")
	black("Teviot", "Dunbar")
	red("Angus", "Mar")
	red("Argyll", "Lennox")
	red("Atholl", "Angus")
	red("Atholl", "Argyll")
	red("Atholl", "Badenoch")
	red("Atholl", "Fife")
	red("Atholl", "Lennox")
	red("Atholl", "Mar")
	red("Atholl", "Mentieth")
	red("Badenoch", "Lochaber")
	red("Badenoch", "Mar")
	red("Buchan", "Badenoch")
	red("England", "Teviot")
	red("Galloway", "Annan")
	red("Lanark", "Annan")
	red("Galloway", "Carrick")
	red("Garmoran", "Lochaber")
	red("Garmoran", "Moray")
	red("Lochaber", "Argyll")
	red("Lochaber", "Atholl")
	red("Moray", "Badenoch")
	red("Ross", "Garmoran")
	red("Ross", "Moray")
	red("Selkirk", "Annan")
	red("Selkirk", "Dunbar")
	red("Selkirk", "Lanark")
	red("Selkirk", "Lothian")
	red("Teviot", "Annan")

	northsea("England")
	northsea("Ross")
	northsea("Moray")
	northsea("Strathspey")
	northsea("Buchan")
	northsea("Angus")
	northsea("Mentieth")
	northsea("Fife")
	northsea("Lothian")
	northsea("Dunbar")

	irishsea("England")
	irishsea("Ross")
	irishsea("Garmoran")
	irishsea("Lochaber")
	irishsea("Argyll")
	irishsea("Lennox")
	irishsea("Carrick")
	irishsea("Galloway")
	irishsea("Annan")

	function block(owner, type, name, move, combat, steps, mortal, image) {
		let id = name;
		if (type == 'nobles')
			id = name + "/" + owner[0];
		let item = {
			owner: owner,
			type: type,
			name: name,
			move: move,
			combat: combat,
			steps: steps,
			mortal: mortal,
			image: image,
		}
		BLOCKS[id] = item;
	}

	const A4 = "A4"; const A3 = "A3"; const A2 = "A2"; const A1 = "A1";
	const B4 = "B4"; const B3 = "B3"; const B2 = "B2"; const B1 = "B1";
	const C4 = "C4"; const C3 = "C3"; const C2 = "C2"; const C1 = "C1";

	block("Scotland",	"wallace",	"Wallace",		3,	A3, 	4,	true,	11);
	block("Scotland",	"king",		"King",			3,	A3, 	4,	true,	12);
	block("Scotland",	"infantry",	"Douglas",		2,	C3, 	4,	false,	13);
	block("Scotland",	"infantry",	"Campbell",		2,	C2, 	4,	false,	14);
	block("Scotland",	"infantry",	"Graham",		2,	C2, 	4,	false,	15);
	block("Scotland",	"infantry",	"MacDonald",		2,	C3, 	3,	false,	16);
	block("Scotland",	"infantry",	"Lindsay",		2,	C2, 	3,	false,	17);

	block("Scotland",	"infantry",	"Fraser",		2,	C3, 	3,	false,	21);
	block("Scotland",	"infantry",	"Barclay",		2,	C2, 	4,	false,	22);
	block("Scotland",	"infantry",	"Grant",		2,	C2, 	3,	false,	23);
	block("Scotland",	"cavalry",	"Keith",		3,	B1, 	3,	false,	24);
	block("Scotland",	"archers",	"Etterick",		3,	B2, 	2,	false,	25);
	block("Scotland",	"norse",	"Norse",		0,	A2, 	3,	true,	26);
	block("Scotland",	"knights",	"French Knights",	2,	B3, 	4,	true,	27);

	block("Scotland",	"nobles",	"Comyn",		2,	B2, 	4,	false,	31);
	block("Scotland",	"moray",	"Moray",		2,	B2, 	3,	true,	32);
	block("Scotland",	"nobles",	"Angus",		2,	B2, 	3,	false,	33);
	block("Scotland",	"nobles",	"Argyll",		2,	B2, 	3,	false,	34);
	block("Scotland",	"nobles",	"Bruce",		2,	B2, 	4,	false,	35);
	block("Scotland",	"nobles",	"Mar",			2,	B2, 	3,	false,	36);
	block("Scotland",	"nobles",	"Lennox",		2,	B2, 	3,	false,	37);

	block("Scotland",	"nobles",	"Buchan",		2,	B2, 	3,	false,	41);
	block("Scotland",	"nobles",	"Galloway",		2,	B2, 	3,	false,	42);
	block("Scotland",	"nobles",	"Ross",			2,	B2, 	3,	false,	43);
	block("Scotland",	"nobles",	"Atholl",		2,	B2, 	3,	false,	44);
	block("Scotland",	"nobles",	"Dunbar",		2,	B2, 	3,	false,	45);
	block("Scotland",	"nobles",	"Mentieth",		2,	B2, 	3,	false,	46);
	block("Scotland",	"nobles",	"Steward",		2,	B2, 	3,	false,	47);

	block("England",	"king",		"Edward",		3,	B4, 	4,	true,	61);
	block("England",	"archers",	"Lancaster Archers",	2,	B3, 	3,	false,	62);
	block("England",	"archers",	"Wales Archers",	2,	B3, 	3,	false,	63);
	block("England",	"knights",	"Lancaster Knights",	2,	B3, 	4,	false,	64);
	block("England",	"knights",	"York Knights",		2,	B3, 	4,	false,	65);
	block("England",	"knights",	"Durham Knights",	2,	B3, 	3,	false,	66);
	block("England",	"hobelars",	"Hobelars",		3,	A2, 	3,	true,	67);

	block("England",	"infantry",	"York Infantry",	2,	C2, 	4,	false,	71);
	block("England",	"infantry",	"Lancaster Infantry",	2,	C2, 	4,	false,	72);
	block("England",	"infantry",	"Northumber Infantry",	2,	C2, 	4,	false,	73);
	block("England",	"infantry",	"Durham Infantry",	2,	C2, 	3,	false,	74);
	block("England",	"infantry",	"Cumbria Infantry",	2,	C2, 	3,	false,	75);
	block("England",	"infantry",	"Westmor Infantry",	2,	C2, 	3,	false,	82);
	block("England",	"infantry",	"Wales Infantry",	2,	C3, 	3,	false,	76);
	block("England",	"infantry",	"Ulster Infantry",	2,	C3, 	3,	false,	77);

	block("England",	"nobles",	"Comyn",		2,	B2, 	4,	false,	81);
	block("England",	"nobles",	"Angus",		2,	B2, 	3,	false,	83);
	block("England",	"nobles",	"Argyll",		2,	B2, 	3,	false,	84);
	block("England",	"nobles",	"Bruce",		2,	B2, 	4,	false,	85);
	block("England",	"nobles",	"Mar",			2,	B2, 	3,	false,	86);
	block("England",	"nobles",	"Lennox",		2,	B2, 	3,	false,	87);

	block("England",	"nobles",	"Buchan",		2,	B2, 	3,	false,	91);
	block("England",	"nobles",	"Galloway",		2,	B2, 	3,	false,	92);
	block("England",	"nobles",	"Ross",			2,	B2, 	3,	false,	93);
	block("England",	"nobles",	"Atholl",		2,	B2, 	3,	false,	94);
	block("England",	"nobles",	"Dunbar",		2,	B2, 	3,	false,	95);
	block("England",	"nobles",	"Mentieth",		2,	B2, 	3,	false,	96);
	block("England",	"nobles",	"Steward",		2,	B2, 	3,	false,	97);
})();

if (typeof module != 'undefined')
	module.exports = { CARDS, BLOCKS, AREAS, BORDERS }
