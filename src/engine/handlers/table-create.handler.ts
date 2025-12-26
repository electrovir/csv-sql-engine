import {check} from '@augment-vir/assert';
import {awaitedForEach, filterMap} from '@augment-vir/common';
import {existsSync} from 'node:fs';
import {appendCsvRow, nameCsvTableFile} from '../../csv/csv-file.js';
import {CsvTableExistsError} from '../../errors/csv.error.js';
import {SqlMissingColumnsError} from '../../errors/sql.error.js';
import {AstType, CreateKeyword} from '../../sql/ast.js';
import {defineAstHandler} from '../define-ast-handler.js';

/**
 * Handles creating tables.
 *
 * @category SQL Handler
 */
export const tableCreateHandler = defineAstHandler({
    name: 'table-create',
    async handler({ast, csvDirPath, sql}) {
        if (ast.type === AstType.Create && ast.keyword === CreateKeyword.Table) {
            await awaitedForEach(ast.table, async (table) => {
                const {tableFilePath, sanitizedTableName} = nameCsvTableFile({
                    csvDirPath,
                    tableName: table.table,
                });

                if (existsSync(tableFilePath)) {
                    throw new CsvTableExistsError(sanitizedTableName);
                }

                const headers = filterMap(
                    ast.create_definitions,
                    (definition) => {
                        return definition.column.column;
                    },
                    check.isTruthy,
                );

                if (!headers.length) {
                    throw new SqlMissingColumnsError(sql, sanitizedTableName);
                }

                await appendCsvRow(headers, tableFilePath);
            });

            return [];
        }

        return undefined;
    },
});
