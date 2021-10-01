"use strict";

// Diary: 2021-04-23 - Friday Evening - Started game logic shell.
// Diary: 2021-04-24 - Saturday - Art, UI, preparation phase.
// Diary: 2021-04-25 - Sunday - Supply, movement and battle.
// Diary: 2021-04-26 - Monday Evening - Redid piece layout. Transport armies on fleets.
// Diary: 2021-05-01 - Saturday Evening - Added undo. Tribute, Ostracism, and simple greek events.
// Diary: 2021-05-02 - Sunday - Movement and battle events.
// Diary: 2021-05-03 - Monday Night - Clean up reaction event game states.
// Diary: 2021-05-04 - Tuesday Night - Event code cleanup.
// Diary: 2021-05-08 - Saturday Afternoon - Polish game log messages.
// Diary: 2021-10-01 - Friday Afternoon - Fix bugs.

// Acropolis on Fire -- if sudden death of the great king, does greece get 6 or 5 talents for the next campaign?
// leonidas + miltiades -- forbid combination?

// Event flags:
// greek: mines of laurion -> turn flag
// greek: themistocles -> turn flag
// greek: evangelion -> turn flag
// greek: triremes -> turn flag
// greek: leonidas -> battle flag
// greek: 300 spartans -> battle flag
// greek: miltiades -> battle flag
// persian: cavalry -> flag
// persian: great king -> flag

// Reaction event timing:
// before persian land battle: miltiades -> flag
// before persian land battle: pausanias *
// before persian land battle: 300 spartans -> flag
// after persian naval movement: themistocles
// in any land battle, after persian annihilation: the immortals
// in any naval battle, after persian lose 1 fleet: artemisia

// 'immediately in response' -- interrupt play before or after event is completed?
// pausanias, molon labe

const CHEAP_PERSIAN_FLEETS = "Cheap Fleets";

exports.scenarios = [
	"Standard",
	CHEAP_PERSIAN_FLEETS,
];

const OBSERVER = "Observer";
const GREECE = "Greece";
const PERSIA = "Persia";
const BOTH = "Both";

const RESERVE = "reserve";
const ABYDOS = "Abydos";
const EPHESOS = "Ephesos";
const ATHENAI = "Athenai";
const THEBAI = "Thebai";
const SPARTA = "Sparta";
const PELLA = "Pella";

// Greek event numbers
const MINES_OF_LAURION = 1;
const MILTIADES = 4;
const THEMISTOCLES = 5;
const PAUSANIAS = 6;
const LEONIDAS = 8;
const ARTEMISIA = 9;
const EVANGELION = 10;
const MOLON_LABE = 12;
const TRIREMES = 13;
const TRIREMES_TWO = 113;
const THREE_HUNDRED_SPARTANS = 15;

// Persian event numbers
const CAVALRY_OF_MARDONIUS = 1;
const THE_IMMORTALS = 5;
const THE_GREAT_KING = 7;
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
	113: "Triremes", // for second movement
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

const SPARTA_CARDS = [ 6, 8, 11, 15 ];

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
	"Korinthos": [ "Athenai", "Sparta", "Thebai" ],
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

function init_log() {
	game.log_buf = [];
}

function push_log(...msg) {
	game.log_buf.push(msg);
}

function flush_log(text) {
	function print_move(last) {
		return "\n " + n + " " + last.join(" in ");
	}
	game.log_buf.sort();
	let last = game.log_buf[0];
	let n = 0;
	for (let entry of game.log_buf) {
		if (entry.toString() !== last.toString()) {
			text += $(print_move(last));
			n = 0;
		}
		++n;
		last = entry;
	}
	if (n > 0)
		text += print_move(last);
	else
		text += "\nnothing.";
	log(text);
	delete game.log_buf;
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
	let save_undo = game.undo;
	let save_log = game.log;
	Object.assign(game, JSON.parse(save_undo.pop()));
	game.undo = save_undo;
	save_log.length = game.log;
	game.log = save_log;
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
	return current === OBSERVER || (game.active !== current && game.active !== BOTH);
}

function gen_action(view, action, argument) {
	if (!view.actions)
		view.actions = {}
	if (argument !== undefined) {
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
	if (deck.length === 0)
		reshuffle();
	if (deck.length === 0)
		throw Error("can't draw from empty deck");
	let k = Math.floor(Math.random() * deck.length);
	let card = deck[k];
	deck.splice(k, 1);
	return card;
}

function can_draw_card(extra) {
	return game.deck.length + game.discard.length - extra > 0;
}

function is_visible_discard(card) {
	return game.discard.length > 0 && game.discard[game.discard.length-1] === card;
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

function remove_persian_fleet(from) {
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
	if (where === ABYDOS || where === EPHESOS)
		return count_greek_armies(where) === 0;
	return count_persian_armies(where) > 0;
}

function is_greek_control(where) {
	if (where === ATHENAI || where === SPARTA)
		return count_persian_armies(where) === 0;
	return count_greek_armies(where) > 0;
}

function persian_can_land_move() {
	for (let city of CITIES_WITH_ROADS)
		if (count_persian_armies(city) > 0)
			return true;
	return false;
}

function greek_can_land_move() {
	for (let city of CITIES_WITH_ROADS) {
		if (city === SPARTA && game.trigger.carneia_festival)
			continue;
		if (count_greek_armies(city) > 0)
			return true;
	}
	return false;
}

function persian_can_naval_move() {
	for (let port of PORTS)
		if (count_persian_fleets(port) > 0)
			return true;
	return false;
}

function greek_can_naval_move() {
	for (let port of PORTS)
		if (count_greek_fleets(port) > 0)
			return true;
	return false;
}

function persian_can_move() {
	return persian_can_land_move() || persian_can_naval_move();
}

function greek_can_move() {
	return greek_can_land_move() || greek_can_naval_move();
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

function gen_greek_land_movement(view) {
	for (let city of CITIES_WITH_ROADS) {
		if (city === SPARTA && game.trigger.carneia_festival)
			continue;
		if (count_greek_armies(city) > 0)
			gen_action(view, 'city', city);
	}
}

// DEATH OF A KING

function goto_sudden_death_of_darius(skip_scoring) {
	game.skip_scoring = skip_scoring;
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
		if (game.skip_scoring) {
			game.skip_scoring = 0;
			reshuffle();
			end_campaign();
		} else {
			end_operation_phase();
		}
	},
}

function goto_assassination_of_xerxes(skip_scoring) {
	game.skip_scoring = skip_scoring;
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
		if (game.skip_scoring) {
			game.skip_scoring = 0;
			reshuffle();
			end_campaign();
		} else {
			end_operation_phase();
		}
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
	log("");
	log("Persian Preparation Phase");
}

function goto_greek_preparation_draw() {
	log("");
	game.active = GREECE;
	game.state = 'greek_preparation_draw';
	if (game.greek.event === MINES_OF_LAURION) {
		log("Greek Preparation Phase (Mines)");
		game.talents = 3;
	} else if (game.trigger.acropolis_on_fire) {
		log("Greek Preparation Phase");
		game.talents = 5;
	} else {
		log("Greek Preparation Phase");
		game.talents = 6;
	}
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
		log("Persia buys " + game.persian.draw + " cards.");
		let sudden_death = 0;
		for (let i = 0; i < game.persian.draw; ++i) {
			let card = draw_card(game.deck);
			if (card === SUDDEN_DEATH_OF_THE_GREAT_KING)
				sudden_death = 1;
			game.persian.hand.push(card);
		}
		game.persian.draw = 0;
		if (sudden_death) {
			if (!game.trigger.darius)
				return goto_sudden_death_of_darius(true);
			if (!game.trigger.xerxes)
				return goto_assassination_of_xerxes(true);
		}
		goto_persian_preparation_build();
	},
	undo: pop_undo,
}

states.greek_preparation_draw = {
	prompt: function (view, current) {
		let name = (game.greek.event === MINES_OF_LAURION) ? "Mines of Laurion" : "Greek Preparation Phase";
		if (is_inactive_player(current))
			return view.prompt = name + ".";
		view.prompt = name + ": Draw up to 6 cards. " + game.talents + " talents left.";
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
		log("Greece buys " + game.greek.draw + " cards.");
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
	init_log();
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
		if (game.built_fleets < 2 && game.talents >= game.persian.fleet_cost && count_persian_fleets(RESERVE) > 0) {
			for (let space of PORTS)
				if (is_persian_control(space) && count_greek_fleets(space) === 0)
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
		push_log("armies", space);
		game.talents -= 1;
		move_persian_army(RESERVE, space);
	},
	port: function (space) {
		push_undo();
		push_log("fleets", space);
		game.built_fleets += 1;
		game.talents -= game.persian.fleet_cost;
		move_persian_fleet(RESERVE, space);
	},
	build: function () {
		push_undo();
		log("Persia builds the bridge.");
		game.talents -= 6;
		game.trigger.hellespont = 1;
	},
	next: function () {
		flush_log("Persia raises:");
		clear_undo();
		game.talents = 0;
		goto_greek_preparation_draw();
	},
	undo: pop_undo,
}

function goto_greek_preparation_build() {
	init_log();
	game.active = GREECE;
	game.state = 'greek_preparation_build';
	game.built_fleets = 0;
}

states.greek_preparation_build = {
	prompt: function (view, current) {
		let name = (game.greek.event === MINES_OF_LAURION) ? "Mines of Laurion" : "Greek Preparation Phase";
		if (is_inactive_player(current))
			return view.prompt = name + ".";
		view.prompt = name + ": Build fleets and armies. ";
		view.prompt += game.talents + " talents left.";
		if (game.talents >= 1 && count_greek_armies(RESERVE) > 0) {
			for (let space of CITIES)
				if (is_greek_control(space))
					gen_action(view, 'city', space);
		}
		let can_build_fleet = (game.greek.event === MINES_OF_LAURION) || (game.built_fleets < 2);
		if (can_build_fleet && game.talents >= 1 && count_greek_fleets(RESERVE) > 0) {
			for (let space of PORTS)
				if (is_greek_control(space) && count_persian_fleets(space) === 0)
					gen_action(view, 'port', space);
		}
		gen_action_undo(view);
		gen_action(view, 'next');
	},
	city: function (space) {
		push_undo();
		push_log("armies", space);
		game.talents -= 1;
		move_greek_army(RESERVE, space);
	},
	port: function (space) {
		push_undo();
		push_log("fleets", space);
		game.built_fleets += 1;
		game.talents -= 1;
		move_greek_fleet(RESERVE, space);
	},
	next: function () {
		flush_log("Greece raises:");
		clear_undo();
		game.talents = 0;
		game.trigger.acropolis_on_fire = 0;
		if (game.greek.event === MINES_OF_LAURION)
			end_greek_operation();
		else
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
	log("");
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
	log("");
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
			if (persian_can_move())
				gen_action(view, 'card_move', card);
			if (can_play_persian_event(card))
				gen_action(view, 'card_event', card);
		}
		gen_action(view, 'pass');
	},
	card_move: function (card) {
		push_undo();
		play_card("Persia", game.persian.hand, card, " for movement.");
		goto_persian_movement(true, true, 0);
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
			if (greek_can_move())
				gen_action(view, 'card_move', card);
			if (can_play_greek_event(card))
				gen_action(view, 'card_event', card);
		}
		gen_action(view, 'pass');
	},
	card_move: function (card) {
		push_undo();
		play_card("Greece", game.greek.hand, card, " for movement.");
		goto_greek_movement(true, true, 0);
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
	game.where = null;
	end_persian_operation();
}

function end_greek_movement() {
	if (game.where === ABYDOS && is_greek_control(ABYDOS) && game.trigger.hellespont) {
		game.where = null;
		game.state = 'destroy_bridge';
		return;
	}

	game.where = null;

	switch (game.greek.event) {
	case THEMISTOCLES:
		game.active = PERSIA;
		game.from = game.themistocles.from;
		game.where = game.themistocles.where;
		game.transport = game.themistocles.transport;
		delete game.themistocles;
		goto_persian_naval_battle();
		break;
	case TRIREMES:
		if (greek_can_naval_move())
			goto_greek_movement(false, true, TRIREMES_TWO);
		else
			end_greek_operation();
		break;
	case MOLON_LABE:
		end_persian_operation();
		break;
	default:
		end_greek_operation();
		break;
	}
}

function end_persian_operation() {
	clear_undo();
	game.greek.battle_event = 0;
	game.greek.event = 0;
	game.persian.event = 0;
	game.land_movement = 0;
	game.naval_movement = 0;
	game.naval_battle = 0;
	game.move_list = null;
	game.transport = 0;
	game.attacker = 0;
	if (game.persian.pass && game.greek.pass)
		return end_operation_phase();
	goto_greek_operation();
}

function end_greek_operation() {
	clear_undo();
	game.greek.battle_event = 0;
	game.greek.event = 0;
	game.persian.event = 0;
	game.land_movement = 0;
	game.naval_movement = 0;
	game.naval_battle = 0;
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
	if (from === ABYDOS && to === PELLA && !game.trigger.hellespont)
		return false;
	if (from === PELLA && to === ABYDOS && !game.trigger.hellespont)
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

function goto_persian_movement(land, naval, event) {
	game.active = PERSIA;
	game.state = 'persian_movement';
	game.land_movement = land;
	game.naval_movement = naval;
	game.persian.event = event;
}

function goto_greek_movement(land, naval, event) {
	game.active = GREECE;
	game.state = 'greek_movement';
	game.land_movement = land;
	game.naval_movement = naval;
	game.greek.event = event;
}

states.persian_movement = {
	prompt: function (view, current) {
		let name = game.persian.event ? PERSIAN_EVENT_NAMES[game.persian.event] : "Persian Movement";
		if (is_inactive_player(current))
			return view.prompt = name + "."
		view.prompt = name + ": Choose an origin.";
		if (game.land_movement) {
			for (let city of CITIES_WITH_ROADS)
				if (count_persian_armies(city) > 0)
					gen_action(view, 'city', city);
		}
		if (game.naval_movement) {
			for (let port of PORTS)
				if (count_persian_fleets(port) > 0)
					gen_action(view, 'port', port);
		}
		gen_action_undo(view);
	},
	city: goto_persian_land_movement,
	port: goto_persian_naval_movement,
	undo: pop_undo,
}

states.greek_movement = {
	prompt: function (view, current) {
		let name = game.greek.event ? GREEK_EVENT_NAMES[game.greek.event] : "Greek Movement";
		if (is_inactive_player(current))
			return view.prompt = name + "."
		view.prompt = name + ": Choose an origin.";
		if (game.land_movement)
			gen_greek_land_movement(view);
		if (game.naval_movement) {
			for (let port of PORTS) {
				if (game.greek.event === THEMISTOCLES)
					if (port === game.themistocles.where)
						continue;
				if (count_greek_fleets(port) > 0) {
					gen_action(view, 'port', port);
				}
			}
		}
		gen_action_undo(view);
	},
	city: goto_greek_land_movement,
	port: goto_greek_naval_movement,
	undo: pop_undo,
}

function goto_persian_naval_movement(space) {
	push_undo();
	game.from = space;
	game.state = 'persian_naval_movement';
}

function goto_greek_naval_movement(space) {
	push_undo();
	game.from = space;
	game.state = 'greek_naval_movement';
}

function goto_persian_land_movement(space) {
	push_undo();
	game.from = space;
	game.state = 'persian_land_movement';
	list_persian_land_moves(game.move_list = {}, game.from);
}

function goto_greek_land_movement(space) {
	push_undo();
	game.from = space;
	game.state = 'greek_land_movement';
	list_greek_land_moves(game.move_list = {}, game.from);
}

function goto_greek_land_movement_leonidas(space) {
	push_undo();
	game.from = space;
	game.state = 'greek_land_movement_leonidas';
	list_greek_land_moves(game.move_list = {}, game.from);
}

states.persian_land_movement = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Persian Land Movement.";
		view.prompt = "Persian Land Movement: Select armies to move and then a destination.";
		view.land_movement = game.from;
		for (let to in game.move_list)
			if (to !== game.from)
				gen_action(view, 'city', to);
		gen_action_undo(view);
	},
	city: function ([to, armies]) {
		push_undo();
		log("Persia moves " + armies + " armies:\n" + game.from + " to " + to + ".");
		move_persian_army(game.from, to, armies);
		game.where = to;
		game.state = 'persian_land_movement_confirm';
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
			if (to !== game.from)
				gen_action(view, 'city', to);
		gen_action_undo(view);
	},
	city: function ([to, armies]) {
		push_undo();
		log("Greece moves " + armies + " armies:\n" + game.from + " to " + to + ".");
		move_greek_army(game.from, to, armies);
		game.where = to;
		game.state = 'greek_land_movement_confirm';
	},
	undo: pop_undo,
}

states.greek_land_movement_leonidas = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Greek Land Movement.";
		view.prompt = "Greek Land Movement: Select a destination.";
		for (let to in game.move_list)
			if (to !== game.from)
				gen_action(view, 'city', to);
		gen_action_undo(view);
	},
	city: function (to) {
		push_undo();
		log("Greece moves 1 army:\n" + game.from + " to " + to + ".");
		move_greek_army(game.from, to, 1);
		game.where = to;
		game.state = 'greek_land_movement_confirm';
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
		gen_action_undo(view);
	},
	city: end_persian_land_movement,
	next: end_persian_land_movement,
	undo: pop_undo,
}

states.greek_land_movement_confirm = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Greek Land Movement.";
		view.prompt = "Greek Land Movement: Confirm destination.";
		if (game.greek.hand.includes(MILTIADES) && can_play_miltiades_attack()) {
			view.prompt += " You may play Miltiades.";
			gen_action(view, 'card_event', MILTIADES);
		}
		gen_action(view, 'city', game.where);
		gen_action(view, 'next');
		gen_action_undo(view);
	},
	card_event: function () {
		push_undo();
		play_miltiades_attack();
	},
	city: end_greek_land_movement,
	next: end_greek_land_movement,
	undo: pop_undo,
}

function end_persian_land_movement() {
	clear_undo();
	goto_persian_land_battle();
}

function end_greek_land_movement() {
	clear_undo();
	goto_greek_land_battle();
}

states.persian_naval_movement = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Persian Naval Movement.";
		view.prompt = "Persian Naval Movement: Select fleets to move, armies to transport, and then a destination.";
		view.naval_movement = game.from;
		view.naval_transport = 1;
		for (let port of PORTS)
			if (port !== game.from)
				gen_action(view, 'port', port);
		gen_action_undo(view);
	},
	port: function ([to, fleets, armies]) {
		push_undo();
		if (armies > 0)
			log("Persia moves " + fleets + " fleets with " + armies + " armies:\n"
				+ game.from + " to " + to + ".");
		else
			log("Persia moves " + fleets + " fleets:\n"
				+ game.from + " to " + to + ".");
		move_persian_fleet(game.from, to, fleets);
		move_persian_army(game.from, to, armies);
		game.transport = armies;
		game.attacker = PERSIA;
		game.where = to;
		game.state = 'persian_naval_movement_confirm';
	},
	undo: pop_undo,
}

states.greek_naval_movement = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Greek Naval Movement.";
		view.prompt = "Greek Naval Movement: Select fleets to move, armies to transport, and then a destination.";
		view.naval_movement = game.from;
		if (game.trigger.carneia_festival && game.from === SPARTA)
			view.naval_transport = 0;
		else if (game.greek.event === TRIREMES || game.greek.event === TRIREMES_TWO)
			view.naval_transport = 0;
		else if (game.greek.event === THEMISTOCLES)
			view.naval_transport = 0;
		else
			view.naval_transport = 1;
		for (let port of PORTS)
			if (port !== game.from)
				gen_action(view, 'port', port);
		gen_action_undo(view);
	},
	port: function ([to, fleets, armies]) {
		push_undo();
		if (armies > 0)
			log("Greece moves " + fleets + " fleets with " + armies + " armies:\n"
				+ game.from + " to " + to + ".");
		else
			log("Greece moves " + fleets + " fleets:\n"
				+ game.from + " to " + to + ".");
		move_greek_fleet(game.from, to, fleets);
		if (game.greek.event !== THEMISTOCLES) {
			move_greek_army(game.from, to, armies);
			game.transport = armies;
			game.attacker = GREECE;
		}
		game.where = to;
		game.state = 'greek_naval_movement_confirm';
	},
	undo: pop_undo,
}

states.persian_naval_movement_confirm = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Persian Naval Movement.";
		view.prompt = "Persian Naval Movement: Confirm destination.";
		gen_action(view, 'port', game.where);
		gen_action(view, 'next');
		gen_action_undo(view);
	},
	port: end_persian_naval_movement,
	next: end_persian_naval_movement,
	undo: pop_undo,
}

function end_persian_naval_movement() {
	clear_undo();
	if (can_play_themistocles()) {
		game.active = GREECE;
		game.state = 'persian_naval_move_themistocles';
	} else {
		goto_persian_naval_battle();
	}
}

states.persian_naval_move_themistocles = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Persian Naval Move: Greece may play Themistocles.";
		view.prompt = "Persian Naval Move: You may play Themistocles.";
		if (game.greek.hand.includes(THEMISTOCLES))
			gen_action(view, 'card_event', THEMISTOCLES);
		gen_action(view, 'next');
	},
	card_event: function () {
		play_themistocles();
	},
	next: function () {
		game.active = PERSIA;
		goto_persian_naval_battle();
	},
}

states.greek_naval_movement_confirm = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Greek Naval Movement.";
		view.prompt = "Greek Naval Movement: Confirm destination.";
		gen_action(view, 'port', game.where);
		gen_action(view, 'next');
		gen_action_undo(view);
	},
	port: end_greek_naval_movement,
	next: end_greek_naval_movement,
	undo: pop_undo,
}

function end_greek_naval_movement()
{
	clear_undo();
	goto_greek_naval_battle();
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
	if (count_greek_fleets(game.where) > 0 && count_persian_fleets(game.where) > 0) {
		log("");
		log("Persia attacks " + game.where + " at sea!");
		persian_naval_battle_round();
	} else {
		goto_persian_land_battle();
	}
}

function goto_greek_naval_battle() {
	// If greece reinforced persian initiated battle...
	if (game.greek.event === THEMISTOCLES && game.where === game.themistocles.where) {
		if (count_greek_fleets(game.themistocles.where) > 0)
			return end_greek_movement();
	}

	game.naval_battle = 1;
	if (count_greek_fleets(game.where) > 0 && count_persian_fleets(game.where) > 0) {
		log("");
		log("Greece attacks " + game.where + " at sea!");
		greek_naval_battle_round();
	} else {
		goto_greek_land_battle();
	}
}

function persian_naval_battle_round() {
	let persia_lost_fleet = 0;
	let p_max = (game.where === ABYDOS || game.where === EPHESOS) ? 5 : 4;
	let g_max = 6;
	let p_hit = roll_battle_dice("Persia", count_persian_fleets(game.where), p_max);
	let g_hit = roll_battle_dice("Greece", count_greek_fleets(game.where), g_max);
	if (g_hit >= p_hit) {
		move_persian_fleet(game.where, RESERVE);
		if (count_persian_fleets(game.where) < game.transport) {
			log("Persia loses one fleet and one army.");
			move_persian_army(game.where, RESERVE);
			--game.transport;
		} else {
			log("Persia loses one fleet.");
		}
		persia_lost_fleet = 1;
	}
	if (p_hit >= g_hit) {
		log("Greece loses one fleet.");
		move_greek_fleet(game.where, RESERVE);
	}

	if (can_play_artemisia(persia_lost_fleet)) {
		game.active = GREECE;
		game.state = 'persian_naval_battle_artemisia';
	} else {
		resume_persian_naval_battle();
	}
}

function greek_naval_battle_round() {
	let persia_lost_fleet = 0;
	let p_max = (game.where === ABYDOS || game.where === EPHESOS) ? 5 : 4;
	let g_max = 6;
	let p_hit = roll_battle_dice("Persia", count_persian_fleets(game.where), p_max);
	let g_hit = roll_battle_dice("Greece", count_greek_fleets(game.where), g_max);
	if (p_hit >= g_hit) {
		move_greek_fleet(game.where, RESERVE);
		if (count_greek_fleets(game.where) < game.transport) {
			log("Greece loses one fleet and one army.");
			move_greek_army(game.where, RESERVE);
			--game.transport;
		} else {
			log("Greece loses one fleet.");
		}
	}
	if (g_hit >= p_hit) {
		log("Persia loses one fleet.");
		move_persian_fleet(game.where, RESERVE);
		persia_lost_fleet = 1;
	}

	if (can_play_artemisia(persia_lost_fleet)) {
		game.state = 'greek_naval_battle_artemisia';
	} else {
		resume_greek_naval_battle();
	}
}

states.persian_naval_battle_artemisia = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Persian Naval Battle: Persian fleet lost - Greece may play Artemisia I.";
		view.prompt = "Persian Naval Battle: Persian fleet lost - you may play Artemisia I.";
		if (game.greek.hand.includes(ARTEMISIA))
			gen_action(view, 'card_event', ARTEMISIA);
		if (!is_inactive_player(current))
			gen_action(view, 'next');
	},
	card_event: function () {
		play_artemisia();
		resume_persian_naval_battle();
	},
	next: resume_persian_naval_battle,
}

states.greek_naval_battle_artemisia = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Greek Naval Battle: Persian fleet lost - Greece may play Artemisia I.";
		view.prompt = "Greek Naval Battle: Persian fleet lost - you may play Artemisia I.";
		if (game.greek.hand.includes(ARTEMISIA))
			gen_action(view, 'card_event', ARTEMISIA);
		if (!is_inactive_player(current))
			gen_action(view, 'next');
	},
	card_event: function () {
		play_artemisia();
		resume_greek_naval_battle();
	},
	next: resume_greek_naval_battle,
}

function resume_persian_naval_battle() {
	game.active = PERSIA;
	if (count_greek_fleets(game.where) > 0 && count_persian_fleets(game.where) > 0) {
		game.state = 'persian_naval_retreat_attacker';
	} else {
		goto_persian_land_battle();
	}
}

function resume_greek_naval_battle() {
	game.active = GREECE;
	if (count_greek_fleets(game.where) > 0 && count_persian_fleets(game.where) > 0) {
		game.state = 'greek_naval_retreat_attacker';
	} else {
		goto_greek_land_battle();
	}
}

states.persian_naval_retreat_attacker = {
	prompt: function (view, current) {
		if (game.greek.event === THEMISTOCLES) {
			if (is_inactive_player(current))
				return view.prompt = "Persian Naval Battle: Continue the battle.";
			view.prompt = "Persian Naval Battle: Continue the battle in " + game.where + ".";
		} else {
			if (is_inactive_player(current))
				return view.prompt = "Persian Naval Battle: Attacker retreat?";
			view.prompt = "Persian Naval Battle: Continue the battle in " + game.where + " or retreat?";
			gen_action(view, 'port', game.from);
		}
		gen_action(view, 'port', game.where); // shortcut for battle
		gen_action(view, 'battle');
	},
	port: function (to) {
		if (to !== game.where) {
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
		if (game.greek.event === THEMISTOCLES) {
			if (is_inactive_player(current))
				return view.prompt = "Greek Naval Battle: Continue the battle.";
			view.prompt = "Greek Naval Battle: Continue the battle in " + game.where + ".";
		} else {
			if (is_inactive_player(current))
				return view.prompt = "Greek Naval Battle: Attacker retreat?";
			view.prompt = "Greek Naval Battle: Continue the battle in " + game.where + " or retreat?";
			gen_action(view, 'port', game.from);
		}
		gen_action(view, 'port', game.where); // shortcut for battle
		gen_action(view, 'battle');
	},
	port: function (to) {
		if (to !== game.where) {
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
		view.prompt = "Persian Naval Battle: Continue the battle in " + game.where + " or retreat?";
		gen_action(view, 'port', game.where); // shortcut for battle
		if (game.greek.event !== THEMISTOCLES)
			for (let port of PORTS)
				if (is_greek_control(port))
					gen_action(view, 'port', port);
		gen_action(view, 'battle');
	},
	port: function (to) {
		game.active = PERSIA;
		if (to !== game.where) {
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
		view.prompt = "Greek Naval Battle: Continue the battle in " + game.where + " or retreat?";
		gen_action(view, 'port', game.where); // shortcut for battle
		if (game.greek.event !== THEMISTOCLES)
			for (let port of PORTS)
				if (is_persian_control(port))
					gen_action(view, 'port', port);
		gen_action(view, 'battle');
	},
	port: function (to) {
		game.active = GREECE;
		if (to !== game.where) {
			log("Persian fleets retreat to " + to + ".");
			move_persian_fleet(game.where, to, count_persian_fleets(game.where));
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

function can_play_land_battle_reaction() {
	let m = can_play_miltiades_defense();
	let p = can_play_pausanias();
	let s = can_play_300_spartans();
	return m || p || s;
}

function goto_persian_land_battle() {
	game.transport = 0;
	if (count_greek_armies(game.where) > 0 && count_persian_armies(game.where) > 0) {
		log("");
		log("Persia attacks " + game.where + "!");
		game.immortals = Math.min(3, count_persian_armies(game.where));
		goto_persian_land_battle_react();
	} else {
		game.from = null;
		end_persian_movement();
	}
}

function goto_persian_land_battle_react() {
	if (can_play_land_battle_reaction()) {
		game.active = GREECE;
		game.state = 'persian_land_battle_react';
	} else {
		persian_land_battle_round();
	}
}

function goto_greek_land_battle() {
	game.transport = 0;
	if (count_greek_armies(game.where) > 0 && count_persian_armies(game.where) > 0) {
		log("");
		log("Greece attacks " + game.where + "!");
		game.immortals = Math.min(3, count_persian_armies(game.where));
		game.active = GREECE;
		greek_land_battle_round();
	} else {
		game.from = null;
		end_greek_movement();
	}
}

states.persian_land_battle_react = {
	prompt: function (view, current) {
		let m = can_play_miltiades_defense();
		let p = can_play_pausanias();
		let s = can_play_300_spartans();

		let msg = is_inactive_player(current) ? "Greece may play " : "You may play ";
		if (m && p && s) msg += "Miltiades, Pausanias, or 300 Spartans.";
		if (m && p && !s) msg += "Miltiades or Pausanias.";
		if (m && !p && s) msg += "Miltiades or 300 Spartans.";
		if (m && !p && !s) msg += "Miltiades.";
		if (!m && p && s) msg += "Pausanias or 300 Spartans.";
		if (!m && p && !s) msg += "Pausanias.";
		if (!m && !p && s) msg += "300 Spartans.";

		if (is_inactive_player(current))
			return view.prompt = "Persian Land Battle: " + msg;
		view.prompt = "Persian Land Battle: Persia attacks " + game.where + "! " + msg;

		gen_action(view, 'next');
		if (m && game.greek.hand.includes(MILTIADES))
			gen_action(view, 'card_event', MILTIADES);
		if (p && game.greek.hand.includes(PAUSANIAS))
			gen_action(view, 'card_event', PAUSANIAS);
		if (s && game.greek.hand.includes(THREE_HUNDRED_SPARTANS))
			gen_action(view, 'card_event', THREE_HUNDRED_SPARTANS);
	},
	card_event: function (card) {
		switch (card) {
		case MILTIADES:
			play_miltiades_defense();
			break;
		case PAUSANIAS:
			play_pausanias();
			break;
		case THREE_HUNDRED_SPARTANS:
			play_300_spartans();
			break;
		}
	},
	next: function () {
		game.active = PERSIA;
		persian_land_battle_round();
	},
}

function greek_battle_dice() {
	if (game.greek.battle_event === MILTIADES)
		return 3;
	if (game.greek.battle_event === LEONIDAS)
		return 2;
	if (game.greek.battle_event === THREE_HUNDRED_SPARTANS)
		return 3;
	return count_greek_armies(game.where);
}

function persian_land_battle_round() {
	let p_max = (game.where === ABYDOS || game.where === EPHESOS) ? 5 : 4;
	if (game.persian.event === CAVALRY_OF_MARDONIUS)
		p_max = 6;
	let g_max = 6;
	let p_hit = roll_battle_dice("Persia", count_persian_armies(game.where), p_max);
	let g_hit = roll_battle_dice("Greece", greek_battle_dice(), g_max);
	if (p_hit >= g_hit) {
		log("Greece loses one army.");
		move_greek_army(game.where, RESERVE);
	}
	if (g_hit >= p_hit) {
		log("Persia loses one army.");
		move_persian_army(game.where, RESERVE);
	}

	if (can_play_the_immortals()) {
		end_battle_event();
		game.active = PERSIA;
		game.state = 'persian_land_battle_immortals';
	} else {
		resume_persian_land_battle();
	}
}

function greek_land_battle_round() {
	let p_max = (game.where === ABYDOS || game.where === EPHESOS) ? 5 : 4;
	let g_max = 6;
	let p_hit = roll_battle_dice("Persia", count_persian_armies(game.where), p_max);
	let g_hit = roll_battle_dice("Greece", greek_battle_dice(), g_max);
	if (p_hit >= g_hit) {
		log("Greece loses one army.");
		move_greek_army(game.where, RESERVE);
	}
	if (g_hit >= p_hit) {
		log("Persia loses one army.");
		move_persian_army(game.where, RESERVE);
	}

	if (can_play_the_immortals()) {
		end_battle_event();
		game.active = PERSIA;
		game.state = 'greek_land_battle_immortals';
	} else {
		resume_greek_land_battle();
	}
}

states.persian_land_battle_immortals = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Persian Land Battle: Army annihilated - Persia may play The Immortals.";
		view.prompt = "Persian Land Battle: Army annihilated - you may play The Immortals.";
		if (game.persian.hand.includes(THE_IMMORTALS))
			gen_action(view, 'card_event', THE_IMMORTALS);
		gen_action(view, 'next');
	},
	card_event: function () {
		play_the_immortals();
		restart_persian_land_battle();
		game.immortals = 0;
	},
	next: function () {
		end_battle(true);
	}
}

states.greek_land_battle_immortals = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Greek Land Battle: Army annihilated - Persia may play The Immortals.";
		view.prompt = "Greek Land Battle: Army annihilated - you may play The Immortals.";
		if (game.persian.hand.includes(THE_IMMORTALS))
			gen_action(view, 'card_event', THE_IMMORTALS);
		gen_action(view, 'next');
	},
	card_event: function () {
		play_the_immortals();
		restart_greek_land_battle();
		game.immortals = 0;
	},
	next: function () {
		game.active = GREECE;
		end_battle(true);
	}
}

function resume_persian_land_battle() {
	game.active = PERSIA;
	if (count_greek_armies(game.where) > 0 && count_persian_armies(game.where) > 0)
		game.state = 'persian_land_retreat_attacker';
	else
		end_battle();
}

function resume_greek_land_battle() {
	game.active = GREECE;
	if (count_greek_armies(game.where) > 0 && count_persian_armies(game.where) > 0)
		game.state = 'greek_land_retreat_attacker';
	else
		end_battle();
}

function restart_persian_land_battle() {
	game.active = PERSIA;
	goto_persian_land_battle();
}

function restart_greek_land_battle() {
	game.active = GREECE;
	goto_greek_land_battle();
}

function gen_land_retreat_attacker(view, is_friendly_control) {
	// RULES: if land movement started in neighboring city, do they have to
	// retreat to origin city if it is neighboring, or could they have gone
	// a circuitous route to attack from another direction?
	if (ROADS[game.where].includes(game.from))
		gen_action(view, 'city', game.from);
	else
		for (let city of ROADS[game.where])
			if (is_friendly_control(city) && city in game.move_list)
				gen_action(view, 'city', city);
}

states.persian_land_retreat_attacker = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Persian Land Battle: Attacker retreat?";
		view.prompt = "Persian Land Battle: Continue the battle in " + game.where + " or retreat?";
		if (game.naval_battle)
			gen_action(view, 'port', game.from);
		else
			gen_land_retreat_attacker(view, is_persian_control);
		gen_action(view, 'city', game.where); // shortcut for battle
		gen_action(view, 'battle');
	},
	city: function (to) {
		if (to !== game.where) {
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
		view.prompt = "Greek Land Battle: Continue the battle in " + game.where + " or retreat?";
		if (game.naval_battle)
			gen_action(view, 'port', game.from);
		else
			gen_land_retreat_attacker(view, is_greek_control);
		gen_action(view, 'city', game.where); // shortcut for battle
		gen_action(view, 'battle');
	},
	city: function (to) {
		if (to !== game.where) {
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
		view.prompt = "Persian Land Battle: Continue the battle in " + game.where + " or retreat?";
		// retreat by land
		for (let city of ROADS[game.where]) {
			if (is_usable_road(game.where, city) && is_greek_control(city))
				gen_action(view, 'city', city);
		}
		// retreat by sea
		if (count_greek_armies(game.where) <= count_greek_fleets(game.where)) {
			for (let port of PORTS)
				if (port !== game.where && is_greek_control(port) && count_persian_fleets(port) === 0)
					gen_action(view, 'port', port);
		}
		gen_action(view, 'city', game.where); // shortcut for battle
		gen_action(view, 'battle');
	},
	city: function (to) {
		game.active = PERSIA;
		if (to !== game.where) {
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
		view.prompt = "Greek Land Battle: Continue the battle in " + game.where + " or retreat?";
		// retreat by land
		for (let city of ROADS[game.where]) {
			if (is_usable_road(game.where, city) && is_persian_control(city))
				gen_action(view, 'city', city);
		}
		// retreat by sea
		if (count_persian_armies(game.where) <= count_persian_fleets(game.where)) {
			for (let port of PORTS)
				if (port !== game.where && is_persian_control(port) && count_greek_fleets(port) === 0)
					gen_action(view, 'port', port);
		}
		gen_action(view, 'city', game.where); // shortcut for battle
		gen_action(view, 'battle');
	},
	city: function (to) {
		game.active = GREECE;
		if (to !== game.where) {
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

function end_battle_event() {
	log("Battle in " + game.where + " ends.");

	if (game.greek.event === EVANGELION) {
		game.greek.event = 0;
		if (count_persian_armies(game.where) === 0) {
			log("Evangelion: Greece scores 1 point.");
			add_greek_vp();
		}
		if (!is_greek_control(game.where)) {
			log("Evangelion: Greece loses 1 point.");
			add_persian_vp();
		}
	}

	if (game.persian.event === THE_GREAT_KING) {
		game.persian.event = 0;
		if (count_greek_armies(game.where) === 0) {
			log("The Great King: Persia scores 1 point.");
			add_persian_vp();
		}
		if (!is_persian_control(game.where)) {
			log("The Great King: Persia loses 1 point.");
			add_greek_vp();
		}
	}

	game.greek.battle_event = 0;
}

function end_battle(already_ended=0) {
	if (!already_ended)
		end_battle_event();

	game.naval_battle = 0;
	game.from = null;

	if (game.active === PERSIA) {
		end_persian_movement();
	} else {
		end_greek_movement();
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
	case 1: return can_play_cavalry_of_mardonius();
	case 2: return can_play_tribute_of_earth_and_water();
	case 3: return can_play_tribute_of_earth_and_water();
	case 4: return can_play_carneia_festival();
	case 5: return false; // the_immortals
	case 6: return can_play_ostracism();
	case 7: return can_play_the_great_king();
	case 8: return can_play_the_royal_road();
	case 9: return can_play_hippias();
	case 10: return can_play_separate_peace();
	case 11: return false; // sudden_death_of_the_great_king
	case 12: return can_play_defection_of_thebes();
	case 13: return can_play_tribute_of_earth_and_water();
	case 14: return false; // alliance_with_carthage
	case 15: return can_play_acropolis_on_fire();
	case 16: return can_play_pacification_of_babylon_or_egypt();
	}
	return false;
}

function play_persian_event(card) {
	push_undo();
	play_persian_event_card(card);
	switch (card) {
	case 1: return play_cavalry_of_mardonius();
	case 2: return play_tribute_of_earth_and_water();
	case 3: return play_tribute_of_earth_and_water();
	case 4: return play_carneia_festival();
	case 6: return play_ostracism();
	case 7: return play_the_great_king();
	case 8: return play_the_royal_road();
	case 9: return play_hippias();
	case 10: return play_separate_peace();
	case 12: return play_defection_of_thebes();
	case 13: return play_tribute_of_earth_and_water();
	case 15: return play_acropolis_on_fire();
	case 16: return play_pacification_of_babylon_or_egypt();
	}
	throw Error("unimplemented event: " + PERSIAN_EVENT_NAMES[card]);
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
		gen_action_undo(view);
		for (let city of CITIES)
			if (!is_greek_control(city) && !is_persian_control(city))
				gen_action(view, 'city', city);
	},
	city: function (city) {
		log("Persia places an army in " + city);
		move_persian_army(RESERVE, city, 1);
		game.where = city;
		if (can_play_molon_labe()) {
			game.active = GREECE;
			game.state = 'tribute_of_earth_and_water_react';
		} else {
			end_persian_operation();
		}
	},
	undo: pop_undo,
}

states.tribute_of_earth_and_water_react = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Tribute of Earth and Water: Greece may play Molon Labe.";
		view.prompt = "Tribute of Earth and Water: You may play Molon Labe.";
		if (game.greek.hand.includes(MOLON_LABE))
			gen_action(view, 'card_event', MOLON_LABE);
		gen_action(view, 'next');
	},
	card_event: play_molon_labe,
	next: end_persian_operation,
}

function can_play_cavalry_of_mardonius() {
	return persian_can_land_move();
}

function play_cavalry_of_mardonius() {
	goto_persian_movement(true, false, CAVALRY_OF_MARDONIUS);
}

function can_play_carneia_festival() {
	return true;
}

function play_carneia_festival() {
	// TODO: confirm event by clicking on Sparta?
	game.trigger.carneia_festival = 1;
	end_persian_operation();
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

function can_play_the_great_king() {
	return persian_can_land_move();
}

function play_the_great_king() {
	goto_persian_movement(true, false, THE_GREAT_KING);
}

function can_play_the_royal_road_in(city) {
	if (count_greek_armies(city) > 0)
		return true;
	if (count_persian_armies(RESERVE) > 0)
		return true;
	return false;
}

function can_play_the_royal_road() {
	return can_play_the_royal_road_in(ABYDOS) || can_play_the_royal_road_in(EPHESOS);
}

function play_the_royal_road() {
	game.state = 'the_royal_road_select';
}

states.the_royal_road_select = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "The Royal Road.";
		view.prompt = "The Royal Road: Select Ephesos or Abydos.";
		gen_action_undo(view);
		if (can_play_the_royal_road_in(ABYDOS))
			gen_action(view, 'city', ABYDOS);
		if (can_play_the_royal_road_in(EPHESOS))
			gen_action(view, 'city', EPHESOS);
	},
	city: function (city) {
		if (count_greek_armies(city) > 0) {
			log("Persia removes all Greek armies in " + city + ".");
			move_greek_army(city, RESERVE, count_greek_armies(city));
			end_persian_operation();
		} else {
			game.where = city;
			game.state = 'the_royal_road_place';
			game.royal_road_count = 0;
		}
	},
	undo: pop_undo,
}

states.the_royal_road_place = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "The Royal Road.";
		view.prompt = "The Royal Road: Place 1-3 armies in " + game.where + ".";
		if (game.royal_road_count < 3 && count_persian_armies(RESERVE) > 0)
			gen_action(view, 'city', game.where);
		if (game.royal_road_count > 0)
			gen_action(view, 'next');
		gen_action_undo(view);
	},
	city: function (city) {
		push_undo();
		move_persian_army(RESERVE, city, 1);
		game.royal_road_count += 1;
	},
	next: function () {
		log("Persia places " + game.royal_road_count + " armies in " + game.where + ".");
		clear_undo();
		game.where = null;
		delete game.royal_road_count;
		end_persian_operation();
	},
	undo: pop_undo,
}

function can_play_hippias() {
	return game.greek.hand.length > 0;
}

function play_hippias() {
	game.state = 'hippias';
}

states.hippias = {
	prompt: function (view, current) {
		view.show_greek_hand = 1;
		if (is_inactive_player(current))
			return view.prompt = "Hippias.";
		view.prompt = "Hippias: Choose one card to discard from the Greek hand."
		for (let card of game.greek.hand)
			gen_action(view, 'discard', card);
	},
	discard: function (card) {
		discard_card("Greece", game.greek.hand, card);
		end_persian_operation();
	},
}

function can_play_separate_peace() {
	return game.greek.hand.length > 0;
}

function play_separate_peace() {
	// TODO: confirm event by clicking on Sparta?
	let g_die = roll_d6();
	let p_die = roll_d6();
	log("Greece rolls " + g_die + ".");
	log("Persia rolls " + p_die + ".");
	if (p_die > g_die) {
		log("The Athens and Sparta alliance breaks!");
		game.state = 'separate_peace';
	} else {
		log("The Athens and Sparta alliance remains unbroken.");
		end_persian_operation();
	}
}

states.separate_peace = {
	prompt: function (view, current) {
		view.show_greek_hand = 1;
		if (is_inactive_player(current))
			return view.prompt = "Separate Peace.";
		view.prompt = "Separate Peace: Discard all the Sparta cards from the Greek hand.";
		let no_sparta_cards = true;
		for (let card of game.greek.hand) {
			if (SPARTA_CARDS.includes(card)) {
				gen_action(view, 'discard', card);
				no_sparta_cards = false;
			}
		}
		if (no_sparta_cards)
			gen_action(view, 'next');
	},
	discard: function (card) {
		discard_card("Greece", game.greek.hand, card);
	},
	next: function () {
		end_persian_operation();
	}
}

function can_play_defection_of_thebes() {
	if (count_greek_armies(THEBAI) > 0) {
		for (let city of CITIES)
			if (city !== THEBAI && is_greek_control(city))
				return true;
		return false;
	}
	if (count_persian_armies(RESERVE) > 0)
		return true;
	return false;
}

function play_defection_of_thebes() {
	// TODO: confirm event by clicking on Thebes to allow undo?
	if (count_greek_armies(THEBAI) > 0) {
		game.active = GREECE;
		game.state = 'defection_of_thebes';
	} else {
		if (count_persian_armies(RESERVE) > 0) {
			log("Persia places 1 army in Thebai.");
			move_persian_army(RESERVE, THEBAI, 1);
		}
		end_persian_operation();
	}
}

states.defection_of_thebes = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Defection of Thebes.";
		view.prompt = "Defection of Thebes: Move all Greek armies in Thebes to another Greek-controlled city.";
		for (let city of CITIES)
			if (city !== THEBAI && is_greek_control(city))
				gen_action(view, 'city', city);
	},
	city: function (city) {
		log("Greece moves all armies from Thebai to " + city + ".");
		move_greek_army(THEBAI, city, count_greek_armies(THEBAI));
		if (count_persian_armies(RESERVE) > 0) {
			log("Persia places 1 army in Thebai.");
			move_persian_army(RESERVE, THEBAI, 1);
		}
		end_persian_operation();
	},
}

function can_play_acropolis_on_fire() {
	return is_persian_control(ATHENAI);
}

function play_acropolis_on_fire() {
	// TODO: confirm by clicking on Athens?
	game.trigger.acropolis_on_fire = 1;
	end_persian_operation();
}

function can_play_pacification_of_babylon_or_egypt() {
	return true;
}

function play_pacification_of_babylon_or_egypt() {
	game.state = 'pacification_of_babylon_or_egypt';
	game.persian.draw = 1;
}

states.pacification_of_babylon_or_egypt = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Pacification of Babylon or Egypt.";
		view.prompt = "Pacification of Babylon or Egypt: Discard cards, then draw replacements.";
		for (let card of game.persian.hand)
			gen_action(view, 'discard', card);
		gen_action(view, 'next');
		gen_action_undo(view);
	},
	discard: function (card) {
		push_undo();
		discard_card("Persia", game.persian.hand, card);
		++game.persian.draw;
	},
	next: function () {
		let sudden_death = 0;
		log("Persia draws " + game.persian.draw + " cards.");
		for (let i = 0; i < game.persian.draw; ++i) {
			let card = draw_card(game.deck);
			if (card === SUDDEN_DEATH_OF_THE_GREAT_KING)
				sudden_death = 1;
			game.persian.hand.push(card);
		}
		game.persian.draw = 0;
		if (sudden_death) {
			if (!game.trigger.darius)
				return goto_sudden_death_of_darius(false);
			if (!game.trigger.xerxes)
				return goto_assassination_of_xerxes(false);
		}
		end_persian_operation();
	},
	undo: pop_undo,
}

// GREEK EVENTS

function play_greek_event_card(card) {
	play_card("Greece", game.greek.hand, card, ":\n" + GREEK_EVENT_NAMES[card]);
}

function can_play_greek_event(card) {
	if (game.trigger.carneia_festival && SPARTA_CARDS.includes(card))
		return false;
	switch (card) {
	case 1: return can_play_mines_of_laurion();
	case 2: return can_play_ionian_revolt();
	case 3: return can_play_wrath_of_poseidon();
	case 4: return false; // miltiades
	case 5: return false; // themistocles
	case 6: return false; // pausanias
	case 7: return can_play_oracle_of_delphi();
	case 8: return can_play_leonidas();
	case 9: return false; // artemisia
	case 10: return can_play_evangelion();
	case 11: return can_play_melas_zomos();
	case 12: return false; // molon_labe
	case 13: return can_play_triremes();
	case 14: return can_play_support_from_syracuse();
	case 15: return false; // 300 spartans
	case 16: return can_play_desertion_of_greek_soldiers();
	}
	return false;
}

function play_greek_event(card) {
	push_undo();
	play_greek_event_card(card);
	switch (card) {
	case 1: return play_mines_of_laurion();
	case 2: return play_ionian_revolt();
	case 3: return play_wrath_of_poseidon();
	case 7: return play_oracle_of_delphi();
	case 8: return play_leonidas();
	case 10: return play_evangelion();
	case 11: return play_melas_zomos();
	case 13: return play_triremes();
	case 14: return play_support_from_syracuse();
	case 16: return play_desertion_of_greek_soldiers();
	}
	throw Error("unimplemented event: " + GREEK_EVENT_NAMES[card]);
}

function can_play_mines_of_laurion() {
	return true;
}

function play_mines_of_laurion() {
	game.greek.event = MINES_OF_LAURION;
	goto_greek_preparation_draw();
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
		gen_action_undo(view);
		for (let city of [ABYDOS, EPHESOS])
			if (count_persian_armies(city) > 0)
				gen_action(view, 'city', city);
	},
	city: function (city) {
		log("Greece removes one Persian army in " + city + ".");
		move_persian_army(city, RESERVE, 1);
		end_greek_operation();
	},
	undo: pop_undo,
}

function can_play_wrath_of_poseidon() {
	for (let port of PORTS)
		if (count_persian_fleets(port) > 0)
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
		gen_action_undo(view);
		for (let port of PORTS)
			if (count_persian_fleets(port) > 0)
				gen_action(view, 'port', port);
	},
	port: function (port) {
		log("Greece removes one Persian fleet in " + port + ".");
		move_persian_fleet(port, RESERVE, 1);
		end_greek_operation();
	},
	undo: pop_undo,
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

function can_play_leonidas() {
	return !game.trigger.leonidas && greek_can_land_move();
}

function play_leonidas() {
	game.greek.battle_event = LEONIDAS;
	if (count_greek_armies(RESERVE) > 0) {
		game.trigger.leonidas = 1;
		remove_greek_army(RESERVE);
		game.state = 'leonidas';
	} else {
		game.state = 'leonidas_pay';
	}
}

states.leonidas_pay = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Leonidas.";
		view.prompt = "Leonidas: Remove one Greek army to pay for the event.";
		gen_action_undo(view);
		gen_greek_armies(view);
	},
	city: function (space) {
		push_undo();
		game.trigger.leonidas = 1;
		remove_greek_army(space);
		game.state = 'leonidas';
	},
	undo: pop_undo,
}

states.leonidas = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Leonidas.";
		view.prompt = "Leonidas: Select one Greek army and move it.";
		gen_greek_land_movement(view);
		gen_action_undo(view);
	},
	city: function (space) {
		goto_greek_land_movement_leonidas(space);
	},
	undo: pop_undo,
}

function can_play_evangelion() {
	return greek_can_land_move();
}

function play_evangelion() {
	goto_greek_movement(true, false, EVANGELION);
}

function can_play_melas_zomos() {
	return count_greek_armies(RESERVE) > 0 && is_greek_control(SPARTA);
}

function play_melas_zomos() {
	// TODO: confirm by clicking on Sparta
	log("Greece places one army in Sparta.");
	move_greek_army(RESERVE, SPARTA, 1);
	end_greek_operation();
}

function can_play_triremes() {
	return greek_can_naval_move();
}

function play_triremes() {
	goto_greek_movement(false, true, TRIREMES);
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
		gen_action_undo(view);
		for (let city of CITIES)
			if (count_persian_armies(city) > 0)
				gen_action(view, 'city', city);
	},
	city: function (city) {
		log("Greece removes one Persian army in " + city + ".");
		move_persian_army(city, RESERVE, 1);
		end_greek_operation();
	},
	undo: pop_undo,
}

// GREEK REACTION EVENTS

function can_play_molon_labe() {
	if (game.greek.hand.length === 0)
		return false;
	if (is_visible_discard(MOLON_LABE))
		return false;
	return true;
}

function play_molon_labe() {
	play_greek_event_card(MOLON_LABE);
	log("Greece removes a Persian army in " + game.where + ".");
	move_persian_army(game.where, RESERVE, 1);
	game.where = null;
	goto_greek_movement(true, false, MOLON_LABE);
}

function can_play_pausanias() {
	if (game.greek.hand.length === 0)
		return false;
	if (is_visible_discard(PAUSANIAS))
		return false;
	if (game.trigger.carneia_festival)
		return false;
	return game.persian.event === CAVALRY_OF_MARDONIUS;
}

function play_pausanias() {
	play_greek_event_card(PAUSANIAS);
	game.persian.event = 0;
	goto_persian_land_battle_react();
}

function can_play_300_spartans() {
	if (game.greek.hand.length === 0)
		return false;
	if (is_visible_discard(THREE_HUNDRED_SPARTANS))
		return false;
	if (game.trigger.carneia_festival)
		return false;
	return game.greek.battle_event === 0;
}

function play_300_spartans() {
	play_greek_event_card(THREE_HUNDRED_SPARTANS);
	game.greek.battle_event = THREE_HUNDRED_SPARTANS;
	goto_persian_land_battle_react();
}

function can_play_miltiades_defense() {
	if (game.greek.hand.length === 0)
		return false;
	if (is_visible_discard(MILTIADES))
		return false;
	if (game.trigger.miltiades)
		return false;
	return game.greek.battle_event === 0;
}

function can_play_miltiades_attack() {
	if (game.greek.hand.length === 0)
		return false;
	if (is_visible_discard(MILTIADES))
		return false;
	if (game.trigger.miltiades)
		return false;
	return game.greek.battle_event === 0 && count_persian_armies(game.where) > 0;
}

function play_miltiades_defense() {
	play_greek_event_card(MILTIADES);
	game.greek.battle_event = MILTIADES;
	if (count_greek_armies(RESERVE) > 0) {
		remove_greek_army(RESERVE);
		game.trigger.miltiades = 1;
		goto_persian_land_battle_react();
	} else {
		game.state = 'miltiades_defense_pay';
	}
}

function play_miltiades_attack() {
	play_greek_event_card(MILTIADES);
	game.greek.battle_event = MILTIADES;
	if (count_greek_armies(RESERVE) > 0) {
		remove_greek_army(RESERVE);
		game.trigger.miltiades = 1;
	} else {
		game.state = 'miltiades_attack_pay';
	}
}

states.miltiades_defense_pay = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Leonidas.";
		view.prompt = "Miltiades: Remove one Greek army to pay for the event.";
		for (let city of CITIES) {
			let need = (city === game.where) ? 2 : 1;
			if (count_greek_armies(city) >= need)
				gen_action(view, 'city', city);
		}
		gen_action_undo(view);
	},
	city: function (space) {
		push_undo();
		remove_greek_army(space);
		game.trigger.miltiades = 1;
		goto_persian_land_battle_react();
	},
	undo: pop_undo,
}

states.miltiades_attack_pay = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Leonidas.";
		view.prompt = "Miltiades: Remove one Greek army to pay for the event.";
		for (let city of CITIES) {
			let need = (city === game.where) ? 2 : 1;
			if (count_greek_armies(city) >= need)
				gen_action(view, 'city', city);
		}
		gen_action_undo(view);
	},
	city: function (space) {
		push_undo();
		remove_greek_army(space);
		game.trigger.miltiades = 1;
		game.state = 'greek_land_movement_confirm';
	},
	undo: pop_undo,
}

function can_play_themistocles() {
	if (game.greek.hand.length === 0)
		return false;
	if (is_visible_discard(THEMISTOCLES))
		return false;
	if (game.trigger.themistocles)
		return false;
	for (let port of PORTS)
		if (port !== game.where && count_greek_fleets(port) > 0)
			return true;
	return false;
}

function play_themistocles() {
	play_greek_event_card(THEMISTOCLES);
	game.greek.event = THEMISTOCLES;
	if (count_greek_armies(RESERVE) > 0) {
		game.trigger.themistocles = 1;
		remove_greek_army(RESERVE);
		goto_themistocles();
	} else {
		game.state = 'themistocles_pay';
	}
}

states.themistocles_pay = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Themistocles.";
		view.prompt = "Themistocles: Remove one Greek army to pay for the event.";
		gen_greek_armies(view);
	},
	city: function (space) {
		push_undo();
		game.trigger.themistocles = 1;
		remove_greek_army(space);
		goto_themistocles();
	},
}

function goto_themistocles() {
	game.themistocles = {
		from: game.from,
		where: game.where,
		transport: game.transport,
	};
	goto_greek_movement(false, true, THEMISTOCLES);
}

function can_play_artemisia(persia_lost_fleet) {
	if (game.greek.hand.length === 0)
		return false;
	if (is_visible_discard(ARTEMISIA))
		return false;
	if (game.trigger.artemisia)
		return false;
	return persia_lost_fleet && count_persian_fleets(game.where) > 0;
}

function play_artemisia() {
	play_greek_event_card(ARTEMISIA);
	game.trigger.artemisia = 1;

	remove_persian_fleet(game.where);
	if (game.attacker == PERSIA) {
		if (count_persian_fleets(game.where) < game.transport) {
			log("Persia loses one fleet and one army.");
			move_persian_army(game.where, RESERVE);
			--game.transport;
		} else {
			log("Persia loses one fleet.");
		}
	} else {
		log("Persia loses one fleet.");
	}
}

// PERSIAN REACTION EVENTS

function can_play_the_immortals() {
	if (game.persian.hand.length === 0)
		return false;
	if (is_visible_discard(THE_IMMORTALS))
		return false;
	if (game.trigger.xerxes)
		return false;
	if (game.immortals === 0)
		return false;
	return count_persian_armies(game.where) === 0;
}

function play_the_immortals() {
	log("");
	play_persian_event_card(THE_IMMORTALS);
	log("The Immortals recover " + game.immortals + " armies!");
	move_persian_army(RESERVE, game.where, game.immortals);
}

// SUPPLY PHASE

function goto_supply_phase() {
	start_persian_supply_phase();
}

function start_persian_supply_phase() {
	log("");
	log("Persian Supply Phase");
	if (game.campaign === 5 || game.persian.hand.length === 0)
		return start_persian_attrition();
	game.active = PERSIA;
	game.state = 'persian_cards_in_hand';
}

function start_greek_supply_phase() {
	log("");
	log("Greek Supply Phase");
	if (game.campaign === 5 || game.greek.hand.length === 0)
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
		gen_action_undo(view);
	},
	discard: function (card) {
		push_undo();
		discard_card("Persia", game.persian.hand, card);
	},
	next: function () {
		clear_undo();
		log("Persia keeps " + game.persian.hand.length + " cards.");
		start_persian_attrition();
	},
	undo: pop_undo,
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
		gen_action_undo(view);
	},
	discard: function (card) {
		push_undo();
		discard_card("Greece", game.greek.hand, card);
	},
	next: function () {
		clear_undo();
		log("Greece keeps " + game.greek.hand.length + " cards.");
		start_greek_attrition();
	},
	undo: pop_undo,
}

function start_persian_attrition() {
	init_log();
	let armies = 0;
	let supply = 0;
	for (let city of CITIES) {
		if (city !== EPHESOS && city !== ABYDOS) {
			armies += count_persian_armies(city);
			if (is_persian_control(city))
				supply += SUPPLY[city];
		}
	}
	game.attrition = Math.max(0, armies - supply);
	if (game.attrition > 0) {
		game.active = PERSIA;
		game.state = 'persian_attrition';
	} else {
		end_persian_attrition();
	}
}

function start_greek_attrition() {
	init_log();
	let armies = 0;
	let supply = 0;
	for (let city of CITIES) {
		armies += count_greek_armies(city);
		if (is_greek_control(city))
			supply += SUPPLY[city];
	}
	game.attrition = Math.max(0, armies - supply);
	if (game.attrition > 0) {
		game.active = GREECE;
		game.state = 'greek_attrition';
	} else {
		end_greek_attrition();
	}
}

states.persian_attrition = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Persian Supply Phase.";
		view.prompt = "Persian Supply Phase: Remove " + game.attrition + " armies.";
		for (let city of CITIES) {
			if (city !== EPHESOS && city !== ABYDOS)
				if (count_persian_armies(city) > 0)
					gen_action(view, 'city', city);
		}
	},
	city: function (space) {
		push_log(space);
		move_persian_army(space, RESERVE);
		if (--game.attrition === 0)
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
		push_log(space);
		move_greek_army(space, RESERVE);
		if (--game.attrition === 0)
			end_greek_attrition();
	},
}

function end_persian_attrition() {
	flush_log("Persian attrition:");
	persian_loc();
	start_greek_supply_phase();
}

function end_greek_attrition() {
	flush_log("Greek attrition:");
	greek_loc();
	goto_scoring_phase();
}

function persian_loc() {
	let msg = [];
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
	if ((is_persian_control(ABYDOS) && count_greek_fleets(ABYDOS) === 0) ||
		(is_persian_control(EPHESOS) && count_greek_fleets(EPHESOS) === 0))
		for (let port of PORTS)
			if (count_persian_fleets(port) > 0)
				loc[port] = 1;
	for (let city of CITIES) {
		if (!loc[city]) {
			let n = count_persian_armies(city);
			if (n > 0) {
				move_persian_army(city, RESERVE, n);
				msg.push(n + " " + city);
			}
		}
	}
	if (msg.length > 0)
		log("Persian out of supply:\n" + msg.join("\n"));
}

function greek_loc() {
	let msg = [];
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
	if ((is_greek_control(ATHENAI) && count_persian_fleets(ATHENAI) === 0) ||
		(is_greek_control(SPARTA) && count_persian_fleets(SPARTA) === 0))
		for (let port of PORTS)
			if (count_greek_fleets(port) > 0)
				loc[port] = 1;
	for (let city of CITIES) {
		if (!loc[city]) {
			let n = count_greek_armies(city);
			if (n > 0) {
				move_greek_army(city, RESERVE, n);
				msg.push(n + " " + city);
			}
		}
	}
	if (msg.length > 0)
		log("Greek out of supply:\n" + msg.join("\n"));
}

// SCORING PHASE

function goto_scoring_phase() {
	if (is_persian_control(ATHENAI) && is_persian_control(SPARTA)) {
		game.victory = "Persia wins by controlling Athenai and Sparta!";
		game.state = 'game_over';
		game.result = PERSIA;
		return;
	}
	if (is_greek_control(ABYDOS) && is_greek_control(EPHESOS)) {
		game.victory = "Greece wins by controlling Abydos and Ephesos!";
		game.state = 'game_over';
		game.result = GREECE;
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
	log("");
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
	game.trigger.carneia_festival = 0;
	if (game.campaign === 5) {
		if (game.vp < 0) {
			game.victory = $("Greece wins with " + (-game.vp) + " points.");
			game.result = GREECE;
		} else if (game.vp > 0) {
			game.victory = $("Persia wins with " + game.vp + " points.");
			game.result = PERSIA;
		} else {
			game.victory = "Nobody wins.";
			game.result = "Draw";
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

exports.setup = function (scenario) {
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
			event: 0,
			fleet_cost: (scenario === CHEAP_PERSIAN_FLEETS ? 1 : 2),
		},
		greek: {
			hand: [],
			draw: 0,
			pass: 0,
			event: 0,
			battle_event: 0,
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
			carneia_festival: 0,
			acropolis_on_fire: 0,
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
	let S = states[game.state];
	if (action in S)
		S[action](arg, current);
	else
		throw new Error("Invalid action: " + action);
	return state;
}

exports.resign = function (state, current) {
	game = state;
	if (game.state !== 'game_over') {
		log("");
		log(current + " resigned.");
		game.active = "None";
		game.state = 'game_over';
		game.victory = current + " resigned.";
		if (current === PERSIA)
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

	let draw = game.greek.draw + game.persian.draw;
	if (draw > game.deck.length) {
		view.deck_size = game.deck.length + game.discard.length - draw;
		view.discard_size = 0;
	} else {
		view.deck_size = game.deck.length - draw;
		view.discard_size = game.discard.length;
	}

	states[game.state].prompt(view, current);
	view.prompt = $(view.prompt);

	if (game.transport) {
		if (game.themistocles)
			view.transport = { count:game.transport, where:game.themistocles.where, who:game.attacker };
		else
			view.transport = { count:game.transport, where:game.where, who:game.attacker };
	}

	if (current === GREECE) {
		view.hand = game.greek.hand;
		view.draw = game.greek.draw;
	}
	if (current === PERSIA) {
		view.hand = game.persian.hand;
		view.draw = game.persian.draw;
	}
	if (view.show_greek_hand) {
		view.hand = game.greek.hand;
	}

	return view;
}
