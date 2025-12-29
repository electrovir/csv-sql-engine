import {describe} from '@augment-vir/test';
import {sql} from 'sqlite-ast';
import {CsvTableExistsError} from '../../errors/csv.error.js';
import {SqlParseError} from '../../errors/sql.error.js';
import {handlerCases} from '../../util/test-handler.mock.js';
import {tableCreateHandler} from './table-create.handler.js';

describe(tableCreateHandler.name, () => {
    handlerCases([
        {
            it: 'creates a new table',
            sql: sql`
                CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT);
            `,
            expect: {
                files: {
                    after: {
                        main: {
                            'users.csv': [
                                '"id","name","email"',
                            ],
                        },
                    },
                    before: {},
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
        {
            it: 'creates a table with database name',
            sql: sql`
                CREATE TABLE dev.users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT);
            `,
            expect: {
                files: {
                    after: {
                        dev: {
                            'users.csv': [
                                '"id","name","email"',
                            ],
                        },
                    },
                    before: {},
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
        {
            it: 'rejects an existing table',
            sql: sql`
                CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT);
            `,
            init: {
                files: {
                    'main/users': ['init file'],
                },
            },
            throws: {
                matchConstructor: CsvTableExistsError,
                matchMessage: "CSV table (file) 'users' already exists",
            },
        },
        {
            it: 'fails to parse missing column definitions',
            sql: sql`
                CREATE TABLE users;
            `,
            throws: {
                matchConstructor: SqlParseError,
            },
        },
    ]);
});
