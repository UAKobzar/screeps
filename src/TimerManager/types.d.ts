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
