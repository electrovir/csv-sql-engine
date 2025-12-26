import {assert} from '@augment-vir/assert';
import {type AnyObject} from '@augment-vir/common';
import {describe, it} from '@augment-vir/test';
import {parseSql} from './parse-sql.js';
import {sql} from './sql.js';

describe(parseSql.name, () => {
    it('parses', () => {
        assert.deepEquals(
            parseSql(sql`
                CREATE TABLE users (
                    id INT PRIMARY KEY,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `) as AnyObject[],
            [
                {
                    type: 'create',
                    keyword: 'table',
                    temporary: null,
                    if_not_exists: null,
                    table: [
                        {
                            db: null,
                            table: 'users',
                        },
                    ],
                    create_definitions: [
                        {
                            column: {
                                type: 'column_ref',
                                table: null,
                                column: 'id',
                            },
                            definition: {
                                dataType: 'INT',
                                suffix: [],
                            },
                            resource: 'column',
                            primary_key: 'primary key',
                        },
                        {
                            column: {
                                type: 'column_ref',
                                table: null,
                                column: 'email',
                            },
                            definition: {
                                dataType: 'VARCHAR',
                                length: 255,
                                parentheses: true,
                            },
                            resource: 'column',
                            nullable: {
                                type: 'not null',
                                value: 'not null',
                            },
                            unique: 'unique',
                        },
                        {
                            column: {
                                type: 'column_ref',
                                table: null,
                                column: 'created_at',
                            },
                            definition: {
                                dataType: 'TIMESTAMP',
                            },
                            resource: 'column',
                            default_val: {
                                type: 'default',
                                value: {
                                    type: 'function',
                                    name: {
                                        name: [
                                            {
                                                type: 'origin',
                                                value: 'CURRENT_TIMESTAMP',
                                            },
                                        ],
                                    },
                                    over: null,
                                },
                            },
                        },
                    ],
                    table_options: null,
                },
            ],
        );
    });
});
