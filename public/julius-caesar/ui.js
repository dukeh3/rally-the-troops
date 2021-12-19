"use strict";

const CLEOPATRA = "Cleopatra";
const DEAD = "Dead";
const LEVY = "Levy";
const ENEMY = { "Caesar": "Pompeius", "Pompeius": "Caesar" };

let label_style = window.localStorage['julius-caesar/label-style'] || 'columbia';
let label_layout = window.localStorage['julius-caesar/label-layout'] || 'spread';

function toggle_blocks() {
	document.getElementById("blocks").classList.toggle("hide_blocks");
}

function set_simple_labels() {
	label_style = 'simple';
	document.querySelector(".blocks").classList.remove("columbia-labels");
	document.querySelector(".battle").classList.remove("columbia-labels");
	document.querySelector(".blocks").classList.add("simple-labels");
	document.querySelector(".battle").classList.add("simple-labels");
	window.localStorage['julius-caesar/label-style'] = label_style;
	update_map();
}

function set_columbia_labels() {
	label_style = 'columbia';
	document.querySelector(".blocks").classList.remove("simple-labels");
	document.querySelector(".battle").classList.remove("simple-labels");
	document.querySelector(".blocks").classList.add("columbia-labels");
	document.querySelector(".battle").classList.add("columbia-labels");
	window.localStorage['julius-caesar/label-style'] = label_style;
	update_map();
}

function set_spread_layout() {
	label_layout = 'spread';
	window.localStorage['julius-caesar/label-layout'] = label_layout;
	update_map();
}

function set_stack_layout() {
	label_layout = 'stack';
	window.localStorage['julius-caesar/label-layout'] = label_layout;
	update_map();
}

// Levy and hit animations for 'simple' blocks.
const step_down_animation = [
		{ transform: 'translateY(0px)' },
		{ transform: 'translateY(10px)' },
		{ transform: 'translateY(0px)' },
];
const step_up_animation = [
		{ transform: 'translateY(0px)' },
		{ transform: 'translateY(-10px)' },
		{ transform: 'translateY(0px)' },
];

let ui = {
	spaces: {},
	known: {},
	secret: {
		Caesar: { offmap: [] },
		Pompeius: { offmap: [] },
		Cleopatra: { offmap: [] },
	},
	seen: new Set(),
	present: new Set(),
	battle_block: {},
	battle_menu: {},
	map_steps: {},
	map_location: {},
	battle_steps: {},
	cards: {},
};

create_log_entry = function (text) {
	let p = document.createElement("div");
	text = text.replace(/&/g, "&amp;");
	text = text.replace(/</g, "&lt;");
	text = text.replace(/>/g, "&gt;");

	text = text.replace(/\u2192 /g, "\u2192\xa0");
	text = text.replace(/Mare /g, "Mare\xa0");

	text = text.replace(/^([A-Z]):/, '<span class="$1"> $1 </span>');

	if (text.match(/^~ .* ~$/))
		p.className = 'br', text = text.substring(2, text.length-2);
	else if (text.match(/^Start Caesar turn/))
		p.className = 'C';
	else if (text.match(/^Start Pompeius turn/))
		p.className = 'P';
	else if (text.match(/^Start /))
		p.className = 'st';
	else if (text.match(/^Battle in/))
		p.className = 'bs';

	if (text.match(/^Start /))
		text = text.substring(6);

	p.innerHTML = text;
	return p;
}

const STEPS = [ 0, "I", "II", "III", "IIII" ];

function block_description(b) {
	let s = ui.map_steps[b] || ui.battle_steps[b];
	let c = BLOCKS[b].initiative + BLOCKS[b].firepower;
	let levy = BLOCKS[b].levy;
	if (levy)
		return BLOCKS[b].name + " (" + levy + ") " + STEPS[s] + "-" + c;
	return BLOCKS[b].name + " " + STEPS[s] + "-" + c;
}

function block_name(b) {
	return BLOCKS[b].name;
}

function on_focus_space(evt) {
	document.getElementById("status").textContent = evt.target.space;
}

function on_blur_space(evt) {
	document.getElementById("status").textContent = "";
}

function on_focus_block(evt) {
	document.getElementById("status").textContent = block_description(evt.target.block);
}

function on_blur_block(evt) {
	document.getElementById("status").textContent = "";
}

function on_focus_battle_block(evt) {
	let b = evt.target.block;
	let msg = block_name(b);
	if (!evt.target.classList.contains("known"))
		document.getElementById("status").textContent = "Reserves";

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

function build_map() {
	// These must match up with the sizes in play.html
	const city_size = 60+10;
	const sea_size = 70+10;

	for (let s in SPACES) {
		let space = SPACES[s];
		let element = document.createElement("div");
		element.classList.add("space");
		let size = (space.type === 'sea') ? sea_size : city_size;
		if (space.type === "sea")
			element.classList.add("sea");
		else
			element.classList.add("city");
		element.setAttribute("draggable", "false");
		element.addEventListener("mouseenter", on_focus_space);
		element.addEventListener("mouseleave", on_blur_space);
		element.addEventListener("click", select_space);
		element.style.left = (space.x - size/2) + "px";
		element.style.top = (space.y - size/2) + "px";
		if (space.type !== 'pool')
			document.getElementById("spaces").appendChild(element);
		element.space = s;
		ui.spaces[s] = element;

		ui.secret[CLEOPATRA][s] = [];
		ui.secret[CAESAR][s] = [];
		ui.secret[POMPEIUS][s] = [];
	}

	function build_known_block(b, block, color) {
		let element = document.createElement("div");
		element.classList.add("block");
		element.classList.add("known");
		element.classList.add(color);
		element.classList.add("block_"+block.label);
		element.addEventListener("mouseenter", on_focus_block);
		element.addEventListener("mouseleave", on_blur_block);
		element.addEventListener("click", on_click_map_block);
		document.getElementById("known_blocks").appendChild(element);
		element.style.visibility = 'hidden';
		element.block = b;
		ui.known[b] = element;
	}

	function build_secret_block(b, block, color) {
		let element = document.createElement("div");
		element.secret_index = ui.secret[color].offmap.length;
		element.classList.add("block");
		element.classList.add("secret");
		element.classList.add(color);
		element.addEventListener("click", select_secret_block);
		document.getElementById("secret_blocks").appendChild(element);
		element.style.visibility = 'hidden';
		element.owner = BLOCKS[b].owner;
		ui.secret[color].offmap.unshift(element);
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

	function build_battle_block(b, block, color) {
		let element = document.createElement("div");
		element.classList.add("block");
		element.classList.add("known");
		element.classList.add(color);
		element.classList.add("block_"+block.label);
		element.addEventListener("mouseenter", on_focus_battle_block);
		element.addEventListener("mouseleave", on_blur_battle_block);
		element.addEventListener("click", on_click_battle_block);
		element.block = b;
		ui.battle_block[b] = element;

		let action_list = document.createElement("div");
		action_list.classList.add("battle_menu_list");
		action_list.appendChild(element);
		build_battle_button(action_list, b, "hit",
			select_battle_hit, on_focus_battle_hit,
			"/images/cross-mark.svg");
		build_battle_button(action_list, b, "fire",
			select_battle_fire, on_focus_battle_fire,
			"/images/pointy-sword.svg");
		build_battle_button(action_list, b, "retreat",
			select_battle_retreat, on_focus_battle_retreat,
			"/images/flying-flag.svg");
		build_battle_button(action_list, b, "pass",
			select_battle_pass, on_focus_battle_pass,
			"/images/sands-of-time.svg");

		let menu = document.createElement("div");
		menu.classList.add("battle_menu");
		menu.appendChild(element);
		menu.appendChild(action_list);
		ui.battle_menu[b] = menu;
	}

	for (let b in BLOCKS) {
		let block = BLOCKS[b];
		let color = (block.name === "Cleopatra" ? "Cleopatra" : block.owner);
		build_known_block(b, block, color);
		build_secret_block(b, block, color);
		build_battle_block(b, block, color);
	}

	for (let c = 1; c <= 27; ++c) {
		ui.cards[c] = document.getElementById("card+" + c);
	}
}

function update_steps(memo, block, steps, element, animate) {
	let old_steps = memo[block] || steps;
	memo[block] = steps;

	if (label_style === 'simple' && steps !== old_steps && animate) {
		let options = { duration: 700, easing: 'ease', iterations: Math.abs(steps-old_steps) }
		if (steps < old_steps)
			element.animate(step_down_animation, options);
		if (steps > old_steps)
			element.animate(step_up_animation, options);
	}

	element.classList.remove("r0");
	element.classList.remove("r1");
	element.classList.remove("r2");
	element.classList.remove("r3");
	element.classList.add("r"+(BLOCKS[block].steps - steps));
}

function layout_blocks(location, secret, known) {
	if (label_layout === 'spread' || (location === LEVY || location === DEAD))
		layout_blocks_spread(location, secret, known);
	else
		layout_blocks_stacked(location, secret, known);
}

function layout_blocks_spread(location, secret, known) {
	let wrap = SPACES[location].wrap;
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
		if (i === wrap)
			new_line();
		row.push(secret.shift());
		++i;
	}

	// Break early if secret and known fit in exactly two rows and more than two blocks.
	if (s > 0 && s <= wrap && k > 0 && k <= wrap && n > 2)
		new_line();

	while (known.length > 0) {
		if (i === wrap)
			new_line();
		row.push(known.shift());
		++i;
	}

	if (SPACES[location].layout_minor > 0.5)
		rows.reverse();

	for (let j = 0; j < rows.length; ++j)
		for (i = 0; i < rows[j].length; ++i)
			position_block_spread(location, j, rows.length, i, rows[j].length, rows[j][i]);
}

function position_block_spread(location, row, n_rows, col, n_cols, element) {
	let space = SPACES[location];
	let block_size = (label_style === 'columbia') ? 56+6 : 48+4;
	let padding = (location === LEVY || location === DEAD) ? 6 : 3;
	let offset = block_size + padding;
	let row_size = (n_rows-1) * offset;
	let col_size = (n_cols-1) * offset;
	let x = space.x - block_size/2;
	let y = space.y - block_size/2;

	if (space.layout_axis === 'X') {
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

function layout_blocks_stacked(location, secret, known) {
	let s = secret.length;
	let k = known.length;
	let n = s + k;
	let i = 0;
	while (secret.length > 0)
		position_block_stacked(location, i++, n, secret.shift());
	while (known.length > 0)
		position_block_stacked(location, i++, n, known.shift());
}

function position_block_stacked(location, i, n, element) {
	let space = SPACES[location];
	let block_size = (label_style === 'columbia') ? 56+6 : 48+4;
	let x = space.x - block_size/2 - (n-1) * 9 + i * 18;
	let y = space.y - block_size/2 - (n-1) * 9 + i * 18;
	element.style.left = x+"px";
	element.style.top = y+"px";
}

function sort_secret(a,b) {
	return a.secret_index - b.secret_index;
}

function update_map() {
	let overflow = { Caesar: [], Pompeius: [], Cleopatra: [] };
	let layout = {};

	for (let s in SPACES)
		layout[s] = { Caesar: [], Pompeius: [] };

	// Move secret blocks to overflow queue if there are too many in a location
	for (let s in SPACES) {
		for (let color of [CAESAR, POMPEIUS, CLEOPATRA]) {
			let max = 0;
			if (game.secret[color] && game.secret[color][s])
				max = game.secret[color][s].length;
			while (ui.secret[color][s].length > max)
				overflow[color].push(ui.secret[color][s].pop());
		}
	}

	// Add secret blocks if there are too few in a location
	for (let s in SPACES) {
		for (let color of [CAESAR, POMPEIUS, CLEOPATRA]) {
			let max = 0;
			if (game.secret[color] && game.secret[color][s])
				max = game.secret[color][s].length;
			while (ui.secret[color][s].length < max) {
				if (overflow[color].length > 0) {
					ui.secret[color][s].push(overflow[color].pop());
				} else {
					let element = ui.secret[color].offmap.pop();
					element.style.visibility = 'visible';
					ui.secret[color][s].push(element);
				}
			}
		}
	}

	// Remove any blocks left in the overflow queue
	for (let color of [CAESAR, POMPEIUS, CLEOPATRA]) {
		while (overflow[color].length > 0) {
			let element = overflow[color].pop();
			element.style.visibility = 'hidden';
			// Prevent move animation when blocks are revived.
			element.style.left = null;
			element.style.top = null;
			ui.secret[color].offmap.push(element);
		}
	}

	// Hide formerly known blocks
	for (let b in BLOCKS) {
		if (!(b in game.known)) {
			ui.known[b].style.visibility = 'hidden';
			// Prevent move animation when blocks are revived.
			ui.known[b].style.left = null;
			ui.known[b].style.top = null;
		}
	}

	// Add secret blocks to layout
	for (let color in game.secret) {
		for (let location in game.secret[color]) {
			let i = 0;
			for (let [moved, jupiter] of game.secret[color][location]) {
				let element = ui.secret[color][location][i++];
				if (moved)
					element.classList.add('moved');
				else
					element.classList.remove('moved');
				if (jupiter)
					element.classList.add('jupiter');
				else
					element.classList.remove('jupiter');
				if (color === game.mars && location === game.surprise)
					element.classList.add("mars");
				else
					element.classList.remove("mars");
				if (color === game.neptune && location === game.surprise)
					element.classList.add("neptune");
				else
					element.classList.remove("neptune");
				let owner = color;
				if (owner === CLEOPATRA)
					owner = POMPEIUS;
				if (jupiter)
					owner = ENEMY[owner];
				layout[location][owner].push(element);
				element.style.visibility = 'visible';
			}
		}
	}

	// Add known blocks to layout
	for (let block in game.known) {
		let element = ui.known[block];
		let location = game.known[block][0];
		let steps = game.known[block][1];
		let moved = game.known[block][2];
		let jupiter = game.known[block][3];
		let color = BLOCKS[block].owner;
		if (jupiter)
			color = ENEMY[color];

		element.style.visibility = 'visible';

		layout[location][color].push(element);

		let old_location = ui.map_location[block];
		update_steps(ui.map_steps, block, steps, element, location === old_location);
		ui.map_location[block] = location;

		if (moved || (location === DEAD && BLOCKS[block].type !== 'leader'))
			element.classList.add("moved");
		else
			element.classList.remove("moved");
		if (jupiter)
			element.classList.add("jupiter");
		else
			element.classList.remove("jupiter");

		ui.seen.add(block);
	}

	// Layout blocks on map
	for (let location in SPACES)
		layout_blocks(location, layout[location].Caesar, layout[location].Pompeius);

	// Mark selections and highlights

	for (let where in SPACES) {
		if (ui.spaces[where]) {
			ui.spaces[where].classList.remove('highlight');
			ui.spaces[where].classList.remove('where');
		}
	}
	if (game.actions && game.actions.space)
		for (let where of game.actions.space)
			ui.spaces[where].classList.add('highlight');
	if (game.where)
		ui.spaces[game.where].classList.add('where');

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

	for (let o in ui.secret) {
		for (let s in ui.secret[o]) {
			if (game.actions && game.actions.secret && game.actions.secret.includes(s)) {
				for (let e of ui.secret[o][s])
					e.classList.add("highlight");
			} else {
				for (let e of ui.secret[o][s])
					e.classList.remove("highlight");
			}
		}
	}
}

function update_battle() {
	function fill_cell(name, list, reserve) {
		let cell = window[name];

		ui.present.clear();

		for (let [block, steps, moved] of list) {
			ui.seen.add(block);
			ui.present.add(block);

			if (block === game.who)
				ui.battle_menu[block].classList.add("selected");
			else
				ui.battle_menu[block].classList.remove("selected");

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

			update_steps(ui.battle_steps, block, steps, ui.battle_block[block], true);
			if (reserve)
				ui.battle_block[block].classList.add("secret");
			else
				ui.battle_block[block].classList.remove("secret");
			if (moved || reserve)
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

	if (player === CAESAR) {
		fill_cell("FR", game.battle.CR, true);
		fill_cell("FA", game.battle.CA, false);
		fill_cell("FB", game.battle.CB, false);
		fill_cell("FC", game.battle.CC, false);
		fill_cell("FD", game.battle.CD, false);
		fill_cell("EA", game.battle.PA, false);
		fill_cell("EB", game.battle.PB, false);
		fill_cell("EC", game.battle.PC, false);
		fill_cell("ED", game.battle.PD, false);
		fill_cell("ER", game.battle.PR, true);
	} else {
		fill_cell("ER", game.battle.CR, true);
		fill_cell("EA", game.battle.CA, false);
		fill_cell("EB", game.battle.CB, false);
		fill_cell("EC", game.battle.CC, false);
		fill_cell("ED", game.battle.CD, false);
		fill_cell("FA", game.battle.PA, false);
		fill_cell("FB", game.battle.PB, false);
		fill_cell("FC", game.battle.PC, false);
		fill_cell("FD", game.battle.PD, false);
		fill_cell("FR", game.battle.PR, true);
	}
}

function update_card_display(element, card, prior_card) {
	if (!card && !prior_card) {
		element.className = "small_card card_back";
	} else if (prior_card) {
		element.className = "small_card prior card_" + CARDS[prior_card].image;
	} else {
		element.className = "small_card card_" + CARDS[card].image;
	}
}

function update_cards() {
	update_card_display(document.getElementById("caesar_card"), game.c_card, game.prior_c_card);
	update_card_display(document.getElementById("pompeius_card"), game.p_card, game.prior_p_card);

	for (let c = 1; c <= 27; ++c) {
		let element = ui.cards[c];
		if (game.hand.includes(c)) {
			element.classList.add("show");
			if (game.actions && game.actions.card) {
				if (game.actions.card.includes(c)) {
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

function on_update() {
	document.getElementById("turn").className = "year_" + game.year;
	document.getElementById("caesar_vp").textContent = game.c_vp + " VP";
	document.getElementById("pompeius_vp").textContent = game.p_vp + " VP";
	if (game.turn < 1)
		document.querySelector(".turn_info").textContent = `Year ${game.year}`;
	else
		document.querySelector(".turn_info").textContent = `Turn ${game.turn} of Year ${game.year}`;

	show_action_button("#undo_button", "undo");
	show_action_button("#surprise_button", "surprise");
	show_action_button("#pass_button", "pass", true);

	ui.seen.clear();

	update_cards();
	update_map();

	for (let b in BLOCKS)
		if (!ui.seen.has(b))
			ui.map_steps[b] = 0;

	ui.seen.clear();

	if (game.battle) {
		document.querySelector(".battle_header").textContent = game.battle.title;
		document.querySelector(".battle_message").textContent = game.battle.flash;
		document.querySelector(".battle").classList.add("show");
		update_battle();
	} else {
		document.querySelector(".battle").classList.remove("show");
	}

	for (let b in BLOCKS)
		if (!ui.seen.has(b))
			ui.battle_steps[b] = 0;
}

function select_card(c) {
	send_action('card', c);
}

function select_space(evt) {
	send_action('space', evt.target.space);
}

function on_click_battle_block(evt) {
	send_action('block', evt.target.block);
}

function on_click_map_block(evt) {
	if (!game.battle)
		send_action('block', evt.target.block);
}

function select_secret_block(evt) {
	let element = evt.target;
	let owner = null;
	let where = null;
	for (let o in ui.secret) {
		for (let s in ui.secret[o]) {
			if (ui.secret[o][s].includes(element)) {
				owner = o;
				where = s;
				break;
			}
		}
	}
	if (game.actions && game.actions.secret && game.actions.secret.includes(where)) {
		socket.emit('action', 'secret', [where, owner]);
		game.actions = null;
	}
}

function select_surprise() { send_action('surprise'); }
function select_pass() { send_action('pass'); }
function select_undo() { send_action('undo'); }

function select_battle_hit(evt) { send_action('battle_hit', evt.target.block); }
function select_battle_fire(evt) { send_action('battle_fire', evt.target.block); }
function select_battle_retreat(evt) { send_action('battle_retreat', evt.target.block); }

function select_battle_pass(evt) {
	if (window.confirm("Are you sure that you want to PASS with " + block_name(evt.target.block) + "?"))
		send_action('battle_pass', evt.target.block);
}


build_map();

document.querySelector(".blocks").classList.add(label_style+'-labels');
document.querySelector(".battle").classList.add(label_style+'-labels');

drag_element_with_mouse(".battle", ".battle_header");
scroll_with_middle_mouse(".grid_center");
init_map_zoom();
init_shift_zoom();
init_client([ "Caesar", "Pompeius" ]);
