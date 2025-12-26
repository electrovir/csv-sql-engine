import {check} from '@augment-vir/assert';
import {awaitedBlockingMap, ensureErrorAndPrependMessage} from '@augment-vir/common';
import {mkdir} from 'node:fs/promises';
import {SqlUnsupportedOperationError} from '../errors/sql.error.js';
import {parseSql} from '../sql/parse-sql.js';
import {rawSql, type Sql} from '../sql/sql.js';
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

    const astResults = parseSql(sql, params);

    await mkdir(params.csvDirPath, {
        recursive: true,
    });

    return await awaitedBlockingMap(astResults, async (ast) => {
        return await executeIndividualCommand({
            ...params,
            ast,
            sql,
        });
    });
}

async function executeIndividualCommand(
    params: Readonly<AstHandlerParams>,
): Promise<AstHandlerResult> {
    try {
        for (const handler of allAstHandlers) {
            const output = await handler.handler(params);
            if (output) {
                return output;
            }
        }

        /** If nothing handled the query, then we don't support it. */
        if (params.rejectUnsupportedOperations) {
            throw new SqlUnsupportedOperationError(params.sql, undefined);
        }

        return [];
    } catch (error) {
        throw ensureErrorAndPrependMessage(
            error,
            `Failed to execute '${params.ast.type}' command.`,
        );
    }
}
