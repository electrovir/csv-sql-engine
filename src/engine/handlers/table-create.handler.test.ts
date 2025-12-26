import {describe} from '@augment-vir/test';
import {CsvTableExistsError} from '../../errors/csv.error.js';
import {SqlParseError} from '../../errors/sql.error.js';
import {sql} from '../../sql/sql.js';
import {handlerCases} from '../test-handler.mock.js';
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
                        'users.csv': [
                            '"id","name","email"',
                        ],
                    },
                    before: {},
                },
                output: [
                    [],
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
                    users: ['init file'],
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
