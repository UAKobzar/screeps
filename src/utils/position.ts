export const comparePostion = <T1 extends { x: number; y: number }, T2 extends { x: number; y: number }>(
  pos1: T1,
  pos2: T2
): boolean => {
  return pos1.x == pos2.x && pos1.y == pos2.y;
};

export const isEmptyPosition = (lookAt: LookAtResult<LookConstant>[], ignoreRoads = false) => {
  return lookAt.every(
    a =>
      a.type === "creep" ||
      a.type === "powerCreep" ||
      a.type === "flag" ||
      (a.type === "structure" && a.structure?.structureType === "road" && ignoreRoads) ||
      (a.type === "constructionSite" && a.constructionSite?.structureType === "road" && ignoreRoads) ||
      (a.type === "terrain" && a.terrain !== "wall") //todo rewrite
  );
};

export const isStructure = (lookAt: LookAtResult<LookConstant>[], ignoreRoads = false) => {
  return lookAt.some(
    a =>
      (a.type === "structure" && (!ignoreRoads || a.structure?.structureType !== "road")) ||
      (a.type === "constructionSite" && (!ignoreRoads || a.constructionSite?.structureType !== "road"))
  );
};
