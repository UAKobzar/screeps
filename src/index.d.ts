type ROLE_HARVESTER = "harvester";
type ROLE_BUILDER = "builder";
type ROLE_UPGRADER = "upgrader";
type ROLE_MAINTANANCE = "maintenance";
type ROLE_TRANSFERER = "transferer";
type ROLE_WITHDRAWER = "withdrawer";
type ROLE_SPAWN_TRANSFERER = "spawn_transferer";

declare const ROLE_HARVESTER: ROLE_HARVESTER;
declare const ROLE_BUILDER: ROLE_BUILDER;
declare const ROLE_UPGRADER: ROLE_UPGRADER;
declare const ROLE_MAINTANANCE: ROLE_MAINTANANCE;
declare const ROLE_TRANSFERER: ROLE_TRANSFERER;
declare const ROLE_SPAWN_TRANSFERER: ROLE_SPAWN_TRANSFERER;
declare const ROLE_WITHDRAWER: ROLE_WITHDRAWER;

type Role =
  | ROLE_HARVESTER
  | ROLE_BUILDER
  | ROLE_UPGRADER
  | ROLE_MAINTANANCE
  | ROLE_TRANSFERER
  | ROLE_WITHDRAWER
  | ROLE_SPAWN_TRANSFERER;

interface Position {
  x: number;
  y: number;
}

interface RoomSourceInfo {
  id: Id<Source>;
  pos: Position;
  containerPosition: Position;
  workerPositions: Position[];
  order: number;
}

interface RoomMemory {
  generating: boolean;
  generated: boolean;
  sourcesInfo?: RoomSourceInfo[];
  workersNeeded?: number;
  spawnQueueCreated?: boolean;
}

interface HarvesterSourceInfo {
  harvestingPosition: Position;
  sourceId: Id<Source>;
}

type HarvesterMemory = {
  job: ROLE_HARVESTER;
  sourceInfo: HarvesterSourceInfo;
};

type BuilderMemory = {
  job: ROLE_BUILDER;
};

type UpgraderMemory = {
  job: ROLE_UPGRADER;
};

type MaintenanceMemory = {
  job: ROLE_MAINTANANCE;
};

type WithdrawerMemory = {
  job: ROLE_WITHDRAWER;
};

type TransfererMemory = {
  job: ROLE_TRANSFERER;
};

type SpawnTransfererMemory = {
  job: ROLE_SPAWN_TRANSFERER;
};

type RoleToMemory = {
  [ROLE_HARVESTER]: HarvesterMemory;
  [ROLE_BUILDER]: BuilderMemory;
  [ROLE_UPGRADER]: UpgraderMemory;
  [ROLE_MAINTANANCE]: MaintenanceMemory;
  [ROLE_WITHDRAWER]: WithdrawerMemory;
  [ROLE_TRANSFERER]: TransfererMemory;
  [ROLE_SPAWN_TRANSFERER]: SpawnTransfererMemory;
};

type DropFirst<T extends unknown[]> = T extends [any, ...infer U] ? U : never;
type GetFirst<T extends unknown[]> = T extends [infer U, ...any] ? U : never;

type CreepRoleMemory<T extends Role[], B = T extends [any, ...infer U] ? U : never> = T extends { length: 0 }
  ? {}
  : T extends { length: 1 }
  ? RoleToMemory[T[0]]
  : T extends { length: 2 }
  ? MergeTypes<RoleToMemory[T[0]], RoleToMemory[T[1]]>
  : B extends any[]
  ? MergeTypes<RoleToMemory[T[0]], CreepRoleMemory<B>>
  : never;

interface TypedCreepMemory<T extends Role[]> {
  roles: T;
  room: string;
  roleMemory: CreepRoleMemory<T>;
}

interface CreepMemory extends TypedCreepMemory<any> {}

type TimerFunctions = {
  spawnCreep: (spanwId: Id<StructureSpawn>, creepName: string) => void;
  generateDefences: (roomName: string) => void;
};

interface TimerEvent<K extends keyof TimerFunctions> {
  functionName: K;
  params: Parameters<TimerFunctions[K]>;
  tick: number;
}

interface TimerTickMemory {
  spawning: boolean;
}

interface Timer {
  queue: TimerEvent<keyof TimerFunctions>[];
  tickMemory: TimerTickMemory;
}

interface Memory {
  uuid: number;
  log: any;

  timer: Timer;
}
