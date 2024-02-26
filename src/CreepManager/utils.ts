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
  energyCapacity = Math.max(Math.min(energyCapacity, 1400), 200);

  const batchCost = BODYPART_COST.work + BODYPART_COST.carry + BODYPART_COST.move;

  const totalAmountOfBatches = Math.floor(energyCapacity / batchCost);

  const parts = [
    ...Array(totalAmountOfBatches).fill(MOVE),
    ...Array(totalAmountOfBatches).fill(CARRY),
    ...Array(totalAmountOfBatches).fill(WORK)
  ];

  return parts;
};

export const createDefaultHarvester = (energyCapacity: number): BodyPartConstant[] => {
  energyCapacity = Math.max(Math.min(energyCapacity, 1450), 200);

  const workMoveCarryCost = BODYPART_COST.work + BODYPART_COST.carry + BODYPART_COST.move;

  energyCapacity -= workMoveCarryCost;

  if (energyCapacity < 0) return [];

  const workCount = Math.min(Math.floor(energyCapacity / BODYPART_COST.work), 5) + 1;

  energyCapacity -= (workCount - 1) * BODYPART_COST.work;

  const carryCount = Math.min(Math.floor(energyCapacity / BODYPART_COST.carry), 15) + 1;

  const parts = [...Array(workCount).fill(WORK), ...Array(carryCount).fill(CARRY), MOVE];

  return parts;
};

export const createDefaultMover = (energyCapacity: number): BodyPartConstant[] => {
  energyCapacity = Math.max(Math.min(energyCapacity, 1200), 100);

  const batchCost = BODYPART_COST.carry + BODYPART_COST.move;

  const totalAmountOfBatches = Math.floor(energyCapacity / batchCost);

  const parts = [...Array(totalAmountOfBatches).fill(MOVE), ...Array(totalAmountOfBatches).fill(CARRY)];

  return parts;
};

export const isSource = (building: Source | Mineral<MineralConstant>): building is Source => {
  return (building as Source).energy !== undefined;
};
