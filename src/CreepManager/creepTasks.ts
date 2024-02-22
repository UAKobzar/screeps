import { comparePostion } from "utils/position";
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

const hasStore = (structure: any): structure is { store: StoreDefinition } => {
  return structure.store !== null && structure.store !== undefined;
};

const doOrMove = <F extends CreepDoOrMoveFunctions>(
  creep: Creep,
  positionToMove: RoomPosition,
  taskToDo: F,
  ...args: Parameters<F>
) => {
  const result = (taskToDo as any).apply(creep, args);
  if (result === ERR_NOT_IN_RANGE) {
    creep.moveTo(positionToMove.x, positionToMove.y);
  }
};

const harvestEnergy: CreepTask = (creep: Creep): boolean => {
  const memory = (creep.memory as TypedCreepMemory<[ROLE_HARVESTER]>).roleMemory;
  const free_capacity = creep.store.getFreeCapacity(RESOURCE_ENERGY);
  const used_capacity = creep.store.getUsedCapacity(RESOURCE_ENERGY);

  if (memory.job === "harvester" && free_capacity === 0) return false; //can't harvest more
  if (memory.job !== "harvester" && used_capacity > 0) return false; //doing something else

  const source = Game.getObjectById(memory.sourceInfo.sourceId)!;

  if (source.energy === 0) return false; // nothing to gather

  doOrMove(creep, source.pos, creep.harvest, source);

  return true;
};

const build: CreepTask = (creep: Creep): boolean => {
  const memory = (creep.memory as TypedCreepMemory<[ROLE_BUILDER]>).roleMemory;
  const used_capacity = creep.store.getUsedCapacity(RESOURCE_ENERGY);

  if (used_capacity === 0) return false; //can't build

  const buildTarget = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
  if (!buildTarget) return false; //nothing to build

  doOrMove(creep, buildTarget.pos, creep.build, buildTarget);

  return true;
};

const upgrade: CreepTask = (creep: Creep): boolean => {
  const memory = (creep.memory as TypedCreepMemory<[ROLE_UPGRADER]>).roleMemory;
  const used_capacity = creep.store.getUsedCapacity(RESOURCE_ENERGY);

  if (used_capacity === 0) return false;

  const controller = creep.room.controller;

  if (!controller || !controller.my) return false;

  doOrMove(creep, controller.pos, creep.upgradeController, controller);
  return true;
};

const repair: CreepTask = (creep: Creep): boolean => {
  const memory = (creep.memory as TypedCreepMemory<[ROLE_MAINTANANCE]>).roleMemory;
  const used_capacity = creep.store.getUsedCapacity(RESOURCE_ENERGY);

  if (used_capacity === 0) return false;

  const repairTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: s => s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART && s.hits < s.hitsMax
  });
  if (!repairTarget) return false; // nothing to repair

  doOrMove(creep, repairTarget.pos, creep.repair, repairTarget);

  return true;
};

const transfer: CreepTask = (creep: Creep): boolean => {
  const memory = (creep.memory as TypedCreepMemory<[ROLE_TRANSFERER, ROLE_WITHDRAWER]>).roleMemory;
  const used_capacity = creep.store.getUsedCapacity(RESOURCE_ENERGY);

  if (used_capacity === 0) return false;

  let target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure => {
      return (
        structure.structureType === STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) >= used_capacity
      );
    }
  });

  if (!target && memory.job === "withdrawer") return false; // do not transfer to container we just withdrawed

  target =
    target ??
    creep.room.storage ??
    creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: structure => {
        return hasStore(structure) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
      }
    });

  if (!target) return false;

  doOrMove(creep, target.pos, creep.transfer, target, RESOURCE_ENERGY);

  return true;
};

const transferToSpawn: CreepTask = (creep: Creep): boolean => {
  const memory = (creep.memory as TypedCreepMemory<[ROLE_SPAWN_TRANSFERER]>).roleMemory;
  const used_capacity = creep.store.getUsedCapacity(RESOURCE_ENERGY);

  if (used_capacity === 0) return false;

  const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure => {
      return (
        (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
      );
    }
  });

  if (!target) return false;

  doOrMove(creep, target.pos, creep.transfer, target, RESOURCE_ENERGY);

  return true;
};

const withdraw: CreepTask = (creep: Creep): boolean => {
  const memory = (creep.memory as TypedCreepMemory<[ROLE_WITHDRAWER]>).roleMemory;
  const free_capacity = creep.store.getFreeCapacity(RESOURCE_ENERGY);
  const used_capacity = creep.store.getUsedCapacity(RESOURCE_ENERGY);

  if (memory.job === "withdrawer" && free_capacity === 0) return false; //can't withdraw more
  if (memory.job !== "withdrawer" && used_capacity > 0) return false; //doing something else

  if (free_capacity === 0) return false;

  const groundTarget = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);

  if (groundTarget) {
    doOrMove(creep, groundTarget.pos, creep.pickup, groundTarget);
    return true;
  }

  let target: Ruin | Tombstone | AnyStructure | null = creep.pos.findClosestByPath(FIND_RUINS, {
    filter: a => a.store.getUsedCapacity() > 0
  });
  target =
    target ||
    creep.pos.findClosestByPath(FIND_TOMBSTONES, {
      filter: a => a.store.getUsedCapacity() > 0
    });
  target =
    target ||
    creep.pos.findClosestByPath(FIND_STRUCTURES, {
      filter: structure => {
        return (
          (structure.structureType == STRUCTURE_CONTAINER || structure.structureType === STRUCTURE_STORAGE) &&
          structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0
        );
      }
    });

  if (!target) return false;

  doOrMove(creep, target.pos, creep.withdraw, target, RESOURCE_ENERGY);

  return true;
};

const withdrawRecieverLink: CreepTask = (creep: Creep): boolean => {
  const memory = (creep.memory as TypedCreepMemory<[ROLE_LINK_WITHDRAWER]>).roleMemory;
  const free_capacity = creep.store.getFreeCapacity(RESOURCE_ENERGY);
  const used_capacity = creep.store.getUsedCapacity(RESOURCE_ENERGY);

  if (memory.job === "linkWithdrawer" && free_capacity === 0) return false; //can't withdraw more
  if (memory.job !== "linkWithdrawer" && used_capacity > 0) return false; //doing something else

  if (!creep.room.memory.recieverLinkId) return false;

  const target = Game.getObjectById(creep.room.memory.recieverLinkId);

  if (!target) return false;

  doOrMove(creep, target.pos, creep.withdraw, target, RESOURCE_ENERGY);

  return true;
};

const maxWallHits = 100_000;

const repairDefences: CreepTask = (creep: Creep): boolean => {
  const memory = (creep.memory as TypedCreepMemory<[ROLE_DEFENCE_MAINTENANCE]>).roleMemory;
  const used_capacity = creep.store.getUsedCapacity(RESOURCE_ENERGY);

  if (used_capacity === 0) return false;

  const allWallsAndRamparts = creep.room.find(FIND_STRUCTURES, {
    filter: s => s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART
  });

  const minHits = Math.min(...allWallsAndRamparts.map(s => s.hits));

  const repairTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: s =>
      (s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART) &&
      s.hits === minHits &&
      s.hits < maxWallHits
  });

  if (!repairTarget) return false;

  doOrMove(creep, repairTarget.pos, creep.repair, repairTarget);

  return true;
};

const taskMap: CreepsTaksMap = {
  [ROLE_BUILDER]: build,
  [ROLE_HARVESTER]: harvestEnergy,
  [ROLE_MAINTANANCE]: repair,
  [ROLE_SPAWN_TRANSFERER]: transferToSpawn,
  [ROLE_TRANSFERER]: transfer,
  [ROLE_UPGRADER]: upgrade,
  [ROLE_WITHDRAWER]: withdraw,
  [ROLE_LINK_WITHDRAWER]: withdrawRecieverLink,
  [ROLE_DEFENCE_MAINTENANCE]: repairDefences
};

export default taskMap;
