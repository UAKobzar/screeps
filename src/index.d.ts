//import { Functions, TimerEvent } from "TimerManager/types";

type Role = "worker";

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

interface WorkerSourceInfo {
  workingPosition: Position;
  containerPosition: Position;
  containerId?: Id<StructureContainer | ConstructionSite>;
  sourceId: Id<Source>;
}

type WorkerJob = "working" | "deploying";

type WorkerMemory = {
  role: "worker";
  job: WorkerJob;
  sourceInfo: WorkerSourceInfo;
};

type BuilderJob = "building" | "gathering";

type BuilderMemory = {
  role: "builder";
  containerPosition: Position;
  containerId?: Id<StructureContainer | ConstructionSite>;
  job: BuilderJob;
};

type UpgraderJob = "upgrading" | "gathering";

type UpgraderMemory = {
  role: "upgrader";
  containerPosition: Position;
  containerId?: Id<StructureContainer | ConstructionSite>;
  job: UpgraderJob;
};

interface CreepMemory {
  roleMemory: WorkerMemory | BuilderMemory | UpgraderMemory;
  room: string;
}

type TimerFunctions = {
  spawnCreep: (spanwId: Id<StructureSpawn>, parts: BodyPartConstant[], creepName: string) => void;
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
