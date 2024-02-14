import { createDefaultBuilder, createDefaultWorker } from "CreepManager/utils";
import { TimerManager } from "TimerManager";
import { generateRoad } from "utils/construction";

const Functions: TimerFunctions = {
  spawnCreep: (spanwId: Id<StructureSpawn>, creepName: string) => {
    if (Memory.timer.tickMemory.spawning) {
      TimerManager.push("spawnCreep", 1, spanwId, creepName);
      return;
    }
    const spawn = Game.getObjectById(spanwId);

    let energyCapacity = spawn?.room.energyCapacityAvailable ?? 0;

    if (energyCapacity < 300) energyCapacity = 300;
    if (energyCapacity > 1400) energyCapacity = 1400;

    const parts = createDefaultWorker(energyCapacity);

    const result = spawn?.spawnCreep(parts, creepName);
    if (result !== OK) {
      TimerManager.push("spawnCreep", 1, spanwId, creepName);
    } else {
      Memory.timer.tickMemory.spawning = true;
      TimerManager.push("spawnCreep", CREEP_LIFE_TIME, spanwId, creepName);
    }
  },

  generateDefences: (roomName: string) => {
    debugger;
    const room = Game.rooms[roomName];
    if ((room.controller?.level ?? 0) < 2) return;
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if (spawn === undefined) return;

    const exits = [FIND_EXIT_TOP, FIND_EXIT_RIGHT, FIND_EXIT_BOTTOM, FIND_EXIT_LEFT];

    const rampartPositions: Position[] = [];
    const towerPositions: Position[] = [];

    for (let exit of exits) {
      const exitPosition = spawn.pos.findClosestByPath(exit);
      if (!exitPosition) continue;

      const path = spawn.pos.findPathTo(exitPosition);
      path.reverse();
      const towerPositionIndex = path.findIndex(step => step.x < 47 && step.y < 47 && step.x > 2 && step.y > 2);
      const rampartPositionStep = path[towerPositionIndex - 1];
      const towerPositionStep = path[towerPositionIndex];

      rampartPositions.push({ x: rampartPositionStep.x, y: rampartPositionStep.y });
      towerPositions.push(towerPositionStep);
    }
    const wallIndexes = [2, 47];
    for (let y of wallIndexes)
      for (let x = 3; x < 46; x++) {
        if (rampartPositions.findIndex(position => position.x === x && position.y === y) === -1)
          room.createConstructionSite(x, y, STRUCTURE_WALL);
      }

    for (let x of wallIndexes)
      for (let y = 3; y < 46; y++) {
        if (rampartPositions.findIndex(position => position.x === x && position.y === y) === -1)
          room.createConstructionSite(x, y, STRUCTURE_WALL);
      }

    for (let rampartPosition of rampartPositions) {
      room.createConstructionSite(rampartPosition.x, rampartPosition.y, STRUCTURE_RAMPART);
    }

    for (let towerPosition of towerPositions) {
      room.createConstructionSite(towerPosition.x, towerPosition.y, STRUCTURE_TOWER);
      generateRoad(room, new RoomPosition(towerPosition.x, towerPosition.y, room.name));
    }

    TimerManager.push("generateDefences", 1000, roomName);
  }
};

export default Functions;
