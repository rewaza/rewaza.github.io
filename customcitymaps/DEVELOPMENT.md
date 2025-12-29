# Custom City Maps - Development Guide

## File Structure

```
customcitymaps/
├── index.html          # Original Shopify version (Liquid template)
├── index-local.html    # Local development version (pure HTML)
├── map-editor.css      # Shared CSS (works for both)
├── map-editor.js       # Shared JS (works for both)
└── DEVELOPMENT.md      # This file
```

## Local Development

### Running Locally

1. Open `index-local.html` directly in a browser, or
2. Use a local server (recommended for some features):
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Then open http://localhost:8000/index-local.html
   ```

### Debug Panel

Press `Ctrl+Shift+D` to toggle the debug panel which shows current form values.

---

## Converting: Local → Shopify

When you're ready to deploy changes to Shopify, follow these steps:

### 1. CSS File (`map-editor.css`)
- **No conversion needed!** 
- Upload directly to Shopify: `Settings → Files → Upload` or via Theme Editor
- The CSS works identically in both environments

### 2. JS File (`map-editor.js`)
- **No conversion needed!**
- Upload directly to Shopify
- The JS works identically in both environments

### 3. HTML → Liquid Template (`index-local.html` → `index.html`)

Apply these transformations:

| Local HTML | Shopify Liquid |
|------------|----------------|
| `<link rel="stylesheet" href="map-editor.css">` | `<link rel="stylesheet" href="{{ 'map-editor.css' \| asset_url }}">` |
| `<script src="map-editor.js"></script>` | `<script src="{{ 'map-editor.js' \| asset_url }}" defer></script>` |
| `$49.00` (or any price) | `{{ product.price \| money }}` |
| `<form id="local-cart-form">` | `{% form 'product', product %}` |
| `</form>` (for cart form) | `{% endform %}` |
| Remove `<!DOCTYPE>`, `<html>`, `<head>`, `<body>` tags | Shopify injects these from theme |
| Remove local-only `<script>` block at bottom | Not needed in Shopify |

### 4. Add Shopify Schema (at end of file)

```liquid
{% schema %}
{
  "name": "Map Editor",
  "settings": []
}
{% endschema %}
```

### 5. Add Hidden Variant ID Input

Inside the `{% form %}` block, add:
```liquid
<input type="hidden" name="id" value="{{ product.variants.first.id }}">
```

---

## Converting: Shopify → Local

When pulling updates from Shopify for local development:

### 1. CSS & JS Files
- Download from Shopify and replace local files directly

### 2. Liquid Template → HTML

| Shopify Liquid | Local HTML |
|----------------|------------|
| `{{ 'map-editor.css' \| asset_url }}` | `map-editor.css` |
| `{{ 'map-editor.js' \| asset_url }}` | `map-editor.js` |
| `{{ product.price \| money }}` | `$49.00` (or any placeholder) |
| `{% form 'product', product %}` | `<form id="local-cart-form">` |
| `{% endform %}` | `</form>` |
| `{{ product.variants.first.id }}` | Remove or use placeholder |
| `{% schema %}...{% endschema %}` | Remove entirely |
| Add `<!DOCTYPE>`, `<html>`, `<head>`, `<body>` wrappers |

---

## Quick Reference: Shopify Liquid Tags Used

```liquid
{{ 'filename.css' | asset_url }}     → URL to asset file
{{ product.price | money }}          → Formatted price
{{ product.variants.first.id }}      → Product variant ID
{% form 'product', product %}        → Cart form start
{% endform %}                        → Cart form end
{% schema %}...{% endschema %}       → Section schema (required)
```

---

## Development Workflow

1. **Make changes** in `index-local.html`, `map-editor.css`, `map-editor.js`
2. **Test locally** by opening `index-local.html` in browser
3. **Convert to Shopify** using the guide above
4. **Upload to Shopify**:
   - CSS/JS: Upload to Files or via Theme Editor
   - HTML: Paste into Shopify section template
5. **Test in Shopify** preview mode
6. **Publish** when ready

---

## Notes

- The `map-editor.css` and `map-editor.js` files are **identical** between local and Shopify
- Only the HTML wrapper differs (Liquid tags vs pure HTML)
- Keep `index.html` as a reference for the exact Shopify format
- The local version simulates "Add to Cart" with an alert showing the data
