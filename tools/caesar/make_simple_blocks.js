let fs = require('fs');
let data = require('../../public/julius-caesar/data.js');
let blocks = data.BLOCKS;

function getSteps(cur,max) {
	let i = 0;
	let s = [];
	for (; i < cur; ++i) s.push("I");
	for (; i < max; ++i) s.push("&#x2010;");
	return s.join("");
}

function getPath(type) {
	return fs.readFileSync("icons/" + type  + ".svg", "utf8")
}

function makeSVG(id, unit, cur) {
	let type = unit.type;
	let steps = getSteps(cur, unit.steps);
	if (type == 'elephant')
		steps = getSteps(cur*2, unit.steps*2);
	let fire = unit.initiative + unit.firepower;
	let label = unit.name;
	if (unit.name == 'Cleopatra') type = 'cleopatra';
	if (unit.name == 'Caesar') type = 'caesar';
	if (unit.levy)
		label = unit.levy;
	if (label == "Carthago Nova") label = "C. Nova";
	let iconColor = 'saddlebrown';
	let textColor = 'black';
	let labelWeight = '500';
	if (unit.owner == 'Caesar') {
		iconColor = 'gold';
		textColor = 'wheat';
		labelWeight = '700';
	}
	if (unit.name == 'Cleopatra') {
		iconColor = '#bbeeff';
	}
	return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="100" height="100">
		<g transform="translate(25,25) scale(0.1,0.1)" fill="${iconColor}">${getPath(type)}</g>
		<text x="8" y="22" font-size="22" font-family="Clear Sans" font-weight="700" fill="${textColor}">${steps}</text>
		<text x="94" y="24" font-size="24" text-anchor="end" font-family="Clear Sans" font-weight="700" fill="${textColor}">${fire}</text>
		<text x="50" y="92" font-size="19" text-anchor="middle" font-family="Clear Sans" font-weight="${labelWeight}" fill="${textColor}">${label}</text>
		</svg>`;
}

function makeAll() {
	let css = ".simple-labels .block.known {\n";
	css += "\tbackground-image: url('blocks/simple.png');\n"
	css += "\tbackground-repeat: no-repeat;\n";
	css += "\tbackground-size: 600% 3100%;\n"
	css += "}\n";

	let W = 100/5;
	let H = 100/30;
	let x = 0;
	let y = 0;
	let i = 0;
	let k = 0;
	let wrap = 31;
	let n = 1;
	let id = 0;
	for (let b in blocks) {
		let max = blocks[b].steps;
		for (let cur = max; cur >= 1; --cur) {
			let r = max-cur;
			let id_s = String(i++);
			while (id_s.length < 3) id_s = "0" + id_s;
			let fn = "tmp/block-" + n + "-" + id_s + ".svg";
			fs.writeFileSync(fn, makeSVG(id_s, blocks[b], cur));
			css += ".simple-labels .block_"+id+".r"+r+"{background-position:"+x+"% "+y+"%}\n";
			y += H;
			if (++k == wrap) {
				++n;
				k = 0;
				y = 0;
				x += W;
			}
		}
		++id;
	}
	fs.writeFileSync("blocks_simple.css", css);
}

makeAll();
