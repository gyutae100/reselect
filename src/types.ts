/*
 *
 * Reselect Data Types
 *
 */

/** A standard selector function, which takes three generic type arguments:
 * @param State The first value, often a Redux root state object
 * @param Result The final result returned by the selector
 * @param Params All additional arguments passed into the selector
 */
export type Selector<
  // The state can be anything
  State = any,
  // The result will be inferred
  Result = unknown,
  // There are either 0 params, or N params
  Params extends never | readonly any[] = any[]
  // If there are 0 params, type the function as just State in, Result out.
  // Otherwise, type it as State + Params in, Result out.
> = [Params] extends [never]
  ? (state: State) => Result
  : (state: State, ...params: Params) => Result

/** Selectors generated by Reselect have several additional fields attached: */
interface OutputSelectorFields<Combiner, Result> {
  /** The final function passed to `createSelector` */
  resultFunc: Combiner
  /** The same function, memoized */
  memoizedResultFunc: Combiner
  /** Returns the last result calculated by the selector */
  lastResult: () => Result
  /** An array of the input selectors */
  dependencies: SelectorArray
  /** Counts the number of times the output has been recalculated */
  recomputations: () => number
  /** Resets the count of recomputations count to 0 */
  resetRecomputations: () => number
}

/** Represents the actual selectors generated by `createSelector`.
 * The selector is:
 * - "a function that takes this state + params and returns a result"
 * - plus the attached additional fields
 */
export type OutputSelector<
  S extends SelectorArray,
  Result,
  Combiner,
  Params extends readonly any[] = never // MergeParameters<S>
> = Selector<GetStateFromSelectors<S>, Result, Params> &
  OutputSelectorFields<Combiner, Result>

/** A selector that is assumed to have one additional argument, such as
 * the props from a React component
 */
export type ParametricSelector<State, Props, Result> = Selector<
  State,
  Result,
  [Props, ...any]
>

/** A generated selector that is assumed to have one additional argument */
export type OutputParametricSelector<State, Props, Result, Combiner> =
  ParametricSelector<State, Props, Result> &
    OutputSelectorFields<Combiner, Result>

/** An array of input selectors */
export type SelectorArray = ReadonlyArray<Selector>

/** A standard function returning true if two values are considered equal */
export type EqualityFn = (a: any, b: any) => boolean

/*
 *
 * Reselect Internal Types
 *
 */

/** Extracts an array of all return types from all input selectors */
export type SelectorResultArray<Selectors extends SelectorArray> =
  ExtractReturnType<Selectors>

/** Determines the combined single "State" type (first arg) from all input selectors */
export type GetStateFromSelectors<S extends SelectorArray> =
  MergeParameters<S>[0]

/** Determines the combined  "Params" type (all remaining args) from all input selectors */
export type GetParamsFromSelectors<
  S extends SelectorArray,
  RemainingItems extends readonly unknown[] = Tail<MergeParameters<S>>
  // This seems to default to an array containing an empty object, which is
  // not meaningful and causes problems with the `Selector/OutputSelector` types.
  // Force it to have a meaningful value, or cancel it out.
> = RemainingItems extends [EmptyObject] ? never : RemainingItems

/** Given a set of input selectors, extracts the intersected parameters to determine
 * what values can actually be passed to all of the input selectors at once
 * WARNING: "you are not expected to understand this" :)
 */
export type MergeParameters<
  // The actual array of input selectors
  T extends readonly UnknownFunction[],
  // Given those selectors, we do several transformations on the types in sequence:
  // 1) Extract "the type of parameters" for each input selector, so that we now have
  //    a tuple of all those parameters
  ParamsArrays extends readonly any[][] = ExtractParams<T>,
  // 2) Transpose the parameter tuples.
  //    Originally, we have nested arrays with "all params from input", "from input 2", etc:
  //    `[ [i1a, i1b, i1c], [i2a, i2b, i2c], [i3a, i3b, i3c] ],
  //    In order to intersect the params at each index, we need to transpose them so that
  //    we have "all the first args", "all the second args", and so on:
  //    `[ [i1a, i2a, i3a], [i1b, i2b, i3b], [i1c, i2c, i3c] ]
  //    Unfortunately, this step also turns the arrays into a union, and weirder, it is
  //    a union of all possible combinations for all input functions, so there's duplicates.
  TransposedArrays = Transpose<ParamsArrays>,
  // 3) Turn the union of arrays back into a nested tuple. Order does not matter here.
  TuplifiedArrays extends any[] = TuplifyUnion<TransposedArrays>,
  // 4) Find the longest params array out of the ones we have.
  //    Note that this is actually the _nested_ data we wanted out of the transpose step,
  //    so it has all the right pieces we need.
  LongestParamsArray extends readonly any[] = LongestArray<TuplifiedArrays>
> =
  // After all that preparation work, we can actually do parameter extraction.
  // These steps work somewhat inside out:
  // 10) Finally, after all that, run a recursive expansion on the values to make the user-visible
  //     field details more readable when viewing the selector's type in a hover box.
  ExpandItems<
    // 9) Tuples can have field names attached, and it seems to work better to remove those
    RemoveNames<{
      // 5) We know the longest params array has N args. Loop over the indices of that array.
      [index in keyof LongestParamsArray]: LongestParamsArray[index] extends LongestParamsArray[number] // field names for array functions like `slice()` // 6) Do a check to ensure that we're _only_ checking numeric indices, not any
        ? // 8) Then, intersect all of the parameters for this arg together.
          IntersectAll<
            // 7) Since this is a _nested_ array, extract the right sub-array for this index
            LongestParamsArray[index]
          >
        : never
    }>
  >

/*
 *
 * Reselect Internal Utility Types
 *
 */

/** Any function with arguments */
export type UnknownFunction = (...args: any[]) => any

/** An object with no fields */
type EmptyObject = {
  [K in any]: never
}

/** Extract the parameters from all functions as a tuple */
export type ExtractParams<T extends readonly UnknownFunction[]> = {
  [index in keyof T]: T[index] extends T[number] ? Parameters<T[index]> : never
}

/** Extract the return type from all functions as a tuple */
export type ExtractReturnType<T extends readonly UnknownFunction[]> = {
  [index in keyof T]: T[index] extends T[number] ? ReturnType<T[index]> : never
}

/** Recursively expand all fields in an object for easier reading */
export type ExpandItems<T extends readonly unknown[]> = {
  [index in keyof T]: T[index] extends T[number] ? ComputeDeep<T[index]> : never
}

/** First item in an array */
export type Head<T extends any[]> = T extends [any, ...any[]] ? T[0] : never
/** All other items in an array */
export type Tail<A> = A extends [any, ...infer Rest] ? Rest : never

/** Extract only numeric keys from an array type */
export type AllArrayKeys<A extends readonly any[]> = A extends any
  ? {
      [K in keyof A]: K
    }[number]
  : never

export type List<A = any> = ReadonlyArray<A>

export type Has<U, U1> = [U1] extends [U] ? 1 : 0

/** Select the longer of two arrays */
export type Longest<L extends List, L1 extends List> = L extends unknown
  ? L1 extends unknown
    ? { 0: L1; 1: L }[Has<keyof L, keyof L1>]
    : never
  : never

/** Recurse over a nested array to locate the longest one.
 * Acts like a type-level `reduce()`
 */
export type LongestArray<S extends readonly any[][]> =
  // If this isn't a tuple, all indices are the same, we can't tell a difference
  IsTuple<S> extends '0'
    ? // so just return the type of the first item
      S[0]
    : // If there's two nested arrays remaining, compare them
    S extends [any[], any[]]
    ? Longest<S[0], S[1]>
    : // If there's more than two, extract their types, treat the remainder as a smaller array
    S extends [any[], any[], ...infer Rest]
    ? // then compare those two, recurse through the smaller array, and compare vs its result
      Longest<
        Longest<S[0], S[1]>,
        Rest extends any[][] ? LongestArray<Rest> : []
      >
    : // If there's one item left, return it
    S extends [any[]]
    ? S[0]
    : never

/** Recursive type for intersecting together all items in a tuple */
type IntersectAll<T extends any[]> = IsTuple<T> extends '0'
  ? T[0]
  : _IntersectAll<T>

type _IntersectAll<T, R = unknown> = T extends [infer First, ...infer Rest]
  ? _IntersectAll<Rest, undefined extends First ? R : R & First>
  : R

/*
 *
 * External/Copied Utility Types
 *
 */

/** The infamous "convert a union type to an intersection type" hack
 * Source: https://github.com/sindresorhus/type-fest/blob/main/source/union-to-intersection.d.ts
 * Reference: https://github.com/microsoft/TypeScript/issues/29594
 */
export type UnionToIntersection<Union> = (
  // `extends unknown` is always going to be the case and is used to convert the
  // `Union` into a [distributive conditional
  // type](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#distributive-conditional-types).
  Union extends unknown
    ? // The union type is used as the only argument to a function since the union
      // of function arguments is an intersection.
      (distributedUnion: Union) => void
    : // This won't happen.
      never
      // Infer the `Intersection` type since TypeScript represents the positional
      // arguments of unions of functions as an intersection of the union.
) extends (mergedIntersection: infer Intersection) => void
  ? Intersection
  : never

/**
 * Removes field names from a tuple
 * Source: https://stackoverflow.com/a/63571175/62937
 */
type RemoveNames<T extends readonly any[]> = [any, ...T] extends [
  any,
  ...infer U
]
  ? U
  : never

/**
 * Assorted util types for type-level conditional logic
 * Source: https://github.com/KiaraGrouwstra/typical
 */
export type Bool = '0' | '1'
export type Obj<T> = { [k: string]: T }
export type And<A extends Bool, B extends Bool> = ({
  1: { 1: '1' } & Obj<'0'>
} & Obj<Obj<'0'>>)[A][B]

export type Matches<V, T> = V extends T ? '1' : '0'
export type IsArrayType<T> = Matches<T, any[]>

export type Not<T extends Bool> = { '1': '0'; '0': '1' }[T]
export type InstanceOf<V, T> = And<Matches<V, T>, Not<Matches<T, V>>>
export type IsTuple<T extends { length: number }> = And<
  IsArrayType<T>,
  InstanceOf<T['length'], number>
>

/**
 * Code to convert a union of values into a tuple.
 * Source: https://stackoverflow.com/a/55128956/62937
 */
type Push<T extends any[], V> = [...T, V]

type LastOf<T> = UnionToIntersection<
  T extends any ? () => T : never
> extends () => infer R
  ? R
  : never

// TS4.1+
type TuplifyUnion<
  T,
  L = LastOf<T>,
  N = [T] extends [never] ? true : false
> = true extends N ? [] : Push<TuplifyUnion<Exclude<T, L>>, L>

/**
 * Converts "the values of an object" into a tuple, like a type-level `Object.values()`
 * Source: https://stackoverflow.com/a/68695508/62937
 */
export type ObjValueTuple<
  T,
  KS extends any[] = TuplifyUnion<keyof T>,
  R extends any[] = []
> = KS extends [infer K, ...infer KT]
  ? ObjValueTuple<T, KT, [...R, T[K & keyof T]]>
  : R

/**
 * Transposes nested arrays
 * Source: https://stackoverflow.com/a/66303933/62937
 */
type Transpose<T> = T[Extract<
  keyof T,
  T extends readonly any[] ? number : unknown
>] extends infer V
  ? {
      [K in keyof V]: {
        [L in keyof T]: K extends keyof T[L] ? T[L][K] : undefined
      }
    }
  : never

/** Utility type to infer the type of "all params of a function except the first", so we can determine what arguments a memoize function accepts */
export type DropFirst<T extends unknown[]> = T extends [unknown, ...infer U]
  ? U
  : never

/**
 * Expand an item a single level, or recursively.
 * Source: https://stackoverflow.com/a/69288824/62937
 */
export type Expand<T> = T extends (...args: infer A) => infer R
  ? (...args: Expand<A>) => Expand<R>
  : T extends infer O
  ? { [K in keyof O]: O[K] }
  : never

export type ExpandRecursively<T> = T extends (...args: infer A) => infer R
  ? (...args: ExpandRecursively<A>) => ExpandRecursively<R>
  : T extends object
  ? T extends infer O
    ? { [K in keyof O]: ExpandRecursively<O[K]> }
    : never
  : T

type Identity<T> = T
/**
 * Another form of type value expansion
 * Source: https://github.com/microsoft/TypeScript/issues/35247
 */
export type Mapped<T> = Identity<{ [k in keyof T]: T[k] }>

/**
 * Fully expand a type, deeply
 * Source: https://github.com/millsp/ts-toolbelt (`Any.Compute`)
 */

type ComputeDeep<A, Seen = never> = A extends BuiltIn
  ? A
  : If2<
      Has<Seen, A>,
      A,
      A extends Array<any>
        ? A extends Array<Record<Key, any>>
          ? Array<
              {
                [K in keyof A[number]]: ComputeDeep<A[number][K], A | Seen>
              } & unknown
            >
          : A
        : A extends ReadonlyArray<any>
        ? A extends ReadonlyArray<Record<Key, any>>
          ? ReadonlyArray<
              {
                [K in keyof A[number]]: ComputeDeep<A[number][K], A | Seen>
              } & unknown
            >
          : A
        : { [K in keyof A]: ComputeDeep<A[K], A | Seen> } & unknown
    >

export type If2<B extends Boolean2, Then, Else = never> = B extends 1
  ? Then
  : Else

export type Boolean2 = 0 | 1

export type Key = string | number | symbol

export type BuiltIn =
  | Function
  | Error
  | Date
  | { readonly [Symbol.toStringTag]: string }
  | RegExp
  | Generator
