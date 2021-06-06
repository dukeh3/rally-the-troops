"use strict";

const US = "United States";
const TR = "Tripolitania";

const { SPACES, PIECES, SEASONS } = require('./data');

exports.scenarios = [
	"Historical",
];

function get_piece_id(name) {
	return PIECES.indexOf(name);
}

function get_space_id(name) {
	return SPACES.indexOf(name);
}

const ALEXANDRIA_HARBOR = get_space_id("Alexandria Harbor");
const ALGIERS_HARBOR = get_space_id("Algiers Harbor");
const ALGIERS_PATROL_ZONE = get_space_id("Algiers Patrol Zone");
const BENGHAZI_HARBOR = get_space_id("Benghazi Harbor");
const DERNE_HARBOR = get_space_id("Derne Harbor");
const GIBRALTAR_HARBOR = get_space_id("Gibraltar Harbor");
const GIBRALTAR_PATROL_ZONE = get_space_id("Gibraltar Patrol Zone");
const MALTA_HARBOR = get_space_id("Malta Harbor");
const TANGIER_HARBOR = get_space_id("Tangier Harbor");
const TANGIER_PATROL_ZONE = get_space_id("Tangier Patrol Zone");
const TRIPOLI_HARBOR = get_space_id("Tripoli Harbor");
const TRIPOLI_PATROL_ZONE = get_space_id("Tripoli Patrol Zone");
const TUNIS_HARBOR = get_space_id("Tunis Harbor");
const TUNIS_PATROL_ZONE = get_space_id("Tunis Patrol Zone");
const UNITED_STATES_SUPPLY = get_space_id("United States Supply");
const TRIPOLITAN_SUPPLY = get_space_id("Tripolitan Supply");
const TRACK_1801 = get_space_id("1801");
const TRACK_1802 = get_space_id("1802");
const TRACK_1803 = get_space_id("1803");
const TRACK_1804 = get_space_id("1804");
const TRACK_1805 = get_space_id("1805");
const TRACK_1806 = get_space_id("1806");

const US_CARD_NAMES = [
	null,
	"Thomas Jefferson",
	"Swedish Frigates Arrive",
	"Hamet's Army Created",
	"Treaty of Peace and Amity",
	"Assault on Tripoli",
	"Naval Movement",
	"Naval Movement",
	"Naval Movement",
	"Naval Movement",
	"Early Deployment",
	"A Show of Force",
	"Tribute Paid",
	"Constantinople Demands Tribute",
	"Hamet Recruits Bedouins",
	"Bainbridge Supplies Intel",
	"Congress Authorizes Action",
	"Corsairs Confiscated",
	"Burn the Philadelphia",
	"Launch the Intrepid",
	"General Eaton Attacks Derne",
	"General Eaton Attacks Benghazi",
	"Lieutenant Sterett in Pursuit",
	"Preble's Boys Take Aim",
	"The Daring Stephen Decatur",
	"Send in the Marines",
	"Lieutenant O'Bannon Leads the Charge",
	"Marine Sharpshooters",
];

const TR_CARD_NAMES = [
	null,
	"Yusuf Qaramanli",
	"Murad Reis Breaks Out",
	"Constantinople Sends Aid",
	"US Supplies Run Low",
	"Algerine Corsairs Raid",
	"Algerine Corsairs Raid",
	"Moroccan Corsairs Raid",
	"Moroccan Corsairs Raid",
	"Tunisian Corsairs Raid",
	"Tunisian Corsairs Raid",
	"Troops to Derne",
	"Troops to Benghazi",
	"Troops to Tripoli",
	"Storms",
	"Tripoli Attacks",
	"Sweden Pays Tribute",
	"Tripoli Acquires Corsairs",
	"The Philadelphia Runs Aground",
	"Algiers Declares War",
	"Morocco Declares War",
	"Tunis Declares War",
	"US Signal Books Overboard",
	"Uncharted Waters",
	"Merchant Ship Converted",
	"Happy Hunting",
	"The Guns of Tripoli",
	"Mercenaries Desert",
];

const US_FRIGATES = [
	'us_frigate_1',
	'us_frigate_2',
	'us_frigate_3',
	'us_frigate_4',
	'us_frigate_5',
	'us_frigate_6',
	'us_frigate_7',
	'us_frigate_8',
];

const TR_CORSAIRS = [
	'tr_corsair_1',
	'tr_corsair_2',
	'tr_corsair_3',
	'tr_corsair_4',
	'tr_corsair_5',
	'tr_corsair_6',
	'tr_corsair_7',
	'tr_corsair_8',
	'tr_corsair_9',
];

const ALLIED_CORSAIRS = [
	'al_corsair_1',
	'al_corsair_2',
	'al_corsair_3',
	'al_corsair_4',
	'al_corsair_5',
	'al_corsair_6',
	'al_corsair_7',
	'al_corsair_8',
	'al_corsair_9',
];

const states = {};

let game = null;

function log(...args) {
	let s = Array.from(args).join("");
	game.log.push(s);
}

function logp(...args) {
	let s = Array.from(args).join("");
	game.log.push(game.active + " " + s);
}

function is_inactive_player(current) {
	return current == "Observer" || (game.active != current && game.active != "Both");
}

function remove_from_array(array, item) {
	let i = array.indexOf(item);
	if (i >= 0)
		array.splice(i, 1);
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

function gen_action_pass(view, text) {
	if (!view.actions)
		view.actions = {}
	view.actions['pass'] = text;
}

function gen_action(view, action, argument) {
	if (!view.actions)
		view.actions = {}
	if (argument != undefined) {
		if (!(action in view.actions))
			view.actions[action] = [ argument ];
		else
			view.actions[action].push(argument);
	} else {
		view.actions[action] = 1;
	}
}

function roll_d6() {
	return Math.floor(Math.random() * 6) + 1;
}

function reset_deck() {
	let deck = [];
	for (let c = 1; c <= 27; ++c)
		deck.push(c);
	return deck;
}

function deal_cards(deck, n) {
	let hand = [];
	for (let i = 0; i < n; ++i) {
		let c = Math.floor(Math.random() * deck.length);
		hand.push(deck[c]);
		deck.splice(c, 1);
	}
	return hand;
}

function count_pieces(list, where) {
	let n = 0;
	for (let p of list)
		if (game.location[p] == where)
			++n;
	return n;
}

function count_american_frigates(where) {
	return count_pieces(US_FRIGATES, where);
}

function count_tripolitan_corsairs(where) {
	return count_pieces(TR_CORSAIRS, where);
}

function count_allied_corsairs(where) {
	return count_pieces(ALLIED_CORSAIRS, where);
}

function can_play_thomas_jefferson() {
	return game.us.core.includes(1);
}

function can_play_swedish_frigates_arrive() {
	return game.us.core.includes(2);
}

function can_play_hamets_army_created() {
	return game.us.core.includes(3) &&
		count_american_frigates(ALEXANDRIA_HARBOR) > 0 &&
		game.year >= 1804;
}

function can_play_yusuf_qaramanli() {
	let n = count_allied_corsairs(ALGIERS_HARBOR) +
		count_allied_corsairs(TRIPOLI_HARBOR) +
		count_allied_corsairs(TUNIS_HARBOR);
	return game.tr.core.includes(1) && n > 0;
}

function can_play_murad_reis_breaks_out() {
	return game.tr.core.includes(2);
}

function can_play_constantinople_sends_aid() {
	return game.tr.core.includes(3) && game.derne_captured;
}

function start_year() {
	game.active = US;
	game.state = 'american_play';
}

states.american_play = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "American play.";
		view.prompt = "American play.";
		if (can_play_thomas_jefferson())
			gen_action(view, 'card_event', 'us1');
		if (can_play_swedish_frigates_arrive())
			gen_action(view, 'card_event', 'us2');
		if (can_play_hamets_army_created())
			gen_action(view, 'card_event', 'us3');
	},
}

states.tripolitan_play = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Tripolitan play.";
		view.prompt = "Tripolitan play.";
		if (can_play_yusuf_qaramanli())
			gen_action(view, 'card_event', 'tr1');
		if (can_play_murad_reis_breaks_out())
			gen_action(view, 'card_event', 'tr2');
		if (can_play_constantinople_sends_aid())
			gen_action(view, 'card_event', 'tr3');
	},
}

states.game_over = {
	prompt: function (view, current) {
		return view.prompt = game.victory;
	},
}

function deploy(piece_name, space) {
	game.location[get_piece_id(piece_name)] = space;
}

exports.setup = function (scenario, players) {
	if (players.length != 2)
		throw new Error("Invalid player count: " + players.length);
	game = {
		state: null,
		year: 1801,
		season: 0,
		log: [],
		location: [],
		us: {
			core: [ 1, 2, 3 ],
			hand: [],
			deck: [],
			discard: [],
		},
		tr: {
			core: [ 1, 2, 3 ],
			hand: [],
			deck: [],
			discard: [],
			coins: 0,
		},
		derne_captured: 0,
	};

	for (let i = 4; i <= 27; ++i) {
		game.us.deck.push(i);
		game.tr.deck.push(i);
	}
	game.us.hand = deal_cards(game.us.deck, 6);
	game.tr.hand = deal_cards(game.tr.deck, 6);

	deploy("us_frigate_1", GIBRALTAR_HARBOR);
	deploy("us_frigate_2", GIBRALTAR_HARBOR);
	deploy("us_frigate_3", GIBRALTAR_HARBOR);
	deploy("us_frigate_4", TRACK_1802);
	deploy("us_frigate_5", TRACK_1803);
	deploy("us_frigate_6", TRACK_1804);
	deploy("us_frigate_7", UNITED_STATES_SUPPLY);
	deploy("us_frigate_8", UNITED_STATES_SUPPLY);

//for (let i = 1; i <= 8; ++i)
//deploy("us_frigate_" + i, UNITED_STATES_SUPPLY);

	deploy("us_gunboat_1", UNITED_STATES_SUPPLY);
	deploy("us_gunboat_2", UNITED_STATES_SUPPLY);
	deploy("us_gunboat_3", UNITED_STATES_SUPPLY);

	deploy("se_frigate_1", UNITED_STATES_SUPPLY);
	deploy("se_frigate_2", UNITED_STATES_SUPPLY);

	deploy("us_marine_1", UNITED_STATES_SUPPLY);
	deploy("us_marine_2", UNITED_STATES_SUPPLY);
	deploy("us_marine_3", UNITED_STATES_SUPPLY);
	deploy("us_marine_4", UNITED_STATES_SUPPLY);

	for (let i = 1; i <= 10; ++i)
		deploy("ar_infantry_" + i, UNITED_STATES_SUPPLY);

	deploy("tr_frigate_1", TRIPOLITAN_SUPPLY);
	deploy("tr_frigate_2", TRIPOLITAN_SUPPLY);

	deploy("tr_corsair_1", GIBRALTAR_HARBOR);
	deploy("tr_corsair_2", GIBRALTAR_HARBOR);
	deploy("tr_corsair_3", TRIPOLI_HARBOR);
	deploy("tr_corsair_4", TRIPOLI_HARBOR);
	deploy("tr_corsair_5", TRIPOLI_HARBOR);
	deploy("tr_corsair_6", TRIPOLI_HARBOR);
	deploy("tr_corsair_7", TRIPOLITAN_SUPPLY);
	deploy("tr_corsair_8", TRIPOLITAN_SUPPLY);
	deploy("tr_corsair_9", TRIPOLITAN_SUPPLY);

//for (let i = 1; i <= 9; ++i)
//deploy("tr_corsair_" + i, TRIPOLITAN_SUPPLY);

	for (let i = 1; i <= 9; ++i)
		deploy("al_corsair_" + i, TRIPOLITAN_SUPPLY);

	deploy("tr_infantry_1", TRIPOLI_HARBOR);
	deploy("tr_infantry_2", TRIPOLI_HARBOR);
	deploy("tr_infantry_3", TRIPOLI_HARBOR);
	deploy("tr_infantry_4", TRIPOLI_HARBOR);
	deploy("tr_infantry_5", BENGHAZI_HARBOR);
	deploy("tr_infantry_6", BENGHAZI_HARBOR);
	deploy("tr_infantry_7", DERNE_HARBOR);
	deploy("tr_infantry_8", DERNE_HARBOR);
	for (let i = 9; i <= 20; ++i)
//for (let i = 1; i <= 20; ++i)
		deploy("tr_infantry_" + i, TRIPOLITAN_SUPPLY);

	start_year();
	return game;
}

exports.action = function (state, current, action, arg) {
	game = state;
	// TODO: check against action list
	if (true) {
		let S = states[game.state];
		if (action in S) {
			S[action](arg, current);
		} else {
			throw new Error("Invalid action: " + action);
		}
	}
	return state;
}

exports.resign = function (state, current) {
	game = state;
	if (game.state != 'game_over') {
		log("");
		log(current + " resigned.");
		count_vp();
		game.active = null;
		game.state = 'game_over';
		game.result = enemy(current);
		game.victory = current + " resigned."
	}
}

exports.view = function(state, current) {
	game = state;

	let view = {
		log: game.log,
		year: game.year,
		season: game.season,
		location: game.location,
		active: game.active,
		prompt: null,
		actions: null,
		tr: {
			core: game.tr.core.map(x => 'tr' + x),
			deck: game.tr.deck.length,
			discard: game.tr.discard.length,
			hand: game.tr.hand.length,
			coins: game.tr.coins,
		},
		us: {
			core: game.us.core.map(x => 'us' + x),
			deck: game.us.deck.length,
			discard: game.us.discard.length,
			hand: game.us.hand.length,
		},
	};

	states[game.state].prompt(view, current);

	if (current == TR)
		view.hand = game.tr.hand.map(x => 'tr' + x);
	else if (current == US)
		view.hand = game.us.hand.map(x => 'us' + x);
	else
		view.hand = [];

	return view;
}
