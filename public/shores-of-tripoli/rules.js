"use strict";
// Tribute Paid

// RULES QUESTIONS:

// A Show of Force -- can play with fewer than 3 available frigates?
// Burn the Philadelphia and others -- damaged frigates in 1806, to supply or virtual 1807 box?
// General Eaton Attacks Derne/Benghazi -- should American gunboats participate?
// Bainbridge Supplies Intel -- can you play it to pick up itself in order to pass without spending cards?
// Assault on Tripoli -- can you play if benghazi not captured and no send in the marines?

// Battle Card timing:

// us: before interception roll
// tr: after interception roll
// tr: before pirate raid
// tr: after pirate raid

// us: before naval battle
// tr: before naval battle
// us: before land battle
// tr: before land battle

// us: own reaction: burn the philadelphia
// us: own reaction: launch the intrepid
// us: own reaction: assault on tripoli
// tr: own reaction: philadelphia runs aground

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

const SPRING = 0;
const SUMMER = 1;
const FALL = 2;
const WINTER = 3;

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

const YEAR_TURN_TRACK = {
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

const BATTLE_SPACES = [
	ALEXANDRIA_HARBOR,
	ALGIERS_HARBOR,
	BENGHAZI_HARBOR,
	DERNE_HARBOR,
	TANGIER_HARBOR,
	TRIPOLI_HARBOR,
	TUNIS_HARBOR,
];

const PATROL_ZONES = [
	ALGIERS_PATROL_ZONE,
	GIBRALTAR_PATROL_ZONE,
	TANGIER_PATROL_ZONE,
	TRIPOLI_PATROL_ZONE,
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

const REMOVE_AFTER_PLAY = [
	THOMAS_JEFFERSON,
	SWEDISH_FRIGATES_ARRIVE,
	HAMETS_ARMY_CREATED,
	CONGRESS_AUTHORIZES_ACTION,
	CORSAIRS_CONFISCATED,
	BURN_THE_PHILADELPHIA,
	LAUNCH_THE_INTREPID,
	GENERAL_EATON_ATTACKS_DERNE,
	GENERAL_EATON_ATTACKS_BENGHAZI,
	LIEUTENANT_STERETT_IN_PURSUIT,
	PREBLES_BOYS_TAKE_AIM,
	THE_DARING_STEPHEN_DECATUR,
	SEND_IN_THE_MARINES,
	LIEUTENANT_OBANNON_LEADS_THE_CHARGE,
	MARINE_SHARPSHOOTERS,
	YUSUF_QARAMANLI,
	MURAD_REIS_BREAKS_OUT,
	CONSTANTINOPLE_SENDS_AID,
	SWEDEN_PAYS_TRIBUTE,
	TRIPOLI_ACQUIRES_CORSAIRS,
	THE_PHILADELPHIA_RUNS_AGROUND,
	ALGIERS_DECLARES_WAR,
	MOROCCO_DECLARES_WAR,
	TUNIS_DECLARES_WAR,
	US_SIGNAL_BOOKS_OVERBOARD,
	UNCHARTED_WATERS,
	MERCHANT_SHIP_CONVERTED,
	HAPPY_HUNTING,
	THE_GUNS_OF_TRIPOLI,
	MERCENARIES_DESERT,
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
	// log(game.active + " discards \"" + CARD_NAMES[card] + "\"" + reason + ".");
	log(game.active + " discards a card" + reason + ".");
	remove_from_array(player.hand, card);
	player.discard.push(card);
	game.active_card = game.active;
}

function play_card(player, card) {
	log("");
	log(game.active + " plays \"" + CARD_NAMES[card] + "\".");
	remove_from_array(player.core, card);
	remove_from_array(player.hand, card);
	if (!REMOVE_AFTER_PLAY.includes(card))
		player.discard.push(card);
	game.active_card = card;
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
}

function move_all_pieces(list, from, to) {
	for (let p of list) {
		if (game.location[p] == from) {
			game.location[p] = to;
		}
	}
}

function fire_2(what, n) {
	let hits = 0;
	for (let i = 0; i < n; ++i) {
		let a = roll_d6();
		let b = roll_d6();
		if (a == 6) ++hits;
		if (b == 6) ++hits;
		log(what + " fires " + a + ", " + b + ".");
	}
	return hits;
}

function fire_1(what, n) {
	let hits = 0;
	for (let i = 0; i < n; ++i) {
		let roll = roll_d6();
		if (roll == 6) ++hits;
		log(what + " fires " + roll + ".");
	}
	return hits;
}

function intercept(what, n) {
	let hits = 0;
	for (let i = 0; i < n; ++i) {
		let a = roll_d6();
		let b = roll_d6();
		if (a == 6) ++hits;
		if (b == 6) ++hits;
		log(what + " intercepts " + a + ", " + b + ".");
	}
	return hits;
}

function capture(what, n) {
	let hits = 0;
	for (let i = 0; i < n; ++i) {
		let roll = roll_d6();
		if (roll >= 5) ++hits;
		log(what + " captures " + roll + ".");
	}
	return hits;
}

function count_swedish_frigates(where) {
	return count_pieces(SE_FRIGATES, where);
}

function count_available_american_frigates(where) {
	let n = 0;
	for (let space of FRIGATE_SPACES)
		n += count_pieces(US_FRIGATES, space);
	return n;
}

function count_american_frigates(where) {
	return count_pieces(US_FRIGATES, where);
}

function count_american_gunboats(where) {
	return count_pieces(US_GUNBOATS, where);
}

function count_tripolitan_corsairs(where) {
	return count_pieces(TR_CORSAIRS, where);
}

function count_tripolitan_frigates(where) {
	return count_pieces(TR_FRIGATES, where);
}

function count_allied_corsairs(where) {
	return count_pieces(AL_CORSAIRS, where);
}

function count_tripolitan_infantry(where) {
	return count_pieces(TR_INFANTRY, where);
}

function count_american_marines(where) {
	return count_pieces(US_MARINES, where);
}

function count_arab_infantry(where) {
	return count_pieces(AR_INFANTRY, where);
}

function count_american_troops(where) {
	return count_american_marines(where) + count_arab_infantry(where);
}

function is_fall_of_1805_or_later() {
	return ((game.year == 1805 && game.season >= FALL) || (game.year > 1805));
}

function hamets_army_location() {
	if (count_american_troops(ALEXANDRIA_HARBOR) > 0) return ALEXANDRIA_HARBOR;
	if (count_american_troops(DERNE_HARBOR) > 0) return DERNE_HARBOR;
	if (count_american_troops(BENGHAZI_HARBOR) > 0) return BENGHAZI_HARBOR;
	return null;
}

function is_hamets_army_created() {
	return hamets_army_location() != null;
}

function is_derne_captured() {
	let space = hamets_army_location();
	return space == DERNE_HARBOR || space == BENGHAZI_HARBOR;
}

function is_benghazi_captured() {
	let space = hamets_army_location();
	return space == BENGHAZI_HARBOR;
}

function is_naval_battle_location(space) {
	let n_us = count_american_frigates(space);
	let n_tr = count_tripolitan_corsairs(space) + count_allied_corsairs(space);
	return (n_us > 0 && n_tr > 0);
}

function is_naval_bombardment_location(space) {
	let n_us = count_american_frigates(space);
	let n_tr = count_tripolitan_infantry(space);
	return (n_us > 0 && n_tr > 0);
}

function is_naval_battle_or_bombardment_location(space) {
	let n_us = count_american_frigates(space);
	let n_tr_ships = count_tripolitan_corsairs(space) + count_allied_corsairs(space);
	let n_tr_infantry = count_tripolitan_infantry(space);
	return (n_us > 0 && (n_tr_ships > 0 || n_tr_infantry > 0));
}

function count_naval_battle_or_bombardment_locations() {
	let n = 0;
	for (let space of BATTLE_SPACES)
		if (is_naval_battle_or_bombardment_location(space))
			++n;
	return n;
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

	game.season = SPRING;

	move_all_pieces(US_FRIGATES, YEAR_TURN_TRACK[game.year], GIBRALTAR_HARBOR);
	move_all_pieces(TR_FRIGATES, YEAR_TURN_TRACK[game.year], TRIPOLI_HARBOR);

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

	goto_american_discard();
}

function goto_american_discard() {
	if (game.us.hand.length > 8) {
		game.active = US;
		game.state = 'american_discard';
	} else {
		goto_tripolitan_discard();
	}
}

function goto_tripolitan_discard() {
	if (game.tr.hand.length > 8) {
		game.active = TR;
		game.state = 'tripolitan_discard';
	} else {
		goto_american_play();
	}
}

function goto_american_play() {
	game.active = US;
	game.state = 'american_play';
}

states.american_discard = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "American hand limit.";
		view.prompt = "American hand limit: discard down to eight cards in hand.";
		gen_action_undo(view);
		if (game.us.hand.length > 8) {
			for (let c of game.us.hand)
				gen_action(view, 'discard', c);
		} else {
			gen_action(view, 'next');
		}
	},
	discard: function (card) {
		push_undo();
		remove_from_array(game.us.hand, card);
		game.us.discard.push(card);
	},
	next: function () {
		clear_undo();
		goto_tripolitan_discard();
	},
	undo: pop_undo
}

states.tripolitan_discard = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Tripolitan hand limit.";
		view.prompt = "Tripolitan hand limit: discard down to eight cards in hand.";
		gen_action_undo(view);
		if (game.tr.hand.length > 8) {
			for (let c of game.tr.hand)
				gen_action(view, 'discard', c);
		} else {
			gen_action(view, 'next');
		}
	},
	discard: function (card) {
		push_undo();
		remove_from_array(game.tr.hand, card);
		game.tr.discard.push(card);
	},
	next: function () {
		clear_undo();
		goto_american_play();
	},
	undo: pop_undo
}

function end_american_play() {
	clear_undo();
	game.where = null;
	game.active = TR;
	game.state = 'tripolitan_play';
}

function end_tripolitan_play() {
	clear_undo();
	game.where = null;
	end_of_season();
}

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
	if (game.year == 1806)
		return goto_game_over("Draw", "The game ends in a draw.");
	++game.year;
	start_of_year();
}

states.american_play = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "American play.";
		view.prompt = "American play.";
		let build = can_build_gunboat_in_malta();
		for (let c of game.us.core) {
			if (can_play_american_event(c))
				gen_action(view, 'card_event', c);
		}
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
	card_event: play_american_event,
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
		let build = can_build_corsair_in_tripoli();
		let raid = can_pirate_raid_from_tripoli();
		for (let c of game.tr.core) {
			if (can_play_tripolitan_event(c))
				gen_action(view, 'card_event', c);
		}
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
		goto_pirate_raid(TRIPOLI_HARBOR, TRIPOLI_PATROL_ZONE);
	},
	card_event: play_tripolitan_event,
	pass: function () {
		log("");
		log(game.active + " passes.");
		end_tripolitan_play();
	}
}

// PIRATE RAID

function give_gold(n) {
	game.tr.gold += n;
	if (game.tr.gold > 12)
		game.tr.gold = 12;
}

function take_gold(n) {
	game.tr.gold -= n;
	if (game.tr.gold < 0)
		game.tr.gold = 0;
}

function goto_pirate_raid(harbor, patrol_zone) {
	game.where = patrol_zone;

	interception_roll(harbor, patrol_zone);

	let hits = 0;
	hits += capture("Tripolitan corsair", count_tripolitan_corsairs(harbor));
	hits += capture("Allied corsair", count_allied_corsairs(harbor));
	log(hits + " merchant ships captured.");

	give_gold(hits);
	if (check_gold_victory())
		return;

	if (game.raids)
		resume_yusuf_qaramanli();
	else
		end_tripolitan_play();
}

function interception_roll(harbor, patrol_zone) {
	let n_se = count_swedish_frigates(patrol_zone);
	let n_us = count_american_frigates(patrol_zone);
	let n_tr = count_tripolitan_corsairs(harbor);
	let n_al = count_allied_corsairs(harbor);
	let hits = 0;
	hits += intercept("Swedish frigate", n_se);
	hits += intercept("American frigate", n_us);
	if (hits > n_tr + n_al)
		hits = n_tr + n_al;
	log(hits + " corsairs sink.");
	if (n_tr > 0)
		for (let i = 0; i < hits; ++i)
			move_one_piece(TR_CORSAIRS, harbor, TRIPOLITAN_SUPPLY);
	else
		for (let i = 0; i < hits; ++i)
			move_one_piece(AL_CORSAIRS, harbor, TRIPOLITAN_SUPPLY);
}

// AMERICAN NAVAL MOVEMENT
// TODO: click 'from' location to go back to selecting source?
// TODO: select multiple frigates then destination?

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
			for (let space of FRIGATE_SPACES) {
				if (count_american_frigates(space) > 0)
					gen_action(view, 'space', space);
			}
		}
		gen_action(view, 'next');
		gen_action_undo(view);
	},
	space: function (space) {
		push_undo();
		game.where = space;
		game.state = 'move_us_frigate_to'
	},
	next: function () {
		if (count_naval_battle_or_bombardment_locations() > 0)
			goto_allocate_gunboats();
		else
			end_american_play();
	},
	undo: pop_undo
}

states.move_us_frigate_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "United States: Move up to " + game.moves + " frigates.";
		view.prompt = "United States: Move up to " + game.moves + " frigates. Select a destination.";
		for (let space of FRIGATE_SPACES)
			if (space != game.where)
				gen_action(view, 'space', space);
		gen_action_undo(view);
	},
	space: function (space) {
		log(game.active + " moves a frigate from " + SPACES[game.where] + " to " + SPACES[space] + ".");
		move_one_piece(US_FRIGATES, game.where, space);
		--game.moves;
		game.where = null;
		game.state = 'move_us_frigate_from'
	},
	undo: pop_undo
}

function goto_allocate_gunboats() {
	if (count_american_gunboats(MALTA_HARBOR) == 0)
		return goto_select_combat();
	game.where = MALTA_HARBOR;
	game.state = 'allocate_gunboats';
}

states.allocate_gunboats = {
	prompt: function (view, current) {
		view.prompt = "United States: Allocate gunboats to battle locations.";
		if (is_inactive_player(current))
			return view.prompt;
		if (count_american_gunboats(MALTA_HARBOR) > 0) {
			for (let space of BATTLE_SPACES)
				if (is_naval_battle_or_bombardment_location(space))
					gen_action(view, 'space', space);
		}
		gen_action(view, 'next');
		gen_action_undo(view);
	},
	space: function (space) {
		push_undo();
		log(game.active + " moves a gunboat to " + SPACES[space] + ".");
		move_one_piece(US_GUNBOATS, MALTA_HARBOR, space);
	},
	next: function () {
		game.where = null;
		goto_select_combat();
	},
	undo: pop_undo
}

function goto_select_combat() {
	clear_undo();
	game.where = null;
	game.active = US;
	if (count_naval_battle_or_bombardment_locations() > 0)
		game.state = 'select_combat';
	else
		end_american_play();
}

states.select_combat = {
	prompt: function (view, current) {
		view.prompt = "United States: Pick the next naval combat or bombardment."
		if (is_inactive_player(current))
			return view.prompt;
		for (let space of BATTLE_SPACES)
			if (is_naval_battle_or_bombardment_location(space))
				gen_action(view, 'space', space);
	},
	space: function (space) {
		if (is_naval_battle_location(space))
			goto_naval_battle(space);
		else
			goto_naval_bombardment(space);
	},
}

// NAVAL BOMBARDMENT

function goto_naval_bombardment(space) {
	game.where = space;
	log("Naval bombardment in " + SPACES[game.where] + ".");
	naval_bombardment_round();
	end_naval_bombardment();
}

function naval_bombardment_round() {
	let n_frigates = count_american_frigates(game.where);
	let n_gunboats = count_american_gunboats(game.where);
	let n_infantry = count_tripolitan_infantry(game.where);

	let n_hits = 0;
	n_hits += fire_2("American frigate", n_frigates);
	n_hits += fire_1("American gunboat", n_gunboats);
	if (n_hits > n_infantry)
		n_hits = n_infantry;

	log(n_hits + " Tripolitan infantry eliminated.");
	for (let i = 0; i < n_hits; ++i)
		move_one_piece(TR_INFANTRY, game.where, TRIPOLITAN_SUPPLY);
}

function end_naval_bombardment() {
	move_all_pieces(US_FRIGATES, game.where, MALTA_HARBOR);
	move_all_pieces(US_GUNBOATS, game.where, MALTA_HARBOR);
	goto_select_combat();
}

// NAVAL BATTLE

function goto_naval_battle(space) {
	game.where = space;
	log("Naval battle in " + SPACES[game.where] + ".");
	// TODO: battle cards
	naval_battle_round();
}

function naval_battle_round() {
	let n_us_frigates = count_american_frigates(game.where);
	let n_us_gunboats = count_american_gunboats(game.where);
	let us_hitpoints = n_us_frigates * 2 + n_us_gunboats;
	let n_tr_frigates = count_tripolitan_frigates(game.where);
	let n_tr_corsairs = count_tripolitan_corsairs(game.where);
	let n_al_corsairs = count_allied_corsairs(game.where);
	let tr_hitpoints = n_tr_frigates * 2 + n_tr_corsairs + n_al_corsairs;

	game.n_tr_hits = 0;
	game.n_tr_hits += fire_2("American frigate", n_us_frigates);
	game.n_tr_hits += fire_1("American gunboat", n_us_gunboats);
	if (game.n_tr_hits > tr_hitpoints)
		game.n_tr_hits = tr_hitpoints;

	game.n_us_hits = 0;
	game.n_us_hits += fire_2("Tripolitan frigate", n_tr_frigates);
	game.n_us_hits += fire_1("Tripolitan corsair", n_tr_corsairs);
	game.n_us_hits += fire_1("Allied corsair", n_al_corsairs);
	if (game.n_us_hits > us_hitpoints)
		game.n_us_hits = us_hitpoints;

	if (game.active == US)
		goto_allocate_american_hits();
	else
		goto_allocate_tripolitan_hits();
}

function goto_allocate_american_hits() {
	if (game.n_us_hits > 0) {
		game.active = US;
		game.state = 'allocate_us_hits';
	} else if (game.n_tr_hits > 0) {
		game.active = TR;
		game.state = 'allocate_tr_hits';
	} else {
		end_naval_battle();
	}
}

function goto_allocate_tripolitan_hits() {
	if (game.n_tr_hits > 0) {
		game.active = TR;
		game.state = 'allocate_tr_hits';
	} else if (game.n_us_hits > 0) {
		game.active = US;
		game.state = 'allocate_us_hits';
	} else {
		end_naval_battle();
	}
}

states.allocate_us_hits = {
	prompt: function (view, current) {
		view.prompt = "United States: Allocate " + game.n_us_hits + " hits in " + SPACES[game.where] + ".";
		if (is_inactive_player(current))
			return view.prompt;
		gen_action_undo(view);
		if (game.n_us_hits > 0) {
			for (let p of US_FRIGATES)
				if (game.location[p] == game.where)
					gen_action(view, 'piece', p);
			for (let p of US_GUNBOATS)
				if (game.location[p] == game.where)
					gen_action(view, 'piece', p);
		} else {
			gen_action(view, 'next');
		}
	},
	piece: function (p) {
		push_undo();
		--game.n_us_hits;
		if (US_FRIGATES.includes(p)) {
			if (game.damaged.includes(p)) {
				log("American frigate sinks!");
				game.location[p] = TRIPOLITAN_SUPPLY;
				remove_from_array(game.damaged, p);
			} else {
				log("American frigate is damaged.");
				game.damaged.push(p);
			}
		}
		if (US_GUNBOATS.includes(p)) {
			log("American gunboat sinks.");
			move_one_piece(US_GUNBOATS, game.where, UNITED_STATES_SUPPLY);
		}
	},
	next: function () {
		clear_undo();
		if (check_frigate_victory())
			return;
		if (game.n_tr_hits > 0) {
			game.active = TR;
			game.state = 'allocate_tr_hits';
		} else {
			end_naval_battle();
		}
	},
	undo: pop_undo
}

states.allocate_tr_hits = {
	prompt: function (view, current) {
		view.prompt = "Tripolitania: Allocate " + game.n_tr_hits + " hits in " + SPACES[game.where] + ".";
		if (is_inactive_player(current))
			return view.prompt;
		gen_action_undo(view);
		if (game.n_tr_hits > 0) {
			for (let p of TR_FRIGATES)
				if (game.location[p] == game.where)
					gen_action(view, 'piece', p);
			for (let p of TR_CORSAIRS)
				if (game.location[p] == game.where)
					gen_action(view, 'piece', p);
			for (let p of AL_CORSAIRS)
				if (game.location[p] == game.where)
					gen_action(view, 'piece', p);
		} else {
			gen_action(view, 'next');
		}
	},
	piece: function (p) {
		push_undo();
		--game.n_tr_hits;
		if (TR_FRIGATES.includes(p)) {
			if (game.damaged.includes(p)) {
				log("Tripolitan frigate sinks!");
				game.location[p] = TRIPOLITAN_SUPPLY;
				remove_from_array(game.damaged, p);
			} else {
				log("Tripolitan frigate is damaged.");
				game.damaged.push(p);
			}
		}
		if (TR_CORSAIRS.includes(p)) {
			log("Tripolitan corsair sinks.");
			move_one_piece(TR_CORSAIRS, game.where, TRIPOLITAN_SUPPLY);
		}
		if (AL_CORSAIRS.includes(p)) {
			log("Allied corsair sinks.");
			move_one_piece(TR_CORSAIRS, game.where, TRIPOLITAN_SUPPLY);
		}
	},
	next: function () {
		clear_undo();
		if (game.n_us_hits > 0) {
			game.active = US;
			game.state = 'allocate_us_hits';
		} else {
			end_naval_battle();
		}
	},
	undo: pop_undo
}

function move_damaged_frigate_to_year_track(p, supply) {
	if (game.year == 1806)
		game.location[p] = supply;
	else
		game.location[p] = YEAR_TURN_TRACK[game.year + 1];
	remove_from_array(game.damaged, p);
}

function remove_damaged_frigates() {
	for (let p of US_FRIGATES)
		if (game.damaged.includes(p))
			move_damaged_frigate_to_year_track(p, UNITED_STATES_SUPPLY);
	for (let p of TR_FRIGATES)
		if (game.damaged.includes(p))
			move_damaged_frigate_to_year_track(p, TRIPOLITAN_SUPPLY);
}

function end_naval_battle() {
	remove_damaged_frigates()

	move_all_pieces(US_FRIGATES, game.where, MALTA_HARBOR);
	move_all_pieces(US_GUNBOATS, game.where, MALTA_HARBOR);

	if (game.where == TRIPOLI_PATROL_ZONE) {
		move_all_pieces(TR_FRIGATES, game.where, TRIPOLI_HARBOR);
		move_all_pieces(TR_CORSAIRS, game.where, TRIPOLI_HARBOR);
	}

	switch (game.active_card) {
	case ASSAULT_ON_TRIPOLI:
		// TODO
		break;
	case TRIPOLI_ATTACKS:
	case ALGIERS_DECLARES_WAR:
	case MOROCCO_DECLARES_WAR:
	case TUNIS_DECLARES_WAR:
		end_tripolitan_play();
		break;
	default:
		goto_select_combat();
		break;
	}
}

// GROUND COMBAT

states.ground_combat_move_frigates = {
	prompt: function (view, current) {
		view.prompt = "United States: " + CARD_NAMES[game.active_card] + ".";
		if (is_inactive_player(current))
			return view.prompt;
		view.prompt += " Move up to " + game.moves + " frigates to " + SPACES[game.where] + ".";
		gen_action_undo(view);
		gen_action(view, 'next');
		if (game.moves > 0) {
			for (let space of FRIGATE_SPACES)
				if (space != game.where)
					if (count_american_frigates(space) > 0)
						gen_action(view, 'space', space);
		}
	},
	space: function (space) {
		push_undo();
		--game.moves;
		move_one_piece(US_FRIGATES, space, game.where);
	},
	next: function () {
		let n = count_american_frigates(game.where);
		log(n + " American frigates move to " + SPACES[game.where] + ".");
		goto_ground_combat_bombard();
	},
	undo: pop_undo
}

function goto_ground_combat_bombard() {
	naval_bombardment_round();
	// TODO: play battle events
	goto_ground_combat_round();
}

function apply_tr_hits(n) {
	let max = count_tripolitan_infantry(game.where);
	if (n > max)
		n = max;
	log(n + " Tripolitan infantry eliminated.");
	for (let i = 0; i < n; ++i)
		move_one_piece(TR_INFANTRY, game.where, TRIPOLITAN_SUPPLY);
}

function apply_us_hits(total) {
	// TODO: let the player choose victims?

	let n = total;
	let max_ar = count_arab_infantry(game.where);
	if (n > max_ar)
		n = max_ar;
	log(n + " Arab infantry eliminated.");
	for (let i = 0; i < n; ++i)
		move_one_piece(AR_INFANTRY, game.where, UNITED_STATES_SUPPLY);

	n = total - n;
	let max_us = count_american_marines(game.where);
	if (n > max_us)
		n = max_us;
	log(n + " American marines eliminated.");
	for (let i = 0; i < n; ++i)
		move_one_piece(US_MARINES, game.where, UNITED_STATES_SUPPLY);
}

function goto_ground_combat_round() {
	for (;;) {
		let n_us_mar = count_american_marines(game.where);
		let n_ar_inf = count_arab_infantry(game.where);
		let n_tr_inf = count_tripolitan_infantry(game.where);

		if (n_us_mar + n_ar_inf == 0)
			return goto_game_over("Tripolitania wins by eliminating Hamet's army!");

		if (n_tr_inf == 0) {
			log("Americans have captured " + SPACES[game.where] + ".");
			return end_american_play();
		}

		log("Ground battle round.");

		let n_tr_hits = 0;
		n_tr_hits += fire_1("American marine", n_us_mar);
		n_tr_hits += fire_1("Arab infantry", n_ar_inf);

		let n_us_hits = fire_1("Tripolitan infantry", n_tr_inf);

		apply_tr_hits(n_tr_hits);
		apply_us_hits(n_us_hits);
	}
}

// ASSAULT ON TRIPOLI

states.assault_on_tripoli = {
	prompt: function (view, current) {
		view.prompt = "United States: Assault on Tripoli.";
		if (is_inactive_player(current))
			return view.prompt;
		// TODO: assault on tripoli
	},
	// TODO: battle event -- Send in the Marines
}

// TRIPOLITAN EVENTS

function can_play_tripolitan_event(card) {
	switch (card) {
	case YUSUF_QARAMANLI: return can_play_yusuf_qaramanli();
	case MURAD_REIS_BREAKS_OUT: return can_play_murad_reis_breaks_out();
	case CONSTANTINOPLE_SENDS_AID: return can_play_constantinople_sends_aid();
	case US_SUPPLIES_RUN_LOW: return can_play_us_supplies_run_low();
	case ALGERINE_CORSAIRS_RAID_1: return can_play_algerine_corsairs_raid();
	case ALGERINE_CORSAIRS_RAID_2: return can_play_algerine_corsairs_raid();
	case MOROCCAN_CORSAIRS_RAID_1: return can_play_moroccan_corsairs_raid();
	case MOROCCAN_CORSAIRS_RAID_2: return can_play_moroccan_corsairs_raid();
	case TUNISIAN_CORSAIRS_RAID_1: return can_play_tunisian_corsairs_raid();
	case TUNISIAN_CORSAIRS_RAID_2: return can_play_tunisian_corsairs_raid();
	case TROOPS_TO_DERNE: return can_play_troops_to_derne();
	case TROOPS_TO_BENGHAZI: return can_play_troops_to_benghazi();
	case TROOPS_TO_TRIPOLI: return can_play_troops_to_tripoli();
	case STORMS: return can_play_storms();
	case TRIPOLI_ATTACKS: return can_play_tripoli_attacks();
	case SWEDEN_PAYS_TRIBUTE: return can_play_sweden_pays_tribute();
	case TRIPOLI_ACQUIRES_CORSAIRS: return can_play_tripoli_acquires_corsairs();
	case THE_PHILADELPHIA_RUNS_AGROUND: return can_play_the_philadelphia_runs_aground();
	case ALGIERS_DECLARES_WAR: return can_play_algiers_declares_war();
	case MOROCCO_DECLARES_WAR: return can_play_morocco_declares_war();
	case TUNIS_DECLARES_WAR: return can_play_tunis_declares_war();
	}
	return false;
}

function play_tripolitan_event(card) {
	play_card(game.tr, card);
	switch (card) {
	case YUSUF_QARAMANLI: return play_yusuf_qaramanli();
	case MURAD_REIS_BREAKS_OUT: return play_murad_reis_breaks_out();
	case CONSTANTINOPLE_SENDS_AID: return play_constantinople_sends_aid();
	case US_SUPPLIES_RUN_LOW: return play_us_supplies_run_low();
	case ALGERINE_CORSAIRS_RAID_1: return play_algerine_corsairs_raid();
	case ALGERINE_CORSAIRS_RAID_2: return play_algerine_corsairs_raid();
	case MOROCCAN_CORSAIRS_RAID_1: return play_moroccan_corsairs_raid();
	case MOROCCAN_CORSAIRS_RAID_2: return play_moroccan_corsairs_raid();
	case TUNISIAN_CORSAIRS_RAID_1: return play_tunisian_corsairs_raid();
	case TUNISIAN_CORSAIRS_RAID_2: return play_tunisian_corsairs_raid();
	case TROOPS_TO_DERNE: return play_troops_to_derne();
	case TROOPS_TO_BENGHAZI: return play_troops_to_benghazi();
	case TROOPS_TO_TRIPOLI: return play_troops_to_tripoli();
	case STORMS: return play_storms();
	case TRIPOLI_ATTACKS: return play_tripoli_attacks();
	case SWEDEN_PAYS_TRIBUTE: return play_sweden_pays_tribute();
	case TRIPOLI_ACQUIRES_CORSAIRS: return play_tripoli_acquires_corsairs();
	case THE_PHILADELPHIA_RUNS_AGROUND: return play_the_philadelphia_runs_aground();
	case ALGIERS_DECLARES_WAR: return play_algiers_declares_war();
	case MOROCCO_DECLARES_WAR: return play_morocco_declares_war();
	case TUNIS_DECLARES_WAR: return play_tunis_declares_war();
	}
	throw Error(card + " is not a Tripolitan event card.");
}

function can_play_yusuf_qaramanli() {
	let n = count_allied_corsairs(ALGIERS_HARBOR) +
		count_allied_corsairs(TANGIER_HARBOR) +
		count_allied_corsairs(TUNIS_HARBOR) +
		count_tripolitan_corsairs(TRIPOLI_HARBOR);
	return n > 0;
}

function play_yusuf_qaramanli() {
	game.state = 'yusuf_qaramanli';
	game.raids = [];
	if (count_allied_corsairs(ALGIERS_HARBOR) > 0) game.raids.push(ALGIERS_HARBOR);
	if (count_allied_corsairs(TANGIER_HARBOR) > 0) game.raids.push(TANGIER_HARBOR);
	if (count_allied_corsairs(TUNIS_HARBOR) > 0) game.raids.push(TUNIS_HARBOR);
	if (count_tripolitan_corsairs(TRIPOLI_HARBOR) > 0) game.raids.push(TRIPOLI_HARBOR);
}

function resume_yusuf_qaramanli() {
	if (game.raids.length > 0)
		game.state = 'yusuf_qaramanli';
	else
		end_tripolitan_play();
}

states.yusuf_qaramanli = {
	prompt: function (view, current) {
		view.prompt = "Tripolitania: Yusuf Qaramanli.";
		if (is_inactive_player(current))
			return view.prompt;
		view.prompt += " Choose a harbor with corsairs to pirate raid from."
		for (let space of game.raids)
			gen_action(view, 'space', space);
		gen_action(view, 'next');
	},
	space: function (space) {
		log("Pirate Raid from " + SPACES[space] + ".");
		remove_from_array(game.raids, space);
		switch (space) {
		case ALGIERS_HARBOR: return goto_pirate_raid(ALGIERS_HARBOR, ALGIERS_PATROL_ZONE);
		case TANGIER_HARBOR: return goto_pirate_raid(TANGIER_HARBOR, TANGIER_PATROL_ZONE);
		case TUNIS_HARBOR: return goto_pirate_raid(TUNIS_HARBOR, TUNIS_PATROL_ZONE);
		case TRIPOLI_HARBOR: return goto_pirate_raid(TRIPOLI_HARBOR, TRIPOLI_PATROL_ZONE);
		}
	},
	next: function () {
		delete game.raids;
		end_tripolitan_play();
	}
}

function can_play_murad_reis_breaks_out() {
	return true;
}

function play_murad_reis_breaks_out() {
	log("Two Tripolitan corsairs move from Gibraltar Harbor to Tripoli Harbor.");
	move_all_pieces(TR_CORSAIRS, GIBRALTAR_HARBOR, TRIPOLI_HARBOR);
	end_tripolitan_play();
}

function can_play_constantinople_sends_aid() {
	return is_derne_captured();
}

function play_constantinople_sends_aid() {
	move_one_piece(TR_FRIGATES, TRIPOLITAN_SUPPLY, TRIPOLI_HARBOR);
	move_one_piece(TR_CORSAIRS, TRIPOLITAN_SUPPLY, TRIPOLI_HARBOR);
	move_one_piece(TR_CORSAIRS, TRIPOLITAN_SUPPLY, TRIPOLI_HARBOR);
	move_one_piece(TR_INFANTRY, TRIPOLITAN_SUPPLY, TRIPOLI_HARBOR);
	move_one_piece(TR_INFANTRY, TRIPOLITAN_SUPPLY, TRIPOLI_HARBOR);
	end_tripolitan_play();
}

function can_play_us_supplies_run_low() {
	for (let space of PATROL_ZONES)
		if (count_american_frigates(space) > 0)
			return true;
	return false;
}

function play_us_supplies_run_low() {
	game.state = 'us_supplies_run_low';
	game.where = MALTA_HARBOR;
}

states.us_supplies_run_low = {
	prompt: function (view, current) {
		view.prompt = "Tripolitania: US Supplies Run Low.";
		if (is_inactive_player(current))
			return view.prompt;
		view.prompt += " Move one American frigate to the harbor of Malta.";
		for (let space of PATROL_ZONES)
			if (count_american_frigates(space) > 0)
				gen_action(view, 'space', space);
	},
	space: function (space) {
		log("American frigate from " + SPACES[space] + " moved to Malta Harbor.");
		move_one_piece(US_FRIGATES, space, MALTA_HARBOR);
		end_tripolitan_play();
	},
}

function can_play_algerine_corsairs_raid() {
	return count_allied_corsairs(ALGIERS_HARBOR) > 0;
}

function can_play_moroccan_corsairs_raid() {
	return count_allied_corsairs(TANGIER_HARBOR) > 0;
}

function can_play_tunisian_corsairs_raid() {
	return count_allied_corsairs(TUNIS_HARBOR) > 0;
}

function play_algerine_corsairs_raid() {
	goto_pirate_raid(ALGIERS_HARBOR, ALGIERS_PATROL_ZONE);
}

function play_moroccan_corsairs_raid() {
	goto_pirate_raid(TANGIER_HARBOR, TANGIER_PATROL_ZONE);
}

function play_tunisian_corsairs_raid() {
	goto_pirate_raid(TUNIS_HARBOR, TUNIS_PATROL_ZONE);
}

function can_play_troops_to_derne() {
	return !is_derne_captured();
}

function can_play_troops_to_benghazi() {
	return !is_benghazi_captured();
}

function can_play_troops_to_tripoli() {
	return true;
}

function play_troops_to_derne() {
	log("Two Tripolitan infantry placed in Derne.");
	move_one_piece(TR_INFANTRY, TRIPOLITAN_SUPPLY, DERNE_HARBOR);
	move_one_piece(TR_INFANTRY, TRIPOLITAN_SUPPLY, DERNE_HARBOR);
	end_tripolitan_play();
}

function play_troops_to_benghazi() {
	log("Two Tripolitan infantry placed in Benghazi.");
	move_one_piece(TR_INFANTRY, TRIPOLITAN_SUPPLY, BENGHAZI_HARBOR);
	move_one_piece(TR_INFANTRY, TRIPOLITAN_SUPPLY, BENGHAZI_HARBOR);
	end_tripolitan_play();
}

function play_troops_to_tripoli() {
	log("Two Tripolitan infantry placed in Tripoli.");
	move_one_piece(TR_INFANTRY, TRIPOLITAN_SUPPLY, TRIPOLI_HARBOR);
	move_one_piece(TR_INFANTRY, TRIPOLITAN_SUPPLY, TRIPOLI_HARBOR);
	end_tripolitan_play();
}

function can_play_storms() {
	for (let space of PATROL_ZONES)
		if (count_american_frigates(space) > 0)
			return true;
	return false;
}

function play_storms() {
	game.state = 'storms';
}

states.storms = {
	prompt: function (view, current) {
		view.prompt = "Tripolitania: Storms.";
		if (is_inactive_player(current))
			return view.prompt;
		view.prompt += " Select a naval patrol zone.";
		for (let space of PATROL_ZONES)
			if (count_american_frigates(space) > 0)
				gen_action(view, 'space', space);
	},
	space: function (space) {
		let six = false;
		let n = count_american_frigates(space);
		for (let i = 0; i < n; ++i) {
			let roll = roll_d6();
			if (roll == 6) {
				if (!six) {
					log("Storm " + roll + ": American frigate sinks!");
					move_one_piece(US_FRIGATES, space, TRIPOLITAN_SUPPLY);
					six = true;
				} else {
					log("Storm " + roll + ": American frigate is damaged.");
					if (year == 1806)
						move_one_piece(US_FRIGATES, space, UNITED_STATES_SUPPLY);
					else
						move_one_piece(US_FRIGATES, space, YEAR_TURN_TRACK[game.year+1]);
				}
			} else {
				log("Storm " + roll + ": No effect.");
			}
		}
		if (check_frigate_victory())
			return;
		end_tripolitan_play();
	},
}

function can_play_tripoli_attacks() {
	let n = count_tripolitan_frigates(TRIPOLI_HARBOR) + count_tripolitan_corsairs(TRIPOLI_HARBOR);
	let m = count_american_frigates(TRIPOLI_PATROL_ZONE);
	return n > 0 && m > 0;
}

function play_tripoli_attacks() {
	move_all_pieces(TR_FRIGATES, TRIPOLI_HARBOR, TRIPOLI_PATROL_ZONE);
	move_all_pieces(TR_CORSAIRS, TRIPOLI_HARBOR, TRIPOLI_PATROL_ZONE);
	goto_naval_battle(TRIPOLI_PATROL_ZONE);
}

function can_play_sweden_pays_tribute() {
	return (game.year >= 1803) && (count_swedish_frigates(TRIPOLI_PATROL_ZONE) > 0);
}

function play_sweden_pays_tribute() {
	log("Swedish frigates removed.");
	move_all_pieces(SE_FRIGATES, TRIPOLI_PATROL_ZONE, UNITED_STATES_SUPPLY);
	log("Tripolitania receives two gold coins.");
	give_gold(2);
	if (check_gold_victory())
		return;
	end_tripolitan_play();
}

function can_play_tripoli_acquires_corsairs() {
	return count_tripolitan_corsairs(TRIPOLITAN_SUPPLY) > 0;
}

function play_tripoli_acquires_corsairs() {
	log("Tripolitan corsairs placed in the harbor of Tripoli.");
	move_one_piece(TR_CORSAIRS, TRIPOLITAN_SUPPLY, TRIPOLI_HARBOR);
	move_one_piece(TR_CORSAIRS, TRIPOLITAN_SUPPLY, TRIPOLI_HARBOR);
	end_tripolitan_play();
}

function can_play_the_philadelphia_runs_aground() {
	return count_american_frigates(TRIPOLI_PATROL_ZONE) > 0;
}

function play_the_philadelphia_runs_aground() {
	// TODO: battle event
	let roll = roll_d6();
	log("Tripolitania rolls " + roll + ".");
	switch (roll) {
	case 1: case 2:
		log("Minor damage. One frigate moved to Malta.");
		move_one_piece(US_FRIGATES, TRIPOLI_PATROL_ZONE, MALTA_HARBOR);
		break;
	case 3: case 4:
		log("Frigate sunk.");
		move_one_piece(US_FRIGATES, TRIPOLI_HARBOR, TRIPOLITAN_SUPPLY);
		break;
	case 5: case 6:
		log("Frigate captured.");
		move_one_piece(US_FRIGATES, TRIPOLI_HARBOR, TRIPOLITAN_SUPPLY);
		move_one_piece(TR_FRIGATES, TRIPOLITAN_SUPPLY, TRIPOLI_HARBOR);
		break;
	}
	if (check_frigate_victory())
		return;
	end_tripolitan_play();
}

function can_play_algiers_declares_war() {
	return true;
}

function can_play_morocco_declares_war() {
	return true;
}

function can_play_tunis_declares_war() {
	return true;
}

function play_algiers_declares_war() {
	play_ally_declares_war(ALGIERS_HARBOR);
}

function play_morocco_declares_war() {
	play_ally_declares_war(TANGIER_HARBOR);
}

function play_tunis_declares_war() {
	play_ally_declares_war(TUNIS_HARBOR);
}

function play_ally_declares_war(harbor) {
	move_one_piece(AL_CORSAIRS, TRIPOLITAN_SUPPLY, harbor);
	move_one_piece(AL_CORSAIRS, TRIPOLITAN_SUPPLY, harbor);
	move_one_piece(AL_CORSAIRS, TRIPOLITAN_SUPPLY, harbor);
	if (count_american_frigates(harbor) > 0)
		goto_naval_battle(harbor)
	else
		end_tripolitan_play();
}

// UNITED STATES EVENTS

function can_play_american_event(card) {
	switch (card) {
	case THOMAS_JEFFERSON: return can_play_thomas_jefferson();
	case SWEDISH_FRIGATES_ARRIVE: return can_play_swedish_frigates_arrive();
	case HAMETS_ARMY_CREATED: return can_play_hamets_army_created();
	case TREATY_OF_PEACE_AND_AMITY: return can_play_treaty_of_peace_and_amity();
	case ASSAULT_ON_TRIPOLI: return can_play_assault_on_tripoli();
	case NAVAL_MOVEMENT_1: return can_play_naval_movement();
	case NAVAL_MOVEMENT_2: return can_play_naval_movement();
	case NAVAL_MOVEMENT_3: return can_play_naval_movement();
	case NAVAL_MOVEMENT_4: return can_play_naval_movement();
	case EARLY_DEPLOYMENT: return can_play_early_deployment();
	case A_SHOW_OF_FORCE: return can_play_a_show_of_force();
	case TRIBUTE_PAID: return can_play_tribute_paid();
	case CONSTANTINOPLE_DEMANDS_TRIBUTE: return can_play_constantinople_demands_tribute();
	case HAMET_RECRUITS_BEDOUINS: return can_play_hamet_recruits_bedouins();
	case BAINBRIDGE_SUPPLIES_INTEL: return can_play_bainbridge_supplies_intel();
	case CONGRESS_AUTHORIZES_ACTION: return can_play_congress_authorizes_action();
	case CORSAIRS_CONFISCATED: return can_play_corsairs_confiscated();
	case BURN_THE_PHILADELPHIA: return can_play_burn_the_philadelphia();
	case LAUNCH_THE_INTREPID: return can_play_launch_the_intrepid();
	case GENERAL_EATON_ATTACKS_DERNE: return can_play_general_eaton_attacks_derne();
	case GENERAL_EATON_ATTACKS_BENGHAZI: return can_play_general_eaton_attacks_benghazi();
	}
	return false;
}

function play_american_event(card) {
	play_card(game.us, card);
	switch (card) {
	case THOMAS_JEFFERSON: return play_thomas_jefferson();
	case SWEDISH_FRIGATES_ARRIVE: return play_swedish_frigates_arrive();
	case HAMETS_ARMY_CREATED: return play_hamets_army_created();
	case TREATY_OF_PEACE_AND_AMITY: return play_treaty_of_peace_and_amity();
	case ASSAULT_ON_TRIPOLI: return play_assault_on_tripoli();
	case NAVAL_MOVEMENT_1: return play_naval_movement();
	case NAVAL_MOVEMENT_2: return play_naval_movement();
	case NAVAL_MOVEMENT_3: return play_naval_movement();
	case NAVAL_MOVEMENT_4: return play_naval_movement();
	case EARLY_DEPLOYMENT: return play_early_deployment();
	case A_SHOW_OF_FORCE: return play_a_show_of_force();
	case TRIBUTE_PAID: return play_tribute_paid();
	case CONSTANTINOPLE_DEMANDS_TRIBUTE: return play_constantinople_demands_tribute();
	case HAMET_RECRUITS_BEDOUINS: return play_hamet_recruits_bedouins();
	case BAINBRIDGE_SUPPLIES_INTEL: return play_bainbridge_supplies_intel();
	case CONGRESS_AUTHORIZES_ACTION: return play_congress_authorizes_action();
	case CORSAIRS_CONFISCATED: return play_corsairs_confiscated();
	case BURN_THE_PHILADELPHIA: return play_burn_the_philadelphia();
	case LAUNCH_THE_INTREPID: return play_launch_the_intrepid();
	case GENERAL_EATON_ATTACKS_DERNE: return play_general_eaton_attacks_derne();
	case GENERAL_EATON_ATTACKS_BENGHAZI: return play_general_eaton_attacks_benghazi();
	}
	throw Error(card + " is not an American event card.");
}

function can_play_thomas_jefferson() {
	return true;
}

function play_thomas_jefferson() {
	goto_move_up_to_n_american_frigates(8);
}

function can_play_swedish_frigates_arrive() {
	return true;
}

function play_swedish_frigates_arrive() {
	move_all_pieces(SE_FRIGATES, UNITED_STATES_SUPPLY, TRIPOLI_PATROL_ZONE);
	end_american_play();
}

function can_play_hamets_army_created() {
	return (count_american_frigates(ALEXANDRIA_HARBOR) > 0) && (game.year >= 1804);
}

function play_hamets_army_created() {
	move_one_piece(US_MARINES, UNITED_STATES_SUPPLY, ALEXANDRIA_HARBOR);
	move_one_piece(AR_INFANTRY, UNITED_STATES_SUPPLY, ALEXANDRIA_HARBOR);
	move_one_piece(AR_INFANTRY, UNITED_STATES_SUPPLY, ALEXANDRIA_HARBOR);
	move_one_piece(AR_INFANTRY, UNITED_STATES_SUPPLY, ALEXANDRIA_HARBOR);
	move_one_piece(AR_INFANTRY, UNITED_STATES_SUPPLY, ALEXANDRIA_HARBOR);
	move_one_piece(AR_INFANTRY, UNITED_STATES_SUPPLY, ALEXANDRIA_HARBOR);
	end_american_play();
}

function can_play_treaty_of_peace_and_amity() {
	return is_fall_of_1805_or_later() &&
		(count_allied_corsairs(ALGIERS_HARBOR) == 0) &&
		(count_allied_corsairs(TANGIER_HARBOR) == 0) &&
		(count_allied_corsairs(TUNIS_HARBOR) == 0) &&
		(is_derne_captured()) &&
		(count_tripolitan_frigates(TRIPOLI_HARBOR) == 0);
}

function play_treaty_of_peace_and_amity() {
	goto_game_over(US, "United States win by playing Treaty of Peace and Amity!");
}

function can_play_assault_on_tripoli() {
	return is_fall_of_1805_or_later()
	// && (hamets_army_location() == BENGHAZI_HARBOR || game.us.hand.includes(SEND_IN_THE_MARINES));
}

function play_assault_on_tripoli() {
	if (hamets_army_location() == BENGHAZI_HARBOR) {
		move_all_pieces(US_MARINES, BENGHAZI_HARBOR, TRIPOLI_HARBOR);
		move_all_pieces(AR_INFANTRY, BENGHAZI_HARBOR, TRIPOLI_HARBOR);
	} else {
		// force play of SEND_IN_THE_MARINES?
	}
	move_all_pieces(US_GUNBOATS, MALTA_HARBOR, TRIPOLI_HARBOR);
	for (let space of FRIGATE_SPACES)
		if (space != TRIPOLI_HARBOR)
			move_all_pieces(US_FRIGATES, space, TRIPOLI_HARBOR);
	game.state = 'assault_on_tripoli';
}

function can_play_naval_movement() {
	return true;
}

function play_naval_movement() {
	goto_move_up_to_n_american_frigates(4);
}

function can_play_early_deployment() {
	if (game.year < 1806)
		return count_american_frigates(YEAR_TURN_TRACK[game.year+1]) > 0;
	return false;
}

function play_early_deployment() {
	game.state = 'early_deployment';
}

states.early_deployment = {
	prompt: function (view, current) {
		view.prompt = "United States: Early Deployment.";
		if (is_inactive_player(current))
			return;
		for (let space of PATROL_ZONES)
			gen_action(view, 'space', space);
	},
	space: function (space) {
		log(game.active + " places frigate in " + SPACES[space] + ".");
		move_one_piece(US_FRIGATES, YEAR_TURN_TRACK[game.year+1], space);
		end_american_play();
	},
}

function can_play_a_show_of_force() {
	if (count_available_american_frigates() < 3)
		return false;
	if (count_allied_corsairs(ALGIERS_HARBOR) > 0) return true;
	if (count_allied_corsairs(TANGIER_HARBOR) > 0) return true;
	if (count_allied_corsairs(TUNIS_HARBOR) > 0) return true;
	return false;
}

function play_a_show_of_force() {
	game.state = 'a_show_of_force_where';
}

states.a_show_of_force_where = {
	prompt: function (view, current) {
		view.prompt = "United States: A Show of Force.";
		if (is_inactive_player(current))
			return;
		view.prompt += " Select an active ally of Tripoli.";
		if (count_allied_corsairs(ALGIERS_HARBOR) > 0)
			gen_action(view, 'space', ALGIERS_HARBOR);
		if (count_allied_corsairs(TANGIER_HARBOR) > 0)
			gen_action(view, 'space', TANGIER_HARBOR);
		if (count_allied_corsairs(TUNIS_HARBOR) > 0)
			gen_action(view, 'space', TUNIS_HARBOR);
	},
	space: function (space) {
		push_undo();
		game.where = space;
		game.state = 'a_show_of_force_who';
	},
}

states.a_show_of_force_who = {
	prompt: function (view, current) {
		view.prompt = "United States: A Show of Force.";
		if (is_inactive_player(current))
			return;
		view.prompt += " Move 3 frigates to " + SPACES[game.where] + ".";
		gen_action_undo(view);
		if (count_american_frigates(game.where) == 3) {
			gen_action(view, 'next');
		} else {
			for (let space of FRIGATE_SPACES)
				if (space != game.where)
					if (count_american_frigates(space) > 0)
						gen_action(view, 'space', space);
		}
	},
	space: function (space) {
		push_undo();
		log(game.active + " moves a frigate from " + SPACES[space] + " to " + SPACES[game.where] + ".");
		move_one_piece(US_FRIGATES, space, game.where);
	},
	next: function () {
		clear_undo();
		log("All allied corsairs from " + SPACES[game.where] + " return to the supply.");
		move_all_pieces(AL_CORSAIRS, game.where, TRIPOLITAN_SUPPLY);
		end_american_play();
	},
	undo: pop_undo
}

function can_play_tribute_paid() {
	if (count_available_american_frigates() < 1) return false;
	if (count_allied_corsairs(ALGIERS_HARBOR) > 0) return true;
	if (count_allied_corsairs(TANGIER_HARBOR) > 0) return true;
	if (count_allied_corsairs(TUNIS_HARBOR) > 0) return true;
	return false;
}

function play_tribute_paid() {
	game.state = 'tribute_paid_where';
}

states.tribute_paid_where = {
	prompt: function (view, current) {
		view.prompt = "United States: Tribute Paid.";
		if (is_inactive_player(current))
			return;
		view.prompt += " Select an active ally of Tripoli.";
		if (count_allied_corsairs(ALGIERS_HARBOR) > 0)
			gen_action(view, 'space', ALGIERS_HARBOR);
		if (count_allied_corsairs(TANGIER_HARBOR) > 0)
			gen_action(view, 'space', TANGIER_HARBOR);
		if (count_allied_corsairs(TUNIS_HARBOR) > 0)
			gen_action(view, 'space', TUNIS_HARBOR);
	},
	space: function (space) {
		push_undo();
		game.where = space;
		game.state = 'tribute_paid_who';
	},
}

states.tribute_paid_who = {
	prompt: function (view, current) {
		view.prompt = "United States: Tribute Paid.";
		if (is_inactive_player(current))
			return;
		view.prompt += " Move a frigate to " + SPACES[game.where] + ".";
		gen_action_undo(view);
		if (count_american_frigates(game.where) == 1) {
			gen_action(view, 'next');
		} else {
			for (let space of FRIGATE_SPACES)
				if (space != game.where)
					if (count_american_frigates(space) > 0)
						gen_action(view, 'space', space);
		}
	},
	space: function (space) {
		push_undo();
		log(game.active + " moves a frigate from " + SPACES[space] + " to " + SPACES[game.where] + ".");
		move_one_piece(US_FRIGATES, space, game.where);
	},
	next: function () {
		clear_undo();
		log("All allied corsairs from " + SPACES[game.where] + " return to the supply.");
		move_all_pieces(AL_CORSAIRS, game.where, TRIPOLITAN_SUPPLY);
		log("Tripolitania receives two gold coins.");
		give_gold(2);
		if (check_gold_victory())
			return;
		end_american_play();
	},
	undo: pop_undo
}

function can_play_constantinople_demands_tribute() {
	return game.tr.gold > 0;
}

function play_constantinople_demands_tribute() {
	let n = Math.min(game.tr.gold, 2);
	log("Tripolitania returns " + n + " gold coins to the supply.");
	take_gold(n);
	end_american_play();
}

function can_play_hamet_recruits_bedouins() {
	return is_hamets_army_created();
}

function play_hamet_recruits_bedouins() {
	let space = hamets_army_location();
	log(game.active + " places two Arab infantry in " + SPACES[space] + ".");
	move_one_piece(AR_INFANTRY, UNITED_STATES_SUPPLY, space);
	move_one_piece(AR_INFANTRY, UNITED_STATES_SUPPLY, space);
	end_american_play();
}

function can_play_bainbridge_supplies_intel() {
	return game.us.discard.length > 0;
}

function play_bainbridge_supplies_intel() {
	game.state = 'bainbridge_supplies_intel';
}

states.bainbridge_supplies_intel = {
	prompt: function (view, current) {
		view.prompt = "United States: Bainbridge Supplies Intel.";
		if (is_inactive_player(current))
			return;
		view.prompt += " Select a card from your discard pile.";
		for (let c of game.us.discard) {
			if (c != BAINBRIDGE_SUPPLIES_INTEL) {
				gen_action(view, 'card_take', c);
				if (can_play_american_event(c))
					gen_action(view, 'card_event', c);
			}
		}
	},
	card_event: play_american_event,
	card_take: function (card) {
		remove_from_array(game.us.discard, card);
		game.us.hand.push(card);
		end_american_play();
	},
}

function can_play_congress_authorizes_action() {
	return game.year < 1806;
}

function play_congress_authorizes_action() {
	log("United States places two frigates on " + (game.year+1) + ".");
	move_one_piece(US_FRIGATES, UNITED_STATES_SUPPLY, YEAR_TURN_TRACK[game.year+1]);
	move_one_piece(US_FRIGATES, UNITED_STATES_SUPPLY, YEAR_TURN_TRACK[game.year+1]);
	end_american_play();
}

function can_play_corsairs_confiscated() {
	return count_tripolitan_corsairs(GIBRALTAR_HARBOR) > 0;
}

function play_corsairs_confiscated() {
	log("Tripolitan corsairs in Gibraltar Harbor returned to supply.");
	move_all_pieces(TR_CORSAIRS, GIBRALTAR_HARBOR, TRIPOLITAN_SUPPLY);
	log("\"Murad Reis Breaks Out\" card removed.");
	remove_from_array(game.tr.core, MURAD_REIS_BREAKS_OUT);
	end_american_play();
}

function can_play_burn_the_philadelphia() {
	return count_tripolitan_frigates(TRIPOLI_HARBOR) > 0;
}

function play_burn_the_philadelphia() {
	// TODO: battle event
	let roll = roll_d6();
	log("United States raids the harbor of Tripoli: " + roll + ".");
	switch (roll) {
	case 1: case 2:
		log("The raid is a failure.");
		break;
	case 3: case 4:
		log("A Tripolitan frigate is damaged.");
		if (game.year == 1806)
			move_one_piece(TR_FRIGATES, TRIPOLI_HARBOR, TRIPOLITAN_SUPPLY);
		else
			move_one_piece(TR_FRIGATES, TRIPOLI_HARBOR, YEAR_TURN_TRACK[game.year + 1]);
		break;
	case 5: case 6:
		log("A Tripolitan frigate is sunk.");
		move_one_piece(TR_FRIGATES, TRIPOLI_HARBOR, TRIPOLITAN_SUPPLY);
		break;
	}
	end_american_play();
}

function can_play_launch_the_intrepid() {
	let n = count_tripolitan_frigates(TRIPOLI_HARBOR) + count_tripolitan_corsairs(TRIPOLI_HARBOR);
	return n > 0;
}

function play_launch_the_intrepid() {
	// TODO: battle event
	let roll = roll_d6();
	log("United States raids the harbor of Tripoli: " + roll + ".");
	switch (roll) {
	case 1: case 2:
		log("The raid is a failure.");
		break;
	case 3: case 4:
		if (count_tripolitan_corsairs(TRIPOLI_HARBOR) > 0) {
			log("A Tripolitan corsair is sunk.");
			move_one_piece(TR_CORSAIRS, TRIPOLI_HARBOR, TRIPOLITAN_SUPPLY);
		} else {
			log("No corsairs to sink.");
		}
		break;
	case 5: case 6:
		if (count_tripolitan_frigates(TRIPOLI_HARBOR) > 0) {
			log("A Tripolitan frigate is sunk.");
			move_one_piece(TR_FRIGATES, TRIPOLI_HARBOR, TRIPOLITAN_SUPPLY);
		} else if (count_tripolitan_corsairs(TRIPOLI_HARBOR) > 1) {
			log("Two Tripolitan corsairs are sunk.");
			move_one_piece(TR_CORSAIRS, TRIPOLI_HARBOR, TRIPOLITAN_SUPPLY);
			move_one_piece(TR_CORSAIRS, TRIPOLI_HARBOR, TRIPOLITAN_SUPPLY);
		} else if (count_tripolitan_corsairs(TRIPOLI_HARBOR) > 0) {
			log("A Tripolitan corsair is sunk.");
			move_one_piece(TR_CORSAIRS, TRIPOLI_HARBOR, TRIPOLITAN_SUPPLY);
		} else {
			log("No corsairs to sink.");
		}
		break;
	}
	end_american_play();
}

function can_play_general_eaton_attacks_derne() {
	return hamets_army_location() == ALEXANDRIA_HARBOR;
}

function play_general_eaton_attacks_derne() {
	log("Hamet's Army attacks Derne.");
	move_all_pieces(US_MARINES, ALEXANDRIA_HARBOR, DERNE_HARBOR);
	move_all_pieces(AR_INFANTRY, ALEXANDRIA_HARBOR, DERNE_HARBOR);
	game.where = DERNE_HARBOR;
	game.moves = 3;
	game.state = 'ground_combat_move_frigates';
}

function can_play_general_eaton_attacks_benghazi() {
	return hamets_army_location() == DERNE_HARBOR;
}

function play_general_eaton_attacks_benghazi() {
	log("Hamet's Army attacks Benghazi.");
	move_all_pieces(US_MARINES, DERNE_HARBOR, BENGHAZI_HARBOR);
	move_all_pieces(AR_INFANTRY, DERNE_HARBOR, BENGHAZI_HARBOR);
	game.where = BENGHAZI_HARBOR;
	game.moves = 3;
	game.state = 'ground_combat_move_frigates';
}

// VICTORY

function check_gold_victory() {
	if (game.tr.gold >= 12)
		return goto_game_over(TR, "Tripolitania wins by acquiring twelve gold!");
	return false;
}

function check_frigate_victory() {
	if (count_american_frigates(TRIPOLITAN_SUPPLY) >= 4)
		return goto_game_over(TR, "Tripolitania wins by sinking four American frigates!");
	return false;
}

function goto_game_over(result, message) {
	log("");
	log(message);
	game.where = null;
	game.state = 'game_over';
	game.active = "None";
	game.result = result;
	game.victory = message;
	return true;
}

states.game_over = {
	prompt: function (view, current) {
		return view.prompt = game.victory;
	}
}

// SETUP

exports.setup = function (scenario, players) {
	if (players.length != 2)
		throw new Error("Invalid player count: " + players.length);
	game = {
		state: null,
		year: 1801,
		season: 0,
		log: [],
		location: [],
		damaged: [],
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
			gold: 0,
		},
		where: null,
		undo: [],
	};

	if (scenario)
		game.year = scenario;

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
		if (current == US)
			goto_game_over(TR, "United States resigned.");
		if (current == TR)
			goto_game_over(US, "Tripolitania resigned.");
	}
}

exports.view = function(state, current) {
	game = state;

	let view = {
		log: game.log,
		year: game.year,
		season: game.season,
		location: game.location,
		damaged: game.damaged,
		active: game.active,
		prompt: null,
		actions: null,
		tr: {
			core: game.tr.core,
			deck: game.tr.deck.length,
			discard: game.tr.discard.length,
			hand: game.tr.hand.length,
			gold: game.tr.gold,
		},
		us: {
			core: game.us.core,
			deck: game.us.deck.length,
			discard: game.us.discard.length,
			hand: game.us.hand.length,
		},
		card: game.active_card,
		where: game.where,
	};

	states[game.state].prompt(view, current);

	if (current == US && game.state == 'bainbridge_supplies_intel')
		view.hand = game.us.discard;
	else if (current == US)
		view.hand = game.us.hand;
	else if (current == TR)
		view.hand = game.tr.hand;
	else
		view.hand = [];

	return view;
}
