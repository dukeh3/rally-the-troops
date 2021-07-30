"use strict";

exports.scenarios = [
	"Braveheart",
	"The Bruce",
	"Campaign",
];

const { CARDS, BLOCKS, AREAS, BORDERS } = require('./data');

const ENEMY = { Scotland: "England", England: "Scotland" }
const OBSERVER = "Observer";
const BOTH = "Both";
const ENGLAND = "England";
const SCOTLAND = "Scotland";
const E_BAG = "E. Bag";
const S_BAG = "S. Bag";
const EDWARD = "Edward";
const KING = "King";
const MORAY = "Moray";
const E_BRUCE = "Bruce/E";
const S_BRUCE = "Bruce/S";
const E_COMYN = "Comyn/E";
const S_COMYN = "Comyn/S";
const WALLACE = "Wallace";
const NORSE = "Norse";
const FRENCH_KNIGHTS = "French Knights";

// serif cirled numbers
const DIE_HIT = [ 0, '\u2776', '\u2777', '\u2778', '\u2779', '\u277A', '\u277B' ];
const DIE_MISS = [ 0, '\u2460', '\u2461', '\u2462', '\u2463', '\u2464', '\u2465' ];

const ATTACK_MARK = "*";
const RESERVE_MARK = "";

let states = {};

let game = null;

function log(...args) {
	let s = Array.from(args).join(" ");
	game.log.push(s);
}

function log_battle(...args) {
	let s = Array.from(args).join("");
	game.log.push(game.active[0] + ": " + s);
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


function print_turn_log_no_active(text) {
	function print_move(last) {
		return "\n" + n + " " + last.join(" \u2192 ");
	}
	game.turn_log.sort();
	let last = game.turn_log[0];
	let n = 0;
	for (let entry of game.turn_log) {
		if (entry.toString() !== last.toString()) {
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

function print_turn_log(verb) {
	print_turn_log_no_active(game.active + " " + verb + ":");
}

function is_inactive_player(current) {
	return current === OBSERVER || (game.active !== current && game.active !== BOTH);
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
	let save_log = game.log;
	Object.assign(game, JSON.parse(undo.pop()));
	game.undo = undo;
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

function gen_action(view, action, argument) {
	if (!view.actions)
		view.actions = {}
	if (argument !== undefined) {
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

function shuffle_deck() {
	let deck = [];
	for (let c = 1; c <= 25; ++c)
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

function block_name(who) {
	if (who === EDWARD)
		return game.edward === 1 ? "Edward I" : "Edward II";
	if (who === KING)
		return "Scottish King";
	return BLOCKS[who].name;
}

function block_owner(who) {
	return BLOCKS[who].owner;
}

function block_type(who) {
	return BLOCKS[who].type;
}

function block_move(who) {
	return BLOCKS[who].move;
}

function block_max_steps(who) {
	return BLOCKS[who].steps;
}

function block_is_mortal(who) {
	return BLOCKS[who].mortal;
}

function block_initiative(who) {
	return BLOCKS[who].combat[0];
}

function block_printed_fire_power(who) {
	return BLOCKS[who].combat[1] | 0;
}

function block_fire_power(who, where) {
	let area = AREAS[where];
	let combat = block_printed_fire_power(who);
	if (is_defender(who)) {
		if (block_type(who) === 'nobles' && area.home === block_name(who))
			++combat;
		else if (who === MORAY && where === "Moray")
			++combat;
	}
	return combat;
}

function is_coastal_area(where) {
	return AREAS[where].coastal;
}

function is_cathedral_area(where) {
	return AREAS[where].cathedral;
}

function is_friendly_coastal_area(where) {
	return is_coastal_area(where) && is_friendly_area(where);
}

function is_in_friendly_coastal_area(who) {
	let where = game.location[who];
	if (where && where !== E_BAG && where !== S_BAG)
		return is_friendly_coastal_area(where);
	return false;
}

function is_on_map(who) {
	let where = game.location[who];
	if (where && where !== E_BAG && where !== S_BAG)
		return true;
	return false;
}

function count_blocks_in_area(where) {
	let count = 0;
	for (let b in BLOCKS)
		if (game.location[b] === where)
			++count;
	return count;
}

function castle_limit(where) {
	if (game.active === SCOTLAND && is_cathedral_area(where))
		return AREAS[where].limit + 1;
	return AREAS[where].limit;
}

function is_within_castle_limit(where) {
	return count_blocks_in_area(where) <= castle_limit(where);
}

function is_under_castle_limit(where) {
	return count_blocks_in_area(where) < castle_limit(where);
}

function count_english_nobles() {
	let count = 0;
	for (let b in BLOCKS)
		if (block_owner(b) === ENGLAND && block_type(b) === 'nobles')
			if (is_on_map(b))
				++count;
	return count;
}

function count_scottish_nobles() {
	let count = 0;
	for (let b in BLOCKS)
		if (block_owner(b) === SCOTLAND && block_type(b) === 'nobles')
			if (is_on_map(b))
				++count;
	if (is_on_map(MORAY))
		++count;
	return count;
}

function find_noble(owner, name) {
	if (name in BLOCKS)
		return name;
	return name + "/" + owner[0];
}

function border_id(a, b) {
	return (a < b) ? a + "/" + b : b + "/" + a;
}

function border_was_last_used_by_enemy(from, to) {
	return game.last_used[border_id(from, to)] === ENEMY[game.active];
}

function border_type(a, b) {
	return BORDERS[border_id(a,b)];
}

function border_limit(a, b) {
	return game.border_limit[border_id(a,b)] || 0;
}

function reset_border_limits() {
	game.border_limit = {};
}

function count_friendly(where) {
	let p = game.active;
	let count = 0;
	for (let b in BLOCKS)
		if (game.location[b] === where && block_owner(b) === p)
			++count;
	return count;
}

function count_enemy(where) {
	let p = ENEMY[game.active];
	let count = 0;
	for (let b in BLOCKS)
		if (game.location[b] === where && block_owner(b) === p)
			++count;
	return count;
}

function is_friendly_area(where) { return count_friendly(where) > 0 && count_enemy(where) === 0; }
function is_enemy_area(where) { return count_friendly(where) === 0 && count_enemy(where) > 0; }
function is_neutral_area(where) { return count_friendly(where) === 0 && count_enemy(where) === 0; }
function is_contested_area(where) { return count_friendly(where) > 0 && count_enemy(where) > 0; }
function is_friendly_or_neutral_area(where) { return is_friendly_area(where) || is_neutral_area(where); }

function have_contested_areas() {
	for (let where in AREAS)
		if (is_contested_area(where))
			return true;
	return false;
}

function count_pinning(where) {
	return count_enemy(where);
}

function count_pinned(where) {
	let count = 0;
	for (let b in BLOCKS)
		if (game.location[b] === where && block_owner(b) === game.active)
			if (!game.reserves.includes(b))
				++count;
	return count;
}

function is_pinned(from) {
	if (game.active === game.p2) {
		if (count_pinned(from) <= count_pinning(from))
			return true;
	}
	return false;
}

function can_block_use_border(who, from, to) {
	if (border_type(from, to) === 'major')
		return border_limit(from, to) < 6;
	return border_limit(from, to) < 2;
}

function can_block_move_to(who, from, to) {
	// No group moves across Anglo-Scottish border
	if (from === ENGLAND || to === ENGLAND)
		if (game.moves === 0)
			return false;
	if (game.active === SCOTLAND && game.truce === SCOTLAND && to === ENGLAND)
		return false;
	if (can_block_use_border(who, from, to)) {
		if (count_pinning(from) > 0) {
			if (border_was_last_used_by_enemy(from, to))
				return false;
		}
		if (game.truce === game.active && is_enemy_area(to))
			return false;
		return true;
	}
	return false;
}

function can_block_move(who) {
	if (who === NORSE)
		return false;
	if (block_owner(who) === game.active && !game.moved[who]) {
		let from = game.location[who];
		if (from) {
			if (is_pinned(from))
				return false;
			for (let to of AREAS[from].exits)
				if (can_block_move_to(who, from, to))
					return true;
		}
	}
	return false;
}

function can_block_continue(who, from, here) {
	if (here === ENGLAND)
		return false;
	if (is_contested_area(here))
		return false;
	if (border_type(from, here) === 'minor')
		return false;
	if (game.distance >= block_move(who))
		return false;
	for (let to of AREAS[here].exits)
		if (to !== game.last_from && can_block_move_to(who, here, to))
			return true;
	return false;
}

function can_block_retreat_to(who, to) {
	if (is_friendly_area(to) || is_neutral_area(to)) {
		let from = game.location[who];
		if (block_owner(who) === ENGLAND && from === ENGLAND)
			return false;
		if (block_owner(who) === SCOTLAND && to === ENGLAND)
			return false;
		if (can_block_use_border(who, from, to)) {
			if (border_was_last_used_by_enemy(from, to))
				return false;
			return true;
		}
	}
	return false;
}

function can_block_retreat(who) {
	if (block_owner(who) === game.active) {
		if (who === NORSE)
			return true;
		let from = game.location[who];
		for (let to of AREAS[from].exits)
			if (can_block_retreat_to(who, to))
				return true;
	}
	return false;
}

function can_block_regroup_to(who, to) {
	if (is_friendly_area(to) || is_neutral_area(to)) {
		let from = game.location[who];
		if (block_owner(who) === ENGLAND && from === ENGLAND)
			return false;
		if (block_owner(who) === SCOTLAND && to === ENGLAND)
			return false;
		if (can_block_use_border(who, from, to))
			return true;
	}
	return false;
}

function can_block_regroup(who) {
	if (block_owner(who) === game.active) {
		let from = game.location[who];
		for (let to of AREAS[from].exits)
			if (can_block_regroup_to(who, to))
				return true;
	}
	return false;
}

function is_battle_reserve(b) {
	return game.reserves.includes(b);
}

function is_attacker(b) {
	if (game.location[b] === game.where && block_owner(b) === game.attacker[game.where])
		return !game.reserves.includes(b);
	return false;
}

function is_defender(b) {
	if (game.location[b] === game.where && block_owner(b) !== game.attacker[game.where])
		return !game.reserves.includes(b);
	return false;
}

function swap_blocks(old) {
	let bo = ENEMY[block_owner(old)];
	let b = find_noble(bo, block_name(old));
	game.location[b] = game.location[old];
	game.steps[b] = game.steps[old];
	game.location[old] = null;
	game.steps[old] = block_max_steps(old);
	return b;
}

function disband(who) {
	game.location[who] = block_owner(who) === ENGLAND ? E_BAG : S_BAG;
	game.steps[who] = block_max_steps(who);
}

function eliminate_block(who, reason) {
	if (block_type(who) === 'nobles') {
		if (reason === 'retreat') {
			game.turn_log.push([game.location[who], "Captured"]);
		} else if (reason === 'combat') {
			game.flash = block_name(who) + " is captured.";
			log(block_name(who) + " is captured.");
		} else {
			log(block_name(who) + " is captured.");
		}
	} else {
		if (reason === 'retreat') {
			game.turn_log.push([game.location[who], "Eliminated"]);
		} else if (reason === 'combat') {
			game.flash = block_name(who) + " is eliminated.";
			log(block_name(who) + " is eliminated.");
		} else {
			if (block_owner(who) === ENGLAND)
				log("English block is eliminated.");
			else
				log("Scottish block is eliminated.");
		}
	}

	// TODO: clean up and check all combinations
	if (who === EDWARD) {
		if (reason === 'combat' || reason === 'retreat') {
			if (game.edward === 1) {
				game.edward = 2;
				disband(who);
			} else {
				game.location[who] = null;
				if (reason === 'combat') {
					game.victory = "Scotland wins because king Edward II has died in battle!";
					game.result = SCOTLAND;
				}
			}
		} else {
			disband(who);
		}
	} else if (who === KING) {
		game.location[who] = null;
		if (reason === 'combat' || reason === 'retreat') {
			game.victory = "England wins because the Scottish king has died in battle!";
			game.result = ENGLAND
		}
	} else if (block_is_mortal(who) && (reason === 'combat' || reason === 'retreat')) {
		game.location[who] = null;
	} else if (block_type(who) === 'nobles') {
		who = swap_blocks(who);
		game.steps[who] = 1; // flip at strength 1 if eliminated
		if (reason === 'combat' || reason === 'retreat')
			game.reserves.push(who);
	} else {
		disband(who);
	}
}

function reduce_block(who, reason) {
	if (game.steps[who] === 1) {
		eliminate_block(who, reason);
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

const CELTIC_BLOCKS = [
	"Ulster Infantry",
	"Wales Archers",
	"Wales Infantry",
];

function celtic_unity_roll(who) {
	let die = roll_d6();
	if (die >= 5) {
		log(who + " roll " + DIE_HIT[die] + " for Celtic unity and return to the draw pool.");
		disband(who);
	} else {
		log(who + " roll " + DIE_MISS[die] + " for Celtic unity \u2013 no effect.");
	}
}

// SETUP

function reset_blocks() {
	for (let b in BLOCKS) {
		game.steps[b] = block_max_steps(b);
		if (block_type(b) === 'nobles')
			game.location[b] = null;
		else if (block_owner(b) === ENGLAND)
			game.location[b] = E_BAG;
		else
			game.location[b] = S_BAG;
	}
}

function deploy_noble(owner, area, name) {
	if (name in BLOCKS) {
		game.location[name] = area;
	} else {
		let friend = find_noble(owner, name);
		let enemy = find_noble(ENEMY[owner], name);
		game.location[friend] = area;
		game.location[enemy] = null;
	}
}

function deploy_block(area, block) {
	game.location[block] = area;
}

function draw_from_bag(bag, exclude_list) {
	let list = [];
	for (let b in BLOCKS) {
		if (exclude_list && exclude_list.includes(b))
			continue;
		if (game.location[b] === bag)
			list.push(b);
	}
	return list[Math.floor(Math.random() * list.length)];
}

function deploy_english(count) {
	let list = [];
	for (let b in BLOCKS)
		if (game.location[b] === E_BAG)
			list.push(b);
	for (let i = 0; i < count; ++i) {
		let x = Math.floor(Math.random() * list.length);
		let b = list[x];
		list.splice(x,1);
		game.location[b] = ENGLAND;
		game.steps[b] = block_max_steps(b);
	}
}

function deploy_off_map(block) {
	game.location[block] = null;
}

function setup_braveheart() {
	reset_blocks();

	deploy_noble("England", "Badenoch", "Comyn");
	deploy_noble("England", "Angus", "Angus");
	deploy_noble("England", "Argyll", "Argyll");
	deploy_noble("England", "Mar", "Mar");
	deploy_noble("England", "Lennox", "Lennox");
	deploy_noble("England", "Buchan", "Buchan");
	deploy_noble("England", "Ross", "Ross");
	deploy_noble("England", "Atholl", "Atholl");
	deploy_noble("England", "Dunbar", "Dunbar");
	deploy_noble("England", "Mentieth", "Mentieth");
	deploy_noble("England", "Lanark", "Steward");

	deploy_block("Lothian", "Cumbria Infantry");
	deploy_block("Mentieth", "Northumber Infantry");

	deploy_english(4);

	deploy_noble("Scotland", "Annan", "Bruce");
	deploy_noble("Scotland", "Galloway", "Galloway");

	deploy_block("Fife", "Wallace");
	deploy_block("Fife", "Douglas");
	deploy_block("Fife", "Barclay");
	deploy_block("Moray", "Moray");
	deploy_block("Moray", "Fraser");
	deploy_block("Strathspey", "Grant");

	deploy_off_map("King");
	deploy_off_map("French Knights");

	game.scottish_king = false;
	game.edward = 1;
	game.year = 1297;
	game.end_year = 1305;
}

function setup_the_bruce() {
	reset_blocks();

	deploy_noble("England", "Badenoch", "Comyn");
	deploy_noble("England", "Angus", "Angus");
	deploy_noble("England", "Argyll", "Argyll");
	deploy_noble("England", "Buchan", "Buchan");
	deploy_noble("England", "Galloway", "Galloway");
	deploy_noble("England", "Ross", "Ross");
	deploy_noble("England", "Mentieth", "Mentieth");
	deploy_noble("England", "Lanark", "Steward");

	deploy_block("Moray", "Cumbria Infantry");
	deploy_block("Mentieth", "Northumber Infantry");
	deploy_block("Lothian", "Durham Infantry");
	deploy_block("Lanark", "Westmor Infantry");

	deploy_english(6);

	deploy_noble("Scotland", "Dunbar", "Dunbar");
	deploy_noble("Scotland", "Lennox", "Lennox");
	deploy_noble("Scotland", "Atholl", "Atholl");
	deploy_noble("Scotland", "Mar", "Mar");
	deploy_noble("Scotland", "Carrick", "Bruce");

	deploy_block("Fife", "King");
	deploy_block("Fife", "Douglas");
	deploy_block("Fife", "Barclay");
	deploy_block("Lennox", "Campbell");
	deploy_block("Carrick", "Lindsay");

	deploy_off_map("Moray");
	deploy_off_map("Wallace");
	deploy_off_map("French Knights");

	game.scottish_king = true;
	game.edward = 1;
	game.year = 1306;
	game.end_year = 1314;
}

function setup_campaign() {
	setup_braveheart();
	game.end_year = 1400; /* no limit */
}

// GAME TURN

function start_year() {
	log("");
	log("Start Year " + game.year + ".");

	// Deal new cards
	let deck = shuffle_deck();
	game.e_hand = deal_cards(deck, 5);
	game.s_hand = deal_cards(deck, 5);

	start_game_turn();
}

function start_game_turn() {
	let turn = 6 - game.e_hand.length;
	log("");
	log("Start Turn " + turn + " of Year " + game.year + ".");

	// Reset movement and attack tracking state
	game.truce = false;
	reset_border_limits();
	game.last_used = {};
	game.attacker = {};
	game.reserves = [];
	game.moved = {};

	goto_card_phase();
}

function end_game_turn() {
	if (count_english_nobles() === 0) {
		game.victory = "Scotland wins by controlling all the nobles!";
		game.result = SCOTLAND;
	}
	if (count_scottish_nobles() === 0) {
		game.victory = "England wins by controlling all the nobles!";
		game.result = ENGLAND;
	}
	if (game.victory)
		return goto_game_over();

	if (game.e_hand.length > 0)
		start_game_turn()
	else
		goto_winter_turn();
}

// CARD PHASE

function goto_card_phase() {
	game.e_card = 0;
	game.s_card = 0;
	game.show_cards = false;
	game.state = 'play_card';
	game.active = BOTH;
}

function resume_play_card() {
	if (game.s_card > 0 && game.e_card > 0)
		reveal_cards();
	else if (game.s_card > 0)
		game.active = ENGLAND;
	else if (game.e_card > 0)
		game.active = SCOTLAND;
	else
		game.active = BOTH;
}

states.play_card = {
	prompt: function (view, current) {
		if (current === OBSERVER)
			return view.prompt = "Waiting for players to play a card.";
		if (current === ENGLAND) {
			if (game.e_card) {
				view.prompt = "Waiting for Scotland to play a card.";
				gen_action(view, 'undo');
			} else {
				view.prompt = "Play a card.";
				for (let c of game.e_hand)
					gen_action(view, 'play', c);
			}
		}
		if (current === SCOTLAND) {
			if (game.s_card) {
				view.prompt = "Waiting for England to play a card.";
				gen_action(view, 'undo');
			} else {
				view.prompt = "Play a card.";
				for (let c of game.s_hand)
					gen_action(view, 'play', c);
			}
		}
	},
	play: function (card, current) {
		if (current === ENGLAND) {
			remove_from_array(game.e_hand, card);
			game.e_card = card;
		}
		if (current === SCOTLAND) {
			remove_from_array(game.s_hand, card);
			game.s_card = card;
		}
		resume_play_card();
	},
	undo: function (_, current) {
		if (current === ENGLAND) {
			game.e_hand.push(game.e_card);
			game.e_card = 0;
		}
		if (current === SCOTLAND) {
			game.s_hand.push(game.s_card);
			game.s_card = 0;
		}
		resume_play_card();
	}
}

function reveal_cards() {
	log("England plays " + CARDS[game.e_card].name + ".");
	log("Scotland plays " + CARDS[game.s_card].name + ".");
	game.show_cards = true;

	let ec = CARDS[game.e_card];
	let sc = CARDS[game.s_card];

	if (ec.event && sc.event) {
		log("Two events played at the same time. The year will end after this turn.");
		game.e_hand.length = 0;
		game.s_hand.length = 0;
	}

	if (ec.event) {
		game.p1 = ENGLAND;
		game.p2 = SCOTLAND;
	} else if (sc.event) {
		game.p1 = SCOTLAND;
		game.p2 = ENGLAND;
	} else if (sc.moves > ec.moves) {
		game.p1 = SCOTLAND;
		game.p2 = ENGLAND;
	} else {
		game.p1 = ENGLAND;
		game.p2 = SCOTLAND;
	}

	game.active = game.p1;
	start_player_turn();
}

function start_player_turn() {
	log("");
	log("Start " + game.active + " turn.");
	reset_border_limits();
	let ec = CARDS[game.e_card];
	let sc = CARDS[game.s_card];
	if (game.active === ENGLAND && ec.event)
		goto_event(ec.event);
	else if (game.active === SCOTLAND && sc.event)
		goto_event(sc.event);
	else if (game.active === ENGLAND)
		goto_move_phase(ec.moves);
	else if (game.active === SCOTLAND)
		goto_move_phase(sc.moves);
}

function end_player_turn() {
	game.moves = 0;
	game.activated = null;
	game.main_origin = null;
	game.main_border = null;

	if (game.active === game.p2) {
		goto_battle_phase();
	} else {
		game.active = game.p2;
		start_player_turn();
	}
}

// CORONATION

function can_crown_bruce() {
	return game.location[WALLACE] === null && game.location[S_BRUCE] === "Fife";
}

function can_crown_comyn() {
	return game.location[WALLACE] === null && game.location[S_COMYN] === "Fife";
}

function can_crown_balliol() {
	return game.year >= 1301 && is_on_map(FRENCH_KNIGHTS);
}

function goto_event(event) {
	if (game.active === SCOTLAND && !game.scottish_king &&
		(can_crown_bruce() || can_crown_comyn() || can_crown_balliol())) {
		game.state = 'coronation_event';
		game.event = event;
	} else {
		goto_event_card(event);
	}
}

states.coronation_event = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to crown a king.";
		view.prompt = "Play event or crown a king?";
		gen_action(view, 'play_event');
		if (can_crown_bruce())
			gen_action(view, 'crown_bruce');
		if (can_crown_comyn())
			gen_action(view, 'crown_comyn');
		if (can_crown_balliol())
			gen_action(view, 'return_of_the_king');
	},
	crown_bruce: function () {
		log("Bruce is crowned King!");
		game.scottish_king = true;
		game.location[KING] = "Fife";
		game.steps[KING] = block_max_steps(KING);
		defect_comyn_nobles();
	},
	crown_comyn: function () {
		log("Comyn is crowned King!");
		game.scottish_king = true;
		game.location[KING] = "Fife";
		game.steps[KING] = block_max_steps(KING);
		defect_bruce_nobles();
	},
	return_of_the_king: function () {
		log("Return of the King!");
		game.scottish_king = true;
		game.location[KING] = game.location[FRENCH_KNIGHTS];
		game.steps[KING] = block_max_steps(KING);
		defect_bruce_nobles();
	},
	play_event: function () {
		let event = game.event;
		delete game.event;
		goto_event_card(event);
	},
}

function defect_bruce_nobles() {
	defect_nobles([ "Bruce", "Mar", "Lennox", "Atholl", "Dunbar", "Mentieth", "Steward" ]);
}

function defect_comyn_nobles() {
	defect_nobles([ "Comyn", "Angus", "Argyll", "Buchan", "Galloway", "Ross" ]);
}

function defect_nobles(list) {
	for (let name of list) {
		let who = find_noble(game.active, name);
		if (is_on_map(who)) {
			let where = game.location[who];
			log(name + " defects.");
			who = swap_blocks(who);
			if (is_contested_area(where))
				game.attacker[where] = block_owner(who);
		}
	}
	resume_coronation();
}

function resume_coronation() {
	if (have_contested_areas()) {
		game.active = game.p1;
		game.state = 'coronation_battles';
	} else {
		game.active = SCOTLAND;
		end_player_turn();
	}
}

states.coronation_battles = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to choose a battle.";
		view.prompt = "Coronation: Choose the next battle to fight!";
		for (let where in AREAS)
			if (is_contested_area(where))
				gen_action(view, 'area', where);
	},
	area: function (where) {
		start_battle(where, 'coronation');
	},
}

// EVENTS

function goto_event_card(event) {
	switch (event) {
	case 'herald': goto_herald(); break;
	case 'pillage': goto_pillage(); break;
	case 'sea_move': goto_sea_move(); break;
	case 'truce': goto_truce(); break;
	case 'victuals': goto_victuals(); break;
	}
}

function goto_truce() {
	log("Truce is in effect!");
	game.truce = ENEMY[game.active];
	end_player_turn();
}

function goto_herald() {
	game.state = 'herald';
}

function is_enemy_noble(who) {
	return is_on_map(who) && block_type(who) === 'nobles' && block_owner(who) === ENEMY[game.active];
}

states.herald = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to choose a noble.";
		view.prompt = "Herald: Name an enemy noble to try to convert to your side.";
		gen_action(view, 'pass');
		for (let b in BLOCKS)
			if (is_enemy_noble(b))
				gen_action(view, 'noble', block_name(b));
	},
	noble: function (name) {
		let who = find_noble(ENEMY[game.active], name);
		let die = roll_d6();
		if (die <= 4) {
			log("Herald roll " + DIE_HIT[die] + " converts " + name + ".");
			let where = game.location[who];
			who = swap_blocks(who);
			if (is_contested_area(where)) {
				game.attacker[where] = game.active;
				start_battle(where, 'herald');
				return;
			}
		} else {
			log("Herald roll " + DIE_MISS[die] + " fails to convert " + name + ".");
		}
		end_player_turn();
	},
	pass: function () {
		end_player_turn();
	},
}

function goto_victuals() {
	game.victuals = 3;
	game.where = null;
	game.state = 'victuals';
	game.turn_log = [];
	clear_undo();
}

states.victuals = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to build.";
		view.prompt = "Victuals: Distribute three steps among friendly blocks in one group.";
		gen_action_undo(view);
		gen_action(view, 'end_builds');
		if (game.victuals > 0) {
			for (let b in BLOCKS) {
				if (is_on_map(b) && block_owner(b) === game.active)
					if (game.steps[b] < block_max_steps(b))
						if (!game.where || game.location[b] === game.where)
							gen_action(view, 'block', b);
			}
		}
	},
	block: function (who) {
		push_undo();
		game.where = game.location[who];
		game.turn_log.push([game.where]);
		++game.steps[who];
		--game.victuals;
	},
	end_builds: function () {
		print_turn_log("victuals");
		clear_undo();
		delete game.victuals;
		game.where = null;
		end_player_turn();
	},
	undo: pop_undo
}

function goto_pillage() {
	game.state = 'pillage';
	game.turn_log = [];
}

states.pillage = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to pillage.";
		view.prompt = "Pillage: Pillage one enemy group adjacent to a friendly group.";
		gen_action(view, 'pass');
		for (let from in AREAS) {
			if (is_friendly_area(from)) {
				for (let to of AREAS[from].exits)
					if (is_contested_area(to) || is_enemy_area(to))
						gen_action(view, 'area', to);
			}
		}
	},
	area: function (where) {
		game.where = where;
		game.pillage = 2;
		game.active = ENEMY[game.active];
		game.state = 'pillage_hits';
	},
	pass: function () {
		end_player_turn();
	},
}

function pillage_victims() {
	function is_candidate(b) {
		return block_owner(b) === game.active && game.location[b] === game.where;
	}
	let max = 0;
	for (let b in BLOCKS)
		if (is_candidate(b) && game.steps[b] > max)
			max = game.steps[b];
	let list = [];
	for (let b in BLOCKS)
		if (is_candidate(b) && game.steps[b] === max)
			list.push(b);
	return list;
}

states.pillage_hits = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to apply pillage hits.";
		view.prompt = "Pillage: Apply two hits in " + game.where + ".";
		for (let b of pillage_victims())
			gen_action(view, 'block', b);
	},
	block: function (who) {
		--game.pillage;
		reduce_block(who, 'pillage');
		if (game.pillage === 0 || pillage_victims().length === 0) {
			game.active = ENEMY[game.active];
			game.state = 'pillage_builds';
			game.pillage = 2 - game.pillage;
			game.from = game.where;
			game.where = null;
		}
	},
}

states.pillage_builds = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to apply pillage builds.";
		view.prompt = "Pillage: Add pillaged steps to friendly blocks in the pillaging group.";
		gen_action_undo(view);
		gen_action(view, 'end_pillage');
		if (game.pillage > 0) {
			if (game.where) {
				for (let b in BLOCKS)
					if (block_owner(b) === game.active && game.location[b] === game.where)
						if (game.steps[b] < block_max_steps(b))
							gen_action(view, 'block', b);
			} else {
				for (let to of AREAS[game.from].exits)
					for (let b in BLOCKS)
						if (block_owner(b) === game.active && game.location[b] === to)
							if (game.steps[b] < block_max_steps(b))
								gen_action(view, 'block', b);
			}
		}
	},
	block: function (who) {
		push_undo();
		game.where = game.location[who];
		game.turn_log.push([game.from, game.where]);
		++game.steps[who];
		--game.pillage;
		// TODO: auto-end pillage builds?
		// if (game.pillage === 0) end_pillage(game.from);
	},
	end_pillage: function () {
		clear_undo();
		while (game.pillage > 0) {
			--game.pillage;
			game.turn_log.push([game.from]);
		}
		end_pillage(game.from);
	},
	undo: pop_undo
}

function end_pillage(where) {
	print_turn_log("pillages");
	game.from = null;
	game.where = null;
	delete game.pillage;
	if (is_contested_area(where)) {
		game.attacker[where] = ENEMY[game.active];
		start_battle(where, 'pillage');
	} else {
		end_player_turn();
	}
}

function goto_sea_move() {
	game.moves = 2;
	game.from = null;
	game.where = null;
	game.state = 'sea_move';
	game.turn_log = [];
	clear_undo();
}

states.sea_move = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to sea move.";
		view.prompt = "Sea Move: Move one or two blocks from one coastal area to one other friendly coastal area.";
		gen_action_undo(view);
		gen_action(view, 'end_move_phase');
		if (game.moves > 0) {
			for (let b in BLOCKS) {
				if (b === NORSE)
					continue;
				if (is_in_friendly_coastal_area(b) && block_owner(b) === game.active)
					if (!game.from || game.location[b] === game.from)
						gen_action(view, 'block', b);
			}
		}
	},
	block: function (who) {
		push_undo();
		game.who = who;
		game.state = 'sea_move_to';
	},
	end_move_phase: function () {
		print_turn_log("sea moves");
		clear_undo();
		game.moves = 0;
		game.from = null;
		game.where = null;
		end_player_turn();
	},
	undo: pop_undo
}

states.sea_move_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to sea move.";
		view.prompt = "Sea Move: Move one or two blocks from one coastal area to one other friendly coastal area.";
		gen_action_undo(view);
		gen_action(view, 'block', game.who);
		if (game.where) {
			gen_action(view, 'area', game.where);
		} else {
			let from = game.location[game.who];
			for (let to in AREAS)
				if (to !== from && is_friendly_coastal_area(to))
					gen_action(view, 'area', to);
		}
	},
	area: function (to) {
		if (!game.from)
			game.from = game.location[game.who];
		game.turn_log.push([game.from, to]);
		game.location[game.who] = to
		game.moved[game.who] = true;
		game.where = to;
		game.who = null;
		--game.moves;
		game.state = 'sea_move';
	},
	block: pop_undo,
	undo: pop_undo
}

// MOVE PHASE

function goto_move_phase(moves) {
	game.state = 'move_who';
	game.moves = moves;
	game.activated = [];
	game.main_origin = {};
	game.main_border = {};
	game.turn_log = [];
	clear_undo();
}

states.move_who = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move.";
		view.prompt = "Choose an army to move. " + game.moves + "MP left.";
		gen_action_undo(view);
		gen_action(view, 'end_move_phase');
		for (let b in BLOCKS) {
			if (b === NORSE && game.active === SCOTLAND && is_on_map(NORSE)) {
				if (!game.moved[b] && game.moves > 0 && !is_pinned(game.location[NORSE]))
					gen_action(view, 'block', NORSE);
			}
			if (can_block_move(b)) {
				if (game.moves === 0) {
					let from = game.location[b];
					if (game.activated.includes(from))
						gen_action(view, 'block', b);
				} else {
					gen_action(view, 'block', b);
				}
			}
		}
	},
	block: function (who) {
		push_undo();
		game.who = who;
		game.state = 'move_where';
		game.origin = game.location[who];
		game.last_from = null;
		game.distance = 0;
	},
	end_move_phase: function () {
		clear_undo();
		game.moves = 0;
		print_turn_log("moves");
		end_player_turn();
	},
	undo: pop_undo
}

function move_block(who, from, to) {
	game.location[who] = to;
	game.border_limit[border_id(from, to)] = border_limit(from, to) + 1;
	game.distance ++;
	if (is_contested_area(to)) {
		game.last_used[border_id(from, to)] = game.active;
		if (!game.attacker[to]) {
			game.attacker[to] = game.active;
			game.main_border[to] = from;
			game.main_origin[to] = game.origin;
			return ATTACK_MARK;
		} else {
			if (game.attacker[to] !== game.active || game.main_border[to] !== from || game.main_origin[to] !== game.origin) {
				game.reserves.push(who);
				return RESERVE_MARK;
			} else {
				return ATTACK_MARK;
			}
		}
	}
	return false;
}

states.move_where = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move.";
		view.prompt = "Move " + block_name(game.who) + "."
		gen_action_undo(view);
		gen_action(view, 'block', game.who);
		let from = game.location[game.who];
		if (game.who === NORSE) {
			for (let to in AREAS)
				if (to !== from && to !== ENGLAND && is_coastal_area(to))
					if (game.truce !== game.active || !is_enemy_area(to))
						gen_action(view, 'area', to);
		} else {
			if (game.distance > 0)
				gen_action(view, 'area', from);
			for (let to of AREAS[from].exits) {
				if (to !== game.last_from && can_block_move_to(game.who, from, to))
					gen_action(view, 'area', to);
			}
		}
	},
	block: function () {
		if (game.distance === 0)
			pop_undo();
		else
			end_move();
	},
	area: function (to) {
		let from = game.location[game.who];
		if (to === from) {
			end_move();
			return;
		}
		if (game.who === NORSE) {
			log("The Norse move by sea.");
			game.location[game.who] = to;
			game.moved[game.who] = true;
			if (is_contested_area(to)) {
				if (!game.attacker[to]) {
					game.turn_log.push([from, to + ATTACK_MARK + " (Norse)"]);
					game.attacker[to] = game.active;
				} else {
					game.turn_log.push([from, to + RESERVE_MARK + " (Norse)"]);
					game.reserves.push(game.who);
				}
			} else {
				game.turn_log.push([from, to + " (Norse)"]);
			}
			--game.moves;
			game.who = null;
			game.state = 'move_who';
		} else {
			if (game.distance === 0)
				game.move_buf = [ from ];
			let mark = move_block(game.who, from, to);
			if (mark)
				game.move_buf.push(to + mark);
			else
				game.move_buf.push(to);
			game.last_from = from;
			if (!can_block_continue(game.who, from, to))
				end_move();
		}
	},
	undo: pop_undo
}

function end_move() {
	if (game.distance > 0) {
		let to = game.location[game.who];
		if (game.origin === ENGLAND || to === ENGLAND) {
			log(game.active + " crosses the Anglo-Scottish border.");
			game.moves --;
		} else if (!game.activated.includes(game.origin)) {
			log(game.active + " activates " + game.origin + ".");
			game.activated.push(game.origin);
			game.moves --;
		}
		game.moved[game.who] = true;
		game.turn_log.push(game.move_buf);
	}
	delete game.move_buf;
	game.who = null;
	game.distance = 0;
	game.origin = null;
	game.last_from = null;
	game.state = 'move_who';
}

// BATTLE PHASE

function goto_battle_phase() {
	if (have_contested_areas()) {
		game.active = game.p1;
		game.state = 'battle_phase';
	} else {
		goto_border_raids();
	}
}

states.battle_phase = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to choose a battle.";
		view.prompt = "Choose the next battle to fight!";
		for (let where in AREAS)
			if (is_contested_area(where))
				gen_action(view, 'area', where);
	},
	area: function (where) {
		start_battle(where, 'battle');
	},
}

function start_battle(where, reason) {
	game.battle_active = game.active;
	game.battle_reason = reason;
	game.flash = "";
	log("");
	if (reason !== 'battle')
		log("Defection battle in " + where + ".");
	else
		log("Battle in " + where + ".");
	game.where = where;
	game.battle_round = 0;
	game.state = 'battle_round';
	start_battle_round();
}

function resume_battle() {
	if (game.victory)
		return goto_game_over();
	game.state = 'battle_round';
	pump_battle_round();
}

function end_battle() {
	if (game.turn_log && game.turn_log.length > 0)
		print_turn_log_no_active("Retreats from " + game.where + ":");

	game.flash = "";
	game.battle_round = 0;
	reset_border_limits();
	game.moved = {};

	game.active = game.attacker[game.where];
	let victor = game.active;
	if (is_contested_area(game.where))
		victor = ENEMY[game.active];
	else if (is_enemy_area(game.where))
		victor = ENEMY[game.active];
	log(victor + " wins the battle in " + game.where + "!");

	goto_retreat();
}

function bring_on_reserves() {
	for (let b in BLOCKS)
		if (game.location[b] === game.where)
			remove_from_array(game.reserves, b);
}

function start_battle_round() {
	if (++game.battle_round <= 3) {
		if (game.turn_log && game.turn_log.length > 0)
			print_turn_log_no_active("Retreats from " + game.where + ":");
		game.turn_log = [];

		log("~ Battle Round " + game.battle_round + " ~");

		reset_border_limits();
		game.moved = {};

		if (game.battle_round === 1) {
			for (let b of CELTIC_BLOCKS)
				if (game.location[b] === game.where && !is_battle_reserve(b))
					celtic_unity_roll(b);
		}
		if (game.battle_round === 2) {
			if (count_defenders() === 0) {
				log("Defending main force was eliminated.");
				log("The attacker is now the defender.");
				game.attacker[game.where] = ENEMY[game.attacker[game.where]];
			} else if (count_attackers() === 0) {
				log("Attacking main force was eliminated.");
			}
			for (let b of CELTIC_BLOCKS)
				if (game.location[b] === game.where && is_battle_reserve(b))
					celtic_unity_roll(b);
			bring_on_reserves();
		}
		if (game.battle_round === 3) {
			bring_on_reserves();
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
				if (block_initiative(b) === ci) {
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

	if (is_friendly_area(game.where) || is_enemy_area(game.where)) {
		end_battle();
	} else if (count_attackers() === 0 || count_defenders() === 0) {
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

function pass_with_block(b) {
	game.flash = block_name(b) + " passes.";
	log_battle(block_name(b) + " passes.");
	game.moved[b] = true;
	resume_battle();
}

function retreat_with_block(b) {
	game.who = b;
	game.state = 'retreat_in_battle';
}

function fire_with_block(b) {
	game.moved[b] = true;
	let steps = game.steps[b];
	let fire = block_fire_power(b, game.where);
	let printed_fire = block_printed_fire_power(b);
	let name = block_name(b) + " " + BLOCKS[b].combat;
	if (fire > printed_fire)
		name += "+" + (fire - printed_fire);

	let rolls = [];
	game.hits = 0;
	for (let i = 0; i < steps; ++i) {
		let die = roll_d6();
		if (die <= fire) {
			rolls.push(DIE_HIT[die]);
			++game.hits;
		} else {
			rolls.push(DIE_MISS[die]);
		}
	}

	game.flash = name + " fires " + rolls.join(" ") + " ";
	if (game.hits === 0)
		game.flash += "and misses.";
	else if (game.hits === 1)
		game.flash += "and scores 1 hit.";
	else
		game.flash += "and scores " + game.hits + " hits.";

	log_battle(name + " fires " + rolls.join("") + ".");

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
		view.prompt = "Fire, retreat, or pass with an army.";
		for (let b of game.battle_list) {
			gen_action(view, 'block', b);
			gen_action(view, 'battle_fire', b);
			gen_action(view, 'battle_pass', b);
			if (can_block_retreat(b))
				gen_action(view, 'battle_retreat', b);
		}
	},
	block: function (who) {
		fire_with_block(who);
	},
	battle_fire: function (who) {
		fire_with_block(who);
	},
	battle_retreat: function (who) {
		retreat_with_block(who);
	},
	battle_pass: function (who) {
		pass_with_block(who);
	}
}

function goto_battle_hits() {
	game.battle_list = list_victims(game.active);
	if (game.battle_list.length === 0)
		resume_battle();
	else
		game.state = 'battle_hits';
}

function apply_hit(who) {
	game.flash = block_name(who) + " takes a hit.";
	reduce_block(who, 'combat');
	game.hits--;
	if (game.victory)
		goto_game_over();
	else if (game.hits === 0)
		resume_battle();
	else {
		game.battle_list = list_victims(game.active);
		if (game.battle_list.length === 0)
			resume_battle();
		else
			game.flash += " " + game.hits + (game.hits === 1 ? " hit left." : " hits left.");
	}
}

function list_victims(p) {
	let is_candidate = (p === game.attacker[game.where]) ? is_attacker : is_defender;
	let max = 0;
	for (let b in BLOCKS)
		if (is_candidate(b) && game.steps[b] > max)
			max = game.steps[b];
	let list = [];
	for (let b in BLOCKS)
		if (is_candidate(b) && game.steps[b] === max)
			list.push(b);
	return list;
}

states.battle_hits = {
	show_battle: true,
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to assign hits.";
		view.prompt = "Assign " + game.hits + (game.hits !== 1 ? " hits" : " hit") + " to your armies.";
		for (let b of game.battle_list) {
			gen_action(view, 'block', b);
			gen_action(view, 'battle_hit', b);
		}
	},
	block: function (who) {
		apply_hit(who);
	},
	battle_hit: function (who) {
		apply_hit(who);
	},
}

function goto_retreat() {
	game.active = game.attacker[game.where];
	if (is_contested_area(game.where)) {
		game.state = 'retreat';
		game.turn_log = [];
		clear_undo();
	} else {
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
			if (game.location[b] === game.where && can_block_retreat(b)) {
				gen_action(view, 'block', b);
				can_retreat = true;
			}
		}
		if (!is_contested_area(game.where) || !can_retreat)
			gen_action(view, 'end_retreat');
	},
	end_retreat: function () {
		clear_undo();
		for (let b in BLOCKS)
			if (game.location[b] === game.where && block_owner(b) === game.active)
				eliminate_block(b, 'retreat');
		print_turn_log("retreats");
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
		gen_action_undo(view);
		gen_action(view, 'block', game.who);
		let can_retreat = false;
		if (game.who === NORSE) {
			view.prompt = "Retreat: Move the army to a friendly coastal area.";
			for (let to in AREAS) {
				if (to !== game.where && to !== ENGLAND && is_friendly_coastal_area(to)) {
					gen_action(view, 'area', to);
					can_retreat = true;
				}
			}
		} else {
			view.prompt = "Retreat: Move the army to a friendly or neutral area.";
			for (let to of AREAS[game.where].exits) {
				if (can_block_retreat_to(game.who, to)) {
					gen_action(view, 'area', to);
					can_retreat = true;
				}
			}
		}
		if (!can_retreat)
			gen_action(view, 'eliminate');
	},
	area: function (to) {
		let from = game.where;
		if (game.who === NORSE) {
			game.turn_log.push([from, to + " (Norse)"]);
			game.location[game.who] = to;
		} else {
			game.turn_log.push([from, to]);
			move_block(game.who, game.where, to);
		}
		game.who = null;
		game.state = 'retreat';
	},
	eliminate: function () {
		eliminate_block(game.who, 'retreat');
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
		if (game.who === NORSE) {
			view.prompt = "Retreat: Move the army to a friendly coastal area.";
			for (let to in AREAS)
				if (to !== game.where && to !== ENGLAND && is_friendly_coastal_area(to))
					gen_action(view, 'area', to);
		} else {
			view.prompt = "Retreat: Move the army to a friendly or neutral area.";
			for (let to of AREAS[game.where].exits)
				if (can_block_retreat_to(game.who, to))
					gen_action(view, 'area', to);
		}
	},
	area: function (to) {
		game.turn_log.push([game.active, to]);
		if (game.who === NORSE) {
			game.flash = "Norse retreat to " + to + ".";
			log_battle(game.flash);
			game.location[game.who] = to;
		} else {
			game.flash = block_name(game.who) + " retreats.";
			log_battle(game.flash);
			move_block(game.who, game.where, to);
		}
		game.who = null;
		resume_battle();
	},
	block: function () {
		game.who = null;
		resume_battle();
	},
	undo: function () {
		game.who = null;
		resume_battle();
	}
}

function goto_regroup() {
	game.active = game.attacker[game.where];
	if (is_enemy_area(game.where))
		game.active = ENEMY[game.active];
	game.state = 'regroup';
	game.turn_log = [];
	clear_undo();
}

states.regroup = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to regroup.";
		view.prompt = "Regroup: Choose an army to move.";
		gen_action_undo(view);
		gen_action(view, 'end_regroup');
		for (let b in BLOCKS)
			if (game.location[b] === game.where && can_block_regroup(b))
				gen_action(view, 'block', b);
	},
	block: function (who) {
		push_undo();
		game.who = who;
		game.state = 'regroup_to';
	},
	end_regroup: function () {
		print_turn_log("regroups");
		game.attacker[game.where] = null;
		game.where = null;
		clear_undo();
		game.active = game.battle_active;
		delete game.battle_active;
		if (game.battle_reason === 'herald') {
			delete game.battle_reason;
			game.last_used = {};
			end_player_turn();
		} else if (game.battle_reason === 'pillage') {
			delete game.battle_reason;
			game.last_used = {};
			end_player_turn();
		} else if (game.battle_reason === 'coronation') {
			delete game.battle_reason;
			game.last_used = {};
			resume_coronation();
		} else {
			delete game.battle_reason;
			goto_battle_phase();
		}
	},
	undo: pop_undo
}

states.regroup_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to regroup.";
		view.prompt = "Regroup: Move the army to a friendly or neutral area.";
		gen_action_undo(view);
		gen_action(view, 'block', game.who);
		if (game.who === NORSE) {
			for (let to in AREAS)
				if (to !== game.where && to !== ENGLAND && is_friendly_coastal_area(to))
					gen_action(view, 'area', to);
		} else {
			for (let to of AREAS[game.where].exits)
				if (can_block_regroup_to(game.who, to))
					gen_action(view, 'area', to);
		}
	},
	area: function (to) {
		let from = game.where;
		if (game.who === NORSE) {
			game.turn_log.push([from, to + " (Norse)"]);
			game.location[game.who] = to;
		} else {
			game.turn_log.push([from, to]);
			move_block(game.who, game.where, to);
		}
		game.who = null;
		game.state = 'regroup';
	},
	block: pop_undo,
	undo: pop_undo
}

// BORDER RAIDS

function count_non_noble_english_blocks_on_map() {
	let count = 0;
	for (let b in BLOCKS)
		if (block_owner(b) === ENGLAND && block_type(b) !== 'nobles')
			if (is_on_map(b))
				++count;
	return count;
}

function goto_border_raids() {
	game.active = ENGLAND;
	if (is_enemy_area(ENGLAND)) {
		log("Scotland border raids.");
		if (count_non_noble_english_blocks_on_map() > 0) {
			game.state = 'border_raids';
		} else {
			log("England has no non-noble blocks in play.");
			end_game_turn();
		}
	} else {
		end_game_turn();
	}
}

states.border_raids = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for England to choose a border raid victim.";
		view.prompt = "Border Raids: Eliminate a non-Noble block.";
		for (let b in BLOCKS)
			if (block_owner(b) === ENGLAND && block_type(b) !== 'nobles')
				if (is_on_map(b))
					gen_action(view, 'block', b);
	},
	block: function (who) {
		eliminate_block(who, 'border_raids')
		end_game_turn();
	},
}

// WINTERING

function goto_winter_turn() {
	game.moved = {};
	log("");
	log("Start Wintering.");
	english_nobles_go_home();
}

function is_bruce(who) {
	return who === E_BRUCE || who === S_BRUCE;
}

function is_comyn(who) {
	return who === E_COMYN || who === S_COMYN;
}

function find_noble_home(who) {
	for (let where in AREAS)
		if (AREAS[where].home === block_name(who))
			return where;
	return null;
}

function go_home_to(who, home, defected = false) {
	let name = block_name(who);
	let from = game.location[who];
	if (from !== home) {
		game.location[who] = home;
		if (is_contested_area(home)) {
			who = swap_blocks(who);
			defected = true;
		}
		if (defected)
			game.turn_log.push([name, home + " \u2727"]);
		else
			game.turn_log.push([name, home]);
	}
}

function go_home(who) {
	go_home_to(who, find_noble_home(who));
}

function english_nobles_go_home() {
	game.turn_log = [];
	game.active = ENGLAND;
	for (let b in BLOCKS) {
		if (block_owner(b) === ENGLAND && block_type(b) === 'nobles' && game.location[b])
			if (!is_bruce(b) && !is_comyn(b))
				go_home(b);
	}

	game.going_home = ENGLAND;
	game.bruce_home = false;
	game.comyn_home = false;
	goto_e_bruce();
}

function scottish_nobles_go_home() {
	game.turn_log = [];
	game.active = SCOTLAND;
	for (let b in BLOCKS) {
		if (block_owner(b) === SCOTLAND && block_type(b) === 'nobles' && game.location[b])
			if (!is_bruce(b) && !is_comyn(b))
				go_home(b);
	}
	game.going_home = SCOTLAND;
	goto_s_bruce();
}

function goto_e_bruce() {
	game.who = E_BRUCE;
	if (game.location[E_BRUCE] && !game.bruce_home)
		send_bruce_home();
	else
		end_bruce();
}

function goto_s_bruce() {
	game.who = S_BRUCE;
	if (game.location[S_BRUCE] && !game.bruce_home)
		send_bruce_home();
	else
		end_bruce();
}

function send_bruce_home() {
	game.bruce_home = true;
	let annan = is_friendly_or_neutral_area("Annan");
	let carrick = is_friendly_or_neutral_area("Carrick");
	if (annan && !carrick) {
		go_home_to(game.who, "Annan");
		game.who = null;
		return end_bruce();
	}
	if (carrick && !annan) {
		go_home_to(game.who, "Carrick");
		game.who = null;
		return end_bruce();
	}
	if (!annan && !carrick) {
		game.bruce_defected = true;
		game.active = ENEMY[game.active];
		game.who = swap_blocks(game.who);
	} else {
		game.bruce_defected = false;
	}
	game.state = 'bruce';
}

states.bruce = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move Bruce to one of his home areas.";
		view.prompt = "Nobles go Home: Move Bruce to one of his home areas.";
		gen_action(view, 'area', "Annan");
		gen_action(view, 'area', "Carrick");
	},
	area: function (to) {
		go_home_to(game.who, to, game.bruce_defected);
		game.who = null;
		end_bruce();
	},
}

function end_bruce() {
	game.who = null;
	game.active = game.going_home;
	delete game.bruce_defected;
	if (game.going_home === ENGLAND)
		goto_e_comyn();
	else
		goto_s_comyn();
}

function goto_e_comyn() {
	game.who = E_COMYN;
	if (game.location[E_COMYN] && !game.comyn_home)
		send_comyn_home();
	else
		end_comyn();
}

function goto_s_comyn() {
	game.who = S_COMYN;
	if (game.location[S_COMYN] && !game.comyn_home)
		send_comyn_home();
	else
		end_comyn();
}

function send_comyn_home() {
	game.comyn_home = true;
	let badenoch = is_friendly_or_neutral_area("Badenoch");
	let lochaber = is_friendly_or_neutral_area("Lochaber");
	if (badenoch && !lochaber) {
		go_home_to(game.who, "Badenoch");
		game.who = null;
		return end_comyn();
	}
	if (lochaber && !badenoch) {
		go_home_to(game.who, "Lochaber");
		game.who = null;
		return end_comyn();
	}
	if (!lochaber && !badenoch) {
		game.comyn_defected = true;
		game.active = ENEMY[game.active];
		game.who = swap_blocks(game.who);
	} else {
		game.comyn_defected = false;
	}
	game.state = 'comyn';
}

states.comyn = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move Comyn to one of his home areas.";
		view.prompt = "Nobles go Home: Move Comyn to one of his home areas.";
		gen_action(view, 'area', "Badenoch");
		gen_action(view, 'area', "Lochaber");
	},
	area: function (to) {
		go_home_to(game.who, to, game.comyn_defected);
		game.who = null;
		end_comyn();
	},
}

function end_comyn() {
	game.who = null;
	game.active = game.going_home;
	delete game.comyn_defected;
	if (game.active === ENGLAND) {
		print_turn_log_no_count("English nobles go home:");
		scottish_nobles_go_home();
	} else {
		goto_moray();
	}
}

function goto_moray() {
	delete game.going_home;
	delete game.bruce_home;
	delete game.comyn_home;

	if (is_on_map(MORAY) && game.location[MORAY] !== "Moray" && is_friendly_or_neutral_area("Moray")) {
		game.state = 'moray';
		game.active = SCOTLAND;
		game.who = MORAY;
	} else {
		goto_scottish_king();
	}
}

states.moray = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for Scotland to move Moray.";
		view.prompt = "Nobles go Home: Move Moray to his home area or remain where he is.";
		gen_action(view, 'area', game.location[MORAY]);
		gen_action(view, 'area', "Moray");
	},
	disband: function () {
		game.turn_log.push(["Moray", "Pool"]);
		disband(MORAY);
		game.who = null;
		goto_scottish_king();
	},
	area: function (to) {
		let from = game.location[MORAY];
		if (to !== from)
			game.turn_log.push(["Moray", to]);
		game.location[MORAY] = to;
		game.who = null;
		goto_scottish_king();
	},
}

function king_can_go_home(current) {
	for (let where in AREAS)
		if (where !== current && is_cathedral_area(where))
			if (is_friendly_or_neutral_area(where))
				return true;
	return false;
}

function goto_scottish_king() {
	print_turn_log_no_count("Scottish nobles go home:");

	// We can end winter early if Moray and Wallace are dead or on the map, and Moray is not overstacked
	if (game.year === game.end_year) {
		let e = count_english_nobles();
		let s = count_scottish_nobles();
		// We have a clear winner.
		if (s > 7 || e > 7)
			return goto_game_over();
		// Moray is dead so there can be no tie.
		if (game.location[MORAY] === null)
			return goto_game_over();
		// Wallace is dead so there can be no tie breaker.
		if (game.location[WALLACE] === null)
			return goto_game_over();
		// A tie is possible, need to continue to disband and build phase...
	}

	if (is_on_map(KING) && king_can_go_home(game.location[KING])) {
		game.state = 'scottish_king';
		game.active = SCOTLAND;
		game.who = KING;
	} else {
		goto_edward_wintering();
	}
}

states.scottish_king = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for Scotland to move the King.";
		view.prompt = "Scottish King: Move the King to a cathedral or remain where he is.";
		gen_action(view, 'area', game.location[KING]);
		for (let where in AREAS) {
			if (is_cathedral_area(where))
				if (is_friendly_or_neutral_area(where))
					gen_action(view, 'area', where);
		}
	},
	disband: function () {
		log("Scottish King disbands.");
		disband(KING);
		game.who = null;
		goto_edward_wintering();
	},
	area: function (to) {
		if (game.location[KING] !== to) {
			log("Scottish King moves to " + to + ".");
			game.location[KING] = to;
		}
		game.who = null;
		goto_edward_wintering();
	},
}

function is_in_scotland(who) {
	return is_on_map(who) && game.location[who] !== ENGLAND;
}

function goto_edward_wintering() {
	if (game.edward === 1 && game.year !== 1306 && is_in_scotland(EDWARD) && !game.wintered_last_year) {
		game.active = ENGLAND;
		game.who = EDWARD;
		game.state = 'edward_wintering';
		return;
	}

	if (game.edward === 1 && game.year === 1306) {
		log("Edward I dies.");
		game.edward = 2;
	}

	if (is_on_map(EDWARD)) {
		log("Edward disbands.");
		disband(EDWARD);
	}

	game.wintered_last_year = false;
	goto_english_disbanding();
}

function disband_edward() {
	log("Edward disbands.");
	disband(EDWARD);
	game.who = null;
	game.wintered_last_year = false;
	goto_english_disbanding();
}

function winter_edward() {
	log("Edward winters in " + game.location[EDWARD] + ".");
	game.who = null;
	game.wintered_last_year = true;
	goto_english_disbanding();
}

states.edward_wintering = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for England to winter in Scotland or disband.";
		view.prompt = "Edward Wintering: Winter in Scotland or disband.";
		gen_action(view, 'winter');
		gen_action(view, 'disband');
		gen_action(view, 'area', game.location[EDWARD]);
		gen_action(view, 'area', ENGLAND);
	},
	winter: function () {
		winter_edward();
	},
	disband: function () {
		disband_edward();
	},
	area: function (to) {
		if (to === ENGLAND)
			disband_edward();
		else
			winter_edward();
	},
}

function goto_english_disbanding() {
	game.active = ENGLAND;
	game.turn_log = [];
	let ask = false;
	for (let b in BLOCKS) {
		let where = game.location[b];

		// All (English) blocks in England must disband.
		// Scottish blocks disband later during the castle limit check.
		if (where === ENGLAND && block_owner(b) === ENGLAND) {
			game.turn_log.push([ENGLAND]);
			disband(b);
		}

		if (block_owner(b) === ENGLAND && is_on_map(b)) {
			// Knights, Archers, & Hobelars must disband except when wintering with Edward.
			let type = block_type(b);
			if (type === 'knights' || type === 'archers' || type === 'hobelars') {
				if (where === game.location[EDWARD]) {
					ask = true;
				} else {
					game.turn_log.push([where]);
					disband(b);
				}
			}

			// Infantry may remain in Scotland subject to Castle Limits or wintering with Edward.
			if (type === 'infantry') {
				ask = true;
			}
		}
	}
	if (ask) {
		game.state = 'english_disbanding';
		clear_undo();
	} else {
		print_turn_log("disbands");
		goto_wallace();
	}
}

states.english_disbanding = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for England to disband.";

		gen_action_undo(view);

		// Mandatory disbanding
		let okay_to_end = true;
		for (let b in BLOCKS) {
			if (block_owner(b) === ENGLAND && is_on_map(b)) {
				let where = game.location[b];
				let type = block_type(b);
				if (type === 'infantry') {
					if (!is_within_castle_limit(where) && where !== game.location[EDWARD]) {
						okay_to_end = false;
						gen_action(view, 'block', b);
					}
				}
			}
		}

		if (!okay_to_end)
		{
			view.prompt = "English Disbanding: Disband units in excess of castle limits.";
		}
		else
		{
			// Voluntary disbanding
			view.prompt = "English Disbanding: You may disband units to the pool.";
			gen_action(view, 'end_disbanding');
			for (let b in BLOCKS) {
				if (block_owner(b) === ENGLAND && is_on_map(b)) {
					let type = block_type(b);
					if (type === 'knights' || type === 'archers' || type === 'hobelars')
						gen_action(view, 'block', b);
					if (type === 'infantry')
						gen_action(view, 'block', b);
				}
			}
		}
	},
	block: function (who) {
		push_undo();
		game.turn_log.push([game.location[who]]);
		disband(who);
	},
	end_disbanding: function () {
		print_turn_log("disbands");
		clear_undo();
		goto_wallace();
	},
	undo: pop_undo
}

function heal_wallace() {
	let old = game.steps[WALLACE];
	game.steps[WALLACE] = Math.min(block_max_steps(WALLACE), game.steps[WALLACE] + 2);
	let n = game.steps[WALLACE] - old;
	if (n === 1)
		log("Wallace gains 1 step.");
	else if (n === 2)
		log("Wallace gains 2 steps.");
}

function goto_wallace() {
	game.active = SCOTLAND;
	if (game.location[WALLACE] === "Selkirk") {
		heal_wallace();
		goto_scottish_disbanding();
	} else if (is_on_map(WALLACE) && is_friendly_or_neutral_area("Selkirk")) {
		game.state = 'wallace';
		game.who = WALLACE;
	} else {
		goto_scottish_disbanding();
	}
}

states.wallace = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for Scotland to move Wallace.";
		view.prompt = "Scottish Disbanding: Move Wallace to Selkirk and gain 2 steps or remain where he is.";
		gen_action(view, 'area', game.location[WALLACE]);
		gen_action(view, 'area', "Selkirk");
	},
	area: function (to) {
		if (to === "Selkirk") {
			log("Wallace goes home to " + to + ".");
			heal_wallace();
		}
		game.location[WALLACE] = to;
		game.who = null;
		goto_scottish_disbanding();
	},
}

function goto_scottish_disbanding() {
	game.active = SCOTLAND;
	game.turn_log = [];
	let ask = false;
	for (let b in BLOCKS) {
		if (block_owner(b) === SCOTLAND && is_on_map(b)) {
			let type = block_type(b);
			if (type !== 'nobles')
				ask = true;
		}
	}
	if (ask) {
		game.state = 'scottish_disbanding';
		clear_undo();
	} else {
		print_turn_log("disbands");
		goto_scottish_builds();
	}
}

states.scottish_disbanding = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for Scotland to disband.";

		gen_action_undo(view);

		// Mandatory disbanding
		let okay_to_end = true;
		for (let b in BLOCKS) {
			if (block_owner(b) === SCOTLAND && is_on_map(b)) {
				let where = game.location[b];
				if (b === WALLACE && where === "Selkirk")
					continue;
				let type = block_type(b);
				if (type !== 'nobles') {
					if (!is_within_castle_limit(where)) {
						okay_to_end = false;
						gen_action(view, 'block', b);
					}
				}
			}
		}

		if (!okay_to_end) {
			view.prompt = "Scottish Disbanding: Disband units in excess of castle limits.";
		} else {
			// Voluntary disbanding
			view.prompt = "Scottish Disbanding: You may disband units to the pool.";
			gen_action(view, 'end_disbanding');
			for (let b in BLOCKS) {
				if (block_owner(b) === SCOTLAND && is_on_map(b)) {
					let type = block_type(b);
					if (type !== 'nobles')
						gen_action(view, 'block', b);
				}
			}
		}
	},
	block: function (who) {
		push_undo();
		game.turn_log.push([game.location[who]]);
		disband(who);
	},
	end_disbanding: function () {
		print_turn_log("disbands");
		clear_undo();
		goto_scottish_builds();
	},
	undo: pop_undo
}

function goto_scottish_builds() {
	game.active = SCOTLAND;

	if (!game.french_knights && count_scottish_nobles() >= 8) {
		log("French knights added to pool.");
		game.french_knights = true;
		game.location[FRENCH_KNIGHTS] = S_BAG;
		game.steps[FRENCH_KNIGHTS] = block_max_steps(FRENCH_KNIGHTS);
	}

	game.rp = {};
	for (let where in AREAS) {
		if (is_friendly_area(where)) {
			game.rp[where] = castle_limit(where);
		}
	}
	game.state = 'scottish_builds';
	game.turn_log = [];
	clear_undo();
}

states.scottish_builds = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for Scotland to build.";
		gen_action_undo(view);
		gen_action(view, 'end_builds');
		let can_build = false;
		for (let where in game.rp) {
			let rp = game.rp[where];
			if (rp > 0) {
				for (let b in BLOCKS) {
					if (game.location[b] === where && game.steps[b] < block_max_steps(b)) {
						gen_action(view, 'block', b);
						can_build = true;
					}
				}
				if (is_under_castle_limit(where) && count_blocks_in_area(S_BAG) > 0) {
					gen_action(view, 'area', where);
					can_build = true;
				}
			}
		}
		if (can_build)
			view.prompt = "Scottish Builds: Deploy or reinforce armies.";
		else
			view.prompt = "Scottish Builds: Deploy or reinforce armies \u2014 done.";
	},
	area: function (where) {
		let who;
		if (where === "Lanark" || where === "Badenoch")
			who = draw_from_bag(S_BAG, [ NORSE, FRENCH_KNIGHTS ]);
		else
			who = draw_from_bag(S_BAG);
		if (who) {
			clear_undo(); // no undo after drawing from the bag!
			game.turn_log.push([where]);
			game.location[who] = where;
			game.steps[who] = 1;
			--game.rp[where];
		}
	},
	block: function (who) {
		push_undo();
		let where = game.location[who];
		game.turn_log.push([where]);
		--game.rp[where];
		++game.steps[who];
	},
	end_builds: function () {
		print_turn_log("builds");
		game.rp = null;
		clear_undo();
		goto_english_builds();
	},
	undo: pop_undo
}

function goto_english_builds() {
	game.active = ENGLAND;
	game.rp = {};
	for (let where in AREAS)
		if (is_friendly_area(where))
			game.rp[where] = castle_limit(where);
	game.state = 'english_builds';
	game.turn_log = [];
}

states.english_builds = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for England to build.";
		gen_action_undo(view);
		gen_action(view, 'end_builds');
		let can_build = false;
		for (let where in game.rp) {
			let rp = game.rp[where];
			if (rp > 0) {
				for (let b in BLOCKS) {
					if (game.location[b] === where && game.steps[b] < block_max_steps(b)) {
						let type = block_type(b);
						if (type === 'nobles' || type === 'infantry') {
							gen_action(view, 'block', b);
							can_build = true;
						}
					}
				}
			}
		}
		if (can_build)
			view.prompt = "English Builds: Reinforce armies.";
		else
			view.prompt = "English Builds: Reinforce armies \u2014 done.";
	},
	block: function (who) {
		push_undo();
		let where = game.location[who];
		game.turn_log.push([where]);
		--game.rp[where];
		++game.steps[who];
	},
	end_builds: function () {
		clear_undo();
		print_turn_log("builds");
		game.rp = null;
		goto_english_feudal_levy();
	},
	undo: pop_undo
}

function goto_english_feudal_levy() {
	if (!is_on_map(EDWARD)) {
		let count = Math.ceil(count_blocks_in_area(E_BAG) / 2);
		log("English feudal levy:\n" + count + " England");
		deploy_english(count);
	}
	end_winter_turn();
}

function end_winter_turn() {
	if (++game.year > game.end_year)
		goto_game_over();
	else
		start_year();
}

function goto_game_over() {
	if (!game.victory) {
		let e = count_english_nobles();
		let s = count_scottish_nobles();
		if (e > s) {
			game.victory = "England wins by controlling the most nobles!";
			game.result = ENGLAND;
		} else if (s > e) {
			game.victory = "Scotland wins by controlling the most nobles!";
			game.result = SCOTLAND;
		} else {
			game.log("Tied for majority of nobles.");
			if (is_on_map(WALLACE)) {
				game.victory = "Tied for control of nobles. Scotland wins because Wallace is on the map!";
				game.result = SCOTLAND;
			} else {
				game.victory = "Tied for control of nobles. England wins because Wallace is dead or in the draw pool!";
				game.result = ENGLAND;
			}
		}
	}
	log(game.victory);
	game.active = "None";
	game.state = 'game_over';
}

states.game_over = {
	prompt: function (view) {
		view.prompt = game.victory;
	}
}

function make_battle_view() {
	let battle = {
		EA: [], EB: [], EC: [], ER: [],
		SA: [], SB: [], SC: [], SR: [],
		flash: game.flash
	};

	battle.title = game.attacker[game.where] + " attacks " + game.where;
	battle.title += " \u2014 round " + game.battle_round + " of 3";

	function fill_cell(cell, owner, fn) {
		for (let b in BLOCKS)
			if (game.location[b] === game.where & block_owner(b) === owner && fn(b))
				cell.push([b, game.steps[b], game.moved[b]?1:0])
	}

	fill_cell(battle.ER, ENGLAND, b => is_battle_reserve(b));
	fill_cell(battle.EA, ENGLAND, b => !is_battle_reserve(b) && block_initiative(b) === 'A');
	fill_cell(battle.EB, ENGLAND, b => !is_battle_reserve(b) && block_initiative(b) === 'B');
	fill_cell(battle.EC, ENGLAND, b => !is_battle_reserve(b) && block_initiative(b) === 'C');
	fill_cell(battle.SR, SCOTLAND, b => is_battle_reserve(b));
	fill_cell(battle.SA, SCOTLAND, b => !is_battle_reserve(b) && block_initiative(b) === 'A');
	fill_cell(battle.SB, SCOTLAND, b => !is_battle_reserve(b) && block_initiative(b) === 'B');
	fill_cell(battle.SC, SCOTLAND, b => !is_battle_reserve(b) && block_initiative(b) === 'C');

	return battle;
}

exports.ready = function (scenario, players) {
	return players.length === 2;
}

exports.setup = function (scenario) {
	game = {
		attacker: {},
		border_limit: {},
		last_used: {},
		location: {},
		log: [],
		main_border: {},
		main_origin: {},
		moved: {},
		moves: 0,
		prompt: null,
		reserves: [],
		show_cards: false,
		steps: {},
		who: null,
		where: null,
	}
	if (scenario === "The Bruce")
		setup_the_bruce();
	else if (scenario === "Braveheart")
		setup_braveheart();
	else if (scenario === "Campaign")
		setup_campaign();
	else
		throw new Error("Unknown scenario:", scenario);
	start_year();
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
		game.result = ENEMY[current];
	}
}

exports.view = function(state, current) {
	game = state;

	let view = {
		log: game.log,
		year: game.year,
		turn: 6 - (game.e_hand.length + (game.e_card ? 1 : 0)),
		edward: game.edward,
		e_vp: count_english_nobles(),
		s_vp: count_scottish_nobles(),
		e_card: (game.show_cards || current === ENGLAND) ? game.e_card : 0,
		s_card: (game.show_cards || current === SCOTLAND) ? game.s_card : 0,
		hand: (current === ENGLAND) ? game.e_hand : (current === SCOTLAND) ? game.s_hand : [],
		who: (game.active === current) ? game.who : null,
		where: game.where,
		known: {},
		secret: { Scotland: {}, England: {} },
		battle: null,
		active: game.active,
		prompt: null,
		actions: null,
	};

	states[game.state].prompt(view, current);

	if (states[game.state].show_battle)
		view.battle = make_battle_view();

	for (let b in BLOCKS) {
		let a = game.location[b];
		if (current === block_owner(b) || game.state === 'game_over') {
			if (a)
				view.known[b] = [a, game.steps[b], game.moved[b] ? 1 : 0];
		} else {
			if (a) {
				let list = view.secret[block_owner(b)];
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
