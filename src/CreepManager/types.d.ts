type ROLE_HARVESTER = "harvester";
type ROLE_BUILDER = "builder";
type ROLE_UPGRADER = "upgrader";
type ROLE_MAINTANANCE = "maintenance";
type ROLE_TRANSFERER = "transferer";
type ROLE_LINK_WITHDRAWER = "linkWithdrawer";
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
declare const ROLE_LINK_WITHDRAWER: ROLE_LINK_WITHDRAWER;
declare const ROLE_DEFENCE_MAINTENANCE: ROLE_DEFENCE_MAINTENANCE;

type Role =
  | ROLE_HARVESTER
  | ROLE_BUILDER
  | ROLE_UPGRADER
  | ROLE_MAINTANANCE
  | ROLE_TRANSFERER
  | ROLE_WITHDRAWER
  | ROLE_SPAWN_TRANSFERER
  | ROLE_DEFENCE_MAINTENANCE
  | ROLE_LINK_WITHDRAWER;

type BODY_HARVESTER = "harvester";
type BODY_UPGRADER = "upgrader";
type BODY_MOVER = "mover";
type BODY_BUILDER = "builder";

declare const BODY_HARVESTER: BODY_HARVESTER;
declare const BODY_UPGRADER: BODY_UPGRADER;
declare const BODY_MOVER: BODY_MOVER;
declare const BODY_BUILDER: BODY_BUILDER;

type Body = BODY_HARVESTER | BODY_UPGRADER | BODY_MOVER | BODY_BUILDER;

interface HarvesterSourceInfo {
  harvestingPosition: Position;
  sourceId: Id<Source> | Id<Mineral>;
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

type LinkWithdrawerMemory = {
  job: ROLE_LINK_WITHDRAWER;
};

type TransfererMemory = {
  job: ROLE_TRANSFERER;
  priorityTargets: StructureConstant[] | undefined;
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
  [ROLE_LINK_WITHDRAWER]: LinkWithdrawerMemory;
};

interface TypedCreepMemory<T extends Role[]> {
  roles: T;
  room: string;
  roleMemory: RoleMemory<T>;
  bodyType: Body;
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
