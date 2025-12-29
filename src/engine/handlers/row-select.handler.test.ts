import {describe} from '@augment-vir/test';
import {sql} from 'sqlite-ast';
import {handlerCases} from '../../util/test-handler.mock.js';
import {rowSelectHandler} from './row-select.handler.js';

describe(rowSelectHandler.name, () => {
    handlerCases([
        {
            it: 'selects specific columns',
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
                SELECT name,id from users WHERE id=2;
            `,
            expect: {
                files: {
                    before: {
                        main: {
                            'users.csv': [
                                '"id","email","name"',
                                '"1","example1@example.com","example1"',
                                '"2","example2@example.com","example2"',
                                '"3","example3@example.com","example3"',
                                '"4","example4@example.com","example4"',
                            ],
                        },
                    },
                    after: {
                        main: {
                            'users.csv': [
                                '"id","email","name"',
                                '"1","example1@example.com","example1"',
                                '"2","example2@example.com","example2"',
                                '"3","example3@example.com","example3"',
                                '"4","example4@example.com","example4"',
                            ],
                        },
                    },
                },
                output: [
                    {
                        numberOfRowsAffected: 0,
                        columnNames: [
                            'name',
                            'id',
                        ],
                        values: [
                            [
                                'example2',
                                '2',
                            ],
                        ],
                    },
                ],
            },
        },
        {
            it: 'selects with AND',
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
                SELECT name,id from users WHERE name = 'example1' and name = 'example2';
            `,
            expect: {
                files: {
                    before: {
                        main: {
                            'users.csv': [
                                '"id","email","name"',
                                '"1","example1@example.com","example1"',
                                '"2","example2@example.com","example2"',
                                '"3","example3@example.com","example3"',
                                '"4","example4@example.com","example4"',
                            ],
                        },
                    },
                    after: {
                        main: {
                            'users.csv': [
                                '"id","email","name"',
                                '"1","example1@example.com","example1"',
                                '"2","example2@example.com","example2"',
                                '"3","example3@example.com","example3"',
                                '"4","example4@example.com","example4"',
                            ],
                        },
                    },
                },
                output: [
                    {
                        columnNames: [
                            'name',
                            'id',
                        ],
                        values: [],
                        numberOfRowsAffected: 0,
                    },
                ],
            },
        },
        {
            it: 'selects *',
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
                SELECT * from users WHERE id=2;
            `,
            expect: {
                files: {
                    before: {
                        main: {
                            'users.csv': [
                                '"id","email","name"',
                                '"1","example1@example.com","example1"',
                                '"2","example2@example.com","example2"',
                                '"3","example3@example.com","example3"',
                                '"4","example4@example.com","example4"',
                            ],
                        },
                    },
                    after: {
                        main: {
                            'users.csv': [
                                '"id","email","name"',
                                '"1","example1@example.com","example1"',
                                '"2","example2@example.com","example2"',
                                '"3","example3@example.com","example3"',
                                '"4","example4@example.com","example4"',
                            ],
                        },
                    },
                },
                output: [
                    {
                        numberOfRowsAffected: 0,
                        columnNames: [
                            'id',
                            'email',
                            'name',
                        ],
                        values: [
                            [
                                '2',
                                'example2@example.com',
                                'example2',
                            ],
                        ],
                    },
                ],
            },
        },
    ]);
});
