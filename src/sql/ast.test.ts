import {assert} from '@augment-vir/assert';
import {describe, it} from '@augment-vir/test';
import {type AST, type Create} from 'node-sql-parser';
import {type AstType, type CreateKeyword} from './ast.js';

(({}) as AST).type;

describe('CreateKeyword', () => {
    it('matches node-sql-parser create keyword', () => {
        assert.tsType<`${CreateKeyword}`>().equals<Create['keyword']>();
    });
});

describe('AstType', () => {
    it('matches node-sql-parser type', () => {
        assert.tsType<`${AstType}`>().equals<AST['type']>();
    });
});
