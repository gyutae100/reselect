// Minimum TypeScript Version: 4.2

export as namespace Reselect;

export type Selector<S = any, R = unknown, P extends never | (readonly any[]) = any[]> = [P] extends [never] ? (state: S) => R : (state: S, ...params: P) => R;
export type ParametricSelector<S, P, R> = Selector<S, R, [P, ...any]>
export type OutputSelector<S extends SelectorArray, Result, Params extends readonly any[], Combiner> = Selector<GetStateFromSelectors<S>, Result, Params> & {
  resultFunc: Combiner;
  recomputations: () => number;
  resetRecomputations: () => number;
};

type SelectorArray = ReadonlyArray<Selector>

type GetStateFromSelector<S> = S extends Selector<infer State> ? State : never;
type GetStateFromSelectors<S extends SelectorArray> =
  S extends [infer Current, ...infer Other]
    ? Current extends Selector
      ? Other extends SelectorArray
        ? GetStateFromSelector<Current> | GetStateFromSelectors<Other>
        : GetStateFromSelector<Current>
      : never
    : S extends (infer Elem)[] ? GetStateFromSelector<Elem> : never;

type GetParamsFromSelector<S> = S extends Selector<any, any, infer P> ? P extends [] ? never : P : never;
export type GetParamsFromSelectors<S, Found = never> = S extends SelectorArray
  ? S extends (infer s)[]
    ? GetParamsFromSelector<s>
    : S extends [infer Current, ...infer Rest]
      ? GetParamsFromSelector<Current> extends []
        ? GetParamsFromSelectors<Rest, Found>
        : GetParamsFromSelector<Current>
      : S
  : Found;

type SelectorResultArray<Selectors extends SelectorArray, Rest extends SelectorArray = Selectors> =
  Rest extends [infer S, ...infer Remaining]
    ? S extends Selector
      ? Remaining extends SelectorArray
        ? [ReturnType<S>, ...SelectorResultArray<Selectors, Remaining>]
        : [ReturnType<S>]
    : []
  : Rest extends ((...args: any) => infer S)[] ? S[] : [];

export function createSelector<Selectors extends SelectorArray, Result>(
  ...items: [...Selectors, (...args: SelectorResultArray<Selectors>) => Result]
): OutputSelector<Selectors, Result, GetParamsFromSelectors<Selectors>, (...args: SelectorResultArray<Selectors>) => Result>;

export function createSelector<Selectors extends SelectorArray, Result>(
  selectors: [...Selectors],
  combiner: (...args: SelectorResultArray<Selectors>) => Result,
): OutputSelector<Selectors, Result, GetParamsFromSelectors<Selectors>, (...args: SelectorResultArray<Selectors>) => Result>;

export type EqualityFn<T> = (a: T, b: T /*, index: number*/) => boolean

export function defaultMemoize<F extends (...args: any[]) => any, T>(
  func: F, equalityCheck?: EqualityFn<T>,
): F;

export function createSelectorCreator(
  memoize: <F extends (...args: any[]) => any>(func: F) => F,
): typeof createSelector;



export function createSelectorCreator<T>(
  memoize: typeof defaultMemoize, 
  equalityCheck: EqualityFn<T>
) : typeof createSelector



export function createSelectorCreator<O1>(
  memoize: <F extends (...args: any[]) => any>(func: F,
                                option1: O1) => F,
  option1: O1,
): typeof createSelector;

export function createSelectorCreator<O1, O2>(
  memoize: <F extends (...args: any[]) => any>(func: F,
                                option1: O1,
                                option2: O2) => F,
  option1: O1,
  option2: O2,
): typeof createSelector;

export function createSelectorCreator<O1, O2, O3>(
  memoize: <F extends (...args: any[]) => any>(func: F,
                                option1: O1,
                                option2: O2,
                                option3: O3,
                                ...rest: any[]) => F,
  option1: O1,
  option2: O2,
  option3: O3,
  ...rest: any[],
): typeof createSelector;


// Automatic inference of state and selector+output arguments for createStructuredSelector
export function createStructuredSelector<SelectorMap extends { [key: string]: (...args: any[]) => any }>(
  selectorMap: SelectorMap
):  (
  state: SelectorMap[keyof SelectorMap] extends (state: infer State) => unknown ? State : never
) => {
  [Key in keyof SelectorMap]: ReturnType<SelectorMap[Key]>;
}

// Manual definition of state and output arguments
export function createStructuredSelector<State, Result = State>(
  selectors: {[K in keyof Result]: Selector<State, Result[K], never>},
  selectorCreator?: typeof createSelector,
): Selector<State, Result, never>;