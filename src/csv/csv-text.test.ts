import {assert} from '@augment-vir/assert';
import {describe, it, itCases} from '@augment-vir/test';
import {csv, sortValues} from './csv-text.js';

describe(csv.name, () => {
    it('trims lines', () => {
        // cspell:word kenobi
        assert.strictEquals(
            csv`
                "a","b","c","d"
                "1","2","3","4"
                "some","other","time","maybe"
                "hello","there",","
                "general",",","kenobi"
            `,
            '"a","b","c","d"\n"1","2","3","4"\n"some","other","time","maybe"\n"hello","there",","\n"general",",","kenobi"',
        );
    });
});

describe(sortValues.name, () => {
    itCases(sortValues, [
        {
            it: 'sorts to csv order',
            input: {
                csvFileHeaderOrder: [
                    'id',
                    'name',
                    'email',
                ],
                sqlQueryHeaderOrder: [
                    'name',
                    'id',
                    'email',
                ],
                from: {
                    sqlQuery: [
                        'example',
                        '2',
                        'example@example.com',
                    ],
                },
            },
            expect: [
                '2',
                'example',
                'example@example.com',
            ],
        },
        {
            it: 'handles *',
            input: {
                csvFileHeaderOrder: [
                    'id',
                    'name',
                    'email',
                ],
                sqlQueryHeaderOrder: [
                    '*',
                    'name',
                    'id',
                    'email',
                ],
                from: {
                    csvFile: [
                        '2',
                        'example',
                        'example@example.com',
                    ],
                },
            },
            expect: [
                '2',
                'example',
                'example@example.com',
                'example',
                '2',
                'example@example.com',
            ],
        },
        {
            it: 'sorts to sql order',
            input: {
                csvFileHeaderOrder: [
                    'id',
                    'name',
                    'email',
                ],
                sqlQueryHeaderOrder: [
                    'name',
                    'id',
                    'email',
                ],
                from: {
                    csvFile: [
                        '2',
                        'example',
                        'example@example.com',
                    ],
                },
            },
            expect: [
                'example',
                '2',
                'example@example.com',
            ],
        },
    ]);
});
