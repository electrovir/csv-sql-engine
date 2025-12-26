import {assert} from '@augment-vir/assert';
import {describe, it, itCases} from '@augment-vir/test';
import {readFile, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {createFreshCsvFile} from '../csv.mock.js';
import {testFilesDirPath} from '../file-paths.mock.js';
import {appendCsvRows, nameCsvTableFile, readCsvFile} from './csv-file.js';
import {csv} from './csv-text.js';

describe(nameCsvTableFile.name, () => {
    itCases(nameCsvTableFile, [
        {
            it: 'sanitizes a table name',
            input: {
                csvDirPath: join(testFilesDirPath, 'fake-test'),
                tableName: 'bad.table/name',
            },
            expect: {
                // cspell:word badtablename
                sanitizedTableName: 'badtablename',
                tableFilePath: join(testFilesDirPath, 'fake-test', 'badtablename.csv'),
            },
        },
        {
            it: 'removes .csv',
            input: {
                csvDirPath: join(testFilesDirPath, 'fake-test'),
                tableName: 'name.csv',
            },
            expect: {
                sanitizedTableName: 'name',
                tableFilePath: join(testFilesDirPath, 'fake-test', 'name.csv'),
            },
        },
    ]);
});

describe(appendCsvRows.name, () => {
    it('writes a CSV file', async (testContext) => {
        const csvFilePath = await createFreshCsvFile(testContext, 'file.csv');

        const writeContents = [
            [
                'a',
                'b',
                'c',
                'd',
            ],
            [
                '1',
                '2',
                '3',
                '4',
            ],
            [
                'some',
                'other',
                'time',
                'maybe',
            ],
            [
                'hello',
                'there',
                '',
                '',
            ],
            [
                'general',
                '',
                '',
                // cspell:word kenobi
                'kenobi',
            ],
        ];

        await appendCsvRows(writeContents, csvFilePath);

        assert.strictEquals(
            (await readFile(csvFilePath, 'utf-8')).trim(),
            csv`
                "a","b","c","d"
                "1","2","3","4"
                "some","other","time","maybe"
                "hello","there","",""
                "general","","","kenobi"
            `,
        );
    });
});

describe(readCsvFile.name, () => {
    it('parses a CSV file', async (testContext) => {
        const csvFilePath = await createFreshCsvFile(testContext, 'file.csv');

        await writeFile(
            csvFilePath,
            csv`
                "a","b","c","d"
                "1","2","3","4"
                "some","other","time","maybe"
                "hello","there","",""
                "general","","","kenobi"
            `,
        );

        assert.deepEquals(await readCsvFile(csvFilePath), [
            [
                'a',
                'b',
                'c',
                'd',
            ],
            [
                '1',
                '2',
                '3',
                '4',
            ],
            [
                'some',
                'other',
                'time',
                'maybe',
            ],
            [
                'hello',
                'there',
                '',
                '',
            ],
            [
                'general',
                '',
                '',
                'kenobi',
            ],
        ]);
    });
});
