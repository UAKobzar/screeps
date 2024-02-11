import Functions from "./functions";

const pushAtIndex = <T>(array: T[], element: T, index: number): T[] => {
  return [...array.slice(0, index), element, ...array.slice(index)];
};

export const TimerManager = {
  push: <K extends keyof TimerFunctions>(
    functionName: K,
    tickdelay: number,
    ...params: Parameters<TimerFunctions[K]>
  ) => {
    if (Memory.timer === undefined) {
      Memory.timer = {
        queue: [],
        tickMemory: {
          spawning: false
        }
      };
    }
    const tick = Game.time + tickdelay;
    const event: TimerEvent<K> = {
      functionName,
      params,
      tick
    };

    let timerQueue = Memory.timer.queue;

    let index = 0;

    while (index < timerQueue.length && timerQueue[index].tick <= tick) {
      index++;
    }

    Memory.timer.queue = pushAtIndex(timerQueue, event, index);
  },

  run: () => {
    if (Memory.timer === undefined) {
      Memory.timer = {
        queue: [],
        tickMemory: {
          spawning: false
        }
      };
    }
    const tick = Game.time;
    let timerQueue = Memory.timer.queue;

    const events = [];

    while (timerQueue[0]?.tick <= tick) {
      events.push(timerQueue.shift()!);
    }

    for (let event of events) {
      let f: any = Functions[event.functionName]; //todo try to fix
      if (f) {
        f.apply(null, event.params);
      } else {
        console.warn(event.functionName + "NOT FOUND");
      }
    }

    Memory.timer.tickMemory = {
      spawning: false
    };
  }
};
