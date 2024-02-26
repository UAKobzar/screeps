import {
  ROLE_HARVESTER,
  ROLE_BUILDER,
  ROLE_UPGRADER,
  ROLE_MAINTANANCE,
  ROLE_TRANSFERER,
  ROLE_SPAWN_TRANSFERER,
  ROLE_WITHDRAWER,
  ROLE_LINK_WITHDRAWER,
  ROLE_DEFENCE_MAINTENANCE
} from "utils/constants/roles";

import { BODY_BUILDER, BODY_HARVESTER, BODY_MOVER, BODY_UPGRADER } from "utils/constants/bodies";
import { TimerManager } from "TimerManager";
import { sortBy } from "lodash";
import { comparePostion, isEmptyPosition, isStructure } from "utils/position";
import { findBuildPosition, findBuiltStructures, generateRoad } from "utils/construction";

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
    workerPositions: entryPoints,
    linkBuilt: false
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
  generateDefences(room);
  generateStorageConstructionSite(room);
  generateLinksConstructionSites(room);
  generateExtractor(room);
  generateTerminal(room);
};

const generateContainerConstructionSites = (room: Room) => {
  if (!room.memory.generated || !room.memory.sourcesInfo) return;
  let sites = room.find(FIND_MY_CONSTRUCTION_SITES);
  let structures = room.find(FIND_STRUCTURES);
  for (let si of room.memory.sourcesInfo.filter(s => s.linkBuilt !== true)) {
    var isBuilt =
      sites.some(s => s.pos.x == si.containerPosition.x && s.pos.y == si.containerPosition.y) ||
      structures.some(s => s.pos.x == si.containerPosition.x && s.pos.y == si.containerPosition.y);

    if (!isBuilt) {
      room.createConstructionSite(si.containerPosition.x, si.containerPosition.y, STRUCTURE_CONTAINER);
      generateRoad(room, new RoomPosition(si.containerPosition.x, si.containerPosition.y, room.name));
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

  const position = findBuildPosition(room);

  if (position) {
    room.createConstructionSite(position.x, position.y, STRUCTURE_EXTENSION);
    generateRoad(room, new RoomPosition(position.x, position.y, room.name));
  }
};

const generateDefences = (room: Room) => {
  if (!TimerManager.isInQueue(f => f.functionName === "generateDefences")) {
    TimerManager.push("generateDefences", 1, room.name);
  }
};

const generateStorageConstructionSite = (room: Room) => {
  if (!room.controller?.level || room.controller.level < 4 || room.storage) return;

  const isBuilding = room.find(FIND_MY_CONSTRUCTION_SITES, { filter: s => s.structureType === STRUCTURE_STORAGE });

  if (isBuilding) return;

  const position = findBuildPosition(room);

  if (position) {
    room.createConstructionSite(position.x, position.y, STRUCTURE_STORAGE);
    generateRoad(room, new RoomPosition(position.x, position.y, room.name));
  }
};

const generateLinksConstructionSites = (room: Room) => {
  if (!room.controller?.level || room.controller.level < 5 || !room.storage || !room.memory.sourcesInfo) return;

  const totalLinks = room.controller.level === 8 ? 6 : room.controller.level - 3;
  const builtLinks = findBuiltStructures(room, STRUCTURE_LINK);

  const linksToBuild = totalLinks - builtLinks.length;

  if (linksToBuild <= 0) return;

  if (!room.memory.recieverLinkId) {
    if (builtLinks.length === 1) {
      const builtLink = room.find(FIND_STRUCTURES, { filter: s => s.structureType === STRUCTURE_LINK });

      if (builtLink.length === 0) return; // still under construction

      room.memory.recieverLinkId = builtLink[0].id as Id<StructureLink>;
    } else {
      const position = findBuildPosition(room, room.storage.pos);

      if (position) {
        generateConstructionSite(room, STRUCTURE_LINK, position);
      }
    }
  } else {
    const sourcesInfoArray = [...room.memory.sourcesInfo];
    sourcesInfoArray.sort((s1, s2) => s2.order - s1.order);

    for (let si of sourcesInfoArray) {
      let lookAt = room.lookForAt(LOOK_STRUCTURES, si.containerPosition.x, si.containerPosition.y);

      if (si.linkBuilt) {
        if (lookAt.some(s => s.structureType === STRUCTURE_LINK)) continue;
      } else {
        for (let container of lookAt.filter(s => s.structureType === STRUCTURE_CONTAINER)) {
          container.destroy();
        }
      }

      generateConstructionSite(room, STRUCTURE_LINK, si.containerPosition);

      si.linkBuilt = true;

      room.memory.regenerateCreepsMemory = true;
    }
  }
};

const generateExtractor = (room: Room) => {
  const controllerLevel = room.controller?.level ?? 0;
  if (controllerLevel < 6) return;

  const isBuilt = findBuiltStructures(room, STRUCTURE_EXTRACTOR).length > 0;

  if (isBuilt) return;

  const spawn = room.find(FIND_MY_SPAWNS)[0];
  if (spawn === undefined) return;

  const mineral = room.find(FIND_MINERALS)[0];

  generateConstructionSite(room, STRUCTURE_EXTRACTOR, mineral.pos);

  room.memory.regenerateSpawnQueue = true;
};

const generateTerminal = (room: Room) => {
  const controllerLevel = room.controller?.level ?? 0;
  if (controllerLevel < 6) return;

  const isBuilt = findBuiltStructures(room, STRUCTURE_TERMINAL).length > 0;

  if (isBuilt) return;

  generateConstructionSite(room, STRUCTURE_TERMINAL);
};

const generateConstructionSite = (room: Room, type: BuildableStructureConstant, position?: Position) => {
  position = position ?? findBuildPosition(room);

  if (!position) {
    return;
  }
  room.createConstructionSite(position.x, position.y, type);
  generateRoad(room, new RoomPosition(position.x, position.y, room.name));
};

const getRoomCreeps = (room: Room) => {
  if (room.memory.generated == false || room.memory.sourcesInfo === undefined) return [];

  let queue: [string, CreepMemory][] = [];

  for (let sourceInfo of sortBy(room.memory.sourcesInfo, s => s.order)) {
    const harvester: [string, TypedCreepMemory<[ROLE_HARVESTER, ROLE_TRANSFERER]>] = [
      `${room.name}_worker_${sourceInfo.pos.x}:${sourceInfo.pos.y}`,
      {
        room: room.name,
        roles: [ROLE_HARVESTER, ROLE_TRANSFERER],
        roleMemory: {
          sourceInfo: {
            sourceId: sourceInfo.id,
            harvestingPosition: sourceInfo.pos
          },
          priorityTargets: sourceInfo.linkBuilt
            ? [STRUCTURE_LINK, STRUCTURE_SPAWN, STRUCTURE_TOWER]
            : [STRUCTURE_CONTAINER, STRUCTURE_SPAWN, STRUCTURE_TOWER],
          job: ROLE_HARVESTER
        },
        bodyType: "harvester"
      }
    ];
    const upgrader: [
      string,
      TypedCreepMemory<[ROLE_WITHDRAWER, ROLE_HARVESTER, ROLE_SPAWN_TRANSFERER, ROLE_UPGRADER]>
    ] = [
      `${room.name}_upgrader_${sourceInfo.containerPosition.x}:${sourceInfo.containerPosition.y}`,
      {
        room: room.name,
        roles: [ROLE_WITHDRAWER, ROLE_HARVESTER, ROLE_SPAWN_TRANSFERER, ROLE_UPGRADER],
        roleMemory: {
          job: ROLE_WITHDRAWER,
          sourceInfo: {
            sourceId: sourceInfo.id,
            harvestingPosition: sourceInfo.pos
          }
        },
        bodyType: BODY_UPGRADER
      }
    ];

    const builder: [
      string,
      TypedCreepMemory<
        [
          ROLE_WITHDRAWER,
          ROLE_HARVESTER,
          ROLE_SPAWN_TRANSFERER,
          ROLE_BUILDER,
          ROLE_MAINTANANCE,
          ROLE_DEFENCE_MAINTENANCE,
          ROLE_UPGRADER
        ]
      >
    ] = [
      `${room.name}_builder_${sourceInfo.containerPosition.x}:${sourceInfo.containerPosition.y}`,
      {
        room: room.name,
        roles: [
          ROLE_WITHDRAWER,
          ROLE_HARVESTER,
          ROLE_SPAWN_TRANSFERER,
          ROLE_BUILDER,
          ROLE_MAINTANANCE,
          ROLE_DEFENCE_MAINTENANCE,
          ROLE_UPGRADER
        ],
        roleMemory: {
          job: ROLE_WITHDRAWER,
          sourceInfo: {
            sourceId: sourceInfo.id,
            harvestingPosition: sourceInfo.pos
          }
        },
        bodyType: BODY_BUILDER
      }
    ];

    const mover: [string, TypedCreepMemory<[ROLE_LINK_WITHDRAWER, ROLE_WITHDRAWER, ROLE_TRANSFERER]>] = [
      `${room.name}_mover_${sourceInfo.containerPosition.x}:${sourceInfo.containerPosition.y}`,
      {
        room: room.name,
        roles: [ROLE_LINK_WITHDRAWER, ROLE_WITHDRAWER, ROLE_TRANSFERER],
        roleMemory: {
          job: ROLE_LINK_WITHDRAWER,
          priorityTargets: [
            STRUCTURE_EXTENSION,
            STRUCTURE_SPAWN,
            STRUCTURE_TOWER,
            STRUCTURE_TERMINAL,
            STRUCTURE_STORAGE
          ]
        },
        bodyType: BODY_MOVER
      }
    ];

    queue = [...queue, harvester, builder, upgrader, mover];
  }

  if (findBuiltStructures(room, STRUCTURE_EXTRACTOR).length > 0) {
    const mineral = room.find(FIND_MINERALS)[0];
    const mineralHarvester: [string, TypedCreepMemory<[ROLE_HARVESTER, ROLE_TRANSFERER]>] = [
      `${room.name}_extractor_${mineral.pos.x}:${mineral.pos.y}`,
      {
        room: room.name,
        roles: [ROLE_HARVESTER, ROLE_TRANSFERER],
        roleMemory: {
          job: ROLE_HARVESTER,
          priorityTargets: [STRUCTURE_TERMINAL, STRUCTURE_STORAGE],
          sourceInfo: {
            harvestingPosition: mineral.pos,
            sourceId: mineral.id
          }
        },
        bodyType: BODY_BUILDER
      }
    ];

    queue.push(mineralHarvester);
  }

  return queue;
};

const generateSpawnQueue = (room: Room) => {
  if (room.memory.spawnQueueCreated === true) return;

  const spawn = room.find(FIND_MY_SPAWNS)[0];
  if (spawn === undefined) return;

  const queue = getRoomCreeps(room);

  let tickdelay = 1;

  for (let creep of queue) {
    TimerManager.push("spawnCreep", tickdelay, spawn.id, creep[0]);
    Memory.creeps[creep[0]] = creep[1];
  }

  room.memory.spawnQueueCreated = true;
};

const regenerateCreepsMemory = (room: Room) => {
  if (!room.memory.regenerateCreepsMemory) return;

  const spawn = room.find(FIND_MY_SPAWNS)[0];
  if (spawn === undefined) return;

  const queue = getRoomCreeps(room);

  for (let creep of queue) {
    Memory.creeps[creep[0]] = creep[1];
  }

  room.memory.regenerateCreepsMemory = false;
};

const regenerateSpawnQueue = (room: Room) => {
  if (!room.memory.regenerateSpawnQueue) return;

  const spawn = room.find(FIND_MY_SPAWNS)[0];
  if (spawn === undefined) return;

  const queue = getRoomCreeps(room);

  for (let creep of queue) {
    if (!TimerManager.isInQueue(f => f.functionName === "spawnCreep" && f.params[1] === creep[0]))
      TimerManager.push("spawnCreep", 1, spawn.id, creep[0]);
    Memory.creeps[creep[0]] = creep[1];
  }

  room.memory.regenerateSpawnQueue = false;
};

const RoomsManager = {
  run: (room: Room) => {
    if (room.memory.generated !== true && room.memory.generating !== true) {
      generateRoomMemory(room);
    }
    generateConstructionSites(room);
    generateSpawnQueue(room);
    regenerateCreepsMemory(room);
    regenerateSpawnQueue(room);
  }
};

export default RoomsManager;
