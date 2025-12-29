import {assertWrap, check} from '@augment-vir/assert';
import {addSuffix, awaitedForEach, removeSuffix} from '@augment-vir/common';
import {appendFile, mkdir, readFile, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {type RequireExactlyOne} from 'type-fest';
import {CsvFileMissingHeadersError} from '../errors/csv.error.js';
import {convertRowsToCsv, convertRowToCsv, parseCsvContents} from './csv-text.js';

/**
 * The extension used for reading and writing to CSV files.
 *
 * @category Internal
 */
export const csvExtension = '.csv';

/**
 * A parsed CSV file's contents.
 *
 * @category Internal
 */
export type CsvFile = string[][];

/**
 * Appends multiple rows to a CSV file.
 *
 * @category CSV
 */
export async function appendCsvRows(
    valueMatrix: ReadonlyArray<ReadonlyArray<string>>,
    csvFilePath: string,
) {
    await awaitedForEach(valueMatrix, async (values) => {
        await appendCsvRow(values, csvFilePath);
    });
}

/**
 * Appends a single row to a CSV file.
 *
 * @category CSV
 */
export async function appendCsvRow(row: ReadonlyArray<string>, csvFilePath: string) {
    await mkdir(dirname(csvFilePath), {recursive: true});
    await appendFile(csvFilePath, convertRowToCsv(row) + '\n');
}

/**
 * Creates a sanitized table name and file path for the given SQL table name.
 *
 * @category CSV
 */
export function nameCsvTableFile({
    csvDirPath,
    tableName,
}: {
    csvDirPath: string;
    tableName: string;
}): {
    tableFilePath: string;
    sanitizedTableName: string;
} {
    const tableNameSplit = tableName.split('.').filter(check.isTruthy);
    const databaseName: string = assertWrap.isTruthy(
        (tableNameSplit.length > 1 ? tableNameSplit[0] || '' : 'main').replaceAll(/[./\\]/g, ''),
        'No database name found.',
    );
    const sanitizedTableName: string = assertWrap.isTruthy(
        removeSuffix({
            value: tableNameSplit.length > 1 ? tableNameSplit[1] || '' : tableName,
            suffix: csvExtension,
        }).replaceAll(/[./\\]/g, ''),
        'No table name found.',
    );

    const newCsvFileName = addSuffix({value: sanitizedTableName, suffix: csvExtension});
    return {
        tableFilePath: join(csvDirPath, databaseName, newCsvFileName),
        sanitizedTableName,
    };
}

/**
 * Reads a CSV from a file path and converts its contents into multiple rows of strings.
 *
 * @category CSV
 */
export async function readCsvFile(filePath: string): Promise<CsvFile> {
    const fileContents = await readFile(filePath, 'utf-8');
    return parseCsvContents(fileContents);
}

/**
 * Replaces a CSV file's complete contents with the new given contents. If the file does not exist,
 * it and its directories are created.
 *
 * @category CSV
 */
export async function writeCsvFile(
    filePath: string,
    contents: ReadonlyArray<ReadonlyArray<string>>,
): Promise<void> {
    const fileContents = convertRowsToCsv(contents);

    await mkdir(dirname(filePath), {recursive: true});

    await writeFile(filePath, fileContents);
}

/**
 * Reads headers from a CSV file or already-parsed CSV contents.
 *
 * @category CSV
 */
export async function readCsvHeaders(
    params: Readonly<
        RequireExactlyOne<{
            csvFilePath: string;
            csvContents: Readonly<CsvFile>;
        }> & {
            sanitizedTableName: string;
        }
    >,
): Promise<string[]> {
    const headers = params.csvContents
        ? params.csvContents[0]
        : (await readCsvFile(params.csvFilePath))[0];
    if (!headers) {
        throw new CsvFileMissingHeadersError(params.sanitizedTableName);
    }

    return headers;
}

/**
 * Maps CSV headers to their indexes.
 *
 * @category CSV
 */
export function createCsvHeaderMaps(csvHeaders: ReadonlyArray<string>): {
    byName: Record<string, number>;
    byIndex: Record<number, string>;
} {
    const byName: Record<string, number> = {};
    const byIndex: Record<number, string> = {};

    csvHeaders.forEach((name, index) => {
        byName[name] = index;
        byIndex[index] = name;
    });

    return {
        byIndex,
        byName,
    };
}
