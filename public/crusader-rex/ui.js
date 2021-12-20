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

const KINGDOM = {
	"Syria": "Syria",
	"Jerusalem": "Kingdom of Jerusalem",
	"Antioch": "Principality of Antioch",
	"Tripoli": "County of Tripoli",
};

const VICTORY_TOWNS = [
	"Aleppo", "Damascus", "Egypt",
	"Antioch", "Tripoli", "Acre", "Jerusalem"
];

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

let ui = {
	cards: {},
	towns: {},
	blocks: {},
	battle_menu: {},
	battle_block: {},
	present: new Set(),
}

create_log_entry = function (text) {
	let p = document.createElement("div");
	text = text.replace(/&/g, "&amp;");
	text = text.replace(/</g, "&lt;");
	text = text.replace(/>/g, "&gt;");

	text = text.replace(/\u2192 /g, "\u2192\xa0");

	text = text.replace(/^([A-Z]):/, '<span class="$1"> $1 </span>');

	if (text.match(/^~ .* ~$/))
		p.className = 'br', text = text.substring(2, text.length-2);
	else if (text.match(/^Start Frank turn/))
		p.className = 'F';
	else if (text.match(/^Start Saracen turn/))
		p.className = 'S';
	else if (text.match(/^Start /))
		p.className = 'st';
	else if (text.match(/^(Battle in)/))
		p.className = 'bs';

	if (text.match(/^Start /))
		text = text.substring(6);

	p.innerHTML = text;
	return p;
}

function on_focus_town(evt) {
	let where = evt.target.town;
	let text = where;
	if (where in SHIELDS)
		text += " \u2014 " + SHIELDS[where].join(", ");
	let kingdom = KINGDOM[TOWNS[where].region];
	if (kingdom)
		text += " \u2014 " + kingdom;
	if (VICTORY_TOWNS.includes(where))
		text += " \u2014 1 VP";
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
	let where = game.location[evt.target.block];
	if ((info.owner === player || info.owner === ASSASSINS) && where !== S_POOL && where !== F_POOL) {
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
		if (block_owner(b) === FRANKS)
			msg = "Franks";
		else if (block_owner(b) === SARACENS)
			msg = "Saracens";
	} else {
		msg = block_name(b);
	}

	if (game.actions && game.actions.fire && game.actions.fire.includes(b))
		msg = "Fire with " + msg;
	else if (game.actions && game.actions.storm && game.actions.storm.includes(b))
		msg = "Storm with " + msg;
	else if (game.actions && game.actions.sally && game.actions.sally.includes(b))
		msg = "Sally with " + msg;
	else if (game.actions && game.actions.withdraw && game.actions.withdraw.includes(b))
		msg = "Withdraw with " + msg;
	else if (game.actions && game.actions.hit && game.actions.hit.includes(b))
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

function on_focus_fire(evt) {
	document.getElementById("status").textContent =
		"Fire with " + block_name(evt.target.block);
}

function on_focus_retreat(evt) {
	if (game.battle.storming.includes(evt.target.block))
		document.getElementById("status").textContent =
			"Withdraw with " + block_name(evt.target.block);
	else
		document.getElementById("status").textContent =
			"Retreat with " + block_name(evt.target.block);
}

function on_focus_harry(evt) {
	document.getElementById("status").textContent =
		"Harry with " + block_name(evt.target.block);
}

function on_focus_charge(evt) {
	document.getElementById("status").textContent =
		"Charge with " + block_name(evt.target.block);
}

function on_focus_withdraw(evt) {
	document.getElementById("status").textContent =
		"Withdraw with " + block_name(evt.target.block);
}

function on_focus_storm(evt) {
	document.getElementById("status").textContent =
		"Storm with " + block_name(evt.target.block);
}

function on_focus_sally(evt) {
	document.getElementById("status").textContent =
		"Sally with " + block_name(evt.target.block);
}

function on_focus_hit(evt) {
	document.getElementById("status").textContent =
		"Take hit on " + block_name(evt.target.block);
}

function on_blur_battle_button(evt) {
	document.getElementById("status").textContent = "";
}

function on_click_hit(evt) { send_action('hit', evt.target.block); }
function on_click_fire(evt) { send_action('fire', evt.target.block); }
function on_click_retreat(evt) { send_action('retreat', evt.target.block); }
function on_click_charge(evt) { send_action('charge', evt.target.block); }
function on_click_harry(evt) { send_action('harry', evt.target.block); }
function on_click_withdraw(evt) { send_action('withdraw', evt.target.block); }
function on_click_storm(evt) { send_action('storm', evt.target.block); }
function on_click_sally(evt) { send_action('sally', evt.target.block); }

function on_click_card(evt) {
	let c = evt.target.id.split("+")[1] | 0;
	send_action('play', c);
}

function on_button_next(evt) { send_action('next'); }
function on_button_pass(evt) { send_action('pass'); }
function on_button_undo(evt) { send_action('undo'); }
function on_button_winter_campaign(evt) { send_action('winter_campaign'); }
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

function battle_block_class_name(block) {
	return `block block_${block.image} ${block.owner}`;
}

function build_battle_block(b, block) {
	let element = document.createElement("div");
	element.className = battle_block_class_name(block);
	element.addEventListener("mouseenter", on_focus_battle_block);
	element.addEventListener("mouseleave", on_blur_battle_block);
	element.addEventListener("click", on_click_battle_block);
	element.block = b;
	ui.battle_block[b] = element;

	let menu_list = document.createElement("div");
	menu_list.className = "battle_menu_list";

	build_battle_button(menu_list, b, "hit",
		on_click_hit, on_focus_hit,
		"/images/cross-mark.svg");
	build_battle_button(menu_list, b, "charge",
		on_click_charge, on_focus_charge,
		"/images/mounted-knight.svg");
	build_battle_button(menu_list, b, "fire",
		on_click_fire, on_focus_fire,
		"/images/pointy-sword.svg");
	build_battle_button(menu_list, b, "harry",
		on_click_harry, on_focus_harry,
		"/images/arrow-flights.svg");
	build_battle_button(menu_list, b, "retreat",
		on_click_retreat, on_focus_retreat,
		"/images/flying-flag.svg");
	build_battle_button(menu_list, b, "withdraw",
		on_click_withdraw, on_focus_withdraw,
		"/images/stone-tower.svg");
	build_battle_button(menu_list, b, "storm",
		on_click_storm, on_focus_storm,
		"/images/siege-tower.svg");
	build_battle_button(menu_list, b, "sally",
		on_click_sally, on_focus_sally,
		"/images/doorway.svg");

	let menu = document.createElement("div");
	menu.className = "battle_menu";
	menu.appendChild(element);
	menu.appendChild(menu_list);
	menu.block = b;
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
		if (name === F_POOL || name === S_POOL || name === DEAD)
			continue;
		if (name === "Sea") {
			element = document.getElementById("svgmap").getElementById("sea");
			element.town = "Sea";
			element.addEventListener("mouseenter", on_focus_town);
			element.addEventListener("mouseleave", on_blur_town);
			element.addEventListener("click", on_click_town);
			ui.towns[name] = element;
		} else {
			element = ui.towns[name] = build_town(name, town);
			let xo = Math.round(element.offsetWidth/2);
			let yo = Math.round(element.offsetHeight/2);
			element.style.left = (town.x - xo) + "px";
			element.style.top = (town.y - yo) + "px";
		}
	}

	for (let b in BLOCKS) {
		let block = BLOCKS[b];
		ui.blocks[b] = build_map_block(b, block);
		build_battle_block(b, block);
	}
}

function update_steps(b, steps, element) {
	element.classList.remove("r0");
	element.classList.remove("r1");
	element.classList.remove("r2");
	element.classList.remove("r3");
	element.classList.add("r"+(BLOCKS[b].steps - steps));
}

function layout_blocks(location, secret, known) {
	if (label_layout === 'stack')
		document.getElementById("map").classList.add("stack_layout");
	else
		document.getElementById("map").classList.remove("stack_layout");
	if (label_layout === 'spread' ||
		(location === S_POOL || location === F_POOL || location === DEAD ||
			location === ENGLAND || location === FRANCE || location === GERMANIA))
		layout_blocks_spread(location, secret, known);
	else
		layout_blocks_stacked(location, secret, known);
}

function layout_blocks_spread(town, north, south) {
	let wrap = TOWNS[town].wrap;
	let rows = [];

	if ((north.length > wrap || south.length > wrap) || (north.length + south.length <= 3)) {
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

	if (TOWNS[town].layout_minor > 0.5)
		rows.reverse();

	for (let r = 0; r < rows.length; ++r) {
		let cols = rows[r];
		for (let c = 0; c < cols.length; ++c)
			position_block(town, r, rows.length, c, cols.length, cols[c]);
	}
}

function position_block(town, row, n_rows, col, n_cols, element) {
	let space = TOWNS[town];
	let block_size = 60+6;
	let padding = 4;
	if (town === ENGLAND || town === FRANCE || town === GERMANIA)
		padding = 21;
	let offset = block_size + padding;
	let row_size = (n_rows-1) * offset;
	let col_size = (n_cols-1) * offset;
	let x = space.x;
	let y = space.y;

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

	element.style.left = ((x - block_size/2)|0)+"px";
	element.style.top = ((y - block_size/2)|0)+"px";
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
	let x = space.x + (i - c) * 16 + k * 12;
	let y = space.y + (i - c) * 16 - k * 12;
	element.style.left = ((x - block_size/2)|0)+"px";
	element.style.top = ((y - block_size/2)|0)+"px";
}

function show_block(element) {
	if (element.parentElement !== ui.blocks_element)
		ui.blocks_element.appendChild(element);
}

function hide_block(element) {
	if (element.parentElement !== ui.offmap_element)
		ui.offmap_element.appendChild(element);
}

function show_block(element) {
	if (element.parentElement !== ui.blocks_element)
		ui.blocks_element.appendChild(element);
}

function hide_block(element) {
	if (element.parentElement !== ui.offmap_element)
		ui.offmap_element.appendChild(element);
}

function is_known_block(info, who) {
	if (game_over)
		return true;
	if (info.owner === player || info.owner === ASSASSINS || who === game.assassinate)
		return true;
	let town = game.location[who];
	if (town === DEAD)
		return true;
	return false;
}

function update_map() {
	let layout = {};

	document.getElementById("frank_vp").textContent = game.f_vp + " VP";
	document.getElementById("saracen_vp").textContent = game.s_vp + " VP";
	document.getElementById("timeline").className = "year_" + game.year;
	if (game.turn < 1)
		document.querySelector(".turn_info").textContent =
			"Year " + game.year;
	else if (game.turn < 6)
		document.querySelector(".turn_info").textContent =
			"Turn " + game.turn + " of Year " + game.year;
	else
		document.querySelector(".turn_info").textContent =
			"Winter Turn of Year " + game.year;

	for (let town in TOWNS)
		layout[town] = { north: [], south: [] };

	for (let b in game.location) {
		let info = BLOCKS[b];
		let element = ui.blocks[b];
		let town = game.location[b];
		if (town in TOWNS) {
			let moved = game.moved[b] ? " moved" : "";
			if (town === DEAD)
				moved = " moved";
			if (is_known_block(info, b)) {
				let image = " block_" + info.image;
				let steps = " r" + (info.steps - game.steps[b]);
				let known = " known";
				if ((town === S_POOL || town === F_POOL) && b !== game.who && !game_over)
					known = "";
				element.classList = info.owner + known + " block" + image + steps + moved;
			} else {
				let besieging = "";
				if (game.sieges[town] === info.owner) {
					if (game.winter_campaign === town)
						besieging = " winter_campaign";
					else
						besieging = " besieging";
				}
				let jihad = "";
				if (game.jihad === town && info.owner === game.p1)
					jihad = " jihad";
				element.classList = info.owner + " block" + moved + besieging + jihad;
			}
			if (town !== DEAD) {
				if (info.owner === FRANKS)
					layout[town].north.push(element);
				else
					layout[town].south.push(element);
			}
			show_block(element);
		} else {
			hide_block(element);
		}
	}

	for (let b in game.location) {
		let info = BLOCKS[b];
		let element = ui.blocks[b];
		let town = game.location[b];
		if (town === DEAD) {
			if (info.owner === FRANKS)
				layout[F_POOL].north.unshift(element);
			else
				layout[S_POOL].south.unshift(element);
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
	}
	if (game.who && !game.battle)
		ui.blocks[game.who].classList.add('selected');
	for (let b of game.castle)
		ui.blocks[b].classList.add('castle');
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

function compare_blocks(a, b) {
	let aa = BLOCKS[a].combat;
	let bb = BLOCKS[b].combat;
	if (aa === bb)
		return (a < b) ? -1 : (a > b) ? 1 : 0;
	return (aa < bb) ? -1 : (aa > bb) ? 1 : 0;
}

function insert_battle_block(root, node, block) {
	for (let i = 0; i < root.children.length; ++i) {
		let prev = root.children[i];
		if (compare_blocks(prev.block, block) > 0) {
			root.insertBefore(node, prev);
			return;
		}
	}
	root.appendChild(node);
}

function update_battle() {
	function fill_cell(name, list, show) {
		let cell = document.getElementById(name);

		ui.present.clear();

		for (let block of list) {
			ui.present.add(block);

			if (!cell.contains(ui.battle_menu[block]))
				insert_battle_block(cell, ui.battle_menu[block], block);

			ui.battle_menu[block].className = "battle_menu";
			if (game.actions && game.actions.fire && game.actions.fire.includes(block))
				ui.battle_menu[block].classList.add('fire');
			if (game.actions && game.actions.retreat && game.actions.retreat.includes(block))
				ui.battle_menu[block].classList.add('retreat');
			if (game.actions && game.actions.harry && game.actions.harry.includes(block))
				ui.battle_menu[block].classList.add('harry');
			if (game.actions && game.actions.charge && game.actions.charge.includes(block))
				ui.battle_menu[block].classList.add('charge');
			if (game.actions && game.actions.withdraw && game.actions.withdraw.includes(block))
				ui.battle_menu[block].classList.add('withdraw');
			if (game.actions && game.actions.storm && game.actions.storm.includes(block))
				ui.battle_menu[block].classList.add('storm');
			if (game.actions && game.actions.sally && game.actions.sally.includes(block))
				ui.battle_menu[block].classList.add('sally');
			if (game.actions && game.actions.charge && game.actions.charge.includes(block))
				ui.battle_menu[block].classList.add('charge');
			if (game.actions && game.actions.treachery && game.actions.treachery.includes(block))
				ui.battle_menu[block].classList.add('treachery');
			if (game.actions && game.actions.hit && game.actions.hit.includes(block))
				ui.battle_menu[block].classList.add('hit');

			let class_name = battle_block_class_name(BLOCKS[block]);
			if (game.actions && game.actions.block && game.actions.block.includes(block))
				class_name += " highlight";
			if (game.moved[block])
				class_name += " moved";
			if (block === game.who)
				class_name += " selected";
			if (block === game.battle.halfhit)
				class_name += " halfhit";
			if (game.jihad === game.battle.town && block_owner(block) === game.p1)
				class_name += " jihad";

			if (game.battle.sallying.includes(block))
				show = true;
			if (game.battle.storming.includes(block))
				show = true;
			if (show || block_owner(block) === player) {
				class_name += " known";
				ui.battle_block[block].className = class_name;
				update_steps(block, game.steps[block], ui.battle_block[block], false);
			} else {
				ui.battle_block[block].className = class_name;
			}

		}

		for (let b in BLOCKS) {
			if (!ui.present.has(b)) {
				if (cell.contains(ui.battle_menu[b]))
					cell.removeChild(ui.battle_menu[b]);
			}
		}
	}

	if (player === FRANKS) {
		fill_cell("ER", game.battle.SR, false);
		fill_cell("EC", game.battle.SC, game.battle.show_castle);
		fill_cell("EF", game.battle.SF, game.battle.show_field);
		fill_cell("FF", game.battle.FF, game.battle.show_field);
		fill_cell("FC", game.battle.FC, game.battle.show_castle);
		fill_cell("FR", game.battle.FR, false);
		document.getElementById("FC").className = "c" + game.battle.FCS;
		document.getElementById("EC").className = "c" + game.battle.SCS;
	} else {
		fill_cell("ER", game.battle.FR, false);
		fill_cell("EC", game.battle.FC, game.battle.show_castle);
		fill_cell("EF", game.battle.FF, game.battle.show_field);
		fill_cell("FF", game.battle.SF, game.battle.show_field);
		fill_cell("FC", game.battle.SC, game.battle.show_castle);
		fill_cell("FR", game.battle.SR, false);
		document.getElementById("EC").className = "c" + game.battle.FCS;
		document.getElementById("FC").className = "c" + game.battle.SCS;
	}
}

let flash_timer = 0;
function start_flash() {
	let element = document.querySelector(".battle_message");
	let tick = true;
	if (flash_timer)
		return;
	flash_timer = setInterval(function () {
		if (!game.flash_next) {
			element.textContent = game.battle ? game.battle.flash : "";
			clearInterval(flash_timer);
			flash_timer = 0;
		} else {
			element.textContent = tick ? game.battle.flash : game.flash_next;
			tick = !tick;
		}
	}, 1000);
}

function on_update() {
	show_action_button("#next_button", "next");
	show_action_button("#pass_button", "pass");
	show_action_button("#undo_button", "undo");
	show_action_button("#winter_campaign_button", "winter_campaign");
	show_action_button("#group_move_button", "group_move");
	show_action_button("#end_group_move_button", "end_group_move");
	show_action_button("#sea_move_button", "sea_move");
	show_action_button("#end_sea_move_button", "end_sea_move");
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
		if (game.flash_next)
			start_flash();
		document.querySelector(".battle").classList.add("show");
		update_battle();
	} else {
		document.querySelector(".battle").classList.remove("show");
	}
}

build_map();

drag_element_with_mouse(".battle", ".battle_header");
scroll_with_middle_mouse("#grid_center", 3);
init_map_zoom();
init_shift_zoom();
init_client(["Franks", "Saracens"]);
