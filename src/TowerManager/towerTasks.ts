const attackEnemy: TowerTask = (tower: StructureTower): boolean => {
  const used_capacity = tower.store.getUsedCapacity(RESOURCE_ENERGY);

  if (used_capacity === 0) return false;
  let enemy: AnyCreep | AnyStructure | null = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
  enemy = enemy ?? tower.pos.findClosestByRange(FIND_HOSTILE_POWER_CREEPS);
  enemy = enemy ?? tower.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES);

  if (!enemy) return false;

  tower.attack(enemy);

  return true;
};

const healAlly: TowerTask = (tower: StructureTower): boolean => {
  const used_capacity = tower.store.getUsedCapacity(RESOURCE_ENERGY);

  if (used_capacity === 0) return false;
  const damagedCreep = tower.pos.findClosestByRange(FIND_MY_CREEPS, { filter: c => c.hits < c.hitsMax });

  if (!damagedCreep) return false;

  tower.heal(damagedCreep);

  return true;
};

const repair: TowerTask = (tower: StructureTower): boolean => {
  const used_capacity = tower.store.getUsedCapacity(RESOURCE_ENERGY);

  if (used_capacity === 0) return false;

  const repairTarget = tower.pos.findClosestByPath(FIND_STRUCTURES, {
    filter: s => s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART && s.hits < s.hitsMax
  });
  if (!repairTarget) return false; // nothing to repair

  tower.repair(repairTarget);
  return true;
};

export default [attackEnemy, healAlly, repair];
