import {assertWrap, check} from '@augment-vir/assert';
import {filterMap} from '@augment-vir/common';
import {existsSync} from 'node:fs';
import {appendCsvRow, nameCsvTableFile, readCsvFile, readCsvHeaders} from '../../csv/csv-file.js';
import {CsvTableDoesNotExistError} from '../../errors/csv.error.js';
import {SqlUnsupportedOperationError} from '../../errors/sql.error.js';
import {defineAstHandler} from '../define-ast-handler.js';
import {sortValues, type SortValuesOutput} from '../sort-values.js';

/**
 * Handles inserting rows.
 *
 * @category SQL Handler
 */
export const rowInsertHandler = defineAstHandler({
    name: 'row-insert',
    async handler({ast, csvDirPath, sql, rejectUnsupportedOperations}) {
        if (
            ast.variant !== 'insert' ||
            ast.into.type !== 'identifier' ||
            (ast.into.variant !== 'table' && ast.into.format !== 'table')
        ) {
            return;
        }

        const tableName = ast.into.name;
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
        const sqlHeaders = ast.into.columns
            ? filterMap(
                  ast.into.columns,
                  (column) => {
                      if (column.type === 'identifier' && column.variant === 'column') {
                          return column.name;
                      } else if (rejectUnsupportedOperations) {
                          throw new SqlUnsupportedOperationError(
                              sql,
                              `Unsupported column definition: '${JSON.stringify(column)}'`,
                              ast,
                          );
                      } else {
                          return undefined;
                      }
                  },
                  check.isTruthy,
              )
            : csvHeaders;

        if (!check.isArray(ast.result)) {
            if (rejectUnsupportedOperations) {
                throw new SqlUnsupportedOperationError(
                    sql,
                    `Unsupported result: '${JSON.stringify(ast.result)}'`,
                    ast,
                );
            } else {
                return undefined;
            }
        }

        const resultExpression = assertWrap.isTruthy(ast.result[0], 'No result.');

        if (
            resultExpression.type !== 'expression' ||
            resultExpression.variant !== 'list' ||
            !check.isArray(resultExpression.expression)
        ) {
            if (rejectUnsupportedOperations) {
                throw new SqlUnsupportedOperationError(
                    sql,
                    `Expected expression: ${JSON.stringify(resultExpression)}`,
                    ast,
                );
            } else {
                return undefined;
            }
        }

        const rawValues = filterMap(
            resultExpression.expression,
            (entry) => {
                if (entry.type === 'identifier' || entry.type === 'variable') {
                    return entry.name;
                } else if (entry.type === 'literal') {
                    return entry.value;
                } else if (rejectUnsupportedOperations) {
                    throw new SqlUnsupportedOperationError(
                        sql,
                        `Unsupported expression entry: ${JSON.stringify(entry)}`,
                        ast,
                    );
                } else {
                    return undefined;
                }
            },
            check.isTruthy,
        );

        const newRow = assertWrap.isTruthy(
            sortValues({
                csvFileHeaderOrder: csvHeaders,
                sqlQueryHeaderOrder: sqlHeaders,
                unconsumedInterpolationValues: sql.unconsumedValues,
                from: {
                    sqlQuery: [rawValues],
                },
            }).values[0],
            'No sorted row retrieved.',
        );

        await appendCsvRow(newRow, tableFilePath);

        const readResult: SortValuesOutput = ast.returning
            ? sortValues({
                  csvFileHeaderOrder: csvHeaders,
                  sqlQueryHeaderOrder: filterMap(
                      ast.returning,
                      (entry) => {
                          if (entry.type === 'identifier') {
                              return entry.name;
                          } else if (rejectUnsupportedOperations) {
                              throw new Error(
                                  `Unsupported returning entry: ${JSON.stringify(entry)}`,
                              );
                          } else {
                              return undefined;
                          }
                      },
                      check.isTruthy,
                  ),
                  from: {
                      csvFile: [newRow],
                  },
                  unconsumedInterpolationValues: undefined,
              })
            : {
                  columnNames: [],
                  values: [],
              };

        return {
            ...readResult,
            numberOfRowsAffected: 1,
        };
    },
});
