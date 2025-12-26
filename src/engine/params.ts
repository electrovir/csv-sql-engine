import {type PartialWithUndefined} from '@augment-vir/common';
import {type Parser} from 'node-sql-parser';
import {type SqlAst} from '../sql/ast.js';
import {type Sql} from '../sql/sql.js';

/**
 * Options for rejecting unsupported operations (rather than ignoring them).
 *
 * @category Internal
 */
export type RejectUnsupportedOptions = PartialWithUndefined<{
    /**
     * - If set to `true`, unsupported operations will throw errors.
     * - When left to `false`, unsupported operations are simply ignored.
     *
     * @default false
     */
    rejectUnsupportedOperations: boolean;
}>;

/**
 * Options for parsing SQL.
 *
 * @category Internal
 */
export type ParseSqlOptions = PartialWithUndefined<{
    /**
     * A custom implementation of the Parser from
     * [node-sql-parser](https://npmjs.com/package/node-sql-parser). If not provided, one will be
     * constructed.
     */
    parser: Parser;
}> &
    RejectUnsupportedOptions;

/**
 * Parameters for AST handlers.
 *
 * @category Internal
 */
export type AstHandlerParams = {
    ast: SqlAst;
    sql: Sql;
    /**
     * Path to the folder or directory containing all the CSV files. (Each CSV file is treated as an
     * individual table.)
     */
    csvDirPath: string;
} & RejectUnsupportedOptions;

/**
 * Parameters for executing SQL.
 *
 * @category Internal
 */
export type ExecuteSqlParams = ParseSqlOptions & Omit<AstHandlerParams, 'ast' | 'sql'>;
