import { createDefaultBuilder, createDefaultWorker } from "CreepManager/utils";
import { TimerManager } from "TimerManager";
import { sortBy } from "lodash";

type InternalTerrain = number[][];
type PathMatrix = {
  matrix: number[][];
  pos: Position;
};
const TERRAIN_MASK_PLAIN = 0;

const createInternalTerrain = (terrain: RoomTerrain): InternalTerrain => {
  const result: number[][] = Array.from({ length: 50 }, e => Array(50));

  for (let x = 0; x < 50; x++) {
    for (let y = 0; y < 50; y++) {
      const tile = terrain.get(x, y);
      result[x][y] = tile;
    }
  }

  return result;
};

const calculatePathMatrix = (pos: Position, terrain: InternalTerrain): PathMatrix => {
  const matrix: number[][] = Array.from({ length: 50 }, e => Array(50).fill(Number.MAX_VALUE));

  const queue: { x: number; y: number; distance: number }[] = [];

  matrix[pos.x][pos.y] = 0;
  queue.push({ x: pos.x, y: pos.y, distance: 0 });

  while (queue.length > 0) {
    const item = queue.shift()!;

    for (let y = Math.max(0, item.y - 1); y < Math.min(50, item.y + 2); y++) {
      for (let x = Math.max(0, item.x - 1); x < Math.min(50, item.x + 2); x++) {
        if (terrain[x][y] !== TERRAIN_MASK_WALL && matrix[x][y] === Number.MAX_VALUE) {
          matrix[x][y] = item.distance + 1;
          queue.push({ x, y, distance: item.distance + 1 });
        }
      }
    }
  }

  return { pos: { ...pos }, matrix };
};

const createSourceInfo = (source: Source, spawn: StructureSpawn, terrain: InternalTerrain): RoomSourceInfo => {
  const entryPoints: Position[] = [];

  for (let y = Math.max(0, source.pos.y - 1); y < Math.min(50, source.pos.y + 2); y++)
    for (let x = Math.max(0, source.pos.x - 1); x < Math.min(50, source.pos.x + 2); x++) {
      if (terrain[x][y] !== TERRAIN_MASK_WALL) {
        entryPoints.push({ x, y });
      }
    }

  const matrixes: PathMatrix[] = [];

  for (let i = 0; i < entryPoints.length; i++) {
    matrixes.push(calculatePathMatrix(entryPoints[i], terrain));
  }

  let containerPosition = { x: 0, y: 0, value: Number.MAX_VALUE };

  for (let y = 0; y < 50; y++)
    for (let x = 0; x < 50; x++) {
      const comparisionValue = matrixes[0].matrix[x][y];
      if (comparisionValue === Number.MAX_VALUE) continue;

      const values = matrixes.map(m => m.matrix[x][y]);

      if (values.some(v => v === 0)) continue;

      const sum = values.reduce((acc, value) => acc + value, 0);

      if (containerPosition.value > sum) {
        containerPosition = { x, y, value: sum };
      }
    }

  const path = spawn.room.findPath(spawn.pos, source.pos);

  return {
    id: source.id,
    containerPosition: {
      x: containerPosition.x,
      y: containerPosition.y
    },
    order: path.length,
    pos: { x: source.pos.x, y: source.pos.y },
    workerPositions: entryPoints
  };
};

const generateRoomMemory = (room: Room) => {
  room.memory = { generating: true, generated: false };
  const sources = room.find(FIND_SOURCES);

  const spawn = room.find(FIND_MY_SPAWNS)[0];

  if (spawn == undefined || sources?.length < 1) {
    room.memory = { generated: true, generating: false };
    return;
  }

  const terrain = createInternalTerrain(room.getTerrain());

  const sourcesInfo = sources.map(s => createSourceInfo(s, spawn, terrain));

  room.memory = {
    generating: false,
    generated: true,
    sourcesInfo: sourcesInfo,
    workersNeeded: sourcesInfo.map(s => s.workerPositions.length).reduce((acc, value) => acc + value, 0)
  };
};

const generateConstructionSites = (room: Room) => {
  generateContainerConstructionSites(room);
  generateExtensionsCounstructionSites(room);
  //generateRoads(room); -- move to timer
};

const generateContainerConstructionSites = (room: Room) => {
  if (!room.memory.generated || !room.memory.sourcesInfo) return;
  let sites = room.find(FIND_MY_CONSTRUCTION_SITES);
  let structures = room.find(FIND_STRUCTURES);
  for (let si of room.memory.sourcesInfo) {
    var isBuilt =
      sites.some(s => s.pos.x == si.containerPosition.x && s.pos.y == si.containerPosition.y) ||
      structures.some(s => s.pos.x == si.containerPosition.x && s.pos.y == si.containerPosition.y);

    if (!isBuilt) {
      room.createConstructionSite(si.containerPosition.x, si.containerPosition.y, STRUCTURE_CONTAINER);
    }
  }
};

const generateExtensionsCounstructionSites = (room: Room) => {
  const exstensions = room.find(FIND_STRUCTURES).filter(s => s.structureType === STRUCTURE_EXTENSION);
  const extensionConstructionSites = room
    .find(FIND_MY_CONSTRUCTION_SITES)
    .filter(s => s.structureType === STRUCTURE_EXTENSION);

  const totalExtensions = exstensions.length + extensionConstructionSites.length;

  const controllerLevel = room.controller?.level ?? 0;

  const totalAvailableExtensions = controllerLevel > 2 ? (controllerLevel - 2) * 10 : controllerLevel == 2 ? 5 : 0;

  let extensionsToBuild = totalAvailableExtensions - totalExtensions;

  if (extensionsToBuild === 0) return;

  const spawn = room.find(FIND_MY_SPAWNS)[0];

  const visited: boolean[][] = Array.from({ length: 50 }, e => Array(50).fill(false));

  const queue: Position[] = [];
  const buildPositions: Position[] = [];

  queue.push({ x: spawn.pos.x, y: spawn.pos.y });
  visited[spawn.pos.x][spawn.pos.y] = true;

  while (extensionsToBuild > 0 && queue.length > 0) {
    const position = queue.shift()!;

    const area = room.lookAtArea(position.y - 1, position.x - 1, position.y + 1, position.x + 1);

    let canBuild = true;

    for (let y = position.y - 1; y <= position.y + 1; y++) {
      for (let x = position.x - 1; x <= position.x + 1; x++) {
        const array = area[y][x];

        canBuild =
          canBuild &&
          array.every(
            a =>
              a.type === "creep" ||
              a.type === "powerCreep" ||
              a.type === "flag" ||
              (a.type === "terrain" && a.terrain !== "wall")
          );

        if (!visited[x][y] && x > 0 && x < 49 && y > 0 && y < 49) {
          queue.push({ x, y });
          visited[x][y] = true;
        }
      }
    }

    if (canBuild) {
      room.createConstructionSite(position.x, position.y, STRUCTURE_EXTENSION);
      break; // one per tick for now
    }
  }
};

const generateRoads = (room: Room) => {
  const spawn = room.find(FIND_MY_SPAWNS)[0];
  if (spawn === undefined) return;

  const structures = room.find(FIND_STRUCTURES, {
    filter: s => s.structureType !== STRUCTURE_RAMPART && s.structureType !== STRUCTURE_SPAWN
  });

  let usedPathes: PathStep[][] = [];

  for (let structure of structures) {
    var path = structure.pos.findPathTo(spawn.pos.x, spawn.pos.y, { ignoreCreeps: true });

    usedPathes.push(path);
  }

  for (let usedPath of usedPathes) {
    for (let step of usedPath) {
      room.createConstructionSite(step.x, step.y, STRUCTURE_ROAD);
    }
  }
};

const generateSpawnQueue = (room: Room) => {
  if (room.memory.generated == false || room.memory.sourcesInfo === undefined || room.memory.spawnQueueCreated === true)
    return;
  const spawn = room.find(FIND_MY_SPAWNS)[0];
  if (spawn === undefined) return;

  let queue: [Role, string, CreepMemory][] = [];

  for (let sourceInfo of sortBy(room.memory.sourcesInfo, s => s.order)) {
    const workers = sourceInfo.workerPositions.map<[Role, string, CreepMemory]>(wp => {
      const memory: CreepMemory = {
        room: room.name,
        roleMemory: {
          role: "worker",
          sourceInfo: {
            containerPosition: sourceInfo.containerPosition,
            sourceId: sourceInfo.id,
            workingPosition: wp
          },
          job: "working"
        }
      };
      return ["worker", `${room.name}_worker_${wp.x}:${wp.y}`, memory];
    });
    const builder: [Role, string, CreepMemory] = [
      "builder",
      `${room.name}_builder_${sourceInfo.containerPosition.x}:${sourceInfo.containerPosition.y}`,
      {
        room: room.name,
        roleMemory: {
          role: "builder",
          containerPosition: sourceInfo.containerPosition,
          job: "gathering"
        }
      }
    ];
    const upgrader: [Role, string, CreepMemory] = [
      "upgrader",
      `${room.name}_upgrader_${sourceInfo.containerPosition.x}:${sourceInfo.containerPosition.y}`,
      {
        room: room.name,
        roleMemory: {
          role: "upgrader",
          containerPosition: sourceInfo.containerPosition,
          job: "gathering"
        }
      }
    ];

    queue = [...queue, ...workers, builder, upgrader];
  }

  let tickdelay = 1;

  for (let creep of queue) {
    TimerManager.push("spawnCreep", tickdelay, spawn.id, creep[0], creep[1]);
    Memory.creeps[creep[1]] = creep[2];
  }

  room.memory.spawnQueueCreated = true;
};

const RoomsManager = {
  run: (room: Room) => {
    if (room.memory.generated !== true && room.memory.generating !== true) {
      generateRoomMemory(room);
    }
    generateConstructionSites(room);
    generateSpawnQueue(room);
  }
};

export default RoomsManager;
