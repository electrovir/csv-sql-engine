import {check} from '@augment-vir/assert';
import {
    type AnyObject,
    awaitedBlockingMap,
    ensureErrorAndPrependMessage,
    wrapInTry,
} from '@augment-vir/common';
import {mkdir} from 'node:fs/promises';
import {parseSqlite, rawSql, type Sql} from 'sqlite-ast';
import {SqlParseError, SqlUnsupportedOperationError} from '../errors/sql.error.js';
import {type AstHandler, type AstHandlerResult} from './define-ast-handler.js';
import {rowDeleteHandler} from './handlers/row-delete.handler.js';
import {rowInsertHandler} from './handlers/row-insert.handler.js';
import {rowSelectHandler} from './handlers/row-select.handler.js';
import {rowUpdateHandler} from './handlers/row-update.handler.js';
import {tableAlterHandler} from './handlers/table-alter.handler.js';
import {tableCreateHandler} from './handlers/table-create.handler.js';
import {tableDropHandler} from './handlers/table-drop.handler.js';
import {type AstHandlerParams, type ExecuteSqlParams} from './params.js';

/**
 * All current SQL handlers.
 *
 * @category Internal
 */
export const allAstHandlers: ReadonlyArray<Readonly<AstHandler>> = [
    tableAlterHandler,
    tableCreateHandler,
    rowInsertHandler,
    tableDropHandler,
    rowDeleteHandler,
    rowUpdateHandler,
    rowSelectHandler,
];

/**
 * The main entry point to this package. Run SQLite-compatible SQL commands on a collection of CSV
 * files.
 *
 * @category Main
 */
export async function executeSql(
    sqlInput: Sql | string,
    params: Readonly<ExecuteSqlParams>,
): Promise<AstHandlerResult[]> {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const sql = check.isString(sqlInput) ? rawSql(sqlInput) : sqlInput;

    const astList = wrapInTry(() => parseSqlite(sql), {
        handleError(error) {
            throw new SqlParseError(sql, error);
        },
    });

    await mkdir(params.csvDirPath, {
        recursive: true,
    });

    return (
        await awaitedBlockingMap(astList, async (ast) => {
            return await executeIndividualCommand({
                ...params,
                ast,
                sql,
            });
        })
    ).filter(check.isTruthy);
}

async function executeIndividualCommand(
    params: Readonly<AstHandlerParams>,
): Promise<AstHandlerResult | undefined> {
    try {
        for (const handler of allAstHandlers) {
            const output = await handler.handler(params);
            if (output) {
                return output;
            }
        }

        /** If nothing handled the query, then we don't support it. */
        if (params.rejectUnsupportedOperations) {
            throw new SqlUnsupportedOperationError(params.sql, undefined, params.ast);
        }

        return undefined;
    } catch (error) {
        const errorAst = params.ast as AnyObject;

        throw ensureErrorAndPrependMessage(
            error,
            `Failed to execute '${errorAst.variant || errorAst.type}' command.`,
        );
    }
}
