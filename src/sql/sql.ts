import {type MaybeArray} from '@augment-vir/common';
import {Sql as OriginalSql} from 'sql-template-tag';

/**
 * A SQL command's strings and values.
 *
 * @category Internal
 */
export class Sql extends OriginalSql {
    public declare values: string[];
}

/**
 * Parses a SQL string with interpolations extracted into values so that they can be properly
 * sanitized.
 *
 * @category SQL
 */
export function sql(
    strings: ReadonlyArray<string>,
    ...values: Array<MaybeArray<string> | Sql>
): Sql {
    return new Sql(strings, values);
}

/**
 * Creates a raw, _unsafe_, {@link Sql} command. Prefer {@link sql} whenever possible.
 *
 * @deprecated This is unsafe: refer {@link sql} whenever possible.
 * @category Internal
 */
export function rawSql(value: string): Sql {
    return sql([value]);
}
