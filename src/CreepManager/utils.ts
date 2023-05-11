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
