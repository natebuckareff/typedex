import type { TypeAny, TypeArg } from './type';
import { TypeParam, iterParams } from './type';

// 0 -> not equal
// 1 -> concrete equality
// 2 -> generic equality
export function resolve(type: TypeArg): TypeAny {
    if (type instanceof TypeParam) {
        throw Error('abstract type cannot be resolved');
    }

    for (const [, t] of iterParams(type)) {
        resolve(t);
    }

    return type;
}

export function compare(target: TypeArg, pattern: TypeArg): number {
    return innerCompare(target, pattern, 0);
}

function innerCompare(target: TypeArg, pattern: TypeArg, state: number): number {
    if (target instanceof TypeParam || pattern instanceof TypeParam) {
        return 2;
    }

    if (target.name !== pattern.name) {
        return 0;
    }

    if (target.params !== undefined) {
        if (pattern.params === undefined) {
            throw Error('assertion failed');
        }

        const targetParams = iterParams(target);
        const patternParams = iterParams(pattern);

        while (true) {
            const resultX = targetParams.next();
            const resultY = patternParams.next();

            if (resultX.done || resultY.done) {
                if (resultX.done !== resultY.done) throw Error('assertion failed');
                break;
            }

            const x = resultX.value[1];
            const y = resultY.value[1];

            if (x instanceof TypeParam) {
                state = 2;
                continue;
            }

            state = compare(x, y);

            if (state === 0) {
                return 0;
            }
        }

        return Math.max(state, 1);
    } else {
        if (pattern.params !== undefined) {
            throw Error('assertion failed');
        }
        return Math.max(state, 1);
    }
}
