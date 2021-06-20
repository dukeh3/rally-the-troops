"use strict";

// TODO: frank seat adjustment at setup
// TODO: saladin seat adjustment at setup

// TODO: optional rule - iron bridge
// TODO: optional rule - force marches

exports.scenarios = [
	"Third Crusade"
];

const { CARDS, BLOCKS, TOWNS, PORTS, ROADS } = require('./data');

const FRANK = "Frank";
const SARACEN = "Saracen";
const ASSASSINS = "Assassins";
const ENEMY = { Frank: "Saracen", Saracen: "Frank" };
const OBSERVER = "Observer";
const BOTH = "Both";
const DEAD = "Dead";
const F_POOL = "FP";
const S_POOL = "SP";

// serif cirled numbers
const DIE_HIT = [ 0, '\u2776', '\u2777', '\u2778', '\u2779', '\u277A', '\u277B' ];
const DIE_MISS = [ 0, '\u2460', '\u2461', '\u2462', '\u2463', '\u2464', '\u2465' ];

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

function logp(...args) {
	let s = game.active + " " + Array.from(args).join("");
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
		game.turn_log.push(game.move_buf);
	delete game.move_buf;
}

function print_turn_log_no_count(text) {
	function print_move(last) {
		return "\n" + last.join(" \u2192 ");
	}
	if (game.turn_log.length > 0) {
		game.turn_log.sort();
		for (let entry of game.turn_log)
			text += print_move(entry);
	} else {
		text += "\nnothing.";
	}
	log(text);
	delete game.turn_log;
}

function print_turn_log(text) {
	function print_move(last) {
		return "\n" + n + " - " + last.join(" \u2192 ");
	}
	game.turn_log.sort();
	let last = game.turn_log[0];
	let n = 0;
	for (let entry of game.turn_log) {
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
	delete game.turn_log;
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
	if (BLOCKS[who].owner == FRANK)
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

function is_block_on_map(who) {
	let location = game.location[who];
	return location && location != DEAD && location != F_POOL && location != S_POOL;
}

function can_activate(who) {
	return block_owner(who) == game.active && is_block_on_map(who) && !game.moved[who];
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

function count_enemy_excluding_reserves(where) {
	let p = ENEMY[game.active];
	let count = 0;
	for (let b in BLOCKS)
		if (game.location[b] == where && block_owner(b) == p)
			if (!is_battle_reserve(b))
				++count;
	return count;
}

function is_friendly_town(where) { return count_friendly(where) > 0 && count_enemy(where) == 0; }
function is_enemy_town(where) { return count_friendly(where) == 0 && count_enemy(where) > 0; }
function is_vacant_town(where) { return count_friendly(where) == 0 && count_enemy(where) == 0; }
function is_contested_town(where) { return count_friendly(where) > 0 && count_enemy(where) > 0; }
function is_friendly_or_vacant_town(where) { return is_friendly_town(where) || is_vacant_town(where); }

function is_fortified_port(where) {
	return TOWNS[where].fortified_port;
}

function is_port(where) {
	return TOWNS[where].port;
}

function is_friendly_port(where) {
	// TODO: Tripoli/Tyre are friendly to besieged defender!
	return TOWNS[where].port && is_friendly_town(where);
}

function have_contested_towns() {
	for (let where in TOWNS)
		if (is_contested_town(where))
			return true;
	return false;
}

function count_pinning(where) {
	return count_enemy_excluding_reserves(where);
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
	switch (road_type(from, to)) {
	case 'major': return road_limit(from, to) < 4;
	case 'minor': return road_limit(from, to) < 2;
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

function can_block_sea_move_to(who, from, to) {
	if (is_port(to)) {
		// English Crusaders may attack by sea if they are the Main Attacker
		if (who == "Richard" || who == "Robert" || who == "Crossbows") {
			if (game.attacker[to] != FRANK)
				return false;
			if (game.main_road[to] != "England")
				return false;
			return true;
		}
		return is_friendly_port(to);
	}
	return false;
}

function can_block_sea_move(who) {
	if (can_activate(who)) {
		let from = game.location[who];
		if (is_friendly_port(from)) {
			for (let to of PORTS)
				if (to != from && can_block_sea_move_to(who, from, to))
					return true;
		}
	}
	return false;
}

function can_block_continue(who, from, to) {
	if (is_contested_town(to))
		return false;
	if (game.distance >= block_move(who))
		return false;
	return true;
}

function can_block_retreat_to(who, to) {
	if (is_friendly_town(to) || is_vacant_town(to)) {
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
	if (is_friendly_town(to) || is_vacant_town(to)) {
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
	return can_block_use_road(from, to) && is_friendly_or_vacant_town(to);
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

function disband(who) {
	if (block_plural(who))
		log(block_name(who) + " disband.");
	else
		log(block_name(who) + " disbands.");
	game.location[who] = block_pool(who);
	game.steps[who] = block_max_steps(who);
}

function eliminate_block(who) {
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

function count_attackers() {
	let count = 0;
	for (let b in BLOCKS)
		if (is_attacker(b))
			++count;
	return count;
}

function count_defenders() {
	let count = 0;
	for (let b in BLOCKS)
		if (is_defender(b))
			++count;
	return count;
}

// GAME TURN

function start_year() {
	log("");
	log("Start Year " + game.year + ".");

	let deck = shuffle_deck();
	game.f_hand = deal_cards(deck, 6);
	game.s_hand = deal_cards(deck, 6);

	start_game_turn();
}

function start_game_turn() {
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
	if (game.f_hand.length > 0)
		start_game_turn()
	else
		goto_winter_turn();
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
		if (current == FRANK) {
			if (game.f_card) {
				view.prompt = "Waiting for Saracen to play a card.";
				gen_action(view, 'undo');
			} else {
				view.prompt = "Play a card.";
				for (let c of game.f_hand)
					gen_action(view, 'play', c);
			}
		}
		if (current == SARACEN) {
			if (game.s_card) {
				view.prompt = "Waiting for Frank to play a card.";
				gen_action(view, 'undo');
			} else {
				view.prompt = "Play a card.";
				for (let c of game.s_hand)
					gen_action(view, 'play', c);
			}
		}
	},
	play: function (card, current) {
		if (current == FRANK) {
			remove_from_array(game.f_hand, card);
			game.f_card = card;
		}
		if (current == SARACEN) {
			remove_from_array(game.s_hand, card);
			game.s_card = card;
		}
		if (game.s_card > 0 && game.f_card > 0)
			reveal_cards();
	},
	undo: function (_, current) {
		if (current == FRANK) {
			game.f_hand.push(game.f_card);
			game.f_card = 0;
		}
		if (current == SARACEN) {
			game.s_hand.push(game.s_card);
			game.s_card = 0;
		}
	}
}

function reveal_cards() {
	log("Frank plays " + CARDS[game.f_card].name + ".");
	log("Saracen plays " + CARDS[game.s_card].name + ".");
	game.show_cards = true;

	let fc = CARDS[game.f_card];
	let sc = CARDS[game.s_card];

	if (fc.event && sc.event) {
		log("Game Turn is cancelled.");
		end_game_turn();
		return;
	}

	let fp = fc.moves;
	let sp = sc.moves;
	if (fp == sp) {
		if (roll_d6() > 3)
			++fp;
		else
			++sp;
	}

	if (fp > sp) {
		game.p1 = FRANK;
		game.p2 = SARACEN;
	} else {
		game.p1 = SARACEN;
		game.p2 = FRANK;
	}

	game.active = game.p1;
	start_player_turn();
}

function start_player_turn() {
	log("");
	log("Start " + game.active + " turn.");
	reset_road_limits();
	let card = CARDS[game.active == FRANK ? game.f_card : game.s_card];
	if (card.event)
		goto_event_card(card.event);
	else
		goto_move_phase(card.moves);
}

function end_player_turn() {
	game.moves = 0;
	game.activated = null;
	game.mustered = null;
	game.main_road = null;

	if (game.active == game.p2) {
		goto_battle_phase();
	} else {
		game.active = game.p2;
		start_player_turn();
	}
}

// EVENTS

function goto_event_card(event) {
	end_player_turn();
}

// MOVE PHASE

function move_block(who, from, to) {
	game.location[who] = to;
	game.road_limit[road_id(from, to)] = road_limit(from, to) + 1;
	game.distance ++;
	if (is_contested_town(to)) {
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
	game.state = 'group_move';
	game.moves = moves;
	game.activated = [];
	game.mustered = [];
	game.main_road = {};
	game.turn_log = [];
}

function end_move_phase() {
	game.moves = 0;
	clear_undo();
	print_turn_log(game.active + " moves:");
	end_player_turn();
}

states.group_move = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Move Phase: Waiting for " + game.active + ".";
		view.prompt = "Group Move: Choose a block to group move. " + game.moves + "AP left.";
		gen_action_undo(view);
		gen_action(view, 'end_move_phase');
		if (can_muster_anywhere())
			gen_action(view, 'muster');
		if (can_sea_move_anywhere())
			gen_action(view, 'sea_move');
		if (game.moves > 0) {
			for (let b in BLOCKS)
				if (can_block_land_move(b))
					gen_action(view, 'block', b);
		} else {
			for (let b in BLOCKS) {
				let from = game.location[b];
				if (game.activated.includes(from))
					if (can_block_land_move(b))
						gen_action(view, 'block', b);
			}
		}
	},
	block: function (who) {
		push_undo();
		game.who = who;
		game.origin = game.location[who];
		game.distance = 0;
		game.last_from = null;
		game.state = 'group_move_to';
	},
	sea_move: function () {
		push_undo();
		game.state = 'sea_move';
	},
	muster: function () {
		push_undo();
		game.state = 'muster';
	},
	end_move_phase: end_move_phase,
	undo: pop_undo
}

states.group_move_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move.";
		view.prompt = "Group Move: Move " + block_name(game.who) + ".";
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
	if (game.distance > 0) {
		let to = game.location[game.who];
		if (!game.activated.includes(game.origin)) {
			logp("activates " + game.origin + ".");
			game.activated.push(game.origin);
			game.moves --;
		}
		game.moved[game.who] = true;
	}
	log_move_end();
	game.who = null;
	game.distance = 0;
	game.origin = null;
	game.state = 'group_move';
}

function can_sea_move_anywhere() {
	if (game.moves > 0) {
		for (let b in BLOCKS)
			if (can_block_sea_move(b))
				return true;
	}
	return false;
}

states.sea_move = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Move Phase: Waiting for " + game.active + ".";
		view.prompt = "Sea Move: Choose a block to sea move. " + game.moves + "AP left.";
		gen_action_undo(view);
		if (game.moves > 0) {
			for (let b in BLOCKS)
				if (can_block_sea_move(b))
					gen_action(view, 'block', b);
		}
	},
	block: function (who) {
		push_undo();
		game.who = who;
		game.state = 'sea_move_to';
	},
	undo: pop_undo
}

states.sea_move_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move.";
		view.prompt = "Sea Move " + block_name(game.who) + ".";
		gen_action_undo(view);
		gen_action(view, 'block', game.who);
		let from = game.location[game.who];
		for (let to of PORTS)
			if (to != from && can_block_sea_move_to(game.who, from, to))
				gen_action(view, 'town', to);
	},
	town: function (to) {
		--game.moves;
		let from = game.location[game.who];
		game.location[game.who] = to;
		game.moved[game.who] = true;
		log_move_start(from);
		log_move_continue("Sea");

		// English Crusaders attack!
		if (is_contested_town(to)) {
			game.attacker[to] = FRANK;
			game.main_road[to] = "England";
			log_move_continue(to + ATTACK_MARK);
		} else {
			log_move_continue(to);
		}

		game.state = 'group_move';
		game.who = null;
	},
	block: pop_undo,
	undo: pop_undo
}

function can_muster_anywhere() {
	if (game.moves > 0)
		return true;
	for (let where of game.mustered) {
		if (is_friendly_town(where))
			if (can_muster_to(where))
				return true;
	}
	return false;
}

states.muster = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move.";
		view.prompt = "Muster: Choose one friendly or vacant muster town. " + game.moves + "AP left.";
		gen_action_undo(view);
		gen_action(view, 'end_muster');
		if (game.moves > 0) {
			for (let where in TOWNS) {
				if (is_friendly_town(where))
					if (can_muster_to(where))
						gen_action(view, 'town', where);
			}
		} else {
			for (let where of game.mustered) {
				if (is_friendly_town(where))
					if (can_muster_to(where))
						gen_action(view, 'town', where);
			}
		}
	},
	town: function (where) {
		push_undo();
		game.where = where;
		game.state = 'muster_who';
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
		game.where = null;
		game.state = 'group_move';
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
	if (!game.mustered.includes(muster)) {
		logp("musters to " + muster + ".");
		game.mustered.push(muster);
		--game.moves;
	}
}

// BATTLE PHASE

function goto_battle_phase() {
	game.moved = {};
	if (have_contested_towns()) {
		game.active = game.p1;
		game.state = 'battle_phase';
	} else {
		goto_draw_phase();
	}
}

states.battle_phase = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to choose a battle.";
		view.prompt = "Choose the next battle to fight!";
		for (let where in TOWNS)
			if (is_contested_town(where))
				gen_action(view, 'town', where);
	},
	town: function (where) {
		start_battle(where);
	},
}

function start_battle(where) {
	game.flash = "";
	log("");
	log("Battle in " + where + ".");
	game.where = where;
	game.battle_round = 0;
	game.state = 'battle_round';
	start_battle_round();
}

function resume_battle() {
	game.who = null;
	if (game.victory)
		return goto_game_over();
	game.state = 'battle_round';
	pump_battle_round();
}

function end_battle() {
	game.flash = "";
	game.battle_round = 0;
	reset_road_limits();
	game.moved = {};

	game.active = game.attacker[game.where];
	let victor = game.active;
	if (is_contested_town(game.where))
		victor = ENEMY[game.active];
	else if (is_enemy_town(game.where))
		victor = ENEMY[game.active];
	log(victor + " wins the battle in " + game.where + "!");

	goto_retreat();
}

function bring_on_reserves(round) {
	for (let b in BLOCKS) {
		if (game.location[b] == game.where) {
			if (round == 2)
				remove_from_array(game.reserves1, b);
			else if (round == 3)
				remove_from_array(game.reserves2, b);
		}
	}
}

function start_battle_round() {
	if (++game.battle_round <= 3) {
		log("~ Battle Round " + game.battle_round + " ~");

		reset_road_limits();
		game.moved = {};

		if (game.battle_round == 2) {
			if (count_defenders() == 0) {
				log("Defending main force was eliminated.");
				log("The attacker is now the defender.");
				game.attacker[game.where] = ENEMY[game.attacker[game.where]];
			} else if (count_attackers() == 0) {
				log("Attacking main force was eliminated.");
			}
			bring_on_reserves(2);
		}

		if (game.battle_round == 3) {
			bring_on_reserves(3);
		}

		pump_battle_round();
	} else {
		end_battle();
	}
}

function pump_battle_round() {
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

	if (is_friendly_town(game.where) || is_enemy_town(game.where)) {
		end_battle();
	} else if (count_attackers() == 0 || count_defenders() == 0) {
		start_battle_round();
	} else {
		let attacker = game.attacker[game.where];
		let defender = ENEMY[attacker];

		if (battle_step(defender, 'A', is_defender)) return;
		if (battle_step(attacker, 'A', is_attacker)) return;
		if (battle_step(defender, 'B', is_defender)) return;
		if (battle_step(attacker, 'B', is_attacker)) return;
		if (battle_step(defender, 'C', is_defender)) return;
		if (battle_step(attacker, 'C', is_attacker)) return;

		start_battle_round();
	}
}

function retreat_with_block(b) {
	game.who = b;
	game.state = 'retreat_in_battle';
}

function roll_attack(active, b, verb) {
	game.hits = 0;
	let fire = block_fire_power(b, game.where);
	let printed_fire = block_printed_fire_power(b);
	let rolls = [];
	let steps = game.steps[b];
	let name = block_name(b) + " " + BLOCKS[b].combat;
	if (fire > printed_fire)
		name += "+" + (fire - printed_fire);
	for (let i = 0; i < steps; ++i) {
		let die = roll_d6();
		if (die <= fire) {
			rolls.push(DIE_HIT[die]);
			++game.hits;
		} else {
			rolls.push(DIE_MISS[die]);
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

	log(active[0] + ": " + name + " " + verb + " " + rolls.join("") + ".");
}

function fire_with_block(b) {
	game.moved[b] = true;
	console.log ("fire", block_plural(b));
	if (block_plural(b))
		roll_attack(game.active, b, "fire");
	else
		roll_attack(game.active, b, "fires");
	if (game.hits > 0) {
		game.active = ENEMY[game.active];
		goto_battle_hits();
	} else {
		resume_battle();
	}
}

states.battle_round = {
	show_battle: true,
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to choose a combat action.";
		view.prompt = "Battle: Charge, Fire, Harry, or Retreat with an army.";
		for (let b of game.battle_list) {
			gen_action(view, 'block', b); // take default action
			gen_action(view, 'battle_fire', b);
			gen_action(view, 'battle_retreat', b);
			// Turcopoles and Nomads can Harry (fire and retreat)
			if (block_type(b) == 'turcopoles' || block_type(b) == 'nomads')
				gen_action(view, 'battle_harry', b);
			// All Frank B blocks are knights who can Charge
			if (block_owner(b) == FRANK && block_initiative(b) == 'B')
				gen_action(view, 'battle_charge', b);
		}
	},
	battle_charge: function (who) {
		charge_with_block(who);
	},
	battle_fire: function (who) {
		fire_with_block(who);
	},
	battle_harry: function (who) {
		harry_with_block(who);
	},
	battle_retreat: function (who) {
		retreat_with_block(who);
	},
	block: function (who) {
		fire_with_block(who);
	},
}

function goto_battle_hits() {
	game.battle_list = list_victims(game.active);
	if (game.battle_list.length == 0)
		resume_battle();
	else
		game.state = 'battle_hits';
}

function apply_hit(who) {
	if (block_plural(who))
		game.flash = block_name(who) + " take a hit.";
	else
		game.flash = block_name(who) + " takes a hit.";
	reduce_block(who, 'combat');
	game.hits--;
	if (game.hits == 0)
		resume_battle();
	else {
		game.battle_list = list_victims(game.active);
		if (game.battle_list.length == 0)
			resume_battle();
		else
			game.flash += " " + game.hits + (game.hits == 1 ? " hit left." : " hits left.");
	}
}

function list_victims(p) {
	let is_candidate = (p == game.attacker[game.where]) ? is_attacker : is_defender;
	let max = 0;
	for (let b in BLOCKS)
		if (is_candidate(b) && game.steps[b] > max)
			max = game.steps[b];
	let list = [];
	for (let b in BLOCKS)
		if (is_candidate(b) && game.steps[b] == max)
			list.push(b);
	return list;
}

states.battle_hits = {
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
	battle_hit: function (who) {
		apply_hit(who);
	},
	block: function (who) {
		apply_hit(who);
	},
}

function goto_retreat() {
	game.active = game.attacker[game.where];
	if (is_contested_town(game.where)) {
		game.state = 'retreat';
		game.turn_log = [];
		clear_undo();
	} else {
		clear_undo();
		goto_regroup();
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
			if (game.location[b] == game.where && can_block_retreat(b)) {
				gen_action(view, 'block', b);
				can_retreat = true;
			}
		}
		if (!is_contested_town(game.where) || !can_retreat)
			gen_action(view, 'end_retreat');
	},
	end_retreat: function () {
		for (let b in BLOCKS)
			if (game.location[b] == game.where && block_owner(b) == game.active)
				eliminate_block(b);
		print_turn_log(game.active + " retreats:");
		clear_undo();
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
		game.turn_log.push([from, to]);
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
		logp("retreats to " + to + ".");
		game.location[game.who] = to;
		resume_battle();
	},
	eliminate: function () {
		eliminate_block(game.who);
		resume_battle();
	},
	block: function (to) {
		resume_battle();
	},
	undo: function () {
		resume_battle();
	}
}

function goto_regroup() {
	game.active = game.attacker[game.where];
	if (is_enemy_town(game.where))
		game.active = ENEMY[game.active];
	game.state = 'regroup';
	game.turn_log = [];
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
		print_turn_log(game.active + " regroups:");
		game.where = null;
		clear_undo();
		goto_battle_phase();
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
		game.turn_log.push([from, to]);
		move_block(game.who, game.where, to);
		game.who = null;
		game.state = 'regroup';
	},
	block: pop_undo,
	undo: pop_undo
}

// DRAW PHASE

function goto_draw_phase() {
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
		if (block_owner(b) == FRANK) {
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
		if (block_owner(b) == SARACEN) {
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

function make_battle_view() {
	let battle = {
		FA: [], FB: [], FC: [], FR: [],
		SA: [], SB: [], SC: [], SR: [],
		flash: game.flash
	};

	battle.title = game.attacker[game.where] + " attacks " + game.where;
	battle.title += " \u2014 round " + game.battle_round + " of 3";

	function fill_cell(cell, owner, fn) {
		for (let b in BLOCKS)
			if (game.location[b] == game.where & block_owner(b) == owner && fn(b))
				cell.push([b, game.steps[b], game.moved[b]?1:0])
	}

	fill_cell(battle.FR, FRANK, b => is_battle_reserve(b));
	fill_cell(battle.FA, FRANK, b => !is_battle_reserve(b) && block_initiative(b) == 'A');
	fill_cell(battle.FB, FRANK, b => !is_battle_reserve(b) && block_initiative(b) == 'B');
	fill_cell(battle.FC, FRANK, b => !is_battle_reserve(b) && block_initiative(b) == 'C');

	fill_cell(battle.SR, SARACEN, b => is_battle_reserve(b));
	fill_cell(battle.SA, SARACEN, b => !is_battle_reserve(b) && block_initiative(b) == 'A');
	fill_cell(battle.SB, SARACEN, b => !is_battle_reserve(b) && block_initiative(b) == 'B');
	fill_cell(battle.SC, SARACEN, b => !is_battle_reserve(b) && block_initiative(b) == 'C');

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
		castle: {},
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

exports.view = function(state, current) {
	game = state;

	let view = {
		log: game.log,
		year: game.year,
		active: game.active,
		f_card: (game.show_cards || current == FRANK) ? game.f_card : 0,
		s_card: (game.show_cards || current == SARACEN) ? game.s_card : 0,
		hand: (current == FRANK) ? game.f_hand : (current == SARACEN) ? game.s_hand : [],
		who: (game.active == current) ? game.who : null,
		location: game.location,
		castle: game.castle,
		steps: game.steps,
		reserves: game.reserves1.concat(game.reserves2),
		moved: game.moved,
		battle: null,
		prompt: null,
		actions: null,
	};

	states[game.state].prompt(view, current);

	if (states[game.state].show_battle)
		view.battle = make_battle_view();

	return view;
}
