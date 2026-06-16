Phase 1 — MVP (1 Day)

Goal:

Read Git Changes
        ↓
Send to Ollama
        ↓
Generate Commit Message
        ↓
Show in VS Code
Tech Stack
VS Code Extension (TypeScript)

Git
Ollama

Model:
Qwen3 4B
or
Gemma3 4B

I would choose:

ollama pull qwen3:4b

because it is strong at coding tasks and runs well locally.

Project Structure
gitmind/

├── extension/
│   ├── src/
│   │   ├── extension.ts
│   │   ├── git.ts
│   │   ├── ollama.ts
│   │   └── prompt.ts
│   │
│   └── package.json
│
├── backend/
│   └── prompts/
│       └── commit_prompt.txt
│
└── docs/
Feature 1: Read Git Diff

Command:

git diff --cached

If nothing staged:

git diff HEAD

Return:

const diff = await getGitDiff();

Example:

+ Added JWT refresh token
- Removed old auth logic
Feature 2: Prompt Engineering

This is where most commit generators fail.

Prompt:

You are a senior software engineer.

Analyze the git diff.

Generate:

1. Conventional Commit Title
2. Short Description

Rules:

- Use feat, fix, docs, refactor, test, chore
- Max 72 chars title
- Be specific
- Do not mention line numbers
- Return JSON

Git Diff:

{{DIFF}}

Expected:

{
  "type": "feat",
  "title": "feat(auth): add JWT refresh token support",
  "description": [
    "Added refresh token endpoint",
    "Updated authentication workflow"
  ]
}
Feature 3: Ollama Integration

Endpoint:

POST http://localhost:11434/api/generate

Payload:

{
  "model": "qwen3:4b",
  "prompt": "..."
}

Return:

{
  "response": "feat(auth): add JWT refresh token support"
}
Feature 4: VS Code Command

Command Palette:

GitMind: Generate Commit Message

Flow:

User clicks command
       ↓
Read git diff
       ↓
Call Ollama
       ↓
Display commit

Show:

feat(auth): add JWT refresh token support
Phase 2 — Auto Commit

Button:

Generate + Commit

Flow:

Generate Message
        ↓
git commit -m

No copy-pasting.

Phase 3 — Commit History Learning

Read:

git log --oneline -50

Analyze style:

Example:

feat:
fix:
refactor:

Prompt:

Follow previous repository commit style.

Now commits match the team's style.

This feature alone makes the tool feel intelligent.

Phase 4 — PR Generator

Read:

git diff main...HEAD

Generate:

## Summary

Implemented JWT refresh token support.

## Changes

- Added refresh endpoint
- Updated middleware
- Improved validation

## Testing

- Unit tests added

Huge productivity boost.

Phase 5 — Changelog Generator

Read commits:

git log

Generate:

## v1.4.0

### Features

- Added JWT refresh token

### Fixes

- Resolved token expiration bug
Phase 6 — AI Review

Analyze diff.

Output:

Potential issues:

1. Missing null check
2. Unused import
3. Possible SQL injection risk

Think of it as a lightweight local code reviewer.

Phase 7 — Multi-Model Support

Support:

Qwen3
Gemma3
DeepSeek
Llama
Mistral

User selects:

{
  "model": "qwen3:4b"
}
Phase 8 — Publish Extension

Publish to:

VS Code Marketplace

Possible names:

GitMind
CommitPilot
AutoCommit AI
Smart Commit
CommitGen