type ROLE_HARVESTER = "harvester";
type ROLE_BUILDER = "builder";
type ROLE_UPGRADER = "upgrader";
type ROLE_MAINTANANCE = "maintenance";
type ROLE_TRANSFERER = "transferer";
type ROLE_WITHDRAWER = "withdrawer";
type ROLE_SPAWN_TRANSFERER = "spawn_transferer";
type ROLE_DEFENCE_MAINTENANCE = "defenceMaintenance";

declare const ROLE_HARVESTER: ROLE_HARVESTER;
declare const ROLE_BUILDER: ROLE_BUILDER;
declare const ROLE_UPGRADER: ROLE_UPGRADER;
declare const ROLE_MAINTANANCE: ROLE_MAINTANANCE;
declare const ROLE_TRANSFERER: ROLE_TRANSFERER;
declare const ROLE_SPAWN_TRANSFERER: ROLE_SPAWN_TRANSFERER;
declare const ROLE_WITHDRAWER: ROLE_WITHDRAWER;
declare const ROLE_DEFENCE_MAINTENANCE: ROLE_DEFENCE_MAINTENANCE;

type Role =
  | ROLE_HARVESTER
  | ROLE_BUILDER
  | ROLE_UPGRADER
  | ROLE_MAINTANANCE
  | ROLE_TRANSFERER
  | ROLE_WITHDRAWER
  | ROLE_SPAWN_TRANSFERER
  | ROLE_DEFENCE_MAINTENANCE;

interface HarvesterSourceInfo {
  harvestingPosition: Position;
  sourceId: Id<Source>;
}

type HarvesterMemory = {
  job: ROLE_HARVESTER;
  sourceInfo: HarvesterSourceInfo;
};

type BuilderMemory = {
  job: ROLE_BUILDER;
};

type UpgraderMemory = {
  job: ROLE_UPGRADER;
};

type MaintenanceMemory = {
  job: ROLE_MAINTANANCE;
};

type WithdrawerMemory = {
  job: ROLE_WITHDRAWER;
};

type TransfererMemory = {
  job: ROLE_TRANSFERER;
};

type SpawnTransfererMemory = {
  job: ROLE_SPAWN_TRANSFERER;
};

type DefenceMaintenanceMemory = {
  job: ROLE_DEFENCE_MAINTENANCE;
};

type RoleToMemory = {
  [ROLE_HARVESTER]: HarvesterMemory;
  [ROLE_BUILDER]: BuilderMemory;
  [ROLE_UPGRADER]: UpgraderMemory;
  [ROLE_MAINTANANCE]: MaintenanceMemory;
  [ROLE_WITHDRAWER]: WithdrawerMemory;
  [ROLE_TRANSFERER]: TransfererMemory;
  [ROLE_SPAWN_TRANSFERER]: SpawnTransfererMemory;
  [ROLE_DEFENCE_MAINTENANCE]: DefenceMaintenanceMemory;
};

interface TypedCreepMemory<T extends Role[]> {
  roles: T;
  room: string;
  roleMemory: RoleMemory<T>;
}

interface CreepMemory extends TypedCreepMemory<any> {}

type CreepTask = (creep: Creep) => boolean;

type isDoOrMoveFunction<F> = F extends (...args: any) => any
  ? ERR_NOT_IN_RANGE extends ReturnType<F>
    ? true
    : false
  : false;

type CreepDoOrMoveFunctions = {
  [K in keyof Creep]: isDoOrMoveFunction<Creep[K]> extends true ? Creep[K] : never;
}[keyof Creep];

type CreepsTaksMap = { [K in Role]: CreepTask };
