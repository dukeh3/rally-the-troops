"use strict";

let AREAS = {
	"Ireland":{"x":120,"y":475},
	"Isle of Man":{"x":360,"y":525},
	"Scotland":{"x":635,"y":180},
	"Northumbria":{"x":885,"y":280},
	"Cumbria":{"x":680,"y":405},
	"North Yorks":{"x":890,"y":535},
	"East Yorks":{"x":1120,"y":545},
	"South Yorks":{"x":985,"y":710},
	"Lancaster":{"x":750,"y":690},
	"Caernarvon":{"x":480,"y":890},
	"Chester":{"x":720,"y":900},
	"Derby":{"x":960,"y":880},
	"Lincoln":{"x":1210,"y":820},
	"Pembroke":{"x":340,"y":1220},
	"Powys":{"x":565,"y":1100},
	"Hereford":{"x":715,"y":1125},
	"Warwick":{"x":890,"y":1090},
	"Leicester":{"x":1080,"y":1055},
	"Rutland":{"x":1265,"y":1060},
	"East Anglia":{"x":1505,"y":1040},
	"Glamorgan":{"x":570,"y":1330},
	"Gloucester":{"x":840,"y":1300},
	"Oxford":{"x":1035,"y":1290},
	"Middlesex":{"x":1235,"y":1305},
	"Essex":{"x":1440,"y":1255},
	"Somerset":{"x":750,"y":1510},
	"Wilts":{"x":920,"y":1460},
	"Sussex":{"x":1140,"y":1550},
	"Kent":{"x":1415,"y":1490},
	"Cornwall":{"x":400,"y":1660},
	"Dorset":{"x":810,"y":1640},
	"France":{"x":225,"y":160},
	"Calais":{"x":1465,"y":1795},
	"Irish Sea":{"x":280,"y":685},
	"North Sea":{"x":1425,"y":460},
	"English Channel":{"x":915,"y":1820},
	"Pool":{x:1688-87,y:87},
	"Minor":{x:1688-87-66-10,y:87},
}

let BORDERS = {};
let BLOCKS = {};

const CARDS = {
	1: { name: "Force March", event: "force_march", actions: 1, image: "card_force_march" },
	2: { name: "Muster", event: "muster", actions: 0, image: "card_muster" },
	3: { name: "Piracy", event: "piracy", actions: 2, image: "card_piracy" },
	4: { name: "Plague", event: "plague", actions: 0, image: "card_plague" },
	5: { name: "Surprise", event: "surprise", actions: 1, image: "card_surprise" },
	6: { name: "Treason", event: "treason", actions: 1, image: "card_treason" },
	7: { name: "4", actions: 4, image: "card_4" },
	8: { name: "4", actions: 4, image: "card_4" },
	9: { name: "4", actions: 4, image: "card_4" },
	10: { name: "4", actions: 4, image: "card_4" },
	11: { name: "4", actions: 4, image: "card_4" },
	12: { name: "4", actions: 4, image: "card_4" },
	13: { name: "3", actions: 3, image: "card_3" },
	14: { name: "3", actions: 3, image: "card_3" },
	15: { name: "3", actions: 3, image: "card_3" },
	16: { name: "3", actions: 3, image: "card_3" },
	17: { name: "3", actions: 3, image: "card_3" },
	18: { name: "3", actions: 3, image: "card_3" },
	19: { name: "3", actions: 3, image: "card_3" },
	20: { name: "2", actions: 2, image: "card_2" },
	21: { name: "2", actions: 2, image: "card_2" },
	22: { name: "2", actions: 2, image: "card_2" },
	23: { name: "2", actions: 2, image: "card_2" },
	24: { name: "2", actions: 2, image: "card_2" },
	25: { name: "2", actions: 2, image: "card_2" },
};

(function () {
	for (let a in AREAS) {
		AREAS[a].exits = [];
		AREAS[a].shields = [];
		AREAS[a].wrap = 3;
		AREAS[a].layout_axis = 'X';
		AREAS[a].layout_major = 0.5;
		AREAS[a].layout_minor = 0.5;
	}

	function border(a, b, type) {
		if (a > b) [a, b] = [b, a];
		let id = a + "/" + b;
		BORDERS[id] = type;
		AREAS[a].exits.push(b);
		AREAS[b].exits.push(a);
	}

	function yellow(A,B) { border(A,B,"major"); }
	function blue(A,B) { border(A,B,"river"); }
	function red(A,B) { border(A,B,"minor"); }
	function sea(A,B,major) { border(A,B,"sea"); if (major) AREAS[B].major_port = true; }

	function layout(a, wrap, axis, major, minor) {
		AREAS[a].wrap = wrap;
		AREAS[a].layout_axis = axis;
		AREAS[a].layout_major = (1 - major) / 2;
		AREAS[a].layout_minor = (1 - minor) / 2;
	}

	layout("Pool", 50, 'Y', 1, 0);
	layout("Minor", 10, 'Y', 1, 0);
	layout("France", 4, 'X', 0, 0);
	layout("Calais", 4, 'X', 0, 0);

	layout("Ireland", 3, 'Y', -1, -1);
	layout("Scotland", 3, 'X', -1, -1);
	layout("Northumbria", 4, 'Y', 0, 0);
	layout("Rutland", 4, 'Y', 0, 0);
	layout("Leicester", 4, 'Y', 0, 0);

	layout("North Sea", 10, 'Y', 1, 0);
	layout("Irish Sea", 10, 'Y', 1, 0);
	layout("English Channel", 10, 'X', 0, 0);

	layout("Cornwall", 4, 'X', 0, 0);
	layout("Dorset", 4, 'X', 0, 0);
	layout("Sussex", 4, 'X', 0, 0);
	layout("Kent", 4, 'X', 0, 0);
	layout("Somerset", 4, 'X', -1, -1);

	layout("East Anglia", 4, 'X', 0, 0);
	layout("Powys", 4, 'Y', 0, 0);
	layout("Hereford", 4, 'Y', 0, 0);
	layout("Oxford", 3, 'Y', 0, 0);

	layout("Derby", 4, 'X', 0, 0);
	layout("Caernarvon", 4, 'X', 0, 0);
	layout("Essex", 3, 'X', 0, 0);
	layout("Cumbria", 4, 'X', 0, 0);
	layout("Glamorgan", 4, 'X', 0, 0);
	layout("Pembroke", 4, 'X', 0, -1);

	red("Scotland", "Cumbria");
	red("Scotland", "Northumbria");
	red("Cumbria", "Northumbria");
	red("Cumbria", "North Yorks");
	red("Cumbria", "Lancaster");
	blue("Northumbria", "North Yorks");
	blue("Northumbria", "East Yorks");

	yellow("North Yorks", "East Yorks");
	yellow("North Yorks", "South Yorks");
	red("North Yorks", "Lancaster");
	blue("East Yorks", "South Yorks");
	red("Lancaster", "South Yorks");
	blue("Lancaster", "Chester");
	red("Lancaster", "Derby");
	yellow("South Yorks", "Derby");
	blue("South Yorks", "Lincoln");

	blue("Caernarvon", "Chester");
	red("Caernarvon", "Powys");
	red("Caernarvon", "Pembroke");
	yellow("Chester", "Powys");
	yellow("Chester", "Derby");
	blue("Chester", "Hereford");
	yellow("Chester", "Warwick");
	blue("Derby", "Warwick");
	blue("Derby", "Leicester");
	blue("Derby", "Lincoln");
	yellow("Lincoln", "Leicester");
	blue("Lincoln", "Rutland");

	red("Pembroke", "Powys");
	yellow("Pembroke", "Glamorgan");
	red("Powys", "Hereford");
	blue("Powys", "Glamorgan");
	blue("Hereford", "Warwick");
	blue("Hereford", "Gloucester");
	blue("Hereford", "Glamorgan");
	yellow("Warwick", "Leicester");
	blue("Warwick", "Oxford");
	blue("Warwick", "Gloucester");
	yellow("Leicester", "Rutland");
	blue("Leicester", "Essex");
	yellow("Leicester", "Middlesex");
	yellow("Leicester", "Oxford");
	blue("Rutland", "East Anglia");
	blue("Rutland", "Essex");
	yellow("East Anglia", "Essex");

	yellow("Gloucester", "Oxford");
	blue("Gloucester", "Wilts");
	yellow("Gloucester", "Somerset");
	yellow("Oxford", "Middlesex");
	blue("Oxford", "Wilts");
	blue("Oxford", "Sussex");
	blue("Middlesex", "Sussex");
	blue("Middlesex", "Kent");
	yellow("Middlesex", "Essex");

	yellow("Cornwall", "Somerset");
	yellow("Cornwall", "Dorset");
	yellow("Somerset", "Wilts");
	yellow("Somerset", "Dorset");
	yellow("Wilts", "Dorset");
	yellow("Wilts", "Sussex");
	blue("Sussex", "Dorset");
	yellow("Sussex", "Kent");

	sea("Irish Sea", "Ireland", true);
	sea("Irish Sea", "Isle of Man");
	sea("Irish Sea", "Scotland", true);
	sea("Irish Sea", "Cumbria");
	sea("Irish Sea", "Lancaster");
	sea("Irish Sea", "Chester", true);
	sea("Irish Sea", "Caernarvon");
	sea("Irish Sea", "Pembroke");
	sea("Irish Sea", "Glamorgan", true);
	sea("Irish Sea", "Somerset", true);
	sea("Irish Sea", "Cornwall", true);

	sea("North Sea", "Scotland", true);
	sea("North Sea", "Northumbria", true);
	sea("North Sea", "East Yorks", true);
	sea("North Sea", "Lincoln");
	sea("North Sea", "Rutland");
	sea("North Sea", "East Anglia", true);
	sea("North Sea", "Essex");
	sea("North Sea", "Middlesex", true);
	sea("North Sea", "Kent", true);

	sea("English Channel", "Cornwall", true);
	sea("English Channel", "Dorset");
	sea("English Channel", "Sussex", true);
	sea("English Channel", "Kent", true);

	sea("English Channel", "Calais", true);
	sea("North Sea", "Calais", true);

	sea("English Channel", "France", true);
	sea("Irish Sea", "France", true);

	AREAS["Somerset"].city = "Bristol";
	AREAS["Warwick"].city = "Coventry";
	AREAS["Middlesex"].city = "London";
	AREAS["Northumbria"].city = "Newcastle";
	AREAS["East Anglia"].city = "Norwich";
	AREAS["Wilts"].city = "Salisbury";
	AREAS["South Yorks"].city = "York";

	AREAS["Kent"].cathedral = "Canterbury";
	AREAS["South Yorks"].cathedral = "York";

	AREAS["Cumbria"].crown = true;
	AREAS["South Yorks"].crown = true;
	AREAS["Caernarvon"].crown = true;
	AREAS["Chester"].crown = true;
	AREAS["Derby"].crown = true;
	AREAS["Pembroke"].crown = true;
	AREAS["Warwick"].crown = true;
	AREAS["Gloucester"].crown = true;
	AREAS["Middlesex"].crown = true;
	AREAS["Sussex"].crown = true;
	AREAS["Cornwall"].crown = true;

	function block(image, owner, type, name, steps, combat, loyalty, extra, extra2) {
		let id = name;
		let enemy = null;
		if (name === "Bombard")
			id = name + "/" + owner[0];
		if (loyalty) {
			id = name + "/" + owner[0];
			if (owner === "York")
				enemy = name + "/L";
			else
				enemy = name + "/Y";
		}
		if (id in BLOCKS)
			throw new Error("Duplicate block: " + id);
		BLOCKS[id] = {
			type: type,
			owner: owner,
			name: name,
			shield: name,
			steps: steps,
			combat: combat,
			image: image,
		};
		if (loyalty)
			BLOCKS[id].loyalty = loyalty;
		if (enemy)
			BLOCKS[id].enemy = enemy;
		if (extra) {
			if (type === 'heir') {
				BLOCKS[id].heir = extra;
				BLOCKS[id].shield = extra2;
			}
			if (type === 'church' || type === 'levies')
				BLOCKS[id].home = extra;
			if (type === 'nobles')
				BLOCKS[id].shield = extra;
		}
	}

	block(11, "York",	"heir",		"York",			4, "B3", 0, 1);
	block(12, "York",	"heir",		"March",		3, "A3", 0, 2);
	block(13, "York",	"heir",		"Rutland",		3, "B1", 0, 3);
	block(14, "York",	"heir",		"Clarence",		3, "B2", 1, 4);
	block(15, "York",	"heir",		"Gloucester",		3, "B3", 0, 5);

	block(16, "York",	"nobles",	"Essex",		3, "B1", 0);
	block(17, "York",	"nobles",	"Hastings",		3, "B2", 0);
	block(21, "York",	"nobles",	"Herbert",		3, "A2", 0);
	block(22, "York",	"nobles",	"Worcester",		2, "B2", 0);
	block(23, "York",	"nobles",	"Suffolk",		3, "B2", 0);
	block(24, "York",	"nobles",	"Norfolk",		4, "B2", 0);
	block(25, "York",	"nobles",	"Buckingham",		4, "B2", 1);
	block(26, "York",	"nobles",	"Exeter",		3, "A1", 1);
	block(27, "York",	"nobles",	"Rivers",		2, "B2", 2);
	block(31, "York",	"nobles",	"Northumberland",	4, "B3", 1);
	block(32, "York",	"nobles",	"Shrewsbury",		3, "A1", 1);
	block(33, "York",	"nobles",	"Stanley",		4, "B2", 1);
	block(34, "York",	"nobles",	"Arundel",		3, "B2", 0);
	block(35, "York",	"nobles",	"Warwick",		4, "B3", 3);
	block(36, "York",	"nobles",	"Kent",			3, "A2", 2);
	block(37, "York",	"nobles",	"Salisbury",		3, "B2", 2);
	block(41, "York",	"nobles",	"Westmoreland",		3, "B2", 2);

	block(51, "York",	"mercenaries",	"Irish Mercenary",	4, "B2", 0);
	block(52, "York",	"mercenaries",	"Burgundian Mercenary",	3, "A3", 0);
	block(53, "York",	"mercenaries",	"Calais Mercenary",	3, "B4", 0);
	block(46, "York",	"church",	"Canterbury (church)",	3, "C1", 2, "Canterbury");
	block(47, "York",	"church",	"York (church)",	3, "C2", 1, "York");
	block(42, "York",	"levies",	"London (levy)",	4, "C3", 0, "London");
	block(43, "York",	"levies",	"Norwich (levy)",	4, "C2", 0, "Norwich");
	block(44, "York",	"levies",	"Salisbury (levy)",	4, "C2", 0, "Salisbury");
	block(45, "York",	"bombard",	"Bombard",		3, "D3", 0);

	block(91, "Lancaster",	"heir",		"Henry VI",		4, "B2", 0, 1);
	block(92, "Lancaster",	"heir",		"Prince Edward",	3, "B1", 0, 2);
	block(93, "Lancaster",	"heir",		"Exeter",		3, "A1", 2, 3, "Exeter");
	block(94, "Lancaster",	"heir",		"Somerset",		3, "A2", 0, 4, "Somerset");
	block(95, "Lancaster",	"heir",		"Richmond",		3, "B2", 0, 5, "Richmond");

	block(67, "Lancaster",	"nobles",	"Westmoreland",		3, "B2", 2);
	block(71, "Lancaster",	"nobles",	"Northumberland",	4, "B3", 2);
	block(72, "Lancaster",	"nobles",	"Shrewsbury",		3, "A1", 2);
	block(73, "Lancaster",	"nobles",	"Stanley",		4, "B2", 1);
	block(75, "Lancaster",	"nobles",	"Warwick",		4, "B3", 3);
	block(76, "Lancaster",	"nobles",	"Kent",			3, "A2", 2);
	block(77, "Lancaster",	"nobles",	"Salisbury",		3, "B2", 2);
	block(81, "Lancaster",	"nobles",	"Oxford",		3, "A2", 0);
	block(82, "Lancaster",	"nobles",	"Pembroke",		3, "B2", 0);
	block(83, "Lancaster",	"nobles",	"Devon",		2, "B2", 0);
	block(84, "Lancaster",	"nobles",	"Beaumont",		3, "B2", 0);
	block(85, "Lancaster",	"nobles",	"Buckingham",		4, "B2", 1);
	block(86, "Lancaster",	"nobles",	"Clarence",		3, "B2", 1);
	block(87, "Lancaster",	"nobles",	"Rivers",		2, "B2", 1);
	block(96, "Lancaster",	"nobles",	"Clifford",		3, "A2", 0);
	block(97, "Lancaster",	"nobles",	"Wiltshire",		3, "B2", 0);

	block(55, "Lancaster",	"mercenaries",	"Scots Mercenary",	4, "B3");
	block(56, "Lancaster",	"mercenaries",	"Welsh Mercenary",	3, "A2");
	block(57, "Lancaster",	"mercenaries",	"French Mercenary",	4, "B3");
	block(61, "Lancaster",	"church",	"Canterbury (church)",	3, "C1", 1, "Canterbury");
	block(62, "Lancaster",	"church",	"York (church)",	3, "C2", 2, "York");
	block(63, "Lancaster",	"bombard",	"Bombard",		3, "D3");
	block(64, "Lancaster",	"levies",	"Coventry (levy)",	4, "C2", 0, "Coventry");
	block(65, "Lancaster",	"levies",	"Bristol (levy)",	4, "C2", 0, "Bristol");
	block(66, "Lancaster",	"levies",	"Newcastle (levy)",	4, "C3", 0, "Newcastle");
	block(74, "Lancaster",	"levies",	"York (levy)",		4, "C3", 0, "York");

	block(54, "Rebel",	"rebel",	"Rebel",		4, "A2");

	function shields(area, list) {
		AREAS[area].shields = list;
	}

	shields("Isle of Man", ["Stanley"]);
	shields("Northumbria", ["Northumberland", "Westmoreland"]);
	shields("Cumbria", ["Northumberland", "Clifford"]);
	shields("North Yorks", ["Salisbury", "Clifford"]);
	shields("East Yorks", ["Kent", "Salisbury", "Northumberland"]);
	shields("South Yorks", ["York", "Shrewsbury"]);
	shields("Lancaster", ["Lancaster", "Stanley"]);
	shields("Caernarvon", ["Norfolk"]);
	shields("Lincoln", ["Lancaster", "Beaumont"]);
	shields("Pembroke", ["Richmond", "Pembroke"]);
	shields("Hereford", ["York"]);
	shields("Warwick", ["Buckingham", "Warwick"]);
	shields("Leicester", ["Hastings", "Rivers"]);
	shields("Rutland", ["York", "Worcester"]);
	shields("East Anglia", ["Norfolk", "Suffolk"]);
	shields("Glamorgan", ["Buckingham", "Norfolk", "Herbert", "Warwick"]);
	shields("Oxford", ["Suffolk"]);
	shields("Essex", ["Oxford", "Essex"]);
	shields("Wilts", ["Wiltshire"]);
	shields("Sussex", ["Arundel"]);
	shields("Kent", ["Buckingham"]);
	shields("Cornwall", ["Devon", "Exeter"]);
	shields("Dorset", ["Somerset"]);
	shields("Calais", ["Warwick"]);

})();

if (typeof module !== 'undefined')
	module.exports = { CARDS, BLOCKS, AREAS, BORDERS }
