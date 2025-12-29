import {type ConsumableValue} from 'sqlite-ast';
import {type RequireExactlyOne} from 'type-fest';
import {readConsumableValue} from './consumable.js';

/**
 * Output from {@link sortValues}.
 *
 * @category Internal
 */
export type SortValuesOutput = {
    values: string[][];
    columnNames: string[];
};

/**
 * Extracts the column name from a potentially fully qualified identifier. E.g., `main.users.email`
 * -> `email`, `users.email` -> `email`, `email` -> `email`
 */
export function extractColumnName(header: string): string {
    const parts = header.split('.');
    return parts[parts.length - 1] || header;
}

/**
 * Sorts values for CSV insertion or reading and handle interpolated values.
 *
 * @category Internal
 */
export function sortValues({
    csvFileHeaderOrder,
    sqlQueryHeaderOrder,
    from,
    unconsumedInterpolationValues,
}: Readonly<{
    csvFileHeaderOrder: ReadonlyArray<string>;
    sqlQueryHeaderOrder: ReadonlyArray<string>;
    from: RequireExactlyOne<{
        /** When a CSV value array is provided, they are sorted to the SQL header order. */
        csvFile: ReadonlyArray<ReadonlyArray<string>>;
        /** When a SQL value array is provided, they are sorted to the CSV header order. */
        sqlQuery: ReadonlyArray<ReadonlyArray<string>>;
    }>;
    unconsumedInterpolationValues: undefined | ConsumableValue[];
}>): SortValuesOutput {
    const fromOrder = (from.sqlQuery ? sqlQueryHeaderOrder : csvFileHeaderOrder).map(
        extractColumnName,
    );
    const toOrder = (from.sqlQuery ? csvFileHeaderOrder : sqlQueryHeaderOrder)
        .flatMap((header) => {
            if (header === '*') {
                return csvFileHeaderOrder;
            } else {
                return header;
            }
        })
        .map(extractColumnName);

    const values: string[][] = (from.csvFile || from.sqlQuery).map((valueRow) => {
        const mappedValueRow = valueRow.map((value) => {
            return readConsumableValue(value, unconsumedInterpolationValues);
        });

        return toOrder.map((header) => {
            const sourceIndex = fromOrder.indexOf(header);
            return mappedValueRow[sourceIndex] ?? '';
        });
    });

    return {
        columnNames: toOrder,
        values,
    };
}
