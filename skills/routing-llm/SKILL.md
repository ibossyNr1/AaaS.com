---
name: routing-llm
description: "Dynamically selects the best available LLM (Gemini or Deepseek) based on task requirements (speed vs. reasoning)."
version: 1.1.0
dependencies: ["python3", "requests"]
inputs:
  - name: strategy
    description: "'speed' (Flash/DeepSeek V3), 'reasoning' (Pro/DeepSeek R1), 'vision' (Multimodal), or 'kimi' (Moonshot K2.5 - use when stuck)."
outputs:
  - type: stdout
    description: A model ID string (e.g., 'gemini-1.5-flash', 'deepseek/deepseek-reasoner', 'moonshotai/kimi-k2.5').
---

# LLM Router (Google & Deepseek Optimized)

**PURPOSE:**
This skill queries the configured providers (Google or OpenRouter) to find the optimal model for a task. It prioritizes Deepseek models if the `OPEN_ROUTER` key is present, ensuring access to top-tier reasoning and speed models.

**STRATEGIES:**
- **speed:** Prioritizes low latency (e.g., Flash 2.0, 1.5). Use for simple tasks, summaries, JSON fixing.
- **reasoning:** Prioritizes intelligence (e.g., Pro, Ultra, Thinking). Use for coding, planning, architecture.
- **vision:** Prioritizes multimodal capabilities.
- **kimi:** Uses `moonshotai/kimi-k2.5`. Use this when the system is stuck or needs a different perspective/stronger model. **REQUIREMENT:** You must ask the user for confirmation before switching to this model if it's not the default.

---

## Usage

### Get the Best Model
```bash
MODEL_ID=$(python3 skills/routing-llm/scripts/router.py --strategy "reasoning")
echo "Selected Model: $MODEL_ID"
```
