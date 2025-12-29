import {describe} from '@augment-vir/test';
import {sql} from 'sqlite-ast';
import {CsvColumnDoesNotExistError, CsvTableDoesNotExistError} from '../../errors/csv.error.js';
import {handlerCases} from '../test-handler.mock.js';
import {tableAlterHandler} from './table-alter.handler.js';

describe(tableAlterHandler.name, () => {
    handlerCases([
        {
            it: 'adds columns to an existing table',
            init: {
                sql: sql`
                    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT);
                    INSERT INTO users (id, name, email) VALUES (2, "example", "example@example.com");
                `,
            },
            sql: sql`
                ALTER TABLE users ADD COLUMN new_column TEXT NOT NULL DEFAULT "hi";
                ALTER TABLE users ADD COLUMN new_column_again TEXT NOT NULL;
            `,
            expect: {
                files: {
                    before: {
                        'users.csv': [
                            '"id","name","email"',
                            '"2","example","example@example.com"',
                        ],
                    },
                    after: {
                        'users.csv': [
                            '"id","name","email","new_column","new_column_again"',
                            '"2","example","example@example.com","hi",""',
                        ],
                    },
                },
                output: [
                    {
                        columnNames: [],
                        numberOfRowsAffected: 0,
                        values: [],
                    },
                    {
                        columnNames: [],
                        numberOfRowsAffected: 0,
                        values: [],
                    },
                ],
            },
        },
        {
            it: 'cannot alter a missing table',
            sql: sql`
                ALTER TABLE missing ADD COLUMN new_column TEXT NOT NULL DEFAULT "hi";
            `,
            throws: {
                matchConstructor: CsvTableDoesNotExistError,
                matchMessage: "'missing' does not exist",
            },
        },
        {
            it: 'renames a column',
            init: {
                sql: sql`
                    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT);
                    INSERT INTO users (id, name, email) VALUES (2, "example", "example@example.com");
                `,
            },
            sql: sql`
                ALTER TABLE users RENAME COLUMN name TO human_name;
            `,
            expect: {
                files: {
                    before: {
                        'users.csv': [
                            '"id","name","email"',
                            '"2","example","example@example.com"',
                        ],
                    },
                    after: {
                        'users.csv': [
                            '"id","human_name","email"',
                            '"2","example","example@example.com"',
                        ],
                    },
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
            it: 'cannot rename a missing column',
            init: {
                sql: sql`
                    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT);
                    INSERT INTO users (id, name, email) VALUES (2, "example", "example@example.com");
                `,
            },
            sql: sql`
                ALTER TABLE users RENAME COLUMN missing TO human_name;
            `,
            throws: {
                matchConstructor: CsvColumnDoesNotExistError,
                matchMessage: "Column 'missing' does not exist",
            },
        },
        {
            it: 'drops a column',
            init: {
                sql: sql`
                    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT);
                    INSERT INTO users (id, name, email) VALUES (2, "example", "example@example.com");
                `,
            },
            sql: sql`
                ALTER TABLE users DROP COLUMN "name";
            `,
            expect: {
                files: {
                    before: {
                        'users.csv': [
                            '"id","name","email"',
                            '"2","example","example@example.com"',
                        ],
                    },
                    after: {
                        'users.csv': [
                            '"id","email"',
                            '"2","example@example.com"',
                        ],
                    },
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
            it: 'cannot drop a missing column',
            init: {
                sql: sql`
                    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT);
                    INSERT INTO users (id, name, email) VALUES (2, "example", "example@example.com");
                `,
            },
            sql: sql`
                ALTER TABLE users DROP COLUMN missing;
            `,
            throws: {
                matchConstructor: CsvColumnDoesNotExistError,
                matchMessage: "Column 'missing' does not exist",
            },
        },
        {
            it: 'renames a table',
            init: {
                sql: sql`
                    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT);
                    INSERT INTO users (id, name, email) VALUES (2, "example", "example@example.com");
                `,
            },
            sql: sql`
                ALTER TABLE users RENAME TO users2;
            `,
            expect: {
                files: {
                    before: {
                        'users.csv': [
                            '"id","name","email"',
                            '"2","example","example@example.com"',
                        ],
                    },
                    after: {
                        'users2.csv': [
                            '"id","name","email"',
                            '"2","example","example@example.com"',
                        ],
                    },
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
            it: 'cannot rename a missing table',
            init: {
                sql: sql`
                    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT);
                    INSERT INTO users (id, name, email) VALUES (2, "example", "example@example.com");
                `,
            },
            sql: sql`
                ALTER TABLE missing RENAME TO missingNo;
            `,
            throws: {
                matchConstructor: CsvTableDoesNotExistError,
                matchMessage: "'missing' does not exist",
            },
        },
    ]);
});
