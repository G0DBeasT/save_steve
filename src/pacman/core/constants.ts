/* ─── Re-export shared constants so pacman code has one import location ─── */
export { CELL_SIZE, DELTA_TIME, GAME_THEMES, GAP_SIZE, GRID_HEIGHT, GRID_WIDTH, MONTHS } from '../../shared/constants';

/* ───────────── Pacman colours ───────────── */
export const PACMAN_COLOR = 'yellow';
export const PACMAN_COLOR_POWERUP = 'red';
export const PACMAN_COLOR_DEAD = '#80808064';

import sprites from './sprites_base64.json';
export const STEVE_BASE64 = sprites.steve;


export const PACMAN_DEATH_DURATION = 10;
export const PACMAN_POWERUP_DURATION = 15;

/* ───────────── Wall data ───────────── */
import { GRID_HEIGHT, GRID_WIDTH } from '../../shared/constants';

export const WALLS: {
	horizontal: { active: boolean; id: string; color?: string }[][];
	vertical: { active: boolean; id: string; color?: string }[][];
} = {
	horizontal: Array(GRID_WIDTH + 1)
		.fill(null)
		.map(() => Array(GRID_HEIGHT + 1).fill({ active: false, id: '' })),
	vertical: Array(GRID_WIDTH + 1)
		.fill(null)
		.map(() => Array(GRID_HEIGHT + 1).fill({ active: false, id: '' }))
};

export const setWall = (x: number, y: number, direction: 'horizontal' | 'vertical', lineId: string, color?: string) => {
	if (direction === 'horizontal') {
		if (x >= 0 && x < WALLS.horizontal.length && y >= 0 && y < WALLS.horizontal[0].length) {
			WALLS.horizontal[x][y] = { active: true, id: lineId, color };
		}
	} else {
		if (x >= 0 && x < WALLS.vertical.length && y >= 0 && y < WALLS.vertical[0].length) {
			WALLS.vertical[x][y] = { active: true, id: lineId, color };
		}
	}
};

export const hasWall = (x: number, y: number, direction: 'up' | 'down' | 'left' | 'right'): boolean => {
	switch (direction) {
		case 'up':
			return WALLS.horizontal[x][y].active;
		case 'down':
			return WALLS.horizontal[x + 1][y].active;
		case 'left':
			return WALLS.vertical[x][y].active;
		case 'right':
			return WALLS.vertical[x][y + 1].active;
	}
};
