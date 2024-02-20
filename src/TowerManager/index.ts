import towerTasks from "./towerTasks";

const TowerManager = {
  run: (room: Room) => {
    const towers = room.find(FIND_MY_STRUCTURES, { filter: s => s.structureType === STRUCTURE_TOWER });

    for (let tower of towers) {
      towerTasks.find(task => task(tower as StructureTower));
    }
  }
};

export default TowerManager;
