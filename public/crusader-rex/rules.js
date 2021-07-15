"use strict";

// TODO: optional rule - iron bridge
// TODO: optional rule - force marches

// TODO: 6.2 - In Sieges, the attacker /may/ retreat or stay on siege.
// TODO: new combat deployment in round 2/3 if defenders are wiped out and reserves are coming?
//		see https://boardgamegeek.com/thread/423599/article/3731006
// TODO: sea move into attacked fortified port as defender responder? -- not besieged yet

exports.scenarios = [
	"Standard"
];

const { CARDS, BLOCKS, TOWNS, PORTS, ROADS, SHIELDS } = require('./data');

const FRANKS = "Franks";
const SARACENS = "Saracens";
const ASSASSINS = "Assassins";
const OBSERVER = "Observer";
const BOTH = "Both";
const DEAD = "Dead";
const F_POOL = "FP";
const S_POOL = "SP";
const SEA = "Sea";
const ENGLAND = "England";
const FRANCE = "France";
const GERMANIA = "Germania";
const TYRE = "Tyre";
const TRIPOLI = "Tripoli";
const ALEPPO = "Aleppo";
const ANTIOCH = "Antioch";
const ST_SIMEON = "St. Simeon";
const DAMASCUS = "Damascus";
const MASYAF = "Masyaf";
const SALADIN = "Saladin";

const INTRIGUE = 3;
const WINTER_CAMPAIGN = 6;

const ENGLISH_CRUSADERS = [ "Richard", "Robert", "Crossbows" ];
const GERMAN_CRUSADERS = [ "Barbarossa", "Frederik", "Leopold" ];
const FRENCH_CRUSADERS = [ "Philippe", "Hugues", "Fileps" ];
const SALADIN_FAMILY = [ "Saladin", "Al Adil", "Al Aziz", "Al Afdal", "Al Zahir" ];

const GERMAN_ROADS = [ ST_SIMEON, ANTIOCH, ALEPPO ];

const KINGDOMS = {
	Syria: SARACENS,
	Antioch: FRANKS,
	Tripoli: FRANKS,
	Jerusalem: FRANKS,
	Egypt: SARACENS,
};

const VICTORY_TOWNS = [
	"Aleppo", "Damascus", "Egypt",
	"Antioch", "Tripoli", "Acre", "Jerusalem"
];

// serif cirled numbers
const DIE_HIT = [ 0, '\u2776', '\u2777', '\u2778', '\u2779', '\u277A', '\u277B' ];
const DIE_MISS = [ 0, '\u2460', '\u2461', '\u2462', '\u2463', '\u2464', '\u2465' ];
const DIE_SELF = '\u2716';

const ATTACK_MARK = "*";
const RESERVE_MARK_1 = "\u2020";
const RESERVE_MARK_2 = "\u2021";

// Only used by UI layer for layout. remove from game logic.
delete TOWNS[DEAD];
delete TOWNS[F_POOL];
delete TOWNS[S_POOL];
delete TOWNS[SEA];

let states = {};

let game = null;

function log(...args) {
	let s = Array.from(args).join("");
	game.log.push(s);
}

function active_adjective() {
	return (game.active === FRANKS ? "Frank" : "Saracen");
}

function join(list, conj = "or") {
	if (list.length === 0) return "";
	if (list.length === 1) return list[0];
	if (list.length === 2) return `${list[0]} ${conj} ${list[1]}`;
	return `${list.slice(0,-1).join(", ")}, ${conj} ${list[list.length-1]}`;
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

function print_summary(text, skip_if_empty = false) {
	let n = 0;
	function print_move(last) {
		return "\n" + n + " " + last.join(" \u2192 ");
	}
	if (!skip_if_empty || game.summary.length > 0) {
		game.summary.sort();
		let last = game.summary[0];
		for (let entry of game.summary) {
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
	}
	delete game.summary;
}

function enemy(p) {
	return (p === FRANKS) ? SARACENS : FRANKS;
}

function is_inactive_player(current) {
	return current === OBSERVER || (game.active !== current && game.active !== BOTH);
}

function is_winter() {
	return game.turn === 6;
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

function select_random_block(where) {
	let list = [];
	for (let b in BLOCKS)
		if (game.location[b] === where)
			list.push(b);
	if (list.length === 0)
		return null;
	return list[Math.floor(Math.random() * list.length)];
}

function select_random_enemy_block(where) {
	let list = [];
	for (let b in BLOCKS)
		if (game.location[b] === where && block_owner(b) === enemy(game.active))
			list.push(b);
	if (list.length === 0)
		return null;
	return list[Math.floor(Math.random() * list.length)];
}

function block_plural(who) {
	return BLOCKS[who].plural;
}

function block_name(who) {
	if (BLOCKS[who].type === 'nomads')
		return BLOCKS[who].name;
	return who;
}

function block_type(who) {
	return BLOCKS[who].type;
}

function block_home(who) {
	let home = BLOCKS[who].home;
	if (home === "Normandy") return "England";
	if (home === "Aquitaine") return "England";
	if (home === "Bourgogne") return "France";
	if (home === "Flanders") return "France";
	return home;
}

function list_seats(who) {
	switch (block_type(who)) {
	case 'nomads':
		return [ block_home(who) ];
	case 'turcopoles':
		who = "Turcopoles";
		break;
	case 'military_orders':
		who = BLOCKS[who].name;
		break;
	}
	if (is_saladin_family(who))
		who = SALADIN;
	if (who === "Raymond (Tiberias)" || who === "Raymond (Tripoli)")
		who = "Raymond";
	let list = [];
	for (let town in SHIELDS)
		if (SHIELDS[town].includes(who))
			list.push(town);
	return list;
}

function is_home_seat(where, who) {
	if (is_saladin_family(who))
		who = SALADIN;
	switch (block_type(who)) {
	case 'nomads':
		return where === block_home(who);
	case 'turcopoles':
		who = "Turcopoles";
		break;
	case 'military_orders':
		who = BLOCKS[who].name;
		break;
	}
	if (who === "Raymond (Tiberias)" || who === "Raymond (Tripoli)")
		who = "Raymond";
	if (SHIELDS[where] && SHIELDS[where].includes(who))
		return true;
	return false;
}

function block_pool(who) {
	if (BLOCKS[who].owner === FRANKS)
		return F_POOL;
	return S_POOL;
}

function block_owner(who) {
	return BLOCKS[who].owner;
}

function block_initiative(who) {
	return BLOCKS[who].combat[0];
}

function block_fire_power(who) {
	return BLOCKS[who].combat[1] | 0;
}

function block_move(who) {
	return BLOCKS[who].move;
}

function block_max_steps(who) {
	return BLOCKS[who].steps;
}

function is_saladin_family(who) {
	return who === "Saladin" || who === "Al Adil" || who === "Al Aziz" || who === "Al Afdal" || who === "Al Zahir";
}

function is_english_crusader(who) {
	return (who === "Richard" || who === "Robert" || who === "Crossbows");
}

function are_crusaders_not_in_pool(crusaders) {
	for (let b of crusaders)
		if (game.location[b] === F_POOL)
			return false;
	return true;
}

function is_block_on_map(who) {
	let location = game.location[who];
	return location && location !== DEAD && location !== F_POOL && location !== S_POOL;
}

function is_block_on_land(who) {
	let location = game.location[who];
	return location && location !== DEAD && location !== F_POOL && location !== S_POOL &&
		location !== ENGLAND && location !== FRANCE && location !== GERMANIA;
}

function road_id(a, b) {
	return (a < b) ? a + "/" + b : b + "/" + a;
}

function road_was_last_used_by_enemy(from, to) {
	return game.last_used[road_id(from, to)] === enemy(game.active);
}

function road_was_last_used_by_friendly(from, to) {
	return game.last_used[road_id(from, to)] === game.active;
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
		if (game.location[b] === where && block_owner(b) === p)
			++count;
	return count;
}

function count_enemy(where) {
	let p = enemy(game.active);
	let count = 0;
	for (let b in BLOCKS)
		if (game.location[b] === where && block_owner(b) === p)
			++count;
	return count;
}

function count_friendly_in_field(where) {
	let p = game.active;
	let count = 0;
	for (let b in BLOCKS)
		if (game.location[b] === where && block_owner(b) === p)
			if (!is_block_in_castle(b))
				++count;
	return count;
}

function count_enemy_in_field(where) {
	let p = enemy(game.active);
	let count = 0;
	for (let b in BLOCKS)
		if (game.location[b] === where && block_owner(b) === p)
			if (!is_block_in_castle(b))
				++count;
	return count;
}

function count_friendly_in_field_excluding_reserves(where) {
	let p = game.active;
	let count = 0;
	for (let b in BLOCKS)
		if (game.location[b] === where && block_owner(b) === p)
			if (!is_block_in_castle(b) && !is_reserve(b))
				++count;
	return count;
}

function count_enemy_in_field_excluding_reserves(where) {
	let p = enemy(game.active);
	let count = 0;
	for (let b in BLOCKS)
		if (game.location[b] === where && block_owner(b) === p)
			if (!is_block_in_castle(b) && !is_reserve(b))
				++count;
	return count;
}

function count_blocks_in_castle(where) {
	let n = 0;
	for (let b in BLOCKS)
		if (game.location[b] === where && game.castle.includes(b))
			++n;
	return n;
}

function count_enemy_in_field_and_reserve(where) {
	let n = 0;
	for (let b in BLOCKS)
		if (block_owner(b) !== game.active)
			if (game.location[b] === where && !game.castle.includes(b))
				++n;
	return n;
}

function count_reserves(where) {
	let n = 0;
	for (let b in BLOCKS)
		if (block_owner(b) === game.active)
			if (game.location[b] === where && is_reserve(b))
				++n;
	return n;
}

function is_friendly_kingdom(where) {
	return KINGDOMS[TOWNS[where].region] === game.active;
}

function is_enemy_kingdom(where) {
	return KINGDOMS[TOWNS[where].region] !== game.active;
}

/* Town queries include castle and field. */
function is_friendly_town(where) {
	return (count_enemy(where) === 0) && (count_friendly(where) > 0 || is_friendly_kingdom(where));
}
function is_enemy_town(where) {
	return (count_friendly(where) === 0) && (count_enemy(where) > 0 || is_enemy_kingdom(where));
}
function is_vacant_town(where) {
	return count_friendly(where) === 0 && count_enemy(where) === 0;
}
function is_contested_town(where) {
	return count_friendly(where) > 0 && count_enemy(where) > 0;
}
function is_enemy_occupied_town(where) {
	return count_enemy(where) > 0;
}

/* Field queries exclude castles. */
function is_friendly_field(where) {
	return (count_enemy_in_field(where) === 0) && (count_friendly_in_field(where) > 0 || is_friendly_kingdom(where));
}
function is_enemy_field(where) {
	return (count_friendly_in_field(where) === 0) && (count_enemy_in_field(where) > 0 || is_enemy_kingdom(where));
}
function is_contested_field(where) {
	return count_friendly_in_field(where) > 0 && count_enemy_in_field(where) > 0;
}
function is_friendly_or_vacant_field(where) {
	return is_friendly_field(where) || is_vacant_town(where);
}

/* Battle field queries exclude castles and reserves. */
function is_contested_battle_field() {
	let f = count_friendly_in_field_excluding_reserves(game.where);
	let e = count_enemy_in_field_excluding_reserves(game.where);
	return f > 0 && e > 0;
}
function is_friendly_battle_field() {
	return count_enemy_in_field_excluding_reserves(game.where) === 0;
}
function is_enemy_battle_field() {
	return count_friendly_in_field_excluding_reserves(game.where) === 0;
}

function is_reserve(who) {
	return game.reserves1.includes(who) || game.reserves2.includes(who);
}

function is_field_attacker(who) {
	if (game.location[who] === game.where && block_owner(who) === game.attacker[game.where])
		return !is_reserve(who) && !is_block_in_castle(who);
	return false;
}

function is_field_defender(who) {
	if (game.location[who] === game.where && block_owner(who) !== game.attacker[game.where])
		return !is_reserve(who) && !is_block_in_castle(who);
	return false;
}

function is_field_combatant(who) {
	if (game.location[who] === game.where)
		return !is_reserve(who) && !is_block_in_castle(who);
	return false;
}

function is_block_in_field(who) {
	return !is_reserve(who) && !is_block_in_castle(who);
}

function is_siege_attacker(who) {
	return game.storming.includes(who);
}

function is_siege_defender(who) {
	return is_block_in_castle_in(who, game.where);
}

function is_siege_combatant(who) {
	return game.storming.includes(who) || is_block_in_castle_in(who, game.where);
}

function castle_limit(where) {
	return TOWNS[where].rating;
}

function is_more_room_in_castle(where) {
	return count_blocks_in_castle(where) < castle_limit(where);
}

function is_within_castle_limit(where) {
	return count_friendly(where) <= Math.max(1, castle_limit(where));
}

function is_castle_town(where) {
	return castle_limit(where) > 0;
}

function is_under_siege(where) {
	return count_blocks_in_castle(where) > 0;
}

function is_block_in_castle(b) {
	return game.castle.includes(b);
}

function is_block_in_castle_in(b, town) {
	return game.location[b] === town && game.castle.includes(b);
}

function besieged_player(where) {
	for (let b in BLOCKS)
		if (is_block_in_castle_in(b, where))
			return block_owner(b);
	return null;
}

function besieging_player(where) {
	return enemy(besieged_player(where));
}

function is_port(where) {
	return TOWNS[where].port;
}

function is_friendly_port(where) {
	return TOWNS[where].port && is_friendly_field(where);
}

function can_activate(who) {
	return block_owner(who) === game.active &&
		is_block_on_map(who) &&
		!is_block_in_castle(who) &&
		!game.moved[who];
}

function can_activate_for_sea_move(who) {
	return block_owner(who) === game.active &&
		is_block_on_map(who) &&
		!game.moved[who];
}

function count_pinning(where) {
	return count_enemy_in_field_excluding_reserves(where);
}

function count_pinned(where) {
	let count = 0;
	for (let b in BLOCKS)
		if (game.location[b] === where && block_owner(b) === game.active)
			if (!is_reserve(b))
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

function can_block_use_road(from, to) {
	if (game.active === game.guide) {
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

		// cannot start or reinforce battles in winter
		if (is_winter() && is_enemy_occupied_town(to)) {
			// but can move through friendly sieges
			if (!is_friendly_field(to))
				return false;
			if (game.distance + 1 >= block_move(who))
				return false;
		}

		return true;
	}
	return false;
}

function can_germans_move(who) {
	let from = game.location[who];
	if (from === GERMANIA) {
		if (can_activate(who)) {
			for (let to of GERMAN_ROADS)
				if (can_germans_move_to(who, to))
					return true;
		}
	}
	return false;
}

function can_germans_move_to(who, to) {
	if (are_crusaders_not_in_pool(GERMAN_CRUSADERS)) {
		if (is_winter() && is_enemy_occupied_town(to))
			return false;
		if (to === ALEPPO)
			return true;
		if (to === ANTIOCH)
			return true;
		if (to === ST_SIMEON)
			return road_limit(GERMANIA, ST_SIMEON) < 2;
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
		if (is_enemy_field(to)) {
			if (!game.attacker[to])
				return true;
			if (game.attacker[to] === FRANKS)
				return (game.main_road[to] === "England");
		}
	}
	return false;
}

function can_enter_besieged_port(where) {
	// Tripoli and Tyre are friendly to besieged defender!
	if (where === TRIPOLI || where === TYRE)
		if (besieged_player(where) === game.active)
			return count_blocks_in_castle(where) < castle_limit(where);
	return false;
}

function can_leave_besieged_port(where) {
	// Tripoli and Tyre are friendly to besieged defender!
	if (where === TRIPOLI || where === TYRE)
		if (besieged_player(where) === game.active)
			return true;
	return false;
}

function can_block_sea_move_to(who, to) {
	if (is_port(to)) {
		// cannot start or reinforce battles in winter
		if (!is_winter()) {
			if (can_use_richards_sea_legs(who, to))
				return true;
			if (can_enter_besieged_port(to))
				return true;
		}
		return is_friendly_port(to);
	}
	return false;
}

function can_block_sea_move_from(who, from) {
	if (is_friendly_port(from))
		return true;
	if (can_leave_besieged_port(from))
		return true;
	if (from === ENGLAND)
		return are_crusaders_not_in_pool(ENGLISH_CRUSADERS);
	if (from === FRANCE)
		return are_crusaders_not_in_pool(FRENCH_CRUSADERS);
	return false;
}

function can_block_sea_move(who) {
	if (can_activate_for_sea_move(who)) {
		let from = game.location[who];
		if (can_block_sea_move_from(who, from)) {
			for (let to of PORTS)
				if (to !== from && can_block_sea_move_to(who, to))
					return true;
		}
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
	let from = game.location[who];
	if (block_owner(who) === game.attacker[from]) {
		if (!road_was_last_used_by_friendly(from, to))
			return false;
	}
	if (is_friendly_field(to) || is_vacant_town(to)) {
		if (can_block_use_road(from, to)) {
			if (road_was_last_used_by_enemy(from, to))
				return false;
			return true;
		}
	}
	return false;
}

function can_block_retreat(who) {
	if (block_owner(who) === game.active) {
		let from = game.location[who];
		for (let to of TOWNS[from].exits)
			if (can_block_retreat_to(who, to))
				return true;
	}
	return false;
}

function can_block_regroup_to(who, to) {
	// regroup during winter campaign
	if (is_winter() && is_enemy_occupied_town(to))
		return false;
	if (is_friendly_field(to) || is_vacant_town(to)) {
		let from = game.location[who];
		if (can_block_use_road(from, to))
			return true;
	}
	return false;
}

function can_block_regroup(who) {
	if (block_owner(who) === game.active) {
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
			if (n1 === muster)
				return true;
			for (let n2 of TOWNS[n1].exits) {
				if (n2 === n0) continue; // don't backtrack!
				if (can_block_use_road_to_muster(n1, n2)) {
					if (n2 === muster)
						return true;
					if (TOWNS[n2].exits.includes(muster))
						if (can_block_use_road_to_muster(n2, muster))
							return true;
				}
			}
		}
	}
	return false;
}

function can_block_muster_with_2_moves(n0, muster, avoid) {
	for (let n1 of TOWNS[n0].exits) {
		if (n1 === avoid)
			continue;
		if (can_block_use_road_to_muster(n0, n1)) {
			if (n1 === muster)
				return true;
			if (TOWNS[n1].exits.includes(muster))
				if (can_block_use_road_to_muster(n1, muster))
					return true;
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
	if (from === muster)
		return false;
	if (can_activate(who)) {
		if (is_pinned(who, from))
			return false;
		if (block_move(who) === 3)
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
	for (let where in TOWNS)
		if (is_friendly_field(where))
			if (can_muster_to(where))
				return true;
	return false;
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

function reset_blocks() {
	for (let b in BLOCKS) {
		game.location[b] = null;
		game.steps[b] = block_max_steps(b);
	}
}

function deploy(who, where) {
	game.location[who] = where;
	game.steps[who] = block_max_steps(who);
}

function disband(who) {
	game.summary.push([game.location[who]]);
	if (is_saladin_family(who) || block_type(who) === 'crusaders' || block_type(who) === 'military_orders')
		game.location[who] = null; // permanently eliminated
	else
		game.location[who] = DEAD; // into to the pool next year
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
	if (is_saladin_family(who) || block_type(who) === 'crusaders' || block_type(who) === 'military_orders')
		game.location[who] = null; // permanently eliminated
	else
		game.location[who] = DEAD; // into to the pool next year
	game.steps[who] = block_max_steps(who);
}

function reduce_block(who) {
	if (game.steps[who] === 1) {
		eliminate_block(who);
	} else {
		--game.steps[who];
	}
}

// DEPLOYMENT

function is_valid_frank_deployment() {
	let errors = [];
	for (let town in TOWNS)
		if (!is_within_castle_limit(town))
			errors.push(town);
	return errors;
}

function goto_frank_deployment() {
	game.active = FRANKS;
	game.state = 'frank_deployment';
}

states.frank_deployment = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Deployment: Waiting for " + game.active + ".";
		gen_action_undo(view);
		let errors = is_valid_frank_deployment();
		if (errors.length === 0)
			gen_action(view, 'next');
		for (let b in BLOCKS) {
			if (block_owner(b) === game.active && is_block_on_land(b))
				if (list_seats(b).length > 1)
					gen_action(view, 'block', b);
		}
		if (errors.length > 0)
			view.prompt = "Deployment: Too many blocks in " + join(errors, "and") + ".";
		else
			view.prompt = "Deployment: You may make seat adjustments.";
	},
	block: function (who) {
		push_undo();
		game.who = who;
		game.state = 'frank_deployment_to';
	},
	next: function () {
		clear_undo();
		goto_saracen_deployment();
	},
	undo: pop_undo
}

states.frank_deployment_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Deployment: Waiting for " + game.active + ".";
		view.prompt = "Deployment: Move " + game.who + " to " + join(list_seats(game.who), "or") + ".";
		gen_action_undo(view);
		gen_action(view, 'block', game.who);
		let from = game.location[game.who];
		for (let town of list_seats(game.who))
			if (town !== from)
				gen_action(view, 'town', town);
	},
	town: function (where) {
		game.location[game.who] = where;
		game.who = null;
		game.state = 'frank_deployment';
	},
	block: pop_undo,
	undo: pop_undo
}

function goto_saracen_deployment() {
	for (let i = 0; i < 4; ++i) {
		let nomad = select_random_block(S_POOL);
		log(BLOCKS[nomad].name + " arrive in " + block_home(nomad) + ".");
		deploy(nomad, block_home(nomad));
	}
	game.active = SARACENS;
	game.state = 'saracen_deployment';
	game.who = SALADIN;
}

states.saracen_deployment = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Deployment: Waiting for " + game.active + ".";
		view.prompt = "Deployment: You may swap places with Saladin and any other block of his family.";
		gen_action(view, 'next');
		gen_action_undo(view);
		if (game.location[SALADIN] === DAMASCUS) {
			for (let b of SALADIN_FAMILY)
				if (b !== SALADIN && game.location[b] !== game.location[SALADIN])
					gen_action(view, 'block', b);
		}
	},
	block: function (who) {
		push_undo();
		let saladin = game.location[SALADIN];
		game.location[SALADIN] = game.location[who];
		game.location[who] = saladin;
		game.who = null;
	},
	next: function () {
		clear_undo();
		game.who = null;
		start_year();
	},
	undo: pop_undo
}

// GAME TURN

function is_friendly_town_for_vp(town) {
	if (is_friendly_town(town))
		return true;
	if (is_under_siege(town))
		return besieged_player(town) === game.active;
	return false;
}

function count_victory_points() {
	let save_active = game.active;

	game.f_vp = 0;
	game.active = FRANKS;
	for (let town of VICTORY_TOWNS)
		if (is_friendly_town_for_vp(town))
			++ game.f_vp;

	game.s_vp = 0;
	game.active = SARACENS;
	for (let town of VICTORY_TOWNS)
		if (is_friendly_town_for_vp(town))
			++ game.s_vp;

	game.active = save_active;
}

function check_sudden_death() {
	if (game.f_vp === 7) {
		game.state = 'game_over';
		game.result = FRANKS;
		game.victory = "Franks control all seven victory cities."
		return true;
	}
	if (game.s_vp === 7) {
		game.state = 'game_over';
		game.result = SARACENS;
		game.victory = "Saracens control all seven victory cities."
		return true;
	}
}

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

// CARD PHASE

function goto_card_phase() {
	game.f_card = 0;
	game.s_card = 0;
	game.show_cards = false;
	game.state = 'play_card';
	game.active = BOTH;
}

function resume_play_card() {
	if (game.s_card && game.f_card)
		reveal_cards();
	else if (game.f_card)
		game.active = SARACENS;
	else if (game.s_card)
		game.active = FRANKS;
	else
		game.active = BOTH;
}

states.play_card = {
	prompt: function (view, current) {
		if (current === OBSERVER)
			return view.prompt = "Card Phase: Waiting for players to play a card.";
		if (current === FRANKS) {
			view.prior_s_card = game.prior_s_card;
			if (game.f_card) {
				view.prompt = "Card Phase: Waiting for Saracens to play a card.";
				gen_action(view, 'undo');
			} else {
				view.prompt = "Card Phase: Play a card.";
				for (let c of game.f_hand)
					if (game.turn > 1 || c !== INTRIGUE)
						gen_action(view, 'play', c);
			}
		}
		if (current === SARACENS) {
			view.prior_f_card = game.prior_f_card;
			if (game.s_card) {
				view.prompt = "Card Phase: Waiting for Franks to play a card.";
				gen_action(view, 'undo');
			} else {
				view.prompt = "Card Phase: Play a card.";
				for (let c of game.s_hand)
					if (game.turn > 1 || c !== INTRIGUE)
						gen_action(view, 'play', c);
			}
		}
	},
	play: function (card, current) {
		if (current === FRANKS) {
			remove_from_array(game.f_hand, card);
			game.f_card = card;
		}
		if (current === SARACENS) {
			remove_from_array(game.s_hand, card);
			game.s_card = card;
		}
		resume_play_card();
	},
	undo: function (_, current) {
		if (current === FRANKS) {
			game.f_hand.push(game.f_card);
			game.f_card = 0;
		}
		if (current === SARACENS) {
			game.s_hand.push(game.s_card);
			game.s_card = 0;
		}
		resume_play_card();
	}
}

function reveal_cards() {
	log("Franks play " + CARDS[game.f_card].name + ".");
	log("Saracens play " + CARDS[game.s_card].name + ".");
	game.show_cards = true;

	if (CARDS[game.f_card].event && CARDS[game.s_card].event) {
		log("Game Turn is cancelled.");
		game.prior_f_card = game.f_card;
		game.prior_s_card = game.s_card;
		end_game_turn();
		return;
	}

	if (game.f_card === INTRIGUE) {
		game.f_card = game.prior_s_card;
		log("Intrigue copies " + CARDS[game.f_card].name + ".");
	}
	if (game.s_card === INTRIGUE) {
		game.s_card = game.prior_f_card;
		log("Intrigue copies " + CARDS[game.s_card].name + ".");
	}

	delete game.winter_campaign;
	if (is_winter()) {
		if (game.f_card === WINTER_CAMPAIGN)
			game.winter_campaign = FRANKS;
		if (game.s_card === WINTER_CAMPAIGN)
			game.winter_campaign = SARACENS;
	}

	game.prior_f_card = game.f_card;
	game.prior_s_card = game.s_card;

	let fp = CARDS[game.f_card].event ? 10 : CARDS[game.f_card].moves;
	let sp = CARDS[game.s_card].event ? 10 : CARDS[game.s_card].moves;

	if (fp === sp) {
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
	log("Start " + active_adjective() + " turn.");
	reset_road_limits();
	game.main_road = {};
	let card = CARDS[game.active === FRANKS ? game.f_card : game.s_card];
	if (card.event)
		goto_event_card(card.event);
	else
		goto_move_phase(card.moves);
}

function end_player_turn() {
	game.moves = 0;
	game.main_road = null;

	if (game.active === game.p2) {
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

states.assassins = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Assassins: Waiting for " + game.active + ".";
		view.prompt = "Assassins: Choose one enemy block.";
		for (let b in BLOCKS) {
			if (is_block_on_land(b) && block_owner(b) === enemy(game.active))
				gen_action(view, 'block', b);
		}
	},
	block: function (who) {
		game.where = game.location[who];
		game.who = select_random_enemy_block(game.where);
		game.location[ASSASSINS] = game.where;
		game.state = 'assassins_show_1';
	},
}

states.assassins_show_1 = {
	prompt: function (view, current) {
		view.assassinate = game.who;
		if (is_inactive_player(current))
			return view.prompt = "Assassins: Waiting for " + game.active + ".";
		view.prompt = "Assassins: The assassins target " + block_name(game.who) + " in " + game.where + ".";
		gen_action(view, 'next');
	},
	next: function () {
		assassinate(game.who, game.where);
		game.state = 'assassins_show_2';
	},
}

states.assassins_show_2 = {
	prompt: function (view, current) {
		view.assassinate = game.who;
		if (is_inactive_player(current))
			return view.prompt = "Assassins: Waiting for " + game.active + ".";
		view.prompt = "Assassins: The assassins hit " + block_name(game.who) + " in " + game.where + ".";
		gen_action(view, 'next');
	},
	next: function () {
		game.location[ASSASSINS] = MASYAF;
		game.who = null;
		game.where = null;
		end_player_turn();
	},
}

function assassinate(who, where) {
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
	log("Assassins hit " + block_name(who) + " in " + where + ": " + rolls.join("") + ".");
	for (let i = 0; i < hits; ++i)
		reduce_block(who);
}

function goto_guide() {
	game.guide = game.active;
	game.state = 'move_phase_event';
	game.summary = [];
}

function goto_jihad() {
	game.jihad = game.active;
	game.state = 'move_phase_event';
	game.summary = [];
}

function goto_select_jihad() {
	game.jihad_list = [];
	for (let where in TOWNS)
		if (is_contested_field(where))
			game.jihad_list.push(where);
	if (game.jihad_list.length === 0) {
		delete game.jihad_list;
		return end_player_turn();
	}
	if (game.jihad_list.length === 1) {
		game.jihad = game.jihad_list[0];
		log("Jihad in " + game.jihad + ".");
		delete game.jihad_list;
		return end_player_turn();
	}
	game.state = 'select_jihad';
}

states.select_jihad = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Jihad: Waiting for " + game.active + ".";
		view.prompt = "Jihad: Select battle for Jihad.";
		for (let town of game.jihad_list)
			gen_action(view, 'town', town);
	},
	town: function (where) {
		game.jihad = where;
		log("Jihad in " + game.jihad + ".");
		delete game.jihad_list;
		end_player_turn();
	},
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
			return view.prompt = "Manna: Waiting for " + game.active + ".";
		view.prompt = "Manna: Add one step to three different friendly blocks \u2014 " + game.moves + " left.";
		gen_action_undo(view);
		gen_action(view, 'next');
		if (game.moves > 0) {
			for (let b in BLOCKS) {
				if (is_block_on_land(b) && block_owner(b) === game.active && !game.moved[b])
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
		clear_undo();
		print_summary(game.active + " use Manna:");
		game.moved = {};
		end_player_turn();
	},
	undo: pop_undo
}

// MOVE PHASE

function queue_attack(who, round) {
	if (round === 1)
		return ATTACK_MARK;
	if (round === 2) {
		game.reserves1.push(who);
		return RESERVE_MARK_1;
	}
	if (round === 3) {
		game.reserves2.push(who);
		return RESERVE_MARK_2;
	}
}

function move_block(who, from, to) {
	game.location[who] = to;
	game.road_limit[road_id(from, to)] = road_limit(from, to) + 1;
	game.distance ++;
	if (is_contested_field(to)) {
		game.last_used[road_id(from, to)] = game.active;

		// 6.56 Main Attack relief force by Player 2 arrives one round later than normal
		let relief_delay = 0;
		if (game.active === game.p2 && besieged_player(to) === game.p2) {
			console.log("DELAYED RELIEF BY P2", who, from, to);
			relief_delay = 1;
		}

		if (!game.attacker[to]) {
			game.attacker[to] = game.active;
			game.main_road[to] = from;
			return queue_attack(who, 1 + relief_delay);
		} else {
			// Attacker main attack or reinforcements
			if (game.attacker[to] === game.active) {
				if (game.main_road[to] !== from)
					return queue_attack(who, 2 + relief_delay);
				return queue_attack(who, 1 + relief_delay);
			}

			// Defender reinforcements
			if (!game.main_road[to])
				game.main_road[to] = from;

			if (game.main_road[to] === from) {
				return queue_attack(who, 2);
			} else {
				return queue_attack(who, 3);
			}
		}
	}
	return false;
}

function goto_move_phase(moves) {
	game.state = 'move_phase';
	game.moves = moves;
}

function end_move_phase() {
	clear_undo();
	game.who = null;
	game.where = null;
	game.moves = 0;

	// declined to use winter campaign
	if (game.winter_campaign === game.active)
		delete game.winter_campaign;

	if (game.active === game.jihad)
		goto_select_jihad();
	else
		end_player_turn();
}

states.move_phase = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Move Phase: Waiting for " + game.active + ".";
		if (game.moves === 0)
			view.prompt = "Move Phase: No moves left.";
		else if (game.moves === 1)
			view.prompt = "Move Phase: 1 move left.";
		else
			view.prompt = "Move Phase: " + game.moves + " moves left.";
		gen_action_undo(view);
		gen_action(view, 'end_move_phase');
		if (game.moves > 0) {
			for (let b in BLOCKS) {
				if (can_block_land_move(b))
					gen_action(view, 'block', b);
				if (can_block_sea_move(b))
					gen_action(view, 'block', b);
				if (can_germans_move(b))
					gen_action(view, 'block', b);
			}
			if (can_muster_anywhere())
				gen_action(view, 'muster');
			if (game.winter_campaign === game.active)
				gen_action(view, 'winter_campaign');
		}
	},
	winter_campaign: function () {
		push_undo();
		--game.moves;
		game.state = 'winter_campaign';
	},
	muster: function () {
		push_undo();
		--game.moves;
		game.state = 'muster';
	},
	block: function (who) {
		game.summary = [];
		push_undo();
		game.who = who;
		game.where = game.location[who];
		if (game.where === GERMANIA) {
			game.state = 'german_move_to';
		} else if (game.where === FRANCE || game.where === ENGLAND) {
			game.state = 'sea_move_to';
		} else {
			game.state = 'move_phase_to';
		}
	},
	end_move_phase: end_move_phase,
	undo: pop_undo
}

states.move_phase_event = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = group_move_name(1) + "Waiting for " + game.active + ".";
		view.prompt = group_move_name(0) + "Choose a block to group move.";
		gen_action_undo(view);
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

// Start new group move or sea move.
states.move_phase_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Move Phase: Waiting for " + game.active + ".";
		view.prompt = "Move Phase: Move " + block_name(game.who);
		gen_action_undo(view);
		gen_action(view, 'block', game.who);
		let from = game.location[game.who];
		let can_group_move = false;
		let can_sea_move = false;
		if (can_block_land_move(game.who)) {
			for (let to of TOWNS[from].exits) {
				if (can_block_land_move_to(game.who, from, to)) {
					gen_action(view, 'town', to);
					can_group_move = true;
				}
			}
		}
		if (can_block_sea_move(game.who)) {
			gen_action(view, 'town', SEA);
			can_sea_move = true;
		}
		if (can_group_move && can_sea_move)
			view.prompt += " by road or by sea.";
		else if (can_sea_move)
			view.prompt += " by sea.";
		else
			view.prompt += " by road.";
	},
	town: function (to) {
		let from = game.location[game.who];
		if (to === SEA) {
			log_move_start(from);
			log_move_continue(to);
			game.location[game.who] = SEA;
			game.state = 'sea_move_to';
			return;
		}
		-- game.moves;
		game.distance = 0;
		log_move_start(from);
		let mark = move_block(game.who, from, to);
		if (mark)
			log_move_continue(to + mark);
		else
			log_move_continue(to);
		lift_siege(from);
		game.last_from = from;
		if (!can_block_continue(game.who, from, to))
			end_move();
		else {
			game.state = 'group_move_to';
		}
	},
	block: pop_undo,
	undo: pop_undo
}

// GROUP MOVE

function group_move_name() {
	if (game.active === game.jihad) return "Jihad: ";
	if (game.active === game.guide) return "Guide: ";
	return "Group Move: ";
}

function can_group_move_more() {
	for (let b in BLOCKS)
		if (game.location[b] === game.where)
			if (can_block_land_move(b))
				return true;
	return false;
}

states.group_move_who = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = group_move_name(1) + "Waiting for " + game.active + ".";
		view.prompt = group_move_name(0) + "Move blocks from " + game.where + ".";
		gen_action_undo(view);
		if (game.active === game.guide || game.active === game.jihad)
			gen_action(view, 'end_move_phase');
		else
			gen_action(view, 'end_group_move');
		for (let b in BLOCKS)
			if (game.location[b] === game.where)
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
	end_move_phase: function () {
		end_group_move();
		end_move_phase();
	},
	end_group_move: end_group_move,
	undo: pop_undo
}

states.group_move_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = group_move_name(1) + "Waiting for " + game.active + ".";
		view.prompt = group_move_name(0) + "Move " + block_name(game.who) + ".";
		gen_action_undo(view);
		if (game.distance === 0)
			gen_action(view, 'block', game.who);
		let from = game.location[game.who];
		if (game.distance > 0) {
			// cannot start or reinforce battles in winter
			if (!(is_winter() && is_enemy_occupied_town(from)))
				gen_action(view, 'town', from);
		}
		for (let to of TOWNS[from].exits) {
			if (to !== game.last_from && can_block_land_move_to(game.who, from, to)) {
				gen_action(view, 'town', to);
			}
		}
	},
	town: function (to) {
		let from = game.location[game.who];
		if (to === from) {
			end_move();
			return;
		}
		if (game.distance === 0)
			log_move_start(from);
		let mark = move_block(game.who, from, to);
		if (mark)
			log_move_continue(to + mark);
		else
			log_move_continue(to);
		lift_siege(from);
		game.last_from = from;
		if (!can_block_continue(game.who, from, to))
			end_move();
	},
	block: pop_undo,
	undo: pop_undo
}

function end_move() {
	if (game.distance > 0)
		game.moved[game.who] = 1;
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

states.german_move_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Move Phase: Waiting for " + game.active + ".";
		view.prompt = "Move Phase: Move " + block_name(game.who) + " to Aleppo, Antioch, or St. Simeon.";
		gen_action_undo(view);
		gen_action(view, 'block', game.who);
		for (let to of GERMAN_ROADS)
			if (can_germans_move_to(game.who, to))
				gen_action(view, 'town', to);
	},
	town: function (to) {
		--game.moves;
		let from = GERMANIA;
		game.location[game.who] = to;
		game.moved[game.who] = 1;
		game.distance = 0;
		let mark = move_block(game.who, from, to);
		if (mark)
			log(game.active + " move:\n Germania \u2192 " + to + mark + ".");
		else
			log(game.active + " move:\n Germania \u2192 " + to + ".");
		game.who = null;
		game.state = 'move_phase';
	},
	block: pop_undo,
	undo: pop_undo,
}

states.sea_move_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Move Phase: Waiting for " + game.active + ".";
		if (is_english_crusader(game.who))
			view.prompt = "Sea Move: Move " + block_name(game.who) + " to a port.";
		else
			view.prompt = "Sea Move: Move " + block_name(game.who) + " to a friendly port.";
		gen_action_undo(view);
		gen_action(view, 'block', game.who);
		let from = game.location[game.who];
		if (from === GERMANIA) {
			for (let to of GERMAN_ROADS)
				if (can_germans_move_to(game.who, to))
					gen_action(view, 'town', to);
		} else {
			for (let to of PORTS)
				if (to !== game.where && can_block_sea_move_to(game.who, to))
					gen_action(view, 'town', to);
		}
	},
	town: function (to) {
		--game.moves;

		let from = game.where;
		game.location[game.who] = to;
		game.moved[game.who] = 1;

		lift_siege(from);

		remove_from_array(game.castle, game.who);

		if (besieged_player(to) === game.active && is_more_room_in_castle(to)) {
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
	block: pop_undo,
	undo: pop_undo,
}

// MUSTER

states.muster = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Move Phase: Waiting for " + game.active + ".";
		view.prompt = "Muster: Choose a friendly muster town.";
		gen_action_undo(view);
		for (let where in TOWNS) {
			// cannot start or reinforce battles in winter
			if (is_winter()) {
				if (is_friendly_town(where))
					if (can_muster_to(where))
						gen_action(view, 'town', where);
			} else {
				if (is_friendly_field(where))
					if (can_muster_to(where))
						gen_action(view, 'town', where);
			}
		}
	},
	town: function (where) {
		push_undo();
		game.where = where;
		game.state = 'muster_who';
		game.summary = [];
	},
	undo: pop_undo,
}

states.muster_who = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Move Phase: Waiting for " + game.active + ".";
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
			return view.prompt = "Move Phase: Waiting for " + game.active + ".";
		view.prompt = "Muster: Move " + block_name(game.who) + " to " + game.where + ".";
		view.muster = game.where;
		gen_action_undo(view);
		gen_action(view, 'block', game.who);
		let from = game.location[game.who];
		let muster = game.where;
		if (block_move(game.who) === 3) {
			for (let to of TOWNS[from].exits) {
				if (can_block_use_road_to_muster(from, to)) {
					if (to === muster || can_block_muster_with_2_moves(to, muster, from))
						gen_action(view, 'town', to);
				}
			}
		} else {
			for (let to of TOWNS[from].exits) {
				if (can_block_use_road_to_muster(from, to)) {
					if (to === muster || can_block_muster_with_1_move(to, muster))
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
		if (to === game.where) {
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
			return view.prompt = "Move Phase: Waiting for " + game.active + ".";
		view.prompt = "Muster: Move " + block_name(game.who) + " to " + game.where + ".";
		view.muster = game.where;
		gen_action_undo(view);
		let from = game.location[game.who];
		let muster = game.where;
		if (block_move(game.who) === 3) {
			for (let to of TOWNS[from].exits) {
				if (can_block_use_road_to_muster(from, to)) {
					if (to === muster || can_block_muster_with_1_move(to, muster))
						gen_action(view, 'town', to);
				}
			}
		} else {
			for (let to of TOWNS[from].exits) {
				if (can_block_use_road_to_muster(from, to)) {
					if (to === muster)
						gen_action(view, 'town', to);
				}
			}
		}
	},
	town: function (to) {
		let from = game.location[game.who];
		log_move_continue(to);
		move_block(game.who, from, to);
		if (to === game.where) {
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
			return view.prompt = "Move Phase: Waiting for " + game.active + ".";
		view.prompt = "Muster: Move " + block_name(game.who) + " to " + game.where + ".";
		view.muster = game.where;
		gen_action_undo(view);
		let from = game.location[game.who];
		let muster = game.where;
		for (let to of TOWNS[from].exits) {
			if (can_block_use_road_to_muster(from, to)) {
				if (to === muster)
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
	log_move_end();
	game.moved[game.who] = 1;
	game.who = null;
	game.state = 'muster_who';
}

// WINTER CAMPAIGN

states.winter_campaign = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Move Phase: Waiting for " + game.active + ".";
		view.prompt = "Winter Campaign: Select a siege to maintain over the winter.";
		gen_action_undo(view);
		for (let town in TOWNS)
			if (is_friendly_field(town) && is_under_siege(town))
				gen_action(view, 'town', town);
	},
	town: function (where) {
		log(game.active + " winter campaign in " + where + ".");
		game.winter_campaign = where;
		game.state = 'move_phase';
	},
	undo: pop_undo
}

// COMBAT PHASE

function goto_combat_phase() {
	if (is_winter()) {
		game.moved = {};
		return end_game_turn();
	}

	game.combat_list = [];
	for (let where in TOWNS)
		if (is_contested_town(where))
			game.combat_list.push(where);
	resume_combat_phase();
}

function resume_combat_phase() {
	reset_road_limits();
	reset_moved_for_combat();

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
			return view.prompt = "Battle Phase: Waiting for " + game.active + ".";
		view.prompt = "Battle Phase: Choose the next battle or siege!";
		for (let where of game.combat_list)
			gen_action(view, 'town', where);
	},
	town: function (where) {
		remove_from_array(game.combat_list, where);
		game.where = where;
		start_combat();
	},
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
	game.is_field_battle = 0;

	if (is_castle_town(game.where)) {
		if (!is_under_siege(game.where)) {
			console.log("START SIEGE");
			log("~ Combat Deployment ~");
			game.castle_owner = enemy(game.attacker[game.where]);
			game.active = game.castle_owner;
			game.state = 'combat_deployment';
		} else {
			game.castle_owner = besieged_player(game.where);
			if (!game.attacker[game.where])
				game.attacker[game.where] = enemy(game.castle_owner);
			console.log("CONTINUE SIEGE", game.attacker[game.where]);
			log("Existing siege continues.");
			next_combat_round();
		}
	} else {
		console.log("START NON-SIEGE");
		game.castle_owner = null;
		next_combat_round();
	}
}

function end_combat() {
	log("~ Combat Ends ~");

	console.log("END COMBAT IN", game.where);

	lift_siege(game.where);

	if (game.jihad === game.where)
		game.jihad = null;

	delete game.castle_owner;
	delete game.storming;
	delete game.sallying;
	delete game.is_field_battle;
	game.where = null;
	game.flash = "";
	game.combat_round = 0;

	resume_combat_phase();
}

// COMBAT DEPLOYMENT

states.combat_deployment = {
	show_battle: true,
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Battle: Waiting for " + game.active + ".";
		view.prompt = "Battle: Deploy blocks on the field and in the castle.";
		let max = castle_limit(game.where);
		let n = count_blocks_in_castle(game.where);
		let have_options = false;
		if (n < max) {
			for (let b in BLOCKS) {
				if (block_owner(b) === game.active && !is_reserve(b)) {
					if (game.location[b] === game.where && !game.castle.includes(b)) {
						gen_action(view, 'withdraw', b);
						gen_action(view, 'block', b);
						have_options = true;
					}
				}
			}
		}
		if (!have_options)
			view.flash_next = "Click Next when you're done.";
		gen_action_undo(view);
		gen_action(view, 'next');
	},
	withdraw: function (who) {
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
		if (n === 1)
			log(game.active + " withdraw 1 block.");
		else
			log(game.active + " withdraw " + n + " blocks.");
		game.active = game.attacker[game.where];
		if (count_enemy_in_field_and_reserve(game.where) === 0) {
			console.log("DEFENDER REFUSED FIELD BATTLE");
			return goto_regroup();
		}
		next_combat_round();
	},
	undo: pop_undo
}

// REGROUP AFTER FIELD BATTLE/SIEGE VICTORY

function print_retreat_summary() {
	if (game.summary && game.summary.length > 0)
		print_summary("Retreats from " + game.where + ":");
}

function goto_regroup() {
	game.is_field_battle = 0;
	lift_siege(game.where);
	console.log("REGROUP", game.active);
	if (!is_under_siege(game.where))
		clear_reserves(); // no siege battle, reserves arrive before regroup
	reset_road_limits();
	reset_moved_for_combat();
	game.state = 'regroup';
	game.summary = [];
}

states.regroup = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Regroup: Waiting for " + game.active + ".";
		view.prompt = "Regroup: Choose a block to move.";
		gen_action_undo(view);
		gen_action(view, 'end_regroup');
		for (let b in BLOCKS) {
			if (game.location[b] === game.where) {
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
		print_summary(game.active + " regroup:", true);
		if (is_winter())
			goto_winter_2();
		else if (is_contested_town(game.where))
			next_combat_round();
		else
			end_combat();
	},
	undo: pop_undo
}

states.regroup_to = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Regroup: Waiting for " + game.active + ".";
		view.prompt = "Regroup: Move the block to a friendly or vacant town.";
		gen_action_undo(view);
		gen_action(view, 'block', game.who);
		for (let to of TOWNS[game.where].exits)
			if (can_block_regroup_to(game.who, to))
				gen_action(view, 'town', to);
	},
	town: function (to) {
		// We can regroup while reserves are still on the way...
		remove_from_array(game.reserves1, game.who);
		remove_from_array(game.reserves2, game.who);

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
	game.is_field_battle = 0;
	console.log("NEXT COMBAT ROUND");
	print_retreat_summary();
	if (game.jihad === game.where && game.combat_round === 1)
		game.jihad = null;
	switch (game.combat_round) {
	case 0: return goto_combat_round(1);
	case 1: return goto_combat_round(2);
	case 2: return goto_combat_round(3);
	case 3: return goto_retreat_after_combat();
	}
}

function bring_on_reserves(reserves) {
	let f = 0;
	let s = 0;
	for (let b in BLOCKS) {
		if (game.location[b] === game.where) {
			if (reserves.includes(b)) {
				if (block_owner(b) === FRANKS)
					++f;
				else
					++s;
				remove_from_array(reserves, b);
			}
		}
	}
	if (f > 0)
		log(f + " Frank " + (f === 1 ? "reserve arrives." : "reserves arrive."));
	if (s > 0)
		log(s + " Saracen " + (s === 1 ? "reserve arrives." : "reserves arrive."));
}

function clear_reserves(where) {
	for (let b in BLOCKS) {
		if (game.location[b] === where) {
			remove_from_array(game.reserves1, b);
			remove_from_array(game.reserves2, b);
		}
	}
}

function reset_moved_for_combat() {
	for (let b in game.moved) game.moved[b] = 0;
	for (let b of game.reserves1) game.moved[b] = 1;
	for (let b of game.reserves2) game.moved[b] = 1;
}

function goto_combat_round(new_combat_round) {
	game.combat_round = new_combat_round;
	game.summary = [];

	let was_contested = is_contested_battle_field();

	if (game.combat_round === 1 && count_friendly_in_field_excluding_reserves(game.where) === 0) {
		log("Combat round skipped because main attack regrouped away.");
		console.log("MAIN ATTACK REGROUPED AWAY, SKIP ROUND 1");
		game.combat_round = 2;
	}

	console.log("COMBAT ROUND", game.combat_round);
	log("~ Combat Round " + game.combat_round + " ~");

	if (game.combat_round === 2)
		bring_on_reserves(game.reserves1);
	if (game.combat_round === 3)
		bring_on_reserves(game.reserves2);

	reset_moved_for_combat();

	if (is_contested_battle_field()) {
		if (is_under_siege(game.where)) {
			if (!was_contested) {
				log("Relief forces arrive!");
				console.log("RELIEF FORCE ARRIVED");
				if (game.storming.length > 0) {
					log("Storming canceled by arriving relief force.");
					console.log("STORMING CANCELED");
					game.halfhit = null;
					game.storming.length = 0;
				}
				let old_attacker = game.attacker[game.where];
				game.attacker[game.where] = besieged_player(game.where);
				if (old_attacker !== game.attacker[game.where]) {
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
	game.active = besieging_player(game.where);
	// Castle is full.
	if (game.storming.length === castle_limit(game.where))
		return goto_siege_battle();
	// Field is empty.
	if (count_friendly(game.where) - game.storming.length === 0)
		return goto_siege_battle();
	game.state = 'declare_storm';
}

states.declare_storm = {
	show_battle: true,
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Siege Declaration: Waiting for " + game.active + " to declare storm.";
		view.prompt = "Siege Declaration: Declare which blocks should storm the castle.";
		let have_options = false;
		if (game.storming.length < castle_limit(game.where)) {
			for (let b in BLOCKS) {
				if (block_owner(b) === game.active && !is_reserve(b)) {
					if (game.location[b] === game.where && !game.storming.includes(b)) {
						gen_action(view, 'storm', b);
						gen_action(view, 'block', b);
						have_options = true;
					}
				}
			}
		}
		if (!have_options)
			view.flash_next = "Click Next when you're done.";
		gen_action_undo(view);
		gen_action(view, 'next');
	},
	storm: storm_with_block,
	block: storm_with_block,
	next: function () {
		clear_undo();
		let n = game.storming.length;
		console.log("STORM DECLARATION", n);
		if (n === 0) {
			game.flash = game.active + " decline to storm.";
			if (game.jihad === game.where)
				game.jihad = null;
			log(game.active + " decline to storm.");
			goto_declare_sally();
		} else {
			goto_siege_battle();
		}
	},
	undo: pop_undo
}

function storm_with_block(who) {
	push_undo();
	game.storming.push(who);
	if (game.storming.length > 1)
		game.flash = game.active + " storm with " + game.storming.length + " blocks.";
	else
		game.flash = game.active + " storm with 1 block.";
	if (block_plural(who))
		log(game.active[0] + ": " + block_name(who) + " storm.");
	else
		log(game.active[0] + ": " + block_name(who) + " storms.");
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
			return view.prompt = "Siege Declaration: Waiting for " + game.active + " to declare sally.";
		view.prompt = "Siege Declaration: Declare which blocks should sally onto the field.";
		let have_options = false;
		for (let b in BLOCKS) {
			if (block_owner(b) === game.active && !is_reserve(b) && is_block_in_castle(b)) {
				if (game.location[b] === game.where && !game.sallying.includes(b)) {
					gen_action(view, 'sally', b);
					gen_action(view, 'block', b);
					have_options = true;
				}
			}
		}
		if (!have_options)
			view.flash_next = "Click Next when you're done.";
		gen_action_undo(view);
		gen_action(view, 'next');
	},
	sally: sally_with_block,
	block: sally_with_block,
	next: function () {
		clear_undo();
		let n = game.sallying.length;
		console.log("SALLY DECLARATION", n);
		if (n === 0) {
			game.flash = game.active + " decline to sally.";
			log(game.active + " decline to sally.");
		}
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
			goto_siege_attrition();
		}
	},
	undo: pop_undo
}

function sally_with_block(who) {
	push_undo();
	remove_from_array(game.castle, who);
	game.sallying.push(who);
	if (game.sallying.length > 1)
		game.flash = game.active + " sally with " + game.sallying.length + " blocks.";
	else
		game.flash = game.active + " sally with 1 block.";
	if (block_plural(who))
		log(game.active[0] + ": " + block_name(who) + " sally.");
	else
		log(game.active[0] + ": " + block_name(who) + " sallies.");
}

// RETREAT AFTER COMBAT

function goto_retreat_after_combat() {
	console.log("RETREAT AFTER COMBAT");
	reset_moved_for_combat();

	// withdraw all sallying blocks to castle.
	for (let b of game.sallying)
		game.castle.push(b);
	game.sallying.length = 0;

	// TODO: 6.2 - In Sieges, the attacker /may/ retreat or stay on siege.

	// withdraw all storming blocks to the field.
	game.halfhit = null;
	game.storming.length = 0;

	if (is_contested_field(game.where)) {
		log("~ Retreat ~");
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
			return view.prompt = "Retreat: Waiting for " + game.active + ".";
		view.prompt = "Retreat: Choose a block to move.";
		gen_action_undo(view);
		let can_retreat = false;
		for (let b in BLOCKS) {
			if (game.location[b] === game.where && !is_block_in_castle(b) && can_block_retreat(b)) {
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
			if (game.location[b] === game.where && !is_block_in_castle(b) && block_owner(b) === game.active)
				eliminate_block(b);
		print_summary(game.active + " retreat:");
		game.active = enemy(game.active);
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
			return view.prompt = "Retreat: Waiting for " + game.active + ".";
		view.prompt = "Retreat: Move the block to a friendly or neutral town.";
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
	log("~ Siege Attrition ~");
	game.active = besieged_player(game.where);
	game.state = 'siege_attrition';
	game.attrition_list = [];
	for (let b in BLOCKS)
		if (is_block_in_castle_in(b, game.where))
			game.attrition_list.push(b);
}

function resume_siege_attrition() {
	if (game.attrition_list.length === 0) {
		delete game.attrition_list;
		if (!is_under_siege(game.where)) {
			game.active = enemy(game.active);
			log(game.where + " falls to siege attrition.");
			goto_regroup();
		} else {
			log("Siege continues.");
			end_combat();
		}
	}
}

states.siege_attrition = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Siege Attrition: Waiting for " + game.active + ".";
		view.prompt = "Siege Attrition: Roll for siege attrition in " + game.where + ".";
		for (let b of game.attrition_list)
			gen_action(view, 'block', b)
	},
	block: function (who) {
		let target = (game.where === TYRE || game.where === TRIPOLI) ? 1 : 3;
		let die = roll_d6();
		if (die <= target) {
			log("Attrition roll " + DIE_HIT[die] + ".");
			reduce_block(who);
		} else {
			log("Attrition roll " + DIE_MISS[die] + ".");
		}
		remove_from_array(game.attrition_list, who);
		resume_siege_attrition();
	}
}

// FIELD AND SIEGE BATTLE HELPERS

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

function pump_battle_step(is_candidate_attacker, is_candidate_defender) {
	let attacker = game.attacker[game.where];
	let defender = enemy(attacker);

	if (game.jihad === game.where && game.combat_round === 1) {
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
	game.is_field_battle = 1;
	resume_field_battle();
}

function resume_field_battle() {
	// we have a queued up harry action
	if (game.harry) {
		game.active = game.harry;
		game.state = 'harry';
		delete game.harry;
		return;
	}

	game.active = game.attacker[game.where];

	console.log("FIELD BATTLE ATTACKER=", game.attacker[game.where]);

	if (is_friendly_field(game.where)) {
		console.log("FIELD BATTLE WON BY ATTACKER", game.active);
		print_retreat_summary();
		log("Field battle won by " + game.active + ".");
		return goto_regroup();
	}

	if (is_enemy_field(game.where)) {
		game.active = enemy(game.active);
		console.log("FIELD BATTLE WON BY DEFENDER", game.active);
		print_retreat_summary();
		log("Field battle won by " + game.active + ".");
		return goto_regroup();
	}

	if (is_enemy_battle_field()) {
		console.log("ATTACKER ELIMINATED", game.active);
		print_retreat_summary();
		log("Attacking main force was eliminated.");
		return next_combat_round();
	}

	if (is_friendly_battle_field()) {
		console.log("DEFENDER ELIMINATED, SWAP ATTACKER/DEFENDER", game.active);
		print_retreat_summary();
		log("Defending main force was eliminated.");
		log(game.active + " are now the defender.");
		game.attacker[game.where] = enemy(game.active);
		// The new defender takes control of the empty castle
		if (!is_under_siege(game.where))
			game.castle_owner = game.active;
		return next_combat_round();
	}

	game.state = 'field_battle';
	pump_battle_step(is_field_attacker, is_field_defender);
}

states.field_battle = {
	show_battle: true,
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Field Battle: Waiting for " + game.active + ".";
		view.prompt = "Field Battle: Choose a combat action.";
		for (let b of game.battle_list) {
			gen_action(view, 'block', b); // take default action
			gen_action(view, 'fire', b);
			if (game.sallying.includes(b)) {
				// Only sallying forces may withdraw into the castle
				gen_action(view, 'withdraw', b);
			} else {
				if (can_block_retreat(b)) {
					gen_action(view, 'retreat', b);
					// Turcopoles and Nomads can Harry (fire and retreat)
					if (block_type(b) === 'turcopoles' || block_type(b) === 'nomads')
						gen_action(view, 'harry', b);
				}

				// Defender can withdraw into castle if friendly and there is room.
				if (game.active !== game.attacker[game.where] && game.active === game.castle_owner) {
					// TODO: allow swapping place of sallying block, leaving it to die if it cannot withdraw?
					if (game.sallying.length + count_blocks_in_castle(game.where) < castle_limit(game.where))
						gen_action(view, 'withdraw', b);
				}
			}
			// All Frank B blocks are knights who can Charge
			if (block_owner(b) === FRANKS && block_initiative(b) === 'B')
				gen_action(view, 'charge', b);
		}
	},
	block: field_fire_with_block,
	fire: field_fire_with_block,
	withdraw: field_withdraw_with_block,
	charge: charge_with_block,
	harry: harry_with_block,
	retreat: retreat_with_block,
}

// SIEGE BATTLE

function goto_siege_battle() {
	game.attacker[game.where] = besieging_player(game.where);
	console.log("SIEGE BATTLE", game.attacker[game.where]);
	resume_siege_battle();
}

function resume_siege_battle() {
	game.active = game.attacker[game.where];

	if (is_friendly_town(game.where)) {
		console.log("SIEGE BATTLE WON BY ATTACKER", game.active);
		log("Siege battle won by " + game.active + ".");
		return goto_regroup();
	}

	if (is_enemy_town(game.where)) {
		console.log("SIEGE BATTLE WON BY DEFENDER", enemy(game.active));
		game.active = enemy(game.active);
		game.halfhit = null;
		log("Siege battle won by " + game.active + ".");
		return goto_regroup();
	}

	if (game.storming.length === 0) {
		console.log("SIEGE BATTLE WON BY DEFENDER", enemy(game.active));
		game.halfhit = null;
		log("Storming repulsed.");
		return next_combat_round();
	}

	game.state = 'siege_battle';
	pump_battle_step(is_siege_attacker, is_siege_defender);
}

states.siege_battle = {
	show_battle: true,
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Siege Battle: Waiting for " + game.active + ".";
		view.prompt = "Siege Battle: Choose a combat action.";
		for (let b of game.battle_list) {
			gen_action(view, 'block', b); // take default action
			gen_action(view, 'fire', b);
			if (game.storming.includes(b))
				gen_action(view, 'retreat', b);
		}
	},
	block: siege_fire_with_block,
	fire: siege_fire_with_block,
	retreat: siege_withdraw_with_block,
}

// FIELD BATTLE HITS

function goto_field_battle_hits() {
	game.active = enemy(game.active);
	game.battle_list = list_field_victims();
	if (game.battle_list.length === 0)
		resume_field_battle();
	else
		game.state = 'field_battle_hits';
}

function list_field_victims() {
	let max = 0;
	for (let b in BLOCKS)
		if (block_owner(b) === game.active && is_field_combatant(b) && game.steps[b] > max)
			max = game.steps[b];
	let list = [];
	for (let b in BLOCKS)
		if (block_owner(b) === game.active && is_field_combatant(b) && game.steps[b] === max)
			list.push(b);
	return list;
}

states.field_battle_hits = {
	show_battle: true,
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Field Battle: Waiting for " + game.active + " to assign hits.";
		view.prompt = "Field Battle: Assign " + game.hits + (game.hits !== 1 ? " hits" : " hit") + " to your armies.";
		for (let b of game.battle_list) {
			gen_action(view, 'hit', b);
			gen_action(view, 'block', b);
		}
	},
	hit: apply_field_battle_hit,
	block: apply_field_battle_hit,
}

function apply_field_battle_hit(who) {
	if (block_plural(who))
		game.flash = block_name(who) + " take a hit.";
	else
		game.flash = block_name(who) + " takes a hit.";
	reduce_block(who, 'combat');
	game.hits--;
	if (game.hits === 0)
		resume_field_battle();
	else {
		game.battle_list = list_field_victims();
		if (game.battle_list.length === 0)
			resume_field_battle();
		else
			game.flash += " " + game.hits + (game.hits === 1 ? " hit left." : " hits left.");
	}
}

// SIEGE BATTLE HITS

function goto_siege_battle_hits() {
	game.active = enemy(game.active);
	game.battle_list = list_siege_victims();
	if (game.battle_list.length === 0)
		resume_siege_battle();
	else
		game.state = 'siege_battle_hits';
}

function list_siege_victims() {
	if (game.halfhit && block_owner(game.halfhit) === game.active)
		return [ game.halfhit ];
	let max = 0;
	for (let b in BLOCKS)
		if (block_owner(b) === game.active && is_siege_combatant(b) && game.steps[b] > max)
			max = game.steps[b];
	let list = [];
	for (let b in BLOCKS)
		if (block_owner(b) === game.active && is_siege_combatant(b) && game.steps[b] === max)
			list.push(b);
	return list;
}

states.siege_battle_hits = {
	show_battle: true,
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Siege Battle: Waiting for " + game.active + " to assign hits.";
		view.prompt = "Siege Battle: Assign " + game.hits + (game.hits !== 1 ? " hits" : " hit") + " to your armies.";
		for (let b of game.battle_list) {
			gen_action(view, 'hit', b);
			gen_action(view, 'block', b);
		}
	},
	hit: apply_siege_battle_hit,
	block: apply_siege_battle_hit,
}

function apply_siege_battle_hit(who) {
	if (block_plural(who))
		game.flash = block_name(who) + " take a hit.";
	else
		game.flash = block_name(who) + " takes a hit.";
	if (game.halfhit === who) {
		reduce_block(who, 'combat');
		game.halfhit = null;
	} else {
		if (is_block_in_castle(who))
			game.halfhit = who;
		else
			reduce_block(who, 'combat');
	}
	game.hits--;

	if (game.hits === 0) {
		resume_siege_battle();
	} else {
		game.battle_list = list_siege_victims();
		if (game.battle_list.length === 0) {
			resume_siege_battle();
		} else {
			game.flash += " " + game.hits + (game.hits === 1 ? " hit left." : " hits left.");
		}
	}
}

// BATTLE ACTIONS

function roll_attack(active, b, verb, is_charge) {
	game.hits = 0;
	let fire = block_fire_power(b, game.where) + is_charge;
	let rolls = [];
	let steps = game.steps[b];
	let name = block_name(b) + " " + BLOCKS[b].combat;
	let self = 0;
	for (let i = 0; i < steps; ++i) {
		let die = roll_d6();
		if (die <= fire) {
			rolls.push(DIE_HIT[die]);
			++game.hits;
		} else {
			if (is_charge && die === 6) {
				rolls.push(DIE_SELF);
				++self;
			} else {
				rolls.push(DIE_MISS[die]);
			}
		}
	}

	game.flash = name + " " + verb + " " + rolls.join(" ") + " ";
	if (block_plural(b)) {
		if (game.hits === 0)
			game.flash += "and miss.";
		else if (game.hits === 1)
			game.flash += "and score 1 hit.";
		else
			game.flash += "and score " + game.hits + " hits.";
	} else {
		if (game.hits === 0)
			game.flash += "and misses.";
		else if (game.hits === 1)
			game.flash += "and scores 1 hit.";
		else
			game.flash += "and scores " + game.hits + " hits.";
	}

	if (self > 0) {
		if (self === 1)
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
	game.moved[b] = 1;
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

function siege_fire_with_block(b) {
	game.moved[b] = 1;
	if (block_plural(b))
		roll_attack(game.active, b, "fire", 0);
	else
		roll_attack(game.active, b, "fires", 0);
	if (game.hits > 0) {
		goto_siege_battle_hits();
	} else {
		resume_siege_battle();
	}
}

function charge_with_block(b) {
	game.moved[b] = 1;
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
	game.moved[b] = 1;
	remove_from_array(game.sallying, b);
	game.castle.push(b);
	resume_field_battle();
}

function siege_withdraw_with_block(b) {
	if (block_plural(b))
		game.flash = b + " withdraw.";
	else
		game.flash = b + " withdraws.";
	log(game.active[0] + ": " + game.flash);
	game.moved[b] = 1;
	remove_from_array(game.storming, b);
	resume_siege_battle();
}

function harry_with_block(b) {
	game.harry = game.active; // remember to retreat after hits have been applied
	game.who = b;
	if (block_plural(b))
		roll_attack(game.active, b, "harry", 0);
	else
		roll_attack(game.active, b, "harries", 0);
	if (game.hits > 0) {
		goto_field_battle_hits();
	} else {
		resume_field_battle();
	}
}

states.harry = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Field Battle: Waiting for " + game.active + " to retreat the harrying block.";
		view.prompt = "Field Battle: Retreat the harrying block to a friendly or vacant town.";
		for (let to of TOWNS[game.where].exits)
			if (can_block_retreat_to(game.who, to))
				gen_action(view, 'town', to);
	},
	town: function (to) {
		if (block_plural(game.who))
			game.flash += " " + block_name(game.who) + " retreat.";
		else
			game.flash += " " + block_name(game.who) + " retreats.";
		game.summary.push([game.active, to]);
		game.location[game.who] = to;
		move_block(game.who, game.where, to);
		game.who = null;
		resume_field_battle();
	},
}

function retreat_with_block(b) {
	game.who = b;
	game.state = 'retreat_in_battle';
}

states.retreat_in_battle = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Field Battle: Waiting for " + game.active + " to retreat.";
		gen_action(view, 'undo');
		gen_action(view, 'block', game.who);
		view.prompt = "Field Battle: Retreat the block to a friendly or vacant town.";
		for (let to of TOWNS[game.where].exits)
			if (can_block_retreat_to(game.who, to))
				gen_action(view, 'town', to);
	},
	town: function (to) {
		if (block_plural(game.who))
			game.flash = block_name(game.who) + " retreat.";
		else
			game.flash = block_name(game.who) + " retreats.";
		log(game.active[0] + ": " + game.flash);
		game.summary.push([game.active, to]);
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
	if (game.year > 1187 && !is_winter()) {
		game.active = game.p1;
		start_draw_phase();
	} else {
		end_game_turn();
	}
}

function start_draw_phase() {
	game.state = 'draw_phase';
	if (game.active === FRANKS) {
		game.who = select_random_block(F_POOL);
		if (!game.who)
			end_draw_phase();
	} else {
		game.who = select_random_block(S_POOL);
		if (!game.who)
			end_draw_phase();
	}
}

states.draw_phase = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Draw Phase: Waiting for " + game.active + ".";
		gen_action(view, 'next');
		switch (block_type(game.who)) {
		case 'crusaders':
			view.prompt = "Draw Phase: Place " + block_name(game.who) + " in the staging area.";
			gen_action(view, 'town', block_home(game.who));
			break;
		case 'pilgrims':
			view.prompt = "Draw Phase: Place " + block_name(game.who) + " in a friendly port.";
			for (let town in TOWNS)
				if (is_friendly_port(town) || can_enter_besieged_port(town))
					gen_action(view, 'town', town);
			break;
		case 'turcopoles':
		case 'outremers':
		case 'emirs':
		case 'nomads':
			view.prompt = "Draw Phase: Place " + BLOCKS[game.who].name + " at full strength in "
				+ list_seats(game.who).join(", ") + " or at strength 1 in any friendly town.";
			for (let town in TOWNS) {
				if (town === ENGLAND || town === FRANCE || town === GERMANIA)
					continue;
				// FAQ claims besieger controls town for draw purposes
				if (is_friendly_field(town))
					gen_action(view, 'town', town);
			}
			break;
		}
	},
	town: function (where) {
		let type = block_type(game.who);

		log(game.active + " place drawn block in " + where + ".");

		game.location[game.who] = where;
		if (type === 'outremers' || type === 'emirs' || type === 'nomads') {
			console.log("DRAW", type, where, game.who, is_home_seat(where, game.who));
			if (is_home_seat(where, game.who))
				game.steps[game.who] = block_max_steps(game.who);
			else
				game.steps[game.who] = 1;
		} else {
			game.steps[game.who] = block_max_steps(game.who);
		}

		game.who = null;
		end_draw_phase();
	},
	next: function () {
		end_draw_phase();
	},
}

function end_draw_phase() {
	if (game.active === game.p1) {
		game.active = game.p2;
		start_draw_phase();
	} else {
		end_game_turn();
	}
}

function end_game_turn() {
	count_victory_points();
	if (is_winter()) {
		goto_winter_1();
	} else {
		if (check_sudden_death())
			return;
		game.turn ++;
		start_game_turn();
	}
}

// WINTER SUPPLY

function goto_winter_1() {
	log("");
	log("Start Winter of " + game.year + ".");
	if (game.winter_campaign)
		winter_siege_attrition();
	else
		goto_winter_2();
}

function winter_siege_attrition() {
	log(game.active + " winter campaign in " + game.winter_campaign + ".");
	game.where = game.winter_campaign;

	let target = (game.where === TYRE || game.where === TRIPOLI) ? 2 : 4;
	for (let b in BLOCKS) {
		if (is_block_in_castle_in(b, game.where)) {
			let die = roll_d6();
			if (die <= target) {
				log("Attrition roll " + DIE_HIT[die] + ".");
				reduce_block(b);
			} else {
				log("Attrition roll " + DIE_MISS[die] + ".");
			}
		}
	}

	if (!is_under_siege(game.where)) {
		log(game.where + " falls to siege attrition.");
		goto_regroup();
	} else {
		log("Siege continues.");
		game.where = null;
		goto_winter_2();
	}
}

function goto_winter_2() {
	eliminate_besieging_blocks(FRANKS);
	eliminate_besieging_blocks(SARACENS);
	lift_all_sieges();
	if (check_sudden_death())
		return;
	if (game.year === 1192)
		return goto_year_end();
	goto_winter_supply();
}

function eliminate_besieging_blocks(owner) {
	game.summary = [];
	for (let b in BLOCKS) {
		if (block_owner(b) === owner) {
			let where = game.location[b];
			if (where === game.winter_campaign)
				continue;
			if (is_block_on_land(b) && is_under_siege(where))
				if (block_owner(b) === besieging_player(where))
					disband(b);
		}
	}
	if (game.summary.length > 0)
		print_summary(owner + " disband sieges:");
	else
		game.summary = null;
}

function need_winter_supply_check() {
	for (let town in TOWNS) {
		if (town === game.winter_campaign)
			continue;
		if (is_friendly_town(town) && !is_within_castle_limit(town))
			return true;
	}
	return false;
}

function goto_winter_supply() {
	game.active = FRANKS;
	if (need_winter_supply_check()) {
		game.state = 'winter_supply';
		game.summary = [];
	} else {
		game.active = SARACENS;
		if (need_winter_supply_check()) {
			game.state = 'winter_supply';
			game.summary = [];
		} else {
			game.active = FRANKS;
			goto_winter_replacements();
		}
	}
}

states.winter_supply = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Winter Supply: Waiting for " + game.active + ".";
		gen_action_undo(view);
		let okay_to_end = true;
		for (let b in BLOCKS) {
			if (block_owner(b) === game.active) {
				if (is_block_on_land(b)) {
					let where = game.location[b];
					if (where === game.winter_campaign)
						continue;
					if (!is_within_castle_limit(where)) {
						gen_action(view, 'block', b);
						okay_to_end = false;
					}
				}
			}
		}
		if (okay_to_end) {
			view.prompt = "Winter Supply: Disband excess blocks \u2014 done.";
			gen_action(view, 'next');
		} else {
			view.prompt = "Winter Supply: Disband excess blocks.";
		}
	},
	block: function (who) {
		push_undo();
		disband(who);
	},
	next: function () {
		clear_undo();
		if (game.summary.length > 0)
			print_summary(game.active + " disband:");
		if (game.active === FRANKS) {
			game.active = SARACENS;
			game.summary = [];
		} else {
			game.active = FRANKS;
			goto_winter_replacements();
		}
	},
	undo: pop_undo
}

// WINTER REPLACEMENTS

function goto_winter_replacements() {
	game.rp = {};

	for (let town in TOWNS)
		if (is_under_siege(town))
			game.rp[town] = 0;
		else
			game.rp[town] = castle_limit(town);

	game.summary = [];
	game.state = 'winter_replacements';
}

function replacement_cost(where) {
	let region = TOWNS[where].region;
	if (KINGDOMS[region] === game.active)
		return 1;
	return 2;
}

states.winter_replacements = {
	prompt: function (view, current) {
		if (is_inactive_player(current))
			return view.prompt = "Winter Replacements: Waiting for " + game.active + ".";
		view.prompt = "Winter Replacements: Distribute replacement points.";
		gen_action_undo(view);
		let okay_to_end = true;
		for (let b in BLOCKS) {
			if (block_owner(b) === game.active && is_block_on_land(b)) {
				let where = game.location[b];
				let cost = replacement_cost(where);
				if (is_friendly_town(where) && game.rp[where] >= cost) {
					if (game.steps[b] < block_max_steps(b)) {
						gen_action(view, 'block', b);
						okay_to_end = false;
					}
				}
			}
		}
		if (okay_to_end) {
			view.prompt = "Winter Replacements: Distribute replacement points \u2014 done.";
			gen_action(view, 'next');
		} else {
			view.prompt = "Winter Replacements: Distribute replacement points.";
		}
	},
	block: function (who) {
		let where = game.location[who];
		let cost = replacement_cost(where);
		push_undo();
		game.summary.push([where]);
		game.steps[who] ++;
		game.rp[where] -= cost;
	},
	next: function () {
		clear_undo();
		end_winter_replacements();
	},
	undo: pop_undo
}

function end_winter_replacements() {
	print_summary(active_adjective() + " replacements:");
	if (game.active === FRANKS) {
		game.active = SARACENS;
		game.summary = [];
	} else {
		goto_year_end();
	}
}

function goto_year_end() {
	if (game.year === 1192) {
		game.state = 'game_over';
		if (game.f_vp > game.s_vp) {
			game.result = FRANKS;
			game.victory = "Franks win!";
		} else if (game.f_vp < game.s_vp) {
			game.victory = "Saracens win!";
			game.result = SARACENS;
		} else {
			game.victory = "The game is a draw.";
			game.result = null;
		}
		return;
	}

	// Return eliminated blocks to pool.
	for (let b in BLOCKS)
		if (game.location[b] === DEAD)
			game.location[b] = block_pool(b);

	game.year ++;
	start_year();
}

// GAME OVER

states.game_over = {
	prompt: function (view) {
		view.prompt = game.victory;
	}
}

// SETUP

function setup_game() {
	reset_blocks();
	game.year = 1187;
	game.turn = 0;
	for (let b in BLOCKS) {
		if (block_owner(b) === FRANKS) {
			switch (block_type(b)) {
			case 'pilgrims':
				deploy(b, block_pool(b));
				break;
			case 'crusaders':
				deploy(b, block_pool(b));
				break;
			default:
				deploy(b, block_home(b));
				break;
			}
		}
		if (block_owner(b) === SARACENS) {
			if (block_type(b) === 'emirs')
				deploy(b, block_home(b));
			if (block_type(b) === 'nomads')
				deploy(b, block_pool(b));
		}
		if (block_owner(b) === ASSASSINS) {
			deploy(b, block_home(b));
		}
	}
	count_victory_points();
	goto_frank_deployment();
}

// VIEW

function make_battle_view() {
	let is_storming = game.storming.length > 0 && game.state !== 'declare_storm';
	let is_sallying = game.sallying.length > 0 && game.state !== 'declare_sally';
	let is_field_battle = game.is_field_battle;

	let battle = {
		FR: [], FC: [], FF: [],
		SR: [], SC: [], SF: [],
		FCS: (game.castle_owner === FRANKS) ? castle_limit(game.where) : 0,
		SCS: (game.castle_owner === SARACENS) ? castle_limit(game.where) : 0,
		storming: game.storming,
		sallying: game.sallying,
		halfhit: game.halfhit,
		flash: game.flash,
		round: game.combat_round,
		show_castle: is_storming,
		show_field: is_field_battle || is_sallying,
	};

	if (is_under_siege(game.where) && !is_contested_battle_field(game.where))
		battle.title = enemy(game.castle_owner) + " besiege " + game.where;
	else
		battle.title = game.attacker[game.where] + " attack " + game.where;
	if (game.combat_round === 0)
		battle.title += " \u2014 Combat Deployment";
	else
		battle.title += " \u2014 Round " + game.combat_round + " of 3";
	if (game.where === game.jihad) {
		battle.jihad = game.attacker[game.where];
		battle.title += " \u2014 Jihad!";
	}

	function fill_cell(cell, owner, fn) {
		for (let b in BLOCKS)
			if (game.location[b] === game.where & block_owner(b) === owner && fn(b))
				cell.push(b)
		// cell.sort((a,b) => compare_block_initiative(a[0], b[0]));
	}

	fill_cell(battle.FR, FRANKS, b => is_reserve(b));
	fill_cell(battle.FC, FRANKS, b => is_block_in_castle(b));
	fill_cell(battle.FF, FRANKS, b => is_block_in_field(b) && !game.storming.includes(b));
	fill_cell(battle.FF, SARACENS, b => is_block_in_field(b) && game.storming.includes(b));
	fill_cell(battle.SF, FRANKS, b => is_block_in_field(b) && game.storming.includes(b));
	fill_cell(battle.SF, SARACENS, b => is_block_in_field(b) && !game.storming.includes(b));
	fill_cell(battle.SC, SARACENS, b => is_block_in_castle(b));
	fill_cell(battle.SR, SARACENS, b => is_reserve(b));

	return battle;
}

exports.ready = function (scenario, players) {
	return players.length === 2;
}

exports.setup = function (scenario) {
	game = {
		s_hand: [],
		f_hand: [],
		s_card: 0,
		f_card: 0,
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
		game.result = enemy(current);
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
		p1: game.p1,
		f_vp: game.f_vp,
		s_vp: game.s_vp,
		f_card: (game.show_cards || current === FRANKS) ? game.f_card : 0,
		s_card: (game.show_cards || current === SARACENS) ? game.s_card : 0,
		hand: (current === FRANKS) ? game.f_hand : (current === SARACENS) ? game.s_hand : [],
		who: (game.active === current) ? game.who : null,
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

	if (game.jihad && game.jihad !== game.p1)
		view.jihad = game.jihad;
	if (game.winter_campaign && game.winter_campaign !== game.p1 && game.winter_campaign !== game.p2)
		view.winter_campaign = game.winter_campaign;

	states[game.state].prompt(view, current);

	if (states[game.state].show_battle)
		view.battle = make_battle_view();

	return view;
}
