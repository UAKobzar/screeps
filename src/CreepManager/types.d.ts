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
