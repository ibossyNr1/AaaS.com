#!/usr/bin/env python3
"""
Skill Vault Sync - Sync project skills to the central vault

This script syncs improved skills from a cloned project back to the central vault,
making them available for future projects.

Architecture:
    ~/.gemini/base/                    ← Template project
    ~/.gemini/[project]/               ← Cloned projects (e.g., enora)
    ~/.gemini/antigravity-vault/skills ← Central vault (sync destination)

Usage:
    python3 sync_to_vault.py                      # Interactive mode
    python3 sync_to_vault.py brand-identity       # Sync specific skill
    python3 sync_to_vault.py --all                # Sync all project skills
    python3 sync_to_vault.py --diff               # Show what would change
    python3 sync_to_vault.py --list               # List project skills
"""

import os
import sys
import shutil
import argparse
import filecmp
from pathlib import Path
from datetime import datetime

# Configuration - scoped to ~/.gemini/
GEMINI_ROOT = Path.home() / ".gemini"
VAULT_DIR = GEMINI_ROOT / "antigravity-vault" / "skills"
BACKUP_DIR = GEMINI_ROOT / "antigravity-vault" / ".backups"


def get_project_root() -> Path:
    """Find the current project root (directory containing skills/)."""
    cwd = Path.cwd()
    
    # Check if we're in a project with skills/
    if (cwd / "skills").exists():
        return cwd
    
    # Walk up to find skills/
    for parent in cwd.parents:
        if parent == GEMINI_ROOT.parent:
            break
        if (parent / "skills").exists():
            return parent
    
    return cwd


def get_project_skills_dir() -> Path:
    """Get the project's skills directory."""
    return get_project_root() / "skills"


def list_project_skills() -> list:
    """List all skills in the current project."""
    skills_dir = get_project_skills_dir()
    if not skills_dir.exists():
        return []
    
    skills = []
    for item in skills_dir.iterdir():
        if item.is_dir() and not item.name.startswith('.'):
            skill_md = item / "SKILL.md"
            if skill_md.exists():
                skills.append(item.name)
    
    return sorted(skills)


def skill_exists_in_vault(skill_name: str) -> bool:
    """Check if a skill exists in the vault."""
    return (VAULT_DIR / skill_name / "SKILL.md").exists()


def create_backup(skill_name: str) -> Path:
    """Create a timestamped backup of a vault skill."""
    source = VAULT_DIR / skill_name
    if not source.exists():
        return None
    
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = BACKUP_DIR / f"{skill_name}_{timestamp}"
    shutil.copytree(source, backup_path)
    return backup_path


def compare_skills(project_skill: Path, vault_skill: Path) -> dict:
    """Compare two skill directories and return differences."""
    if not vault_skill.exists():
        return {"status": "new", "files": list(project_skill.rglob("*"))}
    
    comparison = filecmp.dircmp(project_skill, vault_skill)
    return {
        "status": "modified" if comparison.diff_files or comparison.left_only else "identical",
        "modified": comparison.diff_files,
        "new_files": comparison.left_only,
        "removed_files": comparison.right_only,
    }


def sync_skill(skill_name: str, dry_run: bool = False) -> bool:
    """
    Sync a single skill from project to vault.
    
    Args:
        skill_name: Name of the skill to sync
        dry_run: If True, show what would happen without making changes
    
    Returns:
        True if sync was successful
    """
    project_skill = get_project_skills_dir() / skill_name
    vault_skill = VAULT_DIR / skill_name
    
    if not project_skill.exists():
        print(f"❌ Skill not found in project: {skill_name}")
        return False
    
    skill_md = project_skill / "SKILL.md"
    if not skill_md.exists():
        print(f"⚠️  No SKILL.md found in: {skill_name}")
        return False
    
    # Compare
    diff = compare_skills(project_skill, vault_skill)
    
    if diff["status"] == "identical":
        print(f"✓ {skill_name}: Already in sync")
        return True
    
    if dry_run:
        print(f"\n📋 {skill_name} ({diff['status'].upper()}):")
        if diff.get("modified"):
            print(f"   Modified: {', '.join(diff['modified'])}")
        if diff.get("new_files"):
            print(f"   New files: {', '.join(diff['new_files'])}")
        if diff.get("removed_files"):
            print(f"   Removed: {', '.join(diff['removed_files'])}")
        return True
    
    # Create backup if updating existing skill
    if vault_skill.exists():
        backup = create_backup(skill_name)
        if backup:
            print(f"📦 Backup: {backup.name}")
    
    # Sync
    if vault_skill.exists():
        shutil.rmtree(vault_skill)
    shutil.copytree(project_skill, vault_skill)
    
    print(f"✅ Synced: {skill_name} → vault")
    return True


def interactive_sync():
    """Interactive mode to select skills to sync."""
    skills = list_project_skills()
    
    if not skills:
        print("❌ No skills found in current project")
        return
    
    print(f"\n📁 Project: {get_project_root().name}")
    print(f"📊 Found {len(skills)} skills\n")
    
    # Show status for each skill
    for i, skill in enumerate(skills, 1):
        in_vault = "🏛️" if skill_exists_in_vault(skill) else "🆕"
        print(f"  {i}. {in_vault} {skill}")
    
    print("\n" + "─" * 40)
    print("Options:")
    print("  Enter number(s) to sync (e.g., 1 3 5)")
    print("  'all' to sync all skills")
    print("  'q' to quit")
    
    choice = input("\n> ").strip().lower()
    
    if choice == 'q':
        return
    
    if choice == 'all':
        to_sync = skills
    else:
        try:
            indices = [int(x) - 1 for x in choice.split()]
            to_sync = [skills[i] for i in indices if 0 <= i < len(skills)]
        except (ValueError, IndexError):
            print("❌ Invalid selection")
            return
    
    print(f"\n🔄 Syncing {len(to_sync)} skill(s)...\n")
    for skill in to_sync:
        sync_skill(skill)


def main():
    parser = argparse.ArgumentParser(
        description="Sync project skills to the central vault",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument("skill", nargs="?", help="Skill name to sync")
    parser.add_argument("--all", action="store_true", help="Sync all project skills")
    parser.add_argument("--diff", action="store_true", help="Show differences without syncing")
    parser.add_argument("--list", action="store_true", help="List project skills")
    
    args = parser.parse_args()
    
    # Ensure vault exists
    VAULT_DIR.mkdir(parents=True, exist_ok=True)
    
    if args.list:
        skills = list_project_skills()
        print(f"\n📁 Project: {get_project_root().name}")
        print(f"📊 Skills: {len(skills)}\n")
        for skill in skills:
            status = "🏛️ (in vault)" if skill_exists_in_vault(skill) else "🆕 (local only)"
            print(f"  • {skill} {status}")
        return
    
    if args.diff:
        skills = [args.skill] if args.skill else list_project_skills()
        print(f"\n🔍 Comparing {len(skills)} skill(s) with vault...\n")
        for skill in skills:
            sync_skill(skill, dry_run=True)
        return
    
    if args.all:
        skills = list_project_skills()
        print(f"\n🔄 Syncing all {len(skills)} skills...\n")
        for skill in skills:
            sync_skill(skill)
        return
    
    if args.skill:
        sync_skill(args.skill)
        return
    
    # Interactive mode
    interactive_sync()


if __name__ == "__main__":
    main()
