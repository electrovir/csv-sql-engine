import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {csv} from './csv-text.js';

describe(csv.name, () => {
    it('trims lines', () => {
        // cspell:word kenobi
        assert.strictEquals(
            csv`
                "a","b","c","d"
                "1","2","3","4"
                "some","other","time","maybe"
                "hello","there",","
                "general",",","kenobi"
            `,
            '"a","b","c","d"\n"1","2","3","4"\n"some","other","time","maybe"\n"hello","there",","\n"general",",","kenobi"',
        );
    });
});
