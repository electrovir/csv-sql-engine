import {existsSync} from 'node:fs';
import {rm} from 'node:fs/promises';
import {nameCsvTableFile, readCsvFile} from '../../csv/csv-file.js';
import {CsvTableDoesNotExistError} from '../../errors/csv.error.js';
import {defineAstHandler} from '../define-ast-handler.js';

/**
 * Handles dropping tables.
 *
 * @category SQL Handler
 */
export const tableDropHandler = defineAstHandler({
    name: 'table-drop',
    async handler({ast, csvDirPath}) {
        if (ast.variant !== 'drop') {
            return undefined;
        }

        const tableName = ast.target.name;
        const {tableFilePath, sanitizedTableName} = nameCsvTableFile({
            csvDirPath,
            tableName,
        });

        if (existsSync(tableFilePath)) {
            const csvContents = await readCsvFile(tableFilePath);
            await rm(tableFilePath);

            return {
                columnNames: csvContents[0] || [],
                numberOfRowsAffected: csvContents.length - 1,
                values: csvContents.slice(1),
            };
        } else if (
            ast.condition[0]?.variant === 'if' &&
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            ast.condition[0]?.condition.variant === 'exists'
        ) {
            return {
                columnNames: [],
                numberOfRowsAffected: 0,
                values: [],
            };
        } else {
            throw new CsvTableDoesNotExistError(sanitizedTableName);
        }
    },
});
