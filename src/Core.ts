import { useSyncExternalStore } from "react";
interface SideEffect<
  S,
  A extends Record<string, (state: S, payload: any) => S>
> {
  types: (keyof A)[] | "*";
  handler: (state: S, action: ActionType<A>) => Promise<S>;
}

export type ActionType<
  A extends Record<string, (state: any, payload: any) => any>
> = {
  [P in keyof A]: { type: P } & {
    payload: Parameters<A[P]>[1];
  };
}[keyof A];

const createCore = <
  S,
  V,
  A extends Record<string, (state: S, payload: any) => S>
>(
  values: V,
  initState: (args: V) => S,
  actions: A,
  sideEffects: SideEffect<S, A>[]
) => {
  const init = (values: V) => initState(values);

  let state = init(values);
  const getState = () => state;
  const listeners = new Set<() => void>();
  const setState = (fn: (state: S) => S) => {
    state = fn(state);
    listeners.forEach((l) => l());
    return state;
  };
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  async function dispatch(action: ActionType<A>) {
    state = actions[action.type](state, action.payload as never);
    listeners.forEach((l) => l());

    for (const sideEffect of sideEffects) {
      if (sideEffect.types === "*" || sideEffect.types.includes(action.type)) {
        const newState = await sideEffect.handler(state, action);
        if (!Object.is(newState, state)) {
          state = newState;
          listeners.forEach((l) => l());
        }
      }
    }

    return state;
  }

  return { getState, setState, subscribe, dispatch, init };
};

export type creatCore = ReturnType<typeof createCore>;

export function coreSetup<
  S,
  V,
  A extends Record<string, (state: S, payload: any) => S>
>(
  values: V,
  initState: (args: V) => S,
  actions: A,
  sideEffects: SideEffect<S, A>[] = []
) {
  const core = createCore(values, initState, actions, sideEffects);

  const useCore = <T>(selector: (s: S) => T): T => {
    return useSyncExternalStore(core.subscribe, () =>
      selector(core.getState())
    );
  };
  const useCoreDispatch = () => {
    return core.dispatch;
  };
  return {
    useCoreDispatch,
    useCore,
    core,
  };
}
