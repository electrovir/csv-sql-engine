import {describe} from '@augment-vir/test';
import {sql} from '../../sql/sql.js';
import {handlerCases} from '../test-handler.mock.js';
import {rowUpdateHandler} from './row-update.handler.js';

describe(rowUpdateHandler.name, () => {
    handlerCases([
        {
            it: 'updates a row',
            init: {
                sql: sql`
                    CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, name TEXT NOT NULL);
                    INSERT INTO users VALUES (1, "example1@example.com", "example1");
                    INSERT INTO users VALUES (2, "example2@example.com", "example2");
                    INSERT INTO users VALUES (3, "example3@example.com", "example3");
                    INSERT INTO users VALUES (4, "example4@example.com", "example4");
                `,
            },
            sql: sql`
                UPDATE users SET name = 'new2' WHERE id=2;
            `,
            expect: {
                files: {
                    before: {
                        'users.csv': [
                            '"id","email","name"',
                            '"1","example1@example.com","example1"',
                            '"2","example2@example.com","example2"',
                            '"3","example3@example.com","example3"',
                            '"4","example4@example.com","example4"',
                        ],
                    },
                    after: {
                        'users.csv': [
                            '"id","email","name"',
                            '"1","example1@example.com","example1"',
                            '"2","example2@example.com","new2"',
                            '"3","example3@example.com","example3"',
                            '"4","example4@example.com","example4"',
                        ],
                    },
                },
                output: [
                    [],
                ],
            },
        },
        {
            it: 'updates a row with selection',
            init: {
                sql: sql`
                    CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, name TEXT NOT NULL);
                    INSERT INTO users VALUES (1, "example1@example.com", "example1");
                    INSERT INTO users VALUES (2, "example2@example.com", "example2");
                    INSERT INTO users VALUES (3, "example3@example.com", "example3");
                    INSERT INTO users VALUES (4, "example4@example.com", "example4");
                `,
            },
            sql: sql`
                UPDATE users SET name = 'new2' WHERE id=2 RETURNING id,name;
            `,
            expect: {
                files: {
                    before: {
                        'users.csv': [
                            '"id","email","name"',
                            '"1","example1@example.com","example1"',
                            '"2","example2@example.com","example2"',
                            '"3","example3@example.com","example3"',
                            '"4","example4@example.com","example4"',
                        ],
                    },
                    after: {
                        'users.csv': [
                            '"id","email","name"',
                            '"1","example1@example.com","example1"',
                            '"2","example2@example.com","new2"',
                            '"3","example3@example.com","example3"',
                            '"4","example4@example.com","example4"',
                        ],
                    },
                },
                output: [
                    [
                        {
                            columnNames: [
                                'id',
                                'name',
                            ],
                            values: [
                                [
                                    '2',
                                    'new2',
                                ],
                            ],
                        },
                    ],
                ],
            },
        },
    ]);
});
