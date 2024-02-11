import { createDefaultBuilder, createDefaultWorker } from "CreepManager/utils";
import { TimerManager } from "TimerManager";

const Functions: TimerFunctions = {
  spawnCreep: (spanwId: Id<StructureSpawn>, creepRole: Role, creepName: string) => {
    if (Memory.timer.tickMemory.spawning) {
      TimerManager.push("spawnCreep", 1, spanwId, creepRole, creepName);
      return;
    }
    const spawn = Game.getObjectById(spanwId);

    let energyCapacity = spawn?.room.energyAvailable ?? 0;

    if (energyCapacity < 300) energyCapacity = 300;

    const parts = creepRole === "worker" ? createDefaultWorker(energyCapacity) : createDefaultBuilder(energyCapacity);

    const result = spawn?.spawnCreep(parts, creepName);
    if (result !== OK) {
      TimerManager.push("spawnCreep", 1, spanwId, creepRole, creepName);
    } else {
      Memory.timer.tickMemory.spawning = true;
      TimerManager.push("spawnCreep", CREEP_LIFE_TIME, spanwId, creepRole, creepName);
    }
  }
};

export default Functions;
