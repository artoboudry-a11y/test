# Bibliothèque de Templates

> **Instruction pour Claude :** Quand un utilisateur demande de créer une page (login, landing, dashboard, etc.), **cherche d'abord dans `templates/`** le template correspondant. Copie-le et adapte-le au contexte du projet au lieu de repartir de zéro.

---

## Catalogue

### `auth/` — Authentification (login + inscription)
| Fichier | Stack | Description |
|---------|-------|-------------|
| `nextjs/page.tsx` | Next.js + Tailwind | Page login/register avec onglets, OAuth Google, validation, responsive |
| `html/page.html` | HTML/CSS/JS vanilla | Même design, zéro dépendance |

### `landing/` — Page d'accueil / Landing page
| Fichier | Stack | Description |
|---------|-------|-------------|
| `nextjs/page.tsx` | Next.js + Tailwind | Hero + features + témoignages + CTA + footer |
| `html/page.html` | HTML/CSS/JS vanilla | Même design, zéro dépendance |

### `dashboard/` — Tableau de bord admin
| Fichier | Stack | Description |
|---------|-------|-------------|
| `nextjs/page.tsx` | Next.js + Tailwind | Sidebar collapsible + header + stats + activité |

### `profile/` — Page profil utilisateur
| Fichier | Stack | Description |
|---------|-------|-------------|
| `nextjs/page.tsx` | Next.js + Tailwind | Photo + formulaire + mot de passe + zone danger |

### `settings/` — Page paramètres
| Fichier | Stack | Description |
|---------|-------|-------------|
| `nextjs/page.tsx` | Next.js + Tailwind | Général + notifications (toggles) + confidentialité |

### `pricing/` — Page tarifs
| Fichier | Stack | Description |
|---------|-------|-------------|
| `nextjs/page.tsx` | Next.js + Tailwind | 3 plans + toggle mensuel/annuel + FAQ accordéon |

### `error-pages/` — Pages d'erreur
| Fichier | Stack | Description |
|---------|-------|-------------|
| `nextjs/not-found.tsx` | Next.js + Tailwind | Page 404 |
| `nextjs/error.tsx` | Next.js + Tailwind | Page erreur globale (500) avec retry |

### `layout/` — Composants de mise en page
| Fichier | Stack | Description |
|---------|-------|-------------|
| `nextjs/navbar.tsx` | Next.js + Tailwind | Navbar responsive + hamburger mobile + glassmorphism |
| `nextjs/footer.tsx` | Next.js + Tailwind | Footer multi-colonnes |
| `nextjs/sidebar.tsx` | Next.js + Tailwind | Sidebar collapsible réutilisable (props) |

---

## Comment utiliser un template

1. Identifier le template dans le catalogue ci-dessus
2. Copier le fichier dans le projet cible
3. Personnaliser les constantes en haut du fichier (`APP_NAME`, `features[]`, etc.)
4. Brancher la logique métier (handlers, API calls)

## Design System commun

- **Couleur primaire :** `indigo-600` (chercher "indigo" pour changer)
- **Border radius :** `rounded-xl` / `rounded-2xl`
- **Ombres :** `shadow-sm` / `shadow-xl`
- **Typographie :** Inter (via `next/font/google`)
- **Responsive :** Mobile-first, breakpoints `sm:` / `md:` / `lg:`
- **Langue UI :** Français par défaut
