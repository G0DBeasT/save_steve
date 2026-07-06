import { Utils } from '../../shared/utils/utils';
import { PacmanMovement } from '../movement/pacman-movement';
import { SVG } from '../renderers/svg';
import { StoreType } from '../types';
import { PACMAN_DEATH_DURATION } from './constants';

/* ---------- positioning helpers ---------- */

const placePacman = (store: StoreType) => {
	store.pacman = {
		x: 0,
		y: 0,
		direction: 'right',
		points: 0,
		totalPoints: 0,
		deadRemainingDuration: 0,
		powerupRemainingDuration: 0,
		recentPositions: []
	};
};

/* ---------- main cycle ---------- */

const stopGame = async (store: StoreType) => {
	clearInterval(store.gameInterval as number);
};

const startGame = async (store: StoreType) => {
	store.frameCount = 0;
	store.aliveSteps = 0;
	store.gameHistory = [];
	store.cellEvents = [];

	store.grid = Utils.createGridFromData(store);
	store.initialColors = store.grid.map((col) => col.map((cell) => cell.color));

	const remainingCells = () => store.grid.some((row) => row.some((cell) => cell.commitsCount > 0));

	if (remainingCells()) {
		placePacman(store);
	}

	const MAX_FRAMES = 3000;

	while (remainingCells() && store.gameHistory.length < MAX_FRAMES) {
		await updateGame(store);
	}
	await updateGame(store);
};

/* ---------- utilities ---------- */

const resetPacman = (store: StoreType) => {
	store.pacman.x = 27;
	store.pacman.y = 7;
	store.pacman.direction = 'right';
	store.pacman.recentPositions = [];
};


/* ---------- update per frame ---------- */

const updateGame = async (store: StoreType) => {
	store.frameCount++;

	if (store.pacman.deadRemainingDuration > 0) {
		store.pacman.deadRemainingDuration--;
		if (store.pacman.deadRemainingDuration === 0) {
			resetPacman(store);
		}
	}

	if (store.pacman.powerupRemainingDuration > 0) {
		store.pacman.powerupRemainingDuration--;
		if (store.pacman.powerupRemainingDuration === 0) {
			store.pacman.points = 0;
		}
	}

	const remaining = store.grid.some((row) => row.some((c) => c.commitsCount > 0));
	if (!remaining) {
		const svg = SVG.generateAnimatedSVG(store);
		store.config.svgCallback(svg);
		if (store.config.gameStatsCallback) {
			store.config.gameStatsCallback({
				totalScore: store.pacman.totalPoints,
				steps: store.aliveSteps,
				ghostsEaten: 0
			});
		}
		store.config.gameOverCallback();
		return;
	}

	PacmanMovement.movePacman(store);

	store.pacmanMouthOpen = !store.pacmanMouthOpen;

	if (store.pacman.deadRemainingDuration === 0) {
		store.aliveSteps++;
	}

	if (store.config.gameStatsCallback) {
		store.config.gameStatsCallback({
			totalScore: store.pacman.totalPoints,
			steps: store.aliveSteps,
			ghostsEaten: 0
		});
	}

	pushSnapshot(store);
};

/* ---------- snapshot helper ---------- */
const pushSnapshot = (store: StoreType) => {
	store.gameHistory.push({
		pacman: { ...store.pacman, recentPositions: [...store.pacman.recentPositions] }
	});
};


export const Game = {
	startGame,
	stopGame
};
