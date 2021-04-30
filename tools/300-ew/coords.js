var SCALE = 3/4;
var CITY_XY = {};
var PORT_XY = {
	Abydos: { left: 1063, top: 741 },
	Ephesos: { left: 508, top: 928 },
	Athenai: { left: 595, top: 378 },
	Eretria: { left: 817, top: 549 },
	Naxos: { left: 541, top: 674 },
	Pella: { left: 1149, top: 330 },
	Sparta: { left: 253, top: 506 },
	Thebai: { left: 827, top: 284 },
};
const PORT_LAYOUT = {
        "Abydos": [1140, 780, 4],
        "Ephesos": [565, 990, 3],
        "Athenai": [695, 505, 4],
        "Eretria": [910, 680, 4],
        "Naxos": [670, 775, 3],
        "Pella": [1225, 460, 4],
        "Sparta": [335, 626, 4],
        "Thebai": [935, 415, 4],
};
var PERSIAN_XY = {
	Abydos: { left: 1089, top: 812 },
	Ephesos: { left: 618, top: 961 },
}
var GREEK_XY = {
	Athenai: { left: 660, top: 337 },
	Delphi: { left: 753, top: 69 },
	Eretria: { left: 835, top: 527 },
	Korinthos: { left: 533, top: 128 },
	Larissa: { left: 1009, top: 88 },
	Naxos: { left: 488, top: 732 },
	Pella: { left: 1224, top: 300 },
	Sparta: { left: 315, top: 405 },
	Thebai: { left: 838, top: 241 },
};
var MARKER_XY = {
	campaign_1: { left: 1436, top: 495, },
	campaign_2: { left: 1440, top: 540, },
	campaign_3: { left: 1441, top: 584, },
	campaign_4: { left: 1439, top: 627, },
	campaign_5: { left: 1433, top: 672, },
	vp_g6: { left: 245, top: 308, },
	vp_g5: { left: 227, top: 350, },
	vp_g4: { left: 213, top: 392, },
	vp_g3: { left: 201, top: 435, },
	vp_g2: { left: 193, top: 480, },
	vp_g1: { left: 187, top: 523, },
	vp_0: { left: 188, top: 571, },
	vp_p1: { left: 187, top: 618, },
	vp_p2: { left: 193, top: 661, },
	vp_p3: { left: 201, top: 706, },
	vp_p4: { left: 213, top: 749, },
	vp_p5: { left: 227, top: 791, },
	vp_p6: { left: 245, top: 833, },
}

function mogrify(entry, w, h) {
	entry.x = Math.round((entry.left + w/2) * SCALE);
	entry.y = Math.round((entry.top + h/2) * SCALE);
	entry.w = Math.round(w * SCALE);
	entry.h = Math.round(h * SCALE);
	delete entry.left;
	delete entry.top;
	return entry;
}

for (space in PORT_XY) {
	mogrify(PORT_XY[space], 184, 184);
	PORT_XY[space].layout_x = Math.round(PORT_LAYOUT[space][0] * SCALE);
	PORT_XY[space].layout_y = Math.round(PORT_LAYOUT[space][1] * SCALE);
	PORT_XY[space].wrap = PORT_LAYOUT[space][2];
}
for (space in PERSIAN_XY) CITY_XY[space] = mogrify(PERSIAN_XY[space], 122, 120);
for (space in GREEK_XY) CITY_XY[space] = mogrify(GREEK_XY[space], 112, 108);
for (space in MARKER_XY) CITY_XY[space] = mogrify(MARKER_XY[space], 22, 26);
console.log("const PORTS =", JSON.stringify(PORT_XY).replace(/},/g,"},\n\t").replace(/{/,"{\n\t").replace(/}}/,"}\n};"));
console.log();
console.log("const CITIES =", JSON.stringify(CITY_XY).replace(/},/g,"},\n\t").replace(/{/,"{\n\t").replace(/}}/,"}\n};"));
console.log();
for (let m in MARKER_XY) {
	let info = MARKER_XY[m];
	let left = Math.round(info.x-11) + "px";
	let top = Math.round(info.y-13) + "px";
	let w = info.w + "px";
	let h = info.h + "px";
	console.log("." + m + " { left: " + left + "; top: " + top + "; }");
}
