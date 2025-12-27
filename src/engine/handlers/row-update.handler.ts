import {assertWrap, check} from '@augment-vir/assert';
import {awaitedBlockingMap} from '@augment-vir/common';
import {
    createCsvHeaderMaps,
    nameCsvTableFile,
    readCsvFile,
    readCsvHeaders,
    writeCsvFile,
} from '../../csv/csv-file.js';
import {CsvColumnDoesNotExistError} from '../../errors/csv.error.js';
import {AstType} from '../../sql/ast.js';
import {type AstHandlerResult, defineAstHandler} from '../define-ast-handler.js';
import {sortValues, type SortValuesOutput} from '../sort-values.js';
import {findWhereMatches} from '../where-matcher.js';

/**
 * Handles updating rows.
 *
 * @category SQL Handler
 */
export const rowUpdateHandler = defineAstHandler({
    name: 'row-update',
    async handler({ast, csvDirPath, sql}) {
        if (ast.type === AstType.Update) {
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
                    const csvHeaderIndexes = createCsvHeaderMaps(csvHeaders);

                    const rowIndexesToUpdate = findWhereMatches(
                        ast.where,
                        csvContents,
                        tableFilePath,
                    );

                    const returningRequirement = ast.returning;

                    rowIndexesToUpdate.forEach((rowIndexToUpdate) => {
                        const row = assertWrap.isDefined(
                            csvContents[rowIndexToUpdate],
                            `Invalid row index '${rowIndexToUpdate}'.`,
                        );

                        ast.set.forEach((set) => {
                            const columnName = set.column;

                            const headerIndex = csvHeaderIndexes.byName[columnName];
                            if (!headerIndex) {
                                throw new CsvColumnDoesNotExistError(
                                    sanitizedTableName,
                                    columnName,
                                );
                            }

                            row[headerIndex] = set.value.value;
                        });
                    });

                    const sqlHeaders =
                        returningRequirement?.columns.map((column) => column.expr.column) || [];

                    const result: SortValuesOutput = returningRequirement
                        ? sortValues({
                              csvFileHeaderOrder: csvHeaders,
                              sqlQueryHeaderOrder: sqlHeaders,
                              from: {
                                  csvFile: csvContents.filter((row, index) =>
                                      rowIndexesToUpdate.includes(index),
                                  ),
                              },
                              unconsumedInterpolationValues: sql.unconsumedValues,
                          })
                        : {
                              columnNames: [],
                              values: [],
                          };

                    await writeCsvFile(tableFilePath, csvContents);

                    return {
                        ...result,
                        numberOfRowsAffected: rowIndexesToUpdate.length,
                    };
                },
            );

            return results.flat().filter(check.isTruthy);
        }

        return undefined;
    },
});
