import {check} from '@augment-vir/assert';
import {
    ensureArray,
    extractDuplicates,
    filterMap,
    type MaybeArray,
    removeDuplicates,
    removeSuffix,
} from '@augment-vir/common';
import {type SqliteAstNode} from 'sqlite-ast';
import {csvExtension, type CsvFile} from '../csv/csv-file.js';
import {CsvColumnDoesNotExistError, CsvFileMissingHeadersError} from '../errors/csv.error.js';

/**
 * Used to determine how matches returned from {@link findWhereMatches} should be sorted.
 *
 * @category Internal
 */
export enum MatchSort {
    /** 0 index first */
    Ascending = 'ascending',
    /** 0 index last */
    Descending = 'descending',
}

/**
 * Finds all row indexes that match the given SQL where conditions.
 *
 * @category Internal
 * @returns An array of row indexes that match the given where condition.
 */
export function findWhereMatches(
    expressions: Readonly<MaybeArray<Readonly<SqliteAstNode>>> | undefined,
    csvContents: Readonly<CsvFile>,
    csvFilePath: string,
    sort: MatchSort,
): number[] {
    const allIndexes = removeDuplicates(
        (expressions ? ensureArray(expressions) : [undefined]).flatMap((expression) =>
            innerFindWhereMatches(expression, csvContents, csvFilePath),
        ),
    ).sort((a, b) => {
        if (sort === MatchSort.Descending) {
            return b - a;
        } else {
            return a - b;
        }
    });

    return allIndexes;
}

function getAllIndexes(csvContents: Readonly<CsvFile>) {
    return csvContents
        .map((value, index) => index)
        .filter(
            /** Exclude the first index, which is headers. */
            check.isTruthy,
        );
}

function innerFindWhereMatches(
    where: Readonly<SqliteAstNode> | undefined,
    csvContents: Readonly<CsvFile>,
    csvFilePath: string,
): number[] {
    if (!where) {
        return getAllIndexes(csvContents);
    } else if (
        where.type === 'expression' &&
        where.variant === 'operation' &&
        where.format === 'binary'
    ) {
        if (where.operation === 'or') {
            return removeDuplicates([
                ...innerFindWhereMatches(where.left, csvContents, csvFilePath),
                ...innerFindWhereMatches(where.right, csvContents, csvFilePath),
            ]);
        } else if (where.operation === 'and') {
            return extractDuplicates([
                ...innerFindWhereMatches(where.left, csvContents, csvFilePath),
                ...innerFindWhereMatches(where.right, csvContents, csvFilePath),
            ]).duplicates;
        } else if (where.operation === '=') {
            const headers = csvContents[0];
            if (!headers) {
                throw new CsvFileMissingHeadersError(csvFilePath);
            }

            /** Handle no-op WHERE clauses like `1=1` that always evaluate to true. */
            if (where.left.type === 'literal' && where.right.type === 'literal') {
                if (where.left.value === where.right.value) {
                    /** Always true - return all rows (excluding headers). */
                    return getAllIndexes(csvContents);
                } else {
                    /** Always false - return no rows. */
                    return [];
                }
            }

            if (where.left.type !== 'identifier' || where.left.variant !== 'column') {
                throw new Error(`Expected column identifier on left side of '=' operation`);
            }
            if (where.right.type !== 'literal') {
                throw new Error(`Expected literal value on right side of '=' operation`);
            }

            const columnIndex = headers.indexOf(where.left.name);
            if (columnIndex < 0) {
                throw new CsvColumnDoesNotExistError(
                    removeSuffix({value: csvFilePath, suffix: csvExtension}),
                    where.left.name,
                );
            }

            const rightValue = where.right.value;
            return filterMap(
                csvContents,
                (row, index) => index,
                (index, row) => {
                    /** Don't select from the header row. */
                    const isHeaderRow: boolean = !index;

                    return !isHeaderRow && String(row[columnIndex]) === rightValue;
                },
            );
        } else {
            throw new Error(`Unsupported WHERE operation: '${where.operation}'`);
        }
    } else {
        throw new Error(`Unsupported WHERE expression type: '${where.type}'`);
    }
}
