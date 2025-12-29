import {check} from '@augment-vir/assert';
import {filterMap} from '@augment-vir/common';
import {nameCsvTableFile, readCsvFile, readCsvHeaders} from '../../csv/csv-file.js';
import {SqlUnsupportedOperationError} from '../../errors/sql.error.js';
import {getAstType} from '../../util/ast-node.js';
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
    async handler({ast, csvDirPath, sql, rejectUnsupportedOperations}) {
        if (ast.variant !== 'select') {
            return undefined;
        }

        const tableName = getAstType(ast.from, 'identifier')?.name;
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

        const rowIndexesToSelect = findWhereMatches(ast.where, csvContents, tableFilePath);
        const columnNames = filterMap(
            ast.result,
            (result) => {
                return getAstType(result, 'identifier')?.name;
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

        return {
            ...sortValues({
                csvFileHeaderOrder: csvHeaders,
                sqlQueryHeaderOrder: columnNames,
                from: {
                    csvFile: csvContents.filter((row, index) => rowIndexesToSelect.includes(index)),
                },
                unconsumedInterpolationValues: sql.unconsumedValues,
            }),
            numberOfRowsAffected: 0,
        };
    },
});
