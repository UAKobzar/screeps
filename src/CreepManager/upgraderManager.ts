import { getContainer, isConstructionSite } from "./utils";

const upgraderManager = (creep: Creep) => {
  const memory = creep.memory.roleMemory as UpgraderMemory;
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
      memory.job = "upgrading";
    }
  } else {
    if (used_capacity > 0 && creep.room.controller) {
      const result = creep.upgradeController(creep.room.controller);
      if (result === ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller.pos.x, creep.room.controller.pos.y);
      }
    } else {
      memory.job = "gathering";
    }
  }
};

export default upgraderManager;
