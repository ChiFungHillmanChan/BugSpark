# Synchronize Translation Files

Procedure for ensuring translation keys in English (primary language) are present in all other supported language files.

## Purpose

Maintain consistency and completeness across localizations, preventing missing translations in the user interface.

## Scope

All JSON translation files in the `messages/` directory, including both main files and feature-specific namespace files.

## Guidelines

### 1. Identify Primary Language

English (`en`) translation files are the source of truth:
- `messages/en.json` (main)
- `messages/en/*.json` (feature namespaces)

### 2. Identify Target Languages

All other language directories within `messages/`:
- `messages/zh-TW.json`
- `messages/zh-TW/*.json`
- (Any other languages)

### 3. Synchronization Process

For each namespace/file type:

1. **Iterate through Keys**: For every key and nested key in the primary language file
2. **Check Existence in Target**: Verify same key structure exists in target language
3. **Add Missing Keys**:
   - If key/namespace is missing in target, add it
   - Provide accurate translation OR mark for translation: `"key": "[NEEDS TRANSLATION] English text"`
4. **Delete Extra Keys**: If key exists in target but NOT in primary, DELETE it from target

### 4. Handling Feature-Specific Files

If primary language has feature-specific file (e.g., `en/assignments.json`):
- Ensure corresponding files exist for all target languages
- If missing, create by copying structure from primary
- Translate or add placeholders for values

### 5. Value Synchronization (Recommended)

If English value has significantly changed in meaning, review and update corresponding translations in target languages.

### 6. Update Documentation

After synchronization, ensure `readme/structure.md` reflects translation file structure including any newly added files or namespaces.

## Example Scenario

**Primary (en/common.json):**
```json
{
  "common": {
    "newFeatureButton": "New Feature"
  }
}
```

**Target (zh-TW/common.json) - Missing Key:**
```json
{
  "common": {
    // newFeatureButton is missing
  }
}
```

**Action:**
```json
{
  "common": {
    "newFeatureButton": "新功能"
  }
}
```
Or if translation unavailable:
```json
{
  "common": {
    "newFeatureButton": "[NEEDS TRANSLATION] New Feature"
  }
}
```

## Synchronization Checklist

For each target language:
- [ ] All keys from primary language exist in target
- [ ] No extra keys exist in target that aren't in primary
- [ ] All feature namespace files exist in target
- [ ] Translations are accurate (or marked for review)
- [ ] `readme/structure.md` is updated if files added

## Tooling Recommendations

- Consider scripts to automate detection of missing keys
- Use i18n-specific linters to identify missing translations
- Implement as pre-commit or pre-PR check

## Workflow

### Manual Sync

```bash
# 1. Compare English and target files
diff messages/en.json messages/zh-TW.json

# 2. For each namespace
diff messages/en/assignments.json messages/zh-TW/assignments.json

# 3. Add missing keys with translations or placeholders
# 4. Remove extra keys not in English
# 5. Update documentation
```

### Automated Check (Recommended)

Create a script that:
1. Recursively reads all keys from English files
2. Checks existence in each target language
3. Reports missing keys
4. Optionally auto-adds placeholders

## Common Issues

### Missing Namespace File
**Problem**: `messages/zh-TW/newFeature.json` doesn't exist
**Solution**: Create file with same structure as `messages/en/newFeature.json`, translate values

### Extra Keys in Target
**Problem**: Target has keys that primary doesn't have (stale translations)
**Solution**: Remove extra keys from target to maintain sync

### Nested Key Mismatch
**Problem**: Nested structure differs between primary and target
**Solution**: Ensure exact same nesting structure, add missing nested keys
