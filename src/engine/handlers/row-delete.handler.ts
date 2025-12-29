import {nameCsvTableFile, readCsvFile, readCsvHeaders, writeCsvFile} from '../../csv/csv-file.js';
import {getAst} from '../../util/ast-node.js';
import {sortValues, type SortValuesOutput} from '../../util/sort-values.js';
import {findWhereMatches, MatchSort} from '../../util/where-matcher.js';
import {defineAstHandler} from '../define-ast-handler.js';

/**
 * Handles deleting rows.
 *
 * @category SQL Handler
 */
export const rowDeleteHandler = defineAstHandler({
    name: 'row-delete',
    async handler({ast, csvDirPath, sql}) {
        if (ast.variant !== 'delete') {
            return undefined;
        }

        const tableName = getAst({
            ast: ast.from,
            property: 'type',
            value: 'identifier',
        })?.name;
        if (!tableName) {
            throw new Error('Missing table name.');
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

        const rowIndexesToDelete = findWhereMatches(
            ast.where,
            csvContents,
            tableFilePath,
            MatchSort.Descending,
        );
        const returningRequirement = ast.returning;

        const sqlHeaders =
            returningRequirement?.map((column) => {
                const columnNode = getAst({
                    ast: column,
                    property: 'type',
                    value: 'identifier',
                });

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
                          rowIndexesToDelete.includes(index),
                      ),
                  },
                  unconsumedInterpolationValues: sql.unconsumedValues,
              })
            : {
                  columnNames: [],
                  values: [],
              };

        rowIndexesToDelete.forEach((rowIndexToDelete) => {
            csvContents.splice(rowIndexToDelete, 1);
        });

        await writeCsvFile(tableFilePath, csvContents);

        return {
            ...result,
            numberOfRowsAffected: rowIndexesToDelete.length,
        };
    },
});
