# Skill Activation Protocol

**SYSTEM AUTHORITY:** This directive governs the onboarding of any new skill into the Base system.

## 1. The "Trust but Verify" Rule
Do not assume an imported skill works. You MUST verify it before adding it to the permanent `skills/` library.

## 2. Activation Checklist
When importing a skill (via `npx`, `git clone`, or generation), perform these steps:

1.  **Isolation Check:** Does the skill rely on global npm packages or hidden dependencies?
2.  **Dependency Scan:** Check `package.json`, `requirements.txt`, or `install.sh`.
    *   *Action:* If it requires `npm install`, prefer a local `node_modules` within the skill or use a container.
3.  **Sanity Test:** Run the `test.sh` (or create one if missing).
    *   *Command:* `bash skills/[skill-name]/test.sh`
    *   *Criteria:* Must exit with code 0 and print "✅".
4.  **Interface Audit:** Read `SKILL.md`. Does it match the system standard?
    *   *Fix:* If the `SKILL.md` is weak, rewrite it to follow the `skill-creator` template.

## 3. Storage Hierarchy
*   **Approved:** `skills/` (The single source of truth).
*   **Quarantine:** `.tmp/skills/` (For testing untrusted imports).
*   **Prohibited:** `.agent/` or `.agents/` (Legacy/Auto-generated paths that cause fragmentation).

## 4. Maintenance
*   **Duplicate Detection:** Before adding, check if a similar skill exists.
*   **Pruning:** Remove skills that fail the Sanity Test and cannot be easily fixed.
