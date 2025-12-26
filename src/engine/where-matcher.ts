import {assert} from '@augment-vir/assert';
import {extractDuplicates, filterMap, removeDuplicates, removeSuffix} from '@augment-vir/common';
import {csvExtension, type CsvFile} from '../csv/csv-file.js';
import {CsvColumnDoesNotExistError, CsvFileMissingHeadersError} from '../errors/csv.error.js';
import {WhereOperator, type Where} from '../sql/ast.js';

/**
 * Finds all row indexes that match the given SQL where conditions.
 *
 * @category Internal
 * @returns An array of row indexes that match the given where condition.
 */
export function findWhereMatches(
    where: Readonly<Where>,
    csvContents: Readonly<CsvFile>,
    csvFilePath: string,
): number[] {
    /**
     * These must be sorted from greatest to least so that deleting rows does not mess up the
     * indexes.
     */
    return innerFindWhereMatches(where, csvContents, csvFilePath).sort((a, b) => b - a);
}

function innerFindWhereMatches(
    where: Readonly<Where>,
    csvContents: Readonly<CsvFile>,
    csvFilePath: string,
): number[] {
    if (where.operator === WhereOperator.Or) {
        return removeDuplicates([
            ...innerFindWhereMatches(where.left, csvContents, csvFilePath),
            ...innerFindWhereMatches(where.right, csvContents, csvFilePath),
        ]);
    } else if (where.operator === WhereOperator.And) {
        return extractDuplicates([
            ...innerFindWhereMatches(where.left, csvContents, csvFilePath),
            ...innerFindWhereMatches(where.right, csvContents, csvFilePath),
        ]).duplicates;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    } else if (where.operator === WhereOperator.Equals) {
        const headers = csvContents[0];
        if (!headers) {
            throw new CsvFileMissingHeadersError(csvFilePath);
        }

        const columnIndex = headers.indexOf(where.left.column);
        if (columnIndex < 0) {
            throw new CsvColumnDoesNotExistError(
                removeSuffix({value: csvFilePath, suffix: csvExtension}),
                where.left.column,
            );
        }

        return filterMap(
            csvContents,
            (row, index) => index,
            (index, row) => {
                /** Don't select from the header row. */
                const isHeaderRow: boolean = !index;

                return !isHeaderRow && String(row[columnIndex]) === String(where.right.value);
            },
        );
    } else {
        assert.tsType(where.operator).equals<never>();
        throw new Error(`Forgot to implement WHERE operation: '${String(where.operator)}'`);
    }
}
