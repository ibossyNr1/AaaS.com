import os
import glob
import subprocess
import sys

def search_skills_in_path(query, directory, label):
    """
    Scans SKILL.md files in a specific directory for keywords.
    """
    matches = []
    if not os.path.exists(directory):
        return matches
    
    query_terms = query.lower().split()
    
    # Iterate over all SKILL.md files in the directory
    for skill_file in glob.glob(os.path.join(directory, "*", "SKILL.md")):
        try:
            with open(skill_file, 'r') as f:
                content = f.read().lower()
                
            skill_name = os.path.basename(os.path.dirname(skill_file))
            score = 0
            
            # Simple keyword matching
            for term in query_terms:
                if term in content:
                    score += 1
            
            # Boost score if name matches
            if any(term in skill_name.lower() for term in query_terms):
                score += 2
                
            if score > 0:
                matches.append((score, skill_name, skill_file))
        except Exception:
            continue
            
    # Sort by score descending
    matches.sort(key=lambda x: x[0], reverse=True)
    return matches

def search_remote_skills(query):
    """
    Executes 'npx skills find' to get remote suggestions.
    """
    try:
        # Use npx skills find (non-interactive mode with --yes)
        result = subprocess.run(
            ["npx", "--yes", "skills", "find", query], 
            capture_output=True, 
            text=True,
            timeout=15
        )
        return result.stdout
    except Exception as e:
        return f"Error searching remote skills: {str(e)}"

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 discover.py \"<query>\"")
        sys.exit(1)
        
    query = sys.argv[1]
    print(f"🔍 Searching capabilities for: '{query}'...")
    
    # Tier 1: Local Project Skills
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    local_skills_dir = os.path.join(base_dir, "skills")
    local_hits = search_skills_in_path(query, local_skills_dir, "Local")
    
    # Tier 2: The Vault
    vault_skills_dir = "/Users/user/.gemini/antigravity-vault/skills"
    vault_hits = search_skills_in_path(query, vault_skills_dir, "Vault")
    
    if local_hits or vault_hits:
        if local_hits:
            print("\n✅ **FOUND INSTALLED SKILLS (Local):**")
            for score, name, path in local_hits[:5]:
                rel_path = os.path.relpath(path, os.getcwd())
                print(f"- **{name}** (Relevance: {score})\n  Path: `{rel_path}`")
        
        if vault_hits:
            print("\n🏛️ **FOUND IN THE VAULT:**")
            for score, name, path in vault_hits[:5]:
                print(f"- **{name}** (Relevance: {score})\n  Path: `{path}`")
                
        print("\n(Use current skills before installing new ones!)")
        print("\nRecommendation: Use the local or vault skill found.")
    else:
        # Tier 3: Remote
        print("\n🌐 **CHECKING SKILLS.SH ...**")
        remote_output = search_remote_skills(query)
        if remote_output.strip():
            print(remote_output)
        else:
            print("No exact remote match found, or CLI output was unstructured.")
            print("Try browsing https://skills.sh/")

if __name__ == "__main__":
    main()
