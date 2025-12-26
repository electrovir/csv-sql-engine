import {CsvSqlEngineError} from './csv-sql-engine.error.js';

/**
 * Generic CSV related error thrown by the csv-sql-engine package. All CSV related errors from this
 * package extend this error class.
 *
 * @category Error
 */
export class CsvError extends CsvSqlEngineError {
    public override readonly name: string = 'CsvError';
}

/**
 * Indicates that an table CSV file already exists when it shouldn't.
 *
 * @category Error
 */
export class CsvTableExistsError extends CsvError {
    public override readonly name: string = 'CsvTableExistsError';

    constructor(tableName: string) {
        super(`CSV table (file) '${tableName}' already exists.`);
    }
}

/**
 * Indicates that an expected table CSV file does not actually exist.
 *
 * @category Error
 */
export class CsvTableDoesNotExistError extends CsvError {
    public override readonly name: string = 'CsvTableExistsError';

    constructor(tableName: string) {
        super(`CSV table (file) '${tableName}' does not exist.`);
    }
}

/**
 * Indicates that parsing of an existing CSV file failed.
 *
 * @category Error
 */
export class CsvParseError extends CsvError {
    public override readonly name: string = 'CsvParseError';
}

/**
 * Indicates that a CSV file is missing headers.
 *
 * @category Error
 */
export class CsvFileMissingHeadersError extends CsvParseError {
    public override readonly name: string = 'CsvFileMissingHeadersError';
    constructor(public readonly csvFilePath: string) {
        super(`Missing headers in CSV file '${csvFilePath}'`);
    }
}

/**
 * Indicates that an expected column in a CSV file does not actually exist.
 *
 * @category Error
 */
export class CsvColumnDoesNotExistError extends CsvError {
    public override readonly name: string = 'CsvColumnDoesNotExistError';
    constructor(
        public readonly sanitizedTableName: string,
        public readonly missingColumName: string,
    ) {
        super(`Column '${missingColumName}' does not exist in table '${sanitizedTableName}'.`);
    }
}
