"use strict";

const LANCASTER = "Lancaster";
const YORK = "York";
const REBEL = "Rebel";
const ENEMY = { York: "Lancaster", Lancaster: "York" }

const POOL = "Pool";
const MINOR = "Minor";

const KING_TEXT = "\u2756";
const PRETENDER_TEXT = "";

const LONG_NAME = {
	"Somerset": "Duke of Somerset",
	"Exeter": "Duke of Exeter",
	"Devon": "Earl of Devon",
	"Pembroke": "Earl of Pembroke",
	"Wiltshire": "Earl of Wiltshire",
	"Oxford": "Earl of Oxford",
	"Beaumont": "Viscount Beaumont",
	"Clifford": "Lord Clifford",
	"Buckingham": "Duke of Buckingham",
	"Northumberland": "Earl of Northumberland",
	"Shrewsbury": "Earl of Shrewsbury",
	"Westmoreland": "Earl of Westmoreland",
	"Rivers": "Lord Rivers",
	"Stanley": "Lord Stanley",
	"Richmond": "Earl of Richmond",
	"York": "Duke of York",
	"Rutland": "Earl of Rutland",
	"March": "Earl of March",
	"Warwick": "Earl of Warwick",
	"Salisbury": "Earl of Salisbury",
	"Kent": "Earl of Kent",
	"Norfolk": "Duke of Norfolk",
	"Suffolk": "Duke of Suffolk",
	"Arundel": "Earl of Arundel",
	"Essex": "Earl of Essex",
	"Worcester": "Earl of Worcester",
	"Hastings": "Lord Hastings",
	"Herbert": "Lord Herbert",
	"Clarence": "Duke of Clarence",
	"Gloucester": "Duke of Gloucester",
}

function toggle_blocks() {
	document.getElementById("map").classList.toggle("hide_blocks");
}

let ui = {
	cards: {},
	areas: {},
	known: {},
	secret: { Lancaster: {}, York: {}, Rebel: {} },
	battle_menu: {},
	battle_block: {},
	present: new Set(),
}

function on_focus_area(evt) {
	let where = evt.target.area;
	let text = where;
	if (AREAS[where].city)
		text += " (" + AREAS[where].city + ")";
	if (AREAS[where].crown)
		text += " - Crown"; // " \u2655";
	if (where == "South Yorks" || where == "Kent")
		text += " - Church"; // " -" \u2657";
	if (AREAS[where].major_port)
		text += " - Port";
	if (AREAS[where].shields.length > 0)
		text += " - " + AREAS[where].shields.join(", ");
	document.getElementById("status").textContent = text;
}

function on_blur_area(evt) {
	document.getElementById("status").textContent = "";
}

function on_click_area(evt) {
	let where = evt.target.area;
	send_action('area', where);
}

const STEP_TEXT = [ 0, "I", "II", "III", "IIII" ];
const HEIR_TEXT = [ 0, '\u00b9', '\u00b2', '\u00b3', '\u2074', '\u2075' ];

function block_name(who) {
	if (!who) return "Nobody";
	let name = BLOCKS[who].name;
	let long_name = LONG_NAME[name];
	return long_name ? long_name : name;
}

function block_owner(who) {
	if (who == REBEL)
		return BLOCKS[game.pretender].owner;
	return BLOCKS[who].owner;
}

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
	let text = block_name(b) + " ";
	if (BLOCKS[b].type == 'heir')
		text += "H" + HEIR_TEXT[BLOCKS[b].heir] + "-";
	if (BLOCKS[b].loyalty)
		text += BLOCKS[b].loyalty + "-";
	else if (BLOCKS[b].type == 'nobles')
		text += "\u2740-";
	text += STEP_TEXT[s] + "-" + BLOCKS[b].combat;
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
	if (is_battle_reserve(b, game.battle.LR))
		msg = "Lancaster Reserve";
	if (is_battle_reserve(b, game.battle.YR))
		msg = "York Reserve";

	if (game.actions && game.actions.battle_fire && game.actions.battle_fire.includes(b))
		msg = "Fire with " + msg;
	else if (game.actions && game.actions.battle_retreat && game.actions.battle_retreat.includes(b))
		msg = "Retreat with " + msg;
	else if (game.actions && game.actions.battle_charge && game.actions.battle_charge.includes(b))
		msg = "Charge " + msg;
	else if (game.actions && game.actions.battle_treachery && game.actions.battle_treachery.includes(b))
		msg = "Attempt treachery on " + msg;
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

function on_focus_battle_charge(evt) {
	if (block_owner(evt.target.block) == game.active)
		document.getElementById("status").textContent =
			"Charge with " + block_name(evt.target.block);
	else
		document.getElementById("status").textContent =
			"Charge " + block_name(evt.target.block);
}

function on_focus_battle_treachery(evt) {
	if (block_owner(evt.target.block) == game.active)
		document.getElementById("status").textContent =
			"Attempt treachery with " + block_name(evt.target.block);
	else
		document.getElementById("status").textContent =
			"Attempt treachery on " + block_name(evt.target.block);
}

function on_blur_battle_button(evt) {
	document.getElementById("status").textContent = "";
}

function on_click_battle_hit(evt) { send_action('battle_hit', evt.target.block); }
function on_click_battle_fire(evt) { send_action('battle_fire', evt.target.block); }
function on_click_battle_retreat(evt) { send_action('battle_retreat', evt.target.block); }
function on_click_battle_pass(evt) { send_action('battle_pass', evt.target.block); }
function on_click_battle_charge(evt) { send_action('battle_charge', evt.target.block); }
function on_click_battle_treachery(evt) { send_action('battle_treachery', evt.target.block); }

function on_click_card(evt) {
	let c = evt.target.id.split("+")[1] | 0;
	send_action('play', c);
}

function on_button_undo(evt) {
	send_action('undo');
}

function on_button_pass(evt) {
	send_action('pass');
}

function on_button_end_action_phase(evt) {
	send_action('end_action_phase');
}

function on_button_end_supply_phase(evt) {
	send_action('end_supply_phase');
}

function on_button_end_political_turn(evt) {
	send_action('end_political_turn');
}

function on_button_end_exile_limits(evt) {
	send_action('end_exile_limits');
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

function on_button_treachery(evt) {
	send_action('treachery');
}

function on_button_execute_clarence(evt) {
	send_action('execute_clarence');
}

function on_button_execute_exeter(evt) {
	send_action('execute_exeter');
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

	build_battle_button(menu_list, b, "treachery",
		on_click_battle_treachery, on_focus_battle_treachery,
		"/images/rose.svg");
	build_battle_button(menu_list, b, "charge",
		on_click_battle_charge, on_focus_battle_charge,
		"/images/mounted-knight.svg");
	build_battle_button(menu_list, b, "hit",
		on_click_battle_hit, on_focus_battle_hit,
		"/images/cross-mark.svg");

	// menu_list.appendChild(document.createElement("br"));

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
	let element;

	ui.blocks_element = document.getElementById("blocks");
	ui.offmap_element = document.getElementById("offmap");

	for (let c = 1; c <= 25; ++c) {
		ui.cards[c] = document.getElementById("card+"+c);
		ui.cards[c].addEventListener("click", on_click_card);
	}

	for (let name in AREAS) {
		let area = AREAS[name];
		element = document.getElementById("svgmap").getElementById("area_"+name.replace(/ /g, "_"));
		if (element) {
			element.area = name;
			element.addEventListener("mouseenter", on_focus_area);
			element.addEventListener("mouseleave", on_blur_area);
			element.addEventListener("click", on_click_area);
			ui.areas[name] = element;
		}
		ui.secret.Lancaster[name] = [];
		ui.secret.York[name] = [];
		ui.secret.Rebel[name] = [];
	}
	ui.secret.Lancaster.offmap = [];
	ui.secret.York.offmap = [];
	ui.secret.Rebel.offmap = [];

	for (let b in BLOCKS) {
		let block = BLOCKS[b];
		build_battle_block(b, block);
		ui.known[b] = build_known_block(b, block);
		ui.secret[BLOCKS[b].owner].offmap.push(build_secret_block(b, block));
	}
}

function update_steps(b, steps, element) {
	element.classList.remove("r1");
	element.classList.remove("r2");
	element.classList.remove("r3");
	element.classList.add("r"+(BLOCKS[b].steps - steps));
}

function layout_blocks(area, secret, known) {
	let wrap = AREAS[area].wrap;
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

	if (AREAS[area].layout_minor > 0.5)
		rows.reverse();

	for (let j = 0; j < rows.length; ++j)
		for (i = 0; i < rows[j].length; ++i)
			position_block(area, j, rows.length, i, rows[j].length, rows[j][i]);
}

function position_block(area, row, n_rows, col, n_cols, element) {
	let space = AREAS[area];
	let block_size = 60+6;
	let padding = 4;
	let offset = block_size + padding;
	let row_size = (n_rows-1) * offset;
	let col_size = (n_cols-1) * offset;
	let x = space.x - block_size/2;
	let y = space.y - block_size/2;

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

function update_map() {
	let overflow = { Lancaster: [], York: [], Rebel: [] };
	let layout = {};

	document.getElementById("turn").textContent =
		"Campaign " + game.campaign +
		"\nKing: " + block_name(game.king) +
		"\nPretender: " + block_name(game.pretender);

	for (let area in AREAS)
		layout[area] = { secret: [], known: [] };

	// Move secret blocks to overflow queue if there are too many in a area
	for (let area in AREAS) {
		for (let color of [LANCASTER, YORK, REBEL]) {
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
		for (let color of [LANCASTER, YORK, REBEL]) {
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
	for (let color of [LANCASTER, YORK, REBEL]) {
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
		for (let color of [LANCASTER, YORK, REBEL]) {
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

			show_block(element);
			layout[area].known.push(element);
			update_steps(b, steps, element);

			if (moved)
				element.classList.add("moved");
			else
				element.classList.remove("moved");
		}
	}

	// Layout blocks on map
	for (let area in AREAS)
		layout_blocks(area, layout[area].secret, layout[area].known);

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

	if (!game.l_card)
		document.querySelector("#lancaster_card").className = "small_card card_back";
	else
		document.querySelector("#lancaster_card").className = "small_card " + CARDS[game.l_card].image;
	if (!game.y_card)
		document.querySelector("#york_card").className = "small_card card_back";
	else
		document.querySelector("#york_card").className = "small_card " + CARDS[game.y_card].image;
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
			ui.battle_menu[block].classList.remove('fire');
			ui.battle_menu[block].classList.remove('retreat');
			ui.battle_menu[block].classList.remove('pass');
			ui.battle_menu[block].classList.remove('charge');
			ui.battle_menu[block].classList.remove('treachery');

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

	if (player == LANCASTER) {
		fill_cell("FR", game.battle.LR, true);
		fill_cell("FA", game.battle.LA, false);
		fill_cell("FB", game.battle.LB, false);
		fill_cell("FC", game.battle.LC, false);
		fill_cell("FD", game.battle.LD, false);
		fill_cell("EA", game.battle.YA, false);
		fill_cell("EB", game.battle.YB, false);
		fill_cell("EC", game.battle.YC, false);
		fill_cell("ED", game.battle.YD, false);
		fill_cell("ER", game.battle.YR, true);
	} else {
		fill_cell("ER", game.battle.LR, true);
		fill_cell("EA", game.battle.LA, false);
		fill_cell("EB", game.battle.LB, false);
		fill_cell("EC", game.battle.LC, false);
		fill_cell("ED", game.battle.LD, false);
		fill_cell("FA", game.battle.YA, false);
		fill_cell("FB", game.battle.YB, false);
		fill_cell("FC", game.battle.YC, false);
		fill_cell("FD", game.battle.YD, false);
		fill_cell("FR", game.battle.YR, true);
	}
}

function on_update() {
	show_action_button("#undo_button", "undo");
	show_action_button("#pass_button", "pass");
	show_action_button("#end_action_phase_button", "end_action_phase");
	show_action_button("#end_supply_phase_button", "end_supply_phase");
	show_action_button("#end_political_turn_button", "end_political_turn");
	show_action_button("#end_exile_limits_button", "end_exile_limits");
	show_action_button("#end_regroup_button", "end_regroup");
	show_action_button("#end_retreat_button", "end_retreat");
	show_action_button("#eliminate_button", "eliminate");
	show_action_button("#execute_clarence_button", "execute_clarence");
	show_action_button("#execute_exeter_button", "execute_exeter");

	let king = block_owner(game.king);
	document.getElementById("lancaster_vp").textContent = (king == LANCASTER ? KING_TEXT : PRETENDER_TEXT);
	document.getElementById("york_vp").textContent = (king == YORK ? KING_TEXT : PRETENDER_TEXT);

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

drag_element_with_mouse(".battle", ".battle_header");
scroll_with_middle_mouse(".grid_center", 2);
init_map_zoom();
init_shift_zoom();
init_client(["Lancaster", "York"]);
