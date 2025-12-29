import {type ConsumableValue} from 'sqlite-ast';

export function readConsumableValue(
    value: string,
    unconsumedInterpolationValues: ConsumableValue[] | undefined,
): string {
    if (value === '?') {
        if (unconsumedInterpolationValues) {
            if (unconsumedInterpolationValues.length) {
                return unconsumedInterpolationValues.shift() || '';
            } else {
                throw new Error(
                    'Encountered ? but all interpolation values have already been used.',
                );
            }
        } else {
            throw new Error('Encountered ? but received no interpolation values.');
        }
    } else {
        return value;
    }
}
