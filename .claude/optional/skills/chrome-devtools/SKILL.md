---
name: chrome-devtools
description: Use when debugging web applications in the browser, inspecting DOM elements, testing UI interactions, analyzing network requests, or capturing screenshots. Requires Chrome DevTools MCP server.
allowed-tools: mcp__chrome-devtools__take_snapshot, mcp__chrome-devtools__take_screenshot, mcp__chrome-devtools__click, mcp__chrome-devtools__fill, mcp__chrome-devtools__navigate_page, mcp__chrome-devtools__list_console_messages, mcp__chrome-devtools__list_network_requests, mcp__chrome-devtools__hover, mcp__chrome-devtools__press_key, mcp__chrome-devtools__evaluate_script, mcp__chrome-devtools__list_pages, mcp__chrome-devtools__select_page, mcp__chrome-devtools__performance_start_trace
---

# Chrome DevTools Integration

## Required Rules

**Load these rules when debugging reveals code issues:**
- `troubleshooting` - Debugging strategies and common issues
- `error-handling` - If console shows error handling issues

## Overview

Use Chrome DevTools MCP tools for browser automation, debugging, and testing web applications.

## Prerequisites

Ensure Chrome DevTools MCP server is connected:
```bash
claude mcp add chrome-devtools -- npx @anthropic-ai/mcp-devtools@latest
```

## Core Workflows

### 1. Page Inspection

**Get page structure:**
```
mcp__chrome-devtools__take_snapshot
```
Returns accessibility tree with `uid` identifiers for each element.

**Capture screenshot:**
```
mcp__chrome-devtools__take_screenshot
```

### 2. Element Interaction

**Click elements:**
```
mcp__chrome-devtools__click(uid: "element-uid")
```

**Fill forms:**
```
mcp__chrome-devtools__fill(uid: "input-uid", value: "text")
```

**Fill multiple fields:**
```
mcp__chrome-devtools__fill_form(elements: [{uid: "email", value: "test@example.com"}, ...])
```

**Hover for tooltips:**
```
mcp__chrome-devtools__hover(uid: "element-uid")
```

**Keyboard input:**
```
mcp__chrome-devtools__press_key(key: "Enter")
mcp__chrome-devtools__press_key(key: "Control+A")
```

### 3. Navigation

**Navigate to URL:**
```
mcp__chrome-devtools__navigate_page(type: "url", url: "http://localhost:3000")
```

**Reload:**
```
mcp__chrome-devtools__navigate_page(type: "reload")
```

**Back/Forward:**
```
mcp__chrome-devtools__navigate_page(type: "back")
mcp__chrome-devtools__navigate_page(type: "forward")
```

### 4. Debugging

**Check console logs:**
```
mcp__chrome-devtools__list_console_messages
```

**Get specific console message:**
```
mcp__chrome-devtools__get_console_message(msgid: 123)
```

**Inspect network requests:**
```
mcp__chrome-devtools__list_network_requests
```

**Get request details:**
```
mcp__chrome-devtools__get_network_request(reqid: 456)
```

### 5. Custom JavaScript

**Execute script in page:**
```
mcp__chrome-devtools__evaluate_script(function: "() => document.title")
```

**With element arguments:**
```
mcp__chrome-devtools__evaluate_script(
  function: "(el) => el.innerText",
  args: [{uid: "element-uid"}]
)
```

### 6. Performance Analysis

**Start performance trace:**
```
mcp__chrome-devtools__performance_start_trace(reload: true, autoStop: true)
```

**Stop trace:**
```
mcp__chrome-devtools__performance_stop_trace
```

**Analyze insights:**
```
mcp__chrome-devtools__performance_analyze_insight(insightSetId: "...", insightName: "LCPBreakdown")
```

### 7. Multi-Page Management

**List open pages:**
```
mcp__chrome-devtools__list_pages
```

**Select page:**
```
mcp__chrome-devtools__select_page(pageIdx: 0)
```

**Open new page:**
```
mcp__chrome-devtools__new_page(url: "http://localhost:3000/new-route")
```

## Common Testing Patterns

### Form Submission Test
1. `take_snapshot` - Get form structure
2. `fill_form` - Enter test data
3. `click` - Submit button
4. `wait_for` - Success message
5. `take_screenshot` - Document result

### API Response Verification
1. `navigate_page` - Load page
2. `list_network_requests(resourceTypes: ["fetch", "xhr"])`
3. `get_network_request` - Check response

### UI State Debugging
1. `take_snapshot` - Current state
2. `list_console_messages(types: ["error", "warn"])`
3. `evaluate_script` - Check component state

## Best Practices

- Always `take_snapshot` before interactions to get current `uid` values
- Use `wait_for` to ensure page is ready after navigation
- Filter network requests by type for cleaner output
- Check console for errors after each major action
- Use `fullPage: true` for complete page screenshots
