import { isEmptyPosition, isStructure } from "./position";

const buildingPattern = `rcrcrc
rrcrcr
rccrcc
rrcrcr
rcrrrc
rccrcc
rcrrrc
crcrcr
crcrcr
rcrrrc
rccrcc
rcrrrc
rrcrcr
rccrcc
rrcrcr
rcrcrc`;

export const generateRoad = (room: Room, pos: RoomPosition) => {
  const spawn = room.find(FIND_MY_SPAWNS)[0];
  if (spawn === undefined) return;

  let path = pos.findPathTo(spawn.pos.x, spawn.pos.y, { ignoreCreeps: true });

  for (let step of path) {
    room.createConstructionSite(step.x, step.y, STRUCTURE_ROAD);
  }
};

export const findBuildPosition = (room: Room, closeTo?: Position): Position | undefined => {
  closeTo = closeTo ?? room.find(FIND_MY_SPAWNS)[0]?.pos;

  if (!closeTo) return undefined;

  const visited: boolean[][] = Array.from({ length: 50 }, e => Array(50).fill(false));

  const queue: Position[] = [];

  queue.push({ x: closeTo.x, y: closeTo.y });
  visited[closeTo.x][closeTo.y] = true;

  while (queue.length > 0) {
    const position = queue.shift()!;

    const area = room.lookAtArea(position.y - 1, position.x - 1, position.y + 1, position.x + 1);

    let emptySpaces = 0;
    let neighbors = 0;

    for (let y = position.y - 1; y <= position.y + 1; y++) {
      for (let x = position.x - 1; x <= position.x + 1; x++) {
        const array = area[y][x];

        const isEmpty = isEmptyPosition(array, true);
        neighbors += isStructure(array, true) ? 1 : 0;

        emptySpaces += isEmpty ? 1 : 0;

        if (!visited[x][y] && x > 1 && x < 48 && y > 1 && y < 48 && isEmpty) {
          queue.push({ x, y });
          visited[x][y] = true;
        }
      }
    }

    const canBuild = isEmptyPosition(area[position.y][position.x], false) && emptySpaces >= 4 && neighbors <= 2;

    if (canBuild) {
      return position;
    }
  }

  return undefined;
};

export const findBuiltStructures = <K extends BuildableStructureConstant, S extends ConcreteStructureMap[K]>(
  room: Room,
  structureType: K
): (S | ConstructionSite<K>)[] => {
  return [
    ...room.find(FIND_STRUCTURES, { filter: s => s.structureType === structureType }),
    ...room.find(FIND_MY_CONSTRUCTION_SITES, { filter: s => s.structureType === structureType })
  ] as any;
};
