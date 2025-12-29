import {assertWrap} from '@augment-vir/assert';
import {
    createCsvHeaderMaps,
    nameCsvTableFile,
    readCsvFile,
    readCsvHeaders,
    writeCsvFile,
} from '../../csv/csv-file.js';
import {CsvColumnDoesNotExistError} from '../../errors/csv.error.js';
import {getAstType} from '../../util/ast-node.js';
import {sortValues, type SortValuesOutput} from '../../util/sort-values.js';
import {findWhereMatches} from '../../util/where-matcher.js';
import {defineAstHandler} from '../define-ast-handler.js';

/**
 * Handles updating rows.
 *
 * @category SQL Handler
 */
export const rowUpdateHandler = defineAstHandler({
    name: 'row-update',
    async handler({ast, csvDirPath, sql}) {
        if (ast.variant !== 'update') {
            return undefined;
        }

        const tableName = getAstType(ast.into, 'identifier')?.name;
        if (!tableName) {
            throw new Error('No table name');
        }

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

        const rowIndexesToUpdate = findWhereMatches(ast.where, csvContents, tableFilePath);

        const returningRequirement = ast.returning;

        rowIndexesToUpdate.forEach((rowIndexToUpdate) => {
            const row = assertWrap.isTruthy(
                csvContents[rowIndexToUpdate],
                `Invalid row index '${rowIndexToUpdate}'.`,
            );

            ast.set.forEach((set) => {
                const columnName = set.target.name;

                const headerIndex = csvHeaderIndexes.byName[columnName];
                if (!headerIndex) {
                    throw new CsvColumnDoesNotExistError(sanitizedTableName, columnName);
                }

                const valueNode = getAstType(set.value, 'literal');

                if (!valueNode) {
                    throw new Error(`Unexpected set type: ${set.value.type}`);
                }

                row[headerIndex] = valueNode.value;
            });
        });

        const sqlHeaders =
            returningRequirement?.map((column) => {
                const columnNode = getAstType(column, 'identifier');

                if (columnNode) {
                    return columnNode.name;
                } else {
                    throw new Error(`Unexpected return column type: ${column.type}`);
                }
            }) || [];

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
});
