import { CELL_SIZE, DELTA_TIME, GAP_SIZE, GRID_HEIGHT, GRID_WIDTH, PACMAN_COLOR, WALLS, STEVE_BASE64 } from '../core/constants';
import { AnimationData, StoreType } from '../types';
import { Utils } from '../../shared/utils/utils';
import { RendererUnits } from './renderer-units';

const SVG_KEY_TIMES_PRECISION = 4;

const generateAnimatedSVG = (store: StoreType) => {
	const POST_GAME_FRAMES = 50; // frames for sorting and holding
	const actualGameFrames = store.gameHistory.length;
	if (actualGameFrames > 0) {
		const lastState = store.gameHistory[actualGameFrames - 1];
		for (let i = 0; i < POST_GAME_FRAMES; i++) {
			store.gameHistory.push(lastState);
		}
	}

	const svgWidth = GRID_WIDTH * (CELL_SIZE + GAP_SIZE);
	const svgHeight = GRID_HEIGHT * (CELL_SIZE + GAP_SIZE) + 45;
	const totalDurationMs = store.gameHistory.length * DELTA_TIME;

	let svg = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;
	svg += `<desc>Generated with pacman-contribution-graph on ${new Date()}</desc>`;
	svg += `<metadata>
		<info>
			<frames>${store.gameHistory.length}</frames>
			<frameRate>${1000 / DELTA_TIME}</frameRate>
			<durationMs>${totalDurationMs}</durationMs>
			<generatedOn>${new Date().toISOString()}</generatedOn>
		</info>
	</metadata>`;
	svg += `<rect width="100%" height="100%" fill="${Utils.getCurrentTheme(store).gridBackground}"/>`;

	let lastMonth = '';
	for (let y = 0; y < GRID_WIDTH; y++) {
		if (store.monthLabels[y] !== lastMonth) {
			const xPos = y * (CELL_SIZE + GAP_SIZE) + CELL_SIZE / 2;
			svg += `<text x="${xPos}" y="10" text-anchor="middle" font-size="10" fill="${Utils.getCurrentTheme(store).textColor}">${store.monthLabels[y]}</text>`;
			lastMonth = store.monthLabels[y];
		}
	}

	// Grid
	for (let x = 0; x < GRID_WIDTH; x++) {
		for (let y = 0; y < GRID_HEIGHT; y++) {
			const cellX = x * (CELL_SIZE + GAP_SIZE);
			const cellY = y * (CELL_SIZE + GAP_SIZE) + 15;
			const cellColorAnimation = getCellAnimationData(store, x, y);
			svg += `<rect id="c-${x}-${y}" x="${cellX}" y="${cellY}" width="${CELL_SIZE}" height="${CELL_SIZE}" rx="5" fill="${Utils.getCurrentTheme(store).intensityColors[0]}">
				<animate attributeName="fill" dur="${totalDurationMs}ms" repeatCount="indefinite" calcMode="discrete"
					values="${cellColorAnimation.values}" 
					keyTimes="${cellColorAnimation.keyTimes}"/>
			</rect>`;
		}
	}

	// Horizontal walls
	for (let y = 0; y < GRID_HEIGHT; y++) {
		let runStart = null;
		for (let x = 0; x <= GRID_WIDTH; x++) {
			let active = x < GRID_WIDTH && WALLS.horizontal[x][y].active;
			if (active && runStart === null) {
				runStart = x;
			}
			if ((!active || x === GRID_WIDTH) && runStart !== null) {
				let length = x - runStart;
				svg += `<rect id="wh-${runStart}-${y}" x="${runStart * (CELL_SIZE + GAP_SIZE) - GAP_SIZE}" y="${y * (CELL_SIZE + GAP_SIZE) - GAP_SIZE + 15}" width="${length * (CELL_SIZE + GAP_SIZE)}" height="${GAP_SIZE}" fill="${Utils.getCurrentTheme(store).wallColor}"></rect>`;
				runStart = null;
			}
		}
	}

	// Vertical walls
	for (let x = 0; x < GRID_WIDTH; x++) {
		let runStart = null;
		for (let y = 0; y <= GRID_HEIGHT; y++) {
			let active = y < GRID_HEIGHT && WALLS.vertical[x][y].active;
			if (active && runStart === null) {
				runStart = y;
			}
			if ((!active || y === GRID_HEIGHT) && runStart !== null) {
				let length = y - runStart;
				svg += `<rect id="wv-${x}-${runStart}" x="${x * (CELL_SIZE + GAP_SIZE) - GAP_SIZE}" y="${runStart * (CELL_SIZE + GAP_SIZE) - GAP_SIZE + 15}" width="${GAP_SIZE}" height="${length * (CELL_SIZE + GAP_SIZE)}" fill="${Utils.getCurrentTheme(store).wallColor}"></rect>`;
				runStart = null;
			}
		}
	}

	// Pacman
	const pacmanPositionAnimation = generateChangingValuesAnimation(store, generatePacManPositions(store));
	const pacmanRotationAnimation = generateChangingValuesAnimation(store, generatePacManRotations(store));
	svg += `<g id="pacman" transform="translate(0,0)">
		<animateTransform attributeName="transform" type="translate" dur="${totalDurationMs}ms" repeatCount="indefinite"
			keyTimes="${pacmanPositionAnimation.keyTimes}"
			values="${pacmanPositionAnimation.values}"
			additive="replace"/>
		<image href="${STEVE_BASE64}" width="${CELL_SIZE}" height="${CELL_SIZE}" />
	</g>`;

	svg += generateStack(store, svgWidth, svgHeight, actualGameFrames);
	svg += '</svg>';
	return svg;
};

const generatePacManPositions = (store: StoreType): string[] => {
	return store.gameHistory.map((state) => {
		const x = state.pacman.x * (CELL_SIZE + GAP_SIZE);
		const y = state.pacman.y * (CELL_SIZE + GAP_SIZE) + 15;
		return `${x},${y}`;
	});
};

const generatePacManRotations = (store: StoreType): string[] => {
	const pivit = CELL_SIZE / 2;
	const directionToRotation = (direction: 'right' | 'left' | 'up' | 'down'): string => {
		switch (direction) {
			case 'right':
				return `0 ${pivit} ${pivit}`;
			case 'left':
				return `180 ${pivit} ${pivit}`;
			case 'up':
				return `270 ${pivit} ${pivit}`;
			case 'down':
				return `90 ${pivit} ${pivit}`;
			default:
				return `0 ${pivit} ${pivit}`;
		}
	};
	// The direction stored in snapshot[i+1] is the direction taken during the slide
	// that begins at keyframe i, so shift one frame forward to keep it in sync.
	return store.gameHistory.map((_, i) => {
		const lookaheadIndex = Math.min(i + 1, store.gameHistory.length - 1);
		return directionToRotation(store.gameHistory[lookaheadIndex].pacman.direction);
	});
};

/** Build cell color animation data from the sparse cellEvents list. */
const getCellAnimationData = (store: StoreType, x: number, y: number): AnimationData => {
	const totalFrames = store.gameHistory.length;
	const initialColor = store.initialColors[x]?.[y] ?? Utils.getCurrentTheme(store).intensityColors[0];
	const events = store.cellEvents.filter((e) => e.x === x && e.y === y);

	if (events.length === 0) {
		return { keyTimes: '0;1', values: `${initialColor};${initialColor}` };
	}

	const kTimes: number[] = [0];
	const kValues: string[] = [initialColor];

	for (const ev of events) {
		const t = Number((ev.frameIndex / Math.max(totalFrames - 1, 1)).toFixed(SVG_KEY_TIMES_PRECISION));
		if (t !== kTimes[kTimes.length - 1]) {
			kTimes.push(t);
			kValues.push(ev.color);
		} else {
			kValues[kValues.length - 1] = ev.color;
		}
	}

	if (kTimes[kTimes.length - 1] !== 1) {
		kTimes.push(1);
		kValues.push(kValues[kValues.length - 1]);
	}

	return { keyTimes: kTimes.join(';'), values: kValues.join(';') };
};


const generateChangingValuesAnimation = (store: StoreType, changingValues: string[]): AnimationData => {
	if (store.gameHistory.length !== changingValues.length) {
		throw new Error(
			`The amount of values (${changingValues.length}) does not match the size of the game history (${store.gameHistory.length})`
		);
	}

	const totalFrames = store.gameHistory.length;
	if (totalFrames === 0) {
		return { keyTimes: '0;1', values: changingValues[0] || '#000;#000' };
	}

	let keyTimes: number[] = [];
	let values: string[] = [];
	let lastValue: string | null = null;
	let lastIndex: number | null = null;

	changingValues.forEach((currentValue, index) => {
		if (currentValue !== lastValue) {
			if (lastValue !== null && lastIndex !== null && index - 1 !== lastIndex) {
				// Add a keyframe right before the value change
				keyTimes.push(Number(((index - 1 / (10 * SVG_KEY_TIMES_PRECISION)) / (totalFrames - 1)).toFixed(SVG_KEY_TIMES_PRECISION)));
				values.push(lastValue);
			}
			// Add the new value keyframe
			keyTimes.push(Number((index / (totalFrames - 1)).toFixed(SVG_KEY_TIMES_PRECISION)));
			values.push(currentValue);
			lastValue = currentValue;
			lastIndex = index;
		}
	});

	// Ensure the last frame is always included
	if (keyTimes.length === 0 || keyTimes[keyTimes.length - 1] !== 1) {
		// If there are no keyframes, add start and end frames
		if (keyTimes.length === 0) {
			keyTimes.push(0, 1);
			values.push(changingValues[0] || '#000', changingValues[changingValues.length - 1] || '#000');
		} else {
			keyTimes.push(1);
			values.push(lastValue || changingValues[changingValues.length - 1] || '#000');
		}
	}

	return {
		keyTimes: keyTimes.join(';'),
		values: values.join(';')
	};
};

export const SVG = {
	generateAnimatedSVG
};


const generateStack = (store: StoreType, svgWidth: number, svgHeight: number, actualGameFrames: number): string => {
	const totalFrames = store.gameHistory.length;
	const totalDurationMs = totalFrames * DELTA_TIME;
	
	const eaten = store.cellEvents;
	if (eaten.length === 0) return '';

	// Get colors and normalize times
	const stack = eaten.map(ev => {
		return {
			color: store.initialColors[ev.x]?.[ev.y] || '#39d353',
			t: ev.frameIndex / Math.max(totalFrames - 1, 1)
		};
	});

	const blocks: { color: string; ts: number[] }[] = [];
	stack.forEach(({ color, t }) => {
		const latest = blocks[blocks.length - 1];
		if (latest?.color === color) latest.ts.push(t);
		else blocks.push({ color, ts: [t] });
	});

	const m = svgWidth / stack.length;
	
	// Pre-calculate positions
	const blocksWithPos = blocks.map((b) => {
		return { ...b, w: b.ts.length * m, origX: 0, sortedX: 0 };
	});
	
	let currX = 0;
	blocksWithPos.forEach((b) => {
		b.origX = currX;
		currX += b.w;
	});
	
	const sortedBlocks = [...blocksWithPos].sort((a, b) => a.color.localeCompare(b.color));
	
	currX = 0;
	sortedBlocks.forEach((b) => {
		b.sortedX = currX;
		currX += b.w;
	});

	let svgElements = '';
	let styles = `
		.u { 
			transform-origin: 0 0;
			transform: scale(0,1);
			animation: none linear ${totalDurationMs}ms infinite;
		}
	`;

	let i = 0;
	for (const b of blocksWithPos) {
		const { color, ts, origX, sortedX, w } = b;
		const id = "u" + (i++).toString(36);
		const animationName = id;

		const tStart = (actualGameFrames + 10) / Math.max(totalFrames, 1);
		const tEnd = (actualGameFrames + 40) / Math.max(totalFrames, 1);

		svgElements += `<rect class="u ${id}" height="10" width="${(w + 0.6).toFixed(1)}" x="${origX.toFixed(1)}" y="${svgHeight - 15}">
			<animate attributeName="x" 
				values="${origX.toFixed(1)};${origX.toFixed(1)};${sortedX.toFixed(1)};${sortedX.toFixed(1)}" 
				keyTimes="0;${tStart.toFixed(4)};${tEnd.toFixed(4)};1" 
				dur="${totalDurationMs}ms" 
				repeatCount="indefinite" />
		</rect>\n`;

		// Build keyframes
		let keyframes = '';
		const length = ts.length;
		ts.forEach((t, i) => {
			keyframes += `${((t - 0.0001) * 100).toFixed(4)}% { transform: scale(${(i / length).toFixed(3)}, 1); }\n`;
			keyframes += `${((t + 0.0001) * 100).toFixed(4)}% { transform: scale(${((i + 1) / length).toFixed(3)}, 1); }\n`;
		});
		keyframes += `100% { transform: scale(1, 1); }\n`;

		styles += `
			@keyframes ${animationName} {
				${keyframes}
			}
			.u.${id} {
				fill: ${color};
				animation-name: ${animationName};
				transform-origin: ${origX.toFixed(1)}px 0;
			}
		`;
	}

	return `<style>${styles}</style>\n<g id="progress-bar">\n${svgElements}\n</g>`;
};
