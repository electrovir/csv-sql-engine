import {describe} from '@augment-vir/test';
import {sql} from 'sqlite-ast';
import {handlerCases} from '../test-handler.mock.js';
import {rowDeleteHandler} from './row-delete.handler.js';

describe(rowDeleteHandler.name, () => {
    handlerCases([
        {
            it: 'deletes a row',
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
                DELETE FROM users where id=2;
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
                            '"3","example3@example.com","example3"',
                            '"4","example4@example.com","example4"',
                        ],
                    },
                },
                output: [
                    {
                        columnNames: [],
                        values: [],
                        numberOfRowsAffected: 1,
                    },
                ],
            },
        },
        {
            it: 'deletes rows with or',
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
                DELETE FROM users WHERE id=2 OR name='example' OR name='something else' OR email='example4@example.com';
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
                            '"3","example3@example.com","example3"',
                        ],
                    },
                },
                output: [
                    {
                        numberOfRowsAffected: 2,
                        columnNames: [],
                        values: [],
                    },
                ],
            },
        },
        {
            it: 'deletes rows with returning',
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
                DELETE FROM users WHERE id=2 OR name='example' OR name='something else' OR email='example4@example.com' RETURNING id;
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
                            '"3","example3@example.com","example3"',
                        ],
                    },
                },
                output: [
                    {
                        numberOfRowsAffected: 2,
                        columnNames: [
                            'id',
                        ],
                        values: [
                            [
                                '2',
                            ],
                            [
                                '4',
                            ],
                        ],
                    },
                ],
            },
        },
    ]);
});
