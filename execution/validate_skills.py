#!/usr/bin/env python3
"""
Validate Skills - Check skill structure and metadata

Validates skills in the current project and/or the central vault.

Usage:
    python3 validate_skills.py                # Validate project skills
    python3 validate_skills.py --vault        # Validate vault skills
    python3 validate_skills.py --all          # Validate both
    python3 validate_skills.py SKILL_NAME     # Validate specific skill
"""

import os
import re
import sys
import argparse
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
    
    return Path(__file__).parent.parent / "skills"


def validate_skill(skill_path: Path) -> list:
    """
    Validate a single skill.
    
    Returns list of error/warning messages.
    """
    issues = []
    skill_name = skill_path.name
    skill_md = skill_path / "SKILL.md"
    
    # Check SKILL.md exists
    if not skill_md.exists():
        issues.append(f"❌ {skill_name}: Missing SKILL.md")
        return issues
    
    try:
        content = skill_md.read_text(encoding='utf-8')
    except Exception as e:
        issues.append(f"❌ {skill_name}: Cannot read SKILL.md - {e}")
        return issues
    
    # Check for frontmatter or header
    has_frontmatter = content.strip().startswith("---")
    has_header = re.search(r'^#\s+', content, re.MULTILINE)
    
    if not (has_frontmatter or has_header):
        issues.append(f"❌ {skill_name}: Missing frontmatter or top-level heading")
    
    if has_frontmatter:
        fm_match = re.search(r'^---\s*(.*?)\s*---', content, re.DOTALL)
        if fm_match:
            fm_content = fm_match.group(1)
            
            # Check required fields
            if "name:" not in fm_content:
                issues.append(f"⚠️  {skill_name}: Frontmatter missing 'name:'")
            if "description:" not in fm_content:
                issues.append(f"⚠️  {skill_name}: Frontmatter missing 'description:'")
            
            # Check name matches directory
            name_match = re.search(r'^name:\s*["\']?([^"\'\n]+)', fm_content, re.MULTILINE)
            if name_match:
                declared_name = name_match.group(1).strip()
                if declared_name != skill_name:
                    issues.append(f"⚠️  {skill_name}: Name mismatch (frontmatter says '{declared_name}')")
        else:
            issues.append(f"❌ {skill_name}: Malformed frontmatter")
    
    # Check file size (warn if too large)
    lines = content.count('\n')
    if lines > 500:
        issues.append(f"⚠️  {skill_name}: SKILL.md is {lines} lines (recommended: <500)")
    
    # Check for common directories
    has_scripts = (skill_path / "scripts").exists()
    has_references = (skill_path / "references").exists()
    
    # Optional: check for version
    if "version:" not in content.lower() and "**version:**" not in content.lower():
        issues.append(f"ℹ️  {skill_name}: No version specified")
    
    return issues


def validate_directory(skills_dir: Path, label: str = "Project") -> tuple:
    """
    Validate all skills in a directory.
    
    Returns (skill_count, issues_list)
    """
    print(f"\n🔍 Validating {label} skills: {skills_dir}\n")
    
    if not skills_dir.exists():
        print(f"❌ Directory not found: {skills_dir}")
        return 0, []
    
    all_issues = []
    skill_count = 0
    
    for item in sorted(skills_dir.iterdir()):
        # Skip hidden and non-directories
        if item.name.startswith('.') or not item.is_dir():
            continue
        
        # Check if it's a skill (has SKILL.md)
        if not (item / "SKILL.md").exists():
            # Could be a category directory - check children
            for child in item.iterdir():
                if child.is_dir() and (child / "SKILL.md").exists():
                    issues = validate_skill(child)
                    all_issues.extend(issues)
                    skill_count += 1
                    if not issues:
                        print(f"  ✅ {child.name}")
            continue
        
        issues = validate_skill(item)
        all_issues.extend(issues)
        skill_count += 1
        
        if not issues:
            print(f"  ✅ {item.name}")
    
    return skill_count, all_issues


def main():
    parser = argparse.ArgumentParser(
        description="Validate skill structure and metadata",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("skill", nargs="?", help="Specific skill to validate")
    parser.add_argument("--vault", action="store_true", help="Validate vault skills")
    parser.add_argument("--all", action="store_true", help="Validate both project and vault")
    parser.add_argument("--quiet", "-q", action="store_true", help="Only show issues")
    
    args = parser.parse_args()
    
    total_skills = 0
    all_issues = []
    
    if args.skill:
        # Validate specific skill
        project_skill = get_project_skills_dir() / args.skill
        vault_skill = VAULT_DIR / args.skill
        
        if project_skill.exists():
            issues = validate_skill(project_skill)
            all_issues.extend(issues)
            print(f"Project skill: {args.skill}")
            total_skills += 1
        
        if vault_skill.exists():
            issues = validate_skill(vault_skill)
            all_issues.extend([f"[vault] {i}" for i in issues])
            print(f"Vault skill: {args.skill}")
            total_skills += 1
        
        if not project_skill.exists() and not vault_skill.exists():
            print(f"❌ Skill '{args.skill}' not found in project or vault")
            sys.exit(1)
    
    else:
        # Validate directories
        if not args.vault or args.all:
            count, issues = validate_directory(get_project_skills_dir(), "Project")
            total_skills += count
            all_issues.extend(issues)
        
        if args.vault or args.all:
            count, issues = validate_directory(VAULT_DIR, "Vault")
            total_skills += count
            all_issues.extend([f"[vault] {i}" for i in issues])
    
    # Summary
    print("\n" + "─" * 50)
    print(f"📊 Validated: {total_skills} skills")
    
    if all_issues:
        print(f"\n⚠️  Issues found: {len(all_issues)}\n")
        for issue in all_issues:
            print(f"  {issue}")
        sys.exit(1)
    else:
        print("✨ All skills passed validation!")
        sys.exit(0)


if __name__ == "__main__":
    main()
