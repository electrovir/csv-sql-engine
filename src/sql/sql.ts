import {type Branded} from '@augment-vir/common';
import {Sql as OriginalSql} from 'sql-template-tag';

/**
 * Used to mark consumable values so we don't accidentally assign the wrong array for mutation.
 *
 * @category Internal
 */
export type ConsumableValue = Branded<string, 'consumable-values'>;

/**
 * A SQL command's strings and values.
 *
 * @category Internal
 */
export class Sql extends OriginalSql {
    public declare values: string[];
    /** This will be mutated by whatever is reading this SQL. */
    public unconsumedValues: ConsumableValue[];

    constructor(rawStrings: readonly string[], rawValues: readonly (Sql | string)[]) {
        super(rawStrings, rawValues);
        this.unconsumedValues = [...this.values] as ConsumableValue[];
    }
}

/**
 * Parses a SQL string with interpolations extracted into values so that they can be properly
 * sanitized.
 *
 * @category SQL
 */
export function sql(strings: ReadonlyArray<string>, ...values: Array<string | number | Sql>): Sql {
    return new Sql(
        strings,
        values.map((value) => {
            if (value instanceof Sql) {
                return value;
            } else {
                return String(value);
            }
        }),
    );
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
