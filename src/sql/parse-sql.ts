import {
    combineErrorMessages,
    ensureArray,
    extractErrorMessage,
    indent,
    wrapInTry,
    type AnyObject,
} from '@augment-vir/common';
import NodeSqlParser from 'node-sql-parser';
import {assertValidShape, checkValidShape} from 'object-shape-tester';
import {type ParseSqlOptions} from '../engine/params.js';
import {SqlParseError} from '../errors/sql.error.js';
import {sqlAstShape, type SqlAst} from './ast.js';
import {type Sql} from './sql.js';

const defaultParser = new NodeSqlParser.Parser();

/**
 * Parse SQL into multiple SQL ASTs.
 *
 * @category SQL
 */
export function parseSql(sql: Sql, options: Readonly<ParseSqlOptions> = {}): SqlAst[] {
    try {
        return (
            ensureArray(
                // cspell:word astify
                (options.parser || defaultParser).astify(sql.sql, {
                    database: 'Sqlite',
                }),
            ) as AnyObject[]
        ).filter((ast): ast is SqlAst => {
            if (
                checkValidShape(ast, sqlAstShape, {
                    allowExtraKeys: true,
                })
            ) {
                return true;
            } else if (options.rejectUnsupportedOperations) {
                const failureReason = extractErrorMessage(
                    wrapInTry(() =>
                        assertValidShape(ast, sqlAstShape, {
                            allowExtraKeys: true,
                        }),
                    ),
                );

                throw new Error(
                    combineErrorMessages(
                        'AST failed',
                        failureReason,
                        '\n',
                        indent(JSON.stringify(ast, null, 4)),
                    ),
                );
            } else {
                return false;
            }
        });
    } catch (error) {
        throw new SqlParseError(sql, error);
    }
}
