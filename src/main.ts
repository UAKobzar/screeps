import { ErrorMapper } from "utils/ErrorMapper";
import RoomsManager from "RoomsManager";
import { TimerManager } from "TimerManager";
import CreepManager from "CreepManager";
declare global {
  /*
    Example types, expand on these or remove them and add your own.
    Note: Values, properties defined here do no fully *exist* by this type definiton alone.
          You must also give them an implemention if you would like to use them. (ex. actually setting a `role` property in a Creeps memory)

    Types added in this `global` block are in an ambient, global context. This is needed because `main.ts` is a module file (uses import or export).
    Interfaces matching on name from @types/screeps will be merged. This is how you can extend the 'built-in' interfaces from @types/screeps.
  */

  // Syntax for adding proprties to `global` (ex "global.log")
  namespace NodeJS {
    interface Global {
      log: any;
      ROLE_HARVESTER: ROLE_HARVESTER;
      ROLE_BUILDER: ROLE_BUILDER;
    }
  }
}

global.ROLE_HARVESTER = "harvester";
global.ROLE_BUILDER = "builder";
// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  TimerManager.run();
  CreepManager.run();
  for (let roomName in Game.rooms) {
    RoomsManager.run(Game.rooms[roomName]);
  }
  // Automatically delete memory of missing creeps
  // for (const name in Memory.creeps) {
  //   if (!(name in Game.creeps)) {
  //     delete Memory.creeps[name];
  //   }
  // }
});
