import { createDefaultBuilder, createDefaultWorker } from "CreepManager/utils";
import { TimerManager } from "TimerManager";
import { findBuildPosition, findBuiltStructures, generateRoad } from "utils/construction";
import { comparePostion } from "utils/position";

const Functions: TimerFunctions = {
  spawnCreep: (spanwId: Id<StructureSpawn>, creepName: string) => {
    if (Memory.timer.tickMemory.spawning) {
      TimerManager.push("spawnCreep", 1, spanwId, creepName);
      return;
    }
    const spawn = Game.getObjectById(spanwId);

    let energyCapacity = Memory.recoveryMode ? spawn?.room.energyAvailable : spawn?.room.energyCapacityAvailable;
    energyCapacity = energyCapacity ?? 0;

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
    const room = Game.rooms[roomName];
    if ((room.controller?.level ?? 0) < 2) return;
    const spawn = room.find(FIND_MY_SPAWNS)[0];
    if (spawn === undefined) return;

    const exits = [FIND_EXIT_TOP, FIND_EXIT_RIGHT, FIND_EXIT_BOTTOM, FIND_EXIT_LEFT];

    const rampartPositions: Position[] = [];

    for (let exit of exits) {
      const exitPosition = spawn.pos.findClosestByPath(exit);
      if (!exitPosition) continue;

      const path = spawn.pos.findPathTo(exitPosition);
      path.reverse();
      const towerPositionIndex = path.findIndex(step => step.x < 47 && step.y < 47 && step.x > 2 && step.y > 2);
      const rampartPositionStep = path[towerPositionIndex - 1];
      const towerPositionStep = path[towerPositionIndex];

      rampartPositions.push({ x: rampartPositionStep.x, y: rampartPositionStep.y });
    }

    const wallPositions: Position[] = [];

    const terrain = room.getTerrain();

    const queue: Position[] = [...Array(50)]
      .map((v, i) => [
        { x: 0, y: i },
        { x: 49, y: i },
        { x: i, y: 0 },
        { x: i, y: 49 }
      ])
      .reduce((acc, value) => [...acc, ...value], [])
      .filter(v => terrain.get(v.x, v.y) === 0);

    const visited: boolean[][] = Array.from({ length: 50 }, e => Array(50).fill(false));

    for (let pos of queue) {
      visited[pos.x][pos.y] = true;
    }

    while (queue.length > 0) {
      const pos = queue.shift()!;

      let neighbors = [-1, 0, 1]
        .map(v => [
          { x: pos.x - 1, y: pos.y + v },
          { x: pos.x, y: pos.y + v },
          { x: pos.x + 1, y: pos.y + v }
        ])
        .reduce((acc, value) => [...acc, ...value], [])
        .filter(v => !comparePostion(pos, v));

      for (let neighbor of neighbors) {
        if (neighbor.x < 1 || neighbor.x > 48 || neighbor.y < 1 || neighbor.y > 48) continue; // not valid, skip

        if (
          (neighbor.x === 1 || neighbor.x === 48 || neighbor.y === 1 || neighbor.y === 48) &&
          terrain.get(neighbor.x, neighbor.y) !== TERRAIN_MASK_WALL &&
          !visited[neighbor.x][neighbor.y]
        ) {
          queue.push(neighbor);
          visited[neighbor.x][neighbor.y] = true;
        }

        if (
          (neighbor.x === 2 || neighbor.x === 47 || neighbor.y === 2 || neighbor.y === 47) &&
          terrain.get(neighbor.x, neighbor.y) !== TERRAIN_MASK_WALL &&
          !visited[neighbor.x][neighbor.y]
        ) {
          wallPositions.push(neighbor);
          visited[neighbor.x][neighbor.y] = true;
        }
      }
    }

    for (let wallPosition of wallPositions) {
      if (!rampartPositions.some(p => comparePostion(p, wallPosition)))
        room.createConstructionSite(wallPosition.x, wallPosition.y, STRUCTURE_WALL);
    }

    for (let rampartPosition of rampartPositions) {
      room.createConstructionSite(rampartPosition.x, rampartPosition.y, STRUCTURE_RAMPART);
    }

    const controllerLevel = room.controller?.level ?? 0;
    const totalTowerCount =
      controllerLevel === 8 ? 6 : controllerLevel === 7 ? 3 : controllerLevel > 4 ? 2 : controllerLevel === 3 ? 1 : 0;
    const builtTowers = findBuiltStructures(room, STRUCTURE_TOWER).length;
    const towersToBuild = totalTowerCount - builtTowers;

    for (let i = 0; i < towersToBuild; i++) {
      const towerPosition = findBuildPosition(room);
      if (towerPosition) {
        room.createConstructionSite(towerPosition.x, towerPosition.y, STRUCTURE_TOWER);
        generateRoad(room, new RoomPosition(towerPosition.x, towerPosition.y, room.name));
      }
    }

    TimerManager.push("generateDefences", 1000, roomName);
  }
};

export default Functions;
