import {addPrefix, type MaybeArray} from '@augment-vir/common';
import {type SqliteAstNode} from 'sqlite-ast';

/**
 * Recursively converts an AST node back to its SQL text representation.
 *
 * @category Internal
 */
export function readAstText(node: SqliteAstNode | null | undefined): string {
    if (!node) {
        return '';
    }

    switch (node.type) {
        case 'literal':
            return readLiteralText(node);
        case 'identifier':
            return readIdentifierText(node);
        case 'expression':
            return readExpressionText(node);
        case 'function':
            return readFunctionText(node);
        case 'statement':
            return readStatementText(node);
        case 'constraint':
            return readConstraintText(node);
        case 'definition':
            return readDefinitionText(node);
        case 'condition':
            return readConditionText(node);
        case 'join':
            return readJoinText(node);
        case 'map':
            return readMapText(node);
        case 'assignment':
            return readAssignmentText(node);
        case 'compound':
            return readCompoundText(node);
        case 'datatype':
            return readDatatypeText(node);
        case 'variable':
            return readVariableText(node);
        case 'values':
            return 'DEFAULT VALUES';
        case 'error':
            return readErrorText(node);
        case 'event':
            return readEventText(node);
        case 'module':
            return readModuleText(node);
        default:
            // Fallback for any unhandled type
            return '';
    }
}

function readLiteralText(node: SqliteAstNode & {type: 'literal'}): string {
    if (node.variant === 'text') {
        return `'${node.value}'`;
    } else if (node.variant === 'null') {
        return 'NULL';
    } else if (node.variant === 'blob') {
        return node.value;
    }
    return node.value;
}

function readIdentifierText(node: SqliteAstNode & {type: 'identifier'}): string {
    let text = node.name;

    if (node.columns) {
        text += `(${readNodeArray(node.columns)})`;
    }

    if (node.alias) {
        text += ` AS ${node.alias}`;
    }

    return text;
}

function readExpressionText(node: SqliteAstNode & {type: 'expression'}): string {
    if ('format' in node) {
        if (node.format === 'binary') {
            const left = readAstText(node.left);
            const right = readAstText(node.right);
            let text = `${left} ${node.operation.toUpperCase()} ${right}`;
            if (node.escape) {
                text += ` ESCAPE ${readAstText(node.escape)}`;
            }
            return withAlias(text, node);
        } else if (node.format === 'unary') {
            if (node.variant === 'operation') {
                if ('collate' in node) {
                    const expr = readAstText(node.expression);
                    const collation = node.collate.map((c) => c.name).join(' ');
                    return `${expr} COLLATE ${collation}`;
                }
                const expr = readAstText(node.expression);
                const op = node.operator.toUpperCase();
                // Prefix operators like NOT, -, +, ~
                if (op === '-' || op === '+' || op === '~') {
                    return withAlias(`${op}${expr}`, node as {alias?: string});
                }
                if (op === 'NOT') {
                    return withAlias(`${op} ${expr}`, node as {alias?: string});
                }
                return withAlias(`${expr} ${op}`, node as {alias?: string});
            } else if (node.variant === 'cast') {
                const expr = readAstText(node.expression);
                const datatype = readDatatypeText(node.as);
                return withAlias(`CAST(${expr} AS ${datatype})`, node);
            }
            // exists variant
            const expr = readAstText(node.expression);
            return `${node.operator.toUpperCase()} ${expr}`;
        }
        // table format
        const target = readAstText(node.target);
        const expr = readAstText(node.expression);
        const variant = node.variant === 'recursive' ? 'RECURSIVE' : '';
        return `${target} AS ${variant}(${expr})`.trim();
    }

    switch (node.variant) {
        case 'list':
            return readExpressionList(node.expression);
        case 'order': {
            const expr = readAstText(node.expression);
            const dir = node.direction ? ` ${node.direction.toUpperCase()}` : '';
            return `${expr}${dir}`;
        }
        case 'limit': {
            const start = readAstText(node.start);
            const offset = node.offset ? ` OFFSET ${readAstText(node.offset)}` : '';
            return `${start}${offset}`;
        }
        case 'exists':
            return node.operator.toUpperCase();
        case 'case':
            return withAlias(readCaseText(node.expression), node);
        default:
            return '';
    }
}

function readExpressionList(expression: MaybeArray<SqliteAstNode> | null | undefined): string {
    if (expression == null) {
        return '';
    }
    if (Array.isArray(expression)) {
        return expression.map(readAstText).join(', ');
    }
    return readAstText(expression);
}

function readCaseText(conditions: ReadonlyArray<SqliteAstNode>): string {
    const parts = conditions.map((cond) => {
        if (cond.type === 'condition') {
            if (cond.variant === 'when') {
                return `WHEN ${readAstText(cond.condition)} THEN ${readAstText(cond.consequent)}`;
            } else if (cond.variant === 'else') {
                return `ELSE ${readAstText(cond.consequent)}`;
            }
        }
        return '';
    });
    return `CASE ${parts.join(' ')} END`;
}

function readFunctionText(node: SqliteAstNode & {type: 'function'}): string {
    const name = node.name.name.toUpperCase();
    let args: string;

    if (node.args.type === 'identifier') {
        args = '*';
    } else {
        args = readExpressionList(node.args.expression);
    }

    const text = `${name}(${args})`;
    return withAlias(text, node);
}

function readStatementText(node: SqliteAstNode & {type: 'statement'}): string {
    switch (node.variant) {
        case 'select':
            return readSelectText(node);
        case 'insert':
            return readInsertText(node);
        case 'update':
            return readUpdateText(node);
        case 'delete':
            return readDeleteText(node);
        case 'create':
            return readCreateText(node);
        case 'drop':
            return readDropText(node);
        case 'compound':
            return readCompoundStatementText(node);
        case 'transaction':
            return readTransactionText(node);
        case 'alter table':
            return readAlterTableText(node);
        case 'pragma':
            return readPragmaText(node);
        case 'attach':
            return readAttachText(node);
        case 'detach':
            return readDetachText(node);
        case 'vacuum':
            return readVacuumText(node);
        case 'reindex':
            return readReindexText(node);
        case 'analyze':
            return readAnalyzeText(node);
        case 'release':
        case 'savepoint':
            return readSavepointText(node);
        default:
            return '';
    }
}

function readSelectText(node: SqliteAstNode & {type: 'statement'; variant: 'select'}): string {
    const parts: string[] = [];

    if (node.with) {
        parts.push(`WITH ${readNodeArray(node.with)}`);
    }

    parts.push('SELECT');

    if (node.distinct) {
        parts.push('DISTINCT');
    }

    parts.push(readNodeArray(node.result));

    if (node.from) {
        parts.push(`FROM ${readAstText(node.from)}`);
    }

    if (node.where) {
        parts.push(`WHERE ${readNodeArray(node.where, ' AND ')}`);
    }

    if (node.group) {
        parts.push(`GROUP BY ${readExpressionList(node.group.expression)}`);
    }

    if (node.having) {
        parts.push(`HAVING ${readAstText(node.having)}`);
    }

    if (node.order) {
        parts.push(`ORDER BY ${readNodeArray(node.order)}`);
    }

    if (node.limit) {
        parts.push(`LIMIT ${readAstText(node.limit)}`);
    }

    return withAlias(parts.join(' '), node);
}

function readInsertText(node: SqliteAstNode & {type: 'statement'; variant: 'insert'}): string {
    const parts: string[] = [];

    if (node.or) {
        parts.push(`INSERT OR ${node.or.toUpperCase()}`);
    } else {
        parts.push('INSERT');
    }

    parts.push(`INTO ${readAstText(node.into)}`);

    if (Array.isArray(node.result)) {
        const values = node.result
            .map((r) => {
                const expr = (r as {expression?: MaybeArray<SqliteAstNode>}).expression;
                return `(${readExpressionList(expr)})`;
            })
            .join(', ');
        parts.push(`VALUES ${values}`);
    } else if ('type' in node.result && node.result.type === 'values') {
        parts.push('DEFAULT VALUES');
    } else {
        parts.push(readAstText(node.result));
    }

    if (node.returning) {
        parts.push(`RETURNING ${readNodeArray(node.returning)}`);
    }

    return parts.join(' ');
}

function readUpdateText(node: SqliteAstNode & {type: 'statement'; variant: 'update'}): string {
    const parts: string[] = [];

    if (node.or) {
        parts.push(`UPDATE OR ${node.or.toUpperCase()}`);
    } else {
        parts.push('UPDATE');
    }

    parts.push(readAstText(node.into));

    const setClause = node.set.map((s) => readAssignmentText(s)).join(', ');
    parts.push(`SET ${setClause}`);

    if (node.where) {
        parts.push(`WHERE ${readNodeArray(node.where, ' AND ')}`);
    }

    if (node.limit) {
        parts.push(`LIMIT ${readAstText(node.limit)}`);
    }

    if (node.returning) {
        parts.push(`RETURNING ${readNodeArray(node.returning)}`);
    }

    return parts.join(' ');
}

function readDeleteText(node: SqliteAstNode & {type: 'statement'; variant: 'delete'}): string {
    const parts: string[] = [
        'DELETE FROM',
        readAstText(node.from),
    ];

    if (node.where) {
        parts.push(`WHERE ${readNodeArray(node.where, ' AND ')}`);
    }

    if (node.limit) {
        parts.push(`LIMIT ${readAstText(node.limit)}`);
    }

    if (node.returning) {
        parts.push(`RETURNING ${readNodeArray(node.returning)}`);
    }

    return parts.join(' ');
}

function readCreateText(node: SqliteAstNode & {type: 'statement'; variant: 'create'}): string {
    const parts: string[] = ['CREATE'];

    if (node.temporary) {
        parts.push('TEMPORARY');
    }

    if (node.unique) {
        parts.push('UNIQUE');
    }

    parts.push(node.format.toUpperCase());

    if (node.condition) {
        parts.push('IF NOT EXISTS');
    }

    if (node.name) {
        parts.push(readAstText(node.name));
    }

    if (node.format === 'table' && node.definition) {
        parts.push(`(${readNodeArray(node.definition)})`);
    }

    if (node.format === 'index' && node.on) {
        parts.push(`ON ${readAstText(node.on)}`);
    }

    if (node.format === 'view' && node.result) {
        parts.push(`AS ${readAstText(node.result)}`);
    }

    if (node.format === 'trigger') {
        if (node.event) {
            parts.push(readEventText(node.event as SqliteAstNode & {type: 'event'}));
        }
        if (node.on) {
            parts.push(`ON ${readAstText(node.on)}`);
        }
        if (node.by) {
            parts.push(`FOR EACH ${node.by.toUpperCase()}`);
        }
        if (node.when) {
            parts.push(`WHEN ${readAstText(node.when)}`);
        }
        if (node.action) {
            parts.push(`BEGIN ${readNodeArray(node.action, '; ')}; END`);
        }
    }

    return parts.join(' ');
}

function readDropText(node: SqliteAstNode & {type: 'statement'; variant: 'drop'}): string {
    const parts: string[] = [
        'DROP',
        node.format.toUpperCase(),
    ];

    if (node.condition.length > 0) {
        parts.push('IF EXISTS');
    }

    parts.push(readAstText(node.target));

    return parts.join(' ');
}

function readCompoundStatementText(
    node: SqliteAstNode & {type: 'statement'; variant: 'compound'},
): string {
    const first = readAstText(node.statement);
    const rest = node.compound.map((c) => `${c.variant.toUpperCase()} ${readAstText(c.statement)}`);
    return [
        first,
        ...rest,
    ].join(' ');
}

function readTransactionText(
    node: SqliteAstNode & {type: 'statement'; variant: 'transaction'},
): string {
    const parts: string[] = [node.action.toUpperCase()];

    if (node.defer) {
        parts.push(node.defer.toUpperCase());
    }

    parts.push('TRANSACTION');

    if (node.savepoint) {
        parts.push(node.savepoint.name);
    }

    return parts.join(' ');
}

function readAlterTableText(
    node: SqliteAstNode & {type: 'statement'; variant: 'alter table'},
): string {
    const parts: string[] = [
        'ALTER TABLE',
        readAstText(node.target),
    ];

    if (node.action === 'rename') {
        if (node.column && node.newName) {
            parts.push(`RENAME COLUMN ${node.column} TO ${node.newName}`);
        } else if (node.newName) {
            parts.push(`RENAME TO ${node.newName}`);
        }
    } else if (node.action === 'add') {
        if (node.definition) {
            parts.push(`ADD COLUMN ${readAstText(node.definition)}`);
        } else if (node.name) {
            parts.push(`ADD COLUMN ${readAstText(node.name)}`);
        }
    } else if (node.action === 'drop' && node.column) {
        parts.push(`DROP COLUMN ${node.column}`);
    }

    return parts.join(' ');
}

function readPragmaText(node: SqliteAstNode & {type: 'statement'; variant: 'pragma'}): string {
    const name = node.target.name;
    if (node.args.expression) {
        return `PRAGMA ${name} = ${readAstText(node.args.expression)}`;
    }
    return `PRAGMA ${name}`;
}

function readAttachText(node: SqliteAstNode & {type: 'statement'; variant: 'attach'}): string {
    return `ATTACH ${readAstText(node.target)} AS ${readAstText(node.attach)}`;
}

function readDetachText(node: SqliteAstNode & {type: 'statement'; variant: 'detach'}): string {
    return `DETACH ${node.target.name}`;
}

function readVacuumText(node: SqliteAstNode & {type: 'statement'; variant: 'vacuum'}): string {
    if (node.target) {
        return `VACUUM ${node.target.name}`;
    }
    return 'VACUUM';
}

function readReindexText(node: SqliteAstNode & {type: 'statement'; variant: 'reindex'}): string {
    if (node.target) {
        return `REINDEX ${node.target}`;
    }
    return 'REINDEX';
}

function readAnalyzeText(node: SqliteAstNode & {type: 'statement'; variant: 'analyze'}): string {
    if (node.target) {
        return `ANALYZE ${node.target}`;
    }
    return 'ANALYZE';
}

function readSavepointText(
    node: SqliteAstNode & {type: 'statement'; variant: 'release' | 'savepoint'},
): string {
    const action = node.variant === 'release' ? 'RELEASE' : 'SAVEPOINT';
    return `${action} ${node.target.savepoint.name}`;
}

function readConstraintText(node: SqliteAstNode & {type: 'constraint'}): string {
    const parts: string[] = [];

    switch (node.variant) {
        case 'primary key':
            if (node.name) {
                parts.push(`CONSTRAINT ${node.name}`);
            }
            parts.push('PRIMARY KEY');
            if (node.direction) {
                parts.push(node.direction.toUpperCase());
            }
            if (node.conflict) {
                parts.push(`ON CONFLICT ${node.conflict.toUpperCase()}`);
            }
            if (node.autoIncrement) {
                parts.push('AUTOINCREMENT');
            }
            break;
        case 'not null':
            if (node.name) {
                parts.push(`CONSTRAINT ${node.name}`);
            }
            parts.push('NOT NULL');
            if (node.conflict) {
                parts.push(`ON CONFLICT ${node.conflict.toUpperCase()}`);
            }
            break;
        case 'null':
            if (node.name) {
                parts.push(`CONSTRAINT ${node.name}`);
            }
            parts.push('NULL');
            break;
        case 'unique':
            if (node.name) {
                parts.push(`CONSTRAINT ${node.name}`);
            }
            parts.push('UNIQUE');
            if (node.conflict) {
                parts.push(`ON CONFLICT ${node.conflict.toUpperCase()}`);
            }
            break;
        case 'check':
            if (node.name) {
                parts.push(`CONSTRAINT ${node.name}`);
            }
            parts.push(`CHECK (${readAstText(node.expression)})`);
            break;
        case 'default':
            if (node.name) {
                parts.push(`CONSTRAINT ${node.name}`);
            }
            parts.push(`DEFAULT ${readAstText(node.value)}`);
            break;
        case 'foreign key':
            if (node.name) {
                parts.push(`CONSTRAINT ${node.name}`);
            }
            parts.push(`REFERENCES ${readAstText(node.references)}`);
            if (node.action) {
                for (const act of node.action) {
                    parts.push(`ON ${act.variant.toUpperCase()} ${act.action.toUpperCase()}`);
                }
            }
            if (node.defer) {
                parts.push(node.defer.toUpperCase());
            }
            break;
        case 'collate':
            if (node.name) {
                parts.push(`CONSTRAINT ${node.name}`);
            }
            parts.push(`COLLATE ${node.collate.collate.map((c) => c.name).join(' ')}`);
            break;
        case 'join':
            parts.push(node.format.toUpperCase());
            if (node.on) {
                parts.push(`ON ${readAstText(node.on)}`);
            }
            if (node.using) {
                const cols = node.using.columns.map((c) => c.name).join(', ');
                parts.push(`USING (${cols})`);
            }
            break;
    }

    return parts.join(' ');
}

function readDefinitionText(node: SqliteAstNode & {type: 'definition'}): string {
    if (node.variant === 'column') {
        const parts: string[] = [node.name];

        parts.push(readDatatypeText(node.datatype));

        if (node.definition.length > 0) {
            parts.push(readNodeArray(node.definition, ' '));
        }

        return parts.join(' ');
    }

    // constraint variant
    const parts: string[] = [];

    if (node.name) {
        parts.push(`CONSTRAINT ${node.name}`);
    }

    if (node.columns) {
        parts.push(`(${readNodeArray(node.columns)})`);
    }

    if (node.definition.length > 0) {
        parts.push(readNodeArray(node.definition, ' '));
    }

    return parts.join(' ');
}

function readConditionText(node: SqliteAstNode & {type: 'condition'}): string {
    switch (node.variant) {
        case 'when':
            return `WHEN ${readAstText(node.condition)} THEN ${readAstText(node.consequent)}`;
        case 'else':
            return `ELSE ${readAstText(node.consequent)}`;
        case 'if':
            return `IF ${readAstText(node.condition as SqliteAstNode)}`;
        default:
            return '';
    }
}

function readJoinText(node: SqliteAstNode & {type: 'join'}): string {
    const parts: string[] = [];

    parts.push(node.variant.toUpperCase());
    parts.push(readAstText(node.source));

    if (node.constraint) {
        parts.push(readAstText(node.constraint));
    }

    return parts.join(' ');
}

function readMapText(node: SqliteAstNode & {type: 'map'}): string {
    const source = readAstText(node.source);
    const joins = node.map.map(readAstText).join(' ');
    return `${source} ${joins}`;
}

function readAssignmentText(node: SqliteAstNode & {type: 'assignment'}): string {
    return `${node.target.name} = ${readAstText(node.value)}`;
}

function readCompoundText(node: SqliteAstNode & {type: 'compound'}): string {
    return `${node.variant.toUpperCase()} ${readAstText(node.statement)}`;
}

function readDatatypeText(node: SqliteAstNode & {type: 'datatype'}): string {
    let text = node.variant.toUpperCase();

    if (node.args) {
        text += `(${readExpressionList(node.args.expression)})`;
    }

    return text;
}

function readVariableText(node: SqliteAstNode & {type: 'variable'}): string {
    let text: string;

    switch (node.format) {
        case 'named':
            text = `:${node.name}`;
            break;
        case 'numbered':
            text = addPrefix({value: node.name, prefix: '?'});
            break;
        case 'tcl':
            text = `$${node.name}`;
            break;
        default:
            text = `?`;
    }

    if (node.suffix) {
        text += node.suffix;
    }

    return text;
}

function readErrorText(node: SqliteAstNode & {type: 'error'}): string {
    const parts: string[] = ['RAISE'];
    if (node.action) {
        parts.push(`(${node.action.toUpperCase()}`);
        if (node.message) {
            parts.push(`, ${readAstText(node.message)}`);
        }
        parts.push(')');
    }
    return parts.join('');
}

function readEventText(node: SqliteAstNode & {type: 'event'}): string {
    const parts: string[] = [];

    if (node.occurs) {
        parts.push(node.occurs.toUpperCase());
    }

    parts.push(node.event.toUpperCase());

    if (node.of) {
        parts.push(`OF ${readNodeArray(node.of)}`);
    }

    return parts.join(' ');
}

function readModuleText(node: SqliteAstNode & {type: 'module'}): string {
    const args = readExpressionList(node.args.expression);
    return `USING ${node.name}(${args})`;
}

function readNodeArray(
    nodes: ReadonlyArray<SqliteAstNode> | undefined,
    separator: string = ', ',
): string {
    if (!nodes) {
        return '';
    }
    return nodes.map(readAstText).join(separator);
}

function withAlias(text: string, node: {alias?: string}): string {
    if (node.alias) {
        return `${text} AS ${node.alias}`;
    }
    return text;
}
