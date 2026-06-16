import axios from 'axios';
import * as vscode from 'vscode';

interface Server {
    url: string;
    model: string;
    speed: number; // perf_tokens_per_second
}

export class OllamaFreeClient {
    private families = ['llama', 'gemma', 'qwen'];
    private cache: Server[] = [];
    private lastFetched = 0;
    private cacheTTL = 10 * 60 * 1000; // 10 minutes

    private async fetchServers(): Promise<Server[]> {
        const now = Date.now();
        if (this.cache.length > 0 && (now - this.lastFetched) < this.cacheTTL) {
            return this.cache;
        }

        const servers: Server[] = [];
        for (const family of this.families) {
            try {
                const url = `https://raw.githubusercontent.com/mfoud444/ollamafreeapi/main/ollamafreeapi/ollama_json/${family}.json`;
                const response = await axios.get(url, { timeout: 5000 });
                const data = response.data;
                const models = data?.props?.pageProps?.models || data?.models || [];
                
                for (const modelInfo of models) {
                    const ipPort = modelInfo.ip_port;
                    const modelName = modelInfo.model_name || modelInfo.model;
                    const speed = parseFloat(modelInfo.perf_tokens_per_second) || 0;

                    if (ipPort && modelName) {
                        servers.push({
                            url: ipPort,
                            model: modelName,
                            speed: speed
                        });
                    }
                }
            } catch (error) {
                // Ignore failure for individual families, try to get as many as possible
            }
        }

        // Sort by speed descending
        this.cache = servers.sort((a, b) => b.speed - a.speed);
        this.lastFetched = now;
        return this.cache;
    }

    public async generate(prompt: string, preferredModel?: string): Promise<string> {
        const config = vscode.workspace.getConfiguration('commitscribe');
        const provider = config.get<string>('provider') || 'ollama';

        if (provider === 'openrouter') {
            const apiKey = config.get<string>('openrouterApiKey');
            const model = config.get<string>('openrouterModel') || 'meta-llama/llama-3-8b-instruct:free';
            
            if (!apiKey || apiKey.trim() === '') {
                throw new Error('OpenRouter API Key is missing. Please configure it in VS Code settings under CommitScribe.');
            }

            try {
                const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
                    model: model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 80,
                    temperature: 0.2
                }, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://github.com/commitscribe',
                        'X-Title': 'CommitScribe'
                    },
                    timeout: 25000
                });

                let text = response.data?.choices?.[0]?.message?.content;
                if (text) {
                    text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
                    return text;
                }
                throw new Error('Invalid response format from OpenRouter');
            } catch (err: any) {
                const errMsg = err.response?.data?.error?.message || err.message || err;
                throw new Error(`OpenRouter API request failed: ${errMsg}`);
            }
        }

        if (provider === 'groq') {
            const apiKey = config.get<string>('groqApiKey');
            const model = config.get<string>('groqModel') || 'llama-3.3-70b-versatile';
            
            if (!apiKey || apiKey.trim() === '') {
                throw new Error('Groq API Key is missing. Please configure it in VS Code settings under CommitScribe.');
            }

            try {
                const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                    model: model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 80,
                    temperature: 0.2
                }, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 25000
                });

                let text = response.data?.choices?.[0]?.message?.content;
                if (text) {
                    text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
                    return text;
                }
                throw new Error('Invalid response format from Groq');
            } catch (err: any) {
                const errMsg = err.response?.data?.error?.message || err.message || err;
                throw new Error(`Groq API request failed: ${errMsg}`);
            }
        }

        // Try local Ollama instance first
        try {
            const localUrls = ['http://127.0.0.1:11434', 'http://localhost:11434'];
            let tagsResponse = null;
            let activeUrl = '';
            for (const url of localUrls) {
                try {
                    const res = await axios.get(`${url}/api/tags`, { timeout: 1000 });
                    if (res.status === 200) {
                        tagsResponse = res;
                        activeUrl = url;
                        break;
                    }
                } catch (e) {}
            }

            if (tagsResponse && activeUrl) {
                const localModels: string[] = (tagsResponse.data?.models || []).map((m: any) => m.name);
                
                // Find best matching local model
                let modelToUse = preferredModel;
                if (!modelToUse || !localModels.includes(modelToUse)) {
                    // Try to look for fuzzy match, then qwen2.5:1.5b, llama3.2:3b, or any local model
                    const fuzzyMatch = preferredModel ? localModels.find(m => m.toLowerCase().includes(preferredModel.toLowerCase())) : null;
                    if (fuzzyMatch) {
                        modelToUse = fuzzyMatch;
                    } else {
                        const fallbacks = ['qwen2.5:1.5b', 'llama3.2:3b'];
                        const found = fallbacks.find(f => localModels.includes(f));
                        modelToUse = found || localModels[0];
                    }
                }

                if (modelToUse) {
                    const response = await axios.post(`${activeUrl}/api/generate`, {
                        model: modelToUse,
                        prompt: prompt,
                        stream: false,
                        options: {
                            temperature: 0.2,
                            num_predict: 80
                        }
                    }, {
                        timeout: 30000
                    });

                    let text = response.data?.response;
                    
                    if (text) {
                        text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
                        return text;
                    }
                }
            }
        } catch (e) {
            // Fall back silently to remote servers
        }

        const servers = await this.fetchServers();
        if (servers.length === 0) {
            throw new Error('No free Ollama servers found in OllamaFreeAPI repository');
        }

        // Filter servers by preferred model if specified
        let targets = servers;
        if (preferredModel) {
            targets = servers.filter(s => s.model.toLowerCase().includes(preferredModel.toLowerCase()));
        }

        const tried = new Set<string>();
        let lastError: any = null;

        // 1. Try preferred targets first
        for (const server of targets) {
            const key = `${server.url}-${server.model}`;
            tried.add(key);
            try {
                const response = await axios.post(`${server.url}/api/generate`, {
                    model: server.model,
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: 0.2,
                        num_predict: 80
                    }
                }, {
                    timeout: 25000 // 25 seconds per request
                });

                let text = response.data?.response;
                if (text) {
                    // Clean up reasoning models' thoughts
                    text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
                    return text;
                }
            } catch (err: any) {
                lastError = err;
            }
        }

        // 2. Fallback to all other servers if preferred model servers failed
        for (const server of servers) {
            const key = `${server.url}-${server.model}`;
            if (tried.has(key)) {
                continue;
            }
            tried.add(key);
            try {
                const response = await axios.post(`${server.url}/api/generate`, {
                    model: server.model,
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: 0.2,
                        num_predict: 80
                    }
                }, {
                    timeout: 25000
                });

                let text = response.data?.response;
                if (text) {
                    text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
                    return text;
                }
            } catch (err: any) {
                lastError = err;
            }
        }

        throw new Error(`Failed to generate response. All servers failed. Last error: ${lastError?.message || lastError}`);
    }
}

