import { PacmanConfig, PacmanRenderer, PlayerStyle } from '../pacman/index';
import { BaseConfig } from './types';

export { PlayerStyle };

export interface ArcadeConfig extends BaseConfig {
	game: GameType;
	playerStyle?: PlayerStyle;
}

interface GameRegistryEntry {
	label: string;
	factory: (conf: ArcadeConfig) => { start(): Promise<unknown>; stop(): void };
}

const gameRegistry = {
	pacman: {
		label: '👻 Pac-Man',
		factory: (conf: ArcadeConfig) => new PacmanRenderer(conf as PacmanConfig)
	}
} satisfies Record<string, GameRegistryEntry>;

export type GameType = keyof typeof gameRegistry;

export const GAME_REGISTRY: Record<GameType, GameRegistryEntry> = gameRegistry as Record<GameType, GameRegistryEntry>;

export const ARCADE_GAMES: readonly GameType[] = Object.keys(GAME_REGISTRY) as GameType[];

export class ArcadeRenderer {
	private renderer: { start(): Promise<unknown>; stop(): void };

	constructor(conf: ArcadeConfig) {
		const entry = GAME_REGISTRY[conf.game];
		if (!entry) {
			throw new Error(`Unknown game "${conf.game}". Valid games: ${ARCADE_GAMES.join(', ')}`);
		}
		this.renderer = entry.factory(conf);
	}

	public async start() {
		return this.renderer.start();
	}

	public stop() {
		this.renderer.stop();
	}
}
