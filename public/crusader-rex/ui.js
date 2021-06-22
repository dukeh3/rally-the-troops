"use strict";

const FRANKS = "Franks";
const SARACENS = "Saracens";
const ASSASSINS = "Assassins";
const ENEMY = { Saracens: "Franks", Franks: "Saracens" }
const DEAD = "Dead";
const F_POOL = "FP";
const S_POOL = "SP";
const ENGLAND = "England";
const FRANCE = "France";
const GERMANIA = "Germania";

let label_layout = window.localStorage['crusader-rex/label-layout'] || 'spread';

function set_spread_layout() {
	label_layout = 'spread';
	window.localStorage['crusader-rex/label-layout'] = label_layout;
	update_map();
}

function set_stack_layout() {
	label_layout = 'stack';
	window.localStorage['crusader-rex/label-layout'] = label_layout;
	update_map();
}

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

let ui = {
	cards: {},
	towns: {},
	blocks: {},
	battle_menu: {},
	battle_block: {},
	present: new Set(),
}

function on_focus_town(evt) {
	let where = evt.target.town;
	let text = where;
	if (where in SHIELDS)
		text += " \u2014 " + SHIELDS[where].join(", ");
	document.getElementById("status").textContent = text;
}

function on_blur_town(evt) {
	document.getElementById("status").textContent = "";
}

function on_click_town(evt) {
	let where = evt.target.town;
	send_action('town', where);
}

const STEP_TEXT = [ 0, "I", "II", "III", "IIII" ];
const HEIR_TEXT = [ 0, '\u00b9', '\u00b2', '\u00b3', '\u2074', '\u2075' ];

function block_name(who) { return who; }
function block_home(who) { return BLOCKS[who].home; }
function block_owner(who) { return BLOCKS[who].owner; }

function on_focus_map_block(evt) {
	let info = BLOCKS[evt.target.block];
	if (info.owner == player || info.owner == ASSASSINS) {
		let text = info.name + " ";
		if (info.move)
			text += info.move + "-";
		text += STEP_TEXT[info.steps] + "-" + info.combat;
		document.getElementById("status").textContent = text;
	} else {
		document.getElementById("status").textContent = info.owner;
	}
}

function on_blur_map_block(evt) {
	document.getElementById("status").textContent = "";
}

function on_click_map_block(evt) {
	let b = evt.target.block;
	if (!game.battle)
		send_action('block', b);
}

function on_focus_battle_block(evt) {
	let b = evt.target.block;
	let msg;

	if (!evt.target.classList.contains("known")) {
		if (block_owner(b) == FRANKS)
			msg = "Franks";
		else if (block_owner(b) == SARACENS)
			msg = "Saracens";
	} else {
		msg = block_name(b);
	}

	if (game.actions && game.actions.battle_fire && game.actions.battle_fire.includes(b))
		msg = "Fire with " + msg;
	else if (game.actions && game.actions.battle_storm && game.actions.battle_storm.includes(b))
		msg = "Storm with " + msg;
	else if (game.actions && game.actions.battle_sally && game.actions.battle_sally.includes(b))
		msg = "Sally with " + msg;
	else if (game.actions && game.actions.battle_withdraw && game.actions.battle_withdraw.includes(b))
		msg = "Withdraw with " + msg;
	else if (game.actions && game.actions.battle_hit && game.actions.battle_hit.includes(b))
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
	if (game.battle.storming.includes(evt.target.block))
		document.getElementById("status").textContent =
			"Withdraw with " + block_name(evt.target.block);
	else
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

function on_focus_battle_withdraw(evt) {
	document.getElementById("status").textContent =
		"Withdraw with " + block_name(evt.target.block);
}

function on_focus_battle_storm(evt) {
	document.getElementById("status").textContent =
		"Storm with " + block_name(evt.target.block);
}

function on_focus_battle_sally(evt) {
	document.getElementById("status").textContent =
		"Sally with " + block_name(evt.target.block);
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
function on_click_battle_charge(evt) { send_action('battle_charge', evt.target.block); }
function on_click_battle_harry(evt) { send_action('battle_harry', evt.target.block); }
function on_click_battle_withdraw(evt) { send_action('battle_withdraw', evt.target.block); }
function on_click_battle_storm(evt) { send_action('battle_storm', evt.target.block); }
function on_click_battle_sally(evt) { send_action('battle_sally', evt.target.block); }

function on_click_card(evt) {
	let c = evt.target.id.split("+")[1] | 0;
	send_action('play', c);
}

function on_button_next(evt) { send_action('next'); }
function on_button_pass(evt) { send_action('pass'); }
function on_button_undo(evt) { send_action('undo'); }
function on_button_group_move(evt) { send_action('group_move'); }
function on_button_end_group_move(evt) { send_action('end_group_move'); }
function on_button_sea_move(evt) { send_action('sea_move'); }
function on_button_end_sea_move(evt) { send_action('end_sea_move'); }
function on_button_muster(evt) { send_action('muster'); }
function on_button_end_muster(evt) { send_action('end_muster'); }
function on_button_end_move_phase(evt) { send_action('end_move_phase'); }
function on_button_end_regroup(evt) { send_action('end_regroup'); }
function on_button_end_retreat(evt) { send_action('end_retreat'); }
function on_button_eliminate(evt) { send_action('eliminate'); }
function on_button_jihad(evt) { send_action('jihad'); }

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
	build_battle_button(menu_list, b, "withdraw",
		on_click_battle_withdraw, on_focus_battle_withdraw,
		"/images/stone-tower.svg");
	build_battle_button(menu_list, b, "storm",
		on_click_battle_storm, on_focus_battle_storm,
		"/images/siege-tower.svg");
	build_battle_button(menu_list, b, "sally",
		on_click_battle_sally, on_focus_battle_sally,
		"/images/doorway.svg");

	let menu = document.createElement("div");
	menu.classList.add("battle_menu");
	menu.appendChild(element);
	menu.appendChild(menu_list);
	ui.battle_menu[b] = menu;
}

function build_map_block(b, block) {
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

function town_x(t) {
	if (map_orientation == 'tall')
		return TOWNS[t].x;
	else
		return TOWNS[t].y;
}

function town_y(t) {
	if (map_orientation == 'tall')
		return TOWNS[t].y;
	else
		return 1275 - TOWNS[t].x;
}

function flip_x(x, y) {
	if (map_orientation == 'tall')
		return x;
	else
		return y;
}

function flip_y(x, y) {
	if (map_orientation == 'tall')
		return y;
	else
		return 1275 - x;
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
	}

	for (let b in BLOCKS) {
		let block = BLOCKS[b];
		ui.blocks[b] = build_map_block(b, block);
		build_battle_block(b, block);
	}

	update_map_layout();
}

function update_steps(b, steps, element) {
	element.classList.remove("r1");
	element.classList.remove("r2");
	element.classList.remove("r3");
	element.classList.add("r"+(BLOCKS[b].steps - steps));
}

function layout_blocks(location, secret, known) {
	if (label_layout == 'stack')
		document.getElementById("map").classList.add("stack_layout");
	else
		document.getElementById("map").classList.remove("stack_layout");
	if (label_layout == 'spread' ||
		(location == S_POOL || location == F_POOL || location == DEAD ||
			location == ENGLAND || location == FRANCE || location == GERMANIA))
		layout_blocks_spread(location, secret, known);
	else
		layout_blocks_stacked(location, secret, known);
}

// function position_block(town, row, n_rows, col, n_cols, element) {

function layout_blocks_spread(town, north, south) {
	let wrap = TOWNS[town].wrap;
	let rows = [];

	if (north.length + south.length > wrap * 2) {
		north = north.concat(south);
		south = [];
	}

	function wrap_row(input) {
		while (input.length > wrap) {
			rows.push(input.slice(0, wrap));
			input = input.slice(wrap);
		}
		if (input.length > 0)
			rows.push(input);
	}

	wrap_row(north);
	wrap_row(south);

	for (let r = 0; r < rows.length; ++r) {
		let cols = rows[r];
		for (let c = 0; c < cols.length; ++c)
			position_block(town, r, rows.length, c, cols.length, cols[c]);
	}
}

function layout_blocks_spread_old(town, secret, known) {
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
	if (town == ENGLAND || town == FRANCE || town == GERMANIA)
		padding = 21;
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

function layout_blocks_stacked(location, secret, known) {
	let s = secret.length;
	let k = known.length;
	let both = secret.length > 0 && known.length > 0;
	let i = 0;
	while (secret.length > 0)
		position_block_stacked(location, i++, (s-1)/2, both ? 1 : 0, secret.shift());
	i = 0;
	while (known.length > 0)
		position_block_stacked(location, i++, (k-1)/2, 0, known.shift());
}

function position_block_stacked(location, i, c, k, element) {
	let space = TOWNS[location];
	let block_size = 60+6;
	let x, y;
	if (map_orientation == 'tall') {
		x = space.x + (i - c) * 16 + k * 12;
		y = space.y + (i - c) * 16 - k * 12;
	} else {
		x = space.x - (i - c) * 16 + k * 12;
		y = space.y + (i - c) * 16 + k * 12;
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
	let layout = {};

	document.getElementById("frank_vp").textContent = game.f_vp + " VP";
	document.getElementById("saracen_vp").textContent = game.s_vp + " VP";
	document.getElementById("timeline").className = "year_" + game.year;
	document.getElementById("turn").textContent =
		"Turn " + game.turn + " of Year " + game.year;

	for (let town in TOWNS)
		layout[town] = { north: [], south: [] };

	for (let b in game.location) {
		let info = BLOCKS[b];
		let element = ui.blocks[b];
		let town = game.location[b];

		if ((town == F_POOL && player != FRANKS) || (town == S_POOL && player != SARACENS)) {
			hide_block(element);
			continue;
		}
		if (town == DEAD && player != info.owner) {
			hide_block(element)
			continue;
		}

		if (town in TOWNS) {
			let moved = game.moved[b] ? " moved" : "";
			if (town == DEAD)
				moved = " moved";
			if (info.owner == player || info.owner == ASSASSINS) {
				let image = " block_" + info.image;
				let steps = " r" + (info.steps - game.steps[b]);
				let known = " known"
				if ((town == S_POOL || town == F_POOL) && b != game.who)
					known = "";
				element.classList = info.owner + known + " block" + image + steps + moved;
				layout[town].south.push(element);
			} else {
				let besieging = (game.sieges[town] == info.owner) ? " besieging" : "";
				element.classList = info.owner + " block" + moved + besieging;
				layout[town].north.push(element);
			}
			show_block(element);
		} else {
			hide_block(element);
		}
	}

	for (let town in TOWNS)
		layout_blocks(town, layout[town].north, layout[town].south);

	for (let where in TOWNS) {
		if (ui.towns[where]) {
			ui.towns[where].classList.remove('highlight');
			ui.towns[where].classList.remove('muster');
		}
	}
	if (game.actions && game.actions.town)
		for (let where of game.actions.town)
			ui.towns[where].classList.add('highlight');
	if (game.muster)
		ui.towns[game.muster].classList.add('muster');

	if (!game.battle) {
		if (game.actions && game.actions.block)
			for (let b of game.actions.block)
				ui.blocks[b].classList.add('highlight');
		if (game.who)
			ui.blocks[game.who].classList.add('selected');
	}
	for (let b of game.castle) {
		ui.blocks[b].classList.add('castle');
		ui.battle_block[b].classList.add('castle');
	}
}

function update_card_display(element, card, prior_card) {
	if (!card && !prior_card) {
		element.className = "small_card card_back";
	} else if (prior_card) {
		element.className = "small_card prior " + CARDS[prior_card].image;
	} else {
		element.className = "small_card " + CARDS[card].image;
	}
}

function update_cards() {
	update_card_display(document.getElementById("frank_card"), game.f_card, game.prior_f_card);
	update_card_display(document.getElementById("saracen_card"), game.s_card, game.prior_s_card);

	for (let c = 1; c <= 27; ++c) {
		let element = ui.cards[c];
		if (game.hand.includes(c)) {
			element.classList.add("show");
			if (game.actions && game.actions.play) {
				if (game.actions.play.includes(c)) {
					element.classList.add("enabled");
					element.classList.remove("disabled");
				} else {
					element.classList.remove("enabled");
					element.classList.add("disabled");
				}
			} else {
				element.classList.remove("enabled");
				element.classList.remove("disabled");
			}
		} else {
			element.classList.remove("show");
		}
	}
}

function update_battle() {
	function fill_cell(name, list, show) {
		let cell = document.getElementById(name);

		ui.present.clear();

		for (let block of list) {
			ui.present.add(block);

			// TODO: insert in correct order!
			if (!cell.contains(ui.battle_menu[block]))
				cell.appendChild(ui.battle_menu[block]);

			if (block == game.who)
				ui.battle_block[block].classList.add("selected");
			else
				ui.battle_block[block].classList.remove("selected");

			ui.battle_block[block].classList.remove("highlight");
			ui.battle_menu[block].classList.remove('hit');
			ui.battle_menu[block].classList.remove('charge');
			ui.battle_menu[block].classList.remove('fire');
			ui.battle_menu[block].classList.remove('harry');
			ui.battle_menu[block].classList.remove('withdraw');
			ui.battle_menu[block].classList.remove('storm');
			ui.battle_menu[block].classList.remove('sally');
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
			if (game.actions && game.actions.battle_withdraw && game.actions.battle_withdraw.includes(block))
				ui.battle_menu[block].classList.add('withdraw');
			if (game.actions && game.actions.battle_storm && game.actions.battle_storm.includes(block))
				ui.battle_menu[block].classList.add('storm');
			if (game.actions && game.actions.battle_sally && game.actions.battle_sally.includes(block))
				ui.battle_menu[block].classList.add('sally');
			if (game.actions && game.actions.battle_hit && game.actions.battle_hit.includes(block))
				ui.battle_menu[block].classList.add('hit');
			if (game.actions && game.actions.battle_charge && game.actions.battle_charge.includes(block))
				ui.battle_menu[block].classList.add('charge');
			if (game.actions && game.actions.battle_treachery && game.actions.battle_treachery.includes(block))
				ui.battle_menu[block].classList.add('treachery');

			update_steps(block, game.steps[block], ui.battle_block[block], false);

			if (block == game.battle.halfhit)
				ui.battle_block[block].classList.add("halfhit");
			else
				ui.battle_block[block].classList.remove("halfhit");
			if (show)
				ui.battle_block[block].classList.add("known");
			else
				ui.battle_block[block].classList.remove("known");
			if (game.moved[block])
				ui.battle_block[block].classList.add("moved");
			else
				ui.battle_block[block].classList.remove("moved");
		}

		for (let b in BLOCKS) {
			if (!ui.present.has(b)) {
				if (cell.contains(ui.battle_menu[b]))
					cell.removeChild(ui.battle_menu[b]);
			}
		}
	}

	if (player == FRANKS) {
		fill_cell("FR", game.battle.FR, true);
		fill_cell("FC", game.battle.FC, true);
		fill_cell("FF", game.battle.FF, true);
		fill_cell("EF", game.battle.SF, game.battle.round > 0);
		fill_cell("EC", game.battle.SC, game.battle.show_castle);
		fill_cell("ER", game.battle.SR, false);
		document.getElementById("FC").className = "c" + game.battle.FCS;
		document.getElementById("EC").className = "c" + game.battle.SCS;
	} else {
		fill_cell("ER", game.battle.FR, false);
		fill_cell("EC", game.battle.FC, game.battle.show_castle);
		fill_cell("EF", game.battle.FF, game.battle.round > 0);
		fill_cell("FF", game.battle.SF, true);
		fill_cell("FC", game.battle.SC, true);
		fill_cell("FR", game.battle.SR, true);
		document.getElementById("EC").className = "c" + game.battle.FCS;
		document.getElementById("FC").className = "c" + game.battle.SCS;
	}
}

function on_update() {
	show_action_button("#next_button", "next");
	show_action_button("#pass_button", "pass");
	show_action_button("#undo_button", "undo");
	show_action_button("#group_move_button", "group_move");
	show_action_button("#end_group_move_button", "end_group_move");
	show_action_button("#sea_move_button", "sea_move");
	show_action_button("#end_sea_move_button", "end_sea_move");
	show_action_button("#muster_button", "muster");
	show_action_button("#end_muster_button", "end_muster");
	show_action_button("#end_move_phase_button", "end_move_phase");
	show_action_button("#end_regroup_button", "end_regroup");
	show_action_button("#end_retreat_button", "end_retreat");
	show_action_button("#jihad_button", "jihad");
	show_action_button("#eliminate_button", "eliminate");

	document.getElementById("frank_vp").textContent = game.f_vp;
	document.getElementById("saracen_vp").textContent = game.s_vp;

	update_cards();
	update_map();

	if (game.battle) {
		document.querySelector(".battle_header").textContent = game.battle.title;
		document.querySelector(".battle_message").textContent = game.battle.flash;
		document.querySelector(".battle").classList.add("show");
		update_battle();
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
init_client(["Franks", "Saracens"]);
