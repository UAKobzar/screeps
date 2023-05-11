import { comparePostion } from "utils/position";
import { getContainer, isConstructionSite } from "./utils";

const workerManager = (creep: Creep) => {
  const memory = creep.memory.roleMemory as WorkerMemory;
  const free_capacity = creep.store.getFreeCapacity(RESOURCE_ENERGY);
  const used_capacity = creep.store.getUsedCapacity(RESOURCE_ENERGY);
  if (memory.job === "working") {
    if (free_capacity > 0) {
      const isOnPosition = comparePostion(creep.pos, memory.sourceInfo.workingPosition);
      if (isOnPosition) {
        const source = Game.getObjectById(memory.sourceInfo.sourceId)!;
        creep.harvest(source);
      } else {
        creep.moveTo(memory.sourceInfo.workingPosition.x, memory.sourceInfo.workingPosition.y);
      }
    } else {
      memory.job = "deploying";
    }
  }
  if (memory.job === "deploying") {
    if (used_capacity > 0) {
      const container = getContainer(memory.sourceInfo.containerId, memory.sourceInfo.containerPosition, creep.room);
      if (container !== null) {
        let result;
        memory.sourceInfo.containerId = container.id;
        if (isConstructionSite(container)) {
          result = creep.build(container);
        } else {
          result = creep.transfer(container, RESOURCE_ENERGY);
        }
        if (result == ERR_NOT_IN_RANGE) {
          creep.moveTo(container.pos.x, container.pos.y);
        }
      }
    } else {
      memory.job = "working";
    }
  }
};

export default workerManager;
