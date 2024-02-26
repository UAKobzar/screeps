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
  linkBuilt: boolean;
}

interface RoomMemory {
  generating: boolean;
  generated: boolean;
  sourcesInfo?: RoomSourceInfo[];
  workersNeeded?: number;
  recieverLinkId?: Id<StructureLink>;
  spawnQueueCreated?: boolean;
  regenerateCreepsMemory?: boolean;
  regenerateSpawnQueue?: boolean;
}

type RoleMemory<T extends Role[], B = T extends [any, ...infer U] ? U : never> = T extends { length: 0 }
  ? {}
  : T extends { length: 1 }
  ? RoleToMemory[T[0]]
  : T extends { length: 2 }
  ? MergeTypes<RoleToMemory[T[0]], RoleToMemory[T[1]]>
  : B extends any[]
  ? MergeTypes<RoleToMemory[T[0]], RoleMemory<B>>
  : never;

interface Memory {
  uuid: number;
  log: any;

  timer: Timer;
  recoveryMode: boolean;
}
