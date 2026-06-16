# CommitScribe 🖋️

CommitScribe is a premium, high-speed, theme-aware VS Code extension designed to streamline your git workflow. Using local Ollama instances, Groq, or OpenRouter, CommitScribe generates industry-standard conventional commit messages, detailed PR descriptions, structured changelogs, and conducts local AI code reviews directly within the VS Code Source Control Management (SCM) panel.

---

## 🚀 Key Features

*   **SCM Input Auto-fill**: Generates and writes commit messages directly into your Git sidebar input box.
*   **Highly Optimized Diffs**: Filters changes to send only additions/deletions, cutting prompt size by 80-90% for blazing fast inference.
*   **Local Caching (SHA256)**: Re-generating commit messages for identical diffs is instant (0ms) through local caching.
*   **Commit History Style Learning**: Learns your team's commit history style to match naming/prefix conventions.
*   **AI Code Review**: Scans git diffs for potential bugs, security holes, and code smell before committing.
*   **PR & Changelog Generator**: Generates comprehensive pull request templates and release logs instantly.

---

## 🛠️ How to Use

### 1. Generating Commit Messages
1. Stage or modify your files in the Git sidebar.
2. Click the **CommitScribe** icon (feather quill logo) in the Git changes header or run `CommitScribe: Generate Commit Message` from the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
3. The generated message will automatically populate your commit input box.

### 2. Auto-commit Changes
Run `CommitScribe: Generate and Commit` to generate a message and instantly commit your staged changes.

---

## ⚙️ Provider Configuration

CommitScribe supports three powerful AI providers:

### Option A: Local Ollama (100% Free & Private)
1. Install and start [Ollama](https://ollama.com).
2. Download a model:
   ```bash
   ollama pull qwen2.5:1.5b
   ```
3. CommitScribe automatically detects local instances running on `http://127.0.0.1:11434` or `http://localhost:11434` and uses them instantly.

### Option B: Groq API (Blazing Fast)
1. Sign up and obtain a free API key from the [Groq Console](https://console.groq.com/).
2. In VS Code Settings, configure:
   *   **Provider**: `groq`
   *   **Groq API Key**: `gsk_...`
   *   **Groq Model**: `llama-3.3-70b-versatile` (default) or `llama-3.1-8b-instant`.

### Option C: OpenRouter API (Access to Free Cloud Models)
1. Sign up and obtain a free API key from [OpenRouter](https://openrouter.ai/).
2. In VS Code Settings, configure:
   *   **Provider**: `openrouter`
   *   **OpenRouter API Key**: `sk-or-...`
   *   **OpenRouter Model**: `meta-llama/llama-3-8b-instruct:free` (default).

---

## 🎛️ Settings Reference

| Setting | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `commitscribe.provider` | Enum | `"ollama"` | Select between `ollama`, `openrouter`, or `groq`. |
| `commitscribe.model` | Enum | `"llama3.2:3b"` | Preferred LLM model for local Ollama. |
| `commitscribe.groqApiKey` | String | `""` | API Key for Groq. |
| `commitscribe.groqModel` | Enum | `"llama-3.3-70b-versatile"` | Preferred Groq model. |
| `commitscribe.openrouterApiKey` | String | `""` | API Key for OpenRouter. |
| `commitscribe.openrouterModel` | Enum | `"meta-llama/llama-3-8b-instruct:free"` | Preferred OpenRouter model. |
| `commitscribe.learnStyle` | Boolean | `true` | Learn repo styling by fetching recent git commit history. |
