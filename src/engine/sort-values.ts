import {type RequireExactlyOne} from 'type-fest';
import {type ConsumableValue} from '../sql/sql.js';

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
        csvFile: ReadonlyArray<string>;
        /** When a SQL value array is provided, they are sorted to the CSV header order. */
        sqlQuery: ReadonlyArray<string>;
    }>;
    unconsumedInterpolationValues: undefined | ConsumableValue[];
}>): string[] {
    const fromOrder = from.sqlQuery ? sqlQueryHeaderOrder : csvFileHeaderOrder;
    const toOrder = (from.sqlQuery ? csvFileHeaderOrder : sqlQueryHeaderOrder).flatMap((header) => {
        if (header === '*') {
            return csvFileHeaderOrder;
        } else {
            return header;
        }
    });
    const values: ReadonlyArray<string> = (from.csvFile || from.sqlQuery).map((value) => {
        if (value === '?') {
            if (unconsumedInterpolationValues) {
                if (unconsumedInterpolationValues.length) {
                    return unconsumedInterpolationValues.shift() || '';
                } else {
                    throw new Error(
                        'Encountered ? but all interpolation values have already been used.',
                    );
                }
            } else {
                throw new Error('Encountered ? but received no interpolation values.');
            }
        } else {
            return value;
        }
    });

    return toOrder.map((header) => {
        const sourceIndex = fromOrder.indexOf(header);
        return values[sourceIndex] ?? '';
    });
}
