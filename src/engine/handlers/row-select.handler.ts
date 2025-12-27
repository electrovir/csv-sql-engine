import {check} from '@augment-vir/assert';
import {awaitedBlockingMap} from '@augment-vir/common';
import {nameCsvTableFile, readCsvFile, readCsvHeaders} from '../../csv/csv-file.js';
import {AstType} from '../../sql/ast.js';
import {type AstHandlerResult, defineAstHandler} from '../define-ast-handler.js';
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

            const allSelections = await awaitedBlockingMap(
                tableNames,
                async (tableName): Promise<AstHandlerResult> => {
                    const {tableFilePath, sanitizedTableName} = nameCsvTableFile({
                        csvDirPath,
                        tableName,
                    });

                    const csvContents = await readCsvFile(tableFilePath);
                    const csvHeaders = await readCsvHeaders({
                        csvContents,
                        sanitizedTableName,
                    });

                    const rowIndexesToSelect = findWhereMatches(
                        ast.where,
                        csvContents,
                        tableFilePath,
                    );

                    const columnNames = ast.columns.map((column) => column.expr.column);

                    return sortValues({
                        csvFileHeaderOrder: csvHeaders,
                        sqlQueryHeaderOrder: columnNames,
                        from: {
                            csvFile: csvContents.filter((row, index) =>
                                rowIndexesToSelect.includes(index),
                            ),
                        },
                        unconsumedInterpolationValues: sql.unconsumedValues,
                    });
                },
            );

            return allSelections.flat().filter(check.isTruthy);
        }

        return undefined;
    },
});
