import {wrapString} from '@augment-vir/common';
import {csvParseRows} from 'd3-dsv';
import {type RequireExactlyOne} from 'type-fest';
import {trimLines} from '../augments/trim-lines.js';

/**
 * Converts multiple rows of values into a CSV file string.
 *
 * @category CSV
 */
export function convertRowsToCsv(rows: ReadonlyArray<ReadonlyArray<string>>): string {
    return rows.map((row) => convertRowToCsv(row)).join('\n');
}

/**
 * Converts a single row of values into a CSV file string.
 *
 * @category CSV
 */
export function convertRowToCsv(row: ReadonlyArray<string>): string {
    return row
        .map((value) => {
            if (value) {
                return wrapString({value, wrapper: '"'});
            } else {
                return '""';
            }
        })
        .join(',');
}

/**
 * Sorts values for CSV insertion or reading.
 *
 * @category CSV
 */
export function sortValues({
    csvFileHeaderOrder,
    sqlQueryHeaderOrder,
    from,
}: Readonly<{
    csvFileHeaderOrder: ReadonlyArray<string>;
    sqlQueryHeaderOrder: ReadonlyArray<string>;
    from: RequireExactlyOne<{
        /** When a CSV value array is provided, they are sorted to the SQL header order. */
        csvFile: ReadonlyArray<string>;
        /** When a SQL value array is provided, they are sorted to the CSV header order. */
        sqlQuery: ReadonlyArray<string>;
    }>;
}>): string[] {
    const fromOrder = from.sqlQuery ? sqlQueryHeaderOrder : csvFileHeaderOrder;
    const toOrder = (from.sqlQuery ? csvFileHeaderOrder : sqlQueryHeaderOrder).flatMap((header) => {
        if (header === '*') {
            return csvFileHeaderOrder;
        } else {
            return header;
        }
    });
    const values: ReadonlyArray<string> = from.csvFile || from.sqlQuery;

    return toOrder.map((header) => {
        const sourceIndex = fromOrder.indexOf(header);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return values[sourceIndex]!;
    });
}

/**
 * Reads a CSV file contents string and converts it into multiple rows of strings.
 *
 * @category CSV
 */
export function parseCsvContents(csvContents: string): string[][] {
    return csvParseRows(csvContents);
}

/**
 * A tagged template creator that simply returns a string. All leading and trailing whitespace on
 * each line is trimmed, allowing you to format the CSV contents however you like without affecting
 * content.
 *
 * @category CSV
 * @example
 *
 * ```ts
 * import {csv} from 'csv-sql-engine';
 *
 * export myCsv = csv`
 *     a,b,c,d
 *     1,2,3,4
 * `;
 * ```
 */
export function csv(strings: ReadonlyArray<string>, ...values: Array<string>): string {
    const fullString = strings.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '');

    return trimLines(fullString);
}
