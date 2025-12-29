import {type MaybePromise} from '@augment-vir/common';
import {type SortValuesOutput} from '../util/sort-values.js';
import {type AstHandlerParams} from './params.js';

/**
 * Output from a handler that handled a SQL query.
 *
 * @category Internal
 */
export type AstHandlerResult = SortValuesOutput & {
    numberOfRowsAffected: number;
};

/**
 * An AST / SQL handler.
 *
 * @category Internal
 */
export type AstHandler = {
    name: string;
    /**
     * Return `undefined` to mark this AST as not-handled. That means that other handlers should be
     * used instead.
     */
    handler: (params: Readonly<AstHandlerParams>) => MaybePromise<AstHandlerResult | undefined>;
};

/**
 * Used to define new handlers.
 *
 * @category Internal
 */
export function defineAstHandler(params: AstHandler): AstHandler {
    return params;
}
