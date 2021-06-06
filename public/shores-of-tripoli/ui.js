"use strict";

const SEASON_X = [ 893, 978, 1064, 1149 ];
const YEAR_X = { 1801: 175, 1802: 294, 1803: 413, 1804: 532, 1805: 652, 1806: 771 };
const YEAR_Y = 728;

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
const FRIGATES = US_FRIGATES.concat(TR_FRIGATES);

const ALEXANDRIA_HARBOR = get_space_id("Alexandria Harbor");
const ALGIERS_HARBOR = get_space_id("Algiers Harbor");
const ALGIERS_PATROL_ZONE = get_space_id("Algiers Patrol Zone");
const BENGHAZI_HARBOR = get_space_id("Benghazi Harbor");
const DERNE_HARBOR = get_space_id("Derne Harbor");
const GIBRALTAR_HARBOR = get_space_id("Gibraltar Harbor");
const GIBRALTAR_PATROL_ZONE = get_space_id("Gibraltar Patrol Zone");
const MALTA_HARBOR = get_space_id("Malta Harbor");
const TANGIER_HARBOR = get_space_id("Tangier Harbor");
const TANGIER_PATROL_ZONE = get_space_id("Tangier Patrol Zone");
const TRIPOLI_HARBOR = get_space_id("Tripoli Harbor");
const TRIPOLI_PATROL_ZONE = get_space_id("Tripoli Patrol Zone");
const TUNIS_HARBOR = get_space_id("Tunis Harbor");
const TUNIS_PATROL_ZONE = get_space_id("Tunis Patrol Zone");
const UNITED_STATES_SUPPLY = get_space_id("United States Supply");
const TRIPOLITAN_SUPPLY = get_space_id("Tripolitan Supply");
const TRACK_1801 = get_space_id("1801");
const TRACK_1802 = get_space_id("1802");
const TRACK_1803 = get_space_id("1803");
const TRACK_1804 = get_space_id("1804");
const TRACK_1805 = get_space_id("1805");
const TRACK_1806 = get_space_id("1806");

let map = document.getElementById("map");

let ui = {
	spaces: {},
	pieces: {},
	cards: {},
}

function on_focus_space(evt) {
	let where = SPACES[evt.target.space];
	document.getElementById("status").textContent = where;
}

function on_focus_piece(evt) {
	let who = PIECES[evt.target.piece];
	document.getElementById("status").textContent = who;
}

function on_blur(evt) {
	document.getElementById("status").textContent = "";
}

function on_pass() { if (game.actions) { send_action('pass', null); } }
function on_undo() { if (game.actions) { send_action('undo', null); } }
function on_next() { if (game.actions) { send_action('next', null); } }

function on_click_space(evt) { send_action('space', evt.target.space); }
function on_click_piece(evt) { send_action('piece', evt.target.piece); }

function build_map() {
	for (let i = 0; i < SPACES.length; ++i) {
		let space = SPACES[i];
		let id = space.replace(/ /g, "_").toLowerCase();
		let e = map.getElementById(id);
		if (e) {
			e.addEventListener("mouseenter", on_focus_space);
			e.addEventListener("mouseleave", on_blur);
			e.addEventListener("click", on_click_space);
			e.space = i;
			ui.spaces[i] = e;
		}
	}
	for (let i = 0; i < PIECES.length; ++i) {
		let piece = PIECES[i];
		let e = map.getElementById(piece);
		if (e) {
			e.addEventListener("mouseenter", on_focus_piece);
			e.addEventListener("mouseleave", on_blur);
			e.addEventListener("click", on_click_piece);
			e.piece = i;
			ui.pieces[i] = e;
		}
	}
	for (let i = 1; i <= 27; ++i) {
		let e = ui.cards[i] = document.getElementById("us_card_"+i);
		e.addEventListener("click", on_click_card);
		e.card = i;
	}
	for (let i = 28; i <= 54; ++i) {
		let e = ui.cards[i] = document.getElementById("tr_card_"+(i-27));
		e.addEventListener("click", on_click_card);
		e.card = i;
	}
}

function update_card(c, show) {
	if (show)
		ui.cards[c].classList.add('show');
	else
		ui.cards[c].classList.remove('show');
}

function update_cards() {
	document.getElementById("us_card_deck").textContent = game.us.deck;
	document.getElementById("tr_card_deck").textContent = game.tr.deck;
	for (let i = 1; i <= 3; ++i) {
		update_card(i, game.us.core.includes(i));
		update_card(i+27, game.tr.core.includes(i+27));
	}
	for (let i = 4; i <= 27; ++i) {
		update_card(i, game.hand.includes(i));
		update_card(i+27, game.hand.includes(i+27));
	}
}

/* MAP AND PIECE LAYOUT */

function on_update() {
	show_action_button("#button_pass", "pass");
	show_action_button("#button_next", "next");
	show_action_button("#button_undo", "undo");
	update_year_marker(game.year);
	update_season_marker(game.season);
	update_pieces(game.location);
	update_pieces();
	update_cards();
	update_spaces();
}

function update_year_marker(year) {
	let e = map.getElementById("year");
	e.setAttribute("cx", YEAR_X[year]);
	e.setAttribute("cy", YEAR_Y);
}

function update_season_marker(season) {
	let e = map.getElementById("season");
	e.setAttribute("cx", SEASON_X[season]);
	e.setAttribute("cy", YEAR_Y);
}

function set_piece_xy(p, x, y) {
	let e = ui.pieces[p];
	e.setAttribute("x", x);
	e.setAttribute("y", y);
}

function layout_space(location, s, x0, y0, wrap, dx=45, dy=30) {
	let n = 0;
	for (let p = 0; p < PIECES.length; ++p)
		if (location[p] == s)
			++n;
	let rows = Math.ceil(n / wrap);
	let cols = rows == 1 ? n : wrap;
	let y = y0 - (rows-1)/2 * dx;
	let x = x0 - (cols-1)/2 * dx;
	let k = 0;
	for (let p = 0; p < PIECES.length; ++p) {
		if (location[p] == s) {
			set_piece_xy(p, x + k * dx, y);
			if (++k == wrap) {
				y += dy;
				k = 0;
			}
		}
	}
}

function update_pieces() {
	layout_space(game.location, UNITED_STATES_SUPPLY, 1933, 180, 6, 38, 26);
	layout_space(game.location, TRIPOLITAN_SUPPLY, 2195, 180, 6, 38, 26);

	layout_space(game.location, TRACK_1801, YEAR_X[1801], 625, 1);
	layout_space(game.location, TRACK_1802, YEAR_X[1802], 625, 1);
	layout_space(game.location, TRACK_1803, YEAR_X[1803], 625, 1);
	layout_space(game.location, TRACK_1804, YEAR_X[1804], 625, 1);
	layout_space(game.location, TRACK_1805, YEAR_X[1805], 625, 1);
	layout_space(game.location, TRACK_1806, YEAR_X[1806], 625, 1);

	layout_space(game.location, ALEXANDRIA_HARBOR, 2335, 454, 3);
	layout_space(game.location, ALGIERS_HARBOR, 883, 318, 3);
	layout_space(game.location, BENGHAZI_HARBOR, 1877, 583, 3);
	layout_space(game.location, DERNE_HARBOR, 2030, 437, 3);
	layout_space(game.location, GIBRALTAR_HARBOR, 374, 216, 3);
	layout_space(game.location, MALTA_HARBOR, 1592, 189, 3);
	layout_space(game.location, TANGIER_HARBOR, 296, 426, 3);
	layout_space(game.location, TRIPOLI_HARBOR, 1416, 604, 4);
	layout_space(game.location, TUNIS_HARBOR, 1232, 278, 3);

	layout_space(game.location, ALGIERS_PATROL_ZONE, 875, 170, 3);
	layout_space(game.location, GIBRALTAR_PATROL_ZONE, 560, 245, 3);
	layout_space(game.location, TANGIER_PATROL_ZONE, 125, 410, 3);
	layout_space(game.location, TRIPOLI_PATROL_ZONE, 1575, 390, 6);
	layout_space(game.location, TUNIS_PATROL_ZONE, 1300, 130, 3);

	for (let p of FRIGATES) {
		if (game.damaged.includes(p))
			ui.pieces[p].classList.add("damaged");
		else
			ui.pieces[p].classList.remove("damaged");
	}
}

function update_spaces() {
	for (let space in ui.spaces) {
		ui.spaces[space].classList.remove('highlight');
		ui.spaces[space].classList.remove('where');
	}
	if (game.where != null) {
		ui.spaces[game.where].classList.add('where');
	}
	if (game.actions && game.actions.space) {
		for (let space of game.actions.space) {
			console.log("enable space " + space);
			ui.spaces[space].classList.add('highlight');
		}
	}
}

/* CARD ACTION MENU */

let current_popup_card = 0;

function show_popup_menu(evt, list) {
	document.querySelectorAll("#popup div").forEach(e => e.classList.remove('enabled'));
	for (let item of list) {
		let e = document.getElementById("menu_" + item);
		e.classList.add('enabled');
	}
	let popup = document.getElementById("popup");
	popup.style.display = 'block';
	popup.style.left = (evt.clientX-50) + "px";
	popup.style.top = (evt.clientY-12) + "px";
	ui.cards[current_popup_card].classList.add("selected");
}

function hide_popup_menu() {
	let popup = document.getElementById("popup");
	popup.style.display = 'none';
	if (current_popup_card) {
		ui.cards[current_popup_card].classList.remove("selected");
		current_popup_card = 0;
	}
}

function on_card_event() {
	send_action('card_event', current_popup_card);
	hide_popup_menu();
}

function on_card_move_frigates() {
	send_action('card_move_frigates', current_popup_card);
	hide_popup_menu();
}

function on_card_pirate_raid() {
	send_action('card_pirate_raid', current_popup_card);
	hide_popup_menu();
}

function on_card_build_gunboat() {
	send_action('card_build_gunboat', current_popup_card);
	hide_popup_menu();
}

function on_card_build_corsair() {
	send_action('card_build_corsair', current_popup_card);
	hide_popup_menu();
}

function is_card_action(action, card) {
	return game.actions && game.actions[action] && game.actions[action].includes(card);
}

function on_click_card(evt) {
	if (game.actions) {
		let card = evt.target.card;
		if (is_card_action('discard', card)) {
			send_action('discard', card);
		} else {
			let menu = [];
			if (is_card_action('card_event', card)) menu.push('card_event');
			if (is_card_action('card_move_frigates', card)) menu.push('card_move_frigates');
			if (is_card_action('card_pirate_raid', card)) menu.push('card_pirate_raid');
			if (is_card_action('card_build_gunboat', card)) menu.push('card_build_gunboat');
			if (is_card_action('card_build_corsair', card)) menu.push('card_build_corsair');
			if (menu.length > 0) {
				current_popup_card = card;
				show_popup_menu(evt, menu);
			}
		}
	}
}

/* INITIALIZE CLIENT */

function toggle_fit() {
	document.getElementById("map").classList.toggle("fit");
}

build_map();
scroll_with_middle_mouse(".grid_center");
init_client([ "Tripolitania", "United States" ]);
