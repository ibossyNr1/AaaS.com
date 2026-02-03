#!/usr/bin/env python3
"""
Vault Sync - Sync project assets to the central vault

Syncs skills, execution scripts, and directives from a project to the central vault,
automatically de-branding project-specific content.

Architecture:
    ~/.gemini/base/                          ← Template project
    ~/.gemini/[project]/                     ← Cloned projects (e.g., enora)
    ~/.gemini/antigravity-vault/             ← Central vault
        ├── skills/                          ← Reusable skills
        ├── execution/                       ← Generic scripts
        └── directives/                      ← Workflow instructions

Usage:
    python3 vault_sync.py                    # Interactive mode
    python3 vault_sync.py skills             # Sync only skills
    python3 vault_sync.py execution          # Sync only execution scripts
    python3 vault_sync.py directives         # Sync only directives
    python3 vault_sync.py --all              # Sync everything
    python3 vault_sync.py --diff             # Preview changes
    python3 vault_sync.py --from-vault       # Import from vault to project
"""

import os
import sys
import re
import shutil
import argparse
import filecmp
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional

# Configuration - scoped to ~/.gemini/
GEMINI_ROOT = Path.home() / ".gemini"
VAULT_DIR = GEMINI_ROOT / "antigravity-vault"
BACKUP_DIR = VAULT_DIR / ".backups"

# Asset types and their locations
ASSET_TYPES = {
    "skills": "skills",
    "execution": "execution",
    "directives": "directives",
}

# Patterns that indicate project-specific content (for de-branding)
PROJECT_PATTERNS = [
    (r'/Users/[^/]+/', '/Users/user/'),  # Normalize user paths
    (r'(?i)enora\.ai', '[BRAND_NAME]'),
    (r'(?i)enora', '[PROJECT_NAME]'),
    # Add more patterns as needed
]


def get_project_root() -> Path:
    """Find the current project root."""
    cwd = Path.cwd()
    
    # Check for project indicators
    for indicator in ["skills", "execution", ".gemini", "AGENTS.md"]:
        if (cwd / indicator).exists():
            return cwd
    
    # Walk up
    for parent in cwd.parents:
        if parent == GEMINI_ROOT.parent:
            break
        for indicator in ["skills", "execution"]:
            if (parent / indicator).exists():
                return parent
    
    return cwd


def get_project_name() -> str:
    """Get the current project name."""
    return get_project_root().name


def list_assets(asset_type: str, source: str = "project") -> List[str]:
    """List all assets of a given type."""
    if source == "project":
        base_dir = get_project_root() / ASSET_TYPES[asset_type]
    else:
        base_dir = VAULT_DIR / ASSET_TYPES[asset_type]
    
    if not base_dir.exists():
        return []
    
    assets = []
    for item in base_dir.iterdir():
        if item.name.startswith('.'):
            continue
        
        if asset_type == "skills":
            # Skills must have SKILL.md
            if item.is_dir() and (item / "SKILL.md").exists():
                assets.append(item.name)
        elif asset_type == "execution":
            # Execution: Python and shell scripts
            if item.is_file() and item.suffix in ['.py', '.sh']:
                assets.append(item.name)
        elif asset_type == "directives":
            # Directives: Markdown files
            if item.is_file() and item.suffix == '.md':
                assets.append(item.name)
    
    return sorted(assets)


def de_brand_content(content: str) -> str:
    """Remove project-specific branding from content."""
    for pattern, replacement in PROJECT_PATTERNS:
        content = re.sub(pattern, replacement, content)
    return content


def should_de_brand(file_path: Path) -> bool:
    """Determine if a file should be de-branded."""
    # Only de-brand text files
    text_extensions = ['.md', '.py', '.sh', '.json', '.yaml', '.yml', '.txt']
    return file_path.suffix.lower() in text_extensions


def create_backup(asset_type: str, asset_name: str) -> Optional[Path]:
    """Create a timestamped backup."""
    source = VAULT_DIR / ASSET_TYPES[asset_type] / asset_name
    if not source.exists():
        return None
    
    backup_type_dir = BACKUP_DIR / asset_type
    backup_type_dir.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    if source.is_dir():
        backup_path = backup_type_dir / f"{asset_name}_{timestamp}"
        shutil.copytree(source, backup_path)
    else:
        backup_path = backup_type_dir / f"{asset_name}_{timestamp}{source.suffix}"
        shutil.copy2(source, backup_path)
    
    return backup_path


def sync_asset(asset_type: str, asset_name: str, dry_run: bool = False, 
               de_brand: bool = True) -> bool:
    """Sync a single asset from project to vault."""
    project_dir = get_project_root()
    project_asset = project_dir / ASSET_TYPES[asset_type] / asset_name
    vault_asset = VAULT_DIR / ASSET_TYPES[asset_type] / asset_name
    
    if not project_asset.exists():
        print(f"❌ Not found in project: {asset_name}")
        return False
    
    # Ensure vault directory exists
    (VAULT_DIR / ASSET_TYPES[asset_type]).mkdir(parents=True, exist_ok=True)
    
    if dry_run:
        status = "UPDATE" if vault_asset.exists() else "NEW"
        print(f"  📋 [{status}] {asset_name}")
        return True
    
    # Create backup if updating
    if vault_asset.exists():
        backup = create_backup(asset_type, asset_name)
        if backup:
            print(f"  📦 Backup: {backup.relative_to(VAULT_DIR)}")
    
    # Sync
    if vault_asset.exists():
        if vault_asset.is_dir():
            shutil.rmtree(vault_asset)
        else:
            vault_asset.unlink()
    
    if project_asset.is_dir():
        shutil.copytree(project_asset, vault_asset)
        
        # De-brand files in the copied directory
        if de_brand:
            for file in vault_asset.rglob("*"):
                if file.is_file() and should_de_brand(file):
                    try:
                        content = file.read_text(encoding='utf-8')
                        new_content = de_brand_content(content)
                        if content != new_content:
                            file.write_text(new_content, encoding='utf-8')
                    except Exception:
                        pass
    else:
        if de_brand and should_de_brand(project_asset):
            content = project_asset.read_text(encoding='utf-8')
            vault_asset.write_text(de_brand_content(content), encoding='utf-8')
        else:
            shutil.copy2(project_asset, vault_asset)
    
    print(f"  ✅ Synced: {asset_name}")
    return True


def import_from_vault(asset_type: str, asset_name: str) -> bool:
    """Import an asset from vault to project."""
    vault_asset = VAULT_DIR / ASSET_TYPES[asset_type] / asset_name
    project_dir = get_project_root()
    project_asset = project_dir / ASSET_TYPES[asset_type] / asset_name
    
    if not vault_asset.exists():
        print(f"❌ Not found in vault: {asset_name}")
        return False
    
    # Ensure project directory exists
    (project_dir / ASSET_TYPES[asset_type]).mkdir(parents=True, exist_ok=True)
    
    if project_asset.exists():
        response = input(f"  ⚠️  {asset_name} exists. Overwrite? (y/N): ").strip().lower()
        if response != 'y':
            return False
        if project_asset.is_dir():
            shutil.rmtree(project_asset)
        else:
            project_asset.unlink()
    
    if vault_asset.is_dir():
        shutil.copytree(vault_asset, project_asset)
    else:
        shutil.copy2(vault_asset, project_asset)
    
    print(f"  ✅ Imported: {asset_name}")
    return True


def sync_type(asset_type: str, dry_run: bool = False):
    """Sync all assets of a given type."""
    assets = list_assets(asset_type, "project")
    
    if not assets:
        print(f"  (No {asset_type} found in project)")
        return
    
    print(f"\n{'🔍 Preview' if dry_run else '🔄 Syncing'}: {asset_type.upper()}")
    print(f"  Found {len(assets)} item(s)\n")
    
    for asset in assets:
        sync_asset(asset_type, asset, dry_run=dry_run)


def interactive_mode():
    """Interactive sync mode."""
    project = get_project_name()
    print(f"\n📁 Project: {project}")
    print(f"🏛️ Vault: {VAULT_DIR}\n")
    
    # Show summary
    for asset_type in ASSET_TYPES:
        project_count = len(list_assets(asset_type, "project"))
        vault_count = len(list_assets(asset_type, "vault"))
        print(f"  {asset_type.capitalize():12} Project: {project_count:3}  Vault: {vault_count:4}")
    
    print("\n" + "─" * 50)
    print("Options:")
    print("  1. Sync skills to vault")
    print("  2. Sync execution scripts to vault")
    print("  3. Sync directives to vault")
    print("  4. Sync all to vault")
    print("  5. Import from vault")
    print("  q. Quit")
    
    choice = input("\n> ").strip().lower()
    
    if choice == 'q':
        return
    elif choice == '1':
        sync_type("skills")
    elif choice == '2':
        sync_type("execution")
    elif choice == '3':
        sync_type("directives")
    elif choice == '4':
        for t in ASSET_TYPES:
            sync_type(t)
    elif choice == '5':
        asset_type = input("  Asset type (skills/execution/directives): ").strip().lower()
        if asset_type in ASSET_TYPES:
            assets = list_assets(asset_type, "vault")
            print(f"\n  Available in vault ({len(assets)}):")
            for i, a in enumerate(assets[:20], 1):
                print(f"    {i}. {a}")
            if len(assets) > 20:
                print(f"    ... and {len(assets) - 20} more")
            
            name = input("\n  Asset name to import: ").strip()
            if name:
                import_from_vault(asset_type, name)
    else:
        print("❌ Invalid option")


def main():
    parser = argparse.ArgumentParser(
        description="Sync project assets to the central vault",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("type", nargs="?", 
                        choices=["skills", "execution", "directives"],
                        help="Asset type to sync")
    parser.add_argument("--all", action="store_true", 
                        help="Sync all asset types")
    parser.add_argument("--diff", action="store_true", 
                        help="Preview changes without syncing")
    parser.add_argument("--from-vault", action="store_true",
                        help="Import from vault instead of syncing to vault")
    parser.add_argument("--no-debrand", action="store_true",
                        help="Skip de-branding step")
    
    args = parser.parse_args()
    
    # Ensure vault structure exists
    for asset_type in ASSET_TYPES:
        (VAULT_DIR / ASSET_TYPES[asset_type]).mkdir(parents=True, exist_ok=True)
    
    if args.from_vault:
        if not args.type:
            print("❌ Specify asset type with --from-vault")
            sys.exit(1)
        assets = list_assets(args.type, "vault")
        print(f"\n🏛️ Vault {args.type}: {len(assets)} available")
        for a in assets[:30]:
            print(f"  • {a}")
        return
    
    if args.all:
        print(f"\n{'🔍 Preview' if args.diff else '🔄 Syncing'} all assets to vault")
        for t in ASSET_TYPES:
            sync_type(t, dry_run=args.diff)
        return
    
    if args.type:
        sync_type(args.type, dry_run=args.diff)
        return
    
    # Interactive mode
    interactive_mode()


if __name__ == "__main__":
    main()
