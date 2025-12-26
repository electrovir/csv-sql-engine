import {Type} from '@sinclair/typebox';
import {
    defineShape,
    enumShape,
    exactShape,
    nullableShape,
    primitiveShape,
    unionShape,
} from 'object-shape-tester';

/**
 * All AST types (corresponding to various SQL commands). Extracted from
 * [node-sql-parser](https://npmjs.com/package/node-sql-parser).
 *
 * @category Internal
 */
export enum AstType {
    Alter = 'alter',
    Create = 'create',
    Delete = 'delete',
    Drop = 'drop',
    Insert = 'insert',
    Replace = 'replace',
    Select = 'select',
    Update = 'update',
    Use = 'use',
}

/**
 * Shape definition for parsed AST output of a SQL command's list of applicable tables.
 *
 * @category Internal
 */
export const tablesShape = defineShape([
    {
        table: '',
    },
]);

/**
 * All supported and known alter table actions.
 *
 * @category Internal
 */
export enum AlterExpressionAction {
    Add = 'add',
    Rename = 'rename',
    Drop = 'drop',
}

/**
 * Shape definition for parsed AST output of a ALTER command.
 *
 * @category Internal
 */
export const alterExpressionShape = defineShape(
    unionShape(
        {
            action: exactShape(AlterExpressionAction.Add),
            resource: exactShape('column'),
            column: {
                type: exactShape('column_ref'),
                column: '',
            },
            default_val: nullableShape({
                value: {
                    value: '',
                },
            }),
        },
        {
            action: exactShape(AlterExpressionAction.Rename),
            resource: exactShape('column'),
            old_column: {
                /** Old name of the column. */
                column: '',
            },
            column: {
                /** Name name for the column. */
                column: '',
            },
        },
        {
            action: exactShape(AlterExpressionAction.Drop),
            resource: exactShape('column'),
            column: {
                /** Name name for the column. */
                column: '',
            },
        },
    ),
);

/**
 * Keywords allowed for the create command. Extracted from
 * [node-sql-parser](https://npmjs.com/package/node-sql-parser).
 *
 * @category Internal
 */
export enum CreateKeyword {
    Aggregate = 'aggregate',
    Database = 'database',
    Domain = 'domain',
    Extension = 'extension',
    Function = 'function',
    Index = 'index',
    Schema = 'schema',
    Table = 'table',
    Trigger = 'trigger',
    Type = 'type',
    User = 'user',
    View = 'view',
}

/**
 * Known / supported where types from the SQL AST.
 *
 * @category Internal
 */
export enum WhereType {
    BinaryExpression = 'binary_expr',
}

/**
 * Known / supported where operators from the SQL AST.
 *
 * @category Internal
 */
export enum WhereOperator {
    Equals = '=',
    Or = 'OR',
    And = 'AND',
}

/**
 * SQL AST shape for the column selection part of a where clause.
 *
 * @category Internal
 */
export const whereColumnShape = defineShape({
    type: exactShape('column_ref'),
    /** The column name. */
    column: '',
});

/**
 * SQL AST shape for basic where comparison.
 *
 * @category Internal
 */
export const basicWhereShape = defineShape({
    operator: unionShape(exactShape(WhereOperator.Equals)),
    left: {
        type: exactShape('column_ref'),
        /** The column name. */
        column: '',
    },
    right: {
        value: primitiveShape(),
    },
});

/**
 * SQL AST _schema_ for conjunction where clauses (like `or` or `and`).
 *
 * @category Internal
 * @see {@link whereConjunctionShape} for the shape.
 */
export const whereConjunctionSchema = Type.Recursive((Self) =>
    Type.Object({
        operator: Type.Union([
            Type.Literal(WhereOperator.Or),
            Type.Literal(WhereOperator.And),
        ]),
        left: Type.Union([
            basicWhereShape.$_schema,
            Self,
        ]),
        right: basicWhereShape.$_schema,
    }),
);

/**
 * SQL AST _shape_ for conjunction where clauses (like `or` or `and`).
 *
 * @category Internal
 * @see {@link whereConjunctionSchema} for the schema.
 */
export const whereConjunctionShape = defineShape(whereConjunctionSchema);

/**
 * SQL AST shape for SQL where clauses.
 *
 * @category Internal
 */
export const whereShape = unionShape(basicWhereShape, whereConjunctionShape);
/**
 * SQL AST type for SQL where clauses.
 *
 * @category Internal
 */
export type Where = typeof whereShape.runtimeType;

/**
 * SQL AST shape for queries that also select data.
 *
 * @category Internal
 */
export const returningShape = defineShape({
    type: exactShape('returning'),
    columns: [
        {
            expr: {
                column: '',
            },
        },
    ],
});

/**
 * The AST types provided by node-sql-parser are missing a lot of information, so we define our own
 * here.
 *
 * @category Internal
 */
export const sqlAstShape = defineShape(
    unionShape(
        {
            type: exactShape(AstType.Insert),
            table: tablesShape,
            columns: nullableShape(['']),
            values: {
                values: [
                    {
                        value: [
                            {
                                value: primitiveShape(),
                            },
                        ],
                    },
                ],
            },
            returning: nullableShape(returningShape),
        },
        {
            type: exactShape(AstType.Delete),
            table: tablesShape,
            from: tablesShape,
            where: whereShape,
            returning: nullableShape(returningShape),
        },
        {
            type: exactShape(AstType.Select),
            columns: [
                {
                    expr: {
                        /** Selected column name. */
                        column: '',
                    },
                },
            ],
            from: tablesShape,
            where: whereShape,
        },
        {
            type: exactShape(AstType.Update),
            table: tablesShape,
            where: whereShape,
            set: [
                {
                    /** The name of the column to overwrite. */
                    column: '',
                    value: {
                        /** The new value to insert. */
                        value: '',
                    },
                },
            ],
            returning: nullableShape(returningShape),
        },
        {
            type: exactShape(AstType.Drop),
            name: tablesShape,
            prefix: nullableShape(exactShape('if exists')),
            keyword: exactShape('table'),
        },
        {
            type: exactShape(AstType.Alter),
            table: tablesShape,
            expr: [alterExpressionShape],
        },
        {
            type: exactShape(AstType.Create),
            keyword: enumShape(CreateKeyword),
            table: tablesShape,
            create_definitions: [
                {
                    column: {
                        /** The name of the new column. */
                        column: '',
                    },
                },
            ],
        },
    ),
);

/**
 * SQL string parsing output.
 *
 * @category Internal
 */
export type SqlAst = typeof sqlAstShape.runtimeType;
