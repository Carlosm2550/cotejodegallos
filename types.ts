



export enum Screen {
  SETUP,
  MATCHMAKING,
  LIVE_FIGHT,
  RESULTS,
}

export enum PesoUnit {
  GRAMS = 'gramos',
  OUNCES = 'onzas',
  POUNDS = 'libras',
}

export interface Cuerda {
  id: string;
  name: string;
  owner: string;
  baseCuerdaId?: string; // ID of the original Cuerda. If it's a front.
}

export interface Gallo {
  id:string;
  ringId: string;
  color: string;
  cuerdaId: string;
  weight: number;
  weightUnit: PesoUnit;
  ageMonths: number;
  markingId: string;
}

export interface Pelea {
  id: string;
  fightNumber: number;
  roosterA: Gallo;
  roosterB: Gallo;
  winner: 'A' | 'B' | 'DRAW' | null;
  duration: number | null; // in seconds
  isRoundFight?: boolean;
}

export interface Torneo {
  name: string;
  date: string;
  weightTolerance: number; // in grams
  ageToleranceMonths: number;
  exceptions: string[][]; // Array of exception pairs, e.g., [['p1', 'p2'], ['p1', 'p3']]
  weightUnit: PesoUnit;
  rondas: {
    enabled: boolean;
    pointsForWin: number;
    pointsForDraw: number;
  };
  roostersPerTeam: number;
}

export type CuerdaStats = {
  cuerdaId: string;
  cuerdaName: string;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  fronts: number;
  totalDurationSeconds: number;
};

export type SortKey = 'name' | 'points' | 'wins' | 'time';
export type SortConfig = {
    key: SortKey | null;
    direction: 'asc' | 'desc';
};

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface MatchmakingResults {
    mainFights: Pelea[];
    individualFights: Pelea[];
    unpairedRoosters: Gallo[];
    stats: {
        contribution: number;
        rounds: number;
        mainTournamentRoostersCount: number;
    };
}