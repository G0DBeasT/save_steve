import type { Config, StoreType } from '../types';

export const Store: StoreType = {
	frameCount: 0,
	aliveSteps: 0,
	contributions: [],
	pacman: {
		x: 0,
		y: 0,
		direction: 'right',
		points: 0,
		totalPoints: 0,
		deadRemainingDuration: 0,
		powerupRemainingDuration: 0,
		recentPositions: []
	},
	grid: [],
	monthLabels: [],
	pacmanMouthOpen: true,
	gameInterval: 0,
	gameHistory: [],
	initialColors: [],
	cellEvents: [],
	config: undefined as unknown as Config,
	useGithubThemeColor: true
};
