"use strict";

// TODO: auto-allocate corsair hits?
// TODO: don't auto-allocate gunboats?

const US = "United States";
const TR = "Tripolitania";

const { SPACES, PIECES, SEASONS } = require('./data');

exports.scenarios = [
	"Tournament",
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

const ALEXANDRIA = get_space_id("Alexandria");
const ALGIERS = get_space_id("Algiers");
const ALGIERS_PATROL_ZONE = get_space_id("Algiers Patrol Zone");
const BENGHAZI = get_space_id("Benghazi");
const DERNE = get_space_id("Derne");
const GIBRALTAR = get_space_id("Gibraltar");
const GIBRALTAR_PATROL_ZONE = get_space_id("Gibraltar Patrol Zone");
const MALTA = get_space_id("Malta");
const TANGIER = get_space_id("Tangier");
const TANGIER_PATROL_ZONE = get_space_id("Tangier Patrol Zone");
const TRIPOLI = get_space_id("Tripoli");
const TRIPOLI_PATROL_ZONE = get_space_id("Tripoli Patrol Zone");
const TUNIS = get_space_id("Tunis");
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
	ALEXANDRIA,
	ALGIERS,
	ALGIERS_PATROL_ZONE,
	BENGHAZI,
	DERNE,
	GIBRALTAR,
	GIBRALTAR_PATROL_ZONE,
	MALTA,
	TANGIER,
	TANGIER_PATROL_ZONE,
	TRIPOLI,
	TRIPOLI_PATROL_ZONE,
	TUNIS,
	TUNIS_PATROL_ZONE,
];

const BATTLE_SPACES = [
	ALGIERS,
	BENGHAZI,
	DERNE,
	TANGIER,
	TRIPOLI,
	TUNIS,
];

const PATROL_ZONES = [
	ALGIERS_PATROL_ZONE,
	GIBRALTAR_PATROL_ZONE,
	TANGIER_PATROL_ZONE,
	TRIPOLI_PATROL_ZONE,
	TUNIS_PATROL_ZONE,
];

const PATROL_ZONE_OF_HARBOR = {
	[ALGIERS]: ALGIERS_PATROL_ZONE,
	[GIBRALTAR]: GIBRALTAR_PATROL_ZONE,
	[TANGIER]: TANGIER_PATROL_ZONE,
	[TRIPOLI]: TRIPOLI_PATROL_ZONE,
	[TUNIS]: TUNIS_PATROL_ZONE,
}

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
	"Hamet\u{2019}s Army Created",
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
	"Preble\u{2019}s Boys Take Aim",
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
	YUSUF_QARAMANLI,
	MURAD_REIS_BREAKS_OUT,
	CONSTANTINOPLE_SENDS_AID,
	SWEDEN_PAYS_TRIBUTE,
	TRIPOLI_ACQUIRES_CORSAIRS,
	THE_PHILADELPHIA_RUNS_AGROUND,
	ALGIERS_DECLARES_WAR,
	MOROCCO_DECLARES_WAR,
	TUNIS_DECLARES_WAR,
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

function flush_summary(text, add_plural_s=false) {
	game.summary.sort();
	let last = game.summary[0];
	let n = 0;
	for (let entry of game.summary) {
		if (entry != last) {
			if (add_plural_s && n > 1)
				text += "\n" + n + " " + last + "s";
			else
				text += "\n" + n + " " + last;
			n = 0;
		}
		++n;
		last = entry;
	}
	if (add_plural_s && n > 1)
		text += "\n" + n + " " + last + "s";
	else if (n > 0)
		text += "\n" + n + " " + last;
	else
		text += "\n" + "none";
	log(text);
	delete game.summary;
}

function is_inactive_player(current) {
	return current == "Observer" || (game.active != current && game.active != "Both");
}

function you_may_play(current, list) {
	let msg = is_inactive_player(current) ? " \u2014 opponent may play " : " \u2014 you may play ";
	if (Array.isArray(list)) {
		list = list.map(c => "\u201c" + CARD_NAMES[c] + "\u201d");
		if (list.length == 1)
			msg += list[0] + ".";
		else if (list.length == 2)
			msg += list[0] + " or " + list[1] + ".";
		else {
			for (let i = 0; i < list.length-1; ++i)
				msg += list[i] + ", ";
			msg += "or " + list[list.length-1] + ".";
		}
	} else {
		msg += "\u201c" + CARD_NAMES[list] + "\u201d.";
	}
	return msg;
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

function reshuffle_discard(draw, discard) {
	while (discard.length > 0)
		draw.push(discard.pop());
}

function draw_cards(hand, draw, n) {
	for (let i = 0; i < n; ++i) {
		let c = Math.floor(Math.random() * draw.length);
		hand.push(draw[c]);
		draw.splice(c, 1);
	}
}

function discard_random_card(hand, discard) {
	let i = Math.floor(Math.random() * hand.length);
	let c = hand[i];
	discard.push(c);
	hand.splice(i, 1);
	return c;
}

function is_not_removed(card) {
	return game.us.hand.includes(card) ||
		game.us.draw.includes(card) ||
		game.us.discard.includes(card) ||
		game.tr.hand.includes(card) ||
		game.tr.draw.includes(card) ||
		game.tr.discard.includes(card);
}

function count_pieces(list, where) {
	let n = 0;
	for (let p of list)
		if (game.location[p] == where)
			++n;
	return n;
}

function discard_card(player, card, reason = "") {
	log(game.active + " discards a card" + reason + ".");
	remove_from_array(player.hand, card);
	player.discard.push(card);
	game.active_card = game.active;
}

function play_card(player, card) {
	log(game.active + " plays \u{201c}" + CARD_NAMES[card] + "\u{201d}.");
	remove_from_array(player.core, card);
	remove_from_array(player.hand, card);
	remove_from_array(player.discard, card);
	if (!REMOVE_AFTER_PLAY.includes(card))
		player.discard.push(card);
	game.active_card = card;
}

function play_battle_card(player, card) {
	log(game.active + " plays \u{201c}" + CARD_NAMES[card] + "\u{201d}.");
	remove_from_array(player.hand, card);
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

function roll_many_dice(what, n, hit=6) {
	let hits = 0;
	if (n > 0) {
		let rolls = [];
		for (let i = 0; i < n; ++i) {
			let roll = roll_d6();
			if (roll >= hit)
				++hits;
			rolls.push(roll);
		}
		log(what + rolls.join(", ") + ".");
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

function count_tripolitan_frigates(where) {
	return count_pieces(TR_FRIGATES, where);
}

function count_tripolitan_corsairs(where) {
	return count_pieces(TR_CORSAIRS, where);
}

function count_allied_corsairs(where) {
	return count_pieces(AL_CORSAIRS, where);
}

function count_corsairs(where) {
	return count_tripolitan_corsairs(where) + count_allied_corsairs(where);
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

function count_tripolitan_pieces(where) {
	return count_tripolitan_frigates(where) +
		count_tripolitan_corsairs(where) +
		count_tripolitan_infantry(where);
}

function is_fall_of_1805_or_later() {
	return ((game.year == 1805 && game.season >= FALL) || (game.year > 1805));
}

function hamets_army_location() {
	if (count_american_troops(ALEXANDRIA) > 0) return ALEXANDRIA;
	if (count_american_troops(DERNE) > 0) return DERNE;
	if (count_american_troops(BENGHAZI) > 0) return BENGHAZI;
	return null;
}

function is_hamets_army_created() {
	return hamets_army_location() != null;
}

function is_derne_captured() {
	let space = hamets_army_location();
	return space == DERNE || space == BENGHAZI;
}

function is_benghazi_captured() {
	let space = hamets_army_location();
	return space == BENGHAZI;
}

function is_naval_battle_location(space) {
	let n_us = count_american_frigates(space);
	let n_tr = count_tripolitan_frigates(space) + count_corsairs(space);
	return (n_us > 0 && n_tr > 0);
}

function is_naval_bombardment_location(space) {
	let n_us = count_american_frigates(space) + count_american_gunboats(space);
	let n_tr = count_tripolitan_infantry(space);
	return (n_us > 0 && n_tr > 0);
}

function is_naval_battle_or_bombardment_location(space) {
	let n_us = count_american_frigates(space);
	let n_tr_ships = count_tripolitan_frigates(space) + count_corsairs(space);
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
	return count_pieces(TR_CORSAIRS, TRIPOLI) > 0;
}

function start_of_year() {
	log("Start of " + game.year + ".");
	log("");

	game.season = SPRING;

	move_all_pieces(US_FRIGATES, YEAR_TURN_TRACK[game.year], GIBRALTAR);
	move_all_pieces(TR_FRIGATES, YEAR_TURN_TRACK[game.year], TRIPOLI);

	if (game.year <= 1804) {
		draw_cards(game.us.hand, game.us.draw, 6);
		draw_cards(game.tr.hand, game.tr.draw, 6);
	}
	if (game.year == 1805) {
		reshuffle_discard(game.us.draw, game.us.discard);
		draw_cards(game.us.hand, game.us.draw, 6);
		reshuffle_discard(game.tr.draw, game.tr.discard);
		draw_cards(game.tr.hand, game.tr.draw, 6);
	}
	if (game.year == 1806) {
		draw_cards(game.us.hand, game.us.draw, game.us.draw.length);
		draw_cards(game.tr.hand, game.tr.draw, game.tr.draw.length);
	}

	goto_hand_size();
}

function goto_hand_size() {
	if (game.us.hand.length > 8 || game.tr.hand.length > 8) {
		game.active = "Both";
		game.state = 'hand_size';
		if (game.tr.hand.length > 8)
			game.tr.queue = [];
		if (game.us.hand.length > 8)
			game.us.queue = [];
	} else {
		goto_american_play();
	}
}

function format_discard(n) {
	if (n == 0) return " \u2014 done.";
	if (n == 1) return " \u2014 discard 1 card.";
	return " \u2014 discard " + n + " cards.";
}

states.hand_size = {
	prompt: function (view, current) {
		if (current == TR) {
			if (game.tr.queue) {
				view.actions = {};
				view.actions.undo = (game.tr.queue.length > 0);
				if (game.tr.hand.length > 8) {
					for (let c of game.tr.hand)
						gen_action(view, 'discard', c);
				} else {
					gen_action(view, 'next');
				}
				let n = game.tr.hand.length - 8;
				return view.prompt = "Tripolitania: Hand Limit" + format_discard(n);
			} else {
				return view.prompt = "United States: Hand Limit.";
			}
		}
		if (current == US) {
			if (game.us.queue) {
				view.actions = {};
				view.actions.undo = (game.us.queue.length > 0);
				if (game.us.hand.length > 8) {
					for (let c of game.us.hand)
						gen_action(view, 'discard', c);
				} else {
					gen_action(view, 'next');
				}
				let n = game.us.hand.length - 8;
				return view.prompt = "United States: Hand Limit" + format_discard(n);
			} else {
				return view.prompt = "Tripolitania: Hand Limit.";
			}
		}
		view.prompt = "Hand Limit.";
	},
	discard: function (card, current) {
		if (current == TR) {
			remove_from_array(game.tr.hand, card);
			game.tr.queue.push(card);
		}
		if (current == US) {
			remove_from_array(game.us.hand, card);
			game.us.queue.push(card);
		}
	},
	next: function (_, current) {
		if (current == TR) {
			for (let card of game.tr.queue)
				game.tr.discard.push(card);
			delete game.tr.queue;
		}
		if (current == US) {
			for (let card of game.us.queue)
				game.us.discard.push(card);
			delete game.us.queue;
		}
		if (game.tr.queue && game.us.queue)
			game.active = "Both";
		else if (game.tr.queue)
			game.active = TR;
		else if (game.us.queue)
			game.active = US;
		else
			goto_american_play();
	},
	undo: function (_, current) {
		if (current == TR && game.tr.queue.length > 0) {
			let card = game.tr.queue.pop();
			game.tr.hand.push(card);
		}
		if (current == US && game.us.queue.length > 0) {
			let card = game.us.queue.pop();
			game.us.hand.push(card);
		}
	}
}

function goto_american_play() {
	game.active = US;
	game.state = 'american_play';
}

function end_american_play() {
	log("");
	clear_undo();
	game.where = null;
	game.active = TR;
	game.state = 'tripolitan_play';
}

function end_tripolitan_play() {
	log("");
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
		view.prompt = "United States: Play an event, move two frigates, or build a gunboat.";
		if (is_inactive_player(current))
			return view.prompt;
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
		move_one_piece(US_GUNBOATS, UNITED_STATES_SUPPLY, MALTA);
		end_american_play();
	},
	card_move_frigates: function (c) {
		discard_card(game.us, c, " to move up to two frigates");
		goto_move_up_to_n_american_frigates(2);
	},
	card_event: play_american_event,
	pass: function () {
		log(game.active + " passes.");
		end_american_play();
	}
}

states.tripolitan_play = {
	prompt: function (view, current) {
		view.prompt = "Tripolitania: Play an event, pirate raid, or build a corsair.";
		if (is_inactive_player(current))
			return view.prompt;
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
		move_one_piece(TR_CORSAIRS, TRIPOLITAN_SUPPLY, TRIPOLI);
		end_tripolitan_play();
	},
	card_pirate_raid: function (c) {
		discard_card(game.tr, c, " to Pirate Raid with the corsairs from Tripoli");
		goto_pirate_raid(TRIPOLI);
	},
	card_event: play_tripolitan_event,
	pass: function () {
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

function goto_pirate_raid(from) {
	game.where = from;
	if (can_play_lieutenant_sterett_in_pursuit()) {
		game.active = US;
		game.state = 'raid_before_intercept';
		return;
	}
	goto_pirate_raid_intercept(2);
}

states.raid_before_intercept = {
	prompt: function (view, current) {
		view.prompt = "United States: Pirate Raid from " + SPACES[game.where];
		view.prompt += you_may_play(current, LIEUTENANT_STERETT_IN_PURSUIT);
		if (is_inactive_player(current))
			return view.prompt;
		if (game.us.hand.includes(LIEUTENANT_STERETT_IN_PURSUIT))
			gen_action(view, 'card_event', LIEUTENANT_STERETT_IN_PURSUIT);
		gen_action(view, 'next');
	},
	card_event: function (card) {
		play_battle_card(game.us, LIEUTENANT_STERETT_IN_PURSUIT);
		game.active = TR;
		goto_pirate_raid_intercept(3);
	},
	next: function () {
		game.active = TR;
		goto_pirate_raid_intercept(2);
	},
}

function goto_pirate_raid_intercept(us_dice) {
	game.happy_hunting = false;
	interception_roll(game.where, us_dice);
	if (can_play_happy_hunting() || can_play_us_signal_books_overboard())
		game.state = 'raid_before_hunt';
	else
		goto_pirate_raid_hunt();
}

states.raid_before_hunt = {
	prompt: function (view, current) {
		let list = [];
		if (can_play_happy_hunting())
			list.push(HAPPY_HUNTING);
		if (can_play_us_signal_books_overboard())
			list.push(US_SIGNAL_BOOKS_OVERBOARD);
		view.prompt = "Tripolitania: Pirate Raid from " + SPACES[game.where];
		view.prompt += you_may_play(current, list);
		if (is_inactive_player(current))
			return view.prompt;
		for (let card of list)
			if (game.tr.hand.includes(card))
				gen_action(view, 'card_event', card);
		gen_action(view, 'next');
	},
	card_event: function (card) {
		play_battle_card(game.tr, card);
		if (card == US_SIGNAL_BOOKS_OVERBOARD) {
			let c = discard_random_card(game.us.hand, game.us.discard);
			log("United States discards \u{201c}" + CARD_NAMES[c] + "\u{201d}.");
		}
		if (card == HAPPY_HUNTING) {
			game.happy_hunting = true;
		}
		if (!can_play_happy_hunting() && !can_play_us_signal_books_overboard())
			goto_pirate_raid_hunt();
	},
	next: function () {
		goto_pirate_raid_hunt();
	},
}

function goto_pirate_raid_hunt() {
	let corsairs = count_corsairs(game.where);
	let merchants = roll_many_dice("Corsairs raid: ", corsairs, 5);
	if (game.happy_hunting)
		merchants += roll_many_dice("Happy Hunting: ", 3, 5);
	delete game.happy_hunting;
	log("Captured: " + merchants + (merchants == 1 ? " merchant ship." : " merchant ships."));
	give_gold(merchants);
	if (check_gold_victory())
		return;
	if (can_play_merchant_ship_converted(merchants)) {
		game.state = 'raid_after_hunt';
		return;
	}
	end_pirate_raid();
}

states.raid_after_hunt = {
	prompt: function (view, current) {
		view.prompt = "Tripolitania: Pirate Raid from " + SPACES[game.where];
		view.prompt += you_may_play(current, MERCHANT_SHIP_CONVERTED);
		if (is_inactive_player(current))
			return view.prompt;
		if (game.tr.hand.includes(MERCHANT_SHIP_CONVERTED))
			gen_action(view, 'card_event', MERCHANT_SHIP_CONVERTED);
		gen_action(view, 'next');
	},
	card_event: function (card) {
		play_battle_card(game.tr, MERCHANT_SHIP_CONVERTED);
		move_one_piece(TR_CORSAIRS, TRIPOLITAN_SUPPLY, TRIPOLI);
		end_pirate_raid();
	},
	next: function () {
		end_pirate_raid();
	},
}

function end_pirate_raid() {
	if (game.raids)
		resume_yusuf_qaramanli();
	else
		end_tripolitan_play();
}

function interception_roll(harbor, us_dice) {
	let patrol_zone = PATROL_ZONE_OF_HARBOR[harbor];
	let n_se = count_swedish_frigates(patrol_zone);
	let n_us = count_american_frigates(patrol_zone);
	if (n_se + n_us > 0) {
		let n_tr = count_tripolitan_corsairs(harbor);
		let n_al = count_allied_corsairs(harbor);
		let hits = 0;
		hits += roll_many_dice("Swedish frigates intercept:\n", n_se * 2, 6);
		hits += roll_many_dice("American frigates intercept:\n", n_us * us_dice, 6);
		if (hits > n_tr + n_al)
			hits = n_tr + n_al;
		log("Intercepted: " + hits + (hits == 1 ? " corsair." : " corsairs."));
		if (n_tr > 0)
			for (let i = 0; i < hits; ++i)
				move_one_piece(TR_CORSAIRS, harbor, TRIPOLITAN_SUPPLY);
		else
			for (let i = 0; i < hits; ++i)
				move_one_piece(AL_CORSAIRS, harbor, TRIPOLITAN_SUPPLY);
	}
}

// AMERICAN NAVAL MOVEMENT

function goto_move_up_to_n_american_frigates(n) {
	game.summary = [];
	game.moves = n;
	game.active = US;
	game.state = 'move_us_frigate_from';
}

function format_moves_left() {
	if (game.moves == 0) return " \u2014 no moves left.";
	if (game.moves == 1) return " \u2014 1 move left.";
	return " \u2014 " + game.moves + " moves left.";
}

states.move_us_frigate_from = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "United States: Naval Movement.";
		view.prompt = "United States: Naval Movement" + format_moves_left();
		if (game.moves > 0) {
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
		flush_summary("Frigates moved:");
		let n = count_naval_battle_or_bombardment_locations();
		if (n == 1)
			auto_allocate_gunboats();
		else if (n > 1)
			goto_allocate_gunboats();
		else
			end_american_play();
	},
	undo: pop_undo
}

states.move_us_frigate_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "United States: Naval Movement.";
		view.prompt = "United States: Naval Movement" + format_moves_left();
		for (let space of FRIGATE_SPACES) {
			if (space == TRIPOLI || space == BENGHAZI || space == DERNE)
				if (count_tripolitan_pieces(space) == 0)
					continue; // nothing to do here...
			gen_action(view, 'space', space);
		}
		gen_action(view, 'next');
		gen_action_undo(view);
	},
	space: function (space) {
		push_undo();
		if (space != game.where) {
			game.summary.push(SPACES[game.where] + " to " + SPACES[space]);
			move_one_piece(US_FRIGATES, game.where, space);
			--game.moves;
			if (count_american_frigates(game.where) > 0 && game.moves > 0)
				return;
		}
		game.where = null;
		game.state = 'move_us_frigate_from'
	},
	next: function () {
		flush_summary("Frigates moved:");
		let n = count_naval_battle_or_bombardment_locations();
		if (n == 1)
			auto_allocate_gunboats();
		else if (n > 1)
			goto_allocate_gunboats();
		else
			end_american_play();
	},
	undo: pop_undo
}

function auto_allocate_gunboats() {
	for (let space of BATTLE_SPACES) {
		if (is_naval_battle_location(space)) {
			move_all_pieces(US_GUNBOATS, MALTA, space);
			return goto_naval_battle(space);
		}
		if (is_naval_bombardment_location(space)) {
			move_all_pieces(US_GUNBOATS, MALTA, space);
			return goto_naval_bombardment(space);
		}
	}
}

function goto_allocate_gunboats() {
	if (count_american_gunboats(MALTA) == 0)
		return goto_select_battle();
	game.summary = [];
	game.where = MALTA;
	game.state = 'allocate_gunboats';
}

states.allocate_gunboats = {
	prompt: function (view, current) {
		view.prompt = "United States: Allocate gunboats to battle locations.";
		if (is_inactive_player(current))
			return view.prompt;
		if (count_american_gunboats(MALTA) > 0) {
			for (let space of BATTLE_SPACES)
				if (is_naval_battle_or_bombardment_location(space))
					gen_action(view, 'space', space);
		}
		gen_action(view, 'next');
		gen_action_undo(view);
	},
	space: function (space) {
		push_undo();
		game.summary.push(SPACES[space]);
		move_one_piece(US_GUNBOATS, MALTA, space);
	},
	next: function () {
		flush_summary("Gunboats allocated:");
		game.where = null;
		goto_select_battle();
	},
	undo: pop_undo
}

function goto_select_battle() {
	clear_undo();
	game.where = null;
	game.active = US;
	if (count_naval_battle_or_bombardment_locations() > 0)
		game.state = 'select_battle';
	else
		end_american_play();
}

states.select_battle = {
	prompt: function (view, current) {
		view.prompt = "United States: Pick the next naval battle or bombardment."
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
	naval_bombardment_round();
	game.state = 'naval_bombardment_results';
}

function naval_bombardment_round() {
	let n_frigates = count_american_frigates(game.where);
	let n_gunboats = count_american_gunboats(game.where);
	if (n_frigates + n_gunboats > 0) {
		let n_infantry = count_tripolitan_infantry(game.where);
		let n_hits = 0;
		log("Naval Bombardment in " + SPACES[game.where] + ".");
		n_hits += roll_many_dice("American frigates:\n", n_frigates * 2, 6);
		n_hits += roll_many_dice("American gunboats:\n", n_gunboats, 6);
		if (n_hits > n_infantry)
			n_hits = n_infantry;
		log("Infantry eliminated: " + n_hits + ".");
		game.flash = n_hits + " infantry eliminated."
		for (let i = 0; i < n_hits; ++i)
			move_one_piece(TR_INFANTRY, game.where, TRIPOLITAN_SUPPLY);
	}
}

states.naval_bombardment_results = {
	prompt: function (view, current) {
		view.prompt = "Naval Bombardment in " + SPACES[game.where] + " \u2014 " + game.flash;
		if (is_inactive_player(current))
			return;
		gen_action(view, 'next');
	},
	next: function (card) {
		delete game.flash;
		end_naval_bombardment();
	},
}

function end_naval_bombardment() {
	move_all_pieces(US_FRIGATES, game.where, MALTA);
	move_all_pieces(US_GUNBOATS, game.where, MALTA);
	goto_select_battle();
}

// NAVAL BATTLE

function goto_naval_battle(space) {
	game.save_active = game.active;
	game.where = space;
	log("Naval battle in " + SPACES[game.where] + ".");
	goto_naval_battle_american_card();
}

function goto_naval_battle_american_card() {
	game.prebles_boys_take_aim = false;
	if (can_play_prebles_boys_take_aim()) {
		game.active = US;
		game.state = 'naval_battle_american_card';
		return;
	}
	goto_naval_battle_tripolitan_card();
}

states.naval_battle_american_card = {
	prompt: function (view, current) {
		view.prompt = "United States: Naval Battle in " + SPACES[game.where];
		view.prompt += you_may_play(current, PREBLES_BOYS_TAKE_AIM);
		if (is_inactive_player(current))
			return;
		if (game.us.hand.includes(PREBLES_BOYS_TAKE_AIM))
			gen_action(view, 'card_event', PREBLES_BOYS_TAKE_AIM);
		gen_action(view, 'next');
	},
	card_event: function (card) {
		play_battle_card(game.us, PREBLES_BOYS_TAKE_AIM);
		game.prebles_boys_take_aim = true;
		goto_naval_battle_tripolitan_card();
	},
	next: function (card) {
		goto_naval_battle_tripolitan_card();
	},
}

function goto_naval_battle_tripolitan_card() {
	game.the_guns_of_tripoli = false;
	if (can_play_the_guns_of_tripoli()) {
		game.active = TR;
		game.state = 'naval_battle_tripolitan_card';
		return;
	}
	goto_naval_battle_round();
}

states.naval_battle_tripolitan_card = {
	prompt: function (view, current) {
		view.prompt = "Tripolitania: Naval Battle in " + SPACES[game.where];
		view.prompt += you_may_play(current, THE_GUNS_OF_TRIPOLI);
		if (is_inactive_player(current))
			return;
		if (game.tr.hand.includes(THE_GUNS_OF_TRIPOLI))
			gen_action(view, 'card_event', THE_GUNS_OF_TRIPOLI);
		gen_action(view, 'next');
	},
	card_event: function (card) {
		play_battle_card(game.tr, THE_GUNS_OF_TRIPOLI);
		game.the_guns_of_tripoli = true;
		goto_naval_battle_round();
	},
	next: function (card) {
		goto_naval_battle_round();
	},
}

function goto_naval_battle_round() {
	game.active = game.save_active;

	let n_us_frigates = count_american_frigates(game.where);
	let n_us_gunboats = count_american_gunboats(game.where);
	let n_tr_frigates = count_tripolitan_frigates(game.where);
	let n_tr_corsairs = count_tripolitan_corsairs(game.where);
	let n_al_corsairs = count_allied_corsairs(game.where);

	game.n_tr_hits = 0;
	if (game.prebles_boys_take_aim)
		game.n_tr_hits += roll_many_dice("American frigates:\n", n_us_frigates * 3, 6);
	else
		game.n_tr_hits += roll_many_dice("American frigates:\n", n_us_frigates * 2, 6);
	game.n_tr_hits += roll_many_dice("American gunboats:\n", n_us_gunboats, 6);

	game.n_us_hits = 0;
	if (game.the_guns_of_tripoli)
		game.n_us_hits += roll_many_dice("The Guns of Tripoli:\n", 12, 6);
	game.n_us_hits += roll_many_dice("Tripolitan frigates:\n", n_tr_frigates * 2, 6);
	game.n_us_hits += roll_many_dice("Tripolitan corsairs:\n", n_tr_corsairs, 6);
	game.n_us_hits += roll_many_dice("Allied corsairs:\n", n_al_corsairs, 6);

	log("United States scores " + game.n_tr_hits + (game.n_tr_hits == 1 ? " hit." : " hits."));
	log("Tripolitania scores " + game.n_us_hits + (game.n_us_hits == 1 ? " hit." : " hits."));

	game.summary = [];
	if (game.save_active == US)
		goto_allocate_american_hits();
	else
		goto_allocate_tripolitan_hits();
}

function goto_allocate_american_hits() {
	game.active = US;
	game.state = 'allocate_us_hits';
}

function goto_allocate_tripolitan_hits() {
	game.active = TR;
	game.state = 'allocate_tr_hits';
}

function format_allocate_hits(n) {
	if (n == 0) return "Allocate hits \u2014 done.";
	if (n == 1) return "Allocate hits \u2014 1 left.";
	return "Allocate hits \u2014 " + n + " left.";
}

states.allocate_us_hits = {
	prompt: function (view, current) {
		view.prompt = "United States: " + format_allocate_hits(game.n_us_hits);
		if (is_inactive_player(current))
			return;
		gen_action_undo(view);
		if (count_american_frigates(game.where) + count_american_gunboats(game.where) == 0)
			gen_action(view, 'next');
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
				game.summary.push("American frigate sunk");
				game.location[p] = TRIPOLITAN_SUPPLY;
				remove_from_array(game.damaged, p);
			} else {
				game.damaged.push(p);
			}
		}
		if (US_GUNBOATS.includes(p)) {
			game.summary.push("American gunboat");
			move_one_piece(US_GUNBOATS, game.where, UNITED_STATES_SUPPLY);
		}
	},
	next: function () {
		clear_undo();
		if (check_frigate_victory())
			return;
		if (game.save_active == US)
			goto_allocate_tripolitan_hits();
		else
			resume_naval_battle();
	},
	undo: pop_undo
}

states.allocate_tr_hits = {
	prompt: function (view, current) {
		view.prompt = "Tripolitania: " + format_allocate_hits(game.n_tr_hits);
		if (is_inactive_player(current))
			return;
		gen_action_undo(view);
		if (count_tripolitan_frigates(game.where) + count_tripolitan_corsairs(game.where) + count_allied_corsairs(game.where) == 0)
			gen_action(view, 'next');
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
				game.summary.push("Tripolitan frigate sunk");
				game.location[p] = TRIPOLITAN_SUPPLY;
				remove_from_array(game.damaged, p);
			} else {
				game.damaged.push(p);
			}
		}
		if (TR_CORSAIRS.includes(p)) {
			game.summary.push("Tripolitan corsair");
			move_one_piece(TR_CORSAIRS, game.where, TRIPOLITAN_SUPPLY);
		}
		if (AL_CORSAIRS.includes(p)) {
			game.summary.push("Allied corsair");
			move_one_piece(AL_CORSAIRS, game.where, TRIPOLITAN_SUPPLY);
		}
	},
	next: function () {
		clear_undo();
		if (game.save_active == TR)
			goto_allocate_american_hits();
		else
			resume_naval_battle();
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
	for (let p of US_FRIGATES) {
		if (game.damaged.includes(p)) {
			game.summary.push("American frigate");
			move_damaged_frigate_to_year_track(p, UNITED_STATES_SUPPLY);
		}
	}
	for (let p of TR_FRIGATES) {
		if (game.damaged.includes(p)) {
			game.summary.push("Tripolitan frigate");
			move_damaged_frigate_to_year_track(p, TRIPOLITAN_SUPPLY);
		}
	}
}

function resume_naval_battle() {
	delete game.the_guns_of_tripoli;
	delete game.prebles_boys_take_aim;

	flush_summary("Ships sunk:", true)

	if (game.active_card == ASSAULT_ON_TRIPOLI) {
		let n_tr = count_tripolitan_frigates(game.where) + count_tripolitan_corsairs(game.where);
		let n_us = count_american_frigates(game.where) + count_american_gunboats(game.where);
		if (n_tr == 0) {
			log("The Tripolitan fleet has been eliminated.");
			move_all_pieces(US_MARINES, BENGHAZI, TRIPOLI);
			move_all_pieces(AR_INFANTRY, BENGHAZI, TRIPOLI);
			if (is_naval_bombardment_location(game.where)) {
				naval_bombardment_round();
				game.state = 'land_battle_bombardment_results';
			} else {
				goto_land_battle();
			}
			return;
		}
		if (n_us == 0) {
			log("The American fleet has been eliminated.");
			return goto_game_over(TR, "Assault on Tripoli failed.");
		}
		log("");
		log("Naval battle continues...");
		return goto_naval_battle_round();
	}

	delete game.save_active;

	game.summary = [];
	remove_damaged_frigates();
	flush_summary("Ships damaged:", true)

	move_all_pieces(US_FRIGATES, game.where, MALTA);
	move_all_pieces(US_GUNBOATS, game.where, MALTA);

	if (game.where == TRIPOLI_PATROL_ZONE) {
		move_all_pieces(TR_FRIGATES, game.where, TRIPOLI);
		move_all_pieces(TR_CORSAIRS, game.where, TRIPOLI);
	}

	switch (game.active_card) {
	case TRIPOLI_ATTACKS:
	case ALGIERS_DECLARES_WAR:
	case MOROCCO_DECLARES_WAR:
	case TUNIS_DECLARES_WAR:
		end_tripolitan_play();
		break;
	default:
		goto_select_battle();
		break;
	}
}

// LAND BATTLE

states.land_battle_move_frigates = {
	prompt: function (view, current) {
		view.prompt = "United States: " + CARD_NAMES[game.active_card] + ".";
		if (is_inactive_player(current))
			return view.prompt;
		view.prompt += " Move frigates to " + SPACES[game.where] + format_moves_left();
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
		if (is_naval_bombardment_location(game.where)) {
			move_all_pieces(US_GUNBOATS, MALTA, game.where);
			naval_bombardment_round();
			game.state = 'land_battle_bombardment_results';
		} else {
			goto_land_battle();
		}
	},
	undo: pop_undo
}

states.land_battle_bombardment_results = {
	prompt: function (view, current) {
		view.prompt = "Naval Bombardment in " + SPACES[game.where] + " \u2014 " + game.flash;
		if (is_inactive_player(current))
			return;
		gen_action(view, 'next');
	},
	next: function (card) {
		delete game.flash;

		move_all_pieces(US_FRIGATES, game.where, MALTA);
		move_all_pieces(US_GUNBOATS, game.where, MALTA);

		log("Land Battle in " + SPACES[game.where] + ".");

		goto_land_battle();
	},
}

function goto_land_battle() {
	goto_land_battle_american_card();
}

function goto_land_battle_american_card() {
	game.marine_sharpshooters = false;
	game.lieutenant_obannon_leads_the_charge = false;
	if (can_play_american_land_battle_card()) {
		game.active = US;
		game.state = 'land_battle_american_card';
	} else {
		goto_land_battle_tripolitan_card();
	}
}

states.land_battle_american_card = {
	prompt: function (view, current) {
		let list = [];
		if (can_play_send_in_the_marines())
			list.push(SEND_IN_THE_MARINES);
		if (can_play_marine_sharpshooters())
			list.push(MARINE_SHARPSHOOTERS);
		if (can_play_lieutenant_obannon_leads_the_charge())
			list.push(LIEUTENANT_OBANNON_LEADS_THE_CHARGE);
		view.prompt = "United States: Land Battle in " + SPACES[game.where];
		view.prompt += you_may_play(current, list);
		if (is_inactive_player(current))
			return view.prompt;
		for (let card of list)
			if (game.us.hand.includes(card))
				gen_action(view, 'card_event', card);
		gen_action(view, 'next');
	},
	card_event: function (card) {
		play_battle_card(game.us, card);
		switch (card) {
		case SEND_IN_THE_MARINES:
			move_one_piece(US_MARINES, UNITED_STATES_SUPPLY, TRIPOLI);
			move_one_piece(US_MARINES, UNITED_STATES_SUPPLY, TRIPOLI);
			move_one_piece(US_MARINES, UNITED_STATES_SUPPLY, TRIPOLI);
			break;
		case MARINE_SHARPSHOOTERS:
			game.marine_sharpshooters = true;
			break;
		case LIEUTENANT_OBANNON_LEADS_THE_CHARGE:
			game.lieutenant_obannon_leads_the_charge = true;
			break;
		}
		if (!can_play_american_land_battle_card())
			goto_land_battle_tripolitan_card();
	},
	next: function (card) {
		goto_land_battle_tripolitan_card();
	},
}

function goto_land_battle_tripolitan_card() {
	if (can_play_mercenaries_desert()) {
		game.active = TR;
		game.state = 'land_battle_tripolitan_card';
	} else {
		goto_land_battle_round();
	}
}

states.land_battle_tripolitan_card = {
	prompt: function (view, current) {
		view.prompt = "Tripolitania: Land Battle in " + SPACES[game.where];
		view.prompt += you_may_play(current, MERCENARIES_DESERT);
		if (is_inactive_player(current))
			return;
		if (game.tr.hand.includes(MERCENARIES_DESERT))
			gen_action(view, 'card_event', MERCENARIES_DESERT);
		gen_action(view, 'next');
	},
	card_event: function (card) {
		play_battle_card(game.tr, MERCENARIES_DESERT);
		let n = roll_many_dice("Mercenaries Desert:\n", count_arab_infantry(game.where), 6);;
		for (let i = 0; i < n; ++i)
			move_one_piece(AR_INFANTRY, game.where, UNITED_STATES_SUPPLY);
		log("Deserters: " + n + " Arab infantry.");
		game.flash = n + " Arab infantry deserted.";
		game.state = 'mercenaries_desert_results';
	},
	next: function (card) {
		goto_land_battle_round();
	},
}

states.mercenaries_desert_results = {
	prompt: function (view, current) {
		view.prompt = "Mercenaries Desert in " + SPACES[game.where] + " \u2014 " + game.flash;
		if (is_inactive_player(current))
			return;
		gen_action(view, 'next');
	},
	next: function (card) {
		delete game.flash;
		goto_land_battle_round();
	},
}

function goto_land_battle_round() {
	delete game.flash;
	game.active = US;

	let n_us_mar = count_american_marines(game.where);
	let n_ar_inf = count_arab_infantry(game.where);
	let n_tr_inf = count_tripolitan_infantry(game.where);

	if (n_us_mar + n_ar_inf == 0) {
		delete game.marine_sharpshooters;
		delete game.lieutenant_obannon_leads_the_charge;
		return goto_game_over(TR, "Hamet\u{2019}s Army has been eliminated.");
	}

	if (n_tr_inf == 0) {
		log("Americans have captured " + SPACES[game.where] + ".");
		delete game.marine_sharpshooters;
		delete game.lieutenant_obannon_leads_the_charge;
		if (game.active_card == ASSAULT_ON_TRIPOLI)
			return goto_game_over(US, "Assault on Tripoli.");
		return end_american_play();
	}

	log("Land battle round.");

	let n_tr_hits = 0;
	if (game.lieutenant_obannon_leads_the_charge && n_us_mar > 0) {
		if (game.marine_sharpshooters) {
			n_tr_hits += roll_many_dice("Lieutenant O'Bannon: ", 3, 5);
			n_tr_hits += roll_many_dice("American marines: ", n_us_mar - 1, 5);
		} else {
			n_tr_hits += roll_many_dice("Lieutenant O'Bannon: ", 3, 6);
			n_tr_hits += roll_many_dice("American marines: ", n_us_mar - 1, 6);
		}
	} else {
		if (game.marine_sharpshooters)
			n_tr_hits += roll_many_dice("American marines: ", n_us_mar, 5);
		else
			n_tr_hits += roll_many_dice("American marines: ", n_us_mar, 6);
	}
	n_tr_hits += roll_many_dice("Arab infantry: ", n_ar_inf);

	let n_us_hits = roll_many_dice("Tripolitan infantry: ", n_tr_inf);

	game.flash = apply_tr_hits(n_tr_hits) + apply_us_hits(n_us_hits);
	log("Losses: " + game.flash + ".");
	game.state = 'land_battle_results';
}

states.land_battle_results = {
	prompt: function (view, current) {
		view.prompt = "Land Battle in " + SPACES[game.where] + " \u2014 " + game.flash + " lost.";
		if (is_inactive_player(current))
			return;
		gen_action(view, 'next');
	},
	next: function (card) {
		goto_land_battle_round();
	},
}

function apply_tr_hits(n) {
	let max = count_tripolitan_infantry(game.where);
	if (n > max)
		n = max;
	for (let i = 0; i < n; ++i)
		move_one_piece(TR_INFANTRY, game.where, TRIPOLITAN_SUPPLY);
	return "\n" + n + " Tripolitan infantry,"
}

function apply_us_hits(total) {
	let n = total;
	let max_ar = count_arab_infantry(game.where);
	if (n > max_ar)
		n = max_ar;
	for (let i = 0; i < n; ++i)
		move_one_piece(AR_INFANTRY, game.where, UNITED_STATES_SUPPLY);
	let msg = "\n" + n + " Arab infantry,"

	n = total - n;
	let max_us = count_american_marines(game.where);
	if (n > max_us)
		n = max_us;
	for (let i = 0; i < n; ++i)
		move_one_piece(US_MARINES, game.where, UNITED_STATES_SUPPLY);
	if (n == 1)
		return msg + "\n" + n + " American marine"
	else
		return msg + "\n" + n + " American marines"
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
	let n = count_allied_corsairs(ALGIERS) +
		count_allied_corsairs(TANGIER) +
		count_allied_corsairs(TUNIS) +
		count_tripolitan_corsairs(TRIPOLI);
	return n > 0;
}

function play_yusuf_qaramanli() {
	game.state = 'yusuf_qaramanli';
	game.raids = [];
	if (count_allied_corsairs(ALGIERS) > 0) game.raids.push(ALGIERS);
	if (count_allied_corsairs(TANGIER) > 0) game.raids.push(TANGIER);
	if (count_allied_corsairs(TUNIS) > 0) game.raids.push(TUNIS);
	if (count_tripolitan_corsairs(TRIPOLI) > 0) game.raids.push(TRIPOLI);
}

function resume_yusuf_qaramanli() {
	game.where = null;
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
		view.prompt += " Select a harbor with corsairs to pirate raid from."
			for (let space of game.raids)
				gen_action(view, 'space', space);
		gen_action(view, 'next');
	},
	space: function (space) {
		log("");
		log("Pirate Raid from " + SPACES[space] + ".");
		remove_from_array(game.raids, space);
		switch (space) {
		case ALGIERS: return goto_pirate_raid(ALGIERS);
		case TANGIER: return goto_pirate_raid(TANGIER);
		case TUNIS: return goto_pirate_raid(TUNIS);
		case TRIPOLI: return goto_pirate_raid(TRIPOLI);
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
	game.where = GIBRALTAR;
	if (can_play_lieutenant_sterett_in_pursuit()) {
		game.active = US;
		game.state = 'murad_reis_breaks_out';
	} else {
		end_murad_reis_breaks_out(2);
	}
}

states.murad_reis_breaks_out = {
	prompt: function (view, current) {
		view.prompt = "United States: Murad Reis Breaks Out";
		view.prompt += you_may_play(current, LIEUTENANT_STERETT_IN_PURSUIT);
		if (is_inactive_player(current))
			return view.prompt;
		if (game.us.hand.includes(LIEUTENANT_STERETT_IN_PURSUIT))
			gen_action(view, 'card_event', LIEUTENANT_STERETT_IN_PURSUIT);
		gen_action(view, 'next');
	},
	card_event: function (card) {
		play_battle_card(game.us, LIEUTENANT_STERETT_IN_PURSUIT);
		game.active = TR;
		end_murad_reis_breaks_out(3);
	},
	next: function () {
		game.active = TR;
		end_murad_reis_breaks_out(2);
	},
}

function end_murad_reis_breaks_out(us_dice) {
	interception_roll(GIBRALTAR, us_dice);
	move_all_pieces(TR_CORSAIRS, GIBRALTAR, TRIPOLI);
	end_tripolitan_play();
}

function can_play_constantinople_sends_aid() {
	return is_derne_captured();
}

function play_constantinople_sends_aid() {
	move_one_piece(TR_FRIGATES, TRIPOLITAN_SUPPLY, TRIPOLI);
	move_one_piece(TR_CORSAIRS, TRIPOLITAN_SUPPLY, TRIPOLI);
	move_one_piece(TR_CORSAIRS, TRIPOLITAN_SUPPLY, TRIPOLI);
	move_one_piece(TR_INFANTRY, TRIPOLITAN_SUPPLY, TRIPOLI);
	move_one_piece(TR_INFANTRY, TRIPOLITAN_SUPPLY, TRIPOLI);
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
		log("Frigate from " + SPACES[space] + " moved to Malta.");
		move_one_piece(US_FRIGATES, space, MALTA);
		end_tripolitan_play();
	},
}

function can_play_algerine_corsairs_raid() {
	return count_allied_corsairs(ALGIERS) > 0;
}

function can_play_moroccan_corsairs_raid() {
	return count_allied_corsairs(TANGIER) > 0;
}

function can_play_tunisian_corsairs_raid() {
	return count_allied_corsairs(TUNIS) > 0;
}

function play_algerine_corsairs_raid() {
	goto_pirate_raid(ALGIERS);
}

function play_moroccan_corsairs_raid() {
	goto_pirate_raid(TANGIER);
}

function play_tunisian_corsairs_raid() {
	goto_pirate_raid(TUNIS);
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
	move_one_piece(TR_INFANTRY, TRIPOLITAN_SUPPLY, DERNE);
	move_one_piece(TR_INFANTRY, TRIPOLITAN_SUPPLY, DERNE);
	end_tripolitan_play();
}

function play_troops_to_benghazi() {
	move_one_piece(TR_INFANTRY, TRIPOLITAN_SUPPLY, BENGHAZI);
	move_one_piece(TR_INFANTRY, TRIPOLITAN_SUPPLY, BENGHAZI);
	end_tripolitan_play();
}

function play_troops_to_tripoli() {
	move_one_piece(TR_INFANTRY, TRIPOLITAN_SUPPLY, TRIPOLI);
	move_one_piece(TR_INFANTRY, TRIPOLITAN_SUPPLY, TRIPOLI);
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
		let n = roll_many_dice("Storms: ", count_american_frigates(space), 6);
		if (n == 0) {
			log("No effect.");
		}
		if (n > 0) {
			log("One American frigate sinks.");
			move_one_piece(US_FRIGATES, space, TRIPOLITAN_SUPPLY);
		}
		if (n > 1) {
			if (n == 2)
				log("One American frigate is damaged.");
			else
				log(n + " American frigates are damaged.");
			for (let i = 1; i < n; ++i) {
				if (game.year == 1806)
					move_one_piece(US_FRIGATES, space, UNITED_STATES_SUPPLY);
				else
					move_one_piece(US_FRIGATES, space, YEAR_TURN_TRACK[game.year+1]);
			}
		}
		if (check_frigate_victory())
			return;
		end_tripolitan_play();
	},
}

function can_play_tripoli_attacks() {
	let n = count_tripolitan_frigates(TRIPOLI) + count_tripolitan_corsairs(TRIPOLI);
	let m = count_american_frigates(TRIPOLI_PATROL_ZONE);
	return n > 0 && m > 0;
}

function play_tripoli_attacks() {
	move_all_pieces(TR_FRIGATES, TRIPOLI, TRIPOLI_PATROL_ZONE);
	move_all_pieces(TR_CORSAIRS, TRIPOLI, TRIPOLI_PATROL_ZONE);
	goto_naval_battle(TRIPOLI_PATROL_ZONE);
}

function can_play_sweden_pays_tribute() {
	return (game.year >= 1803) && (count_swedish_frigates(TRIPOLI_PATROL_ZONE) > 0);
}

function play_sweden_pays_tribute() {
	move_all_pieces(SE_FRIGATES, TRIPOLI_PATROL_ZONE, UNITED_STATES_SUPPLY);
	give_gold(2);
	if (check_gold_victory())
		return;
	end_tripolitan_play();
}

function can_play_tripoli_acquires_corsairs() {
	return count_tripolitan_corsairs(TRIPOLITAN_SUPPLY) > 0;
}

function play_tripoli_acquires_corsairs() {
	move_one_piece(TR_CORSAIRS, TRIPOLITAN_SUPPLY, TRIPOLI);
	move_one_piece(TR_CORSAIRS, TRIPOLITAN_SUPPLY, TRIPOLI);
	end_tripolitan_play();
}

function can_play_the_philadelphia_runs_aground() {
	return count_american_frigates(TRIPOLI_PATROL_ZONE) > 0;
}

function play_the_philadelphia_runs_aground() {
	if (can_play_uncharted_waters())
		game.state = 'the_philadelphia_runs_aground';
	else
		end_the_philadelphia_runs_aground(false);
}

states.the_philadelphia_runs_aground = {
	prompt: function (view, current) {
		view.prompt = "Tripolitania: The Philadelphia Runs Aground";
		view.prompt += you_may_play(current, UNCHARTED_WATERS);
		if (is_inactive_player(current))
			return;
		if (game.tr.hand.includes(UNCHARTED_WATERS))
			gen_action(view, 'card_event', UNCHARTED_WATERS);
		gen_action(view, 'next');
	},
	card_event: function (card) {
		play_battle_card(game.tr, UNCHARTED_WATERS);
		end_the_philadelphia_runs_aground(true);
	},
	next: function (card) {
		end_the_philadelphia_runs_aground(false);
	},
}

function end_the_philadelphia_runs_aground(two) {
	let roll = roll_d6();
	if (two) {
		let b = roll_d6();
		log("Tripolitania rolls " + roll + ", " + b + ".");
		if (b > roll)
			roll = b;
	} else {
		log("Tripolitania rolls " + roll + ".");
	}
	switch (roll) {
	case 1: case 2:
		log("Minor damage. One frigate moved to Malta.");
		move_one_piece(US_FRIGATES, TRIPOLI_PATROL_ZONE, MALTA);
		break;
	case 3: case 4:
		log("Frigate sunk.");
		move_one_piece(US_FRIGATES, TRIPOLI_PATROL_ZONE, TRIPOLITAN_SUPPLY);
		break;
	case 5: case 6:
		log("Frigate captured.");
		move_one_piece(US_FRIGATES, TRIPOLI_PATROL_ZONE, TRIPOLITAN_SUPPLY);
		move_one_piece(TR_FRIGATES, TRIPOLITAN_SUPPLY, TRIPOLI);
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
	play_ally_declares_war(ALGIERS);
}

function play_morocco_declares_war() {
	play_ally_declares_war(TANGIER);
}

function play_tunis_declares_war() {
	play_ally_declares_war(TUNIS);
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
	return (count_american_frigates(ALEXANDRIA) > 0) && (game.year >= 1804);
}

function play_hamets_army_created() {
	move_one_piece(US_MARINES, UNITED_STATES_SUPPLY, ALEXANDRIA);
	move_one_piece(AR_INFANTRY, UNITED_STATES_SUPPLY, ALEXANDRIA);
	move_one_piece(AR_INFANTRY, UNITED_STATES_SUPPLY, ALEXANDRIA);
	move_one_piece(AR_INFANTRY, UNITED_STATES_SUPPLY, ALEXANDRIA);
	move_one_piece(AR_INFANTRY, UNITED_STATES_SUPPLY, ALEXANDRIA);
	move_one_piece(AR_INFANTRY, UNITED_STATES_SUPPLY, ALEXANDRIA);
	end_american_play();
}

function can_play_treaty_of_peace_and_amity() {
	return is_fall_of_1805_or_later() &&
		(count_allied_corsairs(ALGIERS) == 0) &&
		(count_allied_corsairs(TANGIER) == 0) &&
		(count_allied_corsairs(TUNIS) == 0) &&
		(is_derne_captured()) &&
		(count_tripolitan_frigates(TRIPOLI) == 0);
}

function play_treaty_of_peace_and_amity() {
	goto_game_over(US, "Treaty of Peace and Amity.");
}

function can_play_assault_on_tripoli() {
	return is_fall_of_1805_or_later()
	// && (hamets_army_location() == BENGHAZI || game.us.hand.includes(SEND_IN_THE_MARINES));
}

function play_assault_on_tripoli() {
	move_all_pieces(US_GUNBOATS, MALTA, TRIPOLI);
	for (let space of FRIGATE_SPACES)
		if (space != TRIPOLI)
			move_all_pieces(US_FRIGATES, space, TRIPOLI);
	goto_naval_battle(TRIPOLI);
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
		log("Frigate placed in " + SPACES[space] + ".");
		move_one_piece(US_FRIGATES, YEAR_TURN_TRACK[game.year+1], space);
		end_american_play();
	},
}

function can_play_a_show_of_force() {
	if (count_available_american_frigates() < 3)
		return false;
	if (count_allied_corsairs(ALGIERS) > 0) return true;
	if (count_allied_corsairs(TANGIER) > 0) return true;
	if (count_allied_corsairs(TUNIS) > 0) return true;
	return false;
}

function play_a_show_of_force() {
	game.state = 'a_show_of_force_where';
	game.summary = [];
}

states.a_show_of_force_where = {
	prompt: function (view, current) {
		view.prompt = "United States: A Show of Force.";
		if (is_inactive_player(current))
			return;
		view.prompt += " Select an active ally of Tripoli.";
		if (count_allied_corsairs(ALGIERS) > 0)
			gen_action(view, 'space', ALGIERS);
		if (count_allied_corsairs(TANGIER) > 0)
			gen_action(view, 'space', TANGIER);
		if (count_allied_corsairs(TUNIS) > 0)
			gen_action(view, 'space', TUNIS);
	},
	space: function (space) {
		push_undo();
		game.where = space;
		game.state = 'a_show_of_force_who';
		game.moves = 3 - count_american_frigates(game.where);
	},
}

states.a_show_of_force_who = {
	prompt: function (view, current) {
		view.prompt = "United States: A Show of Force.";
		if (is_inactive_player(current))
			return;
		view.prompt += " Move frigates to " + SPACES[game.where] + format_moves_left();
		gen_action_undo(view);
		if (count_american_frigates(game.where) >= 3) {
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
		game.summary.push("from " + SPACES[space]);
		move_one_piece(US_FRIGATES, space, game.where);
		--game.moves;
	},
	next: function () {
		flush_summary("Frigates moved to " + SPACES[game.where] + ":");
		clear_undo();
		move_all_pieces(AL_CORSAIRS, game.where, TRIPOLITAN_SUPPLY);
		end_american_play();
	},
	undo: pop_undo
}

function can_play_tribute_paid() {
	if (count_available_american_frigates() < 1) return false;
	if (count_allied_corsairs(ALGIERS) > 0) return true;
	if (count_allied_corsairs(TANGIER) > 0) return true;
	if (count_allied_corsairs(TUNIS) > 0) return true;
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
		if (count_allied_corsairs(ALGIERS) > 0)
			gen_action(view, 'space', ALGIERS);
		if (count_allied_corsairs(TANGIER) > 0)
			gen_action(view, 'space', TANGIER);
		if (count_allied_corsairs(TUNIS) > 0)
			gen_action(view, 'space', TUNIS);
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
		log("Frigate moved to " + SPACES[game.where] + " from " + SPACES[space] + ".");
		move_one_piece(US_FRIGATES, space, game.where);
	},
	next: function () {
		clear_undo();
		move_all_pieces(AL_CORSAIRS, game.where, TRIPOLITAN_SUPPLY);
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
	take_gold(2);
	end_american_play();
}

function can_play_hamet_recruits_bedouins() {
	return is_hamets_army_created();
}

function play_hamet_recruits_bedouins() {
	let space = hamets_army_location();
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
		log("Card placed in hard.");
		remove_from_array(game.us.discard, card);
		game.us.hand.push(card);
		end_american_play();
	},
}

function can_play_congress_authorizes_action() {
	return game.year < 1806;
}

function play_congress_authorizes_action() {
	move_one_piece(US_FRIGATES, UNITED_STATES_SUPPLY, YEAR_TURN_TRACK[game.year+1]);
	move_one_piece(US_FRIGATES, UNITED_STATES_SUPPLY, YEAR_TURN_TRACK[game.year+1]);
	end_american_play();
}

function can_play_corsairs_confiscated() {
	return count_tripolitan_corsairs(GIBRALTAR) > 0;
}

function play_corsairs_confiscated() {
	move_all_pieces(TR_CORSAIRS, GIBRALTAR, TRIPOLITAN_SUPPLY);
	remove_from_array(game.tr.core, MURAD_REIS_BREAKS_OUT);
	end_american_play();
}

function can_play_burn_the_philadelphia() {
	return count_tripolitan_frigates(TRIPOLI) > 0;
}

function play_burn_the_philadelphia() {
	if (can_play_the_daring_stephen_decatur())
		game.state = 'burn_the_philadelphia';
	else
		end_burn_the_philadelphia(false);
}

states.burn_the_philadelphia = {
	prompt: function (view, current) {
		view.prompt = "United States: Burn the Philadelphia";
		view.prompt += you_may_play(current, THE_DARING_STEPHEN_DECATUR);
		if (is_inactive_player(current))
			return;
		if (game.us.hand.includes(THE_DARING_STEPHEN_DECATUR))
			gen_action(view, 'card_event', THE_DARING_STEPHEN_DECATUR);
		gen_action(view, 'next');
	},
	card_event: function (card) {
		play_battle_card(game.us, THE_DARING_STEPHEN_DECATUR);
		end_burn_the_philadelphia(true);
	},
	next: function (card) {
		end_burn_the_philadelphia(false);
	},
}

function end_burn_the_philadelphia(two) {
	let roll = roll_d6();
	if (two) {
		let b = roll_d6();
		log("Burn the Philadelphia: " + roll + ", " + b + ".");
		if (b > roll)
			roll = b;
	} else {
		log("Burn the Philadelphia: " + roll + ".");
	}
	switch (roll) {
	case 1: case 2:
		log("1-2: The raid is a failure.");
		break;
	case 3: case 4:
		log("3-4: A Tripolitan frigate is damaged.");
		if (game.year == 1806)
			move_one_piece(TR_FRIGATES, TRIPOLI, TRIPOLITAN_SUPPLY);
		else
			move_one_piece(TR_FRIGATES, TRIPOLI, YEAR_TURN_TRACK[game.year + 1]);
		break;
	case 5: case 6:
		log("5-6: A Tripolitan frigate is sunk.");
		move_one_piece(TR_FRIGATES, TRIPOLI, TRIPOLITAN_SUPPLY);
		break;
	}
	end_american_play();
}

function can_play_launch_the_intrepid() {
	let n = count_tripolitan_frigates(TRIPOLI) + count_tripolitan_corsairs(TRIPOLI);
	return n > 0;
}

function play_launch_the_intrepid() {
	if (can_play_the_daring_stephen_decatur())
		game.state = 'launch_the_intrepid';
	else
		end_launch_the_intrepid(false);
}

states.launch_the_intrepid = {
	prompt: function (view, current) {
		view.prompt = "United States: Launch the Intrepid";
		view.prompt += you_may_play(current, THE_DARING_STEPHEN_DECATUR);
		if (is_inactive_player(current))
			return;
		if (game.us.hand.includes(THE_DARING_STEPHEN_DECATUR))
			gen_action(view, 'card_event', THE_DARING_STEPHEN_DECATUR);
		gen_action(view, 'next');
	},
	card_event: function (card) {
		play_battle_card(game.us, THE_DARING_STEPHEN_DECATUR);
		end_launch_the_intrepid(true);
	},
	next: function (card) {
		end_launch_the_intrepid(false);
	},
}

function end_launch_the_intrepid(two) {
	let roll = roll_d6();
	if (two) {
		let b = roll_d6();
		log("Launch the Intrepid: " + roll + ", " + b + ".");
		if (b > roll)
			roll = b;
	} else {
		log("Launch the Intrepid: " + roll + ".");
	}
	switch (roll) {
	case 1: case 2:
		log("1-2: The raid is a failure.");
		break;
	case 3: case 4:
		log("3-4: One Tripolitan corsair is sunk.");
		move_one_piece(TR_CORSAIRS, TRIPOLI, TRIPOLITAN_SUPPLY);
		break;
	case 5: case 6:
		if (count_tripolitan_frigates(TRIPOLI) > 0) {
			log("5-6: One Tripolitan frigate is sunk.");
			move_one_piece(TR_FRIGATES, TRIPOLI, TRIPOLITAN_SUPPLY);
		} else {
			log("5-6: Two Tripolitan corsairs are sunk.");
			move_one_piece(TR_CORSAIRS, TRIPOLI, TRIPOLITAN_SUPPLY);
			move_one_piece(TR_CORSAIRS, TRIPOLI, TRIPOLITAN_SUPPLY);
		}
		break;
	}
	end_american_play();
}

function can_play_general_eaton_attacks_derne() {
	return hamets_army_location() == ALEXANDRIA;
}

function play_general_eaton_attacks_derne() {
	move_all_pieces(US_MARINES, ALEXANDRIA, DERNE);
	move_all_pieces(AR_INFANTRY, ALEXANDRIA, DERNE);
	move_all_pieces(US_GUNBOATS, MALTA, DERNE);
	game.where = DERNE;
	game.moves = 3;
	game.state = 'land_battle_move_frigates';
}

function can_play_general_eaton_attacks_benghazi() {
	return hamets_army_location() == DERNE;
}

function play_general_eaton_attacks_benghazi() {
	move_all_pieces(US_MARINES, DERNE, BENGHAZI);
	move_all_pieces(AR_INFANTRY, DERNE, BENGHAZI);
	move_all_pieces(US_GUNBOATS, MALTA, BENGHAZI);
	game.where = BENGHAZI;
	game.moves = 3;
	game.state = 'land_battle_move_frigates';
}

// TRIPOLITAN BATTLE EVENTS

function can_play_us_signal_books_overboard() {
	let patrol_zone = PATROL_ZONE_OF_HARBOR[game.where];
	return (count_american_frigates(patrol_zone) > 0) && is_not_removed(US_SIGNAL_BOOKS_OVERBOARD);
}

function can_play_uncharted_waters() {
	return is_not_removed(UNCHARTED_WATERS);
}

function can_play_merchant_ship_converted(merchants) {
	return (game.where == TRIPOLI) &&
		(merchants > 0) &&
		(count_tripolitan_corsairs(TRIPOLITAN_SUPPLY) > 0) &&
		is_not_removed(MERCHANT_SHIP_CONVERTED);
}

function can_play_happy_hunting() {
	return (game.where == TRIPOLI) && (count_tripolitan_corsairs(TRIPOLI) > 0) && is_not_removed(HAPPY_HUNTING);
}

function can_play_the_guns_of_tripoli() {
	return (game.where == TRIPOLI) && is_not_removed(THE_GUNS_OF_TRIPOLI);
}

function can_play_mercenaries_desert() {
	if (count_tripolitan_infantry(game.where) == 0)
		return false; // no opposition left
	return (count_arab_infantry(game.where) > 0) && is_not_removed(MERCENARIES_DESERT);
}

// AMERICAN BATTLE EVENTS

function can_play_lieutenant_sterett_in_pursuit() {
	let patrol_zone = PATROL_ZONE_OF_HARBOR[game.where];
	return (count_american_frigates(patrol_zone) > 0) && is_not_removed(LIEUTENANT_STERETT_IN_PURSUIT);
}

function can_play_prebles_boys_take_aim() {
	return BATTLE_SPACES.includes(game.where) && is_not_removed(PREBLES_BOYS_TAKE_AIM);
}

function can_play_the_daring_stephen_decatur() {
	return is_not_removed(THE_DARING_STEPHEN_DECATUR);
}

function can_play_send_in_the_marines() {
	return game.active_card == ASSAULT_ON_TRIPOLI && is_not_removed(SEND_IN_THE_MARINES);
}

function can_play_lieutenant_obannon_leads_the_charge() {
	if (count_tripolitan_infantry(game.where) == 0)
		return false; // no opposition left
	return (count_american_marines(game.where) > 0) && is_not_removed(LIEUTENANT_OBANNON_LEADS_THE_CHARGE);
}

function can_play_marine_sharpshooters() {
	if (count_tripolitan_infantry(game.where) == 0)
		return false; // no opposition left
	return (count_american_marines(game.where) > 0) && is_not_removed(MARINE_SHARPSHOOTERS);
}

function can_play_american_land_battle_card() {
	return can_play_send_in_the_marines() ||
		can_play_marine_sharpshooters() ||
		can_play_lieutenant_obannon_leads_the_charge();
}

// VICTORY

function check_gold_victory() {
	if (game.tr.gold >= 12)
		return goto_game_over(TR, "Twelve gold.");
	return false;
}

function check_frigate_victory() {
	if (count_american_frigates(TRIPOLITAN_SUPPLY) >= 4)
		return goto_game_over(TR, "Four American frigates sunk.");
	return false;
}

function goto_game_over(result, message) {
	game.where = null;
	game.state = 'game_over';
	game.active = "None";
	game.result = result;
	if (result == TR)
		game.victory = "Tripolitan victory: " + message;
	else if (result == US)
		game.victory = "United States victory: " + message;
	else
		game.victory = message;
	log("");
	log(game.victory);
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
			draw: [],
			discard: [],
		},
		tr: {
			core: [],
			hand: [],
			draw: [],
			discard: [],
			gold: 0,
		},
		where: null,
		undo: [],
	};

	if (typeof scenario == 'number')
		game.year = scenario;

	game.tr.core.push(YUSUF_QARAMANLI);
	game.tr.core.push(MURAD_REIS_BREAKS_OUT);
	game.tr.core.push(CONSTANTINOPLE_SENDS_AID);

	game.us.core.push(THOMAS_JEFFERSON);
	game.us.core.push(SWEDISH_FRIGATES_ARRIVE);
	game.us.core.push(HAMETS_ARMY_CREATED);

	for (let i = 4; i <= 27; ++i) {
		game.us.draw.push(i);
		game.tr.draw.push(i+27);
	}

	deploy("us_frigate_1", GIBRALTAR);
	deploy("us_frigate_2", GIBRALTAR);
	deploy("us_frigate_3", GIBRALTAR);
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

	deploy("tr_corsair_1", GIBRALTAR);
	deploy("tr_corsair_2", GIBRALTAR);
	deploy("tr_corsair_3", TRIPOLI);
	deploy("tr_corsair_4", TRIPOLI);
	deploy("tr_corsair_5", TRIPOLI);
	deploy("tr_corsair_6", TRIPOLI);
	deploy("tr_corsair_7", TRIPOLITAN_SUPPLY);
	deploy("tr_corsair_8", TRIPOLITAN_SUPPLY);
	deploy("tr_corsair_9", TRIPOLITAN_SUPPLY);

	for (let i = 1; i <= 9; ++i)
		deploy("al_corsair_" + i, TRIPOLITAN_SUPPLY);

	deploy("tr_infantry_1", TRIPOLI);
	deploy("tr_infantry_2", TRIPOLI);
	deploy("tr_infantry_3", TRIPOLI);
	deploy("tr_infantry_4", TRIPOLI);
	deploy("tr_infantry_5", BENGHAZI);
	deploy("tr_infantry_6", BENGHAZI);
	deploy("tr_infantry_7", DERNE);
	deploy("tr_infantry_8", DERNE);
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

	let tr_score = count_american_frigates(TRIPOLITAN_SUPPLY) * 3 + game.tr.gold;

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
			draw: game.tr.draw.length,
			discard: game.tr.discard.length + (game.tr.queue ? game.tr.queue.length : 0),
			hand: game.tr.hand.length,
			gold: game.tr.gold,
			score: tr_score,
		},
		us: {
			core: game.us.core,
			draw: game.us.draw.length,
			discard: game.us.discard.length + (game.us.queue ? game.us.queue.length : 0),
			hand: game.us.hand.length,
			score: 30 - tr_score,
		},
		card: game.active_card,
		where: game.where,
	};

	states[game.state].prompt(view, current);

	if (current == US && game.state == 'bainbridge_supplies_intel') {
		view.hand = game.us.discard;
	} else if (current == US) {
		view.hand = game.us.hand;
	} else if (current == TR) {
		view.hand = game.tr.hand;
	} else {
		view.hand = [];
	}
	view.core = game.us.core.concat(game.tr.core);

	return view;
}
