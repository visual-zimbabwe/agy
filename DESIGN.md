# Design System Strategy: The Curated Infinite

## 1. Overview & Creative North Star
**Creative North Star: The Digital Atelier**
This design system moves away from the sterile, "app-like" feel of modern software and toward the tactile, intentional atmosphere of a high-end physical studio. It is designed for "Agy," an infinite spatial environment where thoughts are not just data points, but collectible objects. 

The system rejects the rigid, boxed-in nature of standard SaaS interfaces. Instead, it utilizes **Intentional Asymmetry** and **Tonal Depth** to create an editorial experience. By treating the canvas as a physical desk layered with vellum and heavy-stock paper, we provide the user with a sense of "high agency"—the feeling that they are a curator in a sophisticated, quiet space.

---

## 2. Colors & Materiality
The palette is a sophisticated interplay of warm neutrals and "confident" earth tones. We avoid synthetic vibrance in favor of pigments that feel mineral or organic.

### The Palette (Material Design Tokens)
*   **Background / Surface:** `#fcf9f4` (A warm, slightly aged paper white)
*   **Primary (Terracotta):** `#a33818` (Used for focus and high-intent actions)
*   **Secondary (Deep Forest):** `#4d6356` (Used for grounding elements and organizational markers)
*   **Tertiary (Muted Gold):** `#755717` (Used for highlighting and "collectible" statuses)
*   **On-Surface (Charcoal):** `#1c1c19` (A soft, ink-like black for maximum readability)

### The "No-Line" Rule
**Standard 1px solid borders are strictly prohibited.** To define sections, use:
1.  **Background Shifts:** Transition from `surface` to `surface-container-low`.
2.  **Negative Space:** Utilize the **Spacing Scale** (specifically `8` and `12`) to create mental boundaries through distance.
3.  **Soft Environmental Glows:** Use the `surface-tint` (`#a63a1a`) at 5% opacity to "wash" a section in a subtle hue.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
*   **The Canvas:** Uses `surface`.
*   **The Workspace:** Uses `surface-container-low`.
*   **The Note (The Object):** Uses `surface-container-lowest` (pure white) to appear as if it is sitting atop the beige canvas.
*   **Floating Chrome:** Use `surface-bright` with a **Backdrop Blur** (12px to 20px) to create a frosted glass (vellum) effect.

---

## 3. Typography
The typography is the "voice" of the system. We pair a high-contrast serif with a modern, functional sans-serif to bridge the gap between "Editorial" and "Utility."

*   **Display & Headlines (Newsreader):** This serif is our soul. Use `display-lg` and `headline-md` for user-generated titles and major section headers. It should feel like the masthead of a premium journal.
*   **UI & Notes (Manrope):** This sans-serif is our engine. Use `body-md` for the bulk of user notes. Its geometric but warm construction ensures readability at small scales while maintaining the "Quietly Brilliant" persona.
*   **Labels (Manrope):** Use `label-md` and `label-sm` in all-caps with `0.05rem` letter-spacing for UI meta-data (dates, tags, coordinates).

---

## 4. Elevation & Depth
In an infinite spatial environment, depth is more important than X/Y coordinates. We use **Tonal Layering** instead of structural lines.

### The Layering Principle
Do not use shadows to show "importance." Use them to show "physicality."
*   **Stationary Elements:** Use `surface-container` tiers with no shadow.
*   **The "Collectible" Note:** When a note is active or hovered, apply an **Ambient Shadow**: `0 10px 30px rgba(28, 28, 25, 0.06)`. Note the shadow color is a tint of our charcoal `on-surface`, not a generic grey.

### Glassmorphism & Vellum
Floating UI chrome (toolbars, navigation) must feel like frosted glass. 
*   **Style:** Background `surface` at 70% opacity + `backdrop-filter: blur(20px)`.
*   **The Ghost Border:** If a boundary is needed for accessibility, use `outline-variant` at 15% opacity. This creates a "specular highlight" on the edge of the glass rather than a hard line.

---

## 5. Components

### The "Collectible" Note (Primary Object)
Notes are the core of this system. They should feel like heavy paper stock.
*   **Surface:** `surface-container-lowest`
*   **Corner Radius:** `md` (0.375rem)
*   **Typography:** `title-md` for titles (Newsreader), `body-md` for content (Manrope).
*   **Padding:** Use `5` (1.7rem) for generous, luxurious margins.

### Buttons (High-Agency Actions)
*   **Primary:** Background `primary` (`#a33818`), Text `on-primary`. Use `full` roundedness for a pebble-like feel.
*   **Secondary:** Background `secondary-container`, Text `on-secondary-container`. 
*   **Tertiary (Text-only):** `title-sm` in `secondary`. No background.

### Input Fields (The Ink-on-Paper Experience)
*   **Style:** No container or "box." Just a subtle `outline-variant` bottom-border (at 20% opacity) that strengthens to `primary` when focused.
*   **Label:** `label-md` floating above the line in `on-surface-variant`.

### Floating Chrome (Navigation/Tools)
*   **Placement:** Detached from screen edges.
*   **Background:** Glassmorphic (`surface` @ 80% + blur).
*   **Shadow:** Large, soft ambient shadow (`40px` blur).

---

## 6. Do's and Don'ts

### Do
*   **Use Intentional White Space:** If you think a section needs a divider, first try adding `2rem` of empty space.
*   **Mix Typefaces:** Use the Serif for the "thought" and the Sans-Serif for the "tool."
*   **Embrace Grain:** Apply a very subtle SVG noise overlay (2-3% opacity) to the `surface` to simulate paper texture.

### Don't
*   **Don't use Purple:** The palette must remain grounded in warm neutrals and earth tones.
*   **Don't use "Full Black":** Always use the charcoal `on-surface` (`#1c1c19`) to keep the contrast high but soft.
*   **Don't use 90-degree corners:** Except for the screen itself, everything should have at least a `sm` or `md` radius to feel handled and organic.
*   **Don't use Dividers:** Avoid horizontal rules `<hr>`. Use a background shift to `surface-container-low` if separation is mandatory.