"use strict";

// Diary: 2021-04-23 - Friday Evening - Started game logic shell.
// Diary: 2021-04-24 - Saturday - Art, UI, preparation phase.
// Diary: 2021-04-25 - Sunday - Supply, movement and battle.
// Diary: 2021-04-26 - Monday Evening - Redid piece layout. Transport armies on fleets.
// Diary: 2021-05-01 - Saturday Evening - Added undo. Started simple events.

// TODO: rewrite battle and movement states to common with is_friendly/etc
// TODO: undo in preparation phase
// TODO: separate land/port moves?

exports.scenarios = [
	"Default"
];

const OBSERVER = "Observer";
const GREECE = "Greece";
const PERSIA = "Persia";

const RESERVE = "reserve";
const ABYDOS = "Abydos";
const EPHESOS = "Ephesos";
const ATHENAI = "Athenai";
const SPARTA = "Sparta";
const PELLA = "Pella";

const MOLON_LABE = 12;
const SUDDEN_DEATH_OF_THE_GREAT_KING = 11;

const PERSIAN_EVENT_NAMES = {
	1: "Cavalry of Mardonius",
	2: "Tribute of Earth and Water",
	3: "Tribute of Earth and Water",
	4: "Carneia Festival",
	5: "The Immortals",
	6: "Ostracism",
	7: "The Great King",
	8: "The Royal Road",
	9: "Hippias",
	10: "Separate Peace",
	11: "Sudden Death of the Great King",
	12: "Defection of Thebes",
	13: "Tribute of Earth and Water",
	14: "Alliance with Carthage",
	15: "Acropolis on Fire",
	16: "Pacification of Babylon or Egypt",
};

const GREEK_EVENT_NAMES = {
	1: "Mines of Laurion",
	2: "Ionian Revolt",
	3: "Wrath of Poseidon",
	4: "Miltiades",
	5: "Themistocles",
	6: "Pausanias",
	7: "Oracle of Delphi",
	8: "Leonidas",
	9: "Artemisia I",
	10: "Evangelion",
	11: "Melas Zomos",
	12: "Molon Labe",
	13: "Triremes",
	14: "Support from Syracuse",
	15: "300 Spartans",
	16: "Desertion of Greek Soldiers",
};

const CITIES = [
	"Abydos",
	"Athenai",
	"Delphi",
	"Ephesos",
	"Eretria",
	"Korinthos",
	"Larissa",
	"Naxos",
	"Pella",
	"Sparta",
	"Thebai",
];

const PORTS = [
	"Abydos",
	"Athenai",
	"Ephesos",
	"Eretria",
	"Naxos",
	"Pella",
	"Sparta",
	"Thebai",
];

const CITIES_WITH_ROADS = [
	"Abydos",
	"Athenai",
	"Delphi",
	"Ephesos",
	"Korinthos",
	"Larissa",
	"Pella",
	"Sparta",
	"Thebai",
];

const SUPPLY = {
	"Abydos": 3,
	"Athenai": 2,
	"Delphi": 1,
	"Ephesos": 3,
	"Eretria": 1,
	"Korinthos": 1,
	"Larissa": 1,
	"Naxos": 1,
	"Pella": 1,
	"Sparta": 2,
	"Thebai": 1,
};

const SCORE = {
	"Abydos": 2,
	"Athenai": 2,
	"Delphi": 1,
	"Ephesos": 2,
	"Eretria": 1,
	"Korinthos": 1,
	"Larissa": 1,
	"Naxos": 1,
	"Pella": 1,
	"Sparta": 2,
	"Thebai": 1,
};

const ROADS = {
	"Abydos": [ "Ephesos", "Pella" ],
	"Athenai": [ "Korinthos", "Thebai" ],
	"Delphi": [ "Larissa", "Thebai" ],
	"Ephesos": [ "Abydos" ],
	"Eretria": [],
	"Korinthos": [ "Athenai", "Sparta" ],
	"Larissa": [ "Delphi", "Pella", "Thebai" ],
	"Naxos": [],
	"Pella": [ "Abydos", "Larissa" ],
	"Sparta": [ "Korinthos" ],
	"Thebai": [ "Athenai", "Delphi", "Korinthos", "Larissa" ],
};

let states = {};
let game = null;

function $(msg) {
	return msg
		.replace(/ 1 cards/, " 1 card")
		.replace(/ 1 armies/, " 1 army")
		.replace(/ 1 fleets/, " 1 fleet")
		.replace(/ 1 talents/, " 1 talent")
		.replace(/ 1 points/, " 1 point");
}

function remove_from_array(array, item) {
	let i = array.indexOf(item);
	if (i >= 0)
		array.splice(i, 1);
}

function log(...args) {
	let s = Array.from(args).join("");
	game.log.push($(s));
}


function clear_undo() {
	if (game.undo)
		game.undo.length = 0;
	else
		game.undo = [];
}

function push_undo() {
	game.undo.push(JSON.stringify(game, (k,v) => {
		if (k === 'undo') return undefined;
		if (k === 'log') return v.length;
		return v;
	}));
}

function pop_undo() {
	let undo = game.undo;
	let log = game.log;
	Object.assign(game, JSON.parse(undo.pop()));
	game.undo = undo;
	log.length = game.log;
	game.log = log;
}

function gen_action_undo(view) {
	if (!view.actions)
		view.actions = {}
	if (game.undo && game.undo.length > 0)
		view.actions.undo = 1;
	else
		view.actions.undo = 0;
}

function is_inactive_player(current) {
	return current == OBSERVER || game.active != current;
}

function gen_action(view, action, argument) {
	if (!view.actions)
		view.actions = {}
	if (argument != undefined) {
		if (!(action in view.actions)) {
			view.actions[action] = [ argument ];
		} else {
			if (!view.actions[action].includes(argument))
				view.actions[action].push(argument);
		}
	} else {
		view.actions[action] = 1;
	}
}

function roll_d6() {
	return Math.floor(Math.random() * 6) + 1;
}

function create_deck() {
	let deck = [];
	for (let c = 1; c <= 16; ++c)
		deck.push(c);
	return deck;
}

function reshuffle() {
	log("The deck is reshuffled.");
	while (game.discard.length > 0)
		game.deck.push(game.discard.pop());
}

function draw_card(deck) {
	if (deck.length == 0)
		reshuffle();
	if (deck.length == 0)
		throw Error("can't draw from empty deck");
	let k = Math.floor(Math.random() * deck.length);
	let card = deck[k];
	deck.splice(k, 1);
	return card;
}

function can_draw_card(extra) {
	return game.deck.length + game.discard.length - extra > 0;
}

function discard_persian_hand() {
	for (let c of game.persian.hand)
		game.discard.push(c);
	game.persian.hand.length = 0;
}

function discard_greek_hand() {
	for (let c of game.greek.hand)
		game.discard.push(c);
	game.greek.hand.length = 0;
}

function discard_card(who, hand, card) {
	log(who + " discards card " + card + ".");
	remove_from_array(hand, card);
	game.discard.push(card);
}

function play_card(who, hand, card, reason) {
	log(who + " plays card " + card + reason);
	remove_from_array(hand, card);
	game.discard.push(card);
}

function add_vp(delta) {
	// greek vp is negative
	game.vp += delta;
	if (game.vp < -6) game.vp = -6;
	if (game.vp > 6) game.vp = 6;
}

function add_greek_vp(n=1) {
	add_vp(-n);
}

function add_persian_vp(n=1) {
	add_vp(n);
}

function count_greek_armies(where) { return game.units[where][0] | 0; }
function count_persian_armies(where) { return game.units[where][1] | 0; }
function count_greek_fleets(where) { return game.units[where][2] | 0; }
function count_persian_fleets(where) { return game.units[where][3] | 0; }

function remove_greek_army(from) {
	log("Greece removes army from " + from + ".");
	game.units[from][0] -= 1;
}

function remove_persian_army(from) {
	log("Persia removes army from " + from + ".");
	game.units[from][1] -= 1;
}

function remove_greek_fleet(from) {
	log("Greece removes fleet from " + from + ".");
	game.units[from][2] -= 1;
}

function remove_persian_fleet(from) {
	log("Persia removes fleet from " + from + ".");
	game.units[from][3] -= 1;
}

function move_greek_army(from, to, n = 1) {
	game.units[from][0] -= n;
	game.units[to][0] += n;
}

function move_persian_army(from, to, n = 1) {
	game.units[from][1] -= n;
	game.units[to][1] += n;
}

function move_greek_fleet(from, to, n = 1) {
	game.units[from][2] -= n;
	game.units[to][2] += n;
}

function move_persian_fleet(from, to, n = 1) {
	game.units[from][3] -= n;
	game.units[to][3] += n;
}

function is_persian_control(where) {
	if (where == ABYDOS || where == EPHESOS)
		return count_greek_armies(where) == 0;
	return count_persian_armies(where) > 0;
}

function is_greek_control(where) {
	if (where == ATHENAI || where == SPARTA)
		return count_persian_armies(where) == 0;
	return count_greek_armies(where) > 0;
}

function gen_greek_cities(view) {
	for (let city of CITIES)
		if (is_greek_control(city))
			gen_action(view, 'city', city);
}

function gen_persian_cities(view) {
	for (let city of CITIES)
		if (is_persian_control(city))
			gen_action(view, 'city', city);
}

function gen_greek_armies(view) {
	for (let city of CITIES)
		if (count_greek_armies(city) > 0)
			gen_action(view, 'city', city);
}

function gen_persian_armies(view) {
	for (let city of CITIES)
		if (count_persian_armies(city) > 0)
			gen_action(view, 'city', city);
}

function gen_greek_fleets(view) {
	for (let port of PORTS)
		if (count_greek_fleets(port) > 0)
			gen_action(view, 'port', port);
}

function gen_persian_fleets(view) {
	for (let port of PORTS)
		if (count_persian_fleets(port) > 0)
			gen_action(view, 'port', port);
}

// DEATH OF A KING

function goto_sudden_death_of_darius() {
	game.trigger.darius = 1;
	log("Sudden Death of Darius!");
	game.state = 'sudden_death_of_darius';
	if (count_persian_armies(RESERVE) > 0) {
		remove_persian_army(RESERVE);
		game.remove_army = 0;
	} else {
		game.remove_army = 1;
	}
}

states.sudden_death_of_darius = {
	prompt: function (view, current) {
		view.prompt = "Sudden Death of Darius!";
		if (is_inactive_player(current))
			return;
		if (game.remove_army) {
			view.prompt += " Remove one army.";
			gen_persian_armies(view);
		} else {
			gen_action(view, 'next');
		}
	},
	city: function (space) {
		remove_persian_army(space);
		game.remove_army = 0;
	},
	next: function () {
		discard_persian_hand();
		reshuffle();
		end_campaign();
	},
}

function goto_assassination_of_xerxes() {
	game.trigger.xerxes = 1;
	log("Assassination of Xerxes!");
	game.state = 'assassination_of_xerxes';
	if (count_persian_armies(RESERVE) > 0) {
		remove_persian_army(RESERVE);
		game.remove_army = 0;
	} else {
		game.remove_army = 1;
	}
}

states.assassination_of_xerxes = {
	prompt: function (view, current) {
		view.prompt = "Assassination of Xerxes!";
		if (is_inactive_player(current))
			return;
		if (game.remove_army) {
			view.prompt += " Remove one army.";
			gen_persian_armies(view);
		} else {
			gen_action(view, 'next');
		}
	},
	city: function (space) {
		remove_persian_army(space);
		game.remove_army = 0;
	},
	next: function () {
		discard_persian_hand();
		reshuffle();
		end_campaign();
	},
}

// PREPARATION PHASE

function start_campaign() {
	log("");
	log("Start Campaign " + game.campaign);
	goto_persian_preparation_draw();
}

function goto_persian_preparation_draw() {
	game.active = PERSIA;
	game.state = 'persian_preparation_draw';
	if (game.persian.hand.length > 0)
		game.talents = 10;
	else
		game.talents = 12;
	game.persian.draw = 0;
}

function goto_greek_preparation_draw() {
	game.active = GREECE;
	game.state = 'greek_preparation_draw';
	game.talents = 6;
	game.greek.draw = 0;
}

states.persian_preparation_draw = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Persian Preparation Phase.";
		view.prompt = "Persian Preparation Phase: Draw up to 6 cards. " + game.talents + " talents left.";
		if (game.persian.draw < 6 && game.talents >= 1 && can_draw_card(game.persian.draw))
			gen_action(view, 'draw');
		gen_action_undo(view);
		gen_action(view, 'next');
	},
	draw: function () {
		push_undo();
		--game.talents;
		++game.persian.draw;
	},
	next: function () {
		clear_undo();
		log("Persia draws " + game.persian.draw + " cards.");
		let sudden_death = 0;
		for (let i = 0; i < game.persian.draw; ++i) {
			let card = draw_card(game.deck);
			if (card == SUDDEN_DEATH_OF_THE_GREAT_KING)
				sudden_death = 1;
			game.persian.hand.push(card);
		}
		game.persian.draw = 0;
		if (sudden_death) {
			if (!game.trigger.darius)
				return goto_sudden_death_of_darius();
			if (!game.trigger.xerxes)
				return goto_assassination_of_xerxes();
		}
		goto_persian_preparation_build();
	},
	undo: pop_undo,
}

states.greek_preparation_draw = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Greek Preparation Phase.";
		view.prompt = "Greek Preparation Phase: Draw up to 6 cards. " + game.talents + " talents left.";
		if (game.greek.draw < 6 && game.talents >= 1 && can_draw_card(game.greek.draw))
			gen_action(view, 'draw');
		gen_action_undo(view);
		gen_action(view, 'next');
	},
	draw: function () {
		push_undo();
		--game.talents;
		++game.greek.draw;
	},
	next: function () {
		clear_undo();
		log("Greece draws " + game.greek.draw + " cards.");
		for (let i = 0; i < game.greek.draw; ++i) {
			let card = draw_card(game.deck);
			game.greek.hand.push(card);
		}
		game.greek.draw = 0;
		goto_greek_preparation_build();
	},
	undo: pop_undo,
}

function goto_persian_preparation_build() {
	game.active = PERSIA;
	game.state = 'persian_preparation_build';
	game.built_fleets = 0;
}

states.persian_preparation_build = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Persian Preparation Phase.";
		view.prompt = "Persian Preparation Phase: Build fleets, armies, and/or the bridge. ";
		view.prompt += game.talents + " talents left.";
		if (game.talents >= 1 && count_persian_armies(RESERVE) > 0) {
			for (let space of CITIES)
				if (is_persian_control(space))
					gen_action(view, 'city', space);
		}
		if (game.built_fleets < 2 && game.talents >= 2 && count_persian_fleets(RESERVE) > 0) {
			for (let space of PORTS)
				if (is_persian_control(space) && count_greek_fleets(space) == 0)
					gen_action(view, 'port', space);
		}
		if (!game.trigger.hellespont && game.talents >= 6 && is_persian_control(ABYDOS)) {
			gen_action(view, 'build');
		}
		gen_action(view, 'next');
		gen_action_undo(view);
	},
	city: function (space) {
		push_undo();
		log("Persia builds an army in " + space + ".");
		game.talents -= 1;
		move_persian_army(RESERVE, space);
	},
	port: function (space) {
		push_undo();
		log("Persia builds a fleet in " + space + ".");
		game.built_fleets += 1;
		game.talents -= 2;
		move_persian_fleet(RESERVE, space);
	},
	build: function () {
		push_undo();
		log("Persia builds the pontoon bridge.");
		game.talents -= 6;
		game.trigger.hellespont = 1;
	},
	next: function () {
		clear_undo();
		game.talents = 0;
		goto_greek_preparation_draw();
	},
	undo: pop_undo,
}

function goto_greek_preparation_build() {
	game.active = GREECE;
	game.state = 'greek_preparation_build';
	game.built_fleets = 0;
}

states.greek_preparation_build = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Greek Preparation Phase.";
		view.prompt = "Greek Preparation Phase: Build fleets and armies. ";
		view.prompt += game.talents + " talents left.";
		if (game.talents >= 1 && count_greek_armies(RESERVE) > 0) {
			for (let space of CITIES)
				if (is_greek_control(space))
					gen_action(view, 'city', space);
		}
		if (game.built_fleets < 2 && game.talents >= 1 && count_greek_fleets(RESERVE) > 0) {
			for (let space of PORTS)
				if (is_greek_control(space) && count_persian_fleets(space) == 0)
					gen_action(view, 'port', space);
		}
		gen_action_undo(view);
		gen_action(view, 'next');
	},
	city: function (space) {
		push_undo();
		log("Greece builds an army in " + space + ".");
		game.talents -= 1;
		move_greek_army(RESERVE, space);
	},
	port: function (space) {
		push_undo();
		log("Greece builds a fleet in " + space + ".");
		game.built_fleets += 1;
		game.talents -= 1;
		move_greek_fleet(RESERVE, space);
	},
	next: function () {
		clear_undo();
		game.talents = 0;
		end_preparation_phase();
	},
	undo: pop_undo,
}

function end_preparation_phase() {
	game.persian.pass = 0;
	game.greek.pass = 0;
	goto_persian_operation();
}

// OPERATIONS PHASE

function goto_greek_operation() {
	if (game.greek.hand.length > 0) {
		game.active = GREECE;
		game.state = 'greek_operation';
		game.greek.pass = 0;
	} else {
		log("Greece passes automatically.");
		game.greek.pass = 1;
		end_greek_operation();
	}
}

function goto_persian_operation() {
	game.tribute_of_earth_and_water = null;
	if (game.persian.hand.length > 0) {
		game.active = PERSIA;
		game.state = 'persian_operation';
		game.persian.pass = 0;
	} else {
		log("Persia passes automatically.");
		game.persian.pass = 1;
		end_persian_operation();
	}
}

states.persian_operation = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Persian Operation Phase.";
		view.prompt = "Persian Operation Phase: Play a card or pass.";
		for (let card of game.persian.hand) {
			gen_action(view, 'card_move', card);
			if (can_play_persian_event(card))
				gen_action(view, 'card_event', card);
		}
		gen_action(view, 'pass');
	},
	card_move: function (card) {
		play_card("Persia", game.persian.hand, card, " for movement.");
		game.state = 'persian_movement';
	},
	card_event: function (card) {
		play_persian_event(card);
	},
	pass: function () {
		log("Persia passes.");
		game.persian.pass = 1;
		end_persian_operation();
	},
}

states.greek_operation = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Greek Operation Phase.";
		view.prompt = "Greek Operation Phase: Play a card or pass.";
		for (let card of game.greek.hand) {
			gen_action(view, 'card_move', card);
			if (can_play_greek_event(card))
				gen_action(view, 'card_event', card);
		}
		gen_action(view, 'pass');
	},
	card_move: function (card) {
		play_card("Greece", game.greek.hand, card, " for movement.");
		game.state = 'greek_movement';
	},
	card_event: function (card) {
		play_greek_event(card);
	},
	pass: function () {
		log("Greece passes.");
		game.greek.pass = 1;
		end_greek_operation();
	},
}

function end_persian_movement() {
	let event = game.event;
	game.event = null;
	switch (event) {
	default:
		end_persian_operation();
		break;
	}
}

function end_greek_movement() {
	let event = game.event;
	console.log("end_greek_movement event=", game.event);
	game.event = null;
	switch (event) {
	case MOLON_LABE:
		end_persian_operation();
		break;
	default:
		end_greek_operation();
		break;
	}
}

function end_persian_operation() {
	game.move_list = null;
	game.transport = 0;
	game.attacker = 0;
	if (game.persian.pass && game.greek.pass)
		return end_operation_phase();
	goto_greek_operation();
}

function end_greek_operation() {
	game.move_list = null;
	game.transport = 0;
	game.attacker = 0;
	if (game.persian.pass && game.greek.pass)
		return end_operation_phase();
	goto_persian_operation();
}

function end_operation_phase() {
	game.persian.pass = 0;
	game.greek.pass = 0;
	goto_supply_phase();
}

// MOVEMENT

function is_usable_road(from, to) {
	if (from == ABYDOS && to == PELLA && !game.trigger.hellespont)
		return false;
	if (from == PELLA && to == ABYDOS && !game.trigger.hellespont)
		return false;
	return true;
}

function list_persian_land_moves(seen, from) {
	seen[from] = 1;
	if (is_persian_control(from))
		for (let to of ROADS[from])
			if (is_usable_road(from, to) && !seen[to])
				list_persian_land_moves(seen, to);
}

function list_greek_land_moves(seen, from) {
	seen[from] = 1;
	if (is_greek_control(from))
		for (let to of ROADS[from])
			if (is_usable_road(from, to) && !seen[to])
				list_greek_land_moves(seen, to);
}

function goto_persian_land_movement_event(event) {
	game.event = event;
	game.active = PERSIA;
	game.state = 'persian_land_movement_event';
}

function goto_greek_land_movement_event(event) {
	game.event = event;
	game.active = GREECE;
	game.state = 'greek_land_movement_event';
}

states.persian_land_movement_event = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = PERSIAN_EVENT_NAMES[game.event] + ".";
		view.prompt = PERSIAN_EVENT_NAMES[game.event] + ": Choose an origin.";
		gen_persian_armies(view);
		gen_action(view, 'pass');
	},
	city: function (space) {
		push_undo();
		goto_persian_land_movement(space);
	},
	pass: function () {
		end_land_movement_event();
	},
}

states.greek_land_movement_event = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = GREEK_EVENT_NAMES[game.event] + ".";
		view.prompt = GREEK_EVENT_NAMES[game.event] + ": Choose an origin.";
		gen_greek_armies(view);
		gen_action(view, 'pass');
	},
	city: function (space) {
		push_undo();
		goto_greek_land_movement(space);
	},
	pass: function () {
		end_land_movement_event();
	},
}

states.persian_movement = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Persian Movement.";
		view.prompt = "Persian Movement: Choose an origin.";
		gen_persian_armies(view);
		gen_persian_fleets(view);
		gen_action(view, 'pass');
	},
	city: function (space) {
		goto_persian_land_movement(space);
	},
	port: function (space) {
		game.from = space;
		game.state = 'persian_naval_movement';
	},
	pass: function () {
		end_persian_movement();
	},
}

states.greek_movement = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Greek Movement.";
		view.prompt = "Greek Movement: Choose an origin.";
		gen_greek_armies(view);
		gen_greek_fleets(view);
		gen_action(view, 'pass');
	},
	city: function (space) {
		goto_greek_land_movement(space);
	},
	port: function (space) {
		game.from = space;
		game.state = 'greek_naval_movement';
	},
	pass: function () {
		end_greek_movement();
	},
}

function goto_persian_land_movement(space) {
	game.from = space;
	game.state = 'persian_land_movement';
	list_persian_land_moves(game.move_list = {}, game.from);
}

function goto_greek_land_movement(space) {
	game.from = space;
	game.state = 'greek_land_movement';
	list_greek_land_moves(game.move_list = {}, game.from);
}

states.persian_land_movement = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Persian Land Movement.";
		view.prompt = "Persian Land Movement: Select armies to move and then a destination.";
		view.land_movement = game.from;
		for (let to in game.move_list)
			if (to != game.from)
				gen_action(view, 'city', to);
		gen_action(view, 'undo');
	},
	city: function ([to, armies]) {
		push_undo();
		log("Persia moves " + armies + " armies from " + game.from + " to " + to + ".");
		move_persian_army(game.from, to, armies);
		game.where = to;
		game.state = 'persian_land_movement_confirm';
	},
	pass: function () {
		end_persian_movement();
	},
	undo: pop_undo,
}

states.greek_land_movement = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Greek Land Movement.";
		view.prompt = "Greek Land Movement: Select armies to move and then a destination.";
		view.land_movement = game.from;
		for (let to in game.move_list)
			if (to != game.from)
				gen_action(view, 'city', to);
		gen_action(view, 'undo');
	},
	city: function ([to, armies]) {
		push_undo();
		log("Greece moves " + armies + " armies from " + game.from + " to " + to + ".");
		move_greek_army(game.from, to, armies);
		game.where = to;
		game.state = 'greek_land_movement_confirm';
	},
	pass: function () {
		end_greek_movement();
	},
	undo: pop_undo,
}

states.persian_land_movement_confirm = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Persian Land Movement.";
		view.prompt = "Persian Land Movement: Confirm destination.";
		gen_action(view, 'city', game.where);
		gen_action(view, 'next');
		gen_action(view, 'undo');
	},
	city: function () {
		clear_undo();
		goto_persian_land_battle();
	},
	next: function () {
		clear_undo();
		goto_persian_land_battle();
	},
	undo: pop_undo,
}

states.greek_land_movement_confirm = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Greek Land Movement.";
		view.prompt = "Greek Land Movement: Confirm destination.";
		gen_action(view, 'city', game.where);
		gen_action(view, 'next');
		gen_action(view, 'undo');
	},
	city: function () {
		clear_undo();
		goto_greek_land_battle();
	},
	next: function () {
		clear_undo();
		goto_greek_land_battle();
	},
	undo: pop_undo,
}

states.persian_naval_movement = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Persian Naval Movement.";
		view.prompt = "Persian Naval Movement: Select fleets to move, armies to transport, and then a destination.";
		view.naval_movement = game.from;
		for (let port of PORTS)
			if (port != game.from)
				gen_action(view, 'port', port);
		gen_action(view, 'undo');
	},
	port: function ([to, fleets, armies]) {
		push_undo();
		log("Persia moves " + fleets + " fleets and " + armies + " armies from " + game.from + " to " + to + ".");
		move_persian_fleet(game.from, to, fleets);
		move_persian_army(game.from, to, armies);
		game.transport = armies;
		game.attacker = PERSIA;
		game.where = to;
		game.state = 'persian_naval_movement_confirm';
	},
	pass: function () {
		end_persian_movement();
	},
	undo: function () {
		game.from = 0;
		game.state = 'persian_movement';
	},
}

states.greek_naval_movement = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Greek Naval Movement.";
		view.prompt = "Greek Naval Movement: Select fleets to move, armies to transport, and then a destination.";
		view.naval_movement = game.from;
		for (let port of PORTS)
			if (port != game.from)
				gen_action(view, 'port', port);
		gen_action(view, 'undo');
	},
	port: function ([to, fleets, armies]) {
		push_undo();
		log("Greece moves " + fleets + " fleets and " + armies + " armies from " + game.from + " to " + to + ".");
		move_greek_fleet(game.from, to, fleets);
		move_greek_army(game.from, to, armies);
		game.transport = armies;
		game.attacker = GREECE;
		game.where = to;
		game.state = 'greek_naval_movement_confirm';
	},
	pass: function () {
		end_greek_movement();
	},
	undo: function () {
		game.from = 0;
		game.state = 'greek_movement';
	},
}

states.persian_naval_movement_confirm = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Persian Naval Movement.";
		view.prompt = "Persian Naval Movement: Confirm destination.";
		gen_action(view, 'port', game.where);
		gen_action(view, 'next');
		gen_action(view, 'undo');
	},
	port: function () {
		clear_undo();
		goto_persian_naval_battle();
	},
	next: function () {
		clear_undo();
		goto_persian_naval_battle();
	},
	undo: pop_undo,
}

states.greek_naval_movement_confirm = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Greek Naval Movement.";
		view.prompt = "Greek Naval Movement: Confirm destination.";
		gen_action(view, 'port', game.where);
		gen_action(view, 'next');
		gen_action(view, 'undo');
	},
	port: function () {
		clear_undo();
		goto_greek_naval_battle();
	},
	next: function () {
		clear_undo();
		goto_greek_naval_battle();
	},
	undo: pop_undo,
}

// NAVAL BATTLE

function roll_battle_dice(who, count, cap) {
	count = Math.min(3, count);
	let rolls = [];
	let result = 0;
	for (let i = 0; i < count; ++i) {
		let die = roll_d6();
		rolls.push(die);
		die = Math.min(die, cap);
		if (die > result)
			result = die;
	}
	log(who + " rolls " + rolls.join(", ") + " = " + result + ".");
	return result;
}

function goto_persian_naval_battle() {
	game.naval_battle = 1;
	if (count_greek_fleets(game.where) > 0 && count_persian_fleets(game.where) > 0)
		goto_persian_naval_battle_react();
	else
		goto_persian_land_battle();
}

function goto_greek_naval_battle() {
	game.naval_battle = 1;
	if (count_greek_fleets(game.where) > 0 && count_persian_fleets(game.where) > 0)
		goto_greek_naval_battle_react();
	else
		goto_greek_land_battle();
}

function goto_persian_naval_battle_react() {
	game.active = GREECE;
	game.state = 'persian_naval_battle_react';
}

function goto_greek_naval_battle_react() {
	game.active = PERSIA;
	game.state = 'greek_naval_battle_react';
}

states.persian_naval_battle_react = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Persian Naval Battle: Persia attacks " + game.where + "!";
		view.prompt = "Persian Naval Battle: Persia attacks " + game.where + " with " +
			count_persian_fleets(game.where) + " fleets and " +
			count_persian_armies(game.where) + " armies!";
		gen_action(view, 'next');
	},
	next: function () {
		game.active = PERSIA;
		persian_naval_battle_round();
	},
}

states.greek_naval_battle_react = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Greek Naval Battle: Greece attacks " + game.where + "!";
		view.prompt = "Greek Naval Battle: Greece attacks " + game.where + " with " +
			count_greek_fleets(game.where) + " fleets and " +
			count_greek_armies(game.where) + " armies!";
		gen_action(view, 'next');
	},
	next: function () {
		game.active = GREECE;
		greek_naval_battle_round();
	},
}

function persian_naval_battle_round() {
	log("Persia attacks " + game.where + " at sea!");
	let p_max = (game.where == ABYDOS || game.where == EPHESOS) ? 5 : 4;
	let g_max = 6;
	let p_hit = roll_battle_dice("Persia", count_persian_fleets(game.where), p_max);
	let g_hit = roll_battle_dice("Greece", count_greek_fleets(game.where), g_max);
	if (p_hit >= g_hit) {
		log("Greece loses one fleet.");
		move_greek_fleet(game.where, RESERVE);
	}
	if (g_hit >= p_hit) {
		log("Persia loses one fleet.");
		move_persian_fleet(game.where, RESERVE);
		while (count_persian_fleets(game.where) < game.transport) {
			log("Persia loses one army.");
			move_persian_army(game.where, RESERVE);
			--game.transport;
		}
	}
	if (count_greek_fleets(game.where) > 0 && count_persian_fleets(game.where) > 0) {
		game.state = 'persian_naval_retreat_attacker';
	} else {
		goto_persian_land_battle(game.where);
	}
}

function greek_naval_battle_round() {
	log("Greece attacks " + game.where + " at sea!");
	let p_max = (game.where == ABYDOS || game.where == EPHESOS) ? 5 : 4;
	let g_max = 6;
	let p_hit = roll_battle_dice("Persia", count_persian_fleets(game.where), p_max);
	let g_hit = roll_battle_dice("Greece", count_greek_fleets(game.where), g_max);
	if (p_hit >= g_hit) {
		log("Greece loses one fleet.");
		move_greek_fleet(game.where, RESERVE);
		while (count_greek_fleets(game.where) < game.transport) {
			log("Greece loses one army.");
			move_greek_army(game.where, RESERVE);
			--game.transport;
		}
	}
	if (g_hit >= p_hit) {
		log("Persia loses one fleet.");
		move_persian_fleet(game.where, RESERVE);
	}
	if (count_greek_fleets(game.where) > 0 && count_persian_fleets(game.where) > 0) {
		game.state = 'greek_naval_retreat_attacker';
	} else {
		goto_greek_land_battle(game.where);
	}
}

states.persian_naval_retreat_attacker = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Persian Naval Battle: Attacker retreat?";
		view.prompt = "Persian Naval Battle: Continue the battle in " + game.from + " or retreat?";
		gen_action(view, 'port', game.from);
		gen_action(view, 'port', game.where); // shortcut for battle
		gen_action(view, 'battle');
	},
	port: function (to) {
		if (to != game.where) {
			log("Persia retreats to " + game.from + ".");
			move_persian_fleet(game.where, game.from, count_persian_fleets(game.where));
			move_persian_army(game.where, game.from, game.transport);
			end_battle();
		} else {
			game.active = GREECE;
			game.state = 'persian_naval_retreat_defender';
		}
	},
	battle: function () {
		game.active = GREECE;
		game.state = 'persian_naval_retreat_defender';
	},
}

states.greek_naval_retreat_attacker = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Greek Naval Battle: Attacker retreat?";
		view.prompt = "Greek Naval Battle: Continue the battle in " + game.from + " or retreat?";
		gen_action(view, 'port', game.from);
		gen_action(view, 'port', game.where); // shortcut for battle
		gen_action(view, 'battle');
	},
	port: function (to) {
		if (to != game.where) {
			log("Greece retreats to " + game.from + ".");
			move_greek_fleet(game.where, game.from, count_greek_fleets(game.where));
			move_greek_army(game.where, game.from, game.transport);
			end_battle();
		} else {
			game.active = PERSIA;
			game.state = 'greek_naval_retreat_defender';
		}
	},
	battle: function () {
		game.active = PERSIA;
		game.state = 'greek_naval_retreat_defender';
	},
}

states.persian_naval_retreat_defender = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Persian Naval Battle: Defender retreat?";
		view.prompt = "Persian Naval Battle: Continue the battle in " + game.from + " or retreat?";
		for (let port of PORTS)
			if (is_greek_control(port))
				gen_action(view, 'port', port);
		gen_action(view, 'port', game.where); // shortcut for battle
		gen_action(view, 'battle');
	},
	port: function (to) {
		game.active = PERSIA;
		if (to != game.where) {
			log("Greek fleets retreat to " + to + ".");
			move_greek_fleet(game.where, to, count_greek_fleets(game.where));
			goto_persian_land_battle();
		} else {
			persian_naval_battle_round();
		}
	},
	battle: function () {
		game.active = PERSIA;
		persian_naval_battle_round();
	},
}

states.greek_naval_retreat_defender = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Greek Naval Battle: Defender retreat?";
		view.prompt = "Greek Naval Battle: Continue the battle in " + game.from + " or retreat?";
		for (let port of PORTS)
			if (is_greek_control(port))
				gen_action(view, 'port', port);
		gen_action(view, 'port', game.where); // shortcut for battle
		gen_action(view, 'battle');
	},
	port: function (to) {
		game.active = GREECE;
		if (to != game.where) {
			log("Persian fleets retreat to " + to + ".");
			move_greek_fleet(game.where, to, count_greek_fleets(game.where));
			goto_greek_land_battle();
		} else {
			greek_naval_battle_round();
		}
	},
	battle: function () {
		game.active = GREECE;
		greek_naval_battle_round();
	},
}

// LAND BATTLE

function goto_persian_land_battle() {
	game.transport = 0;
	if (count_greek_armies(game.where) > 0 && count_persian_armies(game.where) > 0) {
		goto_persian_land_battle_react();
	} else {
		game.from = null;
		end_persian_movement();
	}
}

function goto_greek_land_battle() {
	game.transport = 0;
	if (count_greek_armies(game.where) > 0 && count_persian_armies(game.where) > 0) {
		goto_greek_land_battle_react();
	} else {
		game.from = null;
		end_greek_movement();
	}
}

function goto_persian_land_battle_react() {
	game.active = GREECE;
	game.state = 'persian_land_battle_react';
}

function goto_greek_land_battle_react() {
	game.active = PERSIA;
	game.state = 'greek_land_battle_react';
}

states.persian_land_battle_react = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Persian Land Battle: Persia attacks " + game.where + "!";
		view.prompt = "Persian Land Battle: Persia attacks " + game.where + " with " +
			count_persian_armies(game.where) + " armies!";
		gen_action(view, 'next');
	},
	next: function () {
		game.active = PERSIA;
		persian_land_battle_round();
	},
}

states.greek_land_battle_react = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Greek Land Battle: Greece attacks " + game.where + "!";
		view.prompt = "Greek Land Battle: Greece attacks " + game.where + " with " +
			count_greek_armies(game.where) + " armies!";
		gen_action(view, 'next');
	},
	next: function () {
		game.active = GREECE;
		greek_land_battle_round();
	},
}

function persian_land_battle_round() {
	log("Persia attacks " + game.where + "!");
	let p_max = (game.where == ABYDOS || game.where == EPHESOS) ? 5 : 4;
	let g_max = 6;
	let p_hit = roll_battle_dice("Persia", count_persian_armies(game.where), p_max);
	let g_hit = roll_battle_dice("Greece", count_greek_armies(game.where), g_max);
	if (p_hit >= g_hit) {
		log("Greece loses one army.");
		move_greek_army(game.where, RESERVE);
	}
	if (g_hit >= p_hit) {
		log("Persia loses one army.");
		move_persian_army(game.where, RESERVE);
	}
	if (count_greek_armies(game.where) > 0 && count_persian_armies(game.where) > 0)
		game.state = 'persian_land_retreat_attacker';
	else
		end_battle();
}

function greek_land_battle_round() {
	log("Greece attacks " + game.where + "!");
	let p_max = (game.where == ABYDOS || game.where == EPHESOS) ? 5 : 4;
	let g_max = 6;
	let p_hit = roll_battle_dice("Persia", count_persian_armies(game.where), p_max);
	let g_hit = roll_battle_dice("Greece", count_greek_armies(game.where), g_max);
	if (p_hit >= g_hit) {
		log("Greece loses one army.");
		move_greek_army(game.where, RESERVE);
	}
	if (g_hit >= p_hit) {
		log("Persia loses one army.");
		move_persian_army(game.where, RESERVE);
	}
	if (count_greek_armies(game.where) > 0 && count_persian_armies(game.where) > 0)
		game.state = 'greek_land_retreat_attacker';
	else
		end_battle();
}

states.persian_land_retreat_attacker = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Persian Land Battle: Attacker retreat?";
		view.prompt = "Persian Land Battle: Continue the battle in " + game.from + " or retreat?";
		if (game.naval_battle) {
			gen_action(view, 'port', game.from);
		} else {
			for (let city of ROADS[game.where])
				if (city in game.move_list)
					gen_action(view, 'city', city);
		}
		gen_action(view, 'city', game.where); // shortcut for battle
		gen_action(view, 'battle');
	},
	city: function (to) {
		if (to != game.where) {
			log("Persia retreats to " + to + ".");
			move_persian_army(game.where, to, count_persian_armies(game.where));
			end_battle();
		} else {
			game.active = GREECE;
			game.state = 'persian_land_retreat_defender';
		}
	},
	port: function (to) {
		log("Persia retreats to " + to + ".");
		move_persian_fleet(game.where, to, count_persian_fleets(game.where));
		move_persian_army(game.where, to, count_persian_armies(game.where));
		end_battle();
	},
	battle: function () {
		game.active = GREECE;
		game.state = 'persian_land_retreat_defender';
	},
}

states.greek_land_retreat_attacker = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Greek Land Battle: Attacker retreat?";
		view.prompt = "Greek Land Battle: Continue the battle in " + game.from + " or retreat?";
		if (game.naval_battle) {
			gen_action(view, 'port', game.from);
		} else {
			for (let city of ROADS[game.where])
				if (city in game.move_list)
					gen_action(view, 'city', city);
		}
		gen_action(view, 'city', game.where); // shortcut for battle
		gen_action(view, 'battle');
	},
	city: function (to) {
		if (to != game.where) {
			log("Greece retreats to " + to + ".");
			move_greek_army(game.where, to, count_greek_armies(game.where));
			end_battle();
		} else {
			game.active = PERSIA;
			game.state = 'greek_land_retreat_defender';
		}
	},
	port: function (to) {
		log("Greece retreats to " + to + ".");
		move_greek_fleet(game.where, to, count_greek_fleets(game.where));
		move_greek_army(game.where, to, count_greek_armies(game.where));
		end_battle();
	},
	battle: function () {
		game.active = PERSIA;
		game.state = 'greek_land_retreat_defender';
	},
}

states.persian_land_retreat_defender = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Persian Land Battle: Defender retreat?";
		view.prompt = "Persian Land Battle: Continue the battle in " + game.from + " or retreat?";
		// retreat by land
		for (let city of ROADS[game.where]) {
			if (is_usable_road(game.where, city) && is_greek_control(city))
				gen_action(view, 'city', city);
		}
		// retreat by sea
		if (count_greek_armies(game.where) <= count_greek_fleets(game.where)) {
			for (let port of PORTS)
				if (port != game.where && is_greek_control(port) && count_persian_fleets(port) == 0)
					gen_action(view, 'port', port);
		}
		gen_action(view, 'city', game.where); // shortcut for battle
		gen_action(view, 'battle');
	},
	city: function (to) {
		game.active = PERSIA;
		if (to != game.where) {
			log("Greek armies retreat to " + to + ".");
			move_greek_army(game.where, to, count_greek_armies(game.where));
			end_battle();
		} else {
			persian_land_battle_round();
		}
	},
	port: function (to) {
		game.active = PERSIA;
		log("Greek armies and fleets retreat to " + to + ".");
		move_greek_fleet(game.where, to, count_greek_fleets(game.where));
		move_greek_army(game.where, to, count_greek_armies(game.where));
		end_battle();
	},
	battle: function () {
		game.active = PERSIA;
		persian_land_battle_round();
	},
}

states.greek_land_retreat_defender = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Greek Land Battle: Defender retreat?";
		view.prompt = "Greek Land Battle: Continue the battle in " + game.from + " or retreat?";
		// retreat by land
		for (let city of ROADS[game.where]) {
			if (is_usable_road(game.where, city) && is_persian_control(city))
				gen_action(view, 'city', city);
		}
		// retreat by sea
		if (count_persian_armies(game.where) <= count_persian_fleets(game.where)) {
			for (let port of PORTS)
				if (port != game.where && is_persian_control(port) && count_greek_fleets(port) == 0)
					gen_action(view, 'port', port);
		}
		gen_action(view, 'city', game.where); // shortcut for battle
		gen_action(view, 'battle');
	},
	city: function (to) {
		game.active = GREECE;
		if (to != game.where) {
			log("Persian armies retreat to " + to + ".");
			move_persian_army(game.where, to, count_persian_armies(game.where));
			end_battle();
		} else {
			greek_land_battle_round();
		}
	},
	port: function (to) {
		game.active = GREECE;
		log("Persian armies and fleets retreat to " + to + ".");
		move_persian_fleet(game.where, to, count_persian_fleets(game.where));
		move_persian_army(game.where, to, count_persian_armies(game.where));
		end_battle();
	},
	battle: function () {
		game.active = GREECE;
		greek_land_battle_round();
	},
}

function end_battle() {
	game.naval_battle = 0;
	game.from = null;
	if (game.active == PERSIA) {
		game.where = null;
		end_persian_movement();
	} else {
		if (game.where == ABYDOS && is_greek_control(ABYDOS) && game.trigger.hellespont) {
			game.where = null;
			game.state = 'destroy_bridge';
		} else {
			game.where = null;
			end_greek_movement();
		}
	}
}

states.destroy_bridge = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Greek Land Battle: Destroy bridge?";
		view.prompt = "Greek Land Battle: Destroy the Hellespont pontoon bridge?";
		gen_action(view, 'destroy');
		gen_action(view, 'pass');
	},
	destroy: function () {
		log("Greece destroys the bridge!");
		game.trigger.hellespont = 0;
		end_greek_movement();
	},
	pass: function () {
		end_greek_movement();
	},
}

// PERSIAN EVENTS

function play_persian_event_card(card) {
	play_card("Persia", game.persian.hand, card, ":\n" + PERSIAN_EVENT_NAMES[card]);
}

function can_play_persian_event(card) {
	switch (card) {
	case 2: return can_play_tribute_of_earth_and_water();
	case 3: return can_play_tribute_of_earth_and_water();
	case 6: return can_play_ostracism();
	case 13: return can_play_tribute_of_earth_and_water();
	}
	return false;
}

function play_persian_event(card) {
	play_persian_event_card(card);
	switch (card) {
	case 2: return play_tribute_of_earth_and_water();
	case 3: return play_tribute_of_earth_and_water();
	case 6: return play_ostracism();
	case 13: return play_tribute_of_earth_and_water();
	}
	end_persian_operation();
}

function can_play_tribute_of_earth_and_water() {
	if (count_persian_armies(RESERVE) > 0)
		for (let city of CITIES)
			if (!is_greek_control(city) && !is_persian_control(city))
				return true;
	return false;
}

function play_tribute_of_earth_and_water() {
	game.state = 'tribute_of_earth_and_water';
}

states.tribute_of_earth_and_water = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Tribute of Earth and Water.";
		view.prompt = "Tribute of Earth and Water: Place an army in a city that is not controlled by either side.";
		for (let city of CITIES)
			if (!is_greek_control(city) && !is_persian_control(city))
				gen_action(view, 'city', city);
	},
	city: function (city) {
		log("Persia places an army in " + city);
		game.tribute_of_earth_and_water = city;
		move_persian_army(RESERVE, city, 1);
		end_persian_operation();
	},
}

function can_play_ostracism() {
	return game.greek.hand.length > 0;
}

function play_ostracism() {
	let card = draw_card(game.greek.hand);
	game.discard.push(card);
	log("Card " + card + " is discarded.");
	end_persian_operation();
}

// GREEK EVENTS

function play_greek_event_card(card) {
	play_card("Greece", game.greek.hand, card, ":\n" + GREEK_EVENT_NAMES[card]);
}

function can_play_greek_event(card) {
	switch (card) {
	case 2: return can_play_ionian_revolt();
	case 3: return can_play_wrath_of_poseidon();
	case 7: return can_play_oracle_of_delphi();
	case 11: return can_play_melas_zomos();
	case 12: return can_play_molon_labe();
	case 14: return can_play_support_from_syracuse();
	case 16: return can_play_desertion_of_greek_soldiers();
	}
	return false;
}

function play_greek_event(card) {
	play_greek_event_card(card);
	switch (card) {
	case 2: return play_ionian_revolt();
	case 3: return play_wrath_of_poseidon();
	case 7: return play_oracle_of_delphi();
	case 11: return play_melas_zomos();
	case 12: return play_molon_labe();
	case 14: return play_support_from_syracuse();
	case 16: return play_desertion_of_greek_soldiers();
	}
	end_greek_operation();
}

function can_play_molon_labe() {
	return game.tribute_of_earth_and_water != null;
}

function play_molon_labe() {
	log("Greece removes a Persian army in " + game.tribute_of_earth_and_water + ".");
	move_persian_army(game.tribute_of_earth_and_water, RESERVE, 1);
	game.tribute_of_earth_and_water = null;
	goto_greek_land_movement_event(MOLON_LABE);
}

function can_play_oracle_of_delphi() {
	return true;
}

function play_oracle_of_delphi() {
	let n = game.greek.hand.length;
	discard_greek_hand();
	log("Greece discards " + n + " cards.");
	log("Greece draws " + (n+1) + " cards.");
	for (let i = 0; i < n+1; ++i)
		game.greek.hand.push(draw_card(game.deck))
	end_greek_operation();
}

function can_play_support_from_syracuse() {
	return count_greek_fleets(RESERVE) > 0;
}

function play_support_from_syracuse() {
	game.state = 'support_from_syracuse';
}

states.support_from_syracuse = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Support from Syracuse.";
		view.prompt = "Support from Syracuse: Place all Greek fleets from your reserve.";
		if (count_greek_fleets(RESERVE) > 0) {
			for (let port of PORTS)
				if (is_greek_control(port))
					gen_action(view, 'port', port);
		} else {
			gen_action(view, 'next');
		}
		gen_action_undo(view);
	},
	port: function (port) {
		push_undo();
		log("Greece places a fleet in " + port + ".");
		move_greek_fleet(RESERVE, port, 1);
	},
	next: function () {
		end_greek_operation();
	},
	undo: pop_undo,
}

function can_play_melas_zomos() {
	return count_greek_armies(RESERVE) > 0 && is_greek_control(SPARTA);
}

function play_melas_zomos() {
	log("Greece places one army in Sparta.");
	move_greek_army(RESERVE, SPARTA, 1);
	end_greek_operation();
}

function can_play_wrath_of_poseidon() {
	for (let port of PORTS)
		if (count_persian_armies(port) > 0)
			return true;
	return false;
}

function play_wrath_of_poseidon() {
	game.state = 'wrath_of_poseidon';
}

states.wrath_of_poseidon = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Wrath of Poseidon.";
		view.prompt = "Wrath of Poseidon: Remove one Persian fleet from the map.";
		for (let port of PORTS)
			if (count_persian_armies(port) > 0)
				gen_action(view, 'port', port);
	},
	port: function (port) {
		log("Greece removes one Persian fleet in " + port + ".");
		move_persian_fleet(port, RESERVE, 1);
		end_greek_operation();
	}
}

function can_play_ionian_revolt() {
	for (let city of [ABYDOS, EPHESOS])
		if (count_persian_armies(city) > 0)
			return true;
	return false;
}

function play_ionian_revolt() {
	game.state = 'ionian_revolt';
}

states.ionian_revolt = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Ionian Revolt.";
		view.prompt = "Ionian Revolt: Remove one Persian army from a major Persian city.";
		for (let city of [ABYDOS, EPHESOS])
			if (count_persian_armies(city) > 0)
				gen_action(view, 'city', city);
	},
	city: function (city) {
		log("Greece removes one Persian army in " + city + ".");
		move_persian_army(city, RESERVE, 1);
		end_greek_operation();
	}
}

function can_play_desertion_of_greek_soldiers() {
	for (let city of CITIES)
		if (count_persian_armies(city) > 0)
			return true;
	return false;
}

function play_desertion_of_greek_soldiers() {
	game.state = 'desertion_of_greek_soldiers';
}

states.desertion_of_greek_soldiers = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Desertion of Greek Soldiers.";
		view.prompt = "Desertion of Greek Soldiers: Remove one Persian army from the map.";
		for (let city of CITIES)
			if (count_persian_armies(city) > 0)
				gen_action(view, 'city', city);
	},
	city: function (city) {
		log("Greece removes one Persian army in " + city + ".");
		move_persian_army(city, RESERVE, 1);
		end_greek_operation();
	}
}

// SUPPLY PHASE

function goto_supply_phase() {
	start_persian_supply_phase();
}

function start_persian_supply_phase() {
	if (game.campaign == 5 || game.persian.hand.length == 0)
		return start_persian_attrition();
	game.active = PERSIA;
	game.state = 'persian_cards_in_hand';
}

function start_greek_supply_phase() {
	if (game.campaign == 5 || game.greek.hand.length == 0)
		return start_greek_attrition();
	game.active = GREECE;
	game.state = 'greek_cards_in_hand';
}

states.persian_cards_in_hand = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Persian Supply Phase.";
		view.prompt = "Persian Supply Phase: You may keep one card for the next campaign. Discard the rest.";
		for (let card of game.persian.hand)
			gen_action(view, 'discard', card);
		if (game.persian.hand.length <= 1)
			gen_action(view, 'next');
	},
	discard: function (card) {
		discard_card("Persia", game.persian.hand, card);
	},
	next: function (card) {
		log("Persia keeps " + game.persian.hand.length + " cards.");
		start_persian_attrition();
	},
}

states.greek_cards_in_hand = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Greek Supply Phase.";
		view.prompt = "Greek Supply Phase: You may keep up to 4 cards. Discard the rest.";
		for (let card of game.greek.hand)
			gen_action(view, 'discard', card);
		if (game.greek.hand.length <= 4)
			gen_action(view, 'next');
	},
	discard: function (card) {
		discard_card("Greece", game.greek.hand, card);
	},
	next: function (card) {
		log("Greece keeps " + game.greek.hand.length + " cards.");
		start_greek_attrition();
	},
}

function start_persian_attrition() {
	let armies = 0;
	let supply = 0;
	for (let city of CITIES) {
		if (city != EPHESOS && city != ABYDOS) {
			armies += count_persian_armies(city);
			if (is_persian_control(city))
				supply += SUPPLY[city];
		}
	}
	game.attrition = Math.max(0, armies - supply);
	if (game.attrition > 0) {
		log("Persia suffers " + game.attrition + " attrition.");
		game.active = PERSIA;
		game.state = 'persian_attrition';
	} else {
		log("Persia suffers no attrition.");
		end_persian_attrition();
	}
}

function start_greek_attrition() {
	let armies = 0;
	let supply = 0;
	for (let city of CITIES) {
		armies += count_greek_armies(city);
		if (is_greek_control(city))
			supply += SUPPLY[city];
	}
	game.attrition = Math.max(0, armies - supply);
	if (game.attrition > 0) {
		log("Greece suffers " + game.attrition + " attrition.");
		game.active = GREECE;
		game.state = 'greek_attrition';
	} else {
		log("Greece suffers no attrition.");
		end_greek_attrition();
	}
}

states.persian_attrition = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Persian Supply Phase.";
		view.prompt = "Persian Supply Phase: Remove " + game.attrition + " armies.";
		for (let city of CITIES) {
			if (city != EPHESOS && city != ABYDOS)
				if (count_persian_armies(city) > 0)
					gen_action(view, 'city', city);
		}
	},
	city: function (space) {
		log("Persia removes army from " + space + ".");
		move_persian_army(space, RESERVE);
		if (--game.attrition == 0)
			end_persian_attrition();
	},
}

states.greek_attrition = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Greek Supply Phase.";
		view.prompt = "Greek Supply Phase: Remove " + game.attrition + " armies.";
		for (let city of CITIES) {
			if (count_greek_armies(city) > 0)
				gen_action(view, 'city', city);
		}
	},
	city: function (space) {
		log("Greece removes army from " + space + ".");
		move_greek_army(space, RESERVE);
		if (--game.attrition == 0)
			end_greek_attrition();
	},
}

function end_persian_attrition() {
	persian_loc();
	start_greek_supply_phase();
}

function end_greek_attrition() {
	greek_loc();
	goto_scoring_phase();
}

function gen_persian_land_move(view, seen, from) {
	if (!seen[from])
		gen_action(view, 'city', from);
	seen[from] = 1;
	if (is_persian_control(from))
		for (let to of ROADS[from])
			if (is_usable_road(from, to) && !seen[to])
				gen_persian_land_move(view, seen, to);
}

function persian_loc() {
	let loc = {};
	function persian_loc_rec(from) {
		loc[from] = 1;
		for (let to of ROADS[from])
			if (is_usable_road(from, to) && !is_greek_control(to) && !loc[to])
				persian_loc_rec(to);
	}
	if (is_persian_control(ABYDOS))
		persian_loc_rec(ABYDOS);
	if (is_persian_control(EPHESOS))
		persian_loc_rec(EPHESOS);
	if ((is_persian_control(ABYDOS) && count_greek_fleets(ABYDOS) == 0) ||
		(is_persian_control(EPHESOS) && count_greek_fleets(EPHESOS)))
		for (let port of PORTS)
			if (count_persian_fleets(port) > 0)
				loc[port] = 1;
	for (let city of CITIES) {
		if (!loc[city]) {
			let n = count_persian_armies(city);
			if (n > 0) {
				log("Persia removes " + n + " armies in " + city + ".");
				move_persian_army(city, RESERVE, n);
			}
		}
	}
}

function greek_loc() {
	let loc = {};
	function greek_loc_rec(from) {
		loc[from] = 1;
		for (let to of ROADS[from])
			if (is_usable_road(from, to) && !is_persian_control(to) && !loc[to])
				greek_loc_rec(to);
	}
	if (is_greek_control(ATHENAI))
		greek_loc_rec(ATHENAI);
	if (is_greek_control(SPARTA))
		greek_loc_rec(SPARTA);
	if ((is_greek_control(ATHENAI) && count_persian_fleets(ATHENAI) == 0) ||
		(is_greek_control(SPARTA) && count_persian_fleets(SPARTA)))
		for (let port of PORTS)
			if (count_greek_fleets(port) > 0)
				loc[port] = 1;
	for (let city of CITIES) {
		if (!loc[city]) {
			let n = count_greek_armies(city);
			if (n > 0) {
				log("Greece removes " + n + " armies in " + city + ".");
				move_greek_army(city, RESERVE, n);
			}
		}
	}
}

// SCORING PHASE

function goto_scoring_phase() {
	if (is_persian_control(ATHENAI) && is_persian_control(SPARTA)) {
		game.victory = "Persia wins by controlling Athenai and Sparta!";
		game.state = 'game_over';
		return;
	}
	if (is_greek_control(ABYDOS) && is_greek_control(EPHESOS)) {
		game.victory = "Greece wins by controlling Abydos and Ephesos!";
		game.state = 'game_over';
		return;
	}
	let greek_vp = 0;
	let persian_vp = 0;
	for (let city of CITIES) {
		if (is_greek_control(city))
			greek_vp += SCORE[city];
		if (is_persian_control(city))
			persian_vp += SCORE[city];
	}
	if (persian_vp > greek_vp)
		log("Persia scores " + (persian_vp - greek_vp) + " points.");
	else if (greek_vp > persian_vp)
		log("Greece scores " + (greek_vp - persian_vp) + " points.");
	else
		log("Nobody scores any points.");
	add_vp(persian_vp - greek_vp);
	end_campaign();
}

function end_campaign() {
	if (game.campaign == 5) {
		if (game.vp < 0) {
			game.victory = $("Greece wins with " + (-game.vp) + " points.");
			game.result = "Greek";
		} else if (game.vp > 0) {
			game.victory = $("Persia wins with " + game.vp + "points.");
			game.result = "Persian";
		} else {
			game.victory = "Nobody wins.";
			game.result = "Tie";
		}
		game.state = 'game_over';
		log("");
		log(game.victory);
	} else {
		++game.campaign;
		start_campaign();
	}
}

states.game_over = {
	prompt: function (view) {
		return view.prompt = game.victory;
	}
}

exports.ready = function (scenario, players) {
	return (players.length === 2);
}

exports.setup = function (scenario, players) {
	game = {
		log: [],
		undo: [],

		// game board state
		campaign: 1,
		vp: 0,
		deck: create_deck(),
		discard: [],
		persian: {
			hand: [],
			draw: 0,
			pass: 0,
		},
		greek: {
			hand: [],
			draw: 0,
			pass: 0,
		},
		units: {
			Abydos: [0,2,0,0],
			Athenai: [1,0,1,0],
			Delphi: [0,0],
			Ephesos: [0,2,0,1],
			Eretria: [0,0,0,0],
			Korinthos: [1,0],
			Larissa: [0,0],
			Naxos: [0,0,0,0],
			Pella: [0,0,0,0],
			Sparta: [1,0,1,0],
			Thebai: [0,0,0,0],
			reserve: [6,20,3,5],
		},
		trigger: {
			darius: 0,
			xerxes: 0,
			artemisia: 0,
			miltiades: 0,
			themistocles: 0,
			leonidas: 0,
			hellespont: 0,
		},

		// transient action state
		move_list: null,
		talents: 0,
		built_fleets: 0,
		naval_battle: 0,
		attrition: 0,
		from: null,
		where: null,
	};

	start_campaign();

	return game;
}

exports.action = function (state, current, action, arg) {
	game = state;
	// TODO: check current, action and argument against action list
	if (true) {
		let S = states[game.state];
		if (action in S)
			S[action](arg, current);
		else
			throw new Error("Invalid action: " + action);
	}
	return state;
}

exports.resign = function (state, current) {
	game = state;
	if (game.state != 'game_over') {
		log("");
		log(current + " resigned.");
		game.active = "None";
		game.state = 'game_over';
		game.victory = current + " resigned.";
		if (game.current == PERSIA)
			game.result = GREECE;
		else
			game.result = PERSIA;
	}
}

exports.view = function(state, current) {
	game = state;

	let view = {
		log: game.log,
		active: game.active,
		campaign: game.campaign,
		vp: game.vp,
		trigger: game.trigger,
		units: game.units,
	};

	view.g_cards = game.greek.hand.length + game.greek.draw;
	view.p_cards = game.persian.hand.length + game.persian.draw;
	view.discard = game.discard.length > 0 ? game.discard[game.discard.length-1] : 0;

	states[game.state].prompt(view, current);
	view.prompt = $(view.prompt);

	if (game.transport)
		view.transport = { count: game.transport, where: game.where, who: game.attacker };

	if (current == GREECE) {
		view.hand = game.greek.hand;
		view.draw = game.greek.draw;
	}
	if (current == PERSIA) {
		view.hand = game.persian.hand;
		view.draw = game.persian.draw;
	}

	return view;
}
