export default {
  run: (room: Room) => {
    if (!room.memory.recieverLinkId) return;

    const recieverLink = Game.getObjectById(room.memory.recieverLinkId);

    if (!recieverLink) {
      room.memory.recieverLinkId = undefined;
      return;
    }

    const otherLinks = room.find(FIND_STRUCTURES, {
      filter: s =>
        s.structureType === STRUCTURE_LINK && s.id !== room.memory.recieverLinkId && s.store.getFreeCapacity() === 0
    });

    if (otherLinks.length === 0) return;
    const link = otherLinks[0] as StructureLink;
    link.transferEnergy(recieverLink);
  }
};
