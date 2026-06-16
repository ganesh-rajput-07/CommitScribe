import * as vscode from 'vscode';
import * as crypto from 'crypto';
import { getGitDiff, getCommitHistory, commitChanges, getPRDiff, getChangelogCommits } from './git';
import { OllamaFreeClient } from './ollama';
import { DEFAULT_COMMIT_PROMPT, PR_PROMPT, CHANGELOG_PROMPT, REVIEW_PROMPT } from './prompt';

const client = new OllamaFreeClient();
const commitCache = new Map<string, string>();
let cachedHistory = '';

function getSha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

function getPreferredModel(): string {
    return vscode.workspace.getConfiguration('commitscribe').get<string>('model') || 'llama3.2:3b';
}

function optimizeDiff(diff: string): string {
    const lines = diff.split('\n');
    const files = new Set<string>();
    const summaryLines: string[] = [];
    
    for (const line of lines) {
        if (line.startsWith('diff --git')) {
            const parts = line.split(' ');
            if (parts.length >= 4) {
                const file = parts[3].replace(/^b\//, '');
                files.add(file);
            }
        } else if (line.startsWith('+') && !line.startsWith('+++')) {
            const trimmed = line.substring(1).trim();
            if (trimmed) {
                summaryLines.push(`+ ${trimmed}`);
            }
        } else if (line.startsWith('-') && !line.startsWith('---')) {
            const trimmed = line.substring(1).trim();
            if (trimmed) {
                summaryLines.push(`- ${trimmed}`);
            }
        }
    }
    
    const truncatedSummary = summaryLines.slice(0, 150).join('\n');
    const filesList = Array.from(files).map(f => `- ${f}`).join('\n');
    
    return `Modified files:\n${filesList}\n\nSummary:\n${truncatedSummary}`;
}

async function generateFlow(): Promise<string | null> {
    // 1. Get git diff
    const diff = await getGitDiff();
    if (!diff || diff.trim() === '') {
        vscode.window.showInformationMessage('No staged or unstaged changes found.');
        return null;
    }

    // 2. Check local cache
    const diffHash = getSha256(diff);
    if (commitCache.has(diffHash)) {
        return commitCache.get(diffHash) || null;
    }

    // 3. Optimize the diff to keep prompt extremely small
    const optimizedDiff = optimizeDiff(diff);

    // 4. Retrieve commit history style if enabled
    const learnStyle = vscode.workspace.getConfiguration('commitscribe').get<boolean>('learnStyle') !== false;
    let historySection = '';
    
    if (learnStyle) {
        if (!cachedHistory) {
            try {
                cachedHistory = await getCommitHistory(20);
            } catch (e) {
                // Ignore history loading failure
            }
        }
        if (cachedHistory && cachedHistory.trim() !== '') {
            historySection = `Here is the style history of recent commit messages in this repository. Follow similar styling, casing, formatting, and patterns:\n${cachedHistory}`;
        }
    }

    // 5. Construct prompt
    const prompt = DEFAULT_COMMIT_PROMPT
        .replace('{{HISTORY_SECTION}}', historySection)
        .replace('{{DIFF}}', optimizedDiff);

    // 6. Call LLM provider
    const rawResponse = await client.generate(prompt, getPreferredModel());
    const cleanResponse = parseCommitResponse(rawResponse);
    
    // 7. Store in local cache
    if (cleanResponse && cleanResponse.trim() !== '') {
        commitCache.set(diffHash, cleanResponse);
    }
    
    return cleanResponse;
}

console.log("🔥 COMMITSCRIBE VERSION 999 LOADED");
export function activate(context: vscode.ExtensionContext) {
    // Warm up the model in background on startup
    setTimeout(() => {
        client.generate("warmup_ping").catch(() => {});
    }, 2000);

    let generateMsgDisposable = vscode.commands.registerCommand('commitscribe.generateCommitMessage', async () => {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "CommitScribe",
                cancellable: false
            }, async (progress) => {
                progress.report({ message: "Generating commit message..." });
                const commitMessage = await generateFlow();
                if (!commitMessage) {
                    return;
                }

                // Fill in git extension input box if available
                const gitExtension = vscode.extensions.getExtension('vscode.git')?.exports;
                let filledInGitExtension = false;
                if (gitExtension) {
                    const api = gitExtension.getAPI(1);
                    if (api && api.repositories.length > 0) {
                        const repository = api.repositories[0];
                        repository.inputBox.value = commitMessage;
                        filledInGitExtension = true;
                    }
                }

                if (filledInGitExtension) {
                    vscode.window.showInformationMessage('CommitScribe: Generated message filled in Git panel.');
                } else {
                    // Show input box to review and edit only if Git extension is not available
                    const userChoice = await vscode.window.showInputBox({
                        title: 'Review Commit Message',
                        value: commitMessage,
                        prompt: 'Copy the message or edit it, then press Enter',
                        ignoreFocusOut: true
                    });

                    if (userChoice !== undefined && gitExtension) {
                        const api = gitExtension.getAPI(1);
                        if (api && api.repositories.length > 0) {
                            api.repositories[0].inputBox.value = userChoice;
                        }
                    }
                }
            });

        } catch (error: any) {
            vscode.window.showErrorMessage(`CommitScribe Error: ${error.message || error}`);
        }
    });

    let autoCommitDisposable = vscode.commands.registerCommand('commitscribe.generateAndCommit', async () => {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "CommitScribe",
                cancellable: false
            }, async (progress) => {
                progress.report({ message: "Generating and committing..." });
                const commitMessage = await generateFlow();
                if (!commitMessage) {
                    return;
                }

                // Show input box to review and edit before committing
                const userChoice = await vscode.window.showInputBox({
                    title: 'Review & Confirm Commit Message',
                    value: commitMessage,
                    prompt: 'Edit message if needed, then press Enter to commit changes',
                    ignoreFocusOut: true
                });

                if (userChoice !== undefined && userChoice.trim() !== '') {
                    progress.report({ message: "Committing changes..." });
                    await commitChanges(userChoice);
                    vscode.window.showInformationMessage('Changes committed successfully.');
                }
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`CommitScribe Error: ${error.message || error}`);
        }
    });

    let generatePRDisposable = vscode.commands.registerCommand('commitscribe.generatePR', async () => {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "CommitScribe",
                cancellable: false
            }, async (progress) => {
                progress.report({ message: "Generating PR description..." });
                const diff = await getPRDiff();
                if (!diff || diff.trim() === '') {
                    vscode.window.showInformationMessage('No changes found compared to the base branch.');
                    return;
                }
                const prompt = PR_PROMPT.replace('{{DIFF}}', diff.substring(0, 8000));
                const response = await client.generate(prompt, getPreferredModel());
                
                const document = await vscode.workspace.openTextDocument({
                    content: response,
                    language: 'markdown'
                });
                await vscode.window.showTextDocument(document);
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`CommitScribe Error: ${error.message || error}`);
        }
    });

    let generateChangelogDisposable = vscode.commands.registerCommand('commitscribe.generateChangelog', async () => {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "CommitScribe",
                cancellable: false
            }, async (progress) => {
                progress.report({ message: "Generating changelog..." });
                const commits = await getChangelogCommits(100);
                if (!commits || commits.trim() === '') {
                    vscode.window.showInformationMessage('No commit history found to generate changelog.');
                    return;
                }
                const prompt = CHANGELOG_PROMPT.replace('{{COMMITS}}', commits);
                const response = await client.generate(prompt, getPreferredModel());
                
                const document = await vscode.workspace.openTextDocument({
                    content: response,
                    language: 'markdown'
                });
                await vscode.window.showTextDocument(document);
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`CommitScribe Error: ${error.message || error}`);
        }
    });

    let aiReviewDisposable = vscode.commands.registerCommand('commitscribe.aiReview', async () => {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "CommitScribe",
                cancellable: false
            }, async (progress) => {
                progress.report({ message: "Analyzing changes..." });
                const diff = await getGitDiff();
                if (!diff || diff.trim() === '') {
                    vscode.window.showInformationMessage('No changes found to review.');
                    return;
                }
                const prompt = REVIEW_PROMPT.replace('{{DIFF}}', diff.substring(0, 8000));
                const response = await client.generate(prompt, getPreferredModel());
                
                const document = await vscode.workspace.openTextDocument({
                    content: response,
                    language: 'markdown'
                });
                await vscode.window.showTextDocument(document);
            });
        } catch (error: any) {
            vscode.window.showErrorMessage(`CommitScribe Error: ${error.message || error}`);
        }
    });

    context.subscriptions.push(generateMsgDisposable);
    context.subscriptions.push(autoCommitDisposable);
    context.subscriptions.push(generatePRDisposable);
    context.subscriptions.push(generateChangelogDisposable);
    context.subscriptions.push(aiReviewDisposable);
}

function parseCommitResponse(response: string): string {
    try {
        // Strip markdown code block wrappers if any
        let cleanResponse = response.trim();
        if (cleanResponse.startsWith('```')) {
            const lines = cleanResponse.split('\n');
            if (lines[0].startsWith('```')) {
                lines.shift();
            }
            if (lines[lines.length - 1].startsWith('```')) {
                lines.pop();
            }
            cleanResponse = lines.join('\n').trim();
        }

        const parsed = JSON.parse(cleanResponse);
        if (parsed.title) {
            let message = parsed.title;
            if (Array.isArray(parsed.description) && parsed.description.length > 0) {
                message += '\n\n' + parsed.description.map((d: string) => `- ${d}`).join('\n');
            }
            return message;
        }
    } catch (e) {
        // Parsing failed, return response text as-is
    }

    return response.trim();
}

export function deactivate() {}
