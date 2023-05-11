import builderManager from "./builderManager";
import upgraderManager from "./upgraderManager";
import workerManager from "./workerManager";

const CreepManager = {
  run: () => {
    for (let creepName in Game.creeps) {
      const creep = Game.creeps[creepName];
      if (creep.memory.roleMemory.role == "worker") {
        workerManager(creep);
      } else if (creep.memory.roleMemory.role == "builder") {
        builderManager(creep);
      } else if (creep.memory.roleMemory.role == "upgrader") {
        upgraderManager(creep);
      }
    }
  }
};

export default CreepManager;
