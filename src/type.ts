export interface TypeConfig<T> {
    check: (x: unknown) => x is T;
}

export const TypeSymbol = Symbol('type-symbol');

export interface Type<
    Name extends string,
    T,
    Params extends void | TupleParams | ObjectParams,
    Meta extends TypeMeta
> {
    readonly [TypeSymbol]: true;
    readonly _type: T;
    readonly name: Name;
    readonly params: Params;
    readonly meta: Meta;
    check(x: unknown): x is T;
}

export type TypeMeta = { [meta: symbol]: any };

export const TypeMetaOptional = Symbol('type-meta-optional-symbol');

export type TupleParams = TypeArg[];
export type ObjectParams = [ObjectShape];
export type ObjectShape = { [key: string]: TypeArg };

export function isObjectParams(x: TupleParams | ObjectParams): x is ObjectParams {
    if (x.length !== 1) return false;
    const [v] = x;
    return !(v instanceof TypeParam) && !(TypeSymbol in x[0]);
}

export function* iterParams(type: TypeAny): IterableIterator<[number | string, TypeArg]> {
    const params = type.params as void | TupleParams | ObjectParams;
    if (params === undefined) return;
    if (isObjectParams(params)) {
        const [shape] = params;
        for (const k in shape) {
            yield [k, shape[k]!];
        }
    } else {
        const { length } = params;
        for (let i = 0; i < length; ++i) {
            yield [i, params[i]!];
        }
    }
}

// prettier-ignore
export type TypeOf<T> = T extends TypeAny
    ? T['_type']
    : T extends ObjectShape
        ? TypeOfObject<T> : never;

export type TypeOfObject<Shape extends ObjectShape> = TypeOfObjectOptional<Shape> &
    TypeOfObjectRequired<Shape>;

export type TypeOfObjectOptional<Shape extends ObjectShape> = {
    [K in keyof Shape as IfOptionalMeta<Shape[K], K>]?: TypeOf<Shape[K]>;
};

export type TypeOfObjectRequired<Shape extends ObjectShape> = {
    [K in keyof Shape as IfRequiredMeta<Shape[K], K>]: TypeOf<Shape[K]>;
};

export type IfOptionalMeta<T extends TypeArg, X> = T extends TypeAny
    ? T['meta'] extends { [K in typeof TypeMetaOptional]: true }
        ? X
        : never
    : never;

export type IfRequiredMeta<T extends TypeArg, X> = T extends TypeAny
    ? T['meta'] extends { [K in typeof TypeMetaOptional]: true }
        ? never
        : X
    : X;

export type TypeOfTuple<Args extends TypeArg[]> = {
    [K in keyof Args]: TypeOf<Args[K]>;
};

export class TypeParam {
    readonly _type: unknown;
}

export const Param = () => new TypeParam();

export type TypeAny = Type<any, any, any, any>;
export type TypeArg = TypeAny | TypeParam;

export function Type<Name extends string, T, const Meta extends TypeMeta = {}>(
    name: Name,
    config: TypeConfig<T>,
    meta?: Meta
): Type<Name, T, void, Meta>;

export function Type<
    Name extends string,
    Params extends TypeArg[],
    T,
    const Meta extends TypeMeta = {}
>(
    name: Name,
    generic: (...params: Params) => TypeConfig<T>,
    meta?: Meta
): (...params: Params) => Type<Name, T, Params, Meta>;

export function Type<
    Name extends string,
    Shape extends ObjectShape,
    const Meta extends TypeMeta = {}
>(
    name: Name,
    generic: (shape: Shape) => TypeConfig<TypeOfObject<Shape>>,
    meta?: Meta
): (shape: Shape) => Type<Name, TypeOfObject<Shape>, [Shape], Meta>;

export function Type(
    name: string,
    builder: TypeConfig<any> | ((...args: any[]) => TypeConfig<any>),
    meta?: TypeMeta
) {
    if (typeof builder === 'object') {
        const type: TypeAny = {
            [TypeSymbol]: true,
            _type: undefined!,
            name,
            params: undefined,
            meta,
            check: builder.check,
        };
        return type;
    } else {
        const generic = (...args: any[]): Type<any, any, TupleParams | ObjectParams, any> => {
            const config = builder(...args);
            return {
                [TypeSymbol]: true,
                _type: undefined!,
                name,
                params: args,
                meta,
                check: config.check,
            };
        };
        return generic;
    }
}
