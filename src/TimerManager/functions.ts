import { createDefaultBuilder, createDefaultWorker } from "CreepManager/utils";
import { TimerManager } from "TimerManager";

const Functions: TimerFunctions = {
  spawnCreep: (spanwId: Id<StructureSpawn>, creepName: string) => {
    if (Memory.timer.tickMemory.spawning) {
      TimerManager.push("spawnCreep", 1, spanwId, creepName);
      return;
    }
    const spawn = Game.getObjectById(spanwId);

    let energyCapacity = spawn?.room.energyAvailable ?? 0;

    if (energyCapacity < 300) energyCapacity = 300;

    const parts = createDefaultWorker(energyCapacity);

    const result = spawn?.spawnCreep(parts, creepName);
    if (result !== OK) {
      TimerManager.push("spawnCreep", 1, spanwId, creepName);
    } else {
      Memory.timer.tickMemory.spawning = true;
      TimerManager.push("spawnCreep", CREEP_LIFE_TIME, spanwId, creepName);
    }
  }
};

export default Functions;
