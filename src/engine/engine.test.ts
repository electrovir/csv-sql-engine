import {assert} from '@augment-vir/assert';
import {extractDuplicates} from '@augment-vir/common';
import {describe, it} from 'node:test';
import {allAstHandlers} from './engine.js';

describe('allAstHandlers', () => {
    it('has no duplicate handler names', () => {
        const {duplicates} = extractDuplicates(allAstHandlers.map((handler) => handler.name));

        assert.isEmpty(duplicates, 'Duplicate handler names found.');
    });
});
