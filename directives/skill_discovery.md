# Skill Discovery Protocol

**SYSTEM AUTHORITY:** This protocol MUST be followed during the **Planning Mode** of any complex task.

## 1. Trigger Condition
You are "Planning" a solution and the user requirements exceed your built-in capabilities (e.g., "Create a video", "Deploy to Kubernetes", "Audit smart contracts").

## 2. The Logic Loop
Before writing custom scripts or admitting defeat, you must **RESEARCH** available capabilities.

### Step A: Internal Scan (The "Toolkit" Check)
Always check if you already possess the tool.
*   **Command:** `python3 skills/find-skills/scripts/discover.py "[capability]"`
*   **Logic:**
    *   If it returns a **Local Skill** with `Relevance > 0`: **USE IT.**
    *   Read its `SKILL.md` via `view_file` to learn how to operate it.

### Step B: External Scout (The "Market" Check)
If Step A returns nothing valid, the script will automatically query `skills.sh`.
*   **Logic:**
    *   If a remote skill is found: **PROPOSE IT** to the user in your Implementation Plan.
    *   *Do not install it automatically.* Ask for permission: "I found a skill `xyz` that solves this. Shall I add it?"

## 3. Decision Matrix
| Scenario | Action |
| :--- | :--- |
| **Local Match Found** | **Execute:** Use the existing skill in `skills/`. |
| **Remote Match Found** | **Plan:** Add `npx skills add [skill]` to your plan. |
| **No Match** | **Build:** Write a custom script in `execution/` or create a new skill. |
