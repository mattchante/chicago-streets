// state: mutable values that several modules read and write (camera angles, run flags, timers).
// late:  objects and functions defined in modules that load AFTER the module using them
//        (e.g. traffic needs the player). Filled in by the defining module; read only at runtime.
export const state = {};
export const late = {};
