import {type PartialWithUndefined} from '@augment-vir/common';
import {type Sql, type SqliteAst} from 'sqlite-ast';

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
 * Parameters for AST handlers.
 *
 * @category Internal
 */
export type AstHandlerParams = {
    ast: Extract<SqliteAst, {type: 'statement'}>;
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
export type ExecuteSqlParams = Omit<AstHandlerParams, 'ast' | 'sql'>;
