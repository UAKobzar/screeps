export const generateRoad = (room: Room, pos: RoomPosition) => {
  const spawn = room.find(FIND_MY_SPAWNS)[0];
  if (spawn === undefined) return;

  let path = pos.findPathTo(spawn.pos.x, spawn.pos.y, { ignoreCreeps: true });

  for (let step of path) {
    room.createConstructionSite(step.x, step.y, STRUCTURE_ROAD);
  }
};
