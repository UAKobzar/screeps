import { comparePostion } from "utils/position";

export const isConstructionSite = (object: StructureContainer | ConstructionSite): object is ConstructionSite => {
  return (object as ConstructionSite).progress !== undefined;
};

export const getContainer = (
  id: Id<StructureContainer | ConstructionSite> | undefined,
  position: Position,
  room: Room
): StructureContainer | ConstructionSite | null => {
  let container: StructureContainer | ConstructionSite | null = null;
  if (id) {
    container = Game.getObjectById(id);
  }
  if (container == null) {
    const containers = room.find(FIND_STRUCTURES, {
      filter: s => comparePostion(s.pos, position)
    });
    if (containers.length !== 0) {
      container = containers[0] as StructureContainer;
    } else {
      const sites = room.find(FIND_CONSTRUCTION_SITES, {
        filter: s => comparePostion(s.pos, position)
      });
      if (sites.length !== 0) {
        container = sites[0];
      }
    }
  }

  return container;
};

export const createDefaultWorker = (energyCapacity: number): BodyPartConstant[] => {
  const workCapacity = energyCapacity - BODYPART_COST.move - BODYPART_COST.carry;
  const workCount = Math.floor(workCapacity / BODYPART_COST.work);

  const parts = [...Array(workCount).fill(WORK), MOVE, CARRY];

  return parts;
};

export const createDefaultBuilder = (energyCapacity: number): BodyPartConstant[] => {
  if (energyCapacity < 350) {
    const moveCarryCapacity = energyCapacity - BODYPART_COST.work;
    const moveCarryCount = Math.floor(moveCarryCapacity / (BODYPART_COST.move + BODYPART_COST.carry));

    const parts = [...Array(moveCarryCount).fill(MOVE), ...Array(moveCarryCount).fill(CARRY), WORK];

    return parts;
  } else {
    const cost = BODYPART_COST.move * 2 + BODYPART_COST.carry * 3 + BODYPART_COST.work;

    let totalAmountOfBatches = Math.floor(energyCapacity / cost);

    const parts = [
      ...Array(totalAmountOfBatches * 2).fill(MOVE),
      ...Array(totalAmountOfBatches * 3).fill(CARRY),
      ...Array(totalAmountOfBatches).fill(WORK)
    ];

    return parts;
  }
};
