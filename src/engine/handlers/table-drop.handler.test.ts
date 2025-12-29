import {describe} from '@augment-vir/test';
import {sql} from 'sqlite-ast';
import {CsvTableDoesNotExistError} from '../../errors/csv.error.js';
import {handlerCases} from '../../util/test-handler.mock.js';
import {tableDropHandler} from './table-drop.handler.js';

describe(tableDropHandler.name, () => {
    handlerCases([
        {
            it: 'drops a table',
            init: {
                sql: sql`
                    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT);
                `,
            },
            sql: sql`
                DROP TABLE users;
            `,
            expect: {
                files: {
                    before: {
                        main: {
                            'users.csv': [
                                '"id","name","email"',
                            ],
                        },
                    },
                    after: {},
                },
                output: [
                    {
                        columnNames: [
                            'id',
                            'name',
                            'email',
                        ],
                        numberOfRowsAffected: 0,
                        values: [],
                    },
                ],
            },
        },
        {
            it: 'rejects a missing table',
            sql: sql`
                DROP TABLE missing;
            `,
            throws: {
                matchConstructor: CsvTableDoesNotExistError,
                matchMessage: "'missing' does not exist",
            },
        },
        {
            it: 'allows a missing table with "IF EXISTS"',
            sql: sql`
                DROP TABLE IF EXISTS missing;
            `,
            expect: {
                files: {
                    before: {},
                    after: {},
                },
                output: [
                    {
                        columnNames: [],
                        numberOfRowsAffected: 0,
                        values: [],
                    },
                ],
            },
        },
    ]);
});
