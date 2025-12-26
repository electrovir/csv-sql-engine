import {assert} from '@augment-vir/assert';
import {awaitedForEach, stringify} from '@augment-vir/common';
import {existsSync} from 'node:fs';
import {nameCsvTableFile, readCsvFile, readCsvHeaders, writeCsvFile} from '../../csv/csv-file.js';
import {CsvColumnDoesNotExistError, CsvTableDoesNotExistError} from '../../errors/csv.error.js';
import {AlterExpressionAction} from '../../sql/ast.js';
import {defineAstHandler} from '../define-ast-handler.js';

/**
 * Handles altering tables.
 *
 * @category SQL Handler
 */
export const tableAlterHandler = defineAstHandler({
    name: 'table-alter',
    async handler({ast, csvDirPath}) {
        if (ast.type === 'alter') {
            const tableNames = ast.table.map((table) => table.table);

            await awaitedForEach(tableNames, async (tableName) => {
                await awaitedForEach(ast.expr, async (expression) => {
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

                    if (expression.action === AlterExpressionAction.Add) {
                        const defaultValue: string = expression.default_val?.value.value || '';
                        const newHeaderName: string = expression.column.column;

                        csvContents.forEach((row, index) => {
                            if (index) {
                                row.push(defaultValue);
                            } else {
                                row.push(newHeaderName);
                            }
                        });
                    } else if (expression.action === AlterExpressionAction.Rename) {
                        const oldHeaderName = expression.old_column.column;
                        const newHeaderName = expression.column.column;

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
                        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                    } else if (expression.action === AlterExpressionAction.Drop) {
                        const columnName = expression.column.column;
                        const columnIndex = csvHeaders.indexOf(columnName);

                        if (columnIndex < 0) {
                            throw new CsvColumnDoesNotExistError(sanitizedTableName, columnName);
                        }

                        csvContents.forEach((row) => {
                            row.splice(columnIndex, 1);
                        });
                    } else {
                        assert.tsType(expression).equals<never>();
                        assert.never(`Forgot to handle expression action ${stringify(expression)}`);
                    }

                    await writeCsvFile(tableFilePath, csvContents);
                });
            });

            return [];
        }

        return undefined;
    },
});
