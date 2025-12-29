import {check} from '@augment-vir/assert';
import {filterMap} from '@augment-vir/common';
import {existsSync} from 'node:fs';
import {appendCsvRow, nameCsvTableFile} from '../../csv/csv-file.js';
import {CsvTableExistsError} from '../../errors/csv.error.js';
import {SqlMissingColumnsError, SqlUnsupportedOperationError} from '../../errors/sql.error.js';
import {defineAstHandler} from '../define-ast-handler.js';

/**
 * Handles creating tables.
 *
 * @category SQL Handler
 */
export const tableCreateHandler = defineAstHandler({
    name: 'table-create',
    async handler({ast, csvDirPath, sql, rejectUnsupportedOperations}) {
        if (
            ast.variant !== 'create' ||
            ast.format !== 'table' ||
            !ast.name ||
            ast.name.type !== 'identifier'
        ) {
            return undefined;
        }

        const tableName = ast.name.name;

        if (!tableName) {
            if (rejectUnsupportedOperations) {
                throw new SqlUnsupportedOperationError(
                    sql,
                    'No table name found when creating a table.',
                    ast,
                );
            }
            return undefined;
        }

        const {tableFilePath, sanitizedTableName} = nameCsvTableFile({
            csvDirPath,
            tableName,
        });

        if (existsSync(tableFilePath)) {
            throw new CsvTableExistsError(sanitizedTableName);
        }

        const headers = filterMap(
            ast.definition || [],
            (definition) => {
                if (definition.type !== 'definition' || !definition.name) {
                    return undefined;
                }

                return definition.name;
            },
            check.isTruthy,
        );

        if (!headers.length) {
            throw new SqlMissingColumnsError(sql, sanitizedTableName);
        }

        await appendCsvRow(headers, tableFilePath);

        return {
            columnNames: [],
            numberOfRowsAffected: 0,
            values: [],
        };
    },
});
