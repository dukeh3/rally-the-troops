"use strict";

const CAESAR = "Caesar";
const POMPEIUS = "Pompeius";

const CARDS = {
	1: { name: "Apollo", event: "Apollo", image: "apollo" },
	2: { name: "Jupiter", event: "Jupiter", image: "jupiter" },
	3: { name: "Mars", event: "Mars", image: "mars" },
	4: { name: "Mercury", event: "Mercury", image: "mercury" },
	5: { name: "Neptune", event: "Neptune", image: "neptune" },
	6: { name: "Pluto", event: "Pluto", image: "pluto" },
	7: { name: "Vulcan", event: "Vulcan", image: "vulcan" },
	8: { name: "4/1", move: 4, levy: 1, image: "41" },
	9: { name: "3/2", move: 3, levy: 2, image: "32" },
	10: { name: "3/2", move: 3, levy: 2, image: "32" },
	11: { name: "3/1", move: 3, levy: 1, image: "31" },
	12: { name: "3/1", move: 3, levy: 1, image: "31" },
	13: { name: "3/1", move: 3, levy: 1, image: "31" },
	14: { name: "2/3", move: 2, levy: 3, image: "23" },
	15: { name: "2/3", move: 2, levy: 3, image: "23" },
	16: { name: "2/3", move: 2, levy: 3, image: "23" },
	17: { name: "2/3", move: 2, levy: 3, image: "23" },
	18: { name: "2/2", move: 2, levy: 2, image: "22" },
	19: { name: "2/2", move: 2, levy: 2, image: "22" },
	20: { name: "2/2", move: 2, levy: 2, image: "22" },
	21: { name: "2/2", move: 2, levy: 2, image: "22" },
	22: { name: "2/1", move: 2, levy: 1, image: "21" },
	23: { name: "2/1", move: 2, levy: 1, image: "21" },
	24: { name: "2/1", move: 2, levy: 1, image: "21" },
	25: { name: "1/3", move: 1, levy: 3, image: "13" },
	26: { name: "1/2", move: 1, levy: 2, image: "12" },
	27: { name: "1/2", move: 1, levy: 2, image: "12" },
};

const BLOCKS = {};
const EDGES = {};

const SPACES = {
	Dead: { x: 300, y: 236 },
	Levy: { x: 767, y: 1191 },
	Aenos: { x: 1872, y: 463 },
	Aleria: { x: 1000, y: 470 },
	Alexandria: { x: 2045, y: 1083 },
	Ambracia: { x: 1582, y: 600 },
	Ancyra: { x: 2195, y: 488 },
	Antiochia: { x: 2360, y: 700 },
	Appia: { x: 2043, y: 553 },
	Aquileia: { x: 1215, y: 206 },
	Asculum: { x: 1233, y: 394 },
	Asturica: { x: 232, y: 565 },
	Athenae: { x: 1739, y: 663 },
	Badias: { x: 902, y: 977 },
	Bilbilis: { x: 459, y: 585 },
	Brundisium: { x: 1441, y: 525 },
	Burdigala: { x: 495, y: 320 },
	Byzantium: { x: 1990, y: 417 },
	Caralis: { x: 990, y: 665 },
	'Carthago Nova': { x: 479, y: 818 },
	Catabathmus: { x: 1890, y: 1080 },
	Cenabum: { x: 653, y: 133 },
	Corduba: { x: 317, y: 837 },
	Creta: { x: 1794, y: 842 },
	Cyrene: { x: 1584, y: 1044 },
	Damascus: { x: 2415, y: 870 },
	Dyrrachium: { x: 1522, y: 472 },
	Emerita: { x: 200, y: 765 },
	Ephesus: { x: 1905, y: 635 },
	Eusebia: { x: 2310, y: 556 },
	Gades: { x: 232, y: 922 },
	Genua: { x: 995, y: 313 },
	Iomnium: { x: 763, y: 860 },
	Jerusalem: { x: 2324, y: 994 },
	Lilybaeum: { x: 1172, y: 731 },
	Lugdunum: { x: 790, y: 235 },
	Massilia: { x: 795, y: 405 },
	Memphis: { x: 2105, y: 1167 },
	Messana: { x: 1290, y: 708 },
	Narbo: { x: 695, y: 455 },
	Neapolis: { x: 1298, y: 535 },
	Nicomedia: { x: 2056, y: 424 },
	Olisipo: { x: 92, y: 810 },
	Pelusium: { x: 2178, y: 1069 },
	Perga: { x: 2085, y: 700 },
	Pergamum: { x: 1913, y: 535 },
	Portus: { x: 100, y: 630 },
	Pylos: { x: 1633, y: 733 },
	Ravenna: { x: 1144, y: 286 },
	Rhegium: { x: 1357, y: 698 },
	Roma: { x: 1160, y: 450 },
	Sala: { x: 205, y: 1089 },
	Salamis: { x: 2240, y: 800 },
	Salona: { x: 1336, y: 319 },
	Serdica: { x: 1689, y: 354 },
	Siga: { x: 472, y: 987 },
	Sinope: { x: 2303, y: 339 },
	Sipontum: { x: 1325, y: 455 },
	Sirmium: { x: 1460, y: 208 },
	Syracusae: { x: 1302, y: 778 },
	Tacape: { x: 1059, y: 1019 },
	Tarraco: { x: 564, y: 599 },
	Tarsus: { x: 2285, y: 675 },
	Thessalonica: { x: 1689, y: 484 },
	Thubactus: { x: 1276, y: 1084 },
	Tingis: { x: 257, y: 1000 },
	Toletum: { x: 359, y: 712 },
	Treviri: { x: 860, y: 68 },
	Utica: { x: 1045, y: 795 },
	'Mare Aegaeum': { x: 1830, y: 670 },
	'Mare Aegypticum': { x: 2020, y: 905 },
	'Mare Hadriaticum': { x: 1360, y: 390 },
	'Mare Hispanum': { x: 835, y: 650 },
	'Mare Internum': { x: 1485, y: 870 },
	'Mare Tyrrhenum': { x: 1140, y: 640 },
	'Oceanus Atlanticus': { x: 118, y: 1014 },
	'Pontus Euxinus': { x: 2147, y: 271 },
	'Propontis': { x: 1945, y: 468 }
};

(function () {
	function space(axis, major_align, minor_align, wrap, name, type, value) {
		SPACES[name].type = type;
		SPACES[name].value = value | 0;
		SPACES[name].exits = [];
		SPACES[name].layout_axis = axis;
		SPACES[name].layout_major = (1 - major_align) / 2;
		SPACES[name].layout_minor = (1 - minor_align) / 2;
		SPACES[name].wrap = wrap;
	}

	space('X', 0, 0, 3, "Dead", "pool");
	space('X', 0, 0, 18, "Levy", "pool");

	space('Y', -1, 0,	3, "Aenos", "port");
	space('X', 0, 0,	3, "Aleria", "port");
	space('X', 0, -1,	3, "Alexandria", "major-port", 2);
	space('X', 0, 0,	3, "Ambracia", "port");
	space('X', 1, 0,	3, "Ancyra", "city");
	space('Y', 0, 1,	4, "Antiochia", "port", 1);
	space('X', 1, 0,	3, "Appia", "city");
	space('X', 1, 0,	3, "Aquileia", "port");
	space('Y', 0, 1,	3, "Asculum", "city");
	space('Y', -1, 0,	3, "Asturica", "city");
	space('Y', 0, 0,	4, "Athenae", "major-port", 1);
	space('X', -1, 1,	3, "Badias", "city");
	space('X', -1, 0,	3, "Bilbilis", "city");
	space('Y', 1, 0,	3, "Brundisium", "port");
	space('Y', 1, -1,	3, "Burdigala", "port");
	space('Y', -1, 0,	4, "Byzantium", "port", 1);
	space('Y', -1, 0,	3, "Caralis", "port");
	space('X', 1, 0,	4, "Carthago Nova", "major-port", 1);
	space('X', -1, 1,	3, "Catabathmus", "port");
	space('X', -1, 0,	3, "Cenabum", "city");
	space('X', 0, 0,	3, "Corduba", "city");
	space('X', 0, 0,	3, "Creta", "major-port");
	space('X', 0, 1,	3, "Cyrene", "port");
	space('X', -1, 0,	3, "Damascus", "city");
	space('Y', -1, 0,	3, "Dyrrachium", "port");
	space('Y', -1, 0,	3, "Emerita", "city");
	space('X', 1, 0,	4, "Ephesus", "major-port", 1);
	space('X', 1, 0,	3, "Eusebia", "city");
	space('X', 0, 0,	3, "Gades", "port");
	space('Y', -1, -1,	3, "Genua", "port");
	space('X', 0, 1,	3, "Iomnium", "port");
	space('X', 0, 0,	3, "Jerusalem", "city");
	space('Y', 1, 0,	3, "Lilybaeum", "port");
	space('X', 0, -1,	3, "Lugdunum", "city");
	space('Y', 0, 1,	4, "Massilia", "major-port", 1);
	space('X', 0, 1,	3, "Memphis", "city");
	space('Y', -1, 0,	3, "Messana", "port");
	space('X', -1, 0,	3, "Narbo", "port");
	space('X', 0, 1,	3, "Neapolis", "major-port");
	space('X', 1, 0,	3, "Nicomedia", "port");
	space('Y', 1, 0,	3, "Olisipo", "port");
	space('X', 1, 0,	3, "Pelusium", "port");
	space('Y', 1, -1,	3, "Perga", "port");
	space('X', 0, 0,	3, "Pergamum", "city");
	space('Y', 0, 0,	3, "Portus", "port");
	space('X', -1, 0,	3, "Pylos", "port");
	space('Y', -1, -1,	3, "Ravenna", "major-port");
	space('X', 1, 0,	3, "Rhegium", "port");
	space('Y', 0, -1,	4, "Roma", "port", 2);
	space('X', 1, 1,	3, "Sala", "port");
	space('X', 0, 0,	3, "Salamis", "major-port");
	space('X', 1, 0,	3, "Salona", "port");
	space('X', 0, 0,	3, "Serdica", "city");
	space('X', 0, 1,	3, "Siga", "port");
	space('X', 0, 0,	3, "Sinope", "port");
	space('X', 1, 0,	3, "Sipontum", "port");
	space('X', 1, -1,	3, "Sirmium", "city");
	space('Y', 1, 0,	4, "Syracusae", "major-port", 1);
	space('X', 0, 1,	3, "Tacape", "port");
	space('X', 1, 0,	4, "Tarraco", "port", 1);
	space('X', -1, 0,	3, "Tarsus", "port");
	space('X', 0, 0,	3, "Thessalonica", "port");
	space('X', 0, 0,	3, "Thubactus", "port");
	space('X', 0, 0,	3, "Tingis", "port");
	space('X', 0, 0,	3, "Toletum", "city");
	space('X', 1, 1,	3, "Treviri", "city");
	space('X', -1, 0,	4, "Utica", "major-port", 1);

	space('Y', 0, 0, 5, "Mare Aegaeum", "sea");
	space('X', 0, 0, 5, "Mare Aegypticum", "sea");
	space('X', 0, 0, 5, "Mare Hadriaticum", "sea");
	space('Y', 0, 0, 5, "Mare Hispanum", "sea");
	space('X', 0, 0, 5, "Mare Internum", "sea");
	space('X', 0, 0, 5, "Mare Tyrrhenum", "sea");
	space('Y', 0, 0, 5, "Oceanus Atlanticus", "sea");
	space('X', 0, 0, 5, "Pontus Euxinus", "sea");
	space('X', 0, 0, 5, "Propontis", "sea");

	function edge(a, b, type) {
		if (a > b)
			[a, b] = [b, a];
		let AB = a + "/" + b;
		EDGES[AB] = type;
		SPACES[a].exits.push(b);
		SPACES[b].exits.push(a);
	}

	function major(a,b) { edge(a,b, "major"); }
	function minor(a,b) { edge(a,b, "minor"); }
	function strait(a,b) { edge(a,b, "strait"); }
	function sea(a,b) { edge(a,b, "sea"); }

	major("Alexandria", "Catabathmus");
	major("Alexandria", "Memphis");
	major("Antiochia", "Damascus");
	major("Antiochia", "Tarsus");
	major("Athenae", "Thessalonica");
	major("Aenos", "Byzantium");
	major("Aenos", "Thessalonica");
	major("Ancyra", "Appia");
	major("Ancyra", "Eusebia");
	major("Ancyra", "Nicomedia");
	major("Appia", "Ephesus");
	major("Aquileia", "Ravenna");
	major("Aquileia", "Salona");
	major("Aquileia", "Sirmium");
	major("Asculum", "Ravenna");
	major("Badias", "Utica");
	major("Bilbilis", "Burdigala");
	major("Bilbilis", "Toletum");
	major("Brundisium", "Neapolis");
	major("Burdigala", "Narbo");
	major("Carthago Nova", "Corduba");
	major("Carthago Nova", "Tarraco");
	major("Catabathmus", "Cyrene");
	major("Cenabum", "Lugdunum");
	major("Corduba", "Gades");
	major("Corduba", "Toletum");
	major("Damascus", "Jerusalem");
	major("Dyrrachium", "Thessalonica");
	major("Eusebia", "Tarsus");
	major("Genua", "Massilia");
	major("Genua", "Roma");
	major("Genua", "Ravenna");
	major("Iomnium", "Utica");
	major("Jerusalem", "Pelusium");
	major("Lugdunum", "Massilia");
	major("Massilia", "Narbo");
	major("Memphis", "Pelusium");
	major("Narbo", "Tarraco");
	major("Neapolis", "Roma");
	major("Neapolis", "Rhegium");
	major("Serdica", "Sirmium");
	major("Serdica", "Thessalonica");
	major("Tacape", "Utica");

	minor("Alexandria", "Pelusium");
	minor("Athenae", "Ambracia");
	minor("Athenae", "Pylos");
	minor("Aenos", "Serdica");
	minor("Ambracia", "Dyrrachium");
	minor("Ancyra", "Sinope");
	minor("Appia", "Nicomedia");
	minor("Appia", "Perga");
	minor("Asculum", "Roma");
	minor("Asculum", "Sipontum");
	minor("Asturica", "Bilbilis");
	minor("Asturica", "Emerita");
	minor("Asturica", "Portus");
	minor("Asturica", "Toletum");
	minor("Badias", "Iomnium");
	minor("Badias", "Tacape");
	minor("Bilbilis", "Tarraco");
	minor("Brundisium", "Sipontum");
	minor("Burdigala", "Cenabum");
	minor("Carthago Nova", "Gades");
	minor("Carthago Nova", "Toletum");
	minor("Cenabum", "Treviri");
	minor("Cyrene", "Thubactus");
	minor("Dyrrachium", "Salona");
	minor("Ephesus", "Perga");
	minor("Ephesus", "Pergamum");
	minor("Emerita", "Gades");
	minor("Emerita", "Olisipo");
	minor("Eusebia", "Sinope");
	minor("Gades", "Olisipo");
	minor("Genua", "Lugdunum");
	minor("Iomnium", "Siga");
	minor("Lilybaeum", "Messana");
	minor("Lilybaeum", "Syracusae");
	minor("Lugdunum", "Treviri");
	minor("Messana", "Syracusae");
	minor("Neapolis", "Sipontum");
	minor("Nicomedia", "Pergamum");
	minor("Nicomedia", "Sinope");
	minor("Olisipo", "Portus");
	minor("Perga", "Tarsus");
	minor("Roma", "Ravenna");
	minor("Sala", "Siga");
	minor("Sala", "Tingis");
	minor("Salona", "Sirmium");
	minor("Siga", "Tingis");
	minor("Tacape", "Thubactus");

	strait("Aenos", "Pergamum");
	strait("Byzantium", "Nicomedia");
	strait("Gades", "Tingis");
	strait("Messana", "Rhegium");

	sea("Alexandria", "Mare Aegypticum");
	sea("Antiochia", "Mare Aegypticum");
	sea("Athenae", "Mare Aegaeum");
	sea("Aenos", "Mare Aegaeum");
	sea("Aleria", "Mare Tyrrhenum");
	sea("Ambracia", "Mare Internum");
	sea("Aquileia", "Mare Hadriaticum");
	sea("Byzantium", "Pontus Euxinus");
	sea("Byzantium", "Propontis");
	sea("Brundisium", "Mare Hadriaticum");
	sea("Brundisium", "Mare Internum");
	sea("Burdigala", "Oceanus Atlanticus");
	sea("Carthago Nova", "Mare Hispanum");
	sea("Caralis", "Mare Hispanum");
	sea("Caralis", "Mare Tyrrhenum");
	sea("Catabathmus", "Mare Aegypticum");
	sea("Creta", "Mare Aegaeum");
	sea("Creta", "Mare Aegypticum");
	sea("Creta", "Mare Internum");
	sea("Cyrene", "Mare Internum");
	sea("Dyrrachium", "Mare Hadriaticum");
	sea("Ephesus", "Mare Aegaeum");
	sea("Gades", "Oceanus Atlanticus");
	sea("Genua", "Mare Hispanum");
	sea("Genua", "Mare Tyrrhenum");
	sea("Iomnium", "Mare Hispanum");
	sea("Lilybaeum", "Mare Internum");
	sea("Lilybaeum", "Mare Tyrrhenum");
	sea("Massilia", "Mare Hispanum");
	sea("Mare Aegaeum", "Mare Aegypticum");
	sea("Mare Aegaeum", "Mare Internum");
	sea("Mare Aegaeum", "Propontis");
	sea("Mare Aegaeum", "Thessalonica");
	sea("Mare Aegypticum", "Mare Internum");
	sea("Mare Aegypticum", "Pelusium");
	sea("Mare Aegypticum", "Perga");
	sea("Mare Aegypticum", "Salamis");
	sea("Mare Aegypticum", "Tarsus");
	sea("Mare Hadriaticum", "Mare Internum");
	sea("Mare Hadriaticum", "Ravenna");
	sea("Mare Hadriaticum", "Salona");
	sea("Mare Hadriaticum", "Sipontum");
	sea("Mare Hispanum", "Mare Tyrrhenum");
	sea("Mare Hispanum", "Narbo");
	sea("Mare Hispanum", "Oceanus Atlanticus");
	sea("Mare Hispanum", "Siga");
	sea("Mare Hispanum", "Tarraco");
	sea("Mare Hispanum", "Tingis");
	sea("Mare Hispanum", "Utica");
	sea("Mare Internum", "Mare Tyrrhenum");
	sea("Mare Internum", "Messana");
	sea("Mare Internum", "Pylos");
	sea("Mare Internum", "Rhegium");
	sea("Mare Internum", "Syracusae");
	sea("Mare Internum", "Tacape");
	sea("Mare Internum", "Thubactus");
	sea("Mare Internum", "Utica");
	sea("Mare Tyrrhenum", "Messana");
	sea("Mare Tyrrhenum", "Neapolis");
	sea("Mare Tyrrhenum", "Roma");
	sea("Mare Tyrrhenum", "Rhegium");
	sea("Mare Tyrrhenum", "Utica");
	sea("Nicomedia", "Propontis");
	sea("Oceanus Atlanticus", "Olisipo");
	sea("Oceanus Atlanticus", "Portus");
	sea("Oceanus Atlanticus", "Sala");
	sea("Oceanus Atlanticus", "Tingis");
	sea("Pontus Euxinus", "Propontis");
	sea("Pontus Euxinus", "Sinope");

	let index = 0;

	function block(owner, CR, steps, type, name, levy) {
		let id = name;
		let [initiative, firepower] = CR;
		if (type !== 'leader' && type !== 'cleopatra' && type !== 'legio')
			id = owner[0] + " " + id;
		let descr = name;
		if (type !== 'leader' && type !== 'cleopatra' && type !== 'legio')
			descr = owner[0] + ". " + descr;
		if (levy) {
			if (levy === "Carthago Nova")
				descr += " (C. Nova)";
			else
				descr += " (" + levy + ")";
		}
		BLOCKS[id] = {
			owner: owner,
			name: name,
			steps: steps,
			initiative: initiative,
			firepower: firepower,
			type: type,
			levy: levy,
			description: descr,
			label: index++,
		}
	}

	function caesar(CR,S,T,N,L) { block(CAESAR, CR, S, T, N, L); }
	function pompeius(CR,S,T,N,L) { block(POMPEIUS, CR, S, T, N, L); }

	caesar("A3", 3, "leader", "Caesar");
	caesar("A2", 2, "leader", "Antonius");
	caesar("A2", 3, "leader", "Octavian");

	caesar("C2", 3, "legio", "Legio 7", "Tarraco");
	caesar("C3", 3, "legio", "Legio 8", "Tarraco");
	caesar("C2", 3, "legio", "Legio 9", "Carthago Nova");
	caesar("C4", 3, "legio", "Legio 10", "Corduba");
	caesar("C3", 3, "legio", "Legio 11", "Genua");
	caesar("C3", 3, "legio", "Legio 12", "Genua");
	caesar("C3", 3, "legio", "Legio 13", "Ravenna");

	caesar("C3", 3, "legio", "Legio 14", "Ravenna");
	caesar("C2", 3, "legio", "Legio 16", "Aquileia");
	caesar("C2", 4, "legio", "Legio 17", "Roma");
	caesar("C2", 4, "legio", "Legio 18", "Neapolis");
	caesar("C2", 4, "legio", "Legio 19", "Syracusae");
	caesar("C2", 4, "legio", "Legio 20", "Athenae");
	caesar("C3", 4, "legio", "Legio 21", "Ancyra");

	caesar("B2", 3, "equitatus", "Equitatus 1", "Lugdunum");
	caesar("B2", 2, "equitatus", "Equitatus 2", "Toletum");
	caesar("B3", 2, "equitatus", "Equitatus 3", "Byzantium");
	caesar("B3", 3, "equitatus", "Equitatus 4", "Antiochia");

	caesar("B1", 4, "auxilia-b", "Auxilia 1");
	caesar("B1", 4, "auxilia-b", "Auxilia 2");
	caesar("A1", 3, "auxilia-a", "Auxilia 3");
	caesar("A1", 3, "auxilia-a", "Auxilia 4");

	caesar("X4", 2, "ballista", "Ballista");

	caesar("D2", 2, "navis", "Navis 1");
	caesar("D2", 2, "navis", "Navis 2");
	caesar("D2", 2, "navis", "Navis 3");
	caesar("D3", 2, "navis", "Navis 4");
	caesar("D3", 2, "navis", "Navis 5");

	block(POMPEIUS, "C1", 4, "cleopatra", "Cleopatra");

	pompeius("B3", 3, "leader", "Pompeius");
	pompeius("A2", 3, "leader", "Scipio");
	pompeius("A2", 2, "leader", "Brutus");

	pompeius("C2", 4, "legio", "Legio 1", "Roma");
	pompeius("C2", 4, "legio", "Legio 2", "Carthago Nova");
	pompeius("C3", 3, "legio", "Legio 3", "Ravenna");
	pompeius("C2", 3, "legio", "Legio 4", "Carthago Nova");
	pompeius("C2", 3, "legio", "Legio 5", "Tarraco");
	pompeius("C2", 3, "legio", "Legio 6", "Tarraco");
	pompeius("C2", 3, "legio", "Legio 32", "Athenae");

	pompeius("C3", 3, "legio", "Legio 33", "Creta");
	pompeius("C3", 3, "legio", "Legio 34", "Antiochia");
	pompeius("C2", 3, "legio", "Legio 35", "Byzantium");
	pompeius("C2", 4, "legio", "Legio 36", "Ephesus");
	pompeius("C2", 3, "legio", "Legio 37", "Syracusae");
	pompeius("C2", 4, "legio", "Legio 38", "Alexandria");
	pompeius("C2", 3, "legio", "Legio 39", "Utica");

	pompeius("B3", 2, "equitatus", "Equitatus 1", "Toletum");
	pompeius("B2", 4, "equitatus", "Equitatus 2", "Badias");
	pompeius("B2", 3, "equitatus", "Equitatus 3", "Antiochia");
	pompeius("B3", 2, "elephant", "Elephant", "Utica");

	pompeius("B1", 4, "auxilia-b", "Auxilia 1");
	pompeius("B1", 4, "auxilia-b", "Auxilia 2");
	pompeius("A1", 3, "auxilia-a", "Auxilia 3");
	pompeius("A1", 3, "auxilia-a", "Auxilia 4");

	pompeius("X4", 2, "ballista", "Ballista");

	pompeius("D3", 2, "navis", "Navis 1");
	pompeius("D3", 2, "navis", "Navis 2");
	pompeius("D2", 2, "navis", "Navis 3");
	pompeius("D2", 2, "navis", "Navis 4");
	pompeius("D2", 2, "navis", "Navis 5");
})();

if (typeof module !== 'undefined')
	module.exports = { CARDS, BLOCKS, SPACES, EDGES }
