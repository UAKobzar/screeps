import { comparePostion } from "utils/position";
import {
  ROLE_HARVESTER,
  ROLE_BUILDER,
  ROLE_UPGRADER,
  ROLE_MAINTANANCE,
  ROLE_TRANSFERER,
  ROLE_SPAWN_TRANSFERER,
  ROLE_WITHDRAWER
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

  const isOnPosition = comparePostion(creep.pos, memory.sourceInfo.harvestingPosition);
  if (isOnPosition) {
    const source = Game.getObjectById(memory.sourceInfo.sourceId)!;
    creep.harvest(source);
  } else {
    creep.moveTo(memory.sourceInfo.harvestingPosition.x, memory.sourceInfo.harvestingPosition.y);
  }
  return true;
};

const build: CreepTask = (creep: Creep): boolean => {
  const memory = (creep.memory as TypedCreepMemory<[ROLE_BUILDER]>).roleMemory;
  const used_capacity = creep.store.getUsedCapacity(RESOURCE_ENERGY);

  if (used_capacity === 0) return false; //can't build

  const buildTarget = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
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

  const repairTarget = creep.pos.findClosestByPath(FIND_STRUCTURES, { filter: s => s.hits < s.hitsMax });
  if (!repairTarget) return false; // nothing to repair

  doOrMove(creep, repairTarget.pos, creep.repair, repairTarget);

  return true;
};

const transfer: CreepTask = (creep: Creep): boolean => {
  const memory = (creep.memory as TypedCreepMemory<[ROLE_TRANSFERER]>).roleMemory;
  const used_capacity = creep.store.getUsedCapacity(RESOURCE_ENERGY);

  if (used_capacity === 0) return false;

  const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
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

  const target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: structure => {
      return structure.structureType == STRUCTURE_CONTAINER && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0;
    }
  });

  if (!target) return false;

  doOrMove(creep, target.pos, creep.withdraw, target, RESOURCE_ENERGY);

  return true;
};

const taskMap: CreepsTaksMap = {
  [ROLE_BUILDER]: build,
  [ROLE_HARVESTER]: harvestEnergy,
  [ROLE_MAINTANANCE]: repair,
  [ROLE_SPAWN_TRANSFERER]: transferToSpawn,
  [ROLE_TRANSFERER]: transfer,
  [ROLE_UPGRADER]: upgrade,
  [ROLE_WITHDRAWER]: withdraw
};

export default taskMap;
