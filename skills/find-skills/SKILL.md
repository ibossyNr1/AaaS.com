# Find Skills (Three-Tier Discovery)

**Version:** 1.2.0
**Purpose:** Locate relevant skills across local projects, the central Vault, or the global registry.

## Description
This skill implements the **Three-Tier Skill Discovery Protocol**. It ensures the Lead Engineer doesn't reinvent the wheel by searching hierarchical layers:

1.  **Tier 1 (Local):** Search the current project's `skills/` folder.
2.  **Tier 2 (The Vault):** Search the central repository at `/Users/user/.gemini/antigravity-vault/skills`.
3.  **Tier 3 (The Market):** Fallback to the global `skills.sh` registry.

## Usage
Run the discovery script with a descriptive keyword for the task you are planning.

```bash
python3 skills/find-skills/scripts/discover.py "weather"
```

### Input
- `query` (string): The capability or topic you are searching for.

### Output
- Prioritized **Local Skills**.
- Relevant **Vault Skills**.
- **Remote Suggestions** from `skills.sh` (if no internal match is found).
