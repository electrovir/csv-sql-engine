import {check} from '@augment-vir/assert';
import {awaitedBlockingMap} from '@augment-vir/common';
import {nameCsvTableFile, readCsvFile, readCsvHeaders, writeCsvFile} from '../../csv/csv-file.js';
import {AstType} from '../../sql/ast.js';
import {defineAstHandler} from '../define-ast-handler.js';
import {sortValues} from '../sort-values.js';
import {findWhereMatches} from '../where-matcher.js';

/**
 * Handles SQL selection.
 *
 * @category SQL Handler
 */
export const rowSelectHandler = defineAstHandler({
    name: 'row-select',
    async handler({ast, csvDirPath, sql}) {
        if (ast.type === AstType.Select) {
            const tableNames = ast.from.map((table) => table.table);

            const allSelections = await awaitedBlockingMap(tableNames, async (tableName) => {
                const {tableFilePath, sanitizedTableName} = nameCsvTableFile({
                    csvDirPath,
                    tableName,
                });

                const csvContents = await readCsvFile(tableFilePath);
                const csvHeaders = await readCsvHeaders({
                    csvContents,
                    sanitizedTableName,
                });

                const rowIndexesToSelect = findWhereMatches(ast.where, csvContents, tableFilePath);

                const columnNames = ast.columns.map((column) => column.expr.column);

                const selection = csvContents
                    .filter((row, index) => rowIndexesToSelect.includes(index))
                    .map((row) =>
                        sortValues({
                            csvFileHeaderOrder: csvHeaders,
                            sqlQueryHeaderOrder: columnNames,
                            from: {
                                csvFile: row,
                            },
                            unconsumedInterpolationValues: sql.unconsumedValues,
                        }),
                    );

                await writeCsvFile(tableFilePath, csvContents);

                return selection;
            });

            return allSelections.flat().filter(check.isTruthy);
        }

        return undefined;
    },
});
