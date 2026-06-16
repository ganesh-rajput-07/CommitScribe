export const DEFAULT_COMMIT_PROMPT = `Generate ONE conventional commit message.

Rules:
- Use: feat, fix, docs, refactor, test, chore
- Return ONLY the commit message
- No explanation
- No markdown
- No JSON
- Max 72 characters

{{HISTORY_SECTION}}

Changes:
{{DIFF}}`;

export const PR_PROMPT = `You are a senior software engineer.
Analyze the git diff and generate a Pull Request description.

Rules:
- Be clear and professional.
- Structure it with exactly these headings: Summary, Changes, and Testing.
- Do not mention low-level details like line numbers.
- Return ONLY the markdown content. No conversational introduction or wrap-ups.

Git Diff:
{{DIFF}}`;

export const CHANGELOG_PROMPT = `You are a release engineer.
Analyze the following list of git commits and generate a Changelog section for the upcoming version (e.g. ## v1.0.0 or similar).

Rules:
- Group changes into categories: Features, Fixes, Chore/Others.
- Return ONLY the markdown content. No conversational introduction or wrap-ups.

Commits:
{{COMMITS}}`;

export const REVIEW_PROMPT = `You are an expert code reviewer.
Analyze the git diff for potential issues, bugs, safety concerns, style issues, or performance bottlenecks.

Rules:
- Provide list of potential issues.
- Be concise and actionable.
- If there are no issues, state that the changes look clean.
- Return ONLY the markdown content. No conversational introduction or wrap-ups.

Git Diff:
{{DIFF}}`;

