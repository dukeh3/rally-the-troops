"use strict";

// TODO: execute enemy heirs during supply phase
// TODO: reuse supply and goes-home states for pretender and king

// TODO: tweak block layout and positioning

exports.scenarios = [
	"Wars of the Roses",
	"Kingmaker",
	"Richard III",
];

const { CARDS, BLOCKS, AREAS, BORDERS } = require('./data');

const LANCASTER = "Lancaster";
const YORK = "York";
const REBEL = "Rebel";
const ENEMY = { Lancaster: "York", York: "Lancaster" }
const OBSERVER = "Observer";
const BOTH = "Both";
const POOL = "Pool";
const MINOR = "Minor";

// serif cirled numbers
const DIE_HIT = [ 0, '\u2776', '\u2777', '\u2778', '\u2779', '\u277A', '\u277B' ];
const DIE_MISS = [ 0, '\u2460', '\u2461', '\u2462', '\u2463', '\u2464', '\u2465' ];

const ATTACK_MARK = "*";
const RESERVE_MARK = "";

let states = {};

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
	let s = game.active + " " + Array.from(args).join("");
	game.log.push(s);
}

function log_move_start(from) {
	game.turn_buf = [ from ];
}

function log_move_continue(to, mark) {
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

function count_ap(hand) {
	let count = 0;
	for (let c of hand)
		count += CARDS[c].actions;
	return count;
}

function is_pretender_heir(who) {
	return (block_owner(who) === block_owner(game.pretender) && block_type(who) === 'heir');
}

function is_royal_heir(who) {
	return (block_owner(who) === block_owner(game.king) && block_type(who) === 'heir');
}

function is_dead(who) {
	if (who in BLOCKS)
		return !game.location[who];
	return !game.location[who+"/L"] && !game.location[who+"/Y"];
}

function is_shield_area_for(where, who, combat) {
	let haystack = AREAS[where].shields;
	let needle = BLOCKS[who].shield;

	// Nevilles going to exile in Calais
	if (where === "Calais") {
		if (who === "Warwick/L" || who === "Kent/L" || who === "Salisbury/L")
			return false;
		if (count_blocks_exclude_mercenaries("Calais") < 4) {
			if (who === "Kent/Y")
				return is_area_friendly_to("East Yorks", LANCASTER);
			if (who === "Salisbury/Y")
				return is_area_friendly_to("North Yorks", LANCASTER);
		}
	}

	// Exeter and Clarence as enemy nobles
	if (who === "Exeter/Y")
		return where === "Cornwall";
	if (who === "Clarence/L")
		return (where === "South Yorks" || where === "Rutland" || where === "Hereford");

	// Everyone can always use their own shield
	if (haystack && haystack.includes(needle))
		return true;

	// Nevilles can use each other's shields if their owner is dead
	if (is_neville(who)) {
		if (is_dead("Warwick") && haystack.includes("Warwick"))
			return true;
		if (is_dead("Kent") && haystack.includes("Kent"))
			return true;
		if (is_dead("Salisbury") && haystack.includes("Salisbury"))
			return true;
	}

	// York heirs can use any York shield
	if (is_heir(who) && block_owner(who) === YORK) {
		if (haystack.includes("York"))
			return !combat || find_senior_heir_in_area(YORK, where) === who;
	}

	// Lancaster heirs can use each other's specific shields if their owner is dead
	if (is_heir(who) && block_owner(who) === LANCASTER) {
		let available = false;
		if (haystack.includes("Lancaster"))
			available = true;
		if (is_dead("Exeter") && haystack.includes("Exeter"))
			available = true;
		if (is_dead("Somerset") && haystack.includes("Somerset"))
			available = true;
		if (is_dead("Richmond") && haystack.includes("Richmond"))
			available = true;
		if (available)
			return !combat || find_senior_heir_in_area(LANCASTER, where) === who;
	}

	return false;
}

function is_at_home(who) {
	let where = game.location[who];
	if (!where || where === MINOR || where === POOL)
		return true;
	if (is_pretender_heir(who))
		return is_exile_area(where);
	if (is_royal_heir(who))
		return is_shield_area_for(where, who, false) || is_crown_area(where);
	if (block_type(who) === 'nobles')
		return is_shield_area_for(where, who, false);
	if (block_type(who) === 'church')
		return has_cathedral(where) === block_home(who);
	return true;
}

function is_in_exile(who) {
	return is_exile_area(game.location[who]);
}

function is_home_for(where, who) {
	if (is_pretender_heir(who))
		return is_shield_area_for(where, who, false);
	if (is_royal_heir(who))
		return is_crown_area(where) || is_shield_area_for(where, who, false);
	if (block_type(who) === 'nobles')
		return is_shield_area_for(where, who, false);
	if (block_type(who) === 'church')
		return block_home(who) === has_cathedral(where);
	return false;
}

function is_available_home_for(where, who) {
	if (who === "Clarence/L")
		return is_home_for(where, who) && is_vacant_area(where);
	return is_home_for(where, who) && is_friendly_or_vacant_area(where);
}

function count_available_homes(who) {
	let count = 0;
	for (let where in AREAS)
		if (is_available_home_for(where, who))
			++count;
	return count;
}

function available_home(who) {
	for (let where in AREAS)
		if (is_available_home_for(where, who))
			return where;
}

function go_home_if_possible(who) {
	if (!is_in_exile(who)) {
		let n = count_available_homes(who);
		if (n === 0) {
			game.turn_log.push([block_name(who), "Pool"]);
			disband(who);
		} else if (n === 1) {
			let home = available_home(who);
			if (game.location[who] !== home) {
				game.location[who] = home;
				game.turn_log.push([block_name(who), game.location[who]]); // TODO: "Home"?
			}
		} else {
			return true;
		}
	}
	return false;
}

function is_on_map_not_in_exile_or_man(who) {
	let where = game.location[who];
	return where && where !== MINOR &&
		where !== POOL &&
		where !== "Isle of Man" &&
		!is_exile_area(where);
}

function is_land_area(where) {
	return where && where !== MINOR && where !== POOL && !is_sea_area(where);
}

function is_area_friendly_to(where, owner) {
	let save_active = game.active;
	game.active = owner;
	let result = is_friendly_area(where);
	game.active = save_active;
	return result;
}

function is_london_friendly_to(owner) {
	return is_area_friendly_to("Middlesex", owner);
}

function count_lancaster_nobles_and_heirs() {
	let count = 0;
	for (let b in BLOCKS)
		if (block_owner(b) === LANCASTER &&
			(block_type(b) === 'nobles' || block_type(b) === 'church' || block_type(b) === 'heir'))
			if (is_on_map_not_in_exile_or_man(b))
				++count;
	if (is_london_friendly_to(LANCASTER))
		++count;
	return count;
}

function count_york_nobles_and_heirs() {
	let count = 0;
	for (let b in BLOCKS)
		if (block_owner(b) === YORK &&
			(block_type(b) === 'nobles' || block_type(b) === 'church' || block_type(b) === 'heir'))
			if (is_on_map_not_in_exile_or_man(b))
				++count;
	if (is_london_friendly_to(YORK))
		++count;
	return count;
}

function block_name(who) {
	return BLOCKS[who].name;
}

function block_type(who) {
	return BLOCKS[who].type;
}

function block_home(who) {
	return BLOCKS[who].home;
}

function block_owner(who) {
	if (who === REBEL) {
		if (game.pretender)
			return block_owner(game.pretender);
		else if (game.king)
			return ENEMY[block_owner(game.king)];
		else
			return YORK; // whatever... they're both dead
	}
	return BLOCKS[who].owner;
}

function block_initiative(who) {
	if (block_type(who) === 'bombard')
		return game.battle_round <= 1 ? 'A' : 'D';
	return BLOCKS[who].combat[0];
}

function block_printed_fire_power(who) {
	return BLOCKS[who].combat[1] | 0;
}

function block_fire_power(who, where) {
	let combat = block_printed_fire_power(who);
	if (is_defender(who)) {
		if (is_heir(who) && is_shield_area_for(where, who, true))
			++combat;
		if (is_crown_area(where) && is_senior_royal_heir_in(who, where))
			++combat;
		if (is_noble(who) && is_shield_area_for(where, who, true))
			++combat;
		if (is_church(who) && block_home(who) === has_cathedral(where))
			++combat;
		if (is_levy(who) && block_home(who) === has_city(where))
			++combat;
		if (who === "Welsh Mercenary" && is_wales(where))
			++combat;
	}
	return combat;
}

function is_mercenary(who) {
	return BLOCKS[who].type === 'mercenaries';
}

function is_heir(who) {
	return BLOCKS[who].type === 'heir';
}

function is_noble(who) {
	return BLOCKS[who].type === 'nobles';
}

function is_church(who) {
	return BLOCKS[who].type === 'church';
}

function is_levy(who) {
	return BLOCKS[who].type === 'levies';
}

function is_rose_noble(who) {
	return BLOCKS[who].type === 'nobles' && !BLOCKS[who].loyalty;
}

function is_neville(who) {
	let name = block_name(who);
	return name === "Warwick" || name === "Kent" || name === "Salisbury";
}

function block_loyalty(source, target) {
	let source_name = source ? block_name(source) : "Event";
	if (source_name === "Warwick") {
		let target_name = block_name(target);
		if (target_name === "Kent" || target_name === "Salisbury")
			return 1;
		if (target_name === "Northumberland" || target_name === "Westmoreland")
			return 0;
	}
	return BLOCKS[target].loyalty | 0;
}

function can_defect(source, target) {
	// Clarence and Exeter can't defect if they are the king or pretender
	if (target === game.king || target === game.pretender)
		return false;
	return block_loyalty(source, target) > 0 && !game.defected[target];
}

function can_attempt_treason_event() {
	if (game.treason === game.attacker[game.where]) {
		for (let b in BLOCKS)
			if (is_defender(b) && can_defect(null, b))
				return true;
	} else {
		for (let b in BLOCKS)
			if (is_attacker(b) && can_defect(null, b))
				return true;
	}
	return false;
}

function treachery_tag(who) {
	if (who === game.king) return 'King';
	if (who === game.pretender) return 'Pretender';
	if (who === "Warwick/L" || who === "Warwick/Y") return 'Warwick';
	return game.active;
}

function can_attempt_treachery(who) {
	let once = treachery_tag(who);
	if (game.battle_list.includes(who) && !game.treachery[once]) {
		for (let b in BLOCKS) {
			if (game.active === game.attacker[game.where]) {
				if (is_defender(b) && can_defect(who, b))
					return true;
			} else {
				if (is_attacker(b) && can_defect(who, b))
					return true;
			}
		}
	}
	return false;
}

function block_max_steps(who) {
	return BLOCKS[who].steps;
}

function can_activate(who) {
	return block_owner(who) === game.active && !game.moved[who] && !game.dead[who];
}

function is_area_on_map(location) {
	return location && location !== MINOR && location !== POOL;
}

function is_block_on_map(b) {
	return is_area_on_map(game.location[b]);
}

function is_block_alive(b) {
	return is_area_on_map(game.location[b]) && !game.dead[b];
}

function border_id(a, b) {
	return (a < b) ? a + "/" + b : b + "/" + a;
}

function border_was_last_used_by_enemy(from, to) {
	return game.last_used[border_id(from, to)] === ENEMY[game.active];
}

function border_was_last_used_by_active(from, to) {
	return game.last_used[border_id(from, to)] === game.active;
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
		if (game.location[b] === where && block_owner(b) === p && !game.dead[b])
			++count;
	return count;
}

function count_enemy(where) {
	let p = ENEMY[game.active];
	let count = 0;
	for (let b in BLOCKS)
		if (game.location[b] === where && block_owner(b) === p && !game.dead[b])
			++count;
	return count;
}

function count_enemy_excluding_reserves(where) {
	let p = ENEMY[game.active];
	let count = 0;
	for (let b in BLOCKS)
		if (game.location[b] === where && block_owner(b) === p)
			if (!game.reserves.includes(b))
				++count;
	return count;
}

function is_friendly_area(where) { return is_land_area(where) && count_friendly(where) > 0 && count_enemy(where) === 0; }
function is_enemy_area(where) { return is_land_area(where) && count_friendly(where) === 0 && count_enemy(where) > 0; }
function is_vacant_area(where) { return is_land_area(where) && count_friendly(where) === 0 && count_enemy(where) === 0; }
function is_contested_area(where) { return is_land_area(where) && count_friendly(where) > 0 && count_enemy(where) > 0; }
function is_friendly_or_vacant_area(where) { return is_friendly_area(where) || is_vacant_area(where); }

function has_city(where) {
	return AREAS[where].city;
}

function has_cathedral(where) {
	return AREAS[where].cathedral;
}

function is_crown_area(where) {
	return AREAS[where].crown;
}

function is_major_port(where) {
	return AREAS[where].major_port;
}

function is_sea_area(where) {
	return where === 'Irish Sea' || where === 'North Sea' || where === 'English Channel';
}

function is_wales(where) {
	return where === "Caernarvon" || where === "Pembroke" || where === "Powys" || where === "Glamorgan";
}

function is_lancaster_exile_area(where) {
	return where === "France" || where === "Scotland";
}

function is_york_exile_area(where) {
	return where === "Calais" || where === "Ireland";
}

function is_exile_area(where) {
	return is_lancaster_exile_area(where) || is_york_exile_area(where);
}

function is_friendly_exile_area(where) {
	return (game.active === LANCASTER) ? is_lancaster_exile_area(where) : is_york_exile_area(where);
}

function is_enemy_exile_area(where) {
	return (game.active === YORK) ? is_lancaster_exile_area(where) : is_york_exile_area(where);
}

function is_pretender_exile_area(where) {
	return (game.pretender === LANCASTER) ? is_lancaster_exile_area(where) : is_york_exile_area(where);
}

function can_recruit_to(who, to) {
	if (who === "Welsh Mercenary")
		return is_wales(to) && is_friendly_or_vacant_area(to);
	switch (block_type(who)) {
	case 'heir':
		// Not in rulebook, but they can be disbanded to the pool during exile limit check...
		// Use same rules as entering a minor noble.
		if (block_owner(who) === block_owner(game.king))
			return is_crown_area(to) && is_friendly_or_vacant_area(to);
		else
			return is_pretender_exile_area(to);
	case 'nobles':
		return is_shield_area_for(to, who, false) && is_friendly_or_vacant_area(to);
	case 'church':
		return block_home(who) === has_cathedral(to) && is_friendly_or_vacant_area(to);
	case 'levies':
		return block_home(who) === has_city(to) && is_friendly_or_vacant_area(to);
	case 'bombard':
		return has_city(to) && is_friendly_area(to);
	case 'rebel':
		return !is_exile_area(to) && is_vacant_area(to);
	}
	return false;
}

function can_recruit(who) {
	// Move one group events:
	if (game.active === game.force_march) return false;
	if (game.active === game.surprise) return false;
	if (game.active === game.treason) return false;

	// Must use AP for sea moves:
	if (game.active === game.piracy) return false;

	if (can_activate(who) && game.location[who] === POOL)
		for (let to in AREAS)
			if (can_recruit_to(who, to))
				return true;
	return false;
}

function have_contested_areas() {
	for (let where in AREAS)
		if (is_area_on_map(where) && is_contested_area(where))
			return true;
	return false;
}

function count_pinning(where) {
	return count_enemy_excluding_reserves(where);
}

function count_pinned(where) {
	let count = 0;
	for (let b in BLOCKS)
		if (game.location[b] === where && block_owner(b) === game.active)
			if (!game.reserves.includes(b))
				++count;
	return count;
}

function is_pinned(who, from) {
	if (game.active === game.p2) {
		if (count_pinned(from) <= count_pinning(from))
			return true;
	}
	return false;
}

function can_block_sea_move_to(who, from, to) {
	if (is_enemy_exile_area(to))
		return false;
	if (game.active === game.force_march)
		return false;
	if (who === REBEL || who === "Scots Mercenary" || who === "Welsh Mercenary")
		return false;
	if (block_type(who) === 'bombard' || block_type(who) === 'levies')
		return false;
	if (border_type(from, to) === 'sea')
		return true;
	return false;
}

function can_block_sea_move(who) {
	if (can_activate(who)) {
		let from = game.location[who];
		if (from) {
			if (is_pinned(who, from))
				return false;
			for (let to of AREAS[from].exits)
				if (can_block_sea_move_to(who, from, to))
					return true;
		}
	}
	return false;
}

function can_block_use_border(who, from, to) {
	if (game.active === game.surprise) {
		switch (border_type(from, to)) {
		case 'major': return border_limit(from, to) < 5;
		case 'river': return border_limit(from, to) < 4;
		case 'minor': return border_limit(from, to) < 3;
		case 'sea': return false;
		}
	} else {
		switch (border_type(from, to)) {
		case 'major': return border_limit(from, to) < 4;
		case 'river': return border_limit(from, to) < 3;
		case 'minor': return border_limit(from, to) < 2;
		case 'sea': return false;
		}
	}
}

function count_borders_crossed(to) {
	let count = 0;
	for (let from of AREAS[to].exits)
		if (border_was_last_used_by_active(from, to))
			++count;
	return count;
}

function can_block_land_move_to(who, from, to) {
	if (is_enemy_exile_area(to))
		return false;
	if (game.active === game.piracy)
		return false;
	if (can_block_use_border(who, from, to)) {
		// limit number of borders used to attack/reinforce
		let contested = is_contested_area(to);
		if (contested && !border_was_last_used_by_active(from, to)) {
			// p1 or p2 attacking
			if (game.attacker[to] === game.active) {
				if (count_borders_crossed(to) >= 3)
					return false;
			}
			if (game.active === game.p2) {
				// p2 reinforcing battle started by p1
				if (game.attacker[to] === game.p1) {
					if (count_borders_crossed(to) >= 2)
						return false;
				}
			}
		}
		if (count_pinning(from) > 0)
			if (border_was_last_used_by_enemy(from, to))
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
			for (let to of AREAS[from].exits)
				if (can_block_land_move_to(who, from, to))
					return true;
		}
	}
	return false;
}

function can_block_continue(who, from, to) {
	if (is_contested_area(to))
		return false;
	if (border_type(from, to) === 'minor')
		return false;
	if (game.active === game.force_march) {
		if (game.distance >= 3)
			return false;
	} else {
		if (game.distance >= 2)
			return false;
	}
	if (to === game.last_from)
		return false;
	return true;
}

function can_block_retreat_to(who, to) {
	if (is_friendly_area(to) || is_vacant_area(to)) {
		let from = game.location[who];
		if (can_block_use_border(who, from, to)) {
			if (border_was_last_used_by_enemy(from, to))
				return false;
			return true;
		}
	}
	return false;
}

function can_block_regroup_to(who, to) {
	if (is_friendly_area(to) || is_vacant_area(to)) {
		let from = game.location[who];
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

function can_block_muster_via(who, from, next, muster) {
	if (can_block_land_move_to(who, from, next) && is_friendly_or_vacant_area(next)) {
		if (next === muster)
			return true;
		if (border_type(from, next) !== 'minor') {
			if (AREAS[next].exits.includes(muster))
				if (can_block_land_move_to(who, next, muster))
					return true;
		}
	}
	return false;
}

function can_block_muster(who, muster) {
	let from = game.location[who];
	if (from === muster)
		return false;
	if (can_activate(who) && is_block_on_map(who)) {
		if (is_pinned(who, from))
			return false;
		for (let next of AREAS[from].exits)
			if (can_block_muster_via(who, from, next, muster))
				return true;
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
	return game.reserves.includes(who);
}

function is_attacker(who) {
	if (game.location[who] === game.where && block_owner(who) === game.attacker[game.where] && !game.dead[who])
		return !game.reserves.includes(who);
	return false;
}

function is_defender(who) {
	if (game.location[who] === game.where && block_owner(who) !== game.attacker[game.where] && !game.dead[who])
		return !game.reserves.includes(who);
	return false;
}

function swap_blocks(a) {
	let b = BLOCKS[a].enemy;
	game.location[b] = game.location[a];
	game.steps[b] = game.steps[a];
	game.location[a] = null;
	game.steps[a] = block_max_steps(a);
	return b;
}

function disband(who) {
	game.location[who] = POOL;
	game.steps[who] = block_max_steps(who);
}

function check_instant_victory() {
	if (is_dead("York") && is_dead("March") && is_dead("Rutland") && is_dead("Clarence") && is_dead("Gloucester")) {
		log("All York heirs are dead!");
		game.victory = "Lancaster wins by eliminating all enemy heirs!";
		game.result = LANCASTER;
	}
	if (is_dead("Henry VI") && is_dead("Prince Edward") && is_dead("Exeter") && is_dead("Somerset") && is_dead("Richmond")) {
		log("All Lancaster heirs are dead!");
		game.victory = "York wins by eliminating all enemy heirs!";
		game.result = YORK;
	}
}

function eliminate_block(who) {
	log(block_name(who) + " is eliminated.");
	game.flash += " " + block_name(who) + " is eliminated.";
	if (who === "Exeter/Y") {
		game.location[who] = null;
		++game.killed_heirs[LANCASTER];
		return check_instant_victory();
	}
	if (who === "Clarence/L") {
		game.location[who] = null;
		++game.killed_heirs[YORK];
		return check_instant_victory();
	}
	if (is_heir(who)) {
		game.location[who] = null;
		++game.killed_heirs[block_owner(who)];
		if (who === game.pretender)
			game.pretender = find_senior_heir(block_owner(game.pretender));
		// A new King is only crowned in the supply phase.
		return check_instant_victory();
	}
	if (is_rose_noble(who) || is_neville(who)) {
		game.location[who] = null;
		return;
	}
	if (is_mercenary(who)) {
		switch (who) {
		case "Welsh Mercenary": game.location[who] = POOL; break;
		case "Irish Mercenary": game.location[who] = "Ireland"; break;
		case "Burgundian Mercenary": game.location[who] = "Calais"; break;
		case "Calais Mercenary": game.location[who] = "Calais"; break;
		case "Scots Mercenary": game.location[who] = "Scotland"; break;
		case "French Mercenary": game.location[who] = "France"; break;
		}
		game.steps[who] = block_max_steps(who);
		game.dead[who] = true;
		return;
	}
	game.location[who] = POOL;
	game.steps[who] = block_max_steps(who);
	game.dead[who] = true;
}

function reduce_block(who) {
	if (game.steps[who] === 1) {
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

function count_blocks_exclude_mercenaries(where) {
	let count = 0;
	for (let b in BLOCKS)
		if (!(game.reduced && game.reduced[b]) && game.location[b] === where && !is_mercenary(b))
			++count;
	return count;
}

function count_blocks(where) {
	let count = 0;
	for (let b in BLOCKS)
		if (!(game.reduced && game.reduced[b]) && game.location[b] === where)
			++count;
	return count;
}

function add_blocks_exclude_mercenaries(list, where) {
	for (let b in BLOCKS)
		if (!(game.reduced && game.reduced[b]) && game.location[b] === where && !is_mercenary(b))
			list.push(b);
}

function add_blocks(list, where) {
	for (let b in BLOCKS)
		if (!(game.reduced && game.reduced[b]) && game.location[b] === where)
			list.push(b);
}

function check_supply_penalty() {
	game.supply = [];
	for (let where in AREAS) {
		if (is_friendly_area(where)) {
			if (where === "Calais" || where === "France") {
				if (count_blocks_exclude_mercenaries(where) > 4)
					add_blocks_exclude_mercenaries(game.supply, where);
			} else if (where === "Ireland" || where === "Scotland") {
				if (count_blocks_exclude_mercenaries(where) > 2)
					add_blocks_exclude_mercenaries(game.supply, where);
			} else if (has_city(where)) {
				if (count_blocks(where) > 5)
					add_blocks(game.supply, where);
			} else {
				if (count_blocks(where) > 4)
					add_blocks(game.supply, where);
			}
		}
	}
	return game.supply.length > 0;
}

function check_exile_limits() {
	game.exiles = [];
	for (let where in AREAS) {
		if (is_friendly_area(where)) {
			if (where === "Calais" || where === "France") {
				if (count_blocks_exclude_mercenaries(where) > 4)
					add_blocks_exclude_mercenaries(game.exiles, where);
			} else if (where === "Ireland" || where === "Scotland") {
				if (count_blocks_exclude_mercenaries(where) > 2)
					add_blocks_exclude_mercenaries(game.exiles, where);
			}
		}
	}
	if (game.exiles.length > 0)
		return true;
	delete game.exiles;
	return false;
}

// SETUP

function find_block(owner, name) {
	if (name in BLOCKS)
		return name;
	name = name + "/" + owner[0];
	if (name in BLOCKS)
		return name;
	throw new Error("Block not found: " + name);
}

function deploy(who, where) {
	if (where === "Enemy")
		return;
	if (!(where in AREAS))
		throw new Error("Area not found: " + where);
	game.location[who] = where;
	game.steps[who] = BLOCKS[who].steps;
}

function deploy_lancaster(name, where) {
	deploy(find_block(LANCASTER, name), where);
}

function deploy_york(name, where) {
	deploy(find_block(YORK, name), where);
}

function reset_blocks() {
	for (let b in BLOCKS) {
		game.location[b] = null;
		game.steps[b] = block_max_steps(b);
	}
}

function setup_game() {
	reset_blocks();

	game.campaign = 1;
	game.end_campaign = 3;
	game.pretender = "York";
	game.king = "Henry VI";

	deploy_lancaster("Henry VI", "Middlesex");
	deploy_lancaster("Somerset", "Dorset");
	deploy_lancaster("Exeter", "Cornwall");
	deploy_lancaster("Devon", "Cornwall");
	deploy_lancaster("Pembroke", "Pembroke");
	deploy_lancaster("Wiltshire", "Wilts");
	deploy_lancaster("Oxford", "Essex");
	deploy_lancaster("Beaumont", "Lincoln");
	deploy_lancaster("Clifford", "North Yorks");
	deploy_lancaster("French Mercenary", "France");
	deploy_lancaster("Scots Mercenary", "Scotland");
	deploy_lancaster("Buckingham", "Pool");
	deploy_lancaster("Northumberland", "Pool");
	deploy_lancaster("Shrewsbury", "Pool");
	deploy_lancaster("Westmoreland", "Pool");
	deploy_lancaster("Rivers", "Pool");
	deploy_lancaster("Stanley", "Pool");
	deploy_lancaster("Bristol (levy)", "Pool");
	deploy_lancaster("Coventry (levy)", "Pool");
	deploy_lancaster("Newcastle (levy)", "Pool");
	deploy_lancaster("York (levy)", "Pool");
	deploy_lancaster("York (church)", "Pool");
	deploy_lancaster("Bombard", "Pool");
	deploy_lancaster("Welsh Mercenary", "Pool");
	deploy_lancaster("Prince Edward", "Minor");
	deploy_lancaster("Richmond", "Minor");
	deploy_lancaster("Canterbury (church)", "Enemy");
	deploy_lancaster("Clarence", "Enemy");
	deploy_lancaster("Warwick", "Enemy");
	deploy_lancaster("Salisbury", "Enemy");
	deploy_lancaster("Kent", "Enemy");

	deploy_york("York", "Ireland");
	deploy_york("Rutland", "Ireland");
	deploy_york("Irish Mercenary", "Ireland");
	deploy_york("March", "Calais");
	deploy_york("Warwick", "Calais");
	deploy_york("Salisbury", "Calais");
	deploy_york("Kent", "Calais");
	deploy_york("Calais Mercenary", "Calais");
	deploy_york("Burgundian Mercenary", "Calais");
	deploy_york("Norfolk", "Pool");
	deploy_york("Suffolk", "Pool");
	deploy_york("Arundel", "Pool");
	deploy_york("Essex", "Pool");
	deploy_york("Worcester", "Pool");
	deploy_york("Hastings", "Pool");
	deploy_york("Herbert", "Pool");
	deploy_york("Canterbury (church)", "Pool");
	deploy_york("London (levy)", "Pool");
	deploy_york("Norwich (levy)", "Pool");
	deploy_york("Salisbury (levy)", "Pool");
	deploy_york("Bombard", "Pool");
	deploy_york("Rebel", "Pool");
	deploy_york("Clarence", "Minor");
	deploy_york("Gloucester", "Minor");
	deploy_york("Exeter", "Enemy");
	deploy_york("Buckingham", "Enemy");
	deploy_york("Northumberland", "Enemy");
	deploy_york("Westmoreland", "Enemy");
	deploy_york("Shrewsbury", "Enemy");
	deploy_york("Rivers", "Enemy");
	deploy_york("Stanley", "Enemy");
	deploy_york("York (church)", "Enemy");
}

function setup_kingmaker() {
	reset_blocks();

	game.campaign = 2;
	game.end_campaign = 2;
	game.pretender = "Henry VI";
	game.king = "March";

	deploy_york("March", "Middlesex");
	deploy_york("Gloucester", "South Yorks");
	deploy_york("Buckingham", "Warwick");
	deploy_york("Norfolk", "East Anglia");
	deploy_york("Suffolk", "East Anglia");
	deploy_york("Arundel", "Sussex");
	deploy_york("Essex", "Essex");
	deploy_york("Hastings", "Leicester");
	deploy_york("Rivers", "Leicester");
	deploy_york("Stanley", "Lancaster");
	deploy_york("Irish Mercenary", "Ireland");
	deploy_york("Calais Mercenary", "Calais");
	deploy_york("Burgundian Mercenary", "Calais");
	deploy_york("Northumberland", "Pool");
	deploy_york("Westmoreland", "Pool");
	deploy_york("Canterbury (church)", "Pool");
	deploy_york("Bombard", "Pool");
	deploy_york("London (levy)", "Pool");
	deploy_york("Norwich (levy)", "Pool");
	deploy_york("Salisbury (levy)", "Pool");
	deploy_york("Warwick", "Enemy");
	deploy_york("Clarence", "Enemy");
	deploy_york("Shrewsbury", "Enemy");
	deploy_york("York (church)", "Enemy");
	deploy_york("Exeter", "Enemy");

	deploy_lancaster("Henry VI", "Middlesex");
	deploy_lancaster("Prince Edward", "France");
	deploy_lancaster("Exeter", "France");
	deploy_lancaster("Warwick", "France");
	deploy_lancaster("Clarence", "France");
	deploy_lancaster("Oxford", "France");
	deploy_lancaster("French Mercenary", "France");
	deploy_lancaster("Scots Mercenary", "Scotland");
	deploy_lancaster("Pembroke", "Pool");
	deploy_lancaster("Shrewsbury", "Pool");
	deploy_lancaster("York (church)", "Pool");
	deploy_lancaster("Welsh Mercenary", "Pool");
	deploy_lancaster("Bombard", "Pool");
	deploy_lancaster("Bristol (levy)", "Pool");
	deploy_lancaster("Coventry (levy)", "Pool");
	deploy_lancaster("Newcastle (levy)", "Pool");
	deploy_lancaster("York (levy)", "Pool");
	deploy_lancaster("Rebel", "Pool");
	deploy_lancaster("Richmond", "Minor");
	deploy_lancaster("Buckingham", "Enemy");
	deploy_lancaster("Northumberland", "Enemy");
	deploy_lancaster("Rivers", "Enemy");
	deploy_lancaster("Westmoreland", "Enemy");
	deploy_lancaster("Stanley", "Enemy");
	deploy_lancaster("Canterbury (church)", "Enemy");

	// Prisoner!
	game.dead["Henry VI"] = true;
}

function setup_richard_iii() {
	reset_blocks();

	game.campaign = 3;
	game.end_campaign = 3;
	game.pretender = "Richmond";
	game.king = "Gloucester";

	deploy_york("Gloucester", "Middlesex");
	deploy_york("Norfolk", "East Anglia");
	deploy_york("Suffolk", "East Anglia");
	deploy_york("Arundel", "Sussex");
	deploy_york("Essex", "Essex");
	deploy_york("Northumberland", "Northumbria");
	deploy_york("Stanley", "Lancaster");
	deploy_york("Irish Mercenary", "Ireland");
	deploy_york("Calais Mercenary", "Calais");
	deploy_york("Burgundian Mercenary", "Calais");
	deploy_york("Westmoreland", "Pool");
	deploy_york("Canterbury (church)", "Pool");
	deploy_york("York (church)", "Pool");
	deploy_york("Bombard", "Pool");
	deploy_york("London (levy)", "Pool");
	deploy_york("Norwich (levy)", "Pool");
	deploy_york("Salisbury (levy)", "Pool");
	deploy_york("Buckingham", "Enemy");
	deploy_york("Shrewsbury", "Enemy");
	deploy_york("Rivers", "Enemy");

	deploy_lancaster("Richmond", "France");
	deploy_lancaster("Oxford", "France");
	deploy_lancaster("Pembroke", "France");
	deploy_lancaster("French Mercenary", "France");
	deploy_lancaster("Scots Mercenary", "Scotland");
	deploy_lancaster("Buckingham", "Glamorgan");
	deploy_lancaster("Rivers", "Leicester");
	deploy_lancaster("Shrewsbury", "Pool");
	deploy_lancaster("Welsh Mercenary", "Pool");
	deploy_lancaster("Bombard", "Pool");
	deploy_lancaster("Bristol (levy)", "Pool");
	deploy_lancaster("Coventry (levy)", "Pool");
	deploy_lancaster("Newcastle (levy)", "Pool");
	deploy_lancaster("York (levy)", "Pool");
	deploy_lancaster("Rebel", "Pool");
	deploy_lancaster("Northumberland", "Enemy");
	deploy_lancaster("Westmoreland", "Enemy");
	deploy_lancaster("Stanley", "Enemy");
	deploy_lancaster("Canterbury (church)", "Enemy");
	deploy_lancaster("York (church)", "Enemy");
}

// Kingmaker scenario special rule
function free_henry_vi() {
	if (game.dead["Henry VI"]) {
		if ((game.active === LANCASTER && is_friendly_area("Middlesex")) ||
			(game.active === YORK && is_enemy_area("Middlesex"))) {
			log("Henry VI is rescued!");
			delete game.dead["Henry VI"];
		}
	}
}

// GAME TURN

function start_campaign() {
	log("");
	log("Start Campaign " + game.campaign + ".");

	// TODO: Use board game mulligan rules instead of automatically redealing?
	do {
		let deck = shuffle_deck();
		game.l_hand = deal_cards(deck, 7);
		game.y_hand = deal_cards(deck, 7);
	} while (count_ap(game.l_hand) <= 13 || count_ap(game.y_hand) <= 13);

	start_game_turn();
}

function start_game_turn() {
	log("");
	log("Start Turn " + (8-game.l_hand.length) + " of campaign " + game.campaign + ".");

	// Reset movement and attack tracking state
	reset_border_limits();
	game.last_used = {};
	game.attacker = {};
	game.reserves = [];
	game.moved = {};

	goto_card_phase();
}

function end_game_turn() {
	delete game.force_march;
	delete game.piracy;
	delete game.is_pirate;
	delete game.surprise;
	delete game.treason;

	if (game.l_hand.length > 0)
		start_game_turn()
	else
		goto_political_turn();
}

// CARD PHASE

function goto_card_phase() {
	game.l_card = 0;
	game.y_card = 0;
	game.show_cards = false;
	game.state = 'play_card';
	game.active = BOTH;
}

function resume_play_card() {
	if (game.l_card > 0 && game.y_card > 0)
		reveal_cards();
	else if (game.l_card > 0)
		game.active = YORK;
	else if (game.y_card > 0)
		game.active = LANCASTER;
	else
		game.active = BOTH;
}

states.play_card = {
	prompt: function (view, current) {
		if (current === OBSERVER)
			return view.prompt = "Waiting for players to play a card.";
		if (current === LANCASTER) {
			if (game.l_card) {
				view.prompt = "Waiting for York to play a card.";
				gen_action(view, 'undo');
			} else {
				view.prompt = "Play a card.";
				for (let c of game.l_hand)
					gen_action(view, 'play', c);
			}
		}
		if (current === YORK) {
			if (game.y_card) {
				view.prompt = "Waiting for Lancaster to play a card.";
				gen_action(view, 'undo');
			} else {
				view.prompt = "Play a card.";
				for (let c of game.y_hand)
					gen_action(view, 'play', c);
			}
		}
	},
	play: function (card, current) {
		if (current === LANCASTER) {
			remove_from_array(game.l_hand, card);
			game.l_card = card;
		}
		if (current === YORK) {
			remove_from_array(game.y_hand, card);
			game.y_card = card;
		}
		resume_play_card();
	},
	undo: function (_, current) {
		if (current === LANCASTER) {
			game.l_hand.push(game.l_card);
			game.l_card = 0;
		}
		if (current === YORK) {
			game.y_hand.push(game.y_card);
			game.y_card = 0;
		}
		resume_play_card();
	}
}

function reveal_cards() {
	log("Lancaster plays " + CARDS[game.l_card].name + ".");
	log("York plays " + CARDS[game.y_card].name + ".");
	game.show_cards = true;

	let pretender = block_owner(game.pretender);

	let lc = CARDS[game.l_card];
	let yc = CARDS[game.y_card];

	let lp = (lc.event ? 10 : 0) + lc.actions * 2 + (pretender === LANCASTER ? 1 : 0);
	let yp = (yc.event ? 10 : 0) + yc.actions * 2 + (pretender === YORK ? 1 : 0);

	if (lp > yp) {
		game.p1 = LANCASTER;
		game.p2 = YORK;
	} else {
		game.p1 = YORK;
		game.p2 = LANCASTER;
	}

	game.active = game.p1;
	start_player_turn();
}

function start_player_turn() {
	log("");
	log("Start " + game.active + " turn.");
	reset_border_limits();
	let lc = CARDS[game.l_card];
	let yc = CARDS[game.y_card];
	if (game.active === LANCASTER && lc.event)
		goto_event_card(lc.event);
	else if (game.active === YORK && yc.event)
		goto_event_card(yc.event);
	else if (game.active === LANCASTER)
		goto_action_phase(lc.actions);
	else if (game.active === YORK)
		goto_action_phase(yc.actions);
}

function end_player_turn() {
	game.moves = 0;
	game.activated = null;
	game.move_port = null;
	game.main_border = null;

	// Remove "Surprise" road limit bonus for retreats and regroups.
	delete game.surprise;

	if (game.active === game.p2) {
		goto_battle_phase();
	} else {
		game.active = game.p2;
		start_player_turn();
	}
}

// EVENTS

function goto_event_card(event) {
	switch (event) {
	case 'force_march':
		game.force_march = game.active;
		goto_action_phase(1);
		break;
	case 'muster':
		goto_muster_event();
		break;
	case 'piracy':
		game.piracy = game.active;
		game.is_pirate = {};
		goto_action_phase(2);
		break;
	case 'plague':
		game.state = 'plague_event';
		break;
	case 'surprise':
		game.surprise = game.active;
		goto_action_phase(1);
		break;
	case 'treason':
		game.treason = game.active;
		goto_action_phase(1);
		break;
	}
}

states.plague_event = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Plague: Waiting for " + game.active + " to choose a city.";
		view.prompt = "Plague: Choose an enemy city area.";
		gen_action(view, 'pass');
		for (let where in AREAS)
			if (is_enemy_area(where) && has_city(where))
				gen_action(view, 'area', where);
	},
	area: function (where) {
		log("Plague ravages " + has_city(where) + "!");
		for (let b in BLOCKS) {
			if (game.location[b] === where)
				reduce_block(b);
		}
		end_player_turn();
	},
	pass: function () {
		end_player_turn();
	}
}

function goto_muster_event() {
	game.state = 'muster_event';
	game.turn_log = [];
	clear_undo();
}

states.muster_event = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Muster: Waiting for " + game.active + " to muster.";
		view.prompt = "Muster: Choose one friendly or vacant muster area.";
		gen_action_undo(view);
		gen_action(view, 'end_action_phase');
		for (let where in AREAS) {
			if (is_friendly_or_vacant_area(where))
				if (can_muster_to(where))
					gen_action(view, 'area', where);
		}
	},
	area: function (where) {
		push_undo();
		game.where = where;
		game.state = 'muster_who';
	},
	end_action_phase: function () {
		clear_undo();
		print_turn_log(game.active + " musters:");
		end_player_turn();
	},
	undo: pop_undo,
}

states.muster_who = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Muster: Waiting for " + game.active + " to muster.";
		view.prompt = "Muster: Move blocks to the designated muster area.";
		gen_action_undo(view);
		gen_action(view, 'end_action_phase');
		for (let b in BLOCKS)
			if (can_block_muster(b, game.where))
				gen_action(view, 'block', b);
	},
	block: function (who) {
		push_undo();
		game.who = who;
		game.state = 'muster_move_1';
	},
	end_action_phase: function () {
		game.where = null;
		clear_undo();
		print_turn_log(game.active + " musters:");
		end_player_turn();
	},
	undo: pop_undo,
}

states.muster_move_1 = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Muster: Waiting for " + game.active + " to muster.";
		view.prompt = "Muster: Move " + block_name(game.who) + " to the designated muster area.";
		gen_action_undo(view);
		gen_action(view, 'block', game.who);
		let from = game.location[game.who];
		for (let to of AREAS[from].exits) {
			if (can_block_muster_via(game.who, from, to, game.where))
				gen_action(view, 'area', to);
		}
	},
	area: function (to) {
		let from = game.location[game.who];
		log_move_start(from);
		log_move_continue(to);
		move_block(game.who, from, to);
		if (to === game.where) {
			log_move_end();
			game.moved[game.who] = true;
			game.who = null;
			game.state = 'muster_who';
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
			return view.prompt = "Muster: Waiting for " + game.active + " to muster.";
		view.prompt = "Muster: Move " + block_name(game.who) + " to the designated muster area.";
		gen_action_undo(view);
		gen_action(view, 'area', game.where);
	},
	area: function (to) {
		log_move_continue(to);
		log_move_end();
		move_block(game.who, game.location[game.who], to);
		game.moved[game.who] = true;
		game.who = null;
		game.state = 'muster_who';
	},
	undo: pop_undo,
}

// ACTION PHASE

function use_border(from, to) {
	game.border_limit[border_id(from, to)] = border_limit(from, to) + 1;
}

function move_block(who, from, to) {
	game.location[who] = to;
	use_border(from, to);
	game.distance ++;
	if (is_contested_area(to)) {
		game.last_used[border_id(from, to)] = game.active;
		if (!game.attacker[to]) {
			game.attacker[to] = game.active;
			game.main_border[to] = from;
		} else {
			if (game.attacker[to] !== game.active || game.main_border[to] !== from) {
				game.reserves.push(who);
				return RESERVE_MARK;
			}
		}
		return ATTACK_MARK;
	}
	return "";
}

function goto_action_phase(moves) {
	game.state = 'action_phase';
	game.moves = moves;
	game.activated = [];
	game.move_port = {};
	game.main_border = {};
	game.turn_log = [];
	game.recruit_log = [];
	clear_undo();
}

states.action_phase = {
	prompt: function (view, current) {
		if (is_inactive_player(current)) {
			if (game.active === game.piracy)
				return view.prompt = "Piracy: Waiting for " + game.active + ".";
			if (game.active === game.force_march)
				return view.prompt = "Force March: Waiting for " + game.active + ".";
			if (game.active === game.surprise)
				return view.prompt = "Surprise: Waiting for " + game.active + ".";
			if (game.active === game.treason)
				return view.prompt = "Treason: Waiting for " + game.active + ".";
			else
				return view.prompt = "Action Phase: Waiting for " + game.active + ".";
		}

		if (game.active === game.piracy) {
			view.prompt = "Piracy: Choose an army to sea move. Attacking is allowed. " + game.moves + "AP left.";
		} else if (game.active === game.force_march) {
			view.prompt = "Force March: Move one group. Blocks can move up to 3 areas and may attack.";
		} else if (game.active === game.surprise) {
			view.prompt = "Surprise: Move one group. Border limit is +1 to cross all borders.";
		} else if (game.active === game.treason) {
			view.prompt = "Treason: Move one group.";
		} else {
			view.prompt = "Action Phase: Choose an army to move or recruit. " + game.moves + "AP left.";
		}

		gen_action_undo(view);
		gen_action(view, 'end_action_phase');
		for (let b in BLOCKS) {
			let from = game.location[b];
			if (can_recruit(b)) {
				if (game.moves > 0)
					gen_action(view, 'block', b);
			}
			if (can_block_land_move(b)) {
				if (game.moves === 0) {
					if (game.activated.includes(from))
						gen_action(view, 'block', b);
				} else {
					gen_action(view, 'block', b);
				}
			}
			if (can_block_sea_move(b)) {
				if (game.moves === 0) {
					if (game.move_port[game.location[b]])
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
		game.origin = game.location[who];
		if (game.origin === POOL) {
			game.state = 'recruit_where';
		} else {
			game.distance = 0;
			game.last_from = null;
			game.state = 'move_to';
		}
	},
	end_action_phase: function () {
		if (game.turn_log.length > 0)
			print_turn_log(game.active + " moves:");
		game.turn_log = game.recruit_log;
		if (game.turn_log.length > 0)
			print_turn_log(game.active + " recruits:");
		game.turn_log = null;
		game.recruit_log = null;

		clear_undo();
		game.moves = 0;
		end_player_turn();
	},
	undo: pop_undo,
}

states.recruit_where = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to recruit.";
		view.prompt = "Recruit " + block_name(game.who) + " where?";
		gen_action_undo(view);
		gen_action(view, 'block', game.who);
		for (let to in AREAS)
			if (can_recruit_to(game.who, to))
				gen_action(view, 'area', to);
	},
	area: function (to) {
		game.recruit_log.push([to]);
		--game.moves;
		game.location[game.who] = to;
		game.moved[game.who] = true;
		end_action();
	},
	block: pop_undo,
	undo: pop_undo,
}

states.move_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move.";
		view.prompt = "Move " + block_name(game.who) + ".";
		gen_action_undo(view);
		gen_action(view, 'block', game.who);
		let from = game.location[game.who];
		if (game.distance > 0)
			gen_action(view, 'area', from);
		for (let to of AREAS[from].exits) {
			if (to !== game.last_from && can_block_land_move_to(game.who, from, to))
				gen_action(view, 'area', to);
			else if (game.distance === 0 && can_block_sea_move_to(game.who, from, to)) {
				let has_destination_port = false;
				if (game.moves === 0) {
					for (let port of AREAS[to].exits)
						if (game.move_port[game.origin] === port)
							has_destination_port = true;
				} else {
					if (game.active === game.piracy)
						has_destination_port = true;
					else
						for (let port of AREAS[to].exits)
							if (port !== game.origin && is_friendly_or_vacant_area(port))
								has_destination_port = true;
				}
				if (has_destination_port)
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
		if (game.distance === 0)
			log_move_start(from);
		game.last_from = from;
		if (is_sea_area(to)) {
			log_move_continue(to);
			game.location[game.who] = to;
			game.state = 'sea_move_to';
		} else {
			let mark = move_block(game.who, from, to);
			log_move_continue(to, mark);
			if (!can_block_continue(game.who, from, to))
				end_move();
		}
	},
	undo: pop_undo,
}

states.sea_move_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to move.";
		if (game.active === game.piracy) {
			view.prompt = "Piracy: Sea Move " + block_name(game.who) + " to a coastal area.";
		} else {
			view.prompt = "Sea Move " + block_name(game.who) + " to a friendly or vacant coastal area.";
		}
		gen_action_undo(view);
		for (let to of AREAS[game.location[game.who]].exits) {
			if (to === game.last_from)
				continue;
			if (is_enemy_exile_area(to))
				continue;
			if (is_friendly_or_vacant_area(to)) {
				if (game.moves === 0) {
					if (game.move_port[game.origin] === to)
						gen_action(view, 'area', to);
				} else {
					gen_action(view, 'area', to);
				}
			} else if (game.active === game.piracy && game.moves > 0) {
				// Can attack with piracy, but no port-to-port bonus.
				gen_action(view, 'area', to);
			}
		}
	},
	area: function (to) {
		game.location[game.who] = to;
		game.moved[game.who] = true;

		if (game.active === game.piracy && is_contested_area(to)) {
			// Can attack with piracy, but no port-to-port bonus.
			log_move_continue(to, ATTACK_MARK);
			game.is_pirate[game.who] = true;
			if (!game.attacker[to])
				game.attacker[to] = game.active;
			logp("sea moves.");
			--game.moves;
		} else {
			// Can sea move two blocks between same major ports for 1 AP.
			log_move_continue(to);
			if (game.move_port[game.origin] === to) {
				delete game.move_port[game.origin];
			} else {
				logp("sea moves.");
				--game.moves;
				if (is_major_port(game.origin) && is_major_port(to))
					game.move_port[game.origin] = to;
			}
		}

		log_move_end();
		end_action();
	},
	undo: pop_undo,
}

function end_move() {
	if (game.distance > 0) {
		log_move_end();
		if (!game.activated.includes(game.origin)) {
			logp("activates " + game.origin + ".");
			game.activated.push(game.origin);
			game.moves --;
		}
		game.moved[game.who] = true;
	}
	game.last_from = null;
	end_action();
}

function end_action() {
	free_henry_vi();
	game.who = null;
	game.distance = 0;
	game.origin = null;
	game.state = 'action_phase';
}

// BATTLE PHASE

function goto_battle_phase() {
	if (have_contested_areas()) {
		game.active = game.p1;
		game.state = 'battle_phase';
	} else {
		goto_supply_phase();
	}
}

states.battle_phase = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to choose a battle.";
		view.prompt = "Choose the next battle to fight!";
		for (let where in AREAS)
			if (is_area_on_map(where) && is_contested_area(where))
				gen_action(view, 'area', where);
	},
	area: function (where) {
		start_battle(where);
	},
}

function start_battle(where) {
	game.flash = "";
	log("");
	log("Battle in " + where + ".");
	game.where = where;
	game.battle_round = 0;
	game.defected = {};
	game.treachery = {};

	if (game.treason && can_attempt_treason_event()) {
		game.active = game.treason;
		game.state = 'treason_event';
	} else {
		game.state = 'battle_round';
		start_battle_round();
	}
}

function resume_battle() {
	if (game.result)
		return goto_game_over();
	game.who = null;
	game.state = 'battle_round';
	pump_battle_round();
}

function end_battle() {
	if (game.turn_log && game.turn_log.length > 0)
		print_turn_log("Retreats from " + game.where + ":");
	free_henry_vi();
	game.flash = "";
	game.battle_round = 0;
	reset_border_limits();
	game.moved = {};
	game.defected = {};
	game.treachery = {};
	goto_regroup();
}

states.treason_event = {
	show_battle: true,
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Treason: Waiting for " + game.active + " to choose a target.";
		view.prompt = "Treason: Choose a target or pass.";
		gen_action(view, 'pass');
		for (let b in BLOCKS) {
			if (game.active === game.attacker[game.where]) {
				if (is_defender(b) && can_defect(null, b)) {
					gen_action(view, 'battle_treachery', b);
					gen_action(view, 'block', b);
				}
			} else {
				if (is_attacker(b) && can_defect(null, b)) {
					gen_action(view, 'battle_treachery', b);
					gen_action(view, 'block', b);
				}
			}
		}
	},
	battle_treachery: function (target) {
		delete game.treason;
		attempt_treachery(null, target);
		game.state = 'battle_round';
		start_battle_round();
	},
	block: function (target) {
		delete game.treason;
		attempt_treachery(null, target);
		game.state = 'battle_round';
		start_battle_round();
	},
	pass: function () {
		game.state = 'battle_round';
		start_battle_round();
	}
}

function bring_on_reserves(owner, moved) {
	for (let b in BLOCKS) {
		if (block_owner(b) === owner && game.location[b] === game.where) {
			remove_from_array(game.reserves, b);
			game.moved[b] = moved;
		}
	}
}

function start_battle_round() {
	if (++game.battle_round <= 4) {
		if (game.turn_log && game.turn_log.length > 0)
			print_turn_log("Retreats from " + game.where + ":");
		game.turn_log = [];

		log("~ Battle Round " + game.battle_round + " ~");

		reset_border_limits();
		game.moved = {};

		if (game.battle_round > 1) {
			bring_on_reserves(LANCASTER, false);
			bring_on_reserves(YORK, false);
		}

		pump_battle_round();
	} else {
		end_battle();
	}
}

function pump_battle_round() {
	if (is_friendly_area(game.where) || is_enemy_area(game.where)) {
		end_battle();
		return;
	}

	if (count_attackers() === 0 || count_defenders() === 0) {
		// Deploy reserves immediately if all blocks on one side are eliminated.
		if (count_attackers() === 0) {
			log("Attacking main force eliminated.");
			bring_on_reserves(game.attacker[game.where], true);
		} else if (count_defenders() === 0) {
			log("Defending main force was eliminated.");
			bring_on_reserves(ENEMY[game.attacker[game.where]], true);
			if (game.battle_round === 1) {
				log("The attacker is now the defender.");
				game.attacker[game.where] = ENEMY[game.attacker[game.where]];
			}
		}
	}

	function filter_battle_blocks(ci, is_candidate) {
		let output = null;
		for (let b in BLOCKS) {
			if (is_candidate(b) && !game.moved[b] && !game.dead[b]) {
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

	let attacker = game.attacker[game.where];
	let defender = ENEMY[attacker];

	if (battle_step(defender, 'A', is_defender)) return;
	if (battle_step(attacker, 'A', is_attacker)) return;
	if (battle_step(defender, 'B', is_defender)) return;
	if (battle_step(attacker, 'B', is_attacker)) return;
	if (battle_step(defender, 'C', is_defender)) return;
	if (battle_step(attacker, 'C', is_attacker)) return;
	if (battle_step(defender, 'D', is_defender)) return;
	if (battle_step(attacker, 'D', is_attacker)) return;

	start_battle_round();
}

function pass_with_block(b) {
	game.flash = block_name(b) + " passes.";
	log_battle(game.flash);
	game.moved[b] = true;
	resume_battle();
}

function can_retreat_with_block(who) {
	if (game.location[who] === game.where) {
		if (game.battle_round > 1) {
			if (game.active === game.piracy && game.is_pirate[who]) {
				return true;
			} else {
				for (let to of AREAS[game.where].exits)
					if (can_block_retreat_to(who, to))
						return true;
			}
		}
	}
	return false;
}

function must_retreat_with_block(who) {
	if (game.location[who] === game.where)
		if (game.battle_round === 4)
			return (block_owner(who) === game.attacker[game.where]);
	return false;
}

function retreat_with_block(who) {
	if (can_retreat_with_block(who)) {
		game.who = who;
		game.state = 'retreat_in_battle';
	} else {
		eliminate_block(who);
		resume_battle();
	}
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

	game.flash = name + " " + verb + " " + rolls.join(" ") + " ";
	if (game.hits === 0)
		game.flash += "and misses.";
	else if (game.hits === 1)
		game.flash += "and scores 1 hit.";
	else
		game.flash += "and scores " + game.hits + " hits.";

	log(active[0] + ": " + name + " " + verb + " " + rolls.join("") + ".");
}

function fire_with_block(b) {
	game.moved[b] = true;
	roll_attack(game.active, b, "fires");
	if (game.hits > 0) {
		game.active = ENEMY[game.active];
		goto_battle_hits();
	} else {
		resume_battle();
	}
}

function attempt_treachery(source, target) {
	if (source) {
		let once = treachery_tag(source);
		game.treachery[once] = true;
		game.moved[source] = true;
	}
	let n = block_loyalty(source, target);
	let rolls = [];
	let result = true;
	for (let i = 0; i < n; ++i) {
		let die = roll_d6();
		if ((die & 1) === 1) {
			rolls.push(DIE_MISS[die]);
			result = false;
		} else {
			rolls.push(DIE_HIT[die]);
		}
	}
	if (source)
		game.flash = block_name(source) + " treachery " + rolls.join(" ");
	else
		game.flash = "Treason event " + rolls.join(" ");
	if (result) {
		game.flash += " converts " + block_name(target) + "!";
		target = swap_blocks(target);
		game.defected[target] = true;
		game.reserves.push(target);
	} else {
		game.flash += " fails to convert " + block_name(target) + ".";
	}
	log_battle(game.flash);
}

function charge_with_block(heir, target) {
	let n;
	game.moved[heir] = true;
	roll_attack(game.active, heir, "charges " + block_name(target));
	n = Math.min(game.hits, game.steps[target]);
	if (n === game.steps[target]) {
		eliminate_block(target);
	} else {
		while (n-- > 0)
			reduce_block(target);
		let charge_flash = game.flash;
		roll_attack(ENEMY[game.active], target, "counter-attacks");
		n = Math.min(game.hits, game.steps[heir]);
		while (n-- > 0)
			reduce_block(heir);
		game.flash = charge_flash + " " + game.flash;
	}
	resume_battle();
}

function can_block_fire(who) {
	if (is_attacker(who))
		return game.battle_round < 4;
	if (is_defender(who))
		return true;
	return false;
}

function find_minor_heir(owner) {
	let candidate = null;
	for (let b in BLOCKS) {
		if (block_owner(b) === owner && block_type(b) === 'heir' && game.location[b] === MINOR)
			if (!candidate || BLOCKS[b].heir < BLOCKS[candidate].heir)
				candidate = b;
	}
	return candidate;
}

function find_senior_heir(owner) {
	let candidate = null;
	for (let b in BLOCKS)
		if (block_owner(b) === owner && block_type(b) === 'heir' && is_block_on_map(b))
			if (!candidate || BLOCKS[b].heir < BLOCKS[candidate].heir)
				candidate = b;
	return candidate;
}

function find_next_king(owner) {
	let candidate = null;
	for (let b in BLOCKS)
		if (block_owner(b) === owner && block_type(b) === 'heir' && game.location[b])
			if (!candidate || BLOCKS[b].heir < BLOCKS[candidate].heir)
				candidate = b;
	return candidate;
}

function find_senior_heir_in_area(owner, where) {
	let candidate = null;
	for (let b in BLOCKS) {
		if (block_owner(b) === owner && block_type(b) === 'heir' && game.location[b] === where) {
			if (is_battle_reserve(b))
				continue;
			if (!candidate || BLOCKS[b].heir < BLOCKS[candidate].heir)
				candidate = b;
		}
	}
	return candidate;
}

function is_senior_royal_heir_in(who, where) {
	return find_senior_heir_in_area(block_owner(game.king), where) === who;
}

function can_heir_charge() {
	let heir = find_senior_heir_in_area(game.active, game.where);
	if (heir && !game.moved[heir]) {
		if (is_attacker(heir))
			return game.battle_round < 4 ? heir : null;
		if (is_defender(heir))
			return heir;
	}
	return null;
}

states.battle_round = {
	show_battle: true,
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to choose a combat action.";
		view.prompt = "Battle: Choose a combat action with an army.";

		let can_fire = false;
		let can_retreat = false;
		let must_retreat = false;
		let can_pass = false;
		if (game.active === game.attacker[game.where]) {
			if (game.battle_round < 4) can_fire = true;
			if (game.battle_round > 1) can_retreat = true;
			if (game.battle_round < 4) can_pass = true;
			if (game.battle_round === 4) must_retreat = true;
		} else {
			can_fire = true;
			if (game.battle_round > 1) can_retreat = true;
			can_pass = true;
		}
		for (let b of game.battle_list) {
			if (can_fire) gen_action(view, 'battle_fire', b);
			if (must_retreat || (can_retreat && can_retreat_with_block(b)))
				gen_action(view, 'battle_retreat', b);
			if (can_pass) gen_action(view, 'battle_pass', b);
			gen_action(view, 'block', b);
		}

		let heir = can_heir_charge();
		if (heir && game.battle_list.includes(heir)) {
			gen_action(view, 'battle_charge', heir);
		}
		if (can_attempt_treachery(game.king))
			gen_action(view, 'battle_treachery', game.king);
		if (can_attempt_treachery(game.pretender))
			gen_action(view, 'battle_treachery', game.pretender);
		if (can_attempt_treachery("Warwick/L"))
			gen_action(view, 'battle_treachery', "Warwick/L");
		if (can_attempt_treachery("Warwick/Y"))
			gen_action(view, 'battle_treachery', "Warwick/Y");
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
	battle_charge: function (who) {
		game.who = who;
		game.state = 'battle_charge';
	},
	battle_treachery: function (who) {
		game.who = who;
		game.state = 'battle_treachery';
	},
	block: function (who) {
		if (can_block_fire(who))
			fire_with_block(who);
		else if (can_retreat_with_block(who))
			retreat_with_block(who);
		else if (must_retreat_with_block(who))
			eliminate_block(who);
		else
			pass_with_block(who);
	},
}

states.battle_charge = {
	show_battle: true,
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Heir Charge: Waiting for " + game.active + " to choose a target.";
		view.prompt = "Heir Charge: Choose a target.";
		gen_action(view, 'undo');
		for (let b in BLOCKS) {
			if (game.active === game.attacker[game.where]) {
				if (is_defender(b)) {
					gen_action(view, 'battle_charge', b);
					gen_action(view, 'block', b);
				}
			} else {
				if (is_attacker(b)) {
					gen_action(view, 'battle_charge', b);
					gen_action(view, 'block', b);
				}
			}
		}
	},
	battle_charge: function (target) {
		charge_with_block(game.who, target);
	},
	block: function (target) {
		charge_with_block(game.who, target);
	},
	undo: function () {
		resume_battle();
	}
}

states.battle_treachery = {
	show_battle: true,
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Treachery: Waiting for " + game.active + " to choose a target.";
		view.prompt = "Treachery: Choose a target.";
		gen_action(view, 'undo');
		for (let b in BLOCKS) {
			if (game.active === game.attacker[game.where]) {
				if (is_defender(b) && can_defect(game.who, b)) {
					gen_action(view, 'battle_treachery', b);
					gen_action(view, 'block', b);
				}
			} else {
				if (is_attacker(b) && can_defect(game.who, b)) {
					gen_action(view, 'battle_treachery', b);
					gen_action(view, 'block', b);
				}
			}
		}
	},
	battle_treachery: function (target) {
		attempt_treachery(game.who, target);
		resume_battle();
	},
	block: function (target) {
		attempt_treachery(game.who, target);
		resume_battle();
	},
	undo: function () {
		resume_battle();
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
	let n = Math.min(game.hits, game.steps[who]);
	if (n === 1)
		game.flash = block_name(who) + " takes " + n + " hit.";
	else
		game.flash = block_name(who) + " takes " + n + " hits.";
	while (n-- > 0) {
		reduce_block(who);
		game.hits--;
	}
	game.battle_list = list_victims(game.active);
	if (game.battle_list.length > 0) {
		if (game.hits === 1)
			game.flash += " 1 hit left.";
		else if (game.hits > 1)
			game.flash += " " + game.hits + " hits left.";
	}
	if (game.hits === 0)
		resume_battle();
	else
		goto_battle_hits();
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

states.retreat_in_battle = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to retreat.";
		gen_action(view, 'undo');
		gen_action(view, 'block', game.who);
		if (game.active === game.piracy && game.is_pirate[game.who]) {
			view.prompt = "Retreat: Move the army to a friendly or vacant areas in the same sea zone.";
			for (let to of AREAS[game.where].exits)
				if (is_sea_area(to))
					gen_action(view, 'area', to);
		} else {
			view.prompt = "Retreat: Move the army to a friendly or vacant area.";
			for (let to of AREAS[game.where].exits)
				if (can_block_retreat_to(game.who, to))
					gen_action(view, 'area', to);
		}
	},
	area: function (to) {
		if (is_sea_area(to)) {
			game.location[game.who] = to;
			game.state = 'sea_retreat_to';
		} else {
			game.flash = block_name(game.who) + " retreats.";
			log_battle(game.flash);
			game.turn_log.push([game.active, to]);
			use_border(game.where, to);
			game.location[game.who] = to;
			resume_battle();
		}
	},
	eliminate: function () {
		game.flash = "";
		eliminate_block(game.who);
		resume_battle();
	},
	block: function () {
		resume_battle();
	},
	undo: function () {
		resume_battle();
	}
}

states.sea_retreat_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to retreat.";
		view.prompt = "Retreat: Move the army to a friendly or vacant area in the same sea zone.";
		// TODO: only eliminate if no retreat is possible
		gen_action(view, 'eliminate');
		let from = game.location[game.who];
		for (let to of AREAS[from].exits)
			if (is_friendly_or_vacant_area(to))
				gen_action(view, 'area', to);
	},
	area: function (to) {
		let sea = game.location[game.who];
		game.turn_log.push([game.active, sea, to]);
		game.flash = block_name(game.who) + " retreats.";
		log_battle(game.flash);
		game.location[game.who] = to;
		resume_battle();
	},
	eliminate: function () {
		game.flash = "";
		eliminate_block(game.who);
		resume_battle();
	},
	undo: function () {
		game.location[game.who] = game.where;
		resume_battle();
	}
}

function goto_regroup() {
	game.active = game.attacker[game.where];
	if (is_enemy_area(game.where))
		game.active = ENEMY[game.active];
	log(game.active + " wins the battle in " + game.where + "!");
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
		for (let b in BLOCKS) {
			if (game.location[b] === game.where) {
				if (game.active === game.piracy) {
					if (game.is_pirate[b])
						gen_action(view, 'block', b);
				} else {
					if (can_block_regroup(b))
						gen_action(view, 'block', b);
				}
			}
		}
	},
	block: function (who) {
		push_undo();
		game.who = who;
		game.state = 'regroup_to';
	},
	end_regroup: function () {
		game.where = null;
		clear_undo();
		print_turn_log(game.active + " regroups:");
		goto_battle_phase();
	},
	undo: pop_undo,
}

states.regroup_to = {
	prompt: function (view, current) {
		if (game.active === game.piracy && game.is_pirate[game.who]) {
			if (is_inactive_player(current))
				return view.prompt = "Waiting for " + game.active + " to regroup.";
			view.prompt = "Regroup: Move the army to a friendly or vacant area in the same sea zone.";
			gen_action_undo(view);
			gen_action(view, 'block', game.who);
			for (let to of AREAS[game.where].exits)
				if (is_sea_area(to))
					gen_action(view, 'area', to);
		} else {
			if (is_inactive_player(current))
				return view.prompt = "Waiting for " + game.active + " to regroup.";
			view.prompt = "Regroup: Move the army to a friendly or vacant area.";
			gen_action_undo(view);
			gen_action(view, 'block', game.who);
			for (let to of AREAS[game.where].exits)
				if (can_block_regroup_to(game.who, to))
					gen_action(view, 'area', to);
		}
	},
	area: function (to) {
		if (is_sea_area(to)) {
			game.location[game.who] = to;
			game.state = 'sea_regroup_to';
		} else {
			game.turn_log.push([game.where, to]);
			move_block(game.who, game.where, to);
			game.who = null;
			game.state = 'regroup';
		}
	},
	block: pop_undo,
	undo: pop_undo,
}

states.sea_regroup_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to regroup.";
		view.prompt = "Regroup: Move the army to a friendly or vacant area in the same sea zone.";
		gen_action_undo(view);
		let from = game.location[game.who];
		for (let to of AREAS[from].exits)
			if (is_friendly_or_vacant_area(to))
				gen_action(view, 'area', to);
	},
	area: function (to) {
		logp("sea regroups to " + to + ".");
		game.location[game.who] = to;
		game.who = null;
		game.state = 'regroup'
	},
	undo: pop_undo,
}

// SUPPLY PHASE

function goto_supply_phase() {
	game.moved = {};

	if (!game.location[game.king]) {
		game.king = find_next_king(block_owner(game.king));
		log("The King is dead; long live the king!");
		if (game.location[game.king] === MINOR)
			log("The new King is a minor.");
		else
			log("The new King is in " + game.location[game.king] + ".");
	}

	goto_execute_clarence();
}

function goto_execute_clarence() {
	if (is_block_alive("Clarence/L")) {
		game.active = LANCASTER;
		game.state = 'execute_clarence';
		game.who = "Clarence/L";
	} else {
		goto_execute_exeter();
	}
}

states.execute_clarence = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to execute Clarence.";
		view.prompt = "Supply Phase: Execute enemy heir Clarence?";
		gen_action(view, 'execute_clarence');
		gen_action(view, 'pass');
	},
	execute_clarence: function () {
		logp("executes Clarence.");
		eliminate_block("Clarence/L");
		game.who = null;
		if (game.result)
			return goto_game_over();
		goto_execute_exeter();
	},
	pass: function () {
		game.who = null;
		goto_execute_exeter();
	}
}

function goto_execute_exeter() {
	if (is_block_alive("Exeter/Y")) {
		game.active = YORK;
		game.state = 'execute_exeter';
		game.who = "Exeter/Y";
	} else {
		goto_enter_pretender_heir();
	}
}

states.execute_exeter = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to execute Exeter.";
		view.prompt = "Supply Phase: Execute enemy heir Exeter?";
		gen_action(view, 'execute_exeter');
		gen_action(view, 'pass');
	},
	execute_exeter: function () {
		logp("executes Exeter.");
		eliminate_block("Exeter/Y");
		game.who = null;
		if (game.result)
			return goto_game_over();
		goto_enter_pretender_heir();
	},
	pass: function () {
		game.who = null;
		goto_enter_pretender_heir();
	}
}

// PRETENDER SUPPLY PHASE

function goto_enter_pretender_heir() {
	game.active = block_owner(game.pretender);
	let n = game.killed_heirs[game.active];
	if (n > 0 && (game.who = find_minor_heir(game.active)))
		game.state = 'enter_pretender_heir';
	else
		goto_supply_limits_pretender();
}

states.enter_pretender_heir = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to enter pretender heirs.";
		view.prompt = "Death of an Heir: Enter " + block_name(game.who) + " in an exile area.";
		for (let where in AREAS)
			if (is_pretender_exile_area(where))
				gen_action(view, 'area', where);
	},
	block: function () {
		game.who = null;
	},
	area: function (to) {
		log(block_name(game.who) + " comes of age in " + to + ".");
		--game.killed_heirs[game.active];
		game.location[game.who] = to;
		game.who = null;
		goto_enter_pretender_heir();
	},
}

function goto_supply_limits_pretender() {
	game.reduced = {};
	game.active = block_owner(game.pretender);
	if (check_supply_penalty()) {
		game.state = 'supply_limits_pretender';
		game.turn_log = [];
		clear_undo();
	} else {
		delete game.supply;
		delete game.reduced;
		goto_enter_royal_heir();
	}
}

states.supply_limits_pretender = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to check supply limits.";
		view.prompt = "Supply Phase: Reduce blocks in over-stacked areas.";
		gen_action_undo(view);
		if (game.supply.length === 0)
			gen_action(view, 'end_supply_phase');
		for (let b of game.supply)
			gen_action(view, 'block', b);
	},
	block: function (who) {
		push_undo();
		game.turn_log.push([game.location[who]]);
		game.reduced[who] = true;
		reduce_block(who);
		check_supply_penalty();
	},
	end_supply_phase: function () {
		delete game.supply;
		delete game.reduced;
		clear_undo();
		print_turn_log(game.active + " reduces:");
		if (game.result)
			return goto_game_over();
		goto_enter_royal_heir();
	},
	undo: pop_undo,
}

// KING SUPPLY PHASE

function goto_enter_royal_heir() {
	game.active = block_owner(game.king);
	let n = game.killed_heirs[game.active];
	if (n > 0 && (game.who = find_minor_heir(game.active)))
		game.state = 'enter_royal_heir';
	else
		goto_supply_limits_king();
}

states.enter_royal_heir = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to enter royal heirs.";
		view.prompt = "Death of an Heir: Enter " + block_name(game.who) + " in a Crown area.";
		let can_enter = false;
		for (let where in AREAS) {
			if (is_crown_area(where) && is_friendly_or_vacant_area(where)) {
				gen_action(view, 'area', where);
				can_enter = true;
			}
		}
		if (!can_enter)
			gen_action(view, 'pass');
	},
	block: function () {
		game.who = null;
	},
	area: function (to) {
		log(block_name(game.who) + " comes of age in " + to + ".");
		--game.killed_heirs[game.active];
		game.location[game.who] = to;
		game.who = null;
		goto_enter_royal_heir();
	},
	pass: function () {
		game.who = null;
		goto_supply_limits_king();
	}
}

function goto_supply_limits_king() {
	game.reduced = {};
	game.active = block_owner(game.king);
	if (check_supply_penalty()) {
		game.state = 'supply_limits_king';
		game.turn_log = [];
		clear_undo();
	} else {
		delete game.supply;
		delete game.reduced;
		end_game_turn();
	}
}

states.supply_limits_king = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to check supply limits.";
		view.prompt = "Supply Phase: Reduce blocks in over-stacked areas.";
		gen_action_undo(view);
		if (game.supply.length === 0)
			gen_action(view, 'end_supply_phase');
		for (let b of game.supply)
			gen_action(view, 'block', b);
	},
	block: function (who) {
		push_undo();
		game.turn_log.push([game.location[who]]);
		game.reduced[who] = true;
		reduce_block(who);
		check_supply_penalty();
	},
	end_supply_phase: function () {
		delete game.supply;
		delete game.reduced;
		clear_undo();
		print_turn_log(game.active + " reduces:");
		if (game.result)
			return goto_game_over();
		end_game_turn();
	},
	undo: pop_undo,
}

// POLITICAL TURN

function goto_political_turn() {
	log("");
	log("Start Political Turn.");

	game.turn_log = [];

	// Levies disband
	for (let b in BLOCKS) {
		if (!is_land_area(game.location[b]))
			continue;
		switch (block_type(b)) {
		case 'bombard':
		case 'levies':
		case 'rebel':
			game.turn_log.push([game.location[b]]);
			disband(b);
			break;
		case 'mercenaries':
			switch (b) {
			case "Welsh Mercenary":
				game.turn_log.push([game.location[b]]);
				disband(b);
				break;
			case "Irish Mercenary":
				if (game.location[b] !== "Ireland") {
					game.turn_log.push([game.location[b], "Ireland"]);
					game.location[b] = "Ireland";
				}
				break;
			case "Burgundian Mercenary":
			case "Calais Mercenary":
				if (game.location[b] !== "Calais") {
					game.turn_log.push([game.location[b], "Calais"]);
					game.location[b] = "Calais";
				}
				break;
			case "Scots Mercenary":
				if (game.location[b] !== "Scotland") {
					game.turn_log.push([game.location[b], "Scotland"]);
					game.location[b] = "Scotland";
				}
				break;
			case "French Mercenary":
				if (game.location[b] !== "France") {
					game.turn_log.push([game.location[b], "France"]);
					game.location[b] = "France";
				}
				break;
			}
			break;
		}
	}

	print_turn_log("Levies disband:");

	// Usurpation
	let l_count = count_lancaster_nobles_and_heirs();
	let y_count = count_york_nobles_and_heirs();
	log("");
	log("Lancaster controls " + l_count + " nobles.");
	log("York controls " + y_count + " nobles.");
	if (l_count > y_count && block_owner(game.king) === YORK) {
		game.king = find_senior_heir(LANCASTER);
		game.pretender = find_senior_heir(YORK);
		log(game.king + " usurps the throne!");
	} else if (y_count > l_count && block_owner(game.king) === LANCASTER) {
		game.king = find_senior_heir(YORK);
		game.pretender = find_senior_heir(LANCASTER);
		log(game.king + " usurps the throne!");
	} else {
		log(game.king + " remains king.");
	}

	// Game ends after last Usurpation check
	if (game.campaign === game.end_campaign)
		return goto_game_over();

	log("");
	goto_pretender_goes_home();
}

// PRETENDER GOES HOME

function goto_pretender_goes_home() {
	game.active = block_owner(game.pretender);
	game.state = 'pretender_goes_home';
	game.turn_log = [];
	let choices = false;
	for (let b in BLOCKS)
		if (block_owner(b) === game.active && is_block_on_map(b))
			if (go_home_if_possible(b))
				choices = true;
	if (!choices) {
		print_turn_log_no_count("Pretender goes home:");
		goto_exile_limits_pretender();
	} else {
		clear_undo();
	}
}

states.pretender_goes_home = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for the Pretender to go to exile.";
		gen_action_undo(view);
		let done = true;
		for (let b in BLOCKS) {
			if (block_owner(b) === game.active && is_block_on_map(b) && !game.moved[b]) {
				if (!is_in_exile(b)) {
					if (is_heir(b)) {
						done = false;
						gen_action(view, 'block', b);
					} else if (!is_at_home(b)) {
						done = false;
						let n = count_available_homes(b);
						if (n > 1)
							gen_action(view, 'block', b);
					}
				}
			}
		}
		if (done) {
			view.prompt = "Pretender Goes Home: You may move nobles to another home.";
			for (let b in BLOCKS) {
				if (block_owner(b) === game.active && is_block_on_map(b) && !game.moved[b]) {
					if (!is_in_exile(b)) {
						if (is_at_home(b)) {
							let n = count_available_homes(b);
							if (n > 1)
								gen_action(view, 'block', b);
						}
					}
				}
			}
			gen_action(view, 'end_political_turn');
		} else {
			view.prompt = "Pretender Goes Home: Move the pretender and his heirs to exile, and nobles to home.";
		}
	},
	block: function (who) {
		push_undo();
		game.who = who;
		game.state = 'pretender_goes_home_to';
	},
	end_political_turn: function () {
		clear_undo();
		print_turn_log_no_count("Pretender goes home:");
		goto_exile_limits_pretender();
	},
	undo: pop_undo,
}

states.pretender_goes_home_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for the Pretender to go to exile.";
		if (is_heir(game.who))
			view.prompt = "Pretender Goes Home: Move " + block_name(game.who) + " to exile.";
		else
			view.prompt = "Pretender Goes Home: Move " + block_name(game.who) + " to home.";
		gen_action(view, 'block', game.who);
		for (let where in AREAS) {
			if (where !== game.location[game.who]) {
				if (is_heir(game.who)) {
					if (is_friendly_exile_area(where))
						gen_action(view, 'area', where);
				} else if (is_available_home_for(where, game.who)) {
					gen_action(view, 'area', where);
				}
			}
		}
	},
	area: function (to) {
		if (is_exile_area(to))
			game.turn_log.push([block_name(game.who), to]); // TODO: "Exile"?
		else
			game.turn_log.push([block_name(game.who), to]); // TODO: "Home"?
		game.moved[game.who] = true;
		game.location[game.who] = to;
		game.who = null;
		game.state = 'pretender_goes_home';
	},
	block: pop_undo,
	undo: pop_undo,
}

function goto_exile_limits_pretender() {
	game.moved = {};
	game.active = block_owner(game.pretender);
	if (check_exile_limits()) {
		game.state = 'exile_limits_pretender';
		clear_undo();
	} else {
		goto_king_goes_home();
	}
}

states.exile_limits_pretender = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to check exile limits.";
		view.prompt = "Campaign Reset: Disband one block in each over-stacked exile area.";
		gen_action_undo(view);
		if (game.exiles.length === 0)
			gen_action(view, 'end_exile_limits');
		for (let b of game.exiles)
			gen_action(view, 'block', b);
	},
	block: function (who) {
		push_undo();
		let where = game.location[who];
		logp("disbands in " + where + ".");
		game.exiles = game.exiles.filter(b => game.location[b] !== where);
		disband(who);
	},
	end_exile_limits: function () {
		goto_king_goes_home();
	},
	undo: pop_undo,
}

// KING GOES HOME

function goto_king_goes_home() {
	game.active = block_owner(game.king);
	game.state = 'king_goes_home';
	game.turn_log = [];
	let choices = false;
	for (let b in BLOCKS)
		if (block_owner(b) === game.active && is_block_on_map(b))
			if (go_home_if_possible(b))
				choices = true;
	if (!choices) {
		print_turn_log_no_count("King goes home:");
		goto_exile_limits_king();
	} else {
		clear_undo();
	}
}

states.king_goes_home = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for the King to go home.";
		gen_action_undo(view);
		let done = true;
		for (let b in BLOCKS) {
			if (block_owner(b) === game.active && is_block_on_map(b) && !game.moved[b]) {
				if (!is_in_exile(b)) {
					if (!is_at_home(b)) {
						done = false;
						let n = count_available_homes(b);
						if (n > 1)
							gen_action(view, 'block', b);
					}
				}
			}
		}
		if (done) {
			view.prompt = "King Goes Home: You may move nobles and heirs to another home.";
			for (let b in BLOCKS) {
				if (block_owner(b) === game.active && is_block_on_map(b) && !game.moved[b]) {
					if (!is_in_exile(b)) {
						if (is_at_home(b)) {
							let n = count_available_homes(b);
							if (n > 1)
								gen_action(view, 'block', b);
						}
					}
				}
			}
			gen_action(view, 'end_political_turn');
		} else {
			view.prompt = "King Goes Home: Move the King, the royal heirs, and nobles to home.";
		}
	},
	block: function (who) {
		push_undo();
		game.who = who;
		game.state = 'king_goes_home_to';
	},
	end_political_turn: function () {
		clear_undo();
		print_turn_log_no_count("King goes home:");
		goto_exile_limits_king();
	},
	undo: pop_undo,
}

states.king_goes_home_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for the King to go home.";
		view.prompt = "King Goes Home: Move " + block_name(game.who) + " to home.";
		gen_action(view, 'block', game.who);
		for (let where in AREAS)
			if (where !== game.location[game.who])
				if (is_available_home_for(where, game.who))
					gen_action(view, 'area', where);
	},
	area: function (to) {
		game.turn_log.push([block_name(game.who), to]); // TODO: "Home"?
		game.moved[game.who] = true;
		game.location[game.who] = to;
		game.who = null;
		game.state = 'king_goes_home';
	},
	block: pop_undo,
	undo: pop_undo,
}

function goto_exile_limits_king() {
	game.moved = {};
	game.active = block_owner(game.king);
	if (check_exile_limits()) {
		game.state = 'exile_limits_king';
		clear_undo();
	} else {
		end_political_turn();
	}
}

states.exile_limits_king = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Waiting for " + game.active + " to check exile limits.";
		view.prompt = "Campaign Reset: Disband one block in each over-stacked exile area.";
		gen_action_undo(view);
		if (game.exiles.length === 0)
			gen_action(view, 'end_exile_limits');
		for (let b of game.exiles)
			gen_action(view, 'block', b);
	},
	block: function (who) {
		push_undo();
		let where = game.location[who];
		logp("disbands in " + where + ".");
		game.exiles = game.exiles.filter(b => game.location[b] !== where);
		disband(who);
	},
	end_exile_limits: function () {
		end_political_turn();
	},
	undo: pop_undo,
}

function end_political_turn() {
	// Campaign reset
	game.dead = {};
	for (let b in BLOCKS)
		game.steps[b] = block_max_steps(b);

	++game.campaign;
	start_campaign();
}

// GAME OVER

function goto_game_over() {
	game.active = "None";
	game.state = 'game_over';
	if (!game.result) {
		game.result = block_owner(game.king);
		game.victory = game.result + " wins!";
	}
	log("");
	log(game.victory);
}

states.game_over = {
	prompt: function (view) {
		view.prompt = game.victory;
	}
}

function make_battle_view() {
	let battle = {
		LA: [], LB: [], LC: [], LD: [], LR: [],
		YA: [], YB: [], YC: [], YD: [], YR: [],
		flash: game.flash
	};

	battle.title = game.attacker[game.where] + " attacks " + game.where;
	battle.title += " \u2014 round " + game.battle_round + " of 4";

	function fill_cell(cell, owner, fn) {
		for (let b in BLOCKS)
			if (game.location[b] === game.where & block_owner(b) === owner && !game.dead[b] && fn(b))
				cell.push([b, game.steps[b], game.moved[b]?1:0])
	}

	fill_cell(battle.LR, LANCASTER, b => is_battle_reserve(b));
	fill_cell(battle.LA, LANCASTER, b => !is_battle_reserve(b) && block_initiative(b) === 'A');
	fill_cell(battle.LB, LANCASTER, b => !is_battle_reserve(b) && block_initiative(b) === 'B');
	fill_cell(battle.LC, LANCASTER, b => !is_battle_reserve(b) && block_initiative(b) === 'C');
	fill_cell(battle.LD, LANCASTER, b => !is_battle_reserve(b) && block_initiative(b) === 'D');

	fill_cell(battle.YR, YORK, b => is_battle_reserve(b));
	fill_cell(battle.YA, YORK, b => !is_battle_reserve(b) && block_initiative(b) === 'A');
	fill_cell(battle.YB, YORK, b => !is_battle_reserve(b) && block_initiative(b) === 'B');
	fill_cell(battle.YC, YORK, b => !is_battle_reserve(b) && block_initiative(b) === 'C');
	fill_cell(battle.YD, YORK, b => !is_battle_reserve(b) && block_initiative(b) === 'D');

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
		moved: {},
		dead: {},
		moves: 0,
		prompt: null,
		reserves: [],
		show_cards: false,
		steps: {},
		who: null,
		where: null,
		killed_heirs: { Lancaster: 0, York: 0 },
	}
	if (scenario === "Wars of the Roses")
		setup_game();
	else if (scenario === "Kingmaker")
		setup_kingmaker();
	else if (scenario === "Richard III")
		setup_richard_iii();
	else
		throw new Error("Unknown scenario:", scenario);
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
		game.result = ENEMY[current];
	}
}

exports.view = function(state, current) {
	game = state;

	let view = {
		log: game.log,
		campaign: game.campaign + " of " + game.end_campaign,
		active: game.active,
		king: game.king,
		pretender: game.pretender,
		l_card: (game.show_cards || current === LANCASTER) ? game.l_card : 0,
		y_card: (game.show_cards || current === YORK) ? game.y_card : 0,
		hand: (current === LANCASTER) ? game.l_hand : (current === YORK) ? game.y_hand : [],
		who: (game.active === current) ? game.who : null,
		where: game.where,
		known: {},
		secret: { York: {}, Lancaster: {}, Rebel: {} },
		battle: null,
		prompt: null,
		actions: null,
	};

	states[game.state].prompt(view, current);

	if (states[game.state].show_battle)
		view.battle = make_battle_view();

	for (let b in BLOCKS) {
		let a = game.location[b];
		if (!a)
			continue;

		let is_known = false;
		if (current === block_owner(b) || (game.dead[b] && is_block_on_map(b)) || game.state === 'game_over')
			is_known = true;

		if (is_known) {
			view.known[b] = [a, game.steps[b], (game.moved[b] || game.dead[b]) ? 1 : 0];
		} else if (a !== POOL && a !== MINOR) {
			let list = view.secret[BLOCKS[b].owner];
			if (!(a in list))
				list[a] = [0, 0];
			list[a][0]++;
			if (game.moved[b] || game.dead[b])
				list[a][1]++;
		}
	}

	return view;
}
