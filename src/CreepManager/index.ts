import taskMap from "./creepTasks";

const doJob = (creep: Creep, job: Role): boolean => {
  const task = taskMap[job];

  return task(creep);
};

const CreepManager = {
  run: () => {
    for (let creepName in Game.creeps) {
      const creep = Game.creeps[creepName];
      const currentJob = creep.memory.roleMemory.job as Role;
      if (!doJob(creep, currentJob)) {
        for (let role of creep.memory.roles) {
          let typedRole = role as Role;
          if (doJob(creep, typedRole)) {
            creep.say(typedRole);
            creep.memory.roleMemory.job = typedRole;
            break;
          }
        }
      }
    }
  }
};

export default CreepManager;
