export const comparePostion = <T1 extends { x: number; y: number }, T2 extends { x: number; y: number }>(
  pos1: T1,
  pos2: T2
): boolean => {
  return pos1.x == pos2.x && pos1.y == pos2.y;
};
