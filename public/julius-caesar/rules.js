"use strict";

exports.scenarios = [
	"Historical",
	"Tournament",
	// TODO: Free Deployment
	// TODO: Avalon Digital scenarios?
];

const { CARDS, SPACES, EDGES, BLOCKS } = require('./data');

const APOLLO = 1;

const CAESAR = "Caesar";
const POMPEIUS = "Pompeius";
const CLEOPATRA = "Cleopatra";
const OCTAVIAN = "Octavian";
const BRUTUS = "Brutus";
const ANTONIUS = "Antonius";
const SCIPIO = "Scipio";

const ALEXANDRIA = "Alexandria";
const ROMA = "Roma";
const DEAD = "Dead";
const LEVY = "Levy";

// serif cirled numbers
const DIE_HIT = [ 0, '\u2776', '\u2777', '\u2778', '\u2779', '\u277A', '\u277B' ];
const DIE_MISS = [ 0, '\u2460', '\u2461', '\u2462', '\u2463', '\u2464', '\u2465' ];

const ATTACK_MARK = "*";
const RESERVE_MARK = "";

let game = null;

function log(...args) {
	let s = Array.from(args).join("");
	game.log.push(s);
}

function log_battle(...args) {
	let s = Array.from(args).join("");
	game.log.push(game.active[0] + ": " + s);
}

function logp(...args) {
	let s = Array.from(args).join("");
	game.log.push(game.active + " " + s);
}

function log_move_start(from, to, mark = false) {
	if (mark)
		game.turn_buf = [ from, to + mark ];
	else
		game.turn_buf = [ from, to ];
}

function log_move_continue(to, mark = false) {
	if (mark)
		game.turn_buf.push(to + mark);
	else
		game.turn_buf.push(to);
}

function log_move_end() {
	if (game.turn_buf) {
		game.turn_log.push(game.turn_buf);
		delete game.turn_buf;
	}
}

function log_levy(where) {
	game.turn_log.push([where]);
}

function print_turn_log(verb) {
	function print_move(last) {
		return "\n" + n + " " + last.join(" \u2192 ");
	}
	let text = game.active + " " + verb + ":";
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
	return (current == game.active) || (game.active == "Both" && (current == CAESAR || current == POMPEIUS));
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

function edge_id(A, B) {
	if (A > B)
		return B + "/" + A;
	return A + "/" + B;
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

function reset_road_limits() {
	game.sea_moved = {};
	game.sea_retreated = false;
	game.limits = {};
}

function road_limit(e) {
	return game.limits[e]|0;
}

function move_to(who, from, to) {
	let e = edge_id(from, to);
	game.location[who] = to;
	game.last_from = from;
	game.limits[e] = road_limit(e) + 1;
	if (is_contested_space(to))
		game.last_used[e] = game.active;
}

function block_owner(who) {
	if (who in game.owner)
		return game.owner[who];
	return BLOCKS[who].owner;
}

function block_name(who) {
	return BLOCKS[who].name;
}

function block_type(who) {
	return BLOCKS[who].type;
}

function block_initiative(who) {
	if (block_type(who) == 'ballista')
		return is_defender(who) ? 'B' : 'D';
	return BLOCKS[who].initiative;
}

function block_fire_power(who) {
	return BLOCKS[who].firepower;
}

function block_strength(who) {
	if (block_type(who) == 'elephant')
		return game.steps[who] * 2;
	return game.steps[who];
}

function is_dead(b) {
	return game.location[b] == DEAD;
}

function eliminate_block(who) {
	if (who == CLEOPATRA) {
		let new_owner = enemy(game.owner[who]);
		game.flash = "Cleopatra is captured.";
		log("Cleopatra joins " + new_owner + "!");
		game.owner[who] = new_owner;
	} else {
		game.flash = block_name(who) + " is eliminated.";
		log(block_name(who), " is eliminated.");
		game.location[who] = DEAD;
		game.steps[who] = BLOCKS[who].steps;
	}
}

function disband_block(who) {
	game.owner[who] = BLOCKS[who].owner;
	game.location[who] = LEVY;
	game.steps[who] = BLOCKS[who].steps;
}

function reduce_block(who) {
	if (game.steps[who] == 1) {
		eliminate_block(who);
	} else {
		game.steps[who]--;
	}
}

/* Game state queries */

function enemy(p) {
	return p == CAESAR ? POMPEIUS : CAESAR;
}

function enemy_player() {
	return enemy(game.active);
}

function count_friendly(where) {
	let count = 0;
	let p = game.active;
	for (let b in BLOCKS) {
		if (game.location[b] == where && block_owner(b) == p)
			++count;
	}
	return count;
}

function count_enemy(where) {
	let count = 0;
	let p = enemy_player();
	for (let b in BLOCKS) {
		if (game.location[b] == where && block_owner(b) == p)
			++count;
	}
	return count;
}

function count_pinning(where) {
	let count = 0;
	if (game.active == game.p2) {
		let p = enemy_player();
		for (let b in BLOCKS) {
			if (game.location[b] == where && block_owner(b) == p)
				if (!game.reserves.includes(b))
					++count;
		}
	}
	return count;
}

function count_pinned(where) {
	let count = 0;
	for (let b in BLOCKS) {
		if (game.location[b] == where && block_owner(b) == game.active)
			if (!game.reserves.includes(b))
				++count;
	}
	return count;
}

function is_pinned(who) {
	if (game.active == game.p2) {
		let where = game.location[who];
		if (count_pinned(where) <= count_pinning(where))
			return true;
	}
	return false;
}

function is_city(where) {
	let t = SPACES[where].type;
	return t == 'city' || t == 'major-port' || t == 'port';
}

function is_sea(where) {
	return SPACES[where].type == 'sea';
}

function is_map_space(where) {
	return is_city(where) || is_sea(where);
}

function is_navis(b) {
	return BLOCKS[b].type == 'navis';
}

function is_friendly_space(where) { return count_friendly(where) > 0 && count_enemy(where) == 0; }
function is_enemy_space(where) { return count_friendly(where) == 0 && count_enemy(where) > 0; }
function is_vacant_space(where) { return count_friendly(where) == 0 && count_enemy(where) == 0; }
function is_contested_space(where) { return count_friendly(where) > 0 && count_enemy(where) > 0; }

function is_friendly_city(where) { return is_city(where) && is_friendly_space(where); }
function is_enemy_city(where) { return is_city(where) && is_enemy_space(where); }
function is_contested_city(where) { return is_city(where) && is_contested_space(where); }

function is_friendly_sea(where) { return is_sea(where) && is_friendly_space(where); }
function is_vacant_sea(where) { return is_sea(where) && is_vacant_space(where); }
function is_contested_sea(where) { return is_sea(where) && is_contested_space(where); }

function have_contested_spaces() {
	for (let where in SPACES)
		if (is_map_space(where) && is_contested_space(where))
			return true;
	return false;
}

function supply_limit(where) {
	if (SPACES[where].type == 'sea')
		return 0;
	return 3 + SPACES[where].value;
}

function is_over_supply_limit(where) {
	let count = 0;
	for (let b in BLOCKS) {
		if (game.location[b] == where)
			++count;
	}
	return count > supply_limit(where);
}

function count_vp() {
	let old_active = game.active;
	game.active = CAESAR;
	game.c_vp = 0;
	game.p_vp = 0;
	game.active = CAESAR;
	for (let s in SPACES) {
		if (is_friendly_city(s))
			game.c_vp += SPACES[s].value;
		if (is_enemy_city(s))
			game.p_vp += SPACES[s].value;
	}
	if (is_dead(POMPEIUS)) game.c_vp += 1;
	if (is_dead(SCIPIO)) game.c_vp += 1;
	if (is_dead(BRUTUS)) game.c_vp += 1;
	if (is_dead(CAESAR)) game.p_vp += 1;
	if (is_dead(ANTONIUS)) game.p_vp += 1;
	if (is_dead(OCTAVIAN)) game.p_vp += 1;
	game.active = old_active;
}

/* Game ability queries */

function can_amphibious_move_to(b, from, to) {
	let e = edge_id(from, to);
	if (EDGES[e] == 'sea') {
		if (is_city(to)) {
			if (is_friendly_space(to) || is_vacant_space(to)) {
				return true;
			}
		} else {
			if (is_friendly_space(to)) {
				return true;
			}
		}
	}
}

function can_amphibious_move(b) {
	if (block_owner(b) == game.active && !game.moved[b]) {
		if (BLOCKS[b].type == 'navis')
			return false;
		if (is_pinned(b))
			return false;
		let from = game.location[b];
		for (let to of SPACES[from].exits)
			if (can_amphibious_move_to(b, from, to))
				return true;
	}
	return false;
}

function can_regroup_to(b, from, to) {
	if (is_vacant_space(to) || is_friendly_space(to)) {
		let e = edge_id(from, to);
		let b_type = BLOCKS[b].type;
		let e_type = EDGES[e];
		if (b_type == 'navis')
			return e_type == 'sea';
		if (e_type == 'major')
			return road_limit(e) < 4;
		if (e_type == 'minor')
			return road_limit(e) < 2;
		if (e_type == 'strait')
			return road_limit(e) < 2;
	}
	return false;
}

function can_block_use_road(b, from, to) {
	let e = edge_id(from, to);
	let b_type = BLOCKS[b].type;
	let e_type = EDGES[e];

	if (b_type == 'navis') {
		if (game.mars == game.active)
			return false;
		if (game.mercury == game.active)
			return false;
		if (game.pluto == game.active)
			return false;
		return e_type == 'sea';
	} else {
		if (game.neptune == game.active)
			return false;
	}

	if (game.pluto == game.active) {
		if (is_enemy_space(to) || is_contested_space(to)) {
			if (e_type == 'major')
				return road_limit(e) < 6;
			if (e_type == 'minor')
				return road_limit(e) < 3;
			if (e_type == 'strait')
				return road_limit(e) < 2;
		}
	}

	if (e_type == 'major')
		return road_limit(e) < 4;
	if (e_type == 'minor')
		return road_limit(e) < 2;
	if (e_type == 'strait') {
		if (is_enemy_space(to) || is_contested_space(to))
			return road_limit(e) < 1;
		else
			return road_limit(e) < 2;
	}
	return false;
}

function can_block_use_road_to_retreat(b, from, to) {
	let e = edge_id(from, to);
	let b_type = BLOCKS[b].type;
	let e_type = EDGES[e];
	if (b_type == 'navis')
		return e_type == 'sea';
	if (e_type == 'major')
		return road_limit(e) < 4;
	if (e_type == 'minor')
		return road_limit(e) < 2;
	if (e_type == 'strait')
		return road_limit(e) < 1;
	return false;
}

function can_block_move_to(b, to) {
	let from = game.location[b];
	if (can_block_use_road(b, from, to)) {
		if (count_pinning(from) > 0) {
			let e = edge_id(from, to);
			if (game.last_used[e] == enemy_player())
				return false;
		}
		return true;
	}
	return false;
}

function can_block_continue_to(b, to) {
	let from = game.location[b];
	if (is_friendly_space(to) || is_vacant_space(to))
		if (can_block_use_road(b, from, to))
			return true;
	return false;
}

function can_block_move(b) {
	if (block_owner(b) == game.active && !game.moved[b]) {
		let from = game.location[b];
		if (is_pinned(b))
			return false;
		if (game.sea_moved[from] && count_friendly(from) <= 1)
			return false;
		for (let to of SPACES[from].exits) {
			if (can_block_move_to(b, to)) {
				return true;
			}
		}
	}
	return false;
}

function can_block_continue(b, last_from) {
	let here = game.location[b];
	if (is_enemy_space(here) || is_contested_space(here))
		return false;
	for (let to of SPACES[here].exits) {
		if (to != last_from && can_block_continue_to(b, to))
			return true;
	}
	return false;
}

function can_sea_retreat(who, from, to) {
	if (game.sea_retreated)
		return false;
	if (BLOCKS[who].type == 'navis')
		return false;
	if (is_friendly_sea(to)) {
		for (let next of SPACES[to].exits)
			if (is_friendly_city(next))
				return true;
	}
	return false;
}

function can_attacker_retreat_to(who, from, to) {
	let e = edge_id(from, to);
	if (can_sea_retreat(who, from, to))
		return true;
	if (is_vacant_space(to))
		if (can_block_use_road_to_retreat(who, from, to))
			if (game.last_used[e] == game.active)
				return true;
	if (is_friendly_space(to))
		if (can_block_use_road_to_retreat(who, from, to))
			return true;
	return false;
}

function can_defender_retreat_to(who, from, to) {
	let e = edge_id(from, to);
	if (BLOCKS[who].type == 'navis') {
		// Navis can only retreat to vacant seas, not ports!
		if (is_vacant_sea(to)) {
			if (can_block_use_road_to_retreat(who, from, to))
				if (game.last_used[e] != enemy_player())
					return true;
		}
		// Navis can retreat to any friendly sea or port, even ones used by the attacker!
		if (is_friendly_space(to)) {
			if (can_block_use_road_to_retreat(who, from, to))
				return true;
		}

	} else {
		if (can_sea_retreat(who, from, to))
			return true;
		if (is_vacant_space(to) || is_friendly_space(to)) {
			if (can_block_use_road_to_retreat(who, from, to))
				if (game.last_used[e] != enemy_player())
					return true;
		}
	}
	return false;
}

function can_attacker_retreat(who) {
	let from = game.location[who];
	for (let to of SPACES[from].exits)
		if (can_attacker_retreat_to(who, from, to))
			return true;
}

function can_defender_retreat(who) {
	let from = game.location[who];
	for (let to of SPACES[from].exits)
		if (can_defender_retreat_to(who, from, to))
			return true;
}

function can_regroup(who) {
	let from = game.location[who];
	for (let to of SPACES[from].exits)
		if (can_regroup_to(who, from, to))
			return true;
	return false;
}

function can_navis_move_to_port(who) {
	let from = game.location[who];
	for (let to of SPACES[from].exits) {
		if (is_friendly_city(to))
			return true;
	}
	return false;
}

function can_levy_to(b, to) {
	if (is_friendly_city(to)) {
		if (BLOCKS[b].levy)
			return BLOCKS[b].levy == to;
		if (BLOCKS[b].type == 'navis')
			return SPACES[to].type == 'major-port';
		if (b == OCTAVIAN)
			return is_dead(CAESAR) || is_dead(ANTONIUS);
		if (b == BRUTUS)
			return is_dead(POMPEIUS) || is_dead(SCIPIO);
		return true;
	}
	return false;
}

function can_levy(b) {
	let location = game.location[b];
	if (block_owner(b) != game.active)
		return false;
	if (location == LEVY) {
		for (let to in SPACES)
			if (can_levy_to(b, to))
				return true;
		return false;
	}
	if (game.steps[b] == BLOCKS[b].steps)
		return false;
	return is_friendly_city(game.location[b]);
}

// == --- == --- == --- == --- == --- == //

let states = {};
let events = {};

function start_year() {
	log("");
	log("Start Year ", game.year, ".");
	game.turn = 1;
	let deck = reset_deck();
	game.c_hand = deal_cards(deck, 6);
	game.p_hand = deal_cards(deck, 6);
	game.prior_c_card = 0;
	game.prior_p_card = 0;
	game.c_card = 0;
	game.p_card = 0;
	game.c_discard = 0;
	game.p_discard = 0;
	game.active = "Both";
	game.state = 'discard_and_play_card';
	game.show_cards = false;
}

function resume_discard_and_play_card() {
	if (game.c_card && game.p_card)
		start_first_turn();
	else if (game.c_card)
		game.active = POMPEIUS;
	else if (game.p_card)
		game.active = CAESAR;
	else
		game.active = "Both";
}

states.discard_and_play_card = {
	prompt: function (view, current) {
		if (current == "Observer")
			return view.prompt = "Waiting for players to discard one card and play one card.";
		if (current == CAESAR) {
			if (!game.c_discard) {
				view.prompt = "Discard a card.";
				for (let c of game.c_hand)
					gen_action(view, 'card', c);
			} else if (!game.c_card) {
				view.prompt = "Play a card.";
				for (let c of game.c_hand)
					if (c != APOLLO)
						gen_action(view, 'card', c);
				gen_action(view, 'undo');
			} else {
				view.prompt = "Waiting for Pompeius...";
				gen_action(view, 'undo');
			}
		}
		else if (current == POMPEIUS) {
			if (!game.p_discard) {
				view.prompt = "Discard a card.";
				for (let c of game.p_hand)
					gen_action(view, 'card', c);
			} else if (!game.p_card) {
				view.prompt = "Play a card.";
				for (let c of game.p_hand)
					if (c != APOLLO)
						gen_action(view, 'card', c);
				gen_action(view, 'undo');
			} else {
				view.prompt = "Waiting for Caesar...";
				gen_action(view, 'undo');
			}
		}
	},
	card: function (c, current) {
		if (current == CAESAR) {
			if (!game.c_discard)
				game.c_discard = c;
			else
				game.c_card = c;
			remove_from_array(game.c_hand, c);
		}
		if (current == POMPEIUS) {
			if (!game.p_discard)
				game.p_discard = c;
			else
				game.p_card = c;
			remove_from_array(game.p_hand, c);
		}
		resume_discard_and_play_card();
	},
	undo: function (_, current) {
		if (current == CAESAR) {
			if (game.c_discard) {
				game.c_hand.push(game.c_discard);
				game.c_discard = 0;
			}
			if (game.c_card) {
				game.c_hand.push(game.c_card);
				game.c_card = 0;
			}
		}
		if (current == POMPEIUS) {
			if (game.p_discard) {
				game.p_hand.push(game.p_discard);
				game.p_discard = 0;
			}
			if (game.p_card) {
				game.p_hand.push(game.p_card);
				game.p_card = 0;
			}
		}
		resume_discard_and_play_card();
	}
}

function start_first_turn() {
	game.last_used = {};
	game.attacker = {};
	game.main_road = {};
	game.moved = {};
	game.reserves = [];
	log("");
	log("Start Turn ", game.turn, " of Year ", game.year, ".");
	reveal_cards();
}

function start_turn() {
	game.last_used = {};
	game.attacker = {};
	game.main_road = {};
	game.moved = {};
	game.reserves = [];
	game.c_card = 0;
	game.p_card = 0;
	game.active = "Both";
	game.state = 'play_card';
	game.show_cards = false;
	log("");
	log("Start Turn ", game.turn, " of Year ", game.year, ".");
}

function resume_play_card() {
	if (game.c_card && game.p_card)
		reveal_cards();
	else if (game.c_card)
		game.active = POMPEIUS;
	else if (game.p_card)
		game.active = CAESAR;
	else
		game.active = "Both";
}

states.play_card = {
	prompt: function (view, current) {
		if (current == "Observer")
			return view.prompt = "Waiting for players to play a card.";
		if (current == CAESAR) {
			view.prior_p_card = game.prior_p_card;
			if (game.c_card) {
				view.prompt = "Waiting for Pompeius to play a card.";
				gen_action(view, 'undo');
			} else {
				view.prompt = "Play a card.";
				for (let c of game.c_hand)
					gen_action(view, 'card', c);
			}
		}
		if (current == POMPEIUS) {
			view.prior_c_card = game.prior_c_card;
			if (game.p_card) {
				view.prompt = "Waiting for Caesar to play a card.";
				gen_action(view, 'undo');
			} else {
				view.prompt = "Play a card.";
				for (let c of game.p_hand)
					gen_action(view, 'card', c);
			}
		}
	},
	card: function (card, current) {
		if (current == CAESAR) {
			remove_from_array(game.c_hand, card);
			game.c_card = card;
		}
		if (current == POMPEIUS) {
			remove_from_array(game.p_hand, card);
			game.p_card = card;
		}
		resume_play_card();
	},
	undo: function (_, current) {
		if (current == CAESAR) {
			if (game.c_card) {
				game.c_hand.push(game.c_card);
				game.c_card = 0;
			}
		}
		if (current == POMPEIUS) {
			if (game.p_card) {
				game.p_hand.push(game.p_card);
				game.p_card = 0;
			}
		}
		resume_play_card();
	}
}

function reveal_cards() {
	delete game.mars;
	delete game.mercury;
	delete game.neptune;
	delete game.pluto;

	log("Caesar plays ", CARDS[game.c_card].name, ".");
	log("Pompeius plays ", CARDS[game.p_card].name, ".");

	if (CARDS[game.c_card].event && CARDS[game.p_card].event) {
		log("Events cancel each other.");
		game.prior_c_card = game.c_card;
		game.prior_p_card = game.p_card;
		end_turn();
		return;
	}

	if (game.c_card == APOLLO) {
		game.c_card = game.prior_p_card;
		log("Apollo copies " + CARDS[game.c_card].name + ".");
	}
	if (game.p_card == APOLLO) {
		game.p_card = game.prior_c_card;
		log("Apollo copies " + CARDS[game.p_card].name + ".");
	}

	game.prior_c_card = game.c_card;
	game.prior_p_card = game.p_card;

	if (CARDS[game.c_card].event) {
		game.p1 = CAESAR;
		game.p2 = POMPEIUS;
	} else if (CARDS[game.p_card].event) {
		game.p1 = POMPEIUS;
		game.p2 = CAESAR;
	} else if (CARDS[game.p_card].move > CARDS[game.c_card].move) {
		game.p1 = POMPEIUS;
		game.p2 = CAESAR;
	} else {
		game.p1 = CAESAR;
		game.p2 = POMPEIUS;
	}

	// Tournament rule: Caesar always goes first on the first turn of the game.
	if (game.year == 705 && game.turn == 1 && game.tournament) {
		if (game.p1 != CAESAR) {
			log("Tournament rule:\nCaesar is the first player on the very first turn of the game.");
			game.p1 = CAESAR;
			game.p2 = POMPEIUS;
		}
	}

	game.show_cards = true;
	game.active = game.p1;
	start_player_turn();
}

function start_player_turn() {
	log("");
	log("Start ", game.active, " turn.");
	reset_road_limits();
	game.activated = [];

	let card = (game.active == CAESAR ? CARDS[game.c_card] : CARDS[game.p_card]);
	if (card.event) {
		switch (card.event) {
		// Apollo has already been handled in reveal_cards!
		case 'Jupiter':
			game.state = 'jupiter';
			break;
		case 'Vulcan':
			game.state = 'vulcan';
			break;
		case 'Mercury':
			game.mercury = game.active;
			game.moves = 1;
			game.levies = 0;
			game.amphibious_available = false;
			game.state = 'move_who';
			game.turn_log = [];
			break;
		case 'Pluto':
			game.pluto = game.active;
			game.moves = 1;
			game.levies = 0;
			game.amphibious_available = false;
			game.state = 'move_who';
			game.turn_log = [];
			break;
		case 'Mars':
			game.mars = game.active;
			game.moves = 1;
			game.levies = 0;
			game.amphibious_available = false;
			game.state = 'move_who';
			game.turn_log = [];
			break;
		case 'Neptune':
			game.neptune = game.active;
			game.moves = 1;
			game.levies = 0;
			game.amphibious_available = false;
			game.state = 'move_who';
			game.turn_log = [];
			break;
		}
	} else {
		game.moves = card.move;
		game.levies = card.levy;
		game.amphibious_available = true;
		game.state = 'move_who';
		game.turn_log = [];
	}

	clear_undo();
}

function jupiter_block(b) {
	let type = BLOCKS[b].type;
	if (type == 'navis' || type == 'leader') {
		log("Jupiter reduces ", block_name(b), ".");
		reduce_block(b);
		end_player_turn();
	} else {
		game.owner[b] = game.active;
		game.who = b;
		game.state = 'jupiter_to';
	}
}

states.jupiter = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + "...";
		view.prompt = "Jupiter: Choose one enemy army adjacent to a friendly city.";
		for (let s in SPACES) {
			if (is_friendly_city(s)) {
				for (let to of SPACES[s].exits)
					if (is_enemy_city(to) || is_contested_city(to))
						gen_action(view, 'secret', to);
			}
		}
		gen_action_pass(view, "Pass");
	},
	space: function (where) {
		/* pick a random block */
		let list = [];
		for (let x in BLOCKS)
			if (game.location[x] == where)
				list.push(x);
		let i = Math.floor(Math.random() * list.length);
		jupiter_block(list[i]);
	},
	secret: function (args) {
		let [where, owner] = args;
		/* pick a random block of the same color as the selected block */
		if (owner == CLEOPATRA) {
			jupiter_block(CLEOPATRA);
		} else {
			let list = [];
			for (let b in BLOCKS)
				if (game.location[b] == where && BLOCKS[b].owner == owner)
					list.push(b);
			let i = Math.floor(Math.random() * list.length);
			jupiter_block(list[i]);
		}
	},
	pass: function () {
		end_player_turn();
	},
}

states.jupiter_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + "...";
		view.prompt = "Jupiter: Move " + block_name(game.who) + " to your city.";
		let from = game.location[game.who];
		for (let to of SPACES[from].exits)
			if (is_friendly_city(to))
				gen_action(view, 'space', to);
	},
	space: function (to) {
		log(block_name(game.who) + " joins " + game.active + ":\n" +
			game.location[game.who] + " \u2192 " + to + ".");
		game.location[game.who] = to;
		game.who = null;
		end_player_turn();
	},
}

states.vulcan = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + "...";
		view.prompt = "Vulcan: Choose an enemy city to suffer a volcanic eruption.";
		for (let s in SPACES)
			if (is_enemy_city(s))
				gen_action(view, 'space', s);
	},
	space: function (city) {
		log("Vulcan strikes " + city + "!");
		for (let b in BLOCKS) {
			if (game.location[b] == city) {
				reduce_block(b);
			}
		}
		// uh-oh! cleopatra switched sides!
		if (is_contested_city(city)) {
			game.attacker[city] = game.active;
		}
		end_player_turn();
	},
}

function is_amphibious_move(who, from, to) {
	if (BLOCKS[who].type == 'navis')
		return false;
	let e = edge_id(from, to);
	if (EDGES[e] == 'sea')
		return true;
	return false;
}

function move_or_attack(to) {
	let from = game.location[game.who];
	move_to(game.who, from, to);
	if (is_enemy_space(to) || is_contested_space(to)) {
		if (!game.attacker[to]) {
			game.attacker[to] = game.active;
			game.main_road[to] = from;
			return ATTACK_MARK;
		} else {
			if (game.attacker[to] != game.active || game.main_road[to] != from) {
				game.reserves.push(game.who);
				return RESERVE_MARK;
			}
			return ATTACK_MARK;
		}
	}
	return false; // not a combat move
}

states.move_who = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move...";
		if (game.pluto == game.active)
			view.prompt = "Pluto: Move one group. Road limits increase for attacks. No Navis movement.";
		else if (game.mars == game.active)
			view.prompt = "Mars: Move one group. No Navis movement.";
		else if (game.neptune == game.active)
			view.prompt = "Neptune: Move only the Navis in one group.";
		else if (game.mercury == game.active)
			view.prompt = "Mercury: Move one group three cities, or two cities and attack. No Navis movement.";
		else if (game.amphibious_available)
			view.prompt = "Choose an army to group or amphibious move. "+game.moves+"MP left.";
		else
			view.prompt = "Choose an army to group move. "+game.moves+"MP left.";
		if (game.moves == 0) {
			for (let b in BLOCKS) {
				let from = game.location[b];
				if (game.activated.includes(from))
					if (can_block_move(b))
						gen_action(view, 'block', b);
			}
		} else {
			let have_amphibious = false;
			for (let b in BLOCKS) {
				let can_move = false;
				if (game.amphibious_available && can_amphibious_move(b)) {
					can_move = true;
					have_amphibious = true;
				}
				if (can_block_move(b))
					can_move = true;
				if (can_move)
					gen_action(view, 'block', b);
			}
			if (!have_amphibious)
				game.amphibious_available = false;
		}
		gen_action_pass(view, "End movement phase");
		gen_action_undo(view);
	},
	block: function (who) {
		push_undo();
		game.who = who;
		if (game.mercury == game.active)
			game.state = 'mercury_move_1';
		else
			game.state = 'move_where';
	},
	pass: function () {
		end_movement();
	},
	undo: pop_undo,
}

states.move_where = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move...";
		view.prompt = "Move " + block_name(game.who) + ".";
		let from = game.location[game.who];
		for (let to of SPACES[from].exits) {
			let can_move_to = false;
			if (game.amphibious_available && can_amphibious_move_to(game.who, from, to))
				can_move_to = true;
			if (can_block_move_to(game.who, to))
				can_move_to = true;
			if (can_move_to)
				gen_action(view, 'space', to);
		}
		gen_action(view, 'block', game.who); // for canceling move
		gen_action_undo(view);
	},
	space: function (to) {
		let from = game.location[game.who];
		if (is_amphibious_move(game.who, from, to)) {
			game.moves --;
			game.location[game.who] = to;
			game.last_from = from;
			log_move_start(from, to);
			logp("amphibious moves.");
			if (is_sea(to)) {
				game.sea_moved[to] = true;
				game.state = 'amphibious_move_to';
			} else {
				game.moved[game.who] = true;
				game.who = null;
				game.state = 'move_who';
				log_move_end();
			}
		} else {
			if (!game.activated.includes(from)) {
				logp("activates " + from + ".");
				game.moves --;
				game.activated.push(from);
			}
			game.amphibious_available = false;
			let mark = move_or_attack(to);
			log_move_start(from, to, mark);
			if (can_block_continue(game.who, game.last_from)) {
				game.state = 'move_where_2';
			} else {
				game.moved[game.who] = true;
				game.who = null;
				game.state = 'move_who';
				log_move_end();
			}
		}
	},
	block: pop_undo,
	undo: pop_undo,
}

states.move_where_2 = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move...";
		view.prompt = "Move " + block_name(game.who) + ".";
		let from = game.location[game.who];
		for (let to of SPACES[from].exits)
			if (to != game.last_from && can_block_continue_to(game.who, to))
				gen_action(view, 'space', to);
		gen_action(view, 'space', from); // For ending move early.
		gen_action_undo(view);
	},
	space: function (to) {
		let from = game.location[game.who];
		if (to != from) {
			log_move_continue(to);
			move_to(game.who, from, to);
		}
		game.moved[game.who] = true;
		game.who = null;
		game.state = 'move_who';
		log_move_end();
	},
	undo: pop_undo,
}

states.amphibious_move_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move...";
		view.prompt = "Move " + block_name(game.who) + " to a friendly sea or port.";
		let from = game.location[game.who];
		for (let to of SPACES[from].exits)
			if (to != game.last_from && can_amphibious_move_to(game.who, from, to))
				gen_action(view, 'space', to);
		gen_action_undo(view);
	},
	space: function (to) {
		let from = game.location[game.who];
		game.last_from = from;
		game.location[game.who] = to;
		log_move_continue(to);
		if (is_sea(to)) {
			game.sea_moved[to] = true;
			game.state = 'amphibious_move_to';
		} else {
			game.moved[game.who] = true;
			game.who = null;
			game.state = 'move_who';
			log_move_end();
		}
	},
	undo: pop_undo,
}

states.mercury_move_1 = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move...";
		view.prompt = "Mercury: Move " + block_name(game.who) + ".";
		let from = game.location[game.who];
		for (let to of SPACES[from].exits)
			if (can_block_move_to(game.who, to))
				gen_action(view, 'space', to);
		gen_action_undo(view);
	},
	space: function (to) {
		let from = game.location[game.who];
		if (!game.activated.includes(from)) {
			logp("activates " + from + ".");
			game.moves --;
			game.activated.push(from);
		}
		let mark = move_or_attack(to);
		log_move_start(from, to, mark);
		if (!is_contested_space(to) && can_block_move(game.who)) {
			game.state = 'mercury_move_2';
		} else {
			game.who = null;
			game.state = 'move_who';
			log_move_end();
		}
	},
	undo: pop_undo,
}

states.mercury_move_2 = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move...";
		view.prompt = "Mercury: Move " + block_name(game.who) + ".";
		let from = game.location[game.who];
		for (let to of SPACES[from].exits)
			if (to != game.last_from && can_block_move_to(game.who, to))
				gen_action(view, 'space', to);
		gen_action(view, 'space', from); // For ending move early.
		gen_action_undo(view);
	},
	space: function (to) {
		let from = game.location[game.who];
		if (to != from) {
			let mark = move_or_attack(to);
			log_move_continue(to, mark);
			if (can_block_continue(game.who, game.last_from)) {
				game.state = 'mercury_move_3';
			} else {
				game.moved[game.who] = true;
				game.who = null;
				game.state = 'move_who';
				log_move_end();
			}
		} else {
			game.moved[game.who] = true;
			game.who = null;
			game.state = 'move_who';
			log_move_end();
		}
	},
	undo: pop_undo,
}

states.mercury_move_3 = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move...";
		view.prompt = "Mercury: Move " + block_name(game.who) + ".";
		let from = game.location[game.who];
		for (let to of SPACES[from].exits)
			if (to != game.last_from && can_block_continue_to(game.who, to))
				gen_action(view, 'space', to);
		gen_action(view, 'space', from); // For ending move early.
		gen_action_undo(view);
	},
	space: function (to) {
		let from = game.location[game.who];
		if (to != from) {
			log_move_continue(to);
			move_to(game.who, from, to);
		}
		game.moved[game.who] = true;
		game.who = null;
		game.state = 'move_who';
		log_move_end();
	},
	undo: pop_undo,
}

function end_movement() {
	print_turn_log("moves");

	if (game.pluto == game.active ||
		game.mars == game.active ||
		game.neptune == game.active ||
		game.mercury == game.active)
		return end_player_turn();

	game.who = null;
	game.moves = 0;
	game.state = 'levy';
	game.turn_log = [];

	clear_undo();
}

states.levy = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to levy...";
		view.prompt = "Choose an army to levy. "+game.levies+"LP left.";
		let is_levy_possible = false;
		if (game.levies > 0) {
			for (let b in BLOCKS) {
				if (can_levy(b)) {
					gen_action(view, 'block', b);
					is_levy_possible = true;
				}
			}
		}
		if (!is_levy_possible)
			gen_action_pass(view, "End levy phase");
		gen_action_undo(view);
	},
	block: function (who) {
		push_undo();
		if (game.location[who] == LEVY) {
			if (BLOCKS[who].levy) {
				let to = BLOCKS[who].levy;
				log_levy(to);
				game.levies --;
				game.steps[who] = 1;
				game.location[who] = to;
			} else {
				game.who = who;
				game.state = 'levy_where';
			}
		} else {
			log_levy(game.location[who]);
			game.levies --;
			game.steps[who]++;
			game.state = 'levy';
		}
	},
	pass: function () {
		end_player_turn();
	},
	undo: pop_undo,
}

states.levy_where = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to levy...";
		view.prompt = "Choose a friendly city to levy " + block_name(game.who) + " in.";
		for (let to in SPACES)
			if (can_levy_to(game.who, to))
				gen_action(view, 'space', to);
		gen_action(view, 'block', game.who); // for canceling levy
		gen_action_undo(view);
	},
	space: function (to) {
		log_levy(to);
		game.levies --;
		game.steps[game.who] = 1;
		game.location[game.who] = to;
		game.who = null;
		game.state = 'levy';
	},
	block: pop_undo,
	undo: pop_undo,
}

function end_player_turn() {
	clear_undo();

	if (game.turn_log)
		print_turn_log("levies");

	if (game.active == game.p1) {
		game.active = game.p2;
		start_player_turn();
	} else {
		goto_pick_battle();
	}
}

function goto_pick_battle() {
	game.active = game.p1;
	if (have_contested_spaces())
		game.state = 'pick_battle';
	else
		end_turn();
}

states.pick_battle = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to pick a battle...";
		view.prompt = "Choose the next battle to fight!";
		for (let s in SPACES)
			if (is_contested_city(s) || is_contested_sea(s))
				gen_action(view, 'space', s);
	},
	space: function (where) {
		game.where = where;
		if (game.mars == game.attacker[where]) {
			game.state = 'use_battle_event';
		} else if (game.neptune == game.attacker[where]) {
			game.state = 'use_battle_event';
		} else {
			start_battle(false);
		}
	},
}

states.use_battle_event = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to pick a battle...";
		if (game.mars)
			view.prompt = "Do you want to use the surprise attack granted by Mars?";
		else
			view.prompt = "Do you want to use the surprise attack granted by Neptune?";
		gen_action(view, 'surprise');
		gen_action_pass(view, "No");
	},
	surprise: function () {
		delete game.mars; /* Used up the event! */
		delete game.neptune; /* Used up the event! */
		start_battle(true);
	},
	pass: function () {
		start_battle(false);
	}
}

function is_attacker(b) {
	if (game.location[b] == game.where && block_owner(b) == game.attacker[game.where])
		return !game.reserves.includes(b);
	return false;
}

function is_defender(b) {
	if (game.location[b] == game.where && block_owner(b) != game.attacker[game.where])
		return !game.reserves.includes(b);
	return false;
}

function count_attackers() {
	let count = 0;
	for (let b in BLOCKS) {
		if (is_attacker(b))
			++count;
	}
	return count;
}

function count_defenders() {
	let count = 0;
	for (let b in BLOCKS) {
		if (is_defender(b))
			++count;
	}
	return count;
}

function start_battle(surprise) {
	game.surprise = surprise;
	game.battle_round = 0;
	game.flash = "";
	log("");
	if (game.surprise)
		log("Surprise attack in ", game.where, ".");
	else
		log("Battle in ", game.where, ".");
	game.state = 'battle_round';
	start_battle_round();
}

function resume_battle() {
	game.who = null;
	game.state = 'battle_round';
	pump_battle_round();
}

function end_battle() {
	game.flash = "";
	game.battle_round = 0;
	reset_road_limits();
	game.moved = {};
	goto_regroup();
}

function disrupt_attacking_reserves() {
	for (let b in BLOCKS)
		if (game.location[b] == game.where && block_owner(b) == game.attacker[game.where])
			if (game.reserves.includes(b))
				reduce_block(b);
}

function bring_on_reserves() {
	for (let b in BLOCKS) {
		if (game.location[b] == game.where) {
			remove_from_array(game.reserves, b);
		}
	}
}

function start_battle_round() {
	if (++game.battle_round <= 4) {
		reset_road_limits();
		game.moved = {};

		if (game.battle_round == 2) {
			game.surprise = false;
			if (count_defenders() == 0) {
				log("Defending main force was eliminated.");
				log("Defending reserves are disrupted.");
				game.attacker[game.where] = enemy(game.attacker[game.where]);
				disrupt_attacking_reserves();
				log("The attacker is now the defender.");
			} else if (count_attackers() == 0) {
				log("Attacking main force was eliminated.");
				log("Attacking reserves are disrupted.");
				disrupt_attacking_reserves();
			}
			bring_on_reserves();
		}

		log("~ Battle Round " + game.battle_round + " ~");

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

	if (is_friendly_space(game.where) || is_enemy_space(game.where)) {
		end_battle();
	} else if (count_attackers() == 0 || count_defenders() == 0) {
		start_battle_round();
	} else {
		let attacker = game.attacker[game.where];
		let defender = enemy(attacker);

		if (game.surprise) {
			if (battle_step(attacker, 'A', is_attacker)) return;
			if (battle_step(attacker, 'B', is_attacker)) return;
			if (battle_step(attacker, 'C', is_attacker)) return;
			if (battle_step(attacker, 'D', is_attacker)) return;
			if (battle_step(defender, 'A', is_defender)) return;
			if (battle_step(defender, 'B', is_defender)) return;
			if (battle_step(defender, 'C', is_defender)) return;
			if (battle_step(defender, 'D', is_defender)) return;
		} else {
			if (battle_step(defender, 'A', is_defender)) return;
			if (battle_step(attacker, 'A', is_attacker)) return;
			if (battle_step(defender, 'B', is_defender)) return;
			if (battle_step(attacker, 'B', is_attacker)) return;
			if (battle_step(defender, 'C', is_defender)) return;
			if (battle_step(attacker, 'C', is_attacker)) return;
			if (battle_step(defender, 'D', is_defender)) return;
			if (battle_step(attacker, 'D', is_attacker)) return;
		}

		start_battle_round();
	}
}

function end_battle() {
	game.flash = "";
	game.battle_round = 0;
	reset_road_limits();
	game.moved = {};
	goto_regroup();
}

function can_fire_with_block(b) {
	if (is_attacker(b))
		return game.battle_round < 4;
	if (is_defender(b))
		return true;
	return false;
}

function fire_with_block(b) {
	game.moved[b] = true;
	game.hits = 0;
	let strength = block_strength(b);
	let fire = block_fire_power(b);
	let name = block_name(b) + " " + block_initiative(b) + fire;
	let rolls = [];
	for (let i = 0; i < strength; ++i) {
		let die = roll_d6();
		if (die <= fire) {
			rolls.push(DIE_HIT[die]);
			++game.hits;
		} else {
			rolls.push(DIE_MISS[die]);
		}
	}
	game.flash = name + " fires " + rolls.join(" ") + " ";
	if (game.hits == 0)
		game.flash += "and misses.";
	else if (game.hits == 1)
		game.flash += "and scores 1 hit.";
	else
		game.flash += "and scores " + game.hits + " hits.";

	log_battle(name + " fires " + rolls.join("") + ".");

	if (game.hits > 0) {
		game.active = enemy(game.active);
		goto_battle_hits();
	} else {
		resume_battle();
	}
}

function can_retreat_with_block(who) {
	if (game.location[who] == game.where) {
		if (game.battle_round > 1) {
			if (block_owner(who) == game.attacker[game.where])
				return can_attacker_retreat(who);
			else
				return can_defender_retreat(who);
		}
	}
	return false;
}

function must_retreat_with_block(who) {
	if (game.location[who] == game.where)
		if (game.battle_round == 4)
			return (block_owner(who) == game.attacker[where]);
	return false;
}

function retreat_with_block(who) {
	if (can_retreat_with_block(who)) {
		game.who = who;
		game.state = 'retreat';
	} else {
		eliminate_block(who);
		resume_battle();
	}
}

function pass_with_block(who) {
	game.flash = block_name(who) + " passes.";
	log_battle(block_name(who) + " passes.");
	game.moved[who] = true;
	resume_battle();
}

states.battle_round = {
	show_battle: true,
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to choose a combat action...";
		let can_fire = false;
		let can_retreat = false;
		let must_retreat = false;
		let can_pass = false;
		if (game.active == game.attacker[game.where]) {
			if (game.battle_round < 4) can_fire = true;
			if (game.battle_round > 1) can_retreat = true;
			if (game.battle_round < 4) can_pass = true;
			if (game.battle_round == 4) must_retreat = true;
		} else {
			can_fire = true;
			if (game.battle_round > 1) can_retreat = true;
			can_pass = true;
		}
		if (can_fire && can_retreat)
			view.prompt = "Fire, retreat, or pass with an army.";
		else if (can_fire)
			view.prompt = "Fire or pass with an army.";
		else
			view.prompt = "Retreat with an army.";
		for (let b of game.battle_list) {
			if (can_fire) gen_action(view, 'battle_fire', b);
			if (must_retreat || (can_retreat && can_retreat_with_block(b)))
				gen_action(view, 'battle_retreat', b);
			if (can_pass) gen_action(view, 'battle_pass', b);
			gen_action(view, 'block', b);
		}
	},
	block: function (who) {
		if (can_fire_with_block(who))
			fire_with_block(who);
		else if (can_retreat_with_block(who))
			retreat_with_block(who);
		else if (must_retreat_with_block(who))
			retreat_with_block(who);
		else
			pass_with_block(who);
	},
	battle_fire: function (who) {
		fire_with_block(who);
	},
	battle_retreat: function (who) {
		retreat_with_block(who);
	},
	battle_pass: function (who) {
		pass_with_block(who);
	},
}

function goto_battle_hits() {
	game.battle_list = list_victims(game.active);
	if (game.battle_list.length == 0)
		resume_battle();
	else
		game.state = 'battle_hits';
}

function list_victims(p) {
	let is_candidate = (p == game.attacker[game.where]) ? is_attacker : is_defender;
	let max = 0;
	for (let b in BLOCKS)
		if (is_candidate(b) && block_strength(b) > max)
			max = block_strength(b);
	let list = [];
	for (let b in BLOCKS)
		if (is_candidate(b) && block_strength(b) == max)
			list.push(b);
	return list;
}

function apply_hit(who) {
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

states.battle_hits = {
	show_battle: true,
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to apply hits...";
		view.prompt = "Assign " + game.hits + (game.hits != 1 ? " hits" : " hit") + " to your armies.";
		for (let b of game.battle_list) {
			gen_action(view, 'battle_hit', b);
			gen_action(view, 'block', b);
		}
	},
	block: function (who) {
		apply_hit(who);
	},
	battle_hit: function (who) {
		apply_hit(who);
	},
}

states.retreat = {
	show_battle: false,
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to retreat...";
		view.prompt = "Retreat " + block_name(game.who) + ".";
		let from = game.location[game.who];
		for (let to of SPACES[from].exits) {
			if (block_owner(game.who) == game.attacker[from]) {
				if (can_attacker_retreat_to(game.who, from, to))
					gen_action(view, 'space', to);
			} else {
				if (can_defender_retreat_to(game.who, from, to))
					gen_action(view, 'space', to);
			}
		}
		gen_action(view, 'undo');
		gen_action(view, 'block', game.who);
	},
	space: function (to) {
		let from = game.location[game.who];
		if (is_sea(to) && !is_navis(game.who)) {
			move_to(game.who, from, to);
			game.sea_retreated = true;
			game.state = 'sea_retreat';
		} else {
			logp("retreats to " + to + ".");
			move_to(game.who, from, to);
			game.flash = block_name(game.who) + " retreats to " + to + ".";
			game.moved[game.who] = true;
			resume_battle();
		}
	},
	pass: function () {
		eliminate_block(game.who);
		resume_battle();
	},
	block: function () {
		resume_battle();
	},
	undo: function () {
		resume_battle();
	},
}

states.sea_retreat = {
	show_battle: false,
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to retreat...";
		view.prompt = "Retreat " + block_name(game.who) + " to a friendly port.";
		let from = game.location[game.who];
		for (let to of SPACES[from].exits) {
			if (is_friendly_city(to))
				gen_action(view, 'space', to);
		}
		// TODO: check if there are any valid destinations before going to this state
		gen_action_pass(view, "Eliminate army");
	},
	space: function (to) {
		let from = game.location[game.who];
		logp("sea retreats to " + to + ".");
		game.flash = block_name(game.who) + " sea retreats to " + to + ".";
		move_to(game.who, from, to);
		game.moved[game.who] = true;
		resume_battle();
	},
	pass: function () {
		eliminate_block(game.who);
		resume_battle();
	}
}

function goto_regroup() {
	game.active = game.attacker[game.where];
	if (is_enemy_space(game.where))
		game.active = enemy(game.active);
	log(game.active + " wins the battle in " + game.where + "!");
	game.state = 'regroup';
	game.turn_log = [];
	clear_undo();
}

states.regroup = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to regroup...";
		view.prompt = "Regroup: Choose an army to move.";
		for (let b in BLOCKS) {
			if (game.location[b] == game.where) {
				if (can_regroup(b))
					gen_action(view, 'block', b);
			}
		}
		gen_action_pass(view, "End regroup");
		gen_action_undo(view);
	},
	block: function (who) {
		push_undo();
		game.who = who;
		game.state = 'regroup_to';
	},
	pass: function () {
		print_turn_log("regroups");
		clear_undo();
		game.where = null;
		goto_pick_battle();
	},
	undo: pop_undo,
}

states.regroup_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to regroup...";
		view.prompt = "Regroup: Move " + block_name(game.who) + " to a friendly or vacant location.";
		let from = game.location[game.who];
		for (let to of SPACES[from].exits) {
			if (can_regroup_to(game.who, from, to))
				gen_action(view, 'space', to);
		}
		gen_action(view, 'block', game.who); // for canceling move
		gen_action_undo(view);
	},
	space: function (to) {
		let from = game.location[game.who];
		game.turn_log.push([from, to]);
		move_to(game.who, from, to);
		game.who = null;
		game.state = 'regroup';
	},
	block: pop_undo,
	undo: pop_undo,
}

function end_turn() {
	game.moved = {};
	if (game.turn == 5) {
		cleopatra_goes_home();
		check_victory();
	} else {
		game.turn ++;
		start_turn();
	}
}

function cleopatra_goes_home() {
	game.active = CAESAR;
	if (game.location[CLEOPATRA] != ALEXANDRIA)
		log("Cleopatra goes home to Alexandria.");
	if (is_friendly_space(ALEXANDRIA))
		game.owner[CLEOPATRA] = CAESAR;
	else
		game.owner[CLEOPATRA] = POMPEIUS;
	game.location[CLEOPATRA] = ALEXANDRIA;
}

function check_victory() {
	count_vp();
	if (game.c_vp >= 10) {
		game.result = CAESAR;
		game.active = null;
		game.state = 'game_over';
		game.victory = "Caesar wins an early victory.";
		log("");
		log(game.victory);
	} else if (game.p_vp >= 10) {
		game.victory = "Pompeius wins an early victory.";
		game.result = POMPEIUS;
		game.active = null;
		game.state = 'game_over';
		log("");
		log(game.victory);
	} else {
		if (game.year == 709) {
			end_game();
		} else {
			log("");
			log("Start Winter Turn of Year " + game.year);
			start_navis_to_port();
		}
	}
}

function count_navis_to_port() {
	let count = 0;
	for (let b in BLOCKS) {
		if (block_owner(b) == game.active && BLOCKS[b].type == 'navis')
			if (SPACES[game.location[b]].type == 'sea')
				if (can_navis_move_to_port(b))
					++count;
	}
	return count;
}

function start_navis_to_port() {
	game.active = CAESAR;
	let count = count_navis_to_port();
	if (count > 0) {
		game.state = 'navis_to_port';
		game.turn_log = [];
		clear_undo();
	} else {
		next_navis_to_port();
	}
}

function next_navis_to_port() {
	if (game.active == CAESAR) {
		game.active = POMPEIUS;
		let count = count_navis_to_port();
		if (count > 0) {
			game.state = 'navis_to_port';
			game.turn_log = [];
			clear_undo();
			return;
		}
	}
	clear_undo();
	winter_supply();
}

states.navis_to_port = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move navis to port...";
		view.prompt = "Move all Navis to a friendly port.";
		let count = 0;
		for (let b in BLOCKS) {
			if (block_owner(b) == game.active && BLOCKS[b].type == 'navis') {
				if (SPACES[game.location[b]].type == 'sea') {
					if (can_navis_move_to_port(b)) {
						gen_action(view, 'block', b);
						++count;
					}
				}
			}
		}
		if (count > 0)
			view.prompt += " " + count + " left.";
		if (count == 0)
			gen_action_pass(view, "End navis to port");
		gen_action_undo(view);
	},
	block: function (who) {
		push_undo();
		game.who = who;
		game.state = 'navis_to_port_where';
	},
	pass: function () {
		print_turn_log("moves to port");
		next_navis_to_port();
	},
	undo: pop_undo,
}

states.navis_to_port_where = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move navis to port...";
		view.prompt = "Move " +  block_name(game.who) + " to a friendly port.";
		let from = game.location[game.who];
		for (let to of SPACES[from].exits) {
			if (is_friendly_city(to))
				gen_action(view, 'space', to);
		}
		gen_action(view, 'block', game.who); // for canceling move
		gen_action_undo(view);
	},
	space: function (to) {
		let from = game.location[game.who];
		game.turn_log.push([from, to]);
		game.location[game.who] = to;
		game.who = null;
		game.state = 'navis_to_port';
	},
	block: pop_undo,
	undo: pop_undo,
}

function winter_supply() {
	game.active = CAESAR;
	game.state = 'disband';
	game.turn_log = [];
	clear_undo();
}

states.disband = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to disband...";
		let okay_to_end = true;
		for (let b in BLOCKS) {
			if (block_owner(b) == game.active && is_map_space(game.location[b]) && b != CLEOPATRA) {
				if (is_over_supply_limit(game.location[b])) {
					okay_to_end = false;
					gen_action(view, 'block', b);
				}
			}
		}

		if (!okay_to_end) {
			view.prompt = "Disband armies in excess of supply.";
		} else {
			view.prompt = "You may disband armies to your levy pool.";
			for (let b in BLOCKS) {
				if (is_map_space(game.location[b]))
					if (block_owner(b) == game.active && b != CLEOPATRA)
						gen_action(view, 'block', b);
			}
			gen_action_pass(view, "End disbanding");

		}
		gen_action_undo(view);
	},
	block: function (who) {
		push_undo();
		game.turn_log.push([game.location[who]]);
		disband_block(who);
	},
	pass: function () {
		print_turn_log("disbands");
		if (game.active == CAESAR) {
			game.turn_log = [];
			game.active = POMPEIUS;
			clear_undo();
		} else {
			clear_undo();
			end_year();
		}
	},
	undo: pop_undo,
}

function end_year() {
	game.year ++;
	for (let b in BLOCKS) {
		if (game.location[b] == DEAD && BLOCKS[b].type != 'leader') {
			disband_block(b);
		}
	}
	start_year();
}

function end_game() {
	count_vp();
	if (game.c_vp > game.p_vp) {
		game.result = CAESAR;
	} else if (game.c_vp < game.p_vp) {
		game.result = POMPEIUS;
	} else {
		game.active = CAESAR;
		if (is_friendly_space(ROMA))
			game.result = CAESAR;
		else if (is_enemy_space(ROMA))
			game.result = POMPEIUS;
		else
			game.result = null;
	}
	if (game.result == CAESAR)
		game.victory = "Caesar wins!";
	else if (game.result == POMPEIUS)
		game.victory = "Pompeius wins!";
	else
		game.victory = "The game is a draw.";
	game.active = null;
	game.state = 'game_over';
	log("");
	log(game.victory);
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
		tournament: (scenario == "Tournament"),
		state: null,
		show_cards: false,
		year: 705,
		location: {},
		steps: {},
		owner: {},
		moved: {},
		limits: {},
		last_used: {},
		sea_moved: {},
		attacker: {},
		main_road: {},
		reserves: [],
		log: [],
	};
	setup_historical_deployment();
	start_year();
	return game;
}

function deploy_block(owner, location, name) {
	for (let b in BLOCKS) {
		if (BLOCKS[b].owner == owner && BLOCKS[b].name == name) {
			game.steps[b] = BLOCKS[b].steps;
			game.location[b] = location;
			return;
		}
	}
}

function setup_historical_deployment() {
	for (let b in BLOCKS) {
		game.location[b] = LEVY;
		game.steps[b] = BLOCKS[b].steps;
	}

	deploy_block("Caesar", "Ravenna", "Caesar");
	deploy_block("Caesar", "Ravenna", "Legio 13");
	deploy_block("Caesar", "Ravenna", "Navis 2");
	deploy_block("Caesar", "Genua", "Antonius");
	deploy_block("Caesar", "Genua", "Legio 8");
	deploy_block("Caesar", "Genua", "Legio 12");
	deploy_block("Caesar", "Massilia", "Legio 11");
	deploy_block("Caesar", "Massilia", "Legio 14");
	deploy_block("Caesar", "Massilia", "Navis 1");
	deploy_block("Caesar", "Narbo", "Legio 7");
	deploy_block("Caesar", "Narbo", "Legio 9");
	deploy_block("Caesar", "Narbo", "Legio 10");
	deploy_block("Caesar", "Lugdunum", "Legio 16");
	deploy_block("Caesar", "Lugdunum", "Equitatus 1");

	deploy_block("Pompeius", "Neapolis", "Pompeius");
	deploy_block("Pompeius", "Neapolis", "Legio 1");
	deploy_block("Pompeius", "Neapolis", "Navis 1");
	deploy_block("Pompeius", "Brundisium", "Legio 3");
	deploy_block("Pompeius", "Syracusae", "Legio 37");
	deploy_block("Pompeius", "Antiochia", "Scipio");
	deploy_block("Pompeius", "Antiochia", "Legio 34");
	deploy_block("Pompeius", "Alexandria", "Cleopatra");
	deploy_block("Pompeius", "Alexandria", "Navis 2");
	deploy_block("Pompeius", "Utica", "Legio 39");
	deploy_block("Pompeius", "Utica", "Navis 3");
	deploy_block("Pompeius", "Carthago Nova", "Legio 2");
	deploy_block("Pompeius", "Carthago Nova", "Legio 4");
	deploy_block("Pompeius", "Tarraco", "Legio 5");
	deploy_block("Pompeius", "Tarraco", "Legio 6");
	deploy_block("Pompeius", "Tarraco", "Equitatus 1");
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

function make_battle_view() {
	let bv = {
		CA: [], CB: [], CC: [], CD: [], CR: [],
		PA: [], PB: [], PC: [], PD: [], PR: [],
		flash: game.flash
	};

	bv.title = game.attacker[game.where];
	if (game.surprise && game.battle_round == 1)
		bv.title += " surprise attacks ";
	else
		bv.title += " attacks ";
	bv.title += game.where
	bv.title += " \u2014 round " + game.battle_round + " of 4";

	function is_battle_reserve(b) {
		return game.battle_round == 1 && game.reserves.includes(b);
	}

	function fill_cell(name, p, fn) {
		for (let b in BLOCKS) {
			if (game.location[b] == game.where & block_owner(b) == p && fn(b)) {
				bv[name].push([b, game.steps[b], game.moved[b]?1:0])
			}
		}
	}

	fill_cell("CR", CAESAR, b => is_battle_reserve(b));
	fill_cell("CA", CAESAR, b => !is_battle_reserve(b) && block_initiative(b) == 'A');
	fill_cell("CB", CAESAR, b => !is_battle_reserve(b) && block_initiative(b) == 'B');
	fill_cell("CC", CAESAR, b => !is_battle_reserve(b) && block_initiative(b) == 'C');
	fill_cell("CD", CAESAR, b => !is_battle_reserve(b) && block_initiative(b) == 'D');
	fill_cell("PR", POMPEIUS, b => is_battle_reserve(b));
	fill_cell("PA", POMPEIUS, b => !is_battle_reserve(b) && block_initiative(b) == 'A');
	fill_cell("PB", POMPEIUS, b => !is_battle_reserve(b) && block_initiative(b) == 'B');
	fill_cell("PC", POMPEIUS, b => !is_battle_reserve(b) && block_initiative(b) == 'C');
	fill_cell("PD", POMPEIUS, b => !is_battle_reserve(b) && block_initiative(b) == 'D');

	return bv;
}

exports.view = function(state, current) {
	game = state;

	count_vp();

	let view = {
		log: game.log,
		year: game.year,
		turn: game.turn,
		c_vp: game.c_vp,
		p_vp: game.p_vp,
		c_card: (game.show_cards || current == CAESAR) ? game.c_card : 0,
		p_card: (game.show_cards || current == POMPEIUS) ? game.p_card : 0,
		hand: (current == CAESAR) ? game.c_hand : (current == POMPEIUS) ? game.p_hand : [],
		who: (game.active == current) ? game.who : null,
		where: game.where,
		known: {},
		secret: { Caesar: {}, Pompeius: {}, Cleopatra: {} },
		battle: null,
		active: game.active,
		prompt: null,
		actions: null,
	};

	states[game.state].prompt(view, current);

	if (states[game.state].show_battle)
		view.battle = make_battle_view();

	for (let b in BLOCKS) {
		if (game.state == 'game_over') {
			if (game.location[b] != LEVY)
				view.known[b] = [ game.location[b], game.steps[b], 0 ];
		} else if (block_owner(b) == current || game.location[b] == DEAD) {
			view.known[b] = [ game.location[b], game.steps[b], game.moved[b]?1:0 ];
		} else {
			let o = BLOCKS[b].owner;
			let a = game.location[b];
			if (b == CLEOPATRA)
				o = CLEOPATRA;
			if (a != LEVY) {
				let list = view.secret[o];
				if (!(a in list))
					list[a] = [0, 0];
				list[a][0]++;
				if (game.moved[b])
					list[a][1]++;
			}
		}
	}

	return view;
}
