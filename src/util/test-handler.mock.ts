import {check, type ErrorMatchOptions} from '@augment-vir/assert';
import {addSuffix, log, mapObject, mapObjectValues} from '@augment-vir/common';
import {readAllDirContents, writeDirContents} from '@augment-vir/node';
import {
    itCasesWithContext,
    type FunctionWithContextTestCase,
    type UniversalTestContext,
} from '@augment-vir/test';
import {mkdir, rm} from 'node:fs/promises';
import {type Sql} from 'sqlite-ast';
import {type RequireExactlyOne} from 'type-fest';
import {csvExtension} from '../csv/csv-file.js';
import {type AstHandlerResult} from '../engine/define-ast-handler.js';
import {executeSql} from '../engine/engine.js';
import {createTestDirPath} from '../file-paths.mock.js';

export type AstHandlerTestCase = {
    it: string;
    /**
     * Initial CSV files. Keys are table/file names (no need to include the `'.csv'` suffix), values
     * are the file contents.
     */
    init?:
        | RequireExactlyOne<{
              files: Record<string, string[]>;
              sql: Readonly<Sql>;
          }>
        | undefined;
    only?: true;
    sql: Readonly<Sql>;
} & RequireExactlyOne<{
    expect: {
        output: AstHandlerResult[];
        files: {
            before: SplitFileContents;
            after: SplitFileContents;
        };
    };
    throws: ErrorMatchOptions | undefined;
}>;

export function handlerCases(testCases: ReadonlyArray<Readonly<AstHandlerTestCase>>) {
    async function runTest(
        testContext: Readonly<UniversalTestContext>,
        testConfig: Readonly<Omit<AstHandlerTestCase, 'it' | 'expect'>>,
    ): Promise<AstHandlerTestCase['expect']> {
        try {
            const testDirPath = createTestDirPath(testContext);
            await rm(testDirPath, {
                force: true,
                recursive: true,
            });

            if (testConfig.init?.files) {
                await writeDirContents(
                    testDirPath,
                    mapObject(testConfig.init.files, (key, value) => {
                        return {
                            key: addSuffix({value: key, suffix: csvExtension}),
                            value: value.join('\n'),
                        };
                    }),
                );
            } else if (testConfig.init?.sql) {
                await executeSql(testConfig.init.sql, {
                    csvDirPath: testDirPath,
                });
            }

            await mkdir(testDirPath, {recursive: true});

            const dirContentsBefore = splitFileContents(
                await readAllDirContents(testDirPath, {
                    recursive: true,
                }),
            );

            const output = await executeSql(testConfig.sql, {
                csvDirPath: testDirPath,
                rejectUnsupportedOperations: true,
            });

            const dirContentsAfter = splitFileContents(
                await readAllDirContents(testDirPath, {
                    recursive: true,
                }),
            );

            return {
                output,
                files: {
                    before: dirContentsBefore,
                    after: dirContentsAfter,
                },
            };
        } catch (error) {
            log.error(error);
            throw error;
        }
    }

    itCasesWithContext(
        runTest,
        testCases.map((testCase): FunctionWithContextTestCase<NoInfer<typeof runTest>> => {
            return {
                it: testCase.it,
                only: !!testCase.only,
                input: {
                    sql: testCase.sql,
                    init: testCase.init,
                },
                ...(testCase.expect
                    ? {
                          expect: testCase.expect,
                      }
                    : {
                          throws: testCase.throws,
                      }),
            };
        }),
    );
}

type SplitFileContents = {
    [Path in string]: string[] | SplitFileContents;
};

function splitFileContents(
    contents: Readonly<Awaited<ReturnType<typeof readAllDirContents>>>,
): SplitFileContents {
    return mapObjectValues(contents, (key, value) => {
        if (check.isString(value)) {
            return value.split('\n').filter(check.isTruthy);
        } else {
            return splitFileContents(value);
        }
    });
}
