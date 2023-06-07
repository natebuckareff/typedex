import type { ObjectShape, TypeArg, TypeConfig, TypeOfObject, TypeOfTuple } from '../type';
import { Type, TypeMetaOptional, TypeParam } from '../type';

export const js = {
    null: Type('null', { check: (x): x is null => x === null }),
    undefined: Type('undefined', { check: (x): x is undefined => x === undefined }),
    boolean: Type('boolean', { check: (x): x is boolean => typeof x === 'boolean' }),
    symbol: Type('symbol', { check: (x): x is symbol => typeof x === 'symbol' }),
    number: Type('number', { check: (x): x is number => typeof x === 'number' }),
    bigint: Type('bigint', { check: (x): x is bigint => typeof x === 'bigint' }),
    string: Type('string', { check: (x): x is string => typeof x === 'string' }),
    date: Type('date', { check: (x): x is Date => x instanceof Date }),
    regexp: Type('regexp', { check: (x): x is RegExp => x instanceof RegExp }),
    error: Type('error', { check: (x): x is Error => x instanceof Error }),
    url: Type('url', { check: (x): x is URL => x instanceof URL }),
    array: Type(
        'array',
        <Arg extends TypeArg>(arg: Arg): TypeConfig<Arg['_type'][]> => ({
            check: (x): x is Arg['_type'][] => {
                if (arg instanceof TypeParam) {
                    throw Error('generic runtime type not allowed');
                }
                if (!Array.isArray(x)) return false;
                const { length } = x;
                for (let i = 0; i < length; ++i) {
                    if (!arg.check(x[i])) return false;
                }
                return true;
            },
        })
    ),
    tuple: Type(
        'tuple',
        <Args extends TypeArg[]>(...args: Args): TypeConfig<TypeOfTuple<Args>> => ({
            check: (x): x is TypeOfTuple<Args> => {
                if (!Array.isArray(x)) return false;
                const { length } = x;
                if (length !== args.length) return false;
                for (let i = 0; i < length; ++i) {
                    const type = args[i]!;
                    if (type instanceof TypeParam) {
                        throw Error('generic runtime type not allowed');
                    }
                    if (!type.check(x[i])) return false;
                }
                return true;
            },
        })
    ),
    object: Type(
        'object',
        <Shape extends ObjectShape>(shape: Shape): TypeConfig<TypeOfObject<Shape>> => ({
            check: (x): x is TypeOfObject<Shape> => {
                if (x === null || typeof x !== 'object') {
                    return false;
                }
                const keys = Object.keys(shape);
                for (const k of keys) {
                    const type = shape[k]!;
                    if (type instanceof TypeParam) {
                        throw Error('generic runtime type not allowed');
                    }
                    const v = x[k as keyof object];
                    if (!type.check(v)) return false;
                }
                let count = keys.length;
                for (const _ in x) count -= 1;
                return count === 0;
            },
        })
    ),
    option: Type(
        'option',
        <Arg extends TypeArg>(arg: Arg): TypeConfig<Arg['_type'] | undefined> => ({
            check: (x): x is Arg['_type'] | undefined => {
                if (arg instanceof TypeParam) {
                    throw Error('generic runtime type not allowed');
                }
                return x === undefined || arg.check(x);
            },
        }),
        { [TypeMetaOptional]: true }
    ),
    union: Type(
        'union',
        <Args extends TypeArg[]>(...args: Args): TypeConfig<TypeOfTuple<Args>[number]> => ({
            check: (x): x is TypeOfTuple<Args>[number] => {
                const { length } = args;
                for (let i = 0; i < length; ++i) {
                    const type = args[i]!;
                    if (type instanceof TypeParam) {
                        throw Error('generic runtime type not allowed');
                    }
                    if (type.check(x)) return true;
                }
                return false;
            },
        })
    ),
    map: Type(
        'map',
        <Key extends TypeArg, Value extends TypeArg>(
            key: Key,
            value: Value
        ): TypeConfig<Map<Key['_type'], Value['_type']>> => ({
            check: (x): x is Map<Key['_type'], Value['_type']> => {
                if (key instanceof TypeParam) {
                    throw Error('generic runtime type not allowed');
                }
                if (value instanceof TypeParam) {
                    throw Error('generic runtime type not allowed');
                }
                if (!(x instanceof Map)) return false;
                for (const [k, v] of x.entries()) {
                    if (!key.check(k) || !value.check(v)) return false;
                }
                return true;
            },
        })
    ),
    set: Type(
        'set',
        <Value extends TypeArg>(value: Value): TypeConfig<Set<Value['_type']>> => ({
            check: (x): x is Set<Value['_type']> => {
                if (value instanceof TypeParam) {
                    throw Error('generic runtime type not allowed');
                }
                if (!(x instanceof Set)) return false;
                for (const [v] of x.values()) {
                    if (!value.check(v)) return false;
                }
                return true;
            },
        })
    ),
};
