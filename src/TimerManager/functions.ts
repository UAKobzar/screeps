import { TimerManager } from "TimerManager";

const Functions: TimerFunctions = {
  spawnCreep: (spanwId: Id<StructureSpawn>, parts: BodyPartConstant[], creepName: string) => {
    if (Memory.timer.tickMemory.spawning) {
      TimerManager.push("spawnCreep", 1, spanwId, parts, creepName);
      return;
    }
    const spawn = Game.getObjectById(spanwId);
    const result = spawn?.spawnCreep(parts, creepName);
    if (result !== OK) {
      TimerManager.push("spawnCreep", 1, spanwId, parts, creepName);
    } else {
      Memory.timer.tickMemory.spawning = true;
      TimerManager.push("spawnCreep", CREEP_LIFE_TIME, spanwId, parts, creepName);
    }
  }
};

export default Functions;
