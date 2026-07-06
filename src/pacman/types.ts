import { AnimationData, BaseConfig, BaseStore, Contribution, GameStats, GridCell } from '../shared/types';
export type { AnimationData, GameStats };

export type Point2d = {
	x: number;
	y: number;
	direction?: 'right' | 'left' | 'up' | 'down';
};

export enum PlayerStyle {
	CONSERVATIVE = 'conservative',
	AGGRESSIVE = 'aggressive',
	OPPORTUNISTIC = 'opportunistic'
}

/* ───────────────────────── Pac-Man ────────────────────── */
export interface Pacman {
	x: number;
	y: number;
	direction: 'right' | 'left' | 'up' | 'down';
	points: number;
	totalPoints: number;
	deadRemainingDuration: number;
	powerupRemainingDuration: number;
	recentPositions: string[];
	target?: Point2d;
}

/* ───────────────────────── Store ───────────────────────────── */
export interface StoreType extends BaseStore {
	frameCount: number;
	aliveSteps: number;
	contributions: Contribution[];
	pacman: Pacman;
	grid: GridCell[][];
	monthLabels: string[];
	pacmanMouthOpen: boolean;
	gameInterval: number;
	gameHistory: {
		pacman: Pacman;
	}[];
	/** Initial cell colors [col][row], captured before any cells are eaten. */
	initialColors: string[][];
	/** Sparse list of cell color-change events, keyed by frame index. */
	cellEvents: { frameIndex: number; x: number; y: number; color: string }[];
	config: Config;
	useGithubThemeColor: boolean;
}

/* ───────────────────────── Config ───────────────────────────── */
export interface Config extends BaseConfig {
	playerStyle: PlayerStyle;
}
