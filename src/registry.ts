import type { Mapping } from './mapping';
import type { TypeAny } from './type';
import { compare } from './util.js';

export class TypeRegistry {
    private _roots: Map<string, Mapping<TypeAny, TypeAny>[]>;

    constructor() {
        this._roots = new Map();
    }

    register<Input extends TypeAny, Output extends TypeAny>(mapping: Mapping<Input, Output>): void;

    register<Input extends TypeAny, Output extends TypeAny>(
        input: Input,
        output: Output,
        mapper: (value: Input['_type'], input: Input, output: Output) => Output['_type']
    ): void;

    register(arg1: any, arg2?: any, arg3?: any): void {
        let mapping: Mapping<TypeAny, TypeAny>;
        if (arg2 === undefined) {
            mapping = arg1;
        } else {
            const input = arg1 as TypeAny;
            const output = arg2 as TypeAny;
            const mapper = arg3 as (value: any, input: TypeAny, output: TypeAny) => any;
            mapping = { input, output, mapper };
        }
        const { input } = mapping;
        let mappings = this._roots.get(input.name);
        if (mappings === undefined) {
            mappings = [];
            this._roots.set(input.name, mappings);
        }
        mappings.push(mapping as Mapping<any, any>);
    }

    match<Input extends TypeAny, Output extends TypeAny>(
        input: Input,
        output: Output
    ): Mapping<Input, Output>['mapper'] | undefined {
        const mappings = this._roots.get(input.name);
        if (mappings === undefined) {
            return;
        }

        const matches: [number, Mapping<TypeAny, TypeAny>][] = [];

        for (const mapping of mappings) {
            const lhs = compare(input, mapping.input);
            const rhs = compare(output, mapping.output);

            if (lhs > 0 && rhs > 0) {
                matches.push([Math.max(lhs, rhs), mapping]);
            }
        }

        if (matches.length > 0) {
            matches.sort((x, y) => x[0] - y[0]);
            const [, match] = matches[0]!;
            return match.mapper;
        }

        return;
    }

    // TODO: should this be named "serialize" instead?
    convert<Input extends TypeAny, Output extends TypeAny>(
        input: Input,
        output: Output,
        value: Input['_type']
    ): Output['_type'] {
        // TODO(optimize): Cache the result for `value`? Would speed up repeated
        // calls to `convert`

        // Identity case
        if ((input as any) === (output as any)) {
            return value;
        }

        const mapper = this.match(input, output);
        if (mapper === undefined) {
            throw Error('no mapping found');
        }
        return mapper(value, input, output);
    }
}
