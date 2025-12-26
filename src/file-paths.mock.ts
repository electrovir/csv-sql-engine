import {type UniversalTestContext, extractTestNameAsDir} from '@augment-vir/test';
import {join, resolve} from 'node:path';

export const repoDirPath = resolve(import.meta.dirname, '..');
export const notCommittedDirPath = join(repoDirPath, '.not-committed');
export const testFilesDirPath = join(notCommittedDirPath, 'test-files');

export function createTestDirPath(testContext: Readonly<UniversalTestContext>) {
    return join(testFilesDirPath, extractTestNameAsDir(testContext));
}
