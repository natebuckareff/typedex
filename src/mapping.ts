import type { TypeAny } from './type';

export interface Mapping<Input extends TypeAny, Output extends TypeAny> {
    input: Input;
    output: Output;
    mapper: (value: Input['_type'], input: Input, output: Output) => Output['_type'];
}

export function Mapping<Input extends TypeAny, Output extends TypeAny>(
    input: Input,
    output: Output,
    mapper: (value: Input['_type'], input: Input, output: Output) => Output['_type']
): Mapping<Input, Output> {
    return { input, output, mapper };
}
