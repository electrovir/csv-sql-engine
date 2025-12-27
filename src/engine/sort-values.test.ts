import {assert} from '@augment-vir/assert';
import {describe, it, itCases} from '@augment-vir/test';
import {type ConsumableValue} from '../sql/sql.js';
import {sortValues} from './sort-values.js';

describe(sortValues.name, () => {
    it('maintains interpolation index', () => {
        const unconsumedInterpolationValues: ConsumableValue[] = [
            'example1',
            '1',
            'example1@example.com',
            'example2',
            '2',
            'example2@example.com',
        ] as ConsumableValue[];

        assert.deepEquals(
            sortValues({
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
                        [
                            '?',
                            '?',
                            '?',
                        ],
                    ],
                },
                unconsumedInterpolationValues,
            }),
            {
                columnNames: [
                    'id',
                    'name',
                    'email',
                ],
                values: [
                    [
                        '1',
                        'example1',
                        'example1@example.com',
                    ],
                ],
            },
        );
        assert.deepEquals(
            sortValues({
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
                        [
                            '?',
                            '?',
                            '?',
                        ],
                    ],
                },
                unconsumedInterpolationValues,
            }),
            {
                columnNames: [
                    'id',
                    'name',
                    'email',
                ],
                values: [
                    [
                        '2',
                        'example2',
                        'example2@example.com',
                    ],
                ],
            },
        );
    });

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
                        [
                            'example',
                            '2',
                            'example@example.com',
                        ],
                    ],
                },
                unconsumedInterpolationValues: [],
            },
            expect: {
                columnNames: [
                    'id',
                    'name',
                    'email',
                ],
                values: [
                    [
                        '2',
                        'example',
                        'example@example.com',
                    ],
                ],
            },
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
                        [
                            '2',
                            'example',
                            'example@example.com',
                        ],
                    ],
                },
                unconsumedInterpolationValues: [],
            },
            expect: {
                columnNames: [
                    'id',
                    'name',
                    'email',
                    'name',
                    'id',
                    'email',
                ],
                values: [
                    [
                        '2',
                        'example',
                        'example@example.com',
                        'example',
                        '2',
                        'example@example.com',
                    ],
                ],
            },
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
                        [
                            '2',
                            'example',
                            'example@example.com',
                        ],
                    ],
                },
                unconsumedInterpolationValues: [],
            },
            expect: {
                columnNames: [
                    'name',
                    'id',
                    'email',
                ],
                values: [
                    [
                        'example',
                        '2',
                        'example@example.com',
                    ],
                ],
            },
        },
    ]);
});
