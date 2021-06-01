"use strict";

const GREECE = "Greece";
const PERSIA = "Persia";

const SPACES = [
	"Abydos",
	"Athenai",
	"Delphi",
	"Ephesos",
	"Eretria",
	"Korinthos",
	"Larissa",
	"Naxos",
	"Pella",
	"Sparta",
	"Thebai",
	"reserve",
	"extra",
];

const PORTS = {
        "Abydos":{"x":866,"y":625,"w":138,"h":138,"layout_x":855,"layout_y":585,"wrap":4},
        "Ephesos":{"x":450,"y":765,"w":138,"h":138,"layout_x":424,"layout_y":743,"wrap":3},
        "Athenai":{"x":515,"y":353,"w":138,"h":138,"layout_x":521,"layout_y":379,"wrap":4},
        "Eretria":{"x":682,"y":481,"w":138,"h":138,"layout_x":683,"layout_y":510,"wrap":4},
        "Naxos":{"x":475,"y":575,"w":138,"h":138,"layout_x":503,"layout_y":581,"wrap":3},
        "Pella":{"x":931,"y":317,"w":138,"h":138,"layout_x":919,"layout_y":345,"wrap":4},
        "Sparta":{"x":259,"y":449,"w":138,"h":138,"layout_x":251,"layout_y":470,"wrap":4},
        "Thebai":{"x":689,"y":282,"w":138,"h":138,"layout_x":701,"layout_y":311,"wrap":4}
};

const CITIES = {
        "Abydos":{"x":863,"y":654,"w":92,"h":90},
        "Ephesos":{"x":509,"y":766,"w":92,"h":90},
        "Athenai":{"x":537,"y":293,"w":84,"h":81},
        "Delphi":{"x":607,"y":92,"w":84,"h":81},
        "Eretria":{"x":668,"y":436,"w":84,"h":81},
        "Korinthos":{"x":442,"y":137,"w":84,"h":81},
        "Larissa":{"x":799,"y":107,"w":84,"h":81},
        "Naxos":{"x":408,"y":590,"w":84,"h":81},
        "Pella":{"x":960,"y":266,"w":84,"h":81},
        "Sparta":{"x":278,"y":344,"w":84,"h":81},
        "Thebai":{"x":671,"y":221,"w":84,"h":81}
};

let game;

let ui = {
	player: null,
	cards: {},
	backs: {},
	cities: {},
	ports: {},
	greek_fleet: {},
	greek_army: {},
	persian_fleet: {},
	persian_army: {},
	all_fleets: [],
	all_armies: [],
	selected_armies: null,
	selected_fleets: null,
};

function remove_from_array(array, item) {
	let i = array.indexOf(item);
	if (i >= 0)
		array.splice(i, 1);
}

function on_focus_bridge(evt) { document.getElementById("status").textContent = "Hellespont"; }
function on_focus_city(evt) { document.getElementById("status").textContent = evt.target.city; }
function on_focus_port(evt) { document.getElementById("status").textContent = evt.target.port + " (port)"; }
function on_blur(evt) { document.getElementById("status").textContent = ""; }

function on_click_bridge(evt) {
	send_action('destroy');
}

function on_click_army(evt) {
	if (game.land_movement && ui.player) {
		let here = (ui.player == PERSIA ? ui.persian_army : ui.greek_army)[game.land_movement];
		if (here.includes(evt.target)) {
			if (ui.selected_armies && ui.selected_armies.includes(evt.target))
				remove_from_array(ui.selected_armies, evt.target);
			else
				ui.selected_armies.push(evt.target);
		}
		update_ui();
	}
	if (game.naval_movement && ui.player) {
		let here = (ui.player == PERSIA ? ui.persian_army : ui.greek_army)[game.naval_movement];
		if (here.includes(evt.target)) {
			if (ui.selected_armies && ui.selected_armies.includes(evt.target)) {
				remove_from_array(ui.selected_armies, evt.target);
			} else {
				if (ui.selected_armies.length < ui.selected_fleets.length)
					ui.selected_armies.push(here[ui.selected_armies.length]);
			}
		}
		update_ui();
	}
}

function on_click_fleet(evt) {
	if (game.naval_movement && ui.player) {
		let here = (ui.player == PERSIA ? ui.persian_fleet : ui.greek_fleet)[game.naval_movement];
		if (here.includes(evt.target)) {
			if (ui.selected_fleets && ui.selected_fleets.includes(evt.target)) {
				remove_from_array(ui.selected_fleets, evt.target);
				while (ui.selected_armies.length > ui.selected_fleets.length)
					ui.selected_armies.pop();
			} else {
				ui.selected_fleets.push(evt.target);
			}
		}
		update_ui();
	}
}

function on_click_city(evt) {
	if (!game.land_movement)
		return send_action('city', evt.target.city);
	if (game.actions && game.actions.city && game.actions.city.includes(evt.target.city)) {
		let armies = ui.selected_armies.length;
		if (armies > 0)
			socket.emit('action', 'city', [evt.target.city, armies]);
	}
}

function on_click_port(evt) {
	if (!game.naval_movement)
		send_action('port', evt.target.port);
	if (game.actions && game.actions.port && game.actions.port.includes(evt.target.port)) {
		let fleets = ui.selected_fleets.length;
		if (fleets > 0) {
			let armies = ui.selected_armies.length;
			socket.emit('action', 'port', [evt.target.port, fleets, armies]);
		}
	}
}

function build_ui() {
	for (let c = 1; c <= 16; ++c) {
		ui.cards[c] = document.getElementById("card_"+c);
		ui.cards[c].card = c;
		ui.cards[c].addEventListener("click", on_card);
		ui.backs[c] = document.getElementById("back_"+c);
	}

	for (let city in CITIES) {
		let info = CITIES[city];
		let e = ui.cities[city] = document.getElementById("city_" + city);
		e.city = city;
		e.addEventListener("mouseenter", on_focus_city);
		e.addEventListener("mouseleave", on_blur);
		e.addEventListener("click", on_click_city);
		e.style.left = Math.round(info.x - info.w/2) + "px";
		e.style.top = Math.round(info.y - info.h/2) + "px";
		e.style.width = info.w + "px";
		e.style.height = info.h + "px";
	}

	for (let port in PORTS) {
		let info = PORTS[port];
		let e = ui.ports[port] = document.getElementById("port_" + port);
		e.port = port;
		e.addEventListener("mouseenter", on_focus_port);
		e.addEventListener("mouseleave", on_blur);
		e.addEventListener("click", on_click_port);
		e.style.left = Math.round(info.x - info.w/2) + "px";
		e.style.top = Math.round(info.y - info.h/2) + "px";
		e.style.width = info.w + "px";
		e.style.height = info.h + "px";
	}

	for (let city in CITIES) {
		ui.greek_army[city] = [];
		ui.greek_fleet[city] = [];
		ui.persian_army[city] = [];
		ui.persian_fleet[city] = [];
	}

	ui.greek_army.reserve = [];
	ui.greek_fleet.reserve = [];
	ui.persian_army.reserve = [];
	ui.persian_fleet.reserve = [];

	ui.greek_army.extra = [];
	ui.greek_fleet.extra = [];
	ui.persian_army.extra = [];
	ui.persian_fleet.extra = [];

	for (let i = 0; i < 9; ++i) {
		let e = document.getElementById("ga"+(i+1));
		e.sort_index = i;
		ui.greek_army.extra.push(e);
		ui.all_armies.push(e);
		e.addEventListener("click", on_click_army);
	}
	for (let i = 0; i < 5; ++i) {
		let e = document.getElementById("gf"+(i+1));
		e.sort_index = i;
		ui.greek_fleet.extra.push(e);
		ui.all_fleets.push(e);
		e.addEventListener("click", on_click_fleet);
	}
	for (let i = 0; i < 24; ++i) {
		let e = document.getElementById("pa"+(i+1));
		e.sort_index = i;
		ui.persian_army.extra.push(e);
		ui.all_armies.push(e);
		e.addEventListener("click", on_click_army);
	}
	for (let i = 0; i < 6; ++i) {
		let e = document.getElementById("pf"+(i+1));
		e.sort_index = i;
		ui.persian_fleet.extra.push(e);
		ui.all_fleets.push(e);
		e.addEventListener("click", on_click_fleet);
	}

	document.getElementById("bridge").addEventListener("click", on_click_bridge);
	document.getElementById("bridge").addEventListener("mouseenter", on_focus_bridge);
	document.getElementById("bridge").addEventListener("mouseleave", on_blur);
}

function greek_info() {
	if (game.g_cards == 1)
		return "1 card in hand";
	return game.g_cards + " cards in hand";
}

function persian_info() {
	if (game.p_cards == 1)
		return "1 card in hand";
	return game.p_cards + " cards in hand";
}

function show_marker(id, class_name, show = 1, enabled = 0) {
	let elt = document.getElementById(id);
	if (show)
		class_name += " show";
	if (enabled)
		class_name += " enabled";
	elt.className = class_name;
}

function on_update(state, player) {
	game = state;
	ui.player = player;

	document.getElementById("greek_info").textContent = greek_info();
	document.getElementById("persian_info").textContent = persian_info();

	if (!game.discard)
		document.getElementById("last_played").className = "card show card_back";
	else
		document.getElementById("last_played").className = "card show card_" + game.discard;

	show_action_button("#button_battle", "battle");
	show_action_button("#button_build", "build");
	show_action_button("#button_destroy", "destroy");
	show_action_button("#button_draw", "draw");
	show_action_button("#button_next", "next");
	show_action_button("#button_pass", "pass");
	show_action_button("#button_undo", "undo");

	show_marker("bridge", "bridge", game.trigger.hellespont, game.actions && game.actions.destroy);
	show_marker("darius", "persian_army", game.trigger.darius);
	show_marker("xerxes", "persian_army", game.trigger.xerxes);
	show_marker("artemisia", "persian_fleet", game.trigger.artemisia);
	show_marker("miltiades", "greek_army", game.trigger.miltiades);
	show_marker("themistocles", "greek_army", game.trigger.themistocles);
	show_marker("leonidas", "greek_army", game.trigger.leonidas);
	show_marker("campaign", "marker campaign_" + game.campaign);
	if (game.vp < 0)
		show_marker("vp", "marker vp_g" + (-game.vp));
	else if (game.vp > 0)
		show_marker("vp", "marker vp_p" + game.vp);
	else
		show_marker("vp", "marker vp_0");

	let hand = game.hand;
	let draw = game.draw;
	for (let c = 1; c <= 16; ++c) {
		ui.cards[c].classList.remove('enabled');
		if (hand && hand.includes(c))
			ui.cards[c].classList.add('show');
		else
			ui.cards[c].classList.remove('show');
		if (c <= draw)
			ui.backs[c].classList.add('show');
		else
			ui.backs[c].classList.remove('show');
	}

	function update_units(index, elements) {
		let overflow = [];
		let extra = elements.extra;

		// remove if too many
		for (let space in game.units) {
			let list = elements[space];
			let n = game.units[space][index] | 0;
			while (list.length > n)
				overflow.push(list.shift());
		}

		// add if not enough
		for (let space in game.units) {
			let list = elements[space];
			let n = game.units[space][index];
			while (list.length < n) {
				if (overflow.length > 0) {
					list.unshift(overflow.pop());
				} else {
					let e = extra.pop();
					e.classList.add("show");
					list.unshift(e);
				}
			}
		}

		// and hide the overflow
		while (overflow.length > 0) {
			let e = overflow.pop();
			e.classList.remove("show");
			extra.push(e);
		}
	}

	update_units(0, ui.greek_army);
	update_units(1, ui.persian_army);
	update_units(2, ui.greek_fleet);
	update_units(3, ui.persian_fleet);

	ui.selected_armies = null;
	if (game.land_movement) {
		if (ui.player == PERSIA)
			ui.selected_armies = ui.persian_army[game.land_movement].slice();
		if (ui.player == GREECE)
			ui.selected_armies = ui.greek_army[game.land_movement].slice();
	}

	ui.selected_fleets = null;
	if (game.naval_movement) {
		if (ui.player == PERSIA) {
			ui.selected_fleets = ui.persian_fleet[game.naval_movement].slice();
			ui.selected_armies = [];
		}
		if (ui.player == GREECE) {
			ui.selected_fleets = ui.greek_fleet[game.naval_movement].slice();
			ui.selected_armies = [];
		}
	}

	for (let city in CITIES)
		ui.cities[city].classList.remove('enabled');
	for (let port in PORTS)
		ui.ports[port].classList.remove('enabled');

	if (game.actions && game.actions.city) {
		for (let city of game.actions.city)
			ui.cities[city].classList.add('enabled');
	}
	if (game.actions && game.actions.port) {
		for (let port of game.actions.port)
			ui.ports[port].classList.add('enabled');
	}

	update_ui();
}

function update_ui() {
	function layout_fleets(a, b, xorig, yorig, wrap) {
		if (a.length + b.length > 0) {
			let w = 26;
			let h = 20;
			let xstep = w + 2;
			let ystep = h + 0;
			let stagger = 14;
			let line, para = [];
			let i = 0, k = 0;
			para.push(line = []);
			for (let e of a) {
				if (i == wrap - k) { para.push(line = []); i = 0; k = 1 - k; }
				line.push(e);
				++i;
			}
			if (i != 0 && b.length > 0) { para.push(line = []); i = 0; k = 1 - k; }
			for (let e of b) {
				if (i == wrap - k) { para.push(line = []); i = 0; k = 1 - k; }
				line.push(e);
				++i;
			}
			let y = yorig - Math.floor(ystep * para.length / 2);
			k = 0;
			let cw = (para.length > 1 ? wrap : para[0].length);
			for (let row = 0; row < para.length; ++row) {
				let x = xorig - Math.floor(xstep * cw / 2) + k * stagger;
				for (let col = 0; col < para[row].length; ++col) {
					para[row][col].style.left = x + "px";
					para[row][col].style.top = y + "px";
					x += xstep;
				}
				y += ystep;
				k = 1 - k;
			}
		}
	}

	function layout_armies(list, xorig, yorig) {
		const dx = 12;
		const dy = 8;
		if (list.length > 0) {
			let ncol = Math.round(Math.sqrt(list.length));
			let nrow = Math.ceil(list.length / ncol);
			function layout_army(row, col, e, z) {
				let x = xorig - (row * dx - col * dx) - 10 + (nrow-ncol) * 6;
				let y = yorig - (row * dy + col * dy) - 13 + (nrow-1) * 8;
				e.style.left = x + "px";
				e.style.top = y + "px";
				e.style.zIndex = z;
			}
			let z = 50;
			let i = 0;
			if (ui.player == GREECE)
				for (let row = nrow-1; row >= 0; --row)
					for (let col = ncol-1; col >= 0 && i < list.length; --col)
						layout_army(row, col, list[i++], z--);
			else
				for (let row = 0; row < nrow; ++row)
					for (let col = 0; col < ncol && i < list.length; ++col)
						layout_army(row, col, list[list.length-(++i)], z--);
		}
	}

	function list_armies(city) {
		let ga = ui.greek_army[city];
		let pa = ui.persian_army[city];
		if (game.transport && game.transport.where == city) {
			if (game.transport.who == GREECE)
				ga = ga.slice(game.transport.count);
			if (game.transport.who == PERSIA)
				pa = pa.slice(game.transport.count);
		}
		if (game.naval_movement) {
			ga = ga.filter(a => !ui.selected_armies.includes(a));
			pa = pa.filter(a => !ui.selected_armies.includes(a));
		}
		return ga.concat(pa);
	}

	layout_fleets(ui.greek_fleet.reserve, [], 95, 150, 5);
	layout_fleets(ui.persian_fleet.reserve, [], 1240-95, 878-150, 6);
	layout_armies(ui.greek_army.reserve, 80, 220);
	layout_armies(ui.persian_army.reserve, 1240-80, 878-220)

	for (let port in PORTS)
		layout_fleets(ui.greek_fleet[port], ui.persian_fleet[port],
			PORTS[port].layout_x, PORTS[port].layout_y, PORTS[port].wrap);

	for (let city in CITIES)
		layout_armies(list_armies(city),
			CITIES[city].x, CITIES[city].y);

	function layout_transport(a, f) {
		a.style.left = (parseInt(f.style.left) + 13 - 11) + "px";
		if (ui.player == GREECE)
			a.style.top = (parseInt(f.style.top) + 10 - 13 + 10) + "px";
		else
			a.style.top = (parseInt(f.style.top) + 10 - 13 - 10) + "px";
		a.style.zIndex = 2;
	}

	if (game.transport) {
		let city = game.transport.where;
		let alist = (game.transport.who == GREECE ? ui.greek_army : ui.persian_army)[city];
		let flist = (game.transport.who == GREECE ? ui.greek_fleet : ui.persian_fleet)[city];
		for (let i = 0; i < game.transport.count; ++i)
			layout_transport(alist[i], flist[i]);
	}
	if (game.naval_movement) {
		for (let i = 0; i < ui.selected_armies.length; ++i)
			layout_transport(ui.selected_armies[i], ui.selected_fleets[i]);
	}

	for (let e of ui.all_armies)
		if (ui.selected_armies && ui.selected_armies.includes(e))
			e.classList.add("selected");
		else
			e.classList.remove("selected");

	for (let e of ui.all_fleets)
		if (ui.selected_fleets && ui.selected_fleets.includes(e))
			e.classList.add("selected");
		else
			e.classList.remove("selected");
}

function on_destroy() { if (game.actions) { send_action('destroy', null); } }
function on_battle() { if (game.actions) { send_action('battle', null); } }
function on_build() { if (game.actions) { send_action('build', null); } }
function on_draw() { if (game.actions) { send_action('draw', null); } }
function on_next() { if (game.actions) { send_action('next', null); } }
function on_pass() { if (game.actions) { send_action('pass', null); } }
function on_undo() { if (game.actions) { send_action('undo', null); } }

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
function on_card_move() {
	send_action('card_move', current_popup_card);
	hide_popup_menu();
}

function is_card_action(action, card) {
	return game.actions && game.actions[action] && game.actions[action].includes(card);
}

function on_card(evt) {
	if (game.actions) {
		let card = evt.target.card;
		if (is_card_action('discard', card)) {
			send_action('discard', card);
		} else {
			let menu = [];
			if (is_card_action('card_event', card))
				menu.push('card_event');
			if (is_card_action('card_move', card))
				menu.push('card_move');
			if (menu.length > 0) {
				current_popup_card = card;
				show_popup_menu(evt, menu);
			}
		}
	}
}

function toggle_markers() {
	document.querySelector(".map").classList.toggle("hide_markers");
}

ui.player = new URLSearchParams(window.location.search).get("role");
if (ui.player == GREECE)
	document.getElementById("map").classList.add("greek");

build_ui();
scroll_with_middle_mouse(".grid_center", 2);
init_client(["Greece", "Persia"]);
