{
  "project": {
    "name": "FOMO AI (Public Assistant) — Light/Green Restyle + Floating Widget",
    "scope": {
      "in_scope": [
        "Full-page /utility/ai restyle from dark/purple to FOMO light/green",
        "Floating widget (collapsed bot-bubble → expanded compact chat panel) reusing same chat logic",
        "All interactive + key informational elements must include data-testid",
        "Mobile-first responsive (390px)"
      ],
      "out_of_scope": [
        "Admin/internal assistant (FOMO V2) — do not touch",
        "Backend logic changes (ask/conversations/credits/grounded answers)"
      ]
    },
    "brand_attributes": [
      "premium-but-light",
      "trustworthy fintech",
      "fast + calm",
      "green-led (no purple, no dark SaaS background)",
      "soft depth (shadows), not glossy"
    ]
  },

  "design_personality": {
    "style_fusion": [
      "Swiss-style clarity (grid, typography discipline)",
      "Soft glass-lite surfaces (frosted hints only on small accents)",
      "Bento utility layout (sidebar + main chat)",
      "Microinteraction-forward widget (launcher → panel)"
    ],
    "do_not": [
      "No purple anywhere",
      "No dark SaaS backgrounds",
      "No heavy gradients; gradients must be decorative and <= 20% viewport",
      "No gradient on text-heavy areas",
      "No transition: all"
    ]
  },

  "typography": {
    "font_pairing": {
      "primary": {
        "name": "Gilroy",
        "usage": "Use existing Gilroy (already in global_styles.css) for all UI to match platform brand",
        "fallback": "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
      },
      "mono": {
        "name": "ui-monospace",
        "usage": "Sources/coverage blocks, token-like labels, small technical metadata"
      }
    },
    "type_scale_tailwind": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-800 tracking-tight",
      "h2": "text-base md:text-lg font-600 text-foreground/80",
      "section_title": "text-sm font-600 tracking-wide uppercase text-muted-foreground",
      "body": "text-sm sm:text-base leading-6 text-foreground",
      "small": "text-xs leading-5 text-muted-foreground"
    },
    "chat_specific": {
      "message_user": "text-sm sm:text-base font-500",
      "message_assistant": "text-sm sm:text-base font-400",
      "answer_headings": "text-xs font-700 tracking-wide uppercase"
    }
  },

  "color_system": {
    "notes": [
      "Primary brand green must be #04A584.",
      "Use light theme surfaces: white + very pale green tints.",
      "Avoid green text on white for long paragraphs; use neutral text and green only for accents/interactive.",
      "All colors below are tokens; implement via CSS variables and map to Tailwind via existing setup (main agent)."
    ],
    "tokens": {
      "--fomo-green-500": "#04A584",
      "--fomo-green-600": "#037A63",
      "--fomo-green-50": "rgba(4,165,132,0.06)",
      "--fomo-green-100": "rgba(4,165,132,0.10)",
      "--fomo-green-200": "rgba(4,165,132,0.16)",

      "--bg": "#F7FBFA",
      "--surface": "#FFFFFF",
      "--surface-raised": "#FFFFFF",
      "--surface-tint": "#F1FBF7",

      "--text": "#0B1220",
      "--text-muted": "rgba(11,18,32,0.62)",
      "--text-subtle": "rgba(11,18,32,0.48)",

      "--border": "rgba(11,18,32,0.10)",
      "--border-strong": "rgba(11,18,32,0.16)",

      "--ring": "rgba(4,165,132,0.35)",

      "--success": "#04A584",
      "--warning": "#B7791F",
      "--danger": "#D64545",

      "--shadow-card": "0 10px 30px rgba(11,18,32,0.08)",
      "--shadow-float": "0 18px 50px rgba(11,18,32,0.14)",
      "--shadow-soft": "0 6px 18px rgba(11,18,32,0.08)",

      "--radius-card": "16px",
      "--radius-panel": "18px",
      "--radius-pill": "999px"
    },
    "allowed_gradients": {
      "hero_background_only": [
        "radial-gradient(900px circle at 20% 10%, rgba(4,165,132,0.14), transparent 55%), radial-gradient(700px circle at 80% 0%, rgba(4,165,132,0.10), transparent 50%)",
        "linear-gradient(135deg, rgba(4,165,132,0.10), rgba(4,165,132,0.04))"
      ],
      "accent_stroke": [
        "linear-gradient(180deg, rgba(4,165,132,0.35), rgba(4,165,132,0.10))"
      ]
    },
    "prohibited_gradients": [
      "blue-500 to purple-600",
      "purple-500 to pink-500",
      "green-500 to blue-500",
      "red to pink",
      "any dark/saturated gradient combo"
    ]
  },

  "layout_and_grid": {
    "full_page_utility_ai": {
      "layout": "Two-column: left conversations sidebar + right main chat",
      "grid": {
        "desktop": "Sidebar 320px fixed; main fluid; max content width 1120px",
        "tablet": "Sidebar collapses into Sheet/Drawer; main full width",
        "mobile": "Single column; conversations accessible via Sheet; input sticky bottom"
      },
      "spacing": {
        "page_padding": "px-4 sm:px-6 lg:px-8",
        "section_gaps": "gap-4 sm:gap-6",
        "message_gap": "space-y-3",
        "card_padding": "p-4 sm:p-5"
      }
    },
    "floating_widget": {
      "placement": {
        "default": "bottom-right",
        "safe_area": "Respect mobile safe-area inset; keep 16px from edges",
        "ad_widget_coordination": "If ad widget exists in same corner, offset AI widget upward by 84–96px OR allow stacking with a small vertical gap (12px)."
      },
      "sizes": {
        "collapsed": "56x56 (desktop), 52x52 (mobile)",
        "expanded": "~380x560 desktop; 360x520 on 390px screens; max-height: 78vh"
      },
      "z_index": {
        "widget": "z-[60]",
        "expanded_panel": "z-[70]",
        "tooltip": "z-[80]"
      }
    }
  },

  "components": {
    "shadcn_component_paths": {
      "button": "/app/frontend/src/components/ui/button.jsx",
      "badge": "/app/frontend/src/components/ui/badge.jsx",
      "card": "/app/frontend/src/components/ui/card.jsx",
      "tabs": "/app/frontend/src/components/ui/tabs.jsx",
      "scroll_area": "/app/frontend/src/components/ui/scroll-area.jsx",
      "separator": "/app/frontend/src/components/ui/separator.jsx",
      "sheet": "/app/frontend/src/components/ui/sheet.jsx",
      "dialog": "/app/frontend/src/components/ui/dialog.jsx",
      "tooltip": "/app/frontend/src/components/ui/tooltip.jsx",
      "popover": "/app/frontend/src/components/ui/popover.jsx",
      "dropdown_menu": "/app/frontend/src/components/ui/dropdown-menu.jsx",
      "textarea": "/app/frontend/src/components/ui/textarea.jsx",
      "input": "/app/frontend/src/components/ui/input.jsx",
      "skeleton": "/app/frontend/src/components/ui/skeleton.jsx",
      "sonner": "/app/frontend/src/components/ui/sonner.jsx"
    },
    "custom_components_to_create_js": {
      "FomoAiWidgetLauncher": {
        "purpose": "Collapsed bot bubble with idle animation + unread dot + tooltip",
        "key_elements": [
          "SparklesIcon/bot icon",
          "soft shadow",
          "ring on hover/focus",
          "optional hint tooltip"
        ]
      },
      "FomoAiWidgetPanel": {
        "purpose": "Expanded compact chat panel with header, messages, chips, input",
        "key_elements": [
          "Header: bot identity + Credits pill + collapse button",
          "ScrollArea message list",
          "Operation chips row",
          "Composer with estimated cost + credits balance"
        ]
      },
      "GroundedAnswerBlocks": {
        "purpose": "Assistant answer formatting: FOMO DATA + Analysis + Sources + Coverage",
        "key_elements": [
          "Tabs or accordion for sections",
          "Sources list with external link icon",
          "Coverage meter (Progress)"
        ]
      }
    }
  },

  "component_specs": {
    "operation_picker_chips": {
      "visual": {
        "container": "flex flex-wrap gap-2",
        "chip_base": "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-600",
        "chip_idle": "bg-white text-[color:var(--text)] border-[color:var(--border)]",
        "chip_hover": "hover:border-[color:var(--fomo-green-500)] hover:bg-[color:var(--fomo-green-50)]",
        "chip_active": "bg-[color:var(--fomo-green-50)] border-[color:var(--fomo-green-500)] text-[color:var(--text)]",
        "chip_focus": "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2"
      },
      "interaction": {
        "transition": "transition-colors duration-200",
        "a11y": "Use role=tablist/tab if implemented with Tabs; otherwise buttons with aria-pressed"
      },
      "test_ids": {
        "container": "ai-operation-picker",
        "chip": "ai-operation-chip-<operation-key>"
      }
    },

    "chat_messages": {
      "message_row": "grid grid-cols-[32px_1fr] gap-3",
      "avatar": "h-8 w-8 rounded-full bg-[color:var(--surface-tint)] border border-[color:var(--border)]",
      "bubble_common": "rounded-2xl px-4 py-3 shadow-[var(--shadow-soft)]",
      "bubble_user": "bg-[color:var(--fomo-green-50)] border border-[color:var(--fomo-green-200)]",
      "bubble_assistant": "bg-white border border-[color:var(--border)]",
      "meta_line": "mt-1 text-xs text-[color:var(--text-subtle)]",
      "test_ids": {
        "message": "ai-message-<message-id>",
        "assistant_bubble": "ai-assistant-message-bubble",
        "user_bubble": "ai-user-message-bubble"
      }
    },

    "credits_pill": {
      "visual": {
        "base": "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-600",
        "ok": "bg-white border-[color:var(--border)] text-[color:var(--text)]",
        "low": "bg-[color:var(--fomo-green-50)] border-[color:var(--fomo-green-200)]",
        "insufficient": "bg-[#FFF5F5] border-[rgba(214,69,69,0.25)] text-[#8A1F1F]"
      },
      "test_ids": {
        "pill": "ai-credits-pill",
        "balance": "ai-credits-balance"
      }
    },

    "composer": {
      "layout": "sticky bottom-0 bg-[color:var(--bg)]/80 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--bg)]/70",
      "container": "rounded-[var(--radius-panel)] border border-[color:var(--border)] bg-white shadow-[var(--shadow-card)]",
      "textarea": "min-h-[44px] max-h-[140px] resize-none",
      "footer_row": "flex items-center justify-between gap-3 pt-2",
      "cost": "text-xs text-[color:var(--text-subtle)]",
      "actions": "flex items-center gap-2",
      "send_button": "rounded-full",
      "test_ids": {
        "textarea": "ai-composer-textarea",
        "send": "ai-composer-send-button",
        "estimated_cost": "ai-estimated-cost",
        "credits_balance": "ai-composer-credits-balance"
      }
    },

    "welcome_state": {
      "headline": "What do you want to know?",
      "layout": "center-left aligned within main panel; avoid full center alignment",
      "visual": {
        "container": "rounded-[var(--radius-card)] border border-[color:var(--border)] bg-white p-5 shadow-[var(--shadow-card)]",
        "accent": "Add small sparkles icon in green; keep subtle"
      },
      "test_ids": {
        "container": "ai-welcome-state",
        "headline": "ai-welcome-headline"
      }
    },

    "grounded_answer": {
      "structure": [
        "FOMO DATA (facts)",
        "Analysis (reasoning)",
        "Sources (links)",
        "Coverage (how complete)"
      ],
      "recommended_ui": {
        "desktop": "Tabs for quick switching",
        "mobile": "Accordion to reduce horizontal overflow"
      },
      "shadcn": {
        "tabs": "Tabs",
        "accordion": "Accordion",
        "progress": "Progress",
        "badge": "Badge"
      },
      "test_ids": {
        "container": "ai-grounded-answer",
        "tab": "ai-grounded-answer-tab-<key>",
        "sources": "ai-grounded-answer-sources",
        "coverage": "ai-grounded-answer-coverage"
      }
    }
  },

  "floating_widget_states": {
    "collapsed": {
      "visual": {
        "shape": "squircle-ish circle (rounded-full) with subtle inner highlight",
        "bg": "white",
        "border": "1px solid var(--border)",
        "shadow": "var(--shadow-float)",
        "icon": "SparklesIcon or Bot icon in --fomo-green-500"
      },
      "idle_animation": {
        "principle": "Breathing + tiny drift (transform only)",
        "css": "@keyframes fomoFloat { 0%,100%{ transform: translateY(0) scale(1);} 50%{ transform: translateY(-2px) scale(1.02);} }",
        "timing": "2.8s ease-in-out infinite",
        "reduced_motion": "Disable animation when prefers-reduced-motion"
      },
      "hover": {
        "effect": "Increase ring + slightly stronger shadow",
        "transition": "transition-shadow transition-colors duration-200"
      },
      "test_ids": {
        "button": "ai-widget-launcher-button",
        "tooltip": "ai-widget-launcher-tooltip"
      }
    },
    "expanded": {
      "panel": {
        "surface": "bg-white",
        "border": "border border-[color:var(--border)]",
        "radius": "rounded-[var(--radius-panel)]",
        "shadow": "shadow-[var(--shadow-float)]",
        "backdrop": "No full-screen overlay on desktop; on mobile use Sheet-like behavior if needed"
      },
      "header": {
        "layout": "flex items-center justify-between gap-3",
        "left": "bot avatar + title 'FOMO AI' + small status dot",
        "right": "Credits pill + collapse button",
        "test_ids": {
          "header": "ai-widget-panel-header",
          "collapse": "ai-widget-collapse-button"
        }
      },
      "body": {
        "messages": "ScrollArea with padding",
        "test_ids": {
          "messages": "ai-widget-messages"
        }
      },
      "footer": {
        "chips": "Operation chips row (wrap)",
        "composer": "Textarea + send",
        "test_ids": {
          "chips": "ai-widget-operation-chips",
          "composer": "ai-widget-composer"
        }
      }
    },
    "expand_collapse_animation": {
      "constraints": "Only transform + opacity",
      "recommended": {
        "duration_ms": "200–260",
        "easing": "cubic-bezier(0.2, 0.9, 0.2, 1) (spring-like feel without physics)",
        "from_collapsed_to_panel": {
          "transform": "translateY(10px) scale(0.92) → translateY(0) scale(1)",
          "opacity": "0 → 1"
        },
        "from_panel_to_collapsed": {
          "transform": "translateY(6px) scale(0.96)",
          "opacity": "1 → 0"
        }
      },
      "implementation_hint": "Use Framer Motion if already present; otherwise CSS transitions on a wrapper div. Ensure transform-origin: bottom right."
    }
  },

  "micro_interactions": {
    "buttons": {
      "primary": {
        "shape": "rounded-full",
        "base": "bg-[color:var(--fomo-green-500)] text-white",
        "hover": "hover:bg-[color:var(--fomo-green-600)]",
        "active": "active:scale-[0.98]",
        "focus": "focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2",
        "transition": "transition-colors duration-200"
      },
      "secondary": {
        "base": "bg-white border border-[color:var(--border)]",
        "hover": "hover:bg-[color:var(--surface-tint)] hover:border-[color:var(--border-strong)]",
        "active": "active:scale-[0.99]",
        "transition": "transition-colors duration-200"
      },
      "ghost": {
        "base": "bg-transparent",
        "hover": "hover:bg-[color:var(--fomo-green-50)]",
        "transition": "transition-colors duration-200"
      }
    },
    "links": {
      "explore_fomo_intel": {
        "style": "text-[color:var(--fomo-green-600)] underline-offset-4 hover:underline",
        "icon": "ExternalLink icon (lucide-react)"
      }
    },
    "loading": {
      "skeleton": "Use shadcn Skeleton with subtle green tint background",
      "typing_indicator": "3 dots with opacity pulse (transform/opacity only)"
    }
  },

  "accessibility": {
    "requirements": [
      "WCAG AA contrast for text",
      "Visible focus rings (use --ring)",
      "prefers-reduced-motion: disable idle float + reduce expand/collapse",
      "Do not rely on green alone for status; pair with icon/label",
      "Keyboard: launcher button focusable; Escape collapses widget; Tab cycles within panel"
    ]
  },

  "data_testid_convention": {
    "rules": [
      "kebab-case",
      "describe role not appearance",
      "apply to: buttons, links, inputs, menus, key info (credits, cost, errors)"
    ],
    "examples": [
      "data-testid=\"ai-widget-launcher-button\"",
      "data-testid=\"ai-operation-chip-market-brief\"",
      "data-testid=\"ai-composer-send-button\"",
      "data-testid=\"ai-credits-balance\"",
      "data-testid=\"ai-insufficient-credits-banner\""
    ]
  },

  "instructions_to_main_agent": [
    "Restyle /utility/ai to light theme: set page background to --bg, cards to white, borders to --border, text to --text; remove any purple/dark tokens.",
    "Keep chat logic intact; only change presentation + add widget wrapper that reuses same context/hooks.",
    "Implement floating widget with two states: collapsed launcher and expanded panel. Use transform/opacity transitions only (200–260ms). transform-origin bottom right.",
    "Use shadcn ScrollArea for message list; Tabs on desktop for grounded answer sections; Accordion on mobile.",
    "Add Credits pill everywhere credits are shown; include insufficient credits state styling and disable send.",
    "Ensure no conflict with existing ad widget: offset position or stack with gap; keep z-index controlled.",
    "Add data-testid to all interactive elements and key info fields per spec.",
    "Do not introduce purple gradients; keep gradients decorative and <=20% viewport. Prefer solid surfaces for reading areas.",
    "Use Gilroy as primary font (already loaded)."
  ]
}

<General UI UX Design Guidelines>  
    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms
    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text
   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json

 **GRADIENT RESTRICTION RULE**
NEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc
NEVER use dark gradients for logo, testimonial, footer etc
NEVER let gradients cover more than 20% of the viewport.
NEVER apply gradients to text-heavy content or reading areas.
NEVER use gradients on small UI elements (<100px width).
NEVER stack multiple gradient layers in the same viewport.

**ENFORCEMENT RULE:**
    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors

**How and where to use:**
   • Section backgrounds (not content backgrounds)
   • Hero section header content. Eg: dark to light to dark color
   • Decorative overlays and accent elements only
     • Hero section with 2-3 mild color
   • Gradients creation can be done for any angle say horizontal, vertical or diagonal

- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**

</Font Guidelines>

- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. 
   
- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.

- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.
   
- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly
    Eg: - if it implies playful/energetic, choose a colorful scheme
           - if it implies monochrome/minimal, choose a black–white/neutral scheme

**Component Reuse:**
	- Prioritize using pre-existing components from src/components/ui when applicable
	- Create new components that match the style and conventions of existing components when needed
	- Examine existing components to understand the project's component patterns before creating new ones

**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component

**Best Practices:**
	- Use Shadcn/UI as the primary component library for consistency and accessibility
	- Import path: ./components/[component-name]

**Export Conventions:**
	- Components MUST use named exports (export const ComponentName = ...)
	- Pages MUST use default exports (export default function PageName() {...})

**Toasts:**
  - Use `sonner` for toasts"
  - Sonner component are located in `/app/src/components/ui/sonner.tsx`

Use 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.
</General UI UX Design Guidelines>
