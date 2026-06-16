import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';

export async function getGitDiff(): Promise<string> {
    // Try VS Code Git extension first
    try {
        const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
        if (gitExtension) {
            const api = gitExtension.getAPI(1);
            if (api && api.repositories.length > 0) {
                const repository = api.repositories[0];
                
                // Get staged changes diff
                let diff = await repository.diff(true); 
                if (!diff || diff.trim() === '') {
                    // Fallback to unstaged changes diff
                    diff = await repository.diff(false);
                }
                
                if (diff && diff.trim() !== '') {
                    return diff;
                }
            }
        }
    } catch (error) {
        // Fallback to CLI
    }

    // CLI Fallback
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error('No workspace folder open');
    }

    const cwd = workspaceFolders[0].uri.fsPath;

    return new Promise((resolve, reject) => {
        exec('git rev-parse --verify HEAD', { cwd }, (errHead) => {
            const hasHead = !errHead;
            const stagedCmd = hasHead ? 'git diff --cached' : 'git diff --cached 4b825dc642cb6eb9a0ffbf5470d489002914008b';
            const unstagedCmd = hasHead ? 'git diff HEAD' : 'git diff';

            // Try staged first
            exec(stagedCmd, { cwd }, (err, stdout) => {
                if (err) {
                    // Fallback to unstaged changes on error
                    exec(unstagedCmd, { cwd }, (err2, stdout2) => {
                        if (err2) {
                            return reject(err2);
                        }
                        resolve(stdout2 || '');
                    });
                    return;
                }
                if (stdout && stdout.trim() !== '') {
                    return resolve(stdout);
                }
                // Try unstaged
                exec(unstagedCmd, { cwd }, (err2, stdout2) => {
                    if (err2) {
                        return reject(err2);
                    }
                    resolve(stdout2 || '');
                });
            });
        });
    });
}

export async function commitChanges(message: string): Promise<void> {
    try {
        const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
        if (gitExtension) {
            const api = gitExtension.getAPI(1);
            if (api && api.repositories.length > 0) {
                const repository = api.repositories[0];
                await repository.commit(message);
                return;
            }
        }
    } catch (error) {
        // Fallback to CLI
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error('No workspace folder open');
    }

    const cwd = workspaceFolders[0].uri.fsPath;

    return new Promise((resolve, reject) => {
        exec(`git commit -am "${message.replace(/"/g, '\\"')}"`, { cwd }, (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}

export async function getCommitHistory(count: number = 50): Promise<string> {
    try {
        const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
        if (gitExtension) {
            const api = gitExtension.getAPI(1);
            if (api && api.repositories.length > 0) {
                const repository = api.repositories[0];
                const commits = await repository.log({ maxEntries: count });
                return commits.map((c: any) => c.message).join('\n');
            }
        }
    } catch (error) {
        // Fallback to CLI
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return '';
    }

    const cwd = workspaceFolders[0].uri.fsPath;

    return new Promise((resolve) => {
        exec(`git log --oneline -${count}`, { cwd }, (err, stdout) => {
            if (err) {
                return resolve('');
            }
            resolve(stdout || '');
        });
    });
}

export async function getPRDiff(): Promise<string> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error('No workspace folder open');
    }

    const cwd = workspaceFolders[0].uri.fsPath;

    return new Promise((resolve, reject) => {
        // Find merge base dynamically and get diff
        const cmd = 'git diff $(git merge-base main HEAD 2>/dev/null || git merge-base master HEAD 2>/dev/null || echo "HEAD~1")...HEAD';
        exec(cmd, { cwd }, (err, stdout) => {
            if (err) {
                // Fallback: Check if HEAD exists, run git diff if not
                exec('git rev-parse --verify HEAD', { cwd }, (errHead) => {
                    const diffCmd = errHead ? 'git diff' : 'git diff HEAD';
                    exec(diffCmd, { cwd }, (err2, stdout2) => {
                        if (err2) {
                            return reject(err2);
                        }
                        resolve(stdout2 || '');
                    });
                });
                return;
            }
            resolve(stdout || '');
        });
    });
}

export async function getChangelogCommits(count: number = 100): Promise<string> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error('No workspace folder open');
    }

    const cwd = workspaceFolders[0].uri.fsPath;

    return new Promise((resolve, reject) => {
        exec(`git log --oneline -${count}`, { cwd }, (err, stdout) => {
            if (err) {
                return reject(err);
            }
            resolve(stdout || '');
        });
    });
}


