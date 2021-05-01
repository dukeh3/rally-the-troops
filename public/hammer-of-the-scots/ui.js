"use strict";

const ENGLAND = "England";
const SCOTLAND = "Scotland";
const ENEMY = { Scotland: "England", England: "Scotland" }
const ENGLAND_BAG = "E. Bag";
const SCOTLAND_BAG = "S. Bag";

const NOBLES = [
	"Angus", "Argyll", "Atholl", "Bruce", "Buchan", "Comyn", "Dunbar",
	"Galloway", "Lennox", "Mar", "Mentieth", "Ross", "Steward"
];

let block_style = window.localStorage['hammer-of-the-scots/block-style'] || 'oldblocks';
document.querySelector("body").classList.remove("oldblocks");
document.querySelector("body").classList.remove("newblocks");
document.querySelector("body").classList.add(block_style);

function old_block_style() {
	block_style = 'oldblocks';
	document.querySelector("body").classList.remove("oldblocks");
	document.querySelector("body").classList.remove("newblocks");
	document.querySelector("body").classList.add(block_style);
	window.localStorage['hammer-of-the-scots/block-style'] = block_style;
	update_map();
}

function new_block_style() {
	block_style = 'newblocks';
	document.querySelector("body").classList.remove("oldblocks");
	document.querySelector("body").classList.remove("newblocks");
	document.querySelector("body").classList.add(block_style);
	window.localStorage['hammer-of-the-scots/block-style'] = block_style;
	update_map();
}

function toggle_blocks() {
	document.getElementById("map").classList.toggle("hide_blocks");
}

let game = null;

let ui = {
	cards: {},
	areas: {},
	known: {},
	secret: { England: {}, Scotland: {} },
	battle_menu: {},
	battle_block: {},
	present: new Set(),
}

function on_focus_area(evt) {
	let where = evt.target.area;
	document.getElementById("status").textContent = where;
}

function on_blur_area(evt) {
	document.getElementById("status").textContent = "";
}

function on_click_area(evt) {
	let where = evt.target.area;
	send_action('area', where);
}

const STEP_TEXT = [ 0, "I", "II", "III", "IIII" ];

function block_name(who) {
	if (who == "Edward")
		return game.edward == 1 ? "Edward I" : "Edward II";
	if (who == "King")
		return "Scottish King";
	return BLOCKS[who].name;
}

function on_focus_secret_block(evt) {
	let owner = evt.target.owner;
	let text = (owner == ENGLAND) ? "English" : "Scottish";
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
	let text = block_name(b);
	text += " " + BLOCKS[b].move + "-" + STEP_TEXT[s] + "-" + BLOCKS[b].combat;
	if (BLOCKS[b].mortal)
		text += ' \u271d';
	document.getElementById("status").textContent = text;
}

function on_blur_map_block(evt) {
	document.getElementById("status").textContent = "";
}

function on_click_map_block(evt) {
	let b = evt.target.block;
	send_action('block', b);
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
	if (is_battle_reserve(b, game.battle.ER))
		msg = "English Reserve";
	if (is_battle_reserve(b, game.battle.SR))
		msg = "Scottish Reserve";
	if (game.actions && game.actions.battle_fire && game.actions.battle_fire.includes(b))
		msg = "Fire with " + msg;
	if (game.actions && game.actions.battle_hit && game.actions.battle_hit.includes(b))
		msg = "Take hit on " + msg;
	document.getElementById("status").textContent = msg;
}

function on_blur_battle_block(evt) {
	document.getElementById("status").textContent = "";
}

function on_click_battle_block(evt) {
	let b = evt.target.block;
	send_action('block', b);
}

function on_focus_battle_fire(evt) {
	document.getElementById("status").textContent =
		"Fire with " + block_name(evt.target.block);
}

function on_focus_battle_retreat(evt) {
	document.getElementById("status").textContent =
		"Retreat with " + block_name(evt.target.block);
}

function on_focus_battle_pass(evt) {
	document.getElementById("status").textContent =
		"Pass with " + block_name(evt.target.block);
}

function on_focus_battle_hit(evt) {
	document.getElementById("status").textContent =
		"Take hit on " + block_name(evt.target.block);
}

function on_blur_battle_button(evt) {
	document.getElementById("status").textContent = "";
}

function on_click_battle_hit(evt) { send_action('battle_hit', evt.target.block); }
function on_click_battle_fire(evt) { send_action('battle_fire', evt.target.block); }
function on_click_battle_retreat(evt) { send_action('battle_retreat', evt.target.block); }
function on_click_battle_pass(evt) { send_action('battle_pass', evt.target.block); }

function on_click_card(evt) {
	let c = evt.target.id.split("+")[1] | 0;
	send_action('play', c);
}

function on_herald(noble) {
	send_action('noble', noble);
}

function on_button_undo(evt) {
	send_action('undo');
}

function on_button_play_event(evt) {
	send_action('play_event');
}

function on_button_end_move_phase(evt) {
	send_action('end_move_phase');
}

function on_button_end_regroup(evt) {
	send_action('end_regroup');
}

function on_button_end_retreat(evt) {
	send_action('end_retreat');
}

function on_button_eliminate(evt) {
	send_action('eliminate');
}

function on_button_disband(evt) {
	send_action('disband');
}

function on_button_end_disbanding(evt) {
	send_action('end_disbanding');
}

function on_button_end_builds(evt) {
	send_action('end_builds');
}

function on_button_end_pillage(evt) {
	send_action('end_pillage');
}

function on_button_pass(evt) {
	send_action('pass');
}

function on_crown_bruce(evt) {
	send_action('crown_bruce');
}

function on_crown_comyn(evt) {
	send_action('crown_comyn');
}

function on_return_of_the_king(evt) {
	send_action('return_of_the_king');
}

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
	build_battle_button(menu_list, b, "fire",
		on_click_battle_fire, on_focus_battle_fire,
		"/images/pointy-sword.svg");
	build_battle_button(menu_list, b, "retreat",
		on_click_battle_retreat, on_focus_battle_retreat,
		"/images/flying-flag.svg");
	build_battle_button(menu_list, b, "pass",
		on_click_battle_pass, on_focus_battle_pass,
		"/images/sands-of-time.svg");

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

function build_map() {
	let svgmap = document.getElementById("svgmap");

	ui.blocks_element = document.getElementById("blocks");
	ui.offmap_element = document.getElementById("offmap");

	for (let c = 1; c <= 25; ++c) {
		ui.cards[c] = document.getElementById("card+"+c);
		ui.cards[c].addEventListener("click", on_click_card);
	}

	for (let name in AREAS) {
		let area = AREAS[name];
		let element = svgmap.getElementById("area+"+name);
		if (element) {
			element.area = name;
			element.addEventListener("mouseenter", on_focus_area);
			element.addEventListener("mouseleave", on_blur_area);
			element.addEventListener("click", on_click_area);
			ui.areas[name] = element;
		}
		ui.secret.England[name] = [];
		ui.secret.Scotland[name] = [];
	}
	ui.secret.England.offmap = [];
	ui.secret.Scotland.offmap = [];

	for (let b in BLOCKS) {
		let block = BLOCKS[b];
		build_battle_block(b, block);
		ui.known[b] = build_known_block(b, block);
		ui.secret[BLOCKS[b].owner].offmap.push(build_secret_block(b, block));
	}
}

build_map();

function update_steps(b, steps, element) {
        element.classList.remove("r1");
        element.classList.remove("r2");
        element.classList.remove("r3");
	element.classList.add("r"+(BLOCKS[b].steps - steps));
}

function layout_blocks(location, north, south) {
	let wrap = 4;
	let s = north.length;
	let k = south.length;
	let n = s + k;
	let row, rows = [];
	let i = 0;

	switch (location) {
	case ENGLAND_BAG:
	case SCOTLAND_BAG:
		wrap = 28;
		break;
	case "Selkirk":
	case "Lothian":
	case "Dunbar":
	case "Lanark":
	case "Lennox":
	case "Argyll":
	case "Garmoran":
	case "Mentieth":
		wrap = 3;
		break;
	case "England":
		wrap = 5;
	}

	function new_line() {
		rows.push(row = []);
		i = 0;
	}

	new_line();

	while (north.length > 0) {
		if (i == wrap)
			new_line();
		row.push(north.shift());
		++i;
	}

	// Break early if north and south fit in exactly two rows
	if (s > 0 && s <= wrap && k > 0 && k <= wrap)
		new_line();

	while (south.length > 0) {
		if (i == wrap)
			new_line();
		row.push(south.shift());
		++i;
	}

	for (let j = 0; j < rows.length; ++j)
		for (i = 0; i < rows[j].length; ++i)
			position_block(location, j, rows.length, i, rows[j].length, rows[j][i]);
}

function position_block(location, row, n_rows, col, n_cols, element) {
	let area = AREAS[location];
	let block_size = 60+6;
	let padding = 4;
	let offset = block_size + padding;
	let row_size = (n_rows-1) * offset;
	let col_size = (n_cols-1) * offset;
	let x = area.x - block_size/2;
	let y = area.y - block_size/2;

	let layout_major = 0.5;
	let layout_minor = 0.5;
	switch (location) {
	case ENGLAND_BAG:
	case SCOTLAND_BAG:
		layout_major = 0;
		layout_minor = 0;
		break;
	case ENGLAND:
		layout_major = 1;
		layout_minor = 1;
		break;
	case "Argyll":
		layout_major = 0.5;
		layout_minor = 1.0;
		break;
	case "Carrick":
		layout_major = 0.75;
		layout_minor = 0.5;
		break;
	case "Dunbar":
		layout_major = 0.25;
		layout_minor = 0.75;
		break;
	case "Fife":
		layout_major = 0.25;
		layout_minor = 0.5;
		break;
	case "Lennox":
		layout_major = 0.75;
		layout_minor = 0.75;
		break;
	case "Mentieth":
		layout_major = 0.5;
		layout_minor = 0.25;
		break;
	}

	x -= col_size * layout_major;
	y -= row_size * layout_minor;

	x += col * offset;
	y += row * offset;

	element.style.left = (x|0)+"px";
	element.style.top = (y|0)+"px";
}

function show_block(element) {
	if (element.parentElement != ui.blocks_element)
		ui.blocks_element.appendChild(element);
}

function hide_block(element) {
	if (element.parentElement != ui.offmap_element)
		ui.offmap_element.appendChild(element);
}

function update_map(player) {
	let overflow = { England: [], Scotland: [] };
	let layout = {};

	document.getElementById("turn").setAttribute("class", "turn year_" + game.year);

	for (let area in AREAS)
		layout[area] = { secret: [], known: [] };

	// Move secret blocks to overflow queue if there are too many in a location
	for (let area in AREAS) {
		for (let color of [ENGLAND, SCOTLAND]) {
			if (game.secret[color]) {
				let max = game.secret[color][area] ? game.secret[color][area][0] : 0;
				while (ui.secret[color][area].length > max) {
					overflow[color].push(ui.secret[color][area].pop());
				}
			}
		}
	}

	// Add secret blocks if there are too few in a location
	for (let area in AREAS) {
		for (let color of [ENGLAND, SCOTLAND]) {
			if (game.secret[color]) {
				let max = game.secret[color][area] ? game.secret[color][area][0] : 0;
				while (ui.secret[color][area].length < max) {
					if (overflow[color].length > 0) {
						ui.secret[color][area].push(overflow[color].pop());
					} else {
						let element = ui.secret[color].offmap.pop();
						show_block(element);
						ui.secret[color][area].push(element);
					}
				}
			}
		}
	}

	// Remove any blocks left in the overflow queue
	for (let color of [ENGLAND, SCOTLAND]) {
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
	for (let area in AREAS) {
		for (let color of [ENGLAND, SCOTLAND]) {
			let i = 0, n = 0, m = 0;
			if (game.secret[color] && game.secret[color][area]) {
				n = game.secret[color][area][0];
				m = game.secret[color][area][1];
			}
			for (let element of ui.secret[color][area]) {
				if (i++ < n - m)
					element.classList.remove("moved");
				else
					element.classList.add("moved");
				layout[area].secret.push(element);
			}
		}
	}

	// Add known blocks to layout
	for (let b in game.known) {
		let area = game.known[b][0];
		if (area) {
			let steps = game.known[b][1];
			let moved = game.known[b][2];
			let element = ui.known[b];

			layout[area].known.push(element);

			show_block(element);
			update_steps(b, steps, element);

			if (moved)
				element.classList.add("moved");
			else
				element.classList.remove("moved");
		}
	}

	// Layout blocks on map
	for (let area in AREAS) {
		if (player == ENGLAND)
			layout_blocks(area, layout[area].secret, layout[area].known);
		else
			layout_blocks(area, layout[area].known, layout[area].secret);
	}

	// Mark selections and highlights

	for (let where in AREAS) {
		if (ui.areas[where]) {
			ui.areas[where].classList.remove('highlight');
			ui.areas[where].classList.remove('where');
		}
	}
	if (game.actions && game.actions.area)
		for (let where of game.actions.area)
			ui.areas[where].classList.add('highlight');
	if (game.where)
		ui.areas[game.where].classList.add('where');

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
	for (let c = 1; c <= 25; ++c) {
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

	if (!game.e_card)
		document.querySelector("#england_card").className = "small_card card_back";
	else
		document.querySelector("#england_card").className = "small_card " + CARDS[game.e_card].image;
	if (!game.s_card)
		document.querySelector("#scotland_card").className = "small_card card_back";
	else
		document.querySelector("#scotland_card").className = "small_card " + CARDS[game.s_card].image;
}

function update_battle(player) {
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
			ui.battle_menu[block].classList.remove('fire');
			ui.battle_menu[block].classList.remove('retreat');
			ui.battle_menu[block].classList.remove('pass');

			if (game.actions && game.actions.block && game.actions.block.includes(block))
				ui.battle_block[block].classList.add("highlight");
			if (game.actions && game.actions.battle_fire && game.actions.battle_fire.includes(block))
				ui.battle_menu[block].classList.add('fire');
			if (game.actions && game.actions.battle_retreat && game.actions.battle_retreat.includes(block))
				ui.battle_menu[block].classList.add('retreat');
			if (game.actions && game.actions.battle_pass && game.actions.battle_pass.includes(block))
				ui.battle_menu[block].classList.add('pass');
			if (game.actions && game.actions.battle_hit && game.actions.battle_hit.includes(block))
				ui.battle_menu[block].classList.add('hit');

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

	if (player == ENGLAND) {
		fill_cell("FR", game.battle.ER, true);
		fill_cell("FA", game.battle.EA, false);
		fill_cell("FB", game.battle.EB, false);
		fill_cell("FC", game.battle.EC, false);
		fill_cell("EA", game.battle.SA, false);
		fill_cell("EB", game.battle.SB, false);
		fill_cell("EC", game.battle.SC, false);
		fill_cell("ER", game.battle.SR, true);
	} else {
		fill_cell("ER", game.battle.ER, true);
		fill_cell("EA", game.battle.EA, false);
		fill_cell("EB", game.battle.EB, false);
		fill_cell("EC", game.battle.EC, false);
		fill_cell("FA", game.battle.SA, false);
		fill_cell("FB", game.battle.SB, false);
		fill_cell("FC", game.battle.SC, false);
		fill_cell("FR", game.battle.SR, true);
	}
}

function on_update(state, player) {
	game = state;

	show_action_button("#undo_button", "undo");
	show_action_button("#pass_button", "pass");
	show_action_button("#play_event_button", "play_event");
	show_action_button("#end_move_phase_button", "end_move_phase");
	show_action_button("#end_regroup_button", "end_regroup");
	show_action_button("#end_retreat_button", "end_retreat");
	show_action_button("#eliminate_button", "eliminate");
	show_action_button("#disband_button", "disband");
	show_action_button("#end_disbanding_button", "end_disbanding");
	show_action_button("#end_builds_button", "end_builds");
	show_action_button("#end_pillage_button", "end_pillage");
	show_action_button("#crown_bruce_button", "crown_bruce");
	show_action_button("#crown_comyn_button", "crown_comyn");
	show_action_button("#return_of_the_king_button", "return_of_the_king");

	document.getElementById("england_vp").textContent = game.e_vp;
	document.getElementById("scotland_vp").textContent = game.s_vp;

	update_cards();
	update_map(player);

	if (game.actions && game.actions.noble) {
		document.querySelector(".herald").classList.add("show");
		for (let noble of NOBLES) {
			let element = document.getElementById("herald+" + noble);
			if (game.actions.noble.includes(noble))
				element.classList.add("show");
			else
				element.classList.remove("show");
		}
	} else {
		document.querySelector(".herald").classList.remove("show");
	}

	if (game.battle) {
		document.querySelector(".battle_header").textContent = game.battle.title;
		document.querySelector(".battle_message").textContent = game.battle.flash;
		document.querySelector(".battle").classList.add("show");
		update_battle(player);
	} else {
		document.querySelector(".battle").classList.remove("show");
	}
}

drag_element_with_mouse(".battle", ".battle_header");
drag_element_with_mouse(".herald", ".herald_header");
scroll_with_middle_mouse(".grid_center", 2);

init_client([ "England", "Scotland" ]);
