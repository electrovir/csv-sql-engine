import {addSuffix, extractErrorMessage, indent, trimLines} from '@augment-vir/common';
import {type Sql} from '../sql/sql.js';
import {CsvSqlEngineError} from './csv-sql-engine.error.js';

/**
 * Generic SQL related error thrown by the csv-sql-engine package. All SQL related errors from this
 * package extend this error class.
 *
 * @category Error
 */
export class SqlError extends CsvSqlEngineError {
    public override readonly name: string = 'SqlError';
}

/**
 * A SQL command / query / operation was encountered that is not supported by the csv-sql-engine
 * package (yet).
 *
 * @category Error
 */
export class SqlUnsupportedOperationError extends SqlError {
    public override readonly name: string = 'SqlUnsupportedOperationError';

    constructor(
        public readonly sql: Sql,
        public readonly exactFailure: string | undefined,
    ) {
        super(
            [
                'Unsupported SQL:',
                exactFailure ? ' ' : '',
                exactFailure ? addSuffix({value: exactFailure, suffix: '.'}) : '',
                '\n',
                indent(trimLines(sql.sql)),
            ].join(''),
        );
    }
}

/**
 * Indicates that the original SQL command was not syntactically correct: it cannot be parsed.
 *
 * @category Error
 */
export class SqlParseError extends SqlError {
    public override readonly name: string = 'SqlParseError';

    constructor(
        public readonly sql: Sql,
        public readonly originalError: unknown,
    ) {
        super(
            `Failed to parse SQL: ${extractErrorMessage(originalError)}:\n${indent(trimLines(sql.sql))}`,
        );
    }
}

/**
 * Indicates that a SQL command is missing expected column definitions.
 *
 * @category Error
 */
export class SqlMissingColumnsError extends SqlError {
    public override readonly name: string = 'SqlMissingColumnsError';

    constructor(
        public readonly sql: Sql,
        public readonly sanitizedTableName: string,
    ) {
        super(
            `Cannot create CSV table (file) '${sanitizedTableName}': no column definitions provided:\n${indent(trimLines(sql.sql))}`,
        );
    }
}
