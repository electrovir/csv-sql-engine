import {type SqliteAstNode} from 'sqlite-ast';

export function getAst<
    const Ast extends (SqliteAstNode & Record<PropertyToCheck, any>) | undefined,
    const PropertyToCheck extends string,
    const ValueToCheck,
>({
    ast,
    property,
    value,
}: {
    ast: Ast;
    property: PropertyToCheck;
    value: ValueToCheck;
}): Extract<Ast, Record<PropertyToCheck, ValueToCheck>> | undefined {
    if (!ast) {
        return undefined;
    } else if (ast[property] === value) {
        return ast as Extract<Ast, Record<PropertyToCheck, ValueToCheck>>;
    } else {
        return undefined;
    }
}
