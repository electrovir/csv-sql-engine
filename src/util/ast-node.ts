import {type SqliteAstNode} from 'sqlite-ast';

/** @throws If the request type is not there. */
export function getAstType<
    const Ast extends SqliteAstNode | undefined,
    const TypeName extends NonNullable<Ast>['type'],
>(node: Ast, typeName: TypeName): Extract<Ast, {type: TypeName}> | undefined {
    if (!node) {
        return undefined;
    } else if (node.type === typeName) {
        return node as Extract<Ast, {type: TypeName}>;
    } else {
        return undefined;
    }
}

export function getAstVariant<
    const Ast extends Extract<SqliteAstNode, {variant: string}> | undefined,
    const VariantName extends NonNullable<Ast>['variant'],
>(node: Ast, variant: VariantName): Extract<Ast, {variant: VariantName}> | undefined {
    if (!node) {
        return undefined;
    } else if (node.variant === variant) {
        return node as Extract<Ast, {variant: VariantName}>;
    } else {
        return undefined;
    }
}
