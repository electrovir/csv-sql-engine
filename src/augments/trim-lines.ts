import {check} from '@augment-vir/assert';
import {filterMap} from '@augment-vir/common';

/**
 * Trims every line in the given string.
 *
 * @category Internal
 */
export function trimLines(value: string): string {
    return filterMap(value.trim().split('\n'), (line) => line.trim(), check.isTruthy)
        .join('\n')
        .trim();
}
