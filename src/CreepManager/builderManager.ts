import { getContainer, isConstructionSite } from "./utils";

const builderManager = (creep: Creep) => {
  const memory = creep.memory.roleMemory as BuilderMemory;
  const free_capacity = creep.store.getFreeCapacity(RESOURCE_ENERGY);
  const used_capacity = creep.store.getUsedCapacity(RESOURCE_ENERGY);

  if (memory.job === "gathering") {
    if (free_capacity > 0) {
      const container = getContainer(memory.containerId, memory.containerPosition, creep.room);
      memory.containerId = container?.id;

      if (container !== null && !isConstructionSite(container)) {
        const result = creep.withdraw(container, RESOURCE_ENERGY);
        if (result === ERR_NOT_IN_RANGE) {
          creep.moveTo(memory.containerPosition.x, memory.containerPosition.y);
        }
      }
    } else {
      memory.job = "building";
    }
  }
  if (memory.job === "building") {
    if (used_capacity > 0) {
      var targets = creep.room.find(FIND_STRUCTURES, {
        filter: structure => {
          return (
            (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
          );
        }
      });

      if (targets.length > 0) {
        const result = creep.transfer(targets[0], RESOURCE_ENERGY);
        if (result === ERR_NOT_IN_RANGE) {
          creep.moveTo(targets[0].pos.x, targets[0].pos.y);
        }
      }
    } else {
      memory.job = "gathering";
    }
  }
};

export default builderManager;
