/**
 * Generic error thrown by the csv-sql-engine package. All known errors from this package extend
 * this error class.
 *
 * @category Error
 */
export class CsvSqlEngineError extends Error {
    public override readonly name: string = 'CsvSqlEngineError';
}
