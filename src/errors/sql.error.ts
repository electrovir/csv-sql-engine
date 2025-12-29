import {addSuffix, extractErrorMessage, indent, trimLines} from '@augment-vir/common';
import {type Sql, type SqliteAst} from 'sqlite-ast';
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
        public readonly ast: SqliteAst,
    ) {
        super(
            [
                'Unsupported SQL:',
                exactFailure ? ' ' : '',
                exactFailure ? addSuffix({value: exactFailure, suffix: '.'}) : '',
                '\n',
                indent(trimLines(sql.sql)),
                '\n',
                indent(JSON.stringify(ast, null, 4)),
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

export class SqlAstError extends SqlError {
    public override readonly name: string = 'SqlAstError';

    constructor(
        public readonly ast: SqliteAst,
        public readonly failure: string,
    ) {
        super(`SQLite AST parsing failed: ${failure}:\n${indent(JSON.stringify(ast, null, 4))}`);
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
