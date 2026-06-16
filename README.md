# CommitScribe 🖋️ - Free AI Git Commit Message Generator

CommitScribe is a **free AI-powered git commit message generator** and developer productivity extension for VS Code. Automatically generate high-quality conventional commit messages, detailed pull request (PR) descriptions, release logs, and perform AI code reviews directly inside your editor. 

With **100% free local models (Ollama)** or fast cloud APIs (**Groq & OpenRouter**), CommitScribe is the ultimate free alternative to paid AI coding assistants for git automation.

---

## 📥 Download & Install (Direct VSIX)

You can download the packaged extension directly and install it manually:

👉 **[Download Latest CommitScribe VSIX](https://github.com/YOUR_USERNAME/YOUR_REPO/releases/download/v0.0.1/commitscribe-0.0.1.vsix)**

*(To install: Open VS Code, go to the Extensions tab, click the three dots `...` in the top right, select **Install from VSIX...**, and choose the downloaded file.)*

---

## ✨ Features
*   **Free AI Commit Message Generator**: Convert complex git diffs into clean, industry-standard conventional commits (`feat:`, `fix:`, `refactor:`, etc.) with one click.
*   **Blazing Fast Performance**: Zero-token waste optimization reduces git diff payload sizes by 80-90%, resulting in lightning-fast response times.
*   **Smart Style Learning**: Analyzes your repository's recent commit history to learn and mimic your team's style, format, and conventions.
*   **Local Caching (0ms latency)**: Uses SHA256 diff hashing. If the diff hasn't changed, the generated message is loaded instantly from the local cache.
*   **PR Template & Changelog Builder**: Auto-generate complete Pull Request summaries (Summary, Changes, Testing) and project release logs.
*   **Local AI Code Reviewer**: Run static code reviews to spot bugs, security vulnerabilities, or guidance issues before you commit your code.

---

## 🚀 Supported AI Providers & Models (100% Free & Unlimited)

### 1. Local Ollama (Completely Private, Free & Offline)
Run models locally on your hardware with no internet connection required:
*   `qwen2.5:1.5b` (Recommended - fast and highly accurate)
*   `llama3.2:3b`
*   `deepseek-r1:latest`
*   **Setup**: Just install [Ollama](https://ollama.com) and run `ollama run qwen2.5:1.5b`. CommitScribe auto-detects local instances on startup.

### 2. Groq API (High Speed Cloud Inference)
Access ultra-fast open-weight models with a free Groq API key:
*   `llama-3.3-70b-versatile`
*   `llama-3.1-8b-instant`
*   **Setup**: Set **Provider** to `groq` in VS Code settings and paste your API key.

### 3. OpenRouter API (Access to Free Cloud Models)
Generate commits using public free cloud models with $0.00 token cost:
*   `meta-llama/llama-3-8b-instruct:free`
*   `google/gemini-2.5-flash`
*   **Setup**: Set **Provider** to `openrouter` in VS Code settings and enter your free OpenRouter API key.

---

## 🛠️ Installation & Setup

1. Search for **CommitScribe** in the VS Code Marketplace and click **Install**.
2. Stage your files in the VS Code Source Control (Git) panel.
3. Click the **CommitScribe feather icon** in the Git SCM header to auto-populate the commit input box.
4. (Optional) Open VS Code Settings (`Ctrl+,` / `Cmd+,`) and search for `CommitScribe` to configure your AI provider, API Keys, and customized models.

---

## 🎛️ Extension Settings

Configure the extension by adjusting these parameters in your user settings:

*   `commitscribe.provider`: Set your preferred AI engine (`ollama`, `groq`, or `openrouter`).
*   `commitscribe.groqApiKey`: Your personal Groq API key.
*   `commitscribe.openrouterApiKey`: Your OpenRouter API key.
*   `commitscribe.learnStyle`: Enable/disable learning repo style from git logs (default: `true`).
