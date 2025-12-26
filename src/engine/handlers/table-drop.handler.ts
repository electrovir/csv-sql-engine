import {awaitedForEach} from '@augment-vir/common';
import {existsSync} from 'node:fs';
import {rm} from 'node:fs/promises';
import {nameCsvTableFile} from '../../csv/csv-file.js';
import {CsvTableDoesNotExistError} from '../../errors/csv.error.js';
import {AstType} from '../../sql/ast.js';
import {defineAstHandler} from '../define-ast-handler.js';

/**
 * Handles dropping tables.
 *
 * @category SQL Handler
 */
export const tableDropHandler = defineAstHandler({
    name: 'table-drop',
    async handler({ast, csvDirPath}) {
        if (ast.type === AstType.Drop) {
            await awaitedForEach(ast.name, async (table) => {
                const {tableFilePath, sanitizedTableName} = nameCsvTableFile({
                    csvDirPath,
                    tableName: table.table,
                });

                if (existsSync(tableFilePath)) {
                    await rm(tableFilePath);
                } else if (ast.prefix === 'if exists') {
                    return;
                } else {
                    throw new CsvTableDoesNotExistError(sanitizedTableName);
                }
            });

            return [];
        }

        return undefined;
    },
});
