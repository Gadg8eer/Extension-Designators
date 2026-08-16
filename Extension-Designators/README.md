# Remix Designators

Tiny SillyTavern extension that registers custom cast macros for the Glitch Techs × Remix table.

Out of the box:

| Macro | Expands to | Meaning |
| --- | --- | --- |
| `{{p10}}` | Gadg8eer | GM persona |
| `{{char_cp2077_1}}` | Yucca | Cyberpunk 2077 mechanic |

These are real macros, so they work in character cards, World Info, Author's Note, prompts, Quick Replies, and STscript. Confirm with `/? macros` after enabling.

`{{char}}` and `{{user}}` still mean the current speaker and the current persona. These designators are extra named aliases.

## Install

1. Copy the `remix-designators` folder (the one that contains `manifest.json`) into one of:
   - Current user: `data/<your-handle>/extensions/remix-designators`
   - All users: `public/scripts/extensions/third-party/remix-designators`
2. Restart SillyTavern, or reload the page.
3. Open **Extensions** and enable **Remix Designators**.

Do not nest an extra wrapper folder. SillyTavern must see `.../remix-designators/manifest.json`.

## Edit the roster

Open **Extensions** → **Remix Designators**.

- **Key** becomes `{{key}}`. It must start with a letter and use only letters, digits, underscores, or hyphens (same rules as `{{$p10}}`).
- **Value** is the replacement text (usually a display name).
- **Note** is only for the settings list and the `/? macros` description.

Add a row for another player (`p86`) or another franchise NPC whenever you need one. Changes save automatically and re-register immediately.

**Reset defaults** restores the two built-in rows.

## Examples

```text
{{p10}} is on comms. {{char_cp2077_1}} is under the hood of the Quadra.
```

After substitution:

```text
Gadg8eer is on comms. Yucca is under the hood of the Quadra.
```

## Notes

- Values are looked up live. Renaming Yucca in settings updates the next prompt without a reload.
- Keys are not live links to persona or character cards. If you rename a persona in Persona Management, update the Value column here too.
- Duplicate keys (case-insensitive) are skipped after the first.
- Empty keys and empty values are ignored.
- Disable the extension to unregister every designator.

## Files

- `manifest.json` — extension metadata
- `index.js` — registration + settings drawer
