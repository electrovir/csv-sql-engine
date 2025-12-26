import {describe} from '@augment-vir/test';
import {sql} from '../../sql/sql.js';
import {handlerCases} from '../test-handler.mock.js';
import {rowInsertHandler} from './row-insert.handler.js';

describe(rowInsertHandler.name, () => {
    handlerCases([
        {
            it: 'inserts a row with specified columns',
            init: {
                sql: sql`
                    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT);
                `,
            },
            sql: sql`
                INSERT INTO users (email, id, name) VALUES ("example@example.com", 2, "example");
            `,
            expect: {
                files: {
                    after: {
                        'users.csv': [
                            '"id","name","email"',
                            '"2","example","example@example.com"',
                        ],
                    },
                    before: {
                        'users.csv': [
                            '"id","name","email"',
                        ],
                    },
                },
                output: [
                    [],
                ],
            },
        },
        {
            it: 'handles partial insert',
            init: {
                sql: sql`
                    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT);
                `,
            },
            sql: sql`
                INSERT INTO users (email, name) VALUES ("example@example.com", "example");
            `,
            expect: {
                files: {
                    after: {
                        'users.csv': [
                            '"id","name","email"',
                            '"","example","example@example.com"',
                        ],
                    },
                    before: {
                        'users.csv': [
                            '"id","name","email"',
                        ],
                    },
                },
                output: [
                    [],
                ],
            },
        },
        {
            it: 'inserts a row without specified columns',
            init: {
                sql: sql`
                    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT);
                `,
            },
            sql: sql`
                INSERT INTO users VALUES (2, "example", "example@example.com");
            `,
            expect: {
                files: {
                    after: {
                        'users.csv': [
                            '"id","name","email"',
                            '"2","example","example@example.com"',
                        ],
                    },
                    before: {
                        'users.csv': [
                            '"id","name","email"',
                        ],
                    },
                },
                output: [
                    [],
                ],
            },
        },
        {
            it: 'returns inserted data',
            init: {
                sql: sql`
                    CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT);
                `,
            },
            sql: sql`
                INSERT INTO users (id, name, email) VALUES (2, "example", "example@example.com") RETURNING *;
                INSERT INTO users (id, name, email) VALUES (3, "example", "example@example.com") RETURNING name,id;
            `,
            expect: {
                files: {
                    after: {
                        'users.csv': [
                            '"id","name","email"',
                            '"2","example","example@example.com"',
                            '"3","example","example@example.com"',
                        ],
                    },
                    before: {
                        'users.csv': [
                            '"id","name","email"',
                        ],
                    },
                },
                output: [
                    [
                        [
                            '2',
                            'example',
                            'example@example.com',
                        ],
                    ],
                    [
                        [
                            'example',
                            '3',
                        ],
                    ],
                ],
            },
        },
    ]);
});
