"use strict";

// TODO: frank seat adjustment at setup
// TODO: saladin seat adjustment at setup

// TODO: optional rule - iron bridge
// TODO: optional rule - force marches

// TODO: hide blocks in battle deployment and sallying etc
// TODO: battle dialog messages
// TODO: nicer looking battle dialog -- reserve, castle*, field, field, castle*, reserve
// TODO: battle dialog block order

// TODO: draw phase
// TODO: winter turn
// TODO: winter campaign

// TODO: crusader arrival movement

exports.scenarios = [
	"Third Crusade"
];

const { CARDS, BLOCKS, TOWNS, PORTS, ROADS } = require('./data');

const FRANKS = "Franks";
const SARACENS = "Saracens";
const ASSASSINS = "Assassins";
const ENEMY = { Franks: "Saracens", Saracens: "Franks" };
const OBSERVER = "Observer";
const BOTH = "Both";
const DEAD = "Dead";
const F_POOL = "FP";
const S_POOL = "SP";
const ENGLAND = "England";
const FRANCE = "France";
const GERMANIA = "Germania";

const INTRIGUE = 3;
const WINTER_CAMPAIGN = 6;

// serif cirled numbers
const DIE_HIT = [ 0, '\u2776', '\u2777', '\u2778', '\u2779', '\u277A', '\u277B' ];
const DIE_MISS = [ 0, '\u2460', '\u2461', '\u2462', '\u2463', '\u2464', '\u2465' ];
const DIE_SELF = '\u2465!';

const ATTACK_MARK = "*";
const RESERVE_MARK_1 = "\u2020";
const RESERVE_MARK_2 = "\u2021";
const NO_MARK = "";

let states = {};

let game = null;

function log(...args) {
	let s = Array.from(args).join("");
	game.log.push(s);
}

function log_move_start(from) {
	game.move_buf = [ from ];
}

function log_move_continue(to, mark) {
	if (mark)
		game.move_buf.push(to + mark);
	else
		game.move_buf.push(to);
}

function log_move_end() {
	if (game.move_buf && game.move_buf.length > 1)
		game.summary.push(game.move_buf);
	delete game.move_buf;
}

function print_summary_no_count(text) {
	function print_move(last) {
		return "\n" + last.join(" \u2192 ");
	}
	if (game.summary.length > 0) {
		game.summary.sort();
		for (let entry of game.summary)
			text += print_move(entry);
	} else {
		text += "\nnothing.";
	}
	log(text);
	delete game.summary;
}

function print_summary(text) {
	function print_move(last) {
		return "\n" + n + " - " + last.join(" \u2192 ");
	}
	game.summary.sort();
	let last = game.summary[0];
	let n = 0;
	for (let entry of game.summary) {
		if (entry.toString() != last.toString()) {
			text += print_move(last);
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
	delete game.summary;
}

function is_active_player(current) {
	return (current == game.active) || (game.active == BOTH && current != OBSERVER);
}

function is_inactive_player(current) {
	return current == OBSERVER || (game.active != current && game.active != BOTH);
}

function remove_from_array(array, item) {
	let i = array.indexOf(item);
	if (i >= 0)
		array.splice(i, 1);
}

function clear_undo() {
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
		if (!(action in view.actions)) {
			view.actions[action] = [ argument ];
		} else {
			if (!view.actions[action].includes(argument))
				view.actions[action].push(argument);
		}
	} else {
		view.actions[action] = true;
	}
}

function roll_d6() {
	return Math.floor(Math.random() * 6) + 1;
}

function shuffle_deck() {
	let deck = [];
	for (let c = 1; c <= 27; ++c)
		deck.push(c);
	return deck;
}

function deal_cards(deck, n) {
	let hand = [];
	for (let i = 0; i < n; ++i) {
		let k = Math.floor(Math.random() * deck.length);
		hand.push(deck[k]);
		deck.splice(k, 1);
	}
	return hand;
}

function block_plural(who) {
	return BLOCKS[who].plural;
}

function block_name(who) {
	return who; // BLOCKS[who].name;
}

function block_type(who) {
	return BLOCKS[who].type;
}

function block_home(who) {
	let home = BLOCKS[who].home;
	if (home == "Normandy") return "England";
	if (home == "Aquitaine") return "England";
	if (home == "Bourgogne") return "France";
	if (home == "Flanders") return "France";
	return home;
}

function block_pool(who) {
	if (BLOCKS[who].owner == FRANKS)
		return F_POOL;
	return S_POOL;
}

function block_owner(who) {
	return BLOCKS[who].owner;
}

function block_initiative(who) {
	return BLOCKS[who].combat[0];
}

function block_printed_fire_power(who) {
	return BLOCKS[who].combat[1] | 0;
}

function block_fire_power(who, where) {
	let combat = block_printed_fire_power(who);
	return combat;
}

function block_move(who) {
	return BLOCKS[who].move;
}

function block_max_steps(who) {
	return BLOCKS[who].steps;
}

function is_saladin_family(who) {
	return who == "Saladin" || who == "Al Adil" || who == "Al Aziz" || who == "Al Afdal" || who == "Al Zahir";
}

function is_english_crusader(who) {
	return (who == "Richard" || who == "Robert" || who == "Crossbows");
}

function is_block_on_map(who) {
	let location = game.location[who];
	return location && location != DEAD && location != F_POOL && location != S_POOL;
}

function is_block_on_land(who) {
	let location = game.location[who];
	return location && location != DEAD && location != F_POOL && location != S_POOL &&
		location != ENGLAND && location != FRANCE && location != GERMANIA;
}

function can_activate(who) {
	return block_owner(who) == game.active &&
		is_block_on_map(who) &&
		!is_block_in_castle(who) &&
		!game.moved[who];
}

function can_activate_for_sea_move(who) {
	return block_owner(who) == game.active &&
		is_block_on_map(who) &&
		!game.moved[who];
}

function road_id(a, b) {
	return (a < b) ? a + "/" + b : b + "/" + a;
}

function road_was_last_used_by_enemy(from, to) {
	return game.last_used[road_id(from, to)] == ENEMY[game.active];
}

function road_type(a, b) {
	return ROADS[road_id(a,b)];
}

function road_limit(a, b) {
	return game.road_limit[road_id(a,b)] || 0;
}

function reset_road_limits() {
	game.road_limit = {};
}

function count_friendly(where) {
	let p = game.active;
	let count = 0;
	for (let b in BLOCKS)
		if (game.location[b] == where && block_owner(b) == p)
			++count;
	return count;
}

function count_enemy(where) {
	let p = ENEMY[game.active];
	let count = 0;
	for (let b in BLOCKS)
		if (game.location[b] == where && block_owner(b) == p)
			++count;
	return count;
}

function count_friendly_in_field(where) {
	let p = game.active;
	let count = 0;
	for (let b in BLOCKS)
		if (game.location[b] == where && block_owner(b) == p)
			if (!is_block_in_castle(b))
				++count;
	return count;
}

function count_enemy_in_field(where) {
	let p = ENEMY[game.active];
	let count = 0;
	for (let b in BLOCKS)
		if (game.location[b] == where && block_owner(b) == p)
			if (!is_block_in_castle(b))
				++count;
	return count;
}

function count_friendly_in_field_excluding_reserves(where) {
	let p = game.active;
	let count = 0;
	for (let b in BLOCKS)
		if (game.location[b] == where && block_owner(b) == p)
			if (!is_block_in_castle(b) && !is_battle_reserve(b))
				++count;
	return count;
}

function count_enemy_in_field_excluding_reserves(where) {
	let p = ENEMY[game.active];
	let count = 0;
	for (let b in BLOCKS)
		if (game.location[b] == where && block_owner(b) == p)
			if (!is_block_in_castle(b) && !is_battle_reserve(b))
				++count;
	return count;
}

function is_friendly_town(where) { return count_friendly(where) > 0 && count_enemy(where) == 0; }
function is_enemy_town(where) { return count_friendly(where) == 0 && count_enemy(where) > 0; }
function is_vacant_town(where) { return count_friendly(where) == 0 && count_enemy(where) == 0; }
function is_contested_town(where) { return count_friendly(where) > 0 && count_enemy(where) > 0; }
function is_friendly_or_vacant_town(where) { return is_friendly_town(where) || is_vacant_town(where); }

function is_friendly_field(where) { return count_friendly_in_field(where) > 0 && count_enemy_in_field(where) == 0; }
function is_enemy_field(where) { return count_friendly_in_field(where) == 0 && count_enemy_in_field(where) > 0; }
function is_contested_field(where) { return count_friendly_in_field(where) > 0 && count_enemy_in_field(where) > 0; }
function is_friendly_or_vacant_field(where) { return is_friendly_field(where) || is_vacant_town(where); }

function castle_limit(where) {
	return TOWNS[where].rating;
}

function is_fortified_port(where) {
	return TOWNS[where].fortified_port;
}

function is_port(where) {
	return TOWNS[where].port;
}

function is_friendly_port(where) {
	return TOWNS[where].port && is_friendly_town(where);
}

function count_pinning(where) {
	return count_enemy_in_field_excluding_reserves(where);
}

function count_pinned(where) {
	let count = 0;
	for (let b in BLOCKS)
		if (game.location[b] == where && block_owner(b) == game.active)
			if (!is_battle_reserve(b))
				++count;
	return count;
}

function is_pinned(who, from) {
	if (game.active == game.p2) {
		if (count_pinned(from) <= count_pinning(from))
			return true;
	}
	return false;
}

function can_block_use_road(from, to) {
	if (game.active == game.guide) {
		switch (road_type(from, to)) {
		case 'major': return road_limit(from, to) < 8;
		case 'minor': return road_limit(from, to) < 4;
		}
	} else {
		switch (road_type(from, to)) {
		case 'major': return road_limit(from, to) < 4;
		case 'minor': return road_limit(from, to) < 2;
		}
	}
	return false;
}

function can_block_land_move_to(who, from, to) {
	if (can_block_use_road(from, to)) {
		if (count_pinning(from) > 0)
			if (road_was_last_used_by_enemy(from, to))
				return false;
		return true;
	}
	return false;
}

function can_block_land_move(who) {
	if (can_activate(who)) {
		let from = game.location[who];
		if (from) {
			if (is_pinned(who, from))
				return false;
			for (let to of TOWNS[from].exits)
				if (can_block_land_move_to(who, from, to))
					return true;
		}
	}
	return false;
}

function can_use_richards_sea_legs(who, to) {
	// English Crusaders may attack by sea.
	// If combined with another attack, the English must be the Main Attacker.
	if (is_english_crusader(who)) {
		if (game.attacker[to] == FRANKS) {
			let road = game.main_road[to];
			if (road)
				return (road == "England");
		}
		return true;
	}
	return false;
}

function can_enter_besieged_port(where) {
	// Tripoli and Tyre are friendly to besieged defender!
	if (where == "Tripoli" || where == "Tyre")
		if (besieged_player(where) == game.active)
			return count_blocks_in_castle(where) < castle_limit(where);
	return false;
}

function can_leave_besieged_port(where) {
	// Tripoli and Tyre are friendly to besieged defender!
	if (where == "Tripoli" || where == "Tyre")
		if (besieged_player(where) == game.active)
			return true;
	return false;
}

function can_block_sea_move_to(who, to) {
	if (is_port(to)) {
		if (can_use_richards_sea_legs(who, to))
			return true;
		if (can_enter_besieged_port(to))
			return true;
		return is_friendly_port(to);
	}
	return false;
}

function can_block_sea_move_from(who, from) {
	if (is_friendly_port(from))
		return true;
	if (can_leave_besieged_port(from))
		return true;
	return false;
}

function can_block_sea_move(who) {
	if (can_activate_for_sea_move(who)) {
		let from = game.location[who];
		if (can_block_sea_move_from(who, from)) {
			for (let to of PORTS)
				if (to != from && can_block_sea_move_to(who, to))
					return true;
		}
	}
	return false;
}

function can_sea_move_anywhere() {
	if (game.moves > 0) {
		for (let b in BLOCKS)
			if (can_block_sea_move(b))
				return true;
	}
	return false;
}

function can_block_continue(who, from, to) {
	if (is_contested_field(to))
		return false;
	if (game.distance >= block_move(who))
		return false;
	return true;
}

function can_block_retreat_to(who, to) {
	if (is_friendly_field(to) || is_vacant_town(to)) {
		let from = game.location[who];
		if (can_block_use_road(from, to)) {
			if (road_was_last_used_by_enemy(from, to))
				return false;
			return true;
		}
	}
	return false;
}

function can_block_retreat(who) {
	if (block_owner(who) == game.active) {
		let from = game.location[who];
		for (let to of TOWNS[from].exits)
			if (can_block_retreat_to(who, to))
				return true;
	}
	return false;
}

function can_block_regroup_to(who, to) {
	if (is_friendly_field(to) || is_vacant_town(to)) {
		let from = game.location[who];
		if (can_block_use_road(from, to))
			return true;
	}
	return false;
}

function can_block_regroup(who) {
	if (block_owner(who) == game.active) {
		let from = game.location[who];
		for (let to of TOWNS[from].exits)
			if (can_block_regroup_to(who, to))
				return true;
	}
	return false;
}

function can_block_use_road_to_muster(from, to) {
	return can_block_use_road(from, to) && is_friendly_or_vacant_field(to);
}

function can_block_muster_with_3_moves(n0, muster) {
	for (let n1 of TOWNS[n0].exits) {
		if (can_block_use_road_to_muster(n0, n1)) {
			if (n1 == muster)
				return true;
			for (let n2 of TOWNS[n1].exits) {
				if (n2 == n0) continue; // don't backtrack!
				if (can_block_use_road_to_muster(n1, n2)) {
					if (n2 == muster)
						return true;
					if (TOWNS[n2].exits.includes(muster))
						return can_block_use_road_to_muster(n2, muster);
				}
			}
		}
	}
	return false;
}

function can_block_muster_with_2_moves(n0, muster, avoid) {
	for (let n1 of TOWNS[n0].exits) {
		if (n1 == avoid)
			continue;
		if (can_block_use_road_to_muster(n0, n1)) {
			if (n1 == muster)
				return true;
			if (TOWNS[n1].exits.includes(muster))
				return can_block_use_road_to_muster(n1, muster);
		}
	}
	return false;
}

function can_block_muster_with_1_move(n0, muster) {
	if (TOWNS[n0].exits.includes(muster))
		return can_block_use_road_to_muster(n0, muster);
	return false;
}

function can_block_muster(who, muster) {
	let from = game.location[who];
	if (from == muster)
		return false;
	if (can_activate(who)) {
		if (is_pinned(who, from))
			return false;
		if (block_move(who) == 3)
			return can_block_muster_with_3_moves(from, muster);
		else
			return can_block_muster_with_2_moves(from, muster, null);
	}
	return false;
}

function can_muster_to(muster) {
	for (let b in BLOCKS)
		if (can_block_muster(b, muster))
			return true;
	return false;
}

function can_muster_anywhere() {
	if (game.moves > 0)
		return true;
	for (let where of game.mustered) {
		if (is_friendly_field(where))
			if (can_muster_to(where))
				return true;
	}
	return false;
}

function is_battle_reserve(who) {
	return game.reserves1.includes(who) || game.reserves2.includes(who);
}

function is_attacker(who) {
	if (game.location[who] == game.where && block_owner(who) == game.attacker[game.where])
		return !is_battle_reserve(who);
	return false;
}

function is_defender(who) {
	if (game.location[who] == game.where && block_owner(who) != game.attacker[game.where])
		return !is_battle_reserve(who);
	return false;
}

function is_field_attacker(who) {
	if (game.location[who] == game.where && block_owner(who) == game.attacker[game.where])
		return !is_battle_reserve(who) && !is_block_in_castle(who);
	return false;
}

function is_field_defender(who) {
	if (game.location[who] == game.where && block_owner(who) != game.attacker[game.where])
		return !is_battle_reserve(who) && !is_block_in_castle(who);
	return false;
}

function is_field_combatant(who) {
	if (game.location[who] == game.where)
		return !is_battle_reserve(who) && !is_block_in_castle(who);
	return false;
}

function is_block_in_field(who) {
	return !is_battle_reserve(who) && !is_block_in_castle(who);
}

function is_storm_attacker(who) {
	return game.storming.includes(who);
}

function is_storm_defender(who) {
	return is_block_in_castle_in(who, game.where);
}

function is_storm_combatant(who) {
	return game.storming.includes(who) || is_block_in_castle_in(who, game.where);
}

function is_castle_town(where) {
	return castle_limit(where) > 0;
}

function count_blocks_in_castle(where) {
	let n = 0;
	for (let b in BLOCKS)
		if (game.location[b] == where && game.castle.includes(b))
			++n;
	return n;
}

function count_enemy_in_field_and_reserve(where) {
	let n = 0;
	for (let b in BLOCKS)
		if (block_owner(b) != game.active)
			if (game.location[b] == where && !game.castle.includes(b))
				++n;
	return n;
}

function count_friendly_in_field_and_reserve(where) {
	let n = 0;
	for (let b in BLOCKS)
		if (block_owner(b) == game.active)
			if (game.location[b] == where && !game.castle.includes(b))
				++n;
	return n;
}

function is_contested_battle_field() {
	let f = count_friendly_in_field_excluding_reserves(game.where);
	let e = count_enemy_in_field_excluding_reserves(game.where);
	return f > 0 && e > 0;
}

function count_reserves(where) {
	let n = 0;
	for (let b in BLOCKS)
		if (block_owner(b) == game.active)
			if (game.location[b] == where && is_battle_reserve(b))
				++n;
	return n;
}

function is_under_siege(where) {
	return count_blocks_in_castle(where) > 0;
}

function is_block_in_castle(b) {
	return game.castle.includes(b);
}

function is_block_in_castle_in(b, town) {
	return game.location[b] == town && game.castle.includes(b);
}

function besieged_player(where) {
	for (let b in BLOCKS)
		if (is_block_in_castle_in(b, where))
			return block_owner(b);
	return null;
}

function besieging_player(where) {
	return ENEMY[besieged_player(where)];
}

function lift_siege(where) {
	if (is_under_siege(where) && !is_contested_town(where)) {
		log("Siege lifted in " + where + ".");
		console.log("SIEGE LIFTED IN", where);
		for (let b in BLOCKS)
			if (is_block_in_castle_in(b, where))
				remove_from_array(game.castle, b);
	}
}

function lift_all_sieges() {
	for (let t in TOWNS)
		lift_siege(t);
}

function disband(who) {
	if (block_plural(who))
		log(block_name(who) + " disband.");
	else
		log(block_name(who) + " disbands.");
	game.location[who] = block_pool(who);
	game.steps[who] = block_max_steps(who);
}

function eliminate_block(who) {
	remove_from_array(game.castle, who);
	if (game.sallying) remove_from_array(game.sallying, who);
	if (game.storming) remove_from_array(game.storming, who);
	if (block_plural(who))
		log(block_name(who) + " are eliminated.");
	else
		log(block_name(who) + " is eliminated.");
	if (is_saladin_family(who) || block_type(who) == 'crusaders' || block_type(who) == 'military_orders')
		game.location[who] = null; // permanently eliminated
	else
		game.location[who] = DEAD; // into to the pool next year
	game.steps[who] = block_max_steps(who);
}

function reduce_block(who) {
	if (game.steps[who] == 1) {
		eliminate_block(who);
	} else {
		--game.steps[who];
	}
}

// GAME TURN

function start_year() {
	log("");
	log("Start Year " + game.year + ".");

	game.turn = 1;

	let deck = shuffle_deck();
	game.f_hand = deal_cards(deck, 6);
	game.s_hand = deal_cards(deck, 6);
	game.prior_f_card = 0;
	game.prior_s_card = 0;

	start_game_turn();
}

function start_game_turn() {
	log("");
	log("Start Turn ", game.turn, " of Year ", game.year, ".");

	game.guide = null;
	game.jihad = null;

	// Reset movement and attack tracking state
	reset_road_limits();
	game.last_used = {};
	game.attacker = {};
	game.reserves1 = [];
	game.reserves2 = [];
	game.moved = {};

	goto_card_phase();
}

function end_game_turn() {
	if (game.turn == 6) {
		goto_winter_campaigns();
	} else {
		game.turn ++;
		start_game_turn();
	}
}

function is_winter() {
	return game.turn == 6;
}

// CARD PHASE

function goto_card_phase() {
	game.f_card = 0;
	game.s_card = 0;
	game.show_cards = false;
	game.state = 'play_card';
	game.active = BOTH;
}

states.play_card = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for players to play a card.";
		if (current == FRANKS) {
			view.prior_s_card = game.prior_s_card;
			if (game.f_card) {
				view.prompt = "Waiting for Saracens to play a card.";
				gen_action(view, 'undo');
			} else {
				view.prompt = "Play a card.";
				for (let c of game.f_hand)
					if (game.turn > 1 || c != INTRIGUE)
						gen_action(view, 'play', c);
			}
		}
		if (current == SARACENS) {
			view.prior_f_card = game.prior_f_card;
			if (game.s_card) {
				view.prompt = "Waiting for Franks to play a card.";
				gen_action(view, 'undo');
			} else {
				view.prompt = "Play a card.";
				for (let c of game.s_hand)
					if (game.turn > 1 || c != INTRIGUE)
						gen_action(view, 'play', c);
			}
		}
	},
	play: function (card, current) {
		if (current == FRANKS) {
			remove_from_array(game.f_hand, card);
			game.f_card = card;
		}
		if (current == SARACENS) {
			remove_from_array(game.s_hand, card);
			game.s_card = card;
		}
		if (game.s_card > 0 && game.f_card > 0)
			reveal_cards();
	},
	undo: function (_, current) {
		if (current == FRANKS) {
			game.f_hand.push(game.f_card);
			game.f_card = 0;
		}
		if (current == SARACENS) {
			game.s_hand.push(game.s_card);
			game.s_card = 0;
		}
	}
}

function reveal_cards() {
	log("Franks play " + CARDS[game.f_card].name + ".");
	log("Saracens play " + CARDS[game.s_card].name + ".");
	game.show_cards = true;

	let fc = CARDS[game.f_card];
	let sc = CARDS[game.s_card];

	if (fc.event && sc.event) {
		log("Game Turn is cancelled.");
		game.prior_f_card = game.f_card;
		game.prior_s_card = game.s_card;
		end_game_turn();
		return;
	}

	if (game.f_card == INTRIGUE) {
		game.f_card = game.prior_s_card;
		log("Intrigue copies " + CARDS[game.f_card].name + ".");
	}
	if (game.s_card == INTRIGUE) {
		game.s_card = game.prior_f_card;
		log("Intrigue copies " + CARDS[game.s_card].name + ".");
	}

	delete game.winter_campaign;
	if (is_winter()) {
		if (game.f_card == WINTER_CAMPAIGN)
			game.winter_campaign = FRANKS;
		if (game.s_card == WINTER_CAMPAIGN)
			game.winter_campaign = SARACENS;
	}

	game.prior_f_card = game.f_card;
	game.prior_s_card = game.s_card;

	let fp = fc.event ? 10 : fc.moves;
	let sp = sc.event ? 10 : sc.moves;

	if (fp == sp) {
		let die = roll_d6();
		log("Random first player.");
		if (die > 3)
			++fp;
		else
			++sp;
	}

	if (fp > sp) {
		game.p1 = FRANKS;
		game.p2 = SARACENS;
	} else {
		game.p1 = SARACENS;
		game.p2 = FRANKS;
	}

	game.active = game.p1;
	start_player_turn();
}

function start_player_turn() {
	log("");
	log("Start " + game.active + " turn.");
	reset_road_limits();
	let card = CARDS[game.active == FRANKS ? game.f_card : game.s_card];
	if (card.event)
		goto_event_card(card.event);
	else
		goto_move_phase(card.moves);
}

function end_player_turn() {
	game.moves = 0;
	game.main_road = null;

	if (game.active == game.p2) {
		goto_combat_phase();
	} else {
		game.active = game.p2;
		start_player_turn();
	}
}

// EVENTS

function goto_event_card(event) {
	console.log("EVENT", event);
	switch (event) {
	case 'assassins': goto_assassins(); break;
	case 'guide': goto_guide(); break;
	case 'jihad': goto_jihad(); break;
	case 'manna': goto_manna(); break;
	}
}

function goto_assassins() {
	game.state = 'assassins';
	game.who = ASSASSINS;
}

function select_random_block(where) {
	let list = [];
	for (let b in BLOCKS)
		if (game.location[b] == where)
			list.push(b);
	return list[Math.floor(Math.random() * list.length)];
}

states.assassins = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to play Assassins.";
		view.prompt = "Assassins: Choose one enemy block.";
		for (let b in BLOCKS) {
			if (is_block_on_land(b) && block_owner(b) == ENEMY[game.active])
				gen_action(view, 'block', b);
		}
	},
	block: function (who) {
		let where = game.location[who];

		who = select_random_block(where);

		let hits = 0;
		let rolls = [];
		for (let i = 0; i < 3; ++i) {
			let die = roll_d6();
			if (die <= 3) {
				rolls.push(DIE_HIT[die]);
				++hits;
			} else {
				rolls.push(DIE_MISS[die]);
			}
		}
		hits = Math.min(hits, game.steps[who]);

		log("Assassins hit " + who + " in " + where + ": " + rolls.join("") + ".");
		for (let i = 0; i < hits; ++i)
			reduce_block(who);

		game.who = null;
		end_player_turn();
	},
	undo: pop_undo
}

function goto_guide() {
	game.guide = game.active;
	game.state = 'group_move_first';
	game.summary = [];
}

function goto_jihad() {
	game.jihad = game.active;
	game.state = 'group_move_first';
	game.summary = [];
}

function goto_manna() {
	game.state = 'manna';
	game.moves = 3;
	game.moved = {};
	game.summary = [];
}

states.manna = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to play Manna.";
		view.prompt = "Manna: Add one step to three different friendly blocks \u2014 " + game.moves + " left.";
		gen_action_undo(view);
		gen_action(view, 'next');
		if (game.moves > 0) {
			for (let b in BLOCKS) {
				if (is_block_on_land(b) && block_owner(b) == game.active && !game.moved[b])
					if (game.steps[b] < block_max_steps(b))
						gen_action(view, 'block', b);
			}
		}
	},
	block: function (who) {
		push_undo();
		game.summary.push([game.location[who]]);
		++game.steps[who];
		--game.moves;
		game.moved[who] = 1;
	},
	next: function () {
		print_summary(game.active + " use Manna:");
		clear_undo();
		game.moved = {};
		end_player_turn();
	},
	undo: pop_undo
}

// MOVE PHASE

function move_block(who, from, to) {
	game.location[who] = to;
	game.road_limit[road_id(from, to)] = road_limit(from, to) + 1;
	game.distance ++;
	if (is_contested_field(to)) {
		game.last_used[road_id(from, to)] = game.active;
		if (!game.attacker[to]) {
			game.attacker[to] = game.active;
			game.main_road[to] = from;
			return ATTACK_MARK;
		} else {
			// Attacker main attack or reinforcements
			if (game.attacker[to] == game.active) {
				if (game.main_road[to] != from) {
					game.reserves1.push(who);
					return RESERVE_MARK_1;
				}
				return ATTACK_MARK;
			}

			// Defender reinforcements
			if (!game.main_road[to])
				game.main_road[to] = from;

			if (game.main_road[to] == from) {
				game.reserves1.push(who);
				return RESERVE_MARK_1;
			} else {
				game.reserves2.push(who);
				return RESERVE_MARK_2;
			}
		}
	}
	return false;
}

function goto_move_phase(moves) {
	game.state = 'move_phase';
	game.moves = moves;
	game.mustered = [];
	game.main_road = {};
}

function end_move_phase() {
	game.who = null;
	game.where = null;
	clear_undo();
	game.moves = 0;
	end_player_turn();
}

function format_moves(phase, prompt) {
	if (game.moves == 0)
		return phase + "No moves left.";
	if (game.moves == 1)
		return phase + prompt + " \u2014 1 move left.";
	return phase + prompt + " \u2014 " + game.moves + " moves left.";
}

states.move_phase = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Move Phase: Waiting for " + game.active + ".";
		view.prompt = format_moves("Move Phase: ", "Group Move, Sea Move, or Muster");
		gen_action_undo(view);
		gen_action(view, 'end_move_phase');
		if (game.moves > 0) {
			gen_action(view, 'group_move');
			if (can_sea_move_anywhere())
				gen_action(view, 'sea_move');
			if (can_muster_anywhere())
				gen_action(view, 'muster');
		}
	},
	group_move: function () {
		push_undo();
		--game.moves;
		game.state = 'group_move_first';
		game.summary = [];
	},
	sea_move: function () {
		push_undo();
		game.state = 'sea_move';
	},
	muster: function () {
		push_undo();
		--game.moves;
		game.state = 'muster';
	},
	end_move_phase: end_move_phase,
	undo: pop_undo
}

// GROUP MOVE

function group_move_phase() {
	if (game.active == game.jihad) return "Jihad: ";
	if (game.active == game.guide) return "Guide: ";
	return "Group Move: ";
}

function can_group_move_more() {
	for (let b in BLOCKS)
		if (game.location[b] == game.where)
			if (can_block_land_move(b))
				return true;
	return false;
}

states.group_move_first = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Move Phase: Waiting for " + game.active + ".";
		view.prompt = group_move_phase() + "Choose a block to group move.";
		gen_action_undo(view);
		if (game.active == game.guide || game.active == game.jihad)
			gen_action(view, 'end_move_phase');
		for (let b in BLOCKS)
			if (can_block_land_move(b))
				gen_action(view, 'block', b);
	},
	block: function (who) {
		push_undo();
		game.where = game.location[who];
		game.who = who;
		game.distance = 0;
		game.last_from = null;
		game.state = 'group_move_to';
	},
	end_move_phase: end_move_phase,
	undo: pop_undo
}

states.group_move_who = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Move Phase: Waiting for " + game.active + ".";
		view.prompt = group_move_phase() + "Choose a block to group move.";
		gen_action_undo(view);
		if (game.active == game.guide || game.active == game.jihad)
			gen_action(view, 'end_move_phase');
		else
			gen_action(view, 'end_group_move');
		for (let b in BLOCKS)
			if (game.location[b] == game.where)
				if (can_block_land_move(b))
					gen_action(view, 'block', b);
	},
	block: function (who) {
		push_undo();
		game.who = who;
		game.distance = 0;
		game.last_from = null;
		game.state = 'group_move_to';
	},
	end_move_phase: end_move_phase,
	end_group_move: end_group_move,
	undo: pop_undo
}

states.group_move_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move.";
		view.prompt = group_move_phase() + "Move " + block_name(game.who) + ".";
		gen_action_undo(view);
		gen_action(view, 'block', game.who);
		let from = game.location[game.who];
		if (game.distance > 0)
			gen_action(view, 'town', from);
		for (let to of TOWNS[from].exits) {
			if (to != game.last_from && can_block_land_move_to(game.who, from, to))
				gen_action(view, 'town', to);
		}
	},
	town: function (to) {
		let from = game.location[game.who];
		if (to == from) {
			end_move();
			return;
		}
		lift_siege(from);
		if (game.distance == 0)
			log_move_start(from);
		let mark = move_block(game.who, from, to);
		if (mark)
			log_move_continue(to + mark);
		else
			log_move_continue(to);
		game.last_from = from;
		if (!can_block_continue(game.who, from, to))
			end_move();
	},
	block: function () {
		if (game.distance == 0)
			pop_undo();
		else
			end_move();
	},
	undo: pop_undo
}

function end_move() {
	if (game.distance > 0)
		game.moved[game.who] = true;
	log_move_end();
	game.who = null;
	game.distance = 0;
	if (can_group_move_more())
		game.state = 'group_move_who';
	else
		end_group_move();
}

function end_group_move() {
	print_summary(game.active + " activate " + game.where + ":");
	game.state = 'move_phase';
}

// SEA MOVE

states.sea_move = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Move Phase: Waiting for " + game.active + ".";
		view.prompt = format_moves("Sea Move: ", "Choose a block to sea move");
		gen_action_undo(view);
		for (let b in BLOCKS)
			if (can_block_sea_move(b))
				gen_action(view, 'block', b);
	},
	end_sea_move: function () {
		game.state = 'move_phase';
	},
	block: function (who) {
		game.who = who;
		game.state = 'sea_move_to';
	},
	undo: pop_undo
}

states.sea_move_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move.";
		if (is_english_crusader(game.who))
			view.prompt = "Sea Move: Move " + block_name(game.who) + " to a port.";
		else
			view.prompt = "Sea Move: Move " + block_name(game.who) + " to a friendly port.";
		gen_action_undo(view);
		gen_action(view, 'block', game.who);
		let from = game.location[game.who];
		for (let to of PORTS)
			if (to != from && can_block_sea_move_to(game.who, to))
				gen_action(view, 'town', to);
	},
	town: function (to) {
		--game.moves;

		let from = game.location[game.who];
		game.location[game.who] = to;
		game.moved[game.who] = true;

		lift_siege(from);

		remove_from_array(game.castle, game.who);

		if (besieged_player(to) == game.active) {
			// Move into besieged fortified port
			game.castle.push(game.who);
			log(game.active + " sea move:\n" + from + " \u2192 " + to + " castle.");

		} else if (!is_friendly_port(to)) {
			// English Crusaders attack!
			game.attacker[to] = FRANKS;
			game.main_road[to] = "England";
			log(game.active + " sea move:\n" + from + " \u2192 " + to + ATTACK_MARK + ".");

		} else {
			// Normal move.
			log(game.active + " sea move:\n" + from + " \u2192 " + to + ".");
		}

		game.who = null;
		game.state = 'move_phase';
	},
	block: function () {
		game.who = null;
		game.state = 'sea_move';
	},
	undo: pop_undo,
}

// MUSTER

states.muster = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move.";
		view.prompt = "Muster: Choose one friendly or vacant muster town.";
		gen_action_undo(view);
		gen_action(view, 'end_muster');
		for (let where in TOWNS) {
			if (is_friendly_field(where))
				if (can_muster_to(where))
					gen_action(view, 'town', where);
		}
	},
	town: function (where) {
		push_undo();
		game.where = where;
		game.state = 'muster_who';
		game.summary = [];
	},
	end_muster: pop_undo,
	undo: pop_undo,
}

states.muster_who = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move.";
		view.prompt = "Muster: Move blocks to " + game.where + ".";
		view.muster = game.where;
		gen_action_undo(view);
		gen_action(view, 'end_muster');
		for (let b in BLOCKS)
			if (can_block_muster(b, game.where))
				gen_action(view, 'block', b);
	},
	block: function (who) {
		push_undo();
		game.who = who;
		game.state = 'muster_move_1';
	},
	end_muster: function () {
		print_summary(game.active + " muster to " + game.where + ":");
		game.where = null;
		game.state = 'move_phase';
	},
	undo: pop_undo,
}

states.muster_move_1 = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move.";
		view.prompt = "Muster: Move " + block_name(game.who) + " to " + game.where + ".";
		view.muster = game.where;
		gen_action_undo(view);
		gen_action(view, 'block', game.who);
		let from = game.location[game.who];
		let muster = game.where;
		if (block_move(game.who) == 3) {
			for (let to of TOWNS[from].exits) {
				if (can_block_use_road_to_muster(from, to)) {
					if (to == muster || can_block_muster_with_2_moves(to, muster, from))
						gen_action(view, 'town', to);
				}
			}
		} else {
			for (let to of TOWNS[from].exits) {
				if (can_block_use_road_to_muster(from, to)) {
					if (to == muster || can_block_muster_with_1_move(to, muster))
						gen_action(view, 'town', to);
				}
			}
		}
	},
	town: function (to) {
		let from = game.location[game.who];
		log_move_start(from);
		log_move_continue(to);
		move_block(game.who, from, to);
		lift_siege(from);
		if (to == game.where) {
			end_muster_move();
		} else {
			game.state = 'muster_move_2';
		}
	},
	block: pop_undo,
	undo: pop_undo,
}

states.muster_move_2 = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move.";
		view.prompt = "Muster: Move " + block_name(game.who) + " to " + game.where + ".";
		view.muster = game.where;
		gen_action_undo(view);
		let from = game.location[game.who];
		let muster = game.where;
		if (block_move(game.who) == 3) {
			for (let to of TOWNS[from].exits) {
				if (can_block_use_road_to_muster(from, to)) {
					if (to == muster || can_block_muster_with_1_move(to, muster))
						gen_action(view, 'town', to);
				}
			}
		} else {
			for (let to of TOWNS[from].exits) {
				if (can_block_use_road_to_muster(from, to)) {
					if (to == muster)
						gen_action(view, 'town', to);
				}
			}
		}
	},
	town: function (to) {
		let from = game.location[game.who];
		log_move_continue(to);
		move_block(game.who, from, to);
		if (to == game.where) {
			end_muster_move();
		} else {
			game.state = 'muster_move_3';
		}
	},
	undo: pop_undo,
}

states.muster_move_3 = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move.";
		view.prompt = "Muster: Move " + block_name(game.who) + " to " + game.where + ".";
		view.muster = game.where;
		gen_action_undo(view);
		let from = game.location[game.who];
		let muster = game.where;
		for (let to of TOWNS[from].exits) {
			if (can_block_use_road_to_muster(from, to)) {
				if (to == muster)
					gen_action(view, 'town', to);
			}
		}
	},
	town: function (to) {
		let from = game.location[game.who];
		log_move_continue(to);
		move_block(game.who, from, to);
		end_muster_move();
	},
	undo: pop_undo,
}

function end_muster_move() {
	let muster = game.where;
	log_move_end();
	game.moved[game.who] = true;
	game.who = null;
	game.state = 'muster_who';
}

// COMBAT PHASE

function goto_combat_phase() {
	game.moved = {};
	game.combat_list = [];
	for (let where in TOWNS)
		if (is_contested_town(where))
			game.combat_list.push(where);
	resume_combat_phase();
}

function resume_combat_phase() {
	reset_road_limits();
	game.moved = {};

	if (game.combat_list.length > 0) {
		game.active = game.p1;
		game.state = 'combat_phase';
	} else {
		goto_draw_phase();
	}
}

states.combat_phase = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to choose the next battle or siege.";
		view.prompt = "Choose the next battle or siege!";
		for (let where of game.combat_list)
			gen_action(view, 'town', where);
	},
	town: function (where) {
		remove_from_array(game.combat_list, where);
		if (game.attacker[where] == game.jihad) {
			game.active = game.attacker[where];
			game.state = 'use_jihad_event';
			game.where = where;
		} else {
			game.where = where;
			start_combat();
		}
	},
}

states.use_jihad_event = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to choose the next battle or siege.";
		view.prompt = "Do you want to use the surprise attack granted by Jihad?";
		gen_action(view, 'jihad');
		gen_action(view, 'pass');
	},
	jihad: function () {
		log(game.active + " activate Jihad.");
		game.jihad = game.where;
		start_combat();
	},
	pass: function () {
		start_combat();
	}
}

function start_combat() {
	console.log("START COMBAT");

	game.flash = "";
	log("");
	log("Battle in " + game.where + ".");
	game.combat_round = 0;
	game.halfhit = null;
	game.storming = [];
	game.sallying = [];

	if (is_castle_town(game.where)) {
		if (!is_under_siege(game.where)) {
			console.log("START SIEGE");
			log("~ Combat Deployment ~");
			game.active = ENEMY[game.attacker[game.where]];
			game.state = 'combat_deployment';
		} else {
			game.attacker[game.where] = besieging_player(game.where);
			console.log("CONTINUE SIEGE");
			log("Existing siege continues.");
			next_combat_round();
		}
	} else {
		console.log("START NON-SIEGE");
		next_combat_round();
	}
}

function end_combat() {
	console.log("END COMBAT IN", game.where);

	lift_siege(game.where);

	if (game.jihad == game.where)
		game.jihad = null;

	delete game.storming;
	delete game.sallying;
	game.where = null;
	game.flash = "";
	game.battle_round = 0;

	resume_combat_phase();
}

// COMBAT DEPLOYMENT

states.combat_deployment = {
	show_battle: true,
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to deploy blocks.";
		view.prompt = "Deploy blocks on the field and in the castle.";
		let max = castle_limit(game.where);
		let n = count_blocks_in_castle(game.where);
		if (n < max) {
			for (let b in BLOCKS) {
				if (block_owner(b) == game.active && !is_battle_reserve(b)) {
					if (game.location[b] == game.where && !game.castle.includes(b)) {
						gen_action(view, 'battle_withdraw', b);
						gen_action(view, 'block', b);
					}
				}
			}
		}
		gen_action_undo(view);
		gen_action(view, 'next');
	},
	battle_withdraw: function (who) {
		push_undo();
		game.castle.push(who);
	},
	block: function (who) {
		push_undo();
		game.castle.push(who);
	},
	next: function () {
		clear_undo();
		let n = count_blocks_in_castle(game.where);
		if (n == 1)
			log(game.active + " withdraw 1 block.");
		else
			log(game.active + " withdraw " + n + " blocks.");
		game.active = game.attacker[game.where];
		if (count_enemy_in_field_and_reserve(game.where) == 0)  {
			console.log("DEFENDER REFUSED FIELD BATTLE");
			return goto_regroup();
		}
		next_combat_round();
	},
	undo: pop_undo
}

// REGROUP AFTER FIELD BATTLE/SIEGE VICTORY

function goto_regroup() {
	lift_siege(game.where);
	console.log("REGROUP", game.active);
	reset_road_limits();
	game.moved = {};
	game.state = 'regroup';
	game.summary = [];
}

states.regroup = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to regroup.";
		view.prompt = "Regroup: Choose an army to move.";
		gen_action_undo(view);
		gen_action(view, 'end_regroup');
		for (let b in BLOCKS) {
			if (game.location[b] == game.where) {
				if (can_block_regroup(b))
					gen_action(view, 'block', b);
			}
		}
	},
	block: function (who) {
		push_undo();
		game.who = who;
		game.state = 'regroup_to';
	},
	end_regroup: function () {
		clear_undo();
		print_summary(game.active + " regroup:");
		if (is_contested_town(game.where))
			next_combat_round();
		else
			end_combat();
	},
	undo: pop_undo
}

states.regroup_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to regroup.";
		view.prompt = "Regroup: Move the army to a friendly or vacant town.";
		gen_action_undo(view);
		gen_action(view, 'block', game.who);
		for (let to of TOWNS[game.where].exits)
			if (can_block_regroup_to(game.who, to))
				gen_action(view, 'town', to);
	},
	town: function (to) {
		let from = game.where;
		game.summary.push([from, to]);
		move_block(game.who, game.where, to);
		game.who = null;
		game.state = 'regroup';
	},
	block: pop_undo,
	undo: pop_undo
}

// COMBAT ROUND

function next_combat_round() {
	console.log("NEXT COMBAT ROUND");
	if (game.jihad == game.where && game.combat_round == 1)
		game.jihad = null;
	switch (game.combat_round) {
	case 0: return goto_combat_round(1);
	case 1: return goto_combat_round(2);
	case 2: return goto_combat_round(3);
	case 3: return goto_retreat_after_combat();
	}
}

function bring_on_reserves(reserves) {
	for (let b in BLOCKS)
		if (game.location[b] == game.where)
			remove_from_array(reserves, b);
}

function goto_combat_round(combat_round) {
	game.combat_round = combat_round;
	game.moved = {};

	console.log("COMBAT ROUND", combat_round);
	log("~ Combat Round " + combat_round + " ~");

	let was_contested = is_contested_battle_field();

	if (combat_round == 2)
		bring_on_reserves(game.reserves1);
	if (combat_round == 3)
		bring_on_reserves(game.reserves2);

	if (is_contested_battle_field()) {
		if (is_under_siege(game.where)) {
			if (!was_contested) {
				log("Relief forces arrive!");
				console.log("RELIEF FORCE ARRIVED");
				if (game.storming.length > 0) {
					log("Storming canceled by arriving relief force.");
					console.log("STORMING CANCELED");
					game.storming.length = 0;
				}
				let old_attacker = game.attacker[game.where];
				game.attacker[game.where] = besieged_player(game.where);
				if (old_attacker != game.attacker[game.where]) {
					console.log("NEW ATTACKER IS", game.attacker[game.where]);
					log(game.attacker[game.where] + " are now the attacker.");
				}
			}
			return goto_declare_sally();
		}
		return goto_field_battle();
	}

	goto_declare_storm();
}

// DECLARE STORM

function goto_declare_storm() {
	if (game.storming.length == castle_limit(game.where))
		return goto_storm_battle();
	game.active = besieging_player(game.where);
	game.state = 'declare_storm';
}

states.declare_storm = {
	show_battle: true,
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to declare storming.";
		view.prompt = "Storm: Declare which blocks should storm the castle.";
		if (game.storming.length < castle_limit(game.where)) {
			for (let b in BLOCKS) {
				if (block_owner(b) == game.active && !is_battle_reserve(b)) {
					if (game.location[b] == game.where && !game.storming.includes(b)) {
						gen_action(view, 'battle_storm', b);
						gen_action(view, 'block', b);
					}
				}
			}
		}
		gen_action_undo(view);
		gen_action(view, 'next');
	},
	battle_storm: storm_with_block,
	block: storm_with_block,
	next: function () {
		clear_undo();
		let n = game.storming.length;
		console.log("STORM DECLARATION", n);
		if (n == 0) {
			log(game.active + " decline to storm.");
			goto_declare_sally();
		} else {
			goto_storm_battle();
		}
	},
	undo: pop_undo
}

function storm_with_block(who) {
	push_undo();
	game.storming.push(who);
	if (block_plural(who))
		game.flash = who + " storm.";
	else
		game.flash = who + " storms.";
	log(game.active[0] + ": " + game.flash);
}

// DECLARE SALLY

function goto_declare_sally() {
	game.active = besieged_player(game.where);
	game.state = 'declare_sally';
	game.was_contested = is_contested_battle_field();
}

states.declare_sally = {
	show_battle: true,
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to declare sallying.";
		view.prompt = "Sally: Declare which blocks should sally onto the field.";
		for (let b in BLOCKS) {
			if (block_owner(b) == game.active && !is_battle_reserve(b) && is_block_in_castle(b)) {
				if (game.location[b] == game.where && !game.sallying.includes(b)) {
					gen_action(view, 'battle_sally', b);
					gen_action(view, 'block', b);
				}
			}
		}
		gen_action_undo(view);
		gen_action(view, 'next');
	},
	battle_sally: sally_with_block,
	block: sally_with_block,
	next: function () {
		clear_undo();
		let n = game.sallying.length;
		console.log("SALLY DECLARATION", n);
		if (n == 0)
			log(game.active + " decline to sally.");
		if (is_contested_battle_field()) {
			if (!game.was_contested) {
				log(game.active + " are now the attacker.");
				console.log("NEW ATTACKER IS", game.active);
				game.attacker[game.where] = game.active;
			}
			goto_field_battle();
		} else if (count_reserves(game.where) > 0) {
			next_combat_round();
		} else {
			log("~ Combat Ends ~");
			goto_siege_attrition();
		}
	},
	undo: pop_undo
}

function sally_with_block(who) {
	push_undo();
	remove_from_array(game.castle, who);
	game.sallying.push(who);
	if (block_plural(who))
		game.flash = who + " sally.";
	else
		game.flash = who + " sallies.";
	log(game.active[0] + ": " + game.flash);
}

// RETREAT AFTER COMBAT

function goto_retreat_after_combat() {
	console.log("RETREAT AFTER COMBAT");

	log("~ Combat Ends ~");

	// withdraw all sallying blocks to castle.
	for (let b of game.sallying)
		game.castle.push(b);
	game.sallying.length = 0;

	// withdraw all storming blocks to the field.
	game.storming.length = 0;

	if (is_contested_field(game.where)) {
		game.active = game.attacker[game.where];
		game.state = 'retreat';
		game.summary = [];
	} else if (is_under_siege(game.where)) {
		goto_siege_attrition();
	} else {
		end_combat();
	}
}

states.retreat = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to retreat.";
		view.prompt = "Retreat: Choose an army to move.";
		gen_action_undo(view);
		let can_retreat = false;
		for (let b in BLOCKS) {
			if (game.location[b] == game.where && !is_block_in_castle(b) && can_block_retreat(b)) {
				gen_action(view, 'block', b);
				can_retreat = true;
			}
		}
		if (!is_contested_field(game.where) || !can_retreat)
			gen_action(view, 'end_retreat');
	},
	end_retreat: function () {
		clear_undo();
		for (let b in BLOCKS)
			if (game.location[b] == game.where && !is_block_in_castle(b) && block_owner(b) == game.active)
				eliminate_block(b);
		print_summary(game.active + " retreat:");
		game.active = ENEMY[game.active];
		console.log("ATTACKER RETREATED FROM THE FIELD");
		goto_regroup();
	},
	block: function (who) {
		push_undo();
		game.who = who;
		game.state = 'retreat_to';
	},
	undo: pop_undo
}

states.retreat_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to retreat.";
		view.prompt = "Retreat: Move the army to a friendly or neutral town.";
		gen_action_undo(view);
		gen_action(view, 'block', game.who);
		let can_retreat = false;
		for (let to of TOWNS[game.where].exits) {
			if (can_block_retreat_to(game.who, to)) {
				gen_action(view, 'town', to);
				can_retreat = true;
			}
		}
		if (!can_retreat)
			gen_action(view, 'eliminate');
	},
	town: function (to) {
		let from = game.where;
		game.summary.push([from, to]);
		move_block(game.who, game.where, to);
		game.who = null;
		game.state = 'retreat';
	},
	eliminate: function () {
		eliminate_block(game.who);
		game.who = null;
		game.state = 'retreat';
	},
	block: pop_undo,
	undo: pop_undo
}

// SIEGE ATTRITION

function goto_siege_attrition() {
	console.log("SIEGE ATTRITION");
	game.active = besieging_player(game.where);
	for (let b in BLOCKS) {
		if (is_block_in_castle_in(b, game.where)) {
			let die = roll_d6();
			if (die <= 3) {
				log("Siege attrition: " + DIE_HIT[die] + ".");
				reduce_block(b);
			} else {
				log("Siege attrition: " + DIE_MISS[die] + ".");
			}
		}
	}
	if (!is_under_siege(game.where)) {
		log(game.where + " falls to siege attrition.");
		goto_regroup();
	} else {
		log("Siege continues.");
		end_combat();
	}
}

// FIELD AND STORM BATTLE HELPERS

function filter_battle_blocks(ci, is_candidate) {
	let output = null;
	for (let b in BLOCKS) {
		if (is_candidate(b) && !game.moved[b]) {
			if (block_initiative(b) == ci) {
				if (!output)
					output = [];
				output.push(b);
			}
		}
	}
	return output;
}

function battle_step(active, initiative, candidate) {
	game.battle_list = filter_battle_blocks(initiative, candidate);
	if (game.battle_list) {
		game.active = active;
		return true;
	}
	return false;
}

function pump_battle_step(is_candidate_attacker, is_candidate_defender) {
	let attacker = game.attacker[game.where];
	let defender = ENEMY[attacker];

	if (game.jihad == game.where && game.combat_round == 1) {
		if (battle_step(attacker, 'A', is_candidate_attacker)) return;
		if (battle_step(attacker, 'B', is_candidate_attacker)) return;
		if (battle_step(attacker, 'C', is_candidate_attacker)) return;
		if (battle_step(defender, 'A', is_candidate_defender)) return;
		if (battle_step(defender, 'B', is_candidate_defender)) return;
		if (battle_step(defender, 'C', is_candidate_defender)) return;
	} else {
		if (battle_step(defender, 'A', is_candidate_defender)) return;
		if (battle_step(attacker, 'A', is_candidate_attacker)) return;
		if (battle_step(defender, 'B', is_candidate_defender)) return;
		if (battle_step(attacker, 'B', is_candidate_attacker)) return;
		if (battle_step(defender, 'C', is_candidate_defender)) return;
		if (battle_step(attacker, 'C', is_candidate_attacker)) return;
	}

	next_combat_round();
}

// FIELD BATTLE

function goto_field_battle() {
	resume_field_battle();
}

function resume_field_battle() {
	game.active = game.p1;

	if (is_friendly_field(game.where)) {
		console.log("FIELD BATTLE WON BY", game.active);
		log("Field battle won by " + game.active + ".");
		return goto_regroup();
	}

	if (is_enemy_field(game.where)) {
		game.active = ENEMY[game.active];
		console.log("FIELD BATTLE WON BY", game.active);
		log("Field battle won by " + game.active + ".");
		return goto_regroup();
	}

	game.state = 'field_battle';
	pump_battle_step(is_field_attacker, is_field_defender);
}

states.field_battle = {
	show_battle: true,
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to choose a combat action.";
		view.prompt = "Field Battle: Choose a combat action.";
		for (let b of game.battle_list) {
			gen_action(view, 'block', b); // take default action
			gen_action(view, 'battle_fire', b);
			if (game.sallying.includes(b)) {
				// Only sallying forces may withdraw into the castle
				gen_action(view, 'battle_withdraw', b);
			} else {
				if (can_block_retreat(b)) {
					gen_action(view, 'battle_retreat', b);
					// Turcopoles and Nomads can Harry (fire and retreat)
					if (block_type(b) == 'turcopoles' || block_type(b) == 'nomads')
						gen_action(view, 'battle_harry', b);
				}

				// Defender refused siege, but can still withdraw into castle if friendly.
				if (game.active != game.attacker[game.where]) {
					if (game.sallying.length == 0) {
						let n = count_blocks_in_castle(game.where);
						if (n == 0) {
							gen_action(view, 'battle_withdraw', b);
						} else if (n < castle_limit(game.where)) {
							if (game.active == besieged_player(game.where))
								gen_action(view, 'battle_withdraw', b);
						}
					}
				}
			}
			// All Frank B blocks are knights who can Charge
			if (block_owner(b) == FRANKS && block_initiative(b) == 'B')
				gen_action(view, 'battle_charge', b);
		}
	},
	block: field_fire_with_block,
	battle_fire: field_fire_with_block,
	battle_withdraw: field_withdraw_with_block,
	battle_charge: charge_with_block,
	battle_harry: harry_with_block,
	battle_retreat: retreat_with_block,
}

// STORM BATTLE

function goto_storm_battle() {
	game.attacker[game.where] = besieging_player(game.where);
	console.log("STORM BATTLE", game.attacker[game.where]);
	resume_storm_battle();
}

function resume_storm_battle() {
	game.active = game.attacker[game.where];

	if (is_friendly_town(game.where)) {
		console.log("STORM BATTLE WON BY ATTACKER", game.active);
		log("Siege battle won by " + game.active + ".");
		return goto_regroup();
	}

	if (is_enemy_town(game.where)) {
		console.log("STORM BATTLE WON BY DEFENDER", ENEMY[game.active]);
		game.halfhit = null;
		log("Storming repulsed.");
		return next_combat_round();
	}

	game.state = 'storm_battle';
	pump_battle_step(is_storm_attacker, is_storm_defender);
}

states.storm_battle = {
	show_battle: true,
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to choose a combat action.";
		view.prompt = "Field Battle: Choose a combat action.";
		for (let b of game.battle_list) {
			gen_action(view, 'block', b); // take default action
			gen_action(view, 'battle_fire', b);
			if (game.storming.includes(b))
				gen_action(view, 'battle_retreat', b);
		}
	},
	block: storm_fire_with_block,
	battle_fire: storm_fire_with_block,
	battle_retreat: storm_withdraw_with_block,
}

// FIELD BATTLE HITS

function goto_field_battle_hits() {
	game.active = ENEMY[game.active];
	game.battle_list = list_field_victims();
	if (game.battle_list.length == 0)
		resume_field_battle();
	else
		game.state = 'field_battle_hits';
}

function list_field_victims() {
	let max = 0;
	for (let b in BLOCKS)
		if (block_owner(b) == game.active && is_field_combatant(b) && game.steps[b] > max)
			max = game.steps[b];
	let list = [];
	for (let b in BLOCKS)
		if (block_owner(b) == game.active && is_field_combatant(b) && game.steps[b] == max)
			list.push(b);
	return list;
}

states.field_battle_hits = {
	show_battle: true,
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to assign hits.";
		view.prompt = "Assign " + game.hits + (game.hits != 1 ? " hits" : " hit") + " to your armies.";
		for (let b of game.battle_list) {
			gen_action(view, 'battle_hit', b);
			gen_action(view, 'block', b);
		}
	},
	battle_hit: apply_field_battle_hit,
	block: apply_field_battle_hit,
}

function apply_field_battle_hit(who) {
	if (block_plural(who))
		game.flash = block_name(who) + " take a hit.";
	else
		game.flash = block_name(who) + " takes a hit.";
	reduce_block(who, 'combat');
	game.hits--;
	if (game.hits == 0)
		resume_field_battle();
	else {
		game.battle_list = list_field_victims();
		if (game.battle_list.length == 0)
			resume_field_battle();
		else
			game.flash += " " + game.hits + (game.hits == 1 ? " hit left." : " hits left.");
	}
}

// STORM BATTLE HITS

function goto_storm_battle_hits() {
	game.active = ENEMY[game.active];
	game.battle_list = list_storm_victims();
	if (game.battle_list.length == 0)
		resume_storm_battle();
	else
		game.state = 'storm_battle_hits';
}

function list_storm_victims() {
	if (game.halfhit)
		return [ game.halfhit ];
	let max = 0;
	for (let b in BLOCKS)
		if (block_owner(b) == game.active && is_storm_combatant(b) && game.steps[b] > max)
			max = game.steps[b];
	let list = [];
	for (let b in BLOCKS)
		if (block_owner(b) == game.active && is_storm_combatant(b) && game.steps[b] == max)
			list.push(b);
	return list;
}

states.storm_battle_hits = {
	show_battle: true,
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to assign hits.";
		view.prompt = "Assign " + game.hits + (game.hits != 1 ? " hits" : " hit") + " to your armies.";
		for (let b of game.battle_list) {
			gen_action(view, 'battle_hit', b);
			gen_action(view, 'block', b);
		}
	},
	battle_hit: apply_storm_battle_hit,
	block: apply_storm_battle_hit,
}

function apply_storm_battle_hit(who) {
	if (block_plural(who))
		game.flash = block_name(who) + " take a hit.";
	else
		game.flash = block_name(who) + " takes a hit.";
	if (game.halfhit == who) {
		reduce_block(who, 'combat');
		game.halfhit = null;
	} else {
		if (is_block_in_castle(who))
			game.halfhit = who;
		else
			reduce_block(who, 'combat');
	}
	game.hits--;

	if (game.hits == 0) {
		resume_storm_battle();
	} else {
		game.battle_list = list_storm_victims();
		if (game.battle_list.length == 0) {
			resume_storm_battle();
		} else {
			game.flash += " " + game.hits + (game.hits == 1 ? " hit left." : " hits left.");
		}
	}
}

// BATTLE ACTIONS

function roll_attack(active, b, verb, is_charge) {
	game.hits = 0;
	let fire = block_fire_power(b, game.where) + is_charge;
	let printed_fire = block_printed_fire_power(b);
	let rolls = [];
	let steps = game.steps[b];
	let name = block_name(b) + " " + BLOCKS[b].combat;
	let self = 0;
	if (fire > printed_fire)
		name += "+" + (fire - printed_fire);
	for (let i = 0; i < steps; ++i) {
		let die = roll_d6();
		if (die <= fire) {
			rolls.push(DIE_HIT[die]);
			++game.hits;
		} else {
			if (is_charge && die == 6) {
				rolls.push(DIE_SELF);
				++self;
			} else {
				rolls.push(DIE_MISS[die]);
			}
		}
	}

	game.flash = name + " " + verb + " " + rolls.join(" ") +  " ";
	if (block_plural(b)) {
		if (game.hits == 0)
			game.flash += "and miss.";
		else if (game.hits == 1)
			game.flash += "and score 1 hit.";
		else
			game.flash += "and score " + game.hits + " hits.";
	} else {
		if (game.hits == 0)
			game.flash += "and misses.";
		else if (game.hits == 1)
			game.flash += "and scores 1 hit.";
		else
			game.flash += "and scores " + game.hits + " hits.";
	}

	if (self > 0) {
		if (self == 1)
			game.flash += " " + self + " self hit.";
		else
			game.flash += " " + self + " self hits.";
		self = Math.min(self, game.steps[b]);
		while (self-- > 0)
			reduce_block(b);
	}

	log(active[0] + ": " + name + " " + verb + " " + rolls.join("") + ".");
}

function field_fire_with_block(b) {
	game.moved[b] = true;
	if (block_plural(b))
		roll_attack(game.active, b, "fire", 0);
	else
		roll_attack(game.active, b, "fires", 0);
	if (game.hits > 0) {
		goto_field_battle_hits();
	} else {
		resume_field_battle();
	}
}

function storm_fire_with_block(b) {
	game.moved[b] = true;
	if (block_plural(b))
		roll_attack(game.active, b, "fire", 0);
	else
		roll_attack(game.active, b, "fires", 0);
	if (game.hits > 0) {
		goto_storm_battle_hits();
	} else {
		resume_storm_battle();
	}
}

function charge_with_block(b) {
	game.moved[b] = true;
	if (block_plural(b))
		roll_attack(game.active, b, "charge", 1);
	else
		roll_attack(game.active, b, "charges", 1);
	if (game.hits > 0) {
		goto_field_battle_hits();
	} else {
		resume_field_battle();
	}
}

function field_withdraw_with_block(b) {
	if (block_plural(b))
		game.flash = b + " withdraw.";
	else
		game.flash = b + " withdraws.";
	log(game.active[0] + ": " + game.flash);
	game.moved[b] = true;
	remove_from_array(game.sallying, b);
	game.castle.push(b);
	resume_field_battle();
}

function storm_withdraw_with_block(b) {
	if (block_plural(b))
		game.flash = b + " withdraw.";
	else
		game.flash = b + " withdraws.";
	log(game.active[0] + ": " + game.flash);
	game.moved[b] = true;
	remove_from_array(game.storming, b);
	resume_storm_battle();
}

function harry_with_block(b) {
	// TODO: fire, hits, retreat OR fire, retreat, hits order ?
	if (block_plural(b))
		roll_attack(game.active, b, "harry", 0);
	else
		roll_attack(game.active, b, "harries", 0);
	game.who = b;
	game.state = 'harry';
}

states.harry = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to harry.";
		view.prompt = "Harry: Move the army to a friendly or vacant town.";
		for (let to of TOWNS[game.where].exits)
			if (can_block_retreat_to(game.who, to))
				gen_action(view, 'town', to);
	},
	town: function (to) {
		if (block_plural(game.who))
			game.flash = block_name(game.who) + " retreat.";
		else
			game.flash = block_name(game.who) + " retreats.";
		log(game.active + " retreat to " + to + ".");
		game.location[game.who] = to;
		move_block(game.who, game.where, to);
		game.who = null;
		if (game.hits > 0) {
			goto_field_battle_hits();
		} else {
			resume_field_battle();
		}
	},
}

function retreat_with_block(b) {
	game.who = b;
	game.state = 'retreat_in_battle';
}

states.retreat_in_battle = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to retreat.";
		gen_action(view, 'undo');
		gen_action(view, 'block', game.who);
		view.prompt = "Retreat: Move the army to a friendly or vacant town.";
		for (let to of TOWNS[game.where].exits)
			if (can_block_retreat_to(game.who, to))
				gen_action(view, 'town', to);
	},
	town: function (to) {
		if (block_plural(game.who))
			game.flash = block_name(game.who) + " retreat.";
		else
			game.flash = block_name(game.who) + " retreats.";
		log(game.active + " retreat to " + to + ".");
		game.location[game.who] = to;
		move_block(game.who, game.where, to);
		game.who = null;
		resume_field_battle();
	},
	block: function () {
		game.who = null;
		resume_field_battle();
	},
	undo: function () {
		game.who = null;
		resume_field_battle();
	}
}

// DRAW PHASE

function goto_draw_phase() {
	delete game.combat_list;
	end_game_turn();
}

// GAME OVER

function goto_game_over() {
	game.active = "None";
	game.state = 'game_over';
}

states.game_over = {
	prompt: function (view, current) {
		view.prompt = game.victory;
	}
}

// SETUP

function deploy(who, where) {
	game.location[who] = where;
	game.steps[who] = block_max_steps(who);
}

function reset_blocks() {
	for (let b in BLOCKS) {
		game.location[b] = null;
		game.steps[b] = block_max_steps(b);
	}
}

function setup_game() {
	reset_blocks();
	game.year = 1187;
	for (let b in BLOCKS) {
		if (block_owner(b) == FRANKS) {
			switch (block_type(b)) {
			case 'pilgrims':
			case 'crusaders':
				deploy(b, block_pool(b));
				break;
			default:
				deploy(b, block_home(b));
				break;
			}
		}
		if (block_owner(b) == SARACENS) {
			if (block_type(b) == 'emirs')
				deploy(b, block_home(b));
			if (block_type(b) == 'nomads')
				deploy(b, block_pool(b));
		}
		if (block_owner(b) == ASSASSINS) {
			deploy(b, block_home(b));
		}
	}
}

// VIEW

function compare_block_initiative(a, b) {
	let aa = BLOCKS[a].combat;
	let bb = BLOCKS[b].combat;
	return (aa < bb) ? -1 : (aa > bb) ? 1 : 0;
}

function make_battle_view() {
	let castle_owner = besieged_player(game.where);
	if (!castle_owner)
		castle_owner = ENEMY[game.attacker[game.where]];

	let battle = {
		FR: [], FC: [], FF: [],
		SR: [], SC: [], SF: [],
		FCS: (castle_owner == FRANKS) ? castle_limit(game.where) : 0,
		SCS: (castle_owner == SARACENS) ? castle_limit(game.where) : 0,
		storming: game.storming,
		sallying: game.sallying,
		halfhit: game.halfhit,
		flash: game.flash,
	};

	battle.title = game.attacker[game.where] + " attack " + game.where;
	if (game.combat_round == 0) {
		battle.title += " \u2014 combat deployment";
	}

	function fill_cell(cell, owner, fn) {
		for (let b in BLOCKS)
			if (game.location[b] == game.where & block_owner(b) == owner && fn(b))
				cell.push([b, game.steps[b], game.moved[b]?1:0])
		// cell.sort((a,b) => compare_block_initiative(a[0], b[0]));
	}

	fill_cell(battle.FR, FRANKS, b => is_battle_reserve(b));
	fill_cell(battle.FC, FRANKS, b => is_block_in_castle(b));
	fill_cell(battle.FF, FRANKS, b => is_block_in_field(b) && !game.storming.includes(b));
	fill_cell(battle.FF, SARACENS, b => is_block_in_field(b) && game.storming.includes(b));
	fill_cell(battle.SF, FRANKS, b => is_block_in_field(b) && game.storming.includes(b));
	fill_cell(battle.SF, SARACENS, b => is_block_in_field(b) && !game.storming.includes(b));
	fill_cell(battle.SC, SARACENS, b => is_block_in_castle(b));
	fill_cell(battle.SR, SARACENS, b => is_battle_reserve(b));

	return battle;
}

exports.ready = function (scenario, players) {
	return players.length === 2;
}

exports.setup = function (scenario, players) {
	game = {
		attacker: {},
		road_limit: {},
		last_used: {},
		location: {},
		castle: [],
		log: [],
		main_road: {},
		moved: {},
		moves: 0,
		prompt: null,
		reserves1: [],
		reserves2: [],
		show_cards: false,
		steps: {},
		who: null,
		where: null,
		undo: [],
	}
	setup_game();
	start_year();
	return game;
}

exports.action = function (state, current, action, arg) {
	game = state;
	// TODO: check action and argument against action list
	if (is_active_player(current)) {
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
		game.active = "None";
		game.state = 'game_over';
		game.victory = current + " resigned.";
		game.result = ENEMY[current];
	}
}

function make_siege_view() {
	let list = {};
	for (let t in TOWNS)
		if (is_under_siege(t))
			list[t] = besieging_player(t);
	return list;
}

exports.view = function(state, current) {
	game = state;

	let view = {
		log: game.log,
		year: game.year,
		turn: game.turn,
		active: game.active,
		f_card: (game.show_cards || current == FRANKS) ? game.f_card : 0,
		s_card: (game.show_cards || current == SARACENS) ? game.s_card : 0,
		hand: (current == FRANKS) ? game.f_hand : (current == SARACENS) ? game.s_hand : [],
		who: (game.active == current) ? game.who : null,
		location: game.location,
		castle: game.castle,
		steps: game.steps,
		reserves: game.reserves1.concat(game.reserves2),
		moved: game.moved,
		sieges: make_siege_view(),
		battle: null,
		prompt: null,
		actions: null,
	};

	states[game.state].prompt(view, current);

	if (states[game.state].show_battle)
		view.battle = make_battle_view();

	return view;
}
