import {addSuffix} from '@augment-vir/common';
import {type UniversalTestContext} from '@augment-vir/test';
import {existsSync} from 'node:fs';
import {mkdir, rm, stat, writeFile} from 'node:fs/promises';
import {dirname, join} from 'node:path';
import {csvExtension} from './csv/csv-file.js';
import {createTestDirPath} from './file-paths.mock.js';

export async function createFreshCsvFile(
    testContext: Readonly<UniversalTestContext>,
    fileName: string,
) {
    const csvDirPath = createTestDirPath(testContext);
    const csvFilePath = join(csvDirPath, addSuffix({value: fileName, suffix: csvExtension}));
    if (existsSync(csvDirPath) && (await stat(csvDirPath)).isFile()) {
        await rm(csvDirPath, {
            force: true,
        });
    } else if (existsSync(csvFilePath) && (await stat(csvFilePath)).isDirectory()) {
        await rm(csvDirPath, {
            force: true,
            recursive: true,
        });
    }
    await rm(csvFilePath, {
        force: true,
    });
    await mkdir(dirname(csvFilePath), {
        recursive: true,
    });
    await writeFile(csvFilePath, '');

    return csvFilePath;
}
