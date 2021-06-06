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

function create_piece_list(n, name) {
	let list = [];
	for (let i = 1; i <= n; ++i)
		list.push(get_piece_id(name + i));
	return list;
}

const US_FRIGATES = create_piece_list(8, 'us_frigate_');
const TR_FRIGATES = create_piece_list(2, 'tr_frigate_');
const SE_FRIGATES = create_piece_list(2, 'se_frigate_');
const US_GUNBOATS = create_piece_list(3, 'us_gunboat_');
const TR_CORSAIRS = create_piece_list(9, 'tr_corsair_');
const AL_CORSAIRS = create_piece_list(9, 'al_corsair_');
const US_MARINES = create_piece_list(4, 'us_marine_');
const AR_INFANTRY = create_piece_list(10, 'ar_infantry_');
const TR_INFANTRY = create_piece_list(20, 'tr_infantry_');

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

const TRACK_YEAR = {
	1801: TRACK_1801,
	1802: TRACK_1802,
	1803: TRACK_1803,
	1804: TRACK_1804,
	1805: TRACK_1805,
	1806: TRACK_1806,
};

const FRIGATE_SPACES = [
	ALEXANDRIA_HARBOR,
	ALGIERS_HARBOR,
	ALGIERS_PATROL_ZONE,
	BENGHAZI_HARBOR,
	DERNE_HARBOR,
	GIBRALTAR_HARBOR,
	GIBRALTAR_PATROL_ZONE,
	MALTA_HARBOR,
	TANGIER_HARBOR,
	TANGIER_PATROL_ZONE,
	TRIPOLI_HARBOR,
	TRIPOLI_PATROL_ZONE,
	TUNIS_HARBOR,
	TUNIS_PATROL_ZONE,
];

const THOMAS_JEFFERSON = 1;
const SWEDISH_FRIGATES_ARRIVE = 2;
const HAMETS_ARMY_CREATED = 3;
const TREATY_OF_PEACE_AND_AMITY = 4;
const ASSAULT_ON_TRIPOLI = 5;
const NAVAL_MOVEMENT_1 = 6;
const NAVAL_MOVEMENT_2 = 7;
const NAVAL_MOVEMENT_3 = 8;
const NAVAL_MOVEMENT_4 = 9;
const EARLY_DEPLOYMENT = 10;
const A_SHOW_OF_FORCE = 11;
const TRIBUTE_PAID = 12;
const CONSTANTINOPLE_DEMANDS_TRIBUTE = 13;
const HAMET_RECRUITS_BEDOUINS = 14;
const BAINBRIDGE_SUPPLIES_INTEL = 15;
const CONGRESS_AUTHORIZES_ACTION = 16;
const CORSAIRS_CONFISCATED = 17;
const BURN_THE_PHILADELPHIA = 18;
const LAUNCH_THE_INTREPID = 19;
const GENERAL_EATON_ATTACKS_DERNE = 20;
const GENERAL_EATON_ATTACKS_BENGHAZI = 21;
const LIEUTENANT_STERETT_IN_PURSUIT = 22;
const PREBLES_BOYS_TAKE_AIM = 23;
const THE_DARING_STEPHEN_DECATUR = 24;
const SEND_IN_THE_MARINES = 25;
const LIEUTENANT_OBANNON_LEADS_THE_CHARGE = 26;
const MARINE_SHARPSHOOTERS = 27;

const YUSUF_QARAMANLI = 28;
const MURAD_REIS_BREAKS_OUT = 29;
const CONSTANTINOPLE_SENDS_AID = 30;
const US_SUPPLIES_RUN_LOW = 31;
const ALGERINE_CORSAIRS_RAID_1 = 32;
const ALGERINE_CORSAIRS_RAID_2 = 33;
const MOROCCAN_CORSAIRS_RAID_1 = 34;
const MOROCCAN_CORSAIRS_RAID_2 = 35;
const TUNISIAN_CORSAIRS_RAID_1 = 36;
const TUNISIAN_CORSAIRS_RAID_2 = 37;
const TROOPS_TO_DERNE = 38;
const TROOPS_TO_BENGHAZI = 39;
const TROOPS_TO_TRIPOLI = 40;
const STORMS = 41;
const TRIPOLI_ATTACKS = 42;
const SWEDEN_PAYS_TRIBUTE = 43;
const TRIPOLI_ACQUIRES_CORSAIRS = 44;
const THE_PHILADELPHIA_RUNS_AGROUND = 45;
const ALGIERS_DECLARES_WAR = 46;
const MOROCCO_DECLARES_WAR = 47;
const TUNIS_DECLARES_WAR = 48;
const US_SIGNAL_BOOKS_OVERBOARD = 49;
const UNCHARTED_WATERS = 50;
const MERCHANT_SHIP_CONVERTED = 51;
const HAPPY_HUNTING = 52;
const THE_GUNS_OF_TRIPOLI = 53;
const MERCENARIES_DESERT = 54;

const CARD_NAMES = [
	// No Card
	null,

	// United States Cards
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

	// Tripolitan Cards
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

function should_remove_after_play(card) {
	switch (card) {
	case THOMAS_JEFFERSON:
	case SWEDISH_FRIGATES_ARRIVE:
	case HAMETS_ARMY_CREATED:
	case CONGRESS_AUTHORIZES_ACTION:
	case CORSAIRS_CONFISCATED:
	case BURN_THE_PHILADELPHIA:
	case LAUNCH_THE_INTREPID:
	case GENERAL_EATON_ATTACKS_DERNE:
	case GENERAL_EATON_ATTACKS_BENGHAZI:
	case LIEUTENANT_STERETT_IN_PURSUIT:
	case PREBLES_BOYS_TAKE_AIM:
	case THE_DARING_STEPHEN_DECATUR:
	case SEND_IN_THE_MARINES:
	case LIEUTENANT_OBANNON_LEADS_THE_CHARGE:
	case MARINE_SHARPSHOOTERS:
	case YUSUF_QARAMANLI:
	case MURAD_REIS_BREAKS_OUT:
	case CONSTANTINOPLE_SENDS_AID:
	case SWEDEN_PAYS_TRIBUTE:
	case TRIPOLI_ACQUIRES_CORSAIRS:
	case THE_PHILADELPHIA_RUNS_AGROUND:
	case ALGIERS_DECLARES_WAR:
	case MOROCCO_DECLARES_WAR:
	case TUNIS_DECLARES_WAR:
	case US_SIGNAL_BOOKS_OVERBOARD:
	case UNCHARTED_WATERS:
	case MERCHANT_SHIP_CONVERTED:
	case HAPPY_HUNTING:
	case THE_GUNS_OF_TRIPOLI:
	case MERCENARIES_DESERT:
		return true;
	}
	return false;
}

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

function reshuffle_discard(deck, discard) {
	while (discard.length > 0)
		deck.push(discard.pop());
}

function draw_cards(hand, deck, n) {
	for (let i = 0; i < n; ++i) {
		let c = Math.floor(Math.random() * deck.length);
		hand.push(deck[c]);
		deck.splice(c, 1);
	}
}

function count_pieces(list, where) {
	let n = 0;
	for (let p of list)
		if (game.location[p] == where)
			++n;
	return n;
}

function discard_card(player, card, reason = "") {
	log("");
	log(game.active + " discards \"" + CARD_NAMES[card] + "\"" + reason + ".");
	remove_from_array(player.hand, card);
	player.discard.push(card);
}

function play_card(player, card) {
	log("");
	log(game.active + " plays \"" + CARD_NAMES[card] + "\".");
	remove_from_array(player.hand, card);
	if (!should_remove_after_play(card))
		player.discard.push(card);
}

function deploy(piece_name, space) {
	game.location[get_piece_id(piece_name)] = space;
}

function move_one_piece(list, from, to) {
	for (let p of list) {
		if (game.location[p] == from) {
			game.location[p] = to;
			return;
		}
	}
	throw Error("no " + list + " to move from " + from);
}

function move_all_pieces(list, from, to) {
	for (let p of list) {
		if (game.location[p] == from) {
			game.location[p] = to;
		}
	}
}

function count_american_frigates(where) {
	return count_pieces(US_FRIGATES, where);
}

function count_tripolitan_corsairs(where) {
	return count_pieces(TR_CORSAIRS, where);
}

function count_allied_corsairs(where) {
	return count_pieces(AL_CORSAIRS, where);
}

function can_play_thomas_jefferson() {
	return game.us.core.includes(THOMAS_JEFFERSON);
}

function can_play_swedish_frigates_arrive() {
	return game.us.core.includes(SWEDISH_FRIGATES_ARRIVE);
}

function can_play_hamets_army_created() {
	return game.us.core.includes(HAMETS_ARMY_CREATED) &&
		count_american_frigates(ALEXANDRIA_HARBOR) > 0 &&
		game.year >= 1804;
}

function can_play_yusuf_qaramanli() {
	let n = count_allied_corsairs(ALGIERS_HARBOR) +
		count_allied_corsairs(TRIPOLI_HARBOR) +
		count_allied_corsairs(TUNIS_HARBOR);
	return game.tr.core.includes(YUSUF_QARAMANLI) && n > 0;
}

function can_play_murad_reis_breaks_out() {
	return game.tr.core.includes(MURAD_REIS_BREAKS_OUT);
}

function can_play_constantinople_sends_aid() {
	return game.tr.core.includes(CONSTANTINOPLE_SENDS_AID) && game.derne_captured;
}

function can_build_gunboat_in_malta() {
	return count_pieces(US_GUNBOATS, UNITED_STATES_SUPPLY) > 0;
}

function can_build_corsair_in_tripoli() {
	return count_pieces(TR_CORSAIRS, TRIPOLITAN_SUPPLY) > 0;
}

function can_pirate_raid_from_tripoli() {
	return count_pieces(TR_CORSAIRS, TRIPOLI_HARBOR) > 0;
}

function start_of_year() {
	log("");
	log("Start of " + game.year + ".");

	move_all_pieces(US_FRIGATES, TRACK_YEAR[game.year], GIBRALTAR_HARBOR);
	move_all_pieces(TR_FRIGATES, TRACK_YEAR[game.year], TRIPOLI_HARBOR);

	if (game.year <= 1804) {
		draw_cards(game.us.hand, game.us.deck, 6);
		draw_cards(game.tr.hand, game.tr.deck, 6);
	}
	if (game.year == 1805) {
		reshuffle_discard(game.us.deck, game.us.discard);
		draw_cards(game.us.hand, game.us.deck, 6);
		reshuffle_discard(game.tr.deck, game.tr.discard);
		draw_cards(game.tr.hand, game.tr.deck, 6);
	}
	if (game.year == 1806) {
		draw_cards(game.us.hand, game.us.deck, game.us.deck.length);
		draw_cards(game.tr.hand, game.tr.deck, game.tr.deck.length);
	}

	// TODO: hand limit

	game.active = US;
	game.state = 'american_play';
}

function end_american_play() {
	game.active = TR;
	game.state = 'tripolitan_play';
}

function end_tripolitan_play() {
	end_of_season();
}

const SPRING = 0;
const SUMMER = 1;
const FALL = 2;
const WINTER = 3;

function end_of_season() {
	if (game.season == WINTER) {
		end_of_year();
	} else {
		++game.season;
		game.active = US;
		game.state = 'american_play';
	}
}

function end_of_year() {
	if (game.year == 1806) {
		game.result = 'Draw';
		game.victory = "The game ends in a draw.";
		game.state = 'game_over';
		return;
	}
	++game.year;
	start_of_year();
}

function can_play_american_event(c) {
	return false;
}

function can_play_tripolitan_event(c) {
	return false;
}

states.american_play = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "American play.";
		view.prompt = "American play.";
		if (can_play_thomas_jefferson())
			gen_action(view, 'card_event', THOMAS_JEFFERSON);
		if (can_play_swedish_frigates_arrive())
			gen_action(view, 'card_event', SWEDISH_FRIGATES_ARRIVE);
		if (can_play_hamets_army_created())
			gen_action(view, 'card_event', HAMETS_ARMY_CREATED);
		let build = can_build_gunboat_in_malta();
		for (let c of game.us.hand) {
			gen_action(view, 'card_move_frigates', c);
			if (build)
				gen_action(view, 'card_build_gunboat', c);
			if (can_play_american_event(c))
				gen_action(view, 'card_event', c);
		}
		if (game.us.hand.length == 0)
			gen_action(view, 'pass');
	},
	card_build_gunboat: function (c) {
		discard_card(game.us, c, " to build a gunboat in Malta");
		move_one_piece(US_GUNBOATS, UNITED_STATES_SUPPLY, MALTA_HARBOR);
		end_american_play();
	},
	card_move_frigates: function (c) {
		discard_card(game.us, c, " to move up to two frigates");
		goto_move_up_to_n_american_frigates(2);
	},
	pass: function () {
		log("");
		log(game.active + " passes.");
		end_american_play();
	}
}

states.tripolitan_play = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Tripolitan play.";
		view.prompt = "Tripolitan play.";
		if (can_play_yusuf_qaramanli())
			gen_action(view, 'card_event', YUSUF_QARAMANLI);
		if (can_play_murad_reis_breaks_out())
			gen_action(view, 'card_event', MURAD_REIS_BREAKS_OUT);
		if (can_play_constantinople_sends_aid())
			gen_action(view, 'card_event', CONSTANTINOPLE_SENDS_AID);
		let build = can_build_corsair_in_tripoli();
		let raid = can_pirate_raid_from_tripoli();
		console.log("tripolitan_play", build, raid);
		for (let c of game.tr.hand) {
			if (build)
				gen_action(view, 'card_build_corsair', c);
			if (raid)
				gen_action(view, 'card_pirate_raid', c);
			if (can_play_tripolitan_event(c))
				gen_action(view, 'card_event', c);
		}
		if (game.tr.hand.length == 0)
			gen_action(view, 'pass');
	},
	card_build_corsair: function (c) {
		discard_card(game.tr, c, " to build a Tripolitan corsair in Tripoli");
		move_one_piece(TR_CORSAIRS, TRIPOLITAN_SUPPLY, TRIPOLI_HARBOR);
		end_tripolitan_play();
	},
	card_pirate_raid: function (c) {
		discard_card(game.tr, c, " to Pirate Raid with the corsairs from Tripoli");
		end_tripolitan_play();
	},
	pass: function () {
		log("");
		log(game.active + " passes.");
		end_tripolitan_play();
	}
}

function goto_move_up_to_n_american_frigates(n) {
	game.moves = n;
	game.active = US;
	game.state = 'move_us_frigate_from';
	push_undo();
}

states.move_us_frigate_from = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "United States: Move up to " + game.moves + " frigates.";
		view.prompt = "United States: Move up to " + game.moves + " frigates."
		if (game.moves > 0) {
			view.prompt += " Select a frigate to move.";
			for (let s of FRIGATE_SPACES) {
				if (count_american_frigates(s) > 0)
					gen_action(view, 'space', s);
			}
		}
		gen_action(view, 'next');
		gen_action_undo(view);
	},
	space: function (space) {
		push_undo();
		game.from = space;
		game.state = 'move_us_frigate_to'
	},
	next: function () {
		// resolve naval battles
		// resolve bombardment
		end_american_play();
	},
	undo: pop_undo
}

states.move_us_frigate_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "United States: Move up to " + game.moves + " frigates.";
		view.prompt = "United States: Move up to " + game.moves + " frigates. Select a destation.";
		for (let s of FRIGATE_SPACES)
			if (s != game.from)
				gen_action(view, 'space', s);
		gen_action_undo(view);
	},
	space: function (space) {
		move_one_piece(US_FRIGATES, game.from, space);
		--game.moves;
		game.from = null;
		game.state = 'move_us_frigate_from'
	},
	undo: pop_undo
}

states.game_over = {
	prompt: function (view, current) {
		return view.prompt = game.victory;
	},
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
			core: [],
			hand: [],
			deck: [],
			discard: [],
		},
		tr: {
			core: [],
			hand: [],
			deck: [],
			discard: [],
			coins: 0,
		},
		derne_captured: 0,
		undo: [],
	};

	game.tr.core.push(YUSUF_QARAMANLI);
	game.tr.core.push(MURAD_REIS_BREAKS_OUT);
	game.tr.core.push(CONSTANTINOPLE_SENDS_AID);

	game.us.core.push(THOMAS_JEFFERSON);
	game.us.core.push(SWEDISH_FRIGATES_ARRIVE);
	game.us.core.push(HAMETS_ARMY_CREATED);

	for (let i = 4; i <= 27; ++i) {
		game.us.deck.push(i);
		game.tr.deck.push(i+27);
	}

	deploy("us_frigate_1", GIBRALTAR_HARBOR);
	deploy("us_frigate_2", GIBRALTAR_HARBOR);
	deploy("us_frigate_3", GIBRALTAR_HARBOR);
	deploy("us_frigate_4", TRACK_1802);
	deploy("us_frigate_5", TRACK_1803);
	deploy("us_frigate_6", TRACK_1804);
	deploy("us_frigate_7", UNITED_STATES_SUPPLY);
	deploy("us_frigate_8", UNITED_STATES_SUPPLY);

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
		deploy("tr_infantry_" + i, TRIPOLITAN_SUPPLY);

	start_of_year();
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
			core: game.tr.core,
			deck: game.tr.deck.length,
			discard: game.tr.discard.length,
			hand: game.tr.hand.length,
			coins: game.tr.coins,
		},
		us: {
			core: game.us.core,
			deck: game.us.deck.length,
			discard: game.us.discard.length,
			hand: game.us.hand.length,
		},
	};

	states[game.state].prompt(view, current);

	if (current == TR)
		view.hand = game.tr.hand;
	else if (current == US)
		view.hand = game.us.hand;
	else
		view.hand = [];

	return view;
}
