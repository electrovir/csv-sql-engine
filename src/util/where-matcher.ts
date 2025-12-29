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
 * Finds all row indexes that match the given SQL where conditions.
 *
 * @category Internal
 * @returns An array of row indexes that match the given where condition.
 */
export function findWhereMatches(
    expressions: Readonly<MaybeArray<Readonly<SqliteAstNode>>> | undefined,
    csvContents: Readonly<CsvFile>,
    csvFilePath: string,
): number[] {
    /**
     * These must be sorted from greatest to least so that deleting rows does not mess up the
     * indexes.
     */
    const allIndexes = removeDuplicates(
        (expressions ? ensureArray(expressions) : [undefined]).flatMap((expression) =>
            innerFindWhereMatches(expression, csvContents, csvFilePath),
        ),
    ).sort((a, b) => b - a);

    return allIndexes;
}

function innerFindWhereMatches(
    where: Readonly<SqliteAstNode> | undefined,
    csvContents: Readonly<CsvFile>,
    csvFilePath: string,
): number[] {
    if (!where) {
        return csvContents.map((value, index) => index);
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
