import { comparePostion, isEmptyPosition, isStructure } from "./position";

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
rcrcrc`
  .split("\n")
  .map(s => s.split(""));

const isBuildingPositionByPattern = (position: Position) => {
  const y = position.y % buildingPattern.length;
  const x = position.x % buildingPattern[y].length;

  return buildingPattern[y][x] === "c";
};

export const generateRoad = (room: Room, pos: RoomPosition) => {
  const spawn = room.find(FIND_MY_SPAWNS)[0];
  if (spawn === undefined) return;

  for (let x = pos.x - 1; x <= pos.x + 1; x++)
    for (let y = pos.y - 1; y <= pos.y + 1; y++) {
      if (!comparePostion(pos, { x, y }) && !isBuildingPositionByPattern(pos)) {
        room.createConstructionSite(x, y, STRUCTURE_ROAD);
      }
    }

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
    const isNearSpecial = Object.keys(area).some(y =>
      Object.keys(area[Number(y)]).some(x =>
        area[Number(y)][Number(x)].some(
          t => t.type === "source" || t.type === "mineral" || t.structure?.structureType === "controller"
        )
      )
    );

    const isBuildPosition = isBuildingPositionByPattern(position);

    const canBuild = isBuildPosition && !isNearSpecial && isEmptyPosition(area[position.y][position.x], false);

    if (canBuild) {
      return position;
    } else {
      for (let x = position.x - 1; x <= position.x + 1; x++)
        for (let y = position.y - 1; y <= position.y + 1; y++)
          if (x > 1 && x < 48 && y > 1 && y < 48 && !visited[x][y]) {
            queue.push({ x, y });
            visited[x][y] = true;
          }
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
