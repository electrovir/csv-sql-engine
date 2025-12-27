import {check} from '@augment-vir/assert';
import {awaitedBlockingMap} from '@augment-vir/common';
import {nameCsvTableFile, readCsvFile, readCsvHeaders, writeCsvFile} from '../../csv/csv-file.js';
import {AstType} from '../../sql/ast.js';
import {type AstHandlerResult, defineAstHandler} from '../define-ast-handler.js';
import {sortValues} from '../sort-values.js';
import {findWhereMatches} from '../where-matcher.js';

/**
 * Handles deleting rows.
 *
 * @category SQL Handler
 */
export const rowDeleteHandler = defineAstHandler({
    name: 'row-delete',
    async handler({ast, csvDirPath, sql}) {
        if (ast.type === AstType.Delete) {
            const tableNames = ast.table.map((table) => table.table);

            const results = await awaitedBlockingMap(
                tableNames,
                async (tableName): Promise<AstHandlerResult | undefined> => {
                    const {tableFilePath, sanitizedTableName} = nameCsvTableFile({
                        csvDirPath,
                        tableName,
                    });

                    const csvContents = await readCsvFile(tableFilePath);
                    const csvHeaders = await readCsvHeaders({
                        csvContents,
                        sanitizedTableName,
                    });

                    const rowIndexesToDelete = findWhereMatches(
                        ast.where,
                        csvContents,
                        tableFilePath,
                    );

                    const returningRequirement = ast.returning;

                    const result = returningRequirement
                        ? sortValues({
                              csvFileHeaderOrder: csvHeaders,
                              sqlQueryHeaderOrder: returningRequirement.columns.map(
                                  (column) => column.expr.column,
                              ),
                              from: {
                                  csvFile: csvContents.filter((row, index) =>
                                      rowIndexesToDelete.includes(index),
                                  ),
                              },
                              unconsumedInterpolationValues: sql.unconsumedValues,
                          })
                        : undefined;

                    rowIndexesToDelete.forEach((rowIndexToDelete) => {
                        csvContents.splice(rowIndexToDelete, 1);
                    });

                    await writeCsvFile(tableFilePath, csvContents);

                    return result;
                },
            );

            return results.flat().filter(check.isTruthy);
        }

        return undefined;
    },
});
