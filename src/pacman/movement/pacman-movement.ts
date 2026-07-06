import { GRID_HEIGHT, GRID_WIDTH, PACMAN_POWERUP_DURATION } from '../core/constants';
import { PlayerStyle, Point2d, StoreType } from '../types';
import { Utils } from '../../shared/utils/utils';
import { MovementUtils } from './movement-utils';

const RECENT_POSITIONS_LIMIT = 5;

const movePacman = (store: StoreType) => {
	if (store.pacman.deadRemainingDuration) return;

	let targetPosition: Point2d;

	// Find a target position, ensuring it's never undefined
	try {
		if (store.pacman.target) {
			if (store.pacman.x === store.pacman.target.x && store.pacman.y === store.pacman.target.y) {
				targetPosition = findOptimalTarget(store);
				store.pacman.target = targetPosition;
			} else {
				targetPosition = store.pacman.target;
			}
		} else {
			targetPosition = findOptimalTarget(store);
			store.pacman.target = targetPosition;
		}

		// Safety check to ensure targetPosition is never undefined
		if (!targetPosition) {
			targetPosition = { x: store.pacman.x, y: store.pacman.y };
		}

		const nextPosition = calculateOptimalPath(store, targetPosition);
		nextPosition ? updatePacmanPosition(store, nextPosition) : makeDesperationMove(store);

		checkAndEatPoint(store);
	} catch (error) {
		console.error('Error in movePacman:', error);
		// If all else fails, don't move
	}
};

const findOptimalTarget = (store: StoreType) => {
	const pointCells: { x: number; y: number; value: number }[] = [];

	for (let x = 0; x < GRID_WIDTH; x++) {
		for (let y = 0; y < GRID_HEIGHT; y++) {
			const cell = store.grid[x][y];
			if (cell.level !== 'NONE') {
				const distance = MovementUtils.calculateDistance(x, y, store.pacman.x, store.pacman.y);
				const value = cell.commitsCount / (distance + 1);
				pointCells.push({ x, y, value });
			}
		}
	}

	pointCells.sort((a, b) => b.value - a.value);

	// Check if there are any cells with points left
	if (pointCells.length === 0) {
		// Return Pac-Man's current position as fallback
		return { x: store.pacman.x, y: store.pacman.y, value: 0 };
	}

	return pointCells[0];
};

const REVISIT_PENALTY = 100;

const stepCost = (store: StoreType, x: number, y: number): number => {
	const key = `${x},${y}`;
	const revisit = store.pacman.recentPositions?.includes(key) ? REVISIT_PENALTY : 0;
	return 1 + revisit;
};

const heuristic = (from: Point2d, target: Point2d): number => {
	return Math.abs(from.x - target.x) + Math.abs(from.y - target.y);
};

const reconstructFirstStep = (cameFrom: Map<string, string>, targetKey: string, startKey: string): Point2d | null => {
	let cursor = targetKey;
	let parent = cameFrom.get(cursor);
	while (parent !== undefined && parent !== startKey) {
		cursor = parent;
		parent = cameFrom.get(cursor);
	}
	if (parent === undefined) return null;
	const [x, y] = cursor.split(',').map(Number);
	return { x, y };
};

const calculateOptimalPath = (store: StoreType, target: Point2d): Point2d | null => {
	const start: Point2d = { x: store.pacman.x, y: store.pacman.y };
	if (start.x === target.x && start.y === target.y) return null;

	const startKey = `${start.x},${start.y}`;
	const targetKey = `${target.x},${target.y}`;

	const open: { x: number; y: number; g: number; f: number }[] = [{ x: start.x, y: start.y, g: 0, f: heuristic(start, target) }];
	const gScore = new Map<string, number>([[startKey, 0]]);
	const cameFrom = new Map<string, string>();

	while (open.length > 0) {
		let bestIdx = 0;
		for (let i = 1; i < open.length; i++) {
			if (open[i].f < open[bestIdx].f) bestIdx = i;
		}
		const current = open.splice(bestIdx, 1)[0];
		const currentKey = `${current.x},${current.y}`;

		if (current.g > (gScore.get(currentKey) ?? Infinity)) continue;

		if (currentKey === targetKey) {
			return reconstructFirstStep(cameFrom, targetKey, startKey);
		}

		for (const [dx, dy] of MovementUtils.getValidMoves(current.x, current.y)) {
			const nx = current.x + dx;
			const ny = current.y + dy;
			const neighborKey = `${nx},${ny}`;
			const tentativeG = current.g + stepCost(store, nx, ny);

			if (tentativeG < (gScore.get(neighborKey) ?? Infinity)) {
				gScore.set(neighborKey, tentativeG);
				cameFrom.set(neighborKey, currentKey);
				open.push({
					x: nx,
					y: ny,
					g: tentativeG,
					f: tentativeG + heuristic({ x: nx, y: ny }, target)
				});
			}
		}
	}

	return null;
};

const makeDesperationMove = (store: StoreType) => {
	const validMoves = MovementUtils.getValidMoves(store.pacman.x, store.pacman.y);
	if (validMoves.length === 0) return;

	// Pick first valid move
	const [dx, dy] = validMoves[Math.floor(Math.random() * validMoves.length)];

	updatePacmanPosition(store, {
		x: store.pacman.x + dx,
		y: store.pacman.y + dy
	});
};

const updatePacmanPosition = (store: StoreType, position: Point2d) => {
	store.pacman.recentPositions ||= [];
	store.pacman.recentPositions.push(`${position.x},${position.y}`);
	if (store.pacman.recentPositions.length > RECENT_POSITIONS_LIMIT) {
		store.pacman.recentPositions.shift();
	}

	const dx = position.x - store.pacman.x;
	const dy = position.y - store.pacman.y;

	store.pacman.direction = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : dy < 0 ? 'up' : store.pacman.direction;

	store.pacman.x = position.x;
	store.pacman.y = position.y;
};

const checkAndEatPoint = (store: StoreType) => {
	const cell = store.grid[store.pacman.x][store.pacman.y];
	if (cell.level !== 'NONE') {
		store.pacman.totalPoints += cell.commitsCount;
		store.pacman.points++;
		store.config.pointsIncreasedCallback(store.pacman.totalPoints);

		const theme = Utils.getCurrentTheme(store);
		if (cell.level === 'FOURTH_QUARTILE') {
			activatePowerUp(store);
		}

		cell.level = 'NONE';
		cell.color = theme.intensityColors[0];
		cell.commitsCount = 0;

		// Record the color change, keyed to the frame that pushSnapshot will write next.
		store.cellEvents.push({
			frameIndex: store.gameHistory.length,
			x: store.pacman.x,
			y: store.pacman.y,
			color: cell.color
		});
	}
};

const activatePowerUp = (store: StoreType) => {
	store.pacman.powerupRemainingDuration = PACMAN_POWERUP_DURATION;
};

export const PacmanMovement = {
	movePacman
};
