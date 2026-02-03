#!/usr/bin/env python3
"""
Skills Manager - Manage skills across project and vault

Usage:
    python3 skills_manager.py list                  # List active project skills
    python3 skills_manager.py disabled              # List disabled skills
    python3 skills_manager.py enable SKILL          # Enable a disabled skill
    python3 skills_manager.py disable SKILL         # Disable an active skill
    python3 skills_manager.py vault                 # List vault skills
    python3 skills_manager.py import SKILL          # Import skill from vault to project
    python3 skills_manager.py compare               # Compare project vs vault
"""

import sys
import os
import shutil
from pathlib import Path

# Configuration - scoped to ~/.gemini/
GEMINI_ROOT = Path.home() / ".gemini"
VAULT_DIR = GEMINI_ROOT / "antigravity-vault" / "skills"


def get_project_skills_dir() -> Path:
    """Get the project's skills directory."""
    cwd = Path.cwd()
    
    if (cwd / "skills").exists():
        return cwd / "skills"
    
    for parent in cwd.parents:
        if parent == GEMINI_ROOT.parent:
            break
        if (parent / "skills").exists():
            return parent / "skills"
    
    # Fallback to script location
    return Path(__file__).parent.parent / "skills"


def get_disabled_dir() -> Path:
    """Get the disabled skills directory."""
    return get_project_skills_dir() / ".disabled"


def list_active():
    """List all active skills in project."""
    skills_dir = get_project_skills_dir()
    print(f"📁 Project: {skills_dir.parent.name}")
    print("🟢 Active Skills:\n")
    
    skills = sorted([d.name for d in skills_dir.iterdir() 
                    if d.is_dir() and not d.name.startswith('.')])
    symlinks = sorted([s.name for s in skills_dir.iterdir() 
                      if s.is_symlink()])
    
    for skill in skills:
        # Check if also in vault
        in_vault = "🏛️" if (VAULT_DIR / skill).exists() else "  "
        print(f"  {in_vault} {skill}")
    
    if symlinks:
        print("\n📎 Symlinks:")
        for link in symlinks:
            target = os.readlink(skills_dir / link)
            print(f"  • {link} → {target}")
    
    print(f"\n✅ Total: {len(skills)} skills + {len(symlinks)} symlinks")


def list_disabled():
    """List all disabled skills."""
    disabled_dir = get_disabled_dir()
    if not disabled_dir.exists():
        print("❌ No disabled skills found")
        return
    
    print("⚪ Disabled Skills:\n")
    disabled = sorted([d.name for d in disabled_dir.iterdir() if d.is_dir()])
    
    for skill in disabled:
        print(f"  • {skill}")
    
    print(f"\n📊 Total: {len(disabled)} disabled skills")


def list_vault():
    """List all skills in the central vault."""
    print(f"🏛️ Vault Skills ({VAULT_DIR}):\n")
    
    if not VAULT_DIR.exists():
        print("❌ Vault not found")
        return
    
    skills = sorted([d.name for d in VAULT_DIR.iterdir() 
                    if d.is_dir() and not d.name.startswith('.')])
    
    # Check which are in project
    project_skills = set(d.name for d in get_project_skills_dir().iterdir() 
                        if d.is_dir() and not d.name.startswith('.'))
    
    for skill in skills[:50]:  # Limit to first 50
        in_project = "✓" if skill in project_skills else " "
        print(f"  [{in_project}] {skill}")
    
    if len(skills) > 50:
        print(f"\n  ... and {len(skills) - 50} more")
    
    print(f"\n📊 Total: {len(skills)} vault skills")


def enable_skill(skill_name: str):
    """Enable a disabled skill."""
    disabled_dir = get_disabled_dir()
    skills_dir = get_project_skills_dir()
    
    source = disabled_dir / skill_name
    target = skills_dir / skill_name
    
    if not source.exists():
        print(f"❌ Skill '{skill_name}' not found in .disabled/")
        return False
    
    if target.exists():
        print(f"⚠️  Skill '{skill_name}' already active")
        return False
    
    source.rename(target)
    print(f"✅ Enabled: {skill_name}")
    return True


def disable_skill(skill_name: str):
    """Disable an active skill."""
    skills_dir = get_project_skills_dir()
    disabled_dir = get_disabled_dir()
    
    source = skills_dir / skill_name
    target = disabled_dir / skill_name
    
    if not source.exists():
        print(f"❌ Skill '{skill_name}' not found")
        return False
    
    if source.name.startswith('.'):
        print(f"⚠️  Cannot disable system directory: {skill_name}")
        return False
    
    if source.is_symlink():
        print(f"⚠️  Cannot disable symlink: {skill_name}")
        return False
    
    disabled_dir.mkdir(exist_ok=True)
    source.rename(target)
    print(f"✅ Disabled: {skill_name}")
    return True


def import_from_vault(skill_name: str):
    """Import a skill from the vault to the current project."""
    vault_skill = VAULT_DIR / skill_name
    project_skill = get_project_skills_dir() / skill_name
    
    if not vault_skill.exists():
        print(f"❌ Skill '{skill_name}' not found in vault")
        return False
    
    if project_skill.exists():
        print(f"⚠️  Skill '{skill_name}' already exists in project")
        response = input("   Overwrite? (y/N): ").strip().lower()
        if response != 'y':
            return False
        shutil.rmtree(project_skill)
    
    shutil.copytree(vault_skill, project_skill)
    print(f"✅ Imported: {skill_name} from vault")
    return True


def compare_with_vault():
    """Compare project skills with vault."""
    skills_dir = get_project_skills_dir()
    project_skills = set(d.name for d in skills_dir.iterdir() 
                        if d.is_dir() and not d.name.startswith('.'))
    vault_skills = set(d.name for d in VAULT_DIR.iterdir() 
                      if d.is_dir() and not d.name.startswith('.'))
    
    in_both = project_skills & vault_skills
    only_project = project_skills - vault_skills
    only_vault = vault_skills - project_skills
    
    print("📊 Comparison: Project vs Vault\n")
    
    print(f"🔄 In Both ({len(in_both)}):")
    for skill in sorted(list(in_both))[:10]:
        print(f"   • {skill}")
    if len(in_both) > 10:
        print(f"   ... and {len(in_both) - 10} more")
    
    print(f"\n🆕 Project Only ({len(only_project)}):")
    for skill in sorted(only_project):
        print(f"   • {skill}")
    
    print(f"\n🏛️ Vault Only ({len(only_vault)}):")
    for skill in sorted(list(only_vault))[:10]:
        print(f"   • {skill}")
    if len(only_vault) > 10:
        print(f"   ... and {len(only_vault) - 10} more")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "list":
        list_active()
    elif command == "disabled":
        list_disabled()
    elif command == "vault":
        list_vault()
    elif command == "compare":
        compare_with_vault()
    elif command == "enable":
        if len(sys.argv) < 3:
            print("❌ Usage: skills_manager.py enable SKILL_NAME")
            sys.exit(1)
        enable_skill(sys.argv[2])
    elif command == "disable":
        if len(sys.argv) < 3:
            print("❌ Usage: skills_manager.py disable SKILL_NAME")
            sys.exit(1)
        disable_skill(sys.argv[2])
    elif command == "import":
        if len(sys.argv) < 3:
            print("❌ Usage: skills_manager.py import SKILL_NAME")
            sys.exit(1)
        import_from_vault(sys.argv[2])
    else:
        print(f"❌ Unknown command: {command}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
