import {describe, itCases} from '@augment-vir/test';
import {readAstText} from './ast-text.js';

describe(readAstText.name, () => {
    itCases(readAstText, [
        {
            it: 'reads limit',
            input: {
                type: 'expression',
                variant: 'limit',
                start: {
                    type: 'expression',
                    format: 'unary',
                    variant: 'operation',
                    expression: {
                        type: 'literal',
                        variant: 'decimal',
                        value: '1',
                    },
                    operator: '-',
                },
                offset: {
                    type: 'literal',
                    variant: 'decimal',
                    value: '0',
                },
            },
            expect: '-1 OFFSET 0',
        },
        {
            it: 'reads limit start',
            input: {
                type: 'expression',
                format: 'unary',
                variant: 'operation',
                expression: {
                    type: 'literal',
                    variant: 'decimal',
                    value: '1',
                },
                operator: '-',
            },
            expect: '-1',
        },
    ]);
});
