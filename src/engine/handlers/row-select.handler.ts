import {check, checkWrap} from '@augment-vir/assert';
import {filterMap} from '@augment-vir/common';
import {nameCsvTableFile, readCsvFile, readCsvHeaders} from '../../csv/csv-file.js';
import {SqlUnsupportedOperationError} from '../../errors/sql.error.js';
import {getAst} from '../../util/ast-node.js';
import {readAstText} from '../../util/ast-text.js';
import {readConsumableValue} from '../../util/consumable.js';
import {sortValues} from '../../util/sort-values.js';
import {findWhereMatches, MatchSort} from '../../util/where-matcher.js';
import {defineAstHandler} from '../define-ast-handler.js';

/**
 * Handles SQL selection.
 *
 * @category SQL Handler
 */
export const rowSelectHandler = defineAstHandler({
    name: 'row-select',
    async handler({ast, csvDirPath, sql, rejectUnsupportedOperations}) {
        if (ast.variant !== 'select') {
            return undefined;
        }

        const tableName = getAst({ast: ast.from, property: 'type', value: 'identifier'})?.name;
        if (!tableName) {
            throw new Error('No table name.');
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

        const limit = ast.limit
            ? checkWrap.isNumber(
                  Number(readConsumableValue(readAstText(ast.limit.start), sql.unconsumedValues)),
              )
            : -1;
        if (limit == undefined) {
            throw new Error(`Unexpected limit: ${JSON.stringify(ast.limit)}`);
        }
        const offset = ast.limit?.offset
            ? checkWrap.isNumber(
                  Number(readConsumableValue(readAstText(ast.limit.offset), sql.unconsumedValues)),
              )
            : 0;

        if (offset == undefined) {
            throw new Error(`Unexpected offset: ${JSON.stringify(ast.limit?.offset)}`);
        }

        const rawIndexes = findWhereMatches(
            ast.where,
            csvContents,
            tableFilePath,
            MatchSort.Ascending,
        );

        const rowIndexesToSelect =
            limit < 0 ? rawIndexes.slice(offset) : rawIndexes.slice(offset, offset + limit);

        const columnNames = filterMap(
            ast.result,
            (result) => {
                return getAst({ast: result, property: 'type', value: 'identifier'})?.name;
            },
            (value): value is string => {
                if (check.isString(value)) {
                    return true;
                } else if (rejectUnsupportedOperations) {
                    throw new SqlUnsupportedOperationError(
                        sql,
                        'Result name is not a string.',
                        ast,
                    );
                } else {
                    return false;
                }
            },
        );

        const selectedRows = csvContents.filter((row, index) => rowIndexesToSelect.includes(index));

        const result = sortValues({
            csvFileHeaderOrder: csvHeaders,
            sqlQueryHeaderOrder: columnNames,
            from: {
                csvFile: selectedRows,
            },
            unconsumedInterpolationValues: sql.unconsumedValues,
        });

        return {
            ...result,
            numberOfRowsAffected: 0,
        };
    },
});
