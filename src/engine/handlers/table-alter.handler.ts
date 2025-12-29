import {assert, assertWrap} from '@augment-vir/assert';
import {stringify} from '@augment-vir/common';
import {existsSync} from 'node:fs';
import {rename} from 'node:fs/promises';
import {nameCsvTableFile, readCsvFile, readCsvHeaders, writeCsvFile} from '../../csv/csv-file.js';
import {CsvColumnDoesNotExistError, CsvTableDoesNotExistError} from '../../errors/csv.error.js';
import {SqlUnsupportedOperationError} from '../../errors/sql.error.js';
import {getAst} from '../../util/ast-node.js';
import {defineAstHandler} from '../define-ast-handler.js';

/**
 * Handles altering tables.
 *
 * @category SQL Handler
 */
export const tableAlterHandler = defineAstHandler({
    name: 'table-alter',
    async handler({ast, csvDirPath, sql}) {
        if (ast.variant !== 'alter table' || ast.target.type !== 'identifier') {
            return;
        }

        const tableName = ast.target.name;
        const {tableFilePath, sanitizedTableName} = nameCsvTableFile({
            csvDirPath,
            tableName,
        });
        if (!existsSync(tableFilePath)) {
            throw new CsvTableDoesNotExistError(sanitizedTableName);
        }

        /** Mutate this to apply the table alterations. */
        const csvContents = await readCsvFile(tableFilePath);
        const csvHeaders = await readCsvHeaders({
            csvContents,
            sanitizedTableName,
        });

        if (ast.action === 'rename') {
            const newTableName = assertWrap.isTruthy(
                getAst({ast: ast.name, property: 'type', value: 'identifier'})?.name,
                'Missing new table name.',
            );

            await rename(
                tableFilePath,
                nameCsvTableFile({csvDirPath, tableName: newTableName}).tableFilePath,
            );

            return {
                columnNames: [],
                numberOfRowsAffected: 0,
                values: [],
            };
        } else if (ast.action === 'add') {
            if (!ast.definition || ast.definition.type !== 'definition') {
                return;
            }

            const defaultValue =
                getAst({
                    ast: ast.definition.definition.find(
                        (entry) => entry.type === 'constraint' && entry.variant === 'default',
                    )?.value,
                    property: 'type',
                    value: 'literal',
                })?.value || '';
            const newHeaderName: string = assertWrap.isTruthy(
                ast.definition.name,
                'Missing new column name.',
            );

            csvContents.forEach((row, index) => {
                if (index) {
                    row.push(defaultValue);
                } else {
                    row.push(newHeaderName);
                }
            });
        } else if (ast.action === 'rename, column') {
            const oldHeaderName = ast.oldName;
            const newHeaderName = ast.newName;

            if (!oldHeaderName) {
                throw new Error('No old column name.');
            } else if (!newHeaderName) {
                throw new Error('No new column name.');
            }

            let oldHeaderFound = false as boolean;

            const newHeaders = csvHeaders.map((header) => {
                if (header === oldHeaderName) {
                    oldHeaderFound = true;
                    return newHeaderName;
                } else {
                    return header;
                }
            });

            if (!oldHeaderFound) {
                throw new CsvColumnDoesNotExistError(sanitizedTableName, oldHeaderName);
            }

            csvContents[0] = newHeaders;
        } else if (ast.action === 'drop') {
            const columnName = ast.column;
            assert.isTruthy(columnName, 'No column name found to drop.');
            const columnIndex = csvHeaders.indexOf(columnName);

            if (columnIndex < 0) {
                throw new CsvColumnDoesNotExistError(sanitizedTableName, columnName);
            }

            csvContents.forEach((row) => {
                row.splice(columnIndex, 1);
            });
        } else {
            throw new SqlUnsupportedOperationError(
                sql,
                `Forgot to handle alter table action: '${stringify(ast.action)}'`,
                ast,
            );
        }

        await writeCsvFile(tableFilePath, csvContents);

        return {
            columnNames: [],
            numberOfRowsAffected: 0,
            values: [],
        };
    },
});
