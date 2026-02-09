#!/bin/bash
# Copy all skills into the project template
# Skills go into .claude/skills/ with source-prefixed names to avoid conflicts

PROJECT="/Users/hillmanchan/Desktop/project-template-AI-rules"
SKILLS_DIR="$PROJECT/.claude/skills"
SRC="/tmp/skills-install"

copy_skill() {
    local src_dir="$1"
    local dest_name="$2"
    
    # Skip if destination already exists (don't overwrite existing template skills)
    if [ -d "$SKILLS_DIR/$dest_name" ]; then
        echo "SKIP (exists): $dest_name"
        return
    fi
    
    # Skip template SKILL.md files
    if [[ "$src_dir" == *"/template/"* ]]; then
        echo "SKIP (template): $src_dir"
        return
    fi
    
    mkdir -p "$SKILLS_DIR/$dest_name"
    cp -r "$src_dir"/* "$SKILLS_DIR/$dest_name/" 2>/dev/null
    echo "OK: $dest_name"
}

echo "=== ANTHROPIC OFFICIAL ==="
for dir in "$SRC"/anthropics-skills/skills/*/; do
    name=$(basename "$dir")
    copy_skill "$dir" "anthropic--$name"
done

echo ""
echo "=== UI/UX PRO MAX ==="
copy_skill "$SRC/ui-ux-pro-max/.claude/skills/ui-ux-pro-max" "ui-ux-pro-max"

echo ""
echo "=== PLANNING WITH FILES ==="
copy_skill "$SRC/planning-with-files/skills/planning-with-files" "planning-with-files"

echo ""
echo "=== CONTEXT ENGINEERING ==="
for dir in "$SRC"/context-engineering/skills/*/; do
    name=$(basename "$dir")
    copy_skill "$dir" "context-eng--$name"
done
# Also copy the root SKILL.md as the main context engineering skill
if [ -f "$SRC/context-engineering/SKILL.md" ]; then
    mkdir -p "$SKILLS_DIR/context-eng--overview"
    cp "$SRC/context-engineering/SKILL.md" "$SKILLS_DIR/context-eng--overview/"
    echo "OK: context-eng--overview"
fi

echo ""
echo "=== OBSIDIAN ==="
for dir in "$SRC"/obsidian-skills/skills/*/; do
    name=$(basename "$dir")
    copy_skill "$dir" "obsidian--$name"
done

echo ""
echo "=== SCIENTIFIC ==="
for dir in "$SRC"/scientific-skills/scientific-skills/*/; do
    name=$(basename "$dir")
    # Skip subdirectories that are just containers (like document-skills)
    if [ -f "$dir/SKILL.md" ]; then
        copy_skill "$dir" "scientific--$name"
    elif [ -d "$dir" ]; then
        # Handle nested skills (like document-skills/docx)
        for subdir in "$dir"/*/; do
            if [ -f "$subdir/SKILL.md" ]; then
                subname=$(basename "$subdir")
                copy_skill "$subdir" "scientific--${name}--${subname}"
            fi
        done
    fi
done

echo ""
echo "=== DEV BROWSER ==="
copy_skill "$SRC/dev-browser/skills/dev-browser" "dev-browser"

echo ""
echo "=== PLAYWRIGHT ==="
copy_skill "$SRC/playwright-skill/skills/playwright-skill" "playwright-skill"

echo ""
echo "=== TRAIL OF BITS SECURITY ==="
for plugin_dir in "$SRC"/trailofbits-skills/plugins/*/; do
    plugin_name=$(basename "$plugin_dir")
    for dir in "$plugin_dir"/skills/*/; do
        if [ -f "$dir/SKILL.md" ]; then
            name=$(basename "$dir")
            copy_skill "$dir" "trailofbits--$name"
        fi
    done
    # Handle case where SKILL.md is directly in skills/
    if [ -f "$plugin_dir/skills/SKILL.md" ]; then
        mkdir -p "$SKILLS_DIR/trailofbits--$plugin_name"
        cp -r "$plugin_dir"/skills/* "$SKILLS_DIR/trailofbits--$plugin_name/" 2>/dev/null
        echo "OK: trailofbits--$plugin_name"
    fi
done

echo ""
echo "=== VERCEL ==="
for dir in "$SRC"/vercel-skills/skills/*/; do
    name=$(basename "$dir")
    [[ "$name" == "claude.ai" ]] && continue  # Skip claude.ai specific
    copy_skill "$dir" "vercel--$name"
done
# Vercel deploy for claude.ai
if [ -d "$SRC/vercel-skills/skills/claude.ai/vercel-deploy-claimable" ]; then
    copy_skill "$SRC/vercel-skills/skills/claude.ai/vercel-deploy-claimable" "vercel--deploy-claimable"
fi

echo ""
echo "=== CLOUDFLARE ==="
for dir in "$SRC"/cloudflare-skills/skills/*/; do
    name=$(basename "$dir")
    copy_skill "$dir" "cloudflare--$name"
done

echo ""
echo "=== SUPABASE ==="
for dir in "$SRC"/supabase-skills/skills/*/; do
    name=$(basename "$dir")
    copy_skill "$dir" "supabase--$name"
done

echo ""
echo "=== STRIPE ==="
for dir in "$SRC"/stripe-skills/skills/*/; do
    name=$(basename "$dir")
    copy_skill "$dir" "stripe--$name"
done

echo ""
echo "=== EXPO ==="
for plugin_dir in "$SRC"/expo-skills/plugins/*/; do
    for dir in "$plugin_dir"/skills/*/; do
        if [ -f "$dir/SKILL.md" ]; then
            name=$(basename "$dir")
            copy_skill "$dir" "expo--$name"
        fi
    done
done

echo ""
echo "=== SENTRY ==="
for dir in "$SRC"/sentry-skills/plugins/sentry-skills/skills/*/; do
    name=$(basename "$dir")
    copy_skill "$dir" "sentry--$name"
done

echo ""
echo "=== BETTER AUTH ==="
for dir in "$SRC"/better-auth-skills/better-auth/*/; do
    if [ -f "$dir/SKILL.md" ]; then
        name=$(basename "$dir")
        copy_skill "$dir" "better-auth--$name"
    fi
done

echo ""
echo "=== NEON DATABASE ==="
for dir in "$SRC"/neon-skills/skills/*/; do
    name=$(basename "$dir")
    copy_skill "$dir" "neon--$name"
done

echo ""
echo "=== HASHICORP ==="
for category in "$SRC"/hashicorp-skills/*/; do
    cat_name=$(basename "$category")
    for subcategory in "$category"/*/; do
        for dir in "$subcategory"/skills/*/; do
            if [ -f "$dir/SKILL.md" ]; then
                name=$(basename "$dir")
                copy_skill "$dir" "hashicorp--$name"
            fi
        done
    done
done

echo ""
echo "=== REMOTION ==="
for dir in "$SRC"/remotion-skills/skills/*/; do
    name=$(basename "$dir")
    copy_skill "$dir" "remotion--$name"
done

echo ""
echo "=== MICROSOFT ==="
for dir in "$SRC"/microsoft-skills/.github/skills/*/; do
    name=$(basename "$dir")
    copy_skill "$dir" "microsoft--$name"
done
# Microsoft deep-wiki plugin skills
for dir in "$SRC"/microsoft-skills/.github/plugins/deep-wiki/skills/*/; do
    if [ -f "$dir/SKILL.md" ]; then
        name=$(basename "$dir")
        copy_skill "$dir" "microsoft--$name"
    fi
done

echo ""
echo "=== SANITY ==="
for dir in "$SRC"/sanity-skills/skills/*/; do
    name=$(basename "$dir")
    copy_skill "$dir" "sanity--$name"
done

echo ""
echo "=== WORDPRESS ==="
for dir in "$SRC"/wordpress-skills/skills/*/; do
    name=$(basename "$dir")
    copy_skill "$dir" "wordpress--$name"
done

echo ""
echo "=== FAL AI ==="
for dir in "$SRC"/fal-skills/skills/claude.ai/*/; do
    name=$(basename "$dir")
    copy_skill "$dir" "fal--$name"
done

echo ""
echo "=== GOOGLE STITCH ==="
for dir in "$SRC"/google-stitch-skills/skills/*/; do
    name=$(basename "$dir")
    copy_skill "$dir" "google--$name"
done

echo ""
echo "=== HUGGING FACE ==="
for dir in "$SRC"/huggingface-skills/skills/*/; do
    name=$(basename "$dir")
    copy_skill "$dir" "huggingface--$name"
done
# HF MCP skill
if [ -d "$SRC/huggingface-skills/hf-mcp/skills/hf-mcp" ]; then
    copy_skill "$SRC/huggingface-skills/hf-mcp/skills/hf-mcp" "huggingface--hf-mcp"
fi

echo ""
echo "=== DONE ==="
echo "Total skills installed:"
ls -d "$SKILLS_DIR"/*/ 2>/dev/null | wc -l
