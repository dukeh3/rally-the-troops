"use strict";

const FRANK = "Frank";
const SARACEN = "Saracen";
const ASSASSINS = "Assassins";
const ENEMY = { Saracen: "Frank", Frank: "Saracen" }
const POOL = "Pool";

function toggle_blocks() {
	document.getElementById("map").classList.toggle("hide_blocks");
}

let map_orientation = window.localStorage['crusader-rex/map-orientation'] || 'tall';

function tall_map() {
	map_orientation = 'tall';
	document.querySelector(".map").classList.remove("wide");
	document.querySelector(".map").classList.add("tall");
	window.localStorage['crusader-rex/map-orientation'] = map_orientation;
	update_map_layout();
	update_map();
	zoom_map();
}

function wide_map() {
	map_orientation = 'wide';
	document.querySelector(".map").classList.add("wide");
	document.querySelector(".map").classList.remove("tall");
	window.localStorage['crusader-rex/map-orientation'] = map_orientation;
	update_map_layout();
	update_map();
	zoom_map();
}

let game = null;

let ui = {
	cards: {},
	towns: {},
	known: {},
	secret: { Frank: {}, Saracen: {}, Assassins: {} },
	battle_menu: {},
	battle_block: {},
	present: new Set(),
}

function on_focus_town(evt) {
	let where = evt.target.town;
	let text = where;
	document.getElementById("status").textContent = text;
}

function on_blur_town(evt) {
	document.getElementById("status").textContent = "";
}

function on_click_town(evt) {
	let where = evt.target.town;
	if (game.actions && game.actions.town && game.actions.town.includes(where))
		socket.emit('action', 'town', where);
}

const STEP_TEXT = [ 0, "I", "II", "III", "IIII" ];
const HEIR_TEXT = [ 0, '\u00b9', '\u00b2', '\u00b3', '\u2074', '\u2075' ];

function block_name(who) { return BLOCKS[who].name; }
function block_home(who) { return BLOCKS[who].home; }
function block_owner(who) { return BLOCKS[who].owner; }

function on_focus_secret_block(evt) {
	let owner = evt.target.owner;
	let text = owner;
	document.getElementById("status").textContent = text;
}

function on_blur_secret_block(evt) {
	document.getElementById("status").textContent = "";
}

function on_click_secret_block(evt) {
}

function on_focus_map_block(evt) {
	let b = evt.target.block;
	let s = game.known[b][1];
	let text = block_name(b) + " (" + block_home(b) + ") ";
	if (BLOCKS[b].move)
		text += BLOCKS[b].move + "-";
	text += STEP_TEXT[s] + "-" + BLOCKS[b].combat;
	document.getElementById("status").textContent = text;
}

function on_blur_map_block(evt) {
	document.getElementById("status").textContent = "";
}

function on_click_map_block(evt) {
	let b = evt.target.block;
	if (game.actions && game.actions.block && game.actions.block.includes(b))
		socket.emit('action', 'block', b);
}

function is_battle_reserve(who, list) {
	for (let [b, s, m] of list)
		if (who == b)
			return true;
	return false;
}

function on_focus_battle_block(evt) {
	let b = evt.target.block;
	let msg = block_name(b);
	if (is_battle_reserve(b, game.battle.FR))
		msg = "Frank Reserve";
	if (is_battle_reserve(b, game.battle.SR))
		msg = "Saracen Reserve";

	if (game.actions && game.actions.battle_fire && game.actions.battle_fire.includes(b))
		msg = "Fire with " + msg;
	else if (game.actions && game.actions.battle_retreat && game.actions.battle_retreat.includes(b))
		msg = "Retreat with " + msg;
	else if (game.actions && game.actions.battle_hit && game.actions.battle_hit.includes(b))
		msg = "Take hit on " + msg;

	document.getElementById("status").textContent = msg;
}

function on_blur_battle_block(evt) {
	document.getElementById("status").textContent = "";
}

function on_click_battle_block(evt) {
	let b = evt.target.block;
	if (game.actions && game.actions.block && game.actions.block.includes(b))
		socket.emit('action', 'block', b);
}

function on_focus_battle_fire(evt) {
	document.getElementById("status").textContent =
		"Fire with " + block_name(evt.target.block);
}

function on_focus_battle_retreat(evt) {
	document.getElementById("status").textContent =
		"Retreat with " + block_name(evt.target.block);
}

function on_focus_battle_harry(evt) {
	document.getElementById("status").textContent =
		"Harry with " + block_name(evt.target.block);
}

function on_focus_battle_charge(evt) {
	document.getElementById("status").textContent =
		"Charge with " + block_name(evt.target.block);
}

function on_focus_battle_hit(evt) {
	document.getElementById("status").textContent =
		"Take hit on " + block_name(evt.target.block);
}

function on_blur_battle_button(evt) {
	document.getElementById("status").textContent = "";
}

function on_click_battle_hit(evt) { socket.emit('action', 'battle_hit', evt.target.block); }
function on_click_battle_fire(evt) { socket.emit('action', 'battle_fire', evt.target.block); }
function on_click_battle_retreat(evt) { socket.emit('action', 'battle_retreat', evt.target.block); }
function on_click_battle_charge(evt) { socket.emit('action', 'battle_charge', evt.target.block); }
function on_click_battle_harry(evt) { socket.emit('action', 'battle_harry', evt.target.block); }

function on_click_card(evt) {
	let c = evt.target.id.split("+")[1] | 0;
	if (game.actions && game.actions.play && game.actions.play.includes(c))
		socket.emit('action', 'play', c);
}

function on_button_undo(evt) { send_action('undo'); }
function on_button_pass(evt) { send_action('pass'); }
function on_button_sea_move(evt) { send_action('sea_move'); }
function on_button_group_move(evt) { send_action('group_move'); }
function on_button_muster(evt) { send_action('muster'); }
function on_button_end_muster(evt) { send_action('end_muster'); }
function on_button_end_move_phase(evt) { send_action('end_move_phase'); }
function on_button_end_regroup(evt) { send_action('end_regroup'); }
function on_button_end_retreat(evt) { send_action('end_retreat'); }
function on_button_eliminate(evt) { send_action('eliminate'); }

function build_battle_button(menu, b, c, click, enter, img_src) {
	let img = new Image();
	img.draggable = false;
	img.classList.add("action");
	img.classList.add(c);
	img.setAttribute("src", img_src);
	img.addEventListener("click", click);
	img.addEventListener("mouseenter", enter);
	img.addEventListener("mouseleave", on_blur_battle_button);
	img.block = b;
	menu.appendChild(img);
}

function build_battle_block(b, block) {
	let element = document.createElement("div");
	element.classList.add("block");
	element.classList.add("known");
	element.classList.add(BLOCKS[b].owner);
	element.classList.add("block_" + block.image);
	element.addEventListener("mouseenter", on_focus_battle_block);
	element.addEventListener("mouseleave", on_blur_battle_block);
	element.addEventListener("click", on_click_battle_block);
	element.block = b;
	ui.battle_block[b] = element;

	let menu_list = document.createElement("div");
	menu_list.classList.add("battle_menu_list");

	build_battle_button(menu_list, b, "hit",
		on_click_battle_hit, on_focus_battle_hit,
		"/images/cross-mark.svg");
	build_battle_button(menu_list, b, "charge",
		on_click_battle_charge, on_focus_battle_charge,
		"/images/mounted-knight.svg");
	build_battle_button(menu_list, b, "fire",
		on_click_battle_fire, on_focus_battle_fire,
		"/images/pointy-sword.svg");
	build_battle_button(menu_list, b, "harry",
		on_click_battle_harry, on_focus_battle_harry,
		"/images/arrow-flights.svg");
	build_battle_button(menu_list, b, "retreat",
		on_click_battle_retreat, on_focus_battle_retreat,
		"/images/flying-flag.svg");

	let menu = document.createElement("div");
	menu.classList.add("battle_menu");
	menu.appendChild(element);
	menu.appendChild(menu_list);
	ui.battle_menu[b] = menu;
}

function build_known_block(b, block) {
	let element = document.createElement("div");
	element.classList.add("block");
	element.classList.add("known");
	element.classList.add(BLOCKS[b].owner);
	element.classList.add("block_" + block.image);
	element.addEventListener("mouseenter", on_focus_map_block);
	element.addEventListener("mouseleave", on_blur_map_block);
	element.addEventListener("click", on_click_map_block);
	element.block = b;
	return element;
}

function build_secret_block(b, block) {
	let element = document.createElement("div");
	element.classList.add("block");
	element.classList.add("secret");
	element.classList.add(BLOCKS[b].owner);
	element.addEventListener("mouseenter", on_focus_secret_block);
	element.addEventListener("mouseleave", on_blur_secret_block);
	element.addEventListener("click", on_click_secret_block);
	element.owner = BLOCKS[b].owner;
	return element;
}

/*
let MAP_OFFSET_X = 30;
let MAP_OFFSET_Y = 30;
let MAP_HEIGHT = 1215;
*/
let MAP_OFFSET_X = 0;
let MAP_OFFSET_Y = 0;
let MAP_HEIGHT = 1275;

function town_x(t) {
	if (map_orientation == 'tall')
		return TOWNS[t].x - MAP_OFFSET_X;
	else
		return TOWNS[t].y - MAP_OFFSET_Y;
}

function town_y(t) {
	if (map_orientation == 'tall')
		return TOWNS[t].y - MAP_OFFSET_Y;
	else
		return MAP_HEIGHT - TOWNS[t].x + MAP_OFFSET_X;
}

function flip_x(x, y) {
	if (map_orientation == 'tall')
		return x - MAP_OFFSET_X;
	else
		return y - MAP_OFFSET_Y;
}

function flip_y(x, y) {
	if (map_orientation == 'tall')
		return y - MAP_OFFSET_Y;
	else
		return MAP_HEIGHT - x + MAP_OFFSET_X;
}

function build_town(t, town) {
	let element = document.createElement("div");
	element.town = t;
	element.classList.add("town");
	element.addEventListener("mouseenter", on_focus_town);
	element.addEventListener("mouseleave", on_blur_town);
	element.addEventListener("click", on_click_town);
	ui.towns_element.appendChild(element);
	return element;
}

function update_map_layout() {
	for (let t in TOWNS) {
		let element = ui.towns[t];
		element.style.left = (town_x(t) - 35) + "px";
		element.style.top = (town_y(t) - 35) + "px";
	}
}

function build_map() {
	let element;

	ui.blocks_element = document.getElementById("blocks");
	ui.offmap_element = document.getElementById("offmap");
	ui.towns_element = document.getElementById("towns");

	for (let c = 1; c <= 27; ++c) {
		ui.cards[c] = document.getElementById("card+"+c);
		ui.cards[c].addEventListener("click", on_click_card);
	}

	for (let name in TOWNS) {
		let town = TOWNS[name];
		ui.towns[name] = build_town(name, town);
		ui.secret.Frank[name] = [];
		ui.secret.Saracen[name] = [];
		ui.secret.Assassins[name] = [];
	}
	ui.secret.Frank.offmap = [];
	ui.secret.Saracen.offmap = [];
	ui.secret.Assassins.offmap = [];

	for (let b in BLOCKS) {
		let block = BLOCKS[b];
		build_battle_block(b, block);
		ui.known[b] = build_known_block(b, block);
		ui.secret[BLOCKS[b].owner].offmap.push(build_secret_block(b, block));
	}

	update_map_layout();
}

function update_steps(b, steps, element) {
	element.classList.remove("r1");
	element.classList.remove("r2");
	element.classList.remove("r3");
	element.classList.add("r"+(BLOCKS[b].steps - steps));
}

function layout_blocks(town, secret, known) {
	let wrap = TOWNS[town].wrap;
	let s = secret.length;
	let k = known.length;
	let n = s + k;
	let row, rows = [];
	let i = 0;

	function new_line() {
		rows.push(row = []);
		i = 0;
	}

	new_line();

	while (secret.length > 0) {
		if (i == wrap)
			new_line();
		row.push(secret.shift());
		++i;
	}

	// Break early if secret and known fit in exactly two rows, and more than three blocks total
	if (s > 0 && s <= wrap && k > 0 && k <= wrap && n > 3)
		new_line();

	while (known.length > 0) {
		if (i == wrap)
			new_line();
		row.push(known.shift());
		++i;
	}

	if (TOWNS[town].layout_minor > 0.5)
		rows.reverse();

	for (let j = 0; j < rows.length; ++j)
		for (i = 0; i < rows[j].length; ++i)
			position_block(town, j, rows.length, i, rows[j].length, rows[j][i]);
}

function position_block(town, row, n_rows, col, n_cols, element) {
	let space = TOWNS[town];
	let block_size = 60+6;
	let padding = 4;
	let offset = block_size + padding;
	let row_size = (n_rows-1) * offset;
	let col_size = (n_cols-1) * offset;
	let x = space.x;
	let y = space.y;

	if (space.layout_axis == 'X') {
		x -= col_size * space.layout_major;
		y -= row_size * space.layout_minor;
		x += col * offset;
		y += row * offset;
	} else {
		y -= col_size * space.layout_major;
		x -= row_size * space.layout_minor;
		y += col * offset;
		x += row * offset;
	}

	element.style.left = ((flip_x(x,y) - block_size/2)|0)+"px";
	element.style.top = ((flip_y(x,y) - block_size/2)|0)+"px";
}

function show_block(element) {
	if (element.parentElement != ui.blocks_element)
		ui.blocks_element.appendChild(element);
}

function hide_block(element) {
	if (element.parentElement != ui.offmap_element)
		ui.offmap_element.appendChild(element);
}

function show_block(element) {
	if (element.parentElement != ui.blocks_element)
		ui.blocks_element.appendChild(element);
}

function hide_block(element) {
	if (element.parentElement != ui.offmap_element)
		ui.offmap_element.appendChild(element);
}

function update_map() {
	let overflow = { Frank: [], Saracen: [], Assassins: [] };
	let layout = {};

	document.getElementById("turn").textContent = "Year " + game.year + " (" + (game.year-1186) + "/6)" ;

	for (let town in TOWNS)
		layout[town] = { secret: [], known: [] };

	// Move secret blocks to overflow queue if there are too many in a town
	for (let town in TOWNS) {
		for (let color of [FRANK, SARACEN, ASSASSINS]) {
			if (game.secret[color]) {
				let max = game.secret[color][town] ? game.secret[color][town][0] : 0;
				while (ui.secret[color][town].length > max) {
					overflow[color].push(ui.secret[color][town].pop());
				}
			}
		}
	}

	// Add secret blocks if there are too few in a location
	for (let town in TOWNS) {
		for (let color of [FRANK, SARACEN, ASSASSINS]) {
			if (game.secret[color]) {
				let max = game.secret[color][town] ? game.secret[color][town][0] : 0;
				while (ui.secret[color][town].length < max) {
					if (overflow[color].length > 0) {
						ui.secret[color][town].push(overflow[color].pop());
					} else {
						let element = ui.secret[color].offmap.pop();
						show_block(element);
						ui.secret[color][town].push(element);
					}
				}
			}
		}
	}

	// Remove any blocks left in the overflow queue
	for (let color of [FRANK, SARACEN, ASSASSINS]) {
		while (overflow[color].length > 0) {
			let element = overflow[color].pop();
			hide_block(element);
			ui.secret[color].offmap.push(element);
		}
	}

	// Hide formerly known blocks
	for (let b in BLOCKS) {
		if (!(b in game.known)) {
			hide_block(ui.known[b]);
		}
	}

	// Add secret blocks to layout
	for (let town in TOWNS) {
		for (let color of [FRANK, SARACEN, ASSASSINS]) {
			let i = 0, n = 0, m = 0;
			if (game.secret[color] && game.secret[color][town]) {
				n = game.secret[color][town][0];
				m = game.secret[color][town][1];
			}
			for (let element of ui.secret[color][town]) {
				if (i++ < n - m)
					element.classList.remove("moved");
				else
					element.classList.add("moved");
				layout[town].secret.push(element);
			}
		}
	}

	// Add known blocks to layout
	for (let b in game.known) {
		let town = game.known[b][0];
		if (town) {
			let steps = game.known[b][1];
			let moved = game.known[b][2];
			let element = ui.known[b];

			show_block(element);
			layout[town].known.push(element);
			update_steps(b, steps, element);

			if (moved)
				element.classList.add("moved");
			else
				element.classList.remove("moved");
		}
	}

	// Layout blocks on map
	for (let town in TOWNS)
		layout_blocks(town, layout[town].secret, layout[town].known);

	for (let where in TOWNS) {
		if (ui.towns[where]) {
			ui.towns[where].classList.remove('highlight');
			ui.towns[where].classList.remove('where');
		}
	}
	if (game.actions && game.actions.town)
		for (let where of game.actions.town)
			ui.towns[where].classList.add('highlight');
	if (game.where)
		ui.towns[game.where].classList.add('where');

	for (let b in BLOCKS) {
		ui.known[b].classList.remove('highlight');
		ui.known[b].classList.remove('selected');
	}
	if (!game.battle) {
		if (game.actions && game.actions.block)
			for (let b of game.actions.block)
				ui.known[b].classList.add('highlight');
		if (game.who)
			ui.known[game.who].classList.add('selected');
	}
}

function update_cards() {
	let cards = game.hand;
	for (let c = 1; c <= 27; ++c) {
		ui.cards[c].classList.remove('enabled');
		if (cards && cards.includes(c))
			ui.cards[c].classList.add('show');
		else
			ui.cards[c].classList.remove('show');
	}

	if (game.actions && game.actions.play) {
		for (let c of game.actions.play)
			ui.cards[c].classList.add('enabled');
	}

	if (!game.f_card)
		document.querySelector("#frank_card").className = "small_card card_back";
	else
		document.querySelector("#frank_card").className = "small_card " + CARDS[game.f_card].image;
	if (!game.s_card)
		document.querySelector("#saracen_card").className = "small_card card_back";
	else
		document.querySelector("#saracen_card").className = "small_card " + CARDS[game.s_card].image;
}

function update_battle() {
	function fill_cell(name, list, reserve) {
		let cell = window[name];

		ui.present.clear();

		for (let [block, steps, moved] of list) {
			ui.present.add(block);

			if (block == game.who)
				ui.battle_block[block].classList.add("selected");
			else
				ui.battle_block[block].classList.remove("selected");

			ui.battle_block[block].classList.remove("highlight");
			ui.battle_menu[block].classList.remove('hit');
			ui.battle_menu[block].classList.remove('charge');
			ui.battle_menu[block].classList.remove('fire');
			ui.battle_menu[block].classList.remove('harry');
			ui.battle_menu[block].classList.remove('retreat');

			if (game.actions && game.actions.block && game.actions.block.includes(block))
				ui.battle_block[block].classList.add("highlight");
			if (game.actions && game.actions.battle_fire && game.actions.battle_fire.includes(block))
				ui.battle_menu[block].classList.add('fire');
			if (game.actions && game.actions.battle_retreat && game.actions.battle_retreat.includes(block))
				ui.battle_menu[block].classList.add('retreat');
			if (game.actions && game.actions.battle_harry && game.actions.battle_harry.includes(block))
				ui.battle_menu[block].classList.add('harry');
			if (game.actions && game.actions.battle_charge && game.actions.battle_charge.includes(block))
				ui.battle_menu[block].classList.add('charge');
			if (game.actions && game.actions.battle_hit && game.actions.battle_hit.includes(block))
				ui.battle_menu[block].classList.add('hit');
			if (game.actions && game.actions.battle_charge && game.actions.battle_charge.includes(block))
				ui.battle_menu[block].classList.add('charge');
			if (game.actions && game.actions.battle_treachery && game.actions.battle_treachery.includes(block))
				ui.battle_menu[block].classList.add('treachery');

			update_steps(block, steps, ui.battle_block[block], false);
			if (reserve)
				ui.battle_block[block].classList.add("secret");
			else
				ui.battle_block[block].classList.remove("secret");
			if (moved)
				ui.battle_block[block].classList.add("moved");
			else
				ui.battle_block[block].classList.remove("moved");
			if (reserve)
				ui.battle_block[block].classList.remove("known");
			else
				ui.battle_block[block].classList.add("known");
		}

		for (let b in BLOCKS) {
			if (ui.present.has(b)) {
				if (!cell.contains(ui.battle_menu[b]))
					cell.appendChild(ui.battle_menu[b]);
			} else {
				if (cell.contains(ui.battle_menu[b]))
					cell.removeChild(ui.battle_menu[b]);
			}
		}
	}

	if (ui.player == FRANK) {
		fill_cell("FR", game.battle.FR, true);
		fill_cell("FA", game.battle.FA, false);
		fill_cell("FB", game.battle.FB, false);
		fill_cell("FC", game.battle.FC, false);
		fill_cell("EA", game.battle.SA, false);
		fill_cell("EB", game.battle.SB, false);
		fill_cell("EC", game.battle.SC, false);
		fill_cell("ER", game.battle.SR, true);
	} else {
		fill_cell("ER", game.battle.FR, true);
		fill_cell("EA", game.battle.FA, false);
		fill_cell("EB", game.battle.FB, false);
		fill_cell("EC", game.battle.FC, false);
		fill_cell("FA", game.battle.SA, false);
		fill_cell("FB", game.battle.SB, false);
		fill_cell("FC", game.battle.SC, false);
		fill_cell("FR", game.battle.SR, true);
	}
}

function on_update(state, player) {
	game = state;

	show_action_button("#pass_button", "pass");
	show_action_button("#undo_button", "undo");
	show_action_button("#group_move_button", "group_move");
	show_action_button("#sea_move_button", "sea_move");
	show_action_button("#muster_button", "muster");
	show_action_button("#end_muster_button", "end_muster");
	show_action_button("#end_move_phase_button", "end_move_phase");
	show_action_button("#end_regroup_button", "end_regroup");
	show_action_button("#end_retreat_button", "end_retreat");
	show_action_button("#eliminate_button", "eliminate");

	document.getElementById("frank_vp").textContent = game.f_vp;
	document.getElementById("saracen_vp").textContent = game.s_vp;

	update_cards();
	update_map();

	if (game.battle) {
		document.querySelector(".battle_header").textContent = game.battle.title;
		document.querySelector(".battle_message").textContent = game.battle.flash;
		document.querySelector(".battle").classList.add("show");
		update_battle(player);
	} else {
		document.querySelector(".battle").classList.remove("show");
	}
}

build_map();

document.querySelector(".map").classList.add(map_orientation);

drag_element_with_mouse(".battle", ".battle_header");
scroll_with_middle_mouse(".grid_center", 3);
init_map_zoom();
init_shift_zoom();
init_client(["Frank", "Saracen"]);
