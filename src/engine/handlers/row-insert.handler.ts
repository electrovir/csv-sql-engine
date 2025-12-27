import {assertWrap, check} from '@augment-vir/assert';
import {awaitedBlockingMap} from '@augment-vir/common';
import {appendCsvRow, nameCsvTableFile, readCsvHeaders} from '../../csv/csv-file.js';
import {AstType} from '../../sql/ast.js';
import {type AstHandlerResult, defineAstHandler} from '../define-ast-handler.js';
import {sortValues} from '../sort-values.js';

/**
 * Handles inserting rows.
 *
 * @category SQL Handler
 */
export const rowInsertHandler = defineAstHandler({
    name: 'row-insert',
    async handler({ast, csvDirPath, sql}) {
        if (ast.type === AstType.Insert) {
            const tableNames = ast.table.map((table) => table.table);

            const results = await awaitedBlockingMap(
                tableNames,
                async (tableName): Promise<AstHandlerResult | undefined> => {
                    const {tableFilePath, sanitizedTableName} = nameCsvTableFile({
                        csvDirPath,
                        tableName,
                    });

                    const rawValues: string[] = ast.values.values.flatMap((value) =>
                        value.value.flatMap((value) => String(value.value)),
                    );

                    const csvFileHeaderOrder = await readCsvHeaders({
                        csvFilePath: tableFilePath,
                        sanitizedTableName,
                    });

                    const newRow: string[] = assertWrap.isDefined(
                        sortValues({
                            csvFileHeaderOrder,
                            sqlQueryHeaderOrder: ast.columns || csvFileHeaderOrder,
                            from: {
                                sqlQuery: [rawValues],
                            },
                            unconsumedInterpolationValues: sql.unconsumedValues,
                        }).values[0],
                        'No sorted row retrieved.',
                    );

                    await appendCsvRow(newRow, tableFilePath);

                    if (ast.returning) {
                        const sqlHeaders = ast.returning.columns.map(
                            (column) => column.expr.column,
                        );

                        return sortValues({
                            csvFileHeaderOrder,
                            sqlQueryHeaderOrder: sqlHeaders,
                            from: {
                                csvFile: [newRow],
                            },
                            unconsumedInterpolationValues: undefined,
                        });
                    } else {
                        return undefined;
                    }
                },
            );

            return results.filter(check.isTruthy);
        }

        return undefined;
    },
});
