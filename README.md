# 📈 TradePilot

Application d'analyse des marchés en temps réel avec signaux d'achat, installable
sur téléphone et ordinateur (PWA). Aucune dépendance, aucun serveur à payer :
tout tourne dans le navigateur + un robot GitHub Actions gratuit.

## Ce que fait l'appli

- **Crypto en temps réel** : cours en direct (WebSocket Binance), avec repli
  automatique sur CoinGecko si Binance est inaccessible. Indicateurs calculés
  sur bougies 1 h : RSI 14, MACD, EMA 20/50, momentum, pics de volume.
- **Actions & ETF (US + Europe)** : un robot GitHub Actions récupère les cours
  toutes les 30 min pendant les heures de marché, calcule les indicateurs et
  publie `data/stocks.json`.
- **Score 0–100 et signal clair** par actif : `ACHAT FORT` / `ACHAT` /
  `SURVEILLER` / `ÉVITER` (philosophie : suivre la tendance confirmée, éviter
  le surachat extrême).
- **Foule** : actifs les plus recherchés au monde (CoinGecko Trending), nombre de
  transactions réelles sur 24 h, indice Peur & Avidité.
- **Recherche & favoris** : recherche instantanée par nom ou symbole (insensible
  aux accents), étoile ⭐ pour épingler tes actifs en tête de liste, filtre
  « Favoris » dans chaque onglet.
- **Objectif 10 € → 10 000 €** : suivi du capital, journal des positions,
  calculateur de croissance composée honnête.
- **Sauvegarde** : export/import JSON de toutes tes données locales (capital,
  positions, alertes, favoris) — rien ne quitte ton appareil.

## Installation sur téléphone / ordinateur

1. Ouvre l'URL GitHub Pages du projet dans ton navigateur.
2. **Android/Chrome** : menu ⋮ → « Ajouter à l'écran d'accueil ».
   **iPhone/Safari** : Partager → « Sur l'écran d'accueil ».
   **Ordinateur** : icône d'installation dans la barre d'adresse.
3. L'appli fonctionne ensuite comme une application native, même hors-ligne
   (dernières données connues).

## Architecture

| Fichier | Rôle |
|---|---|
| `index.html` / `style.css` / `app.js` | Interface (PWA, 100 % statique) |
| `indicators.js` | Moteur d'indicateurs techniques (partagé navigateur/robot) |
| `scripts/fetch_stocks.mjs` | Robot : récupère et analyse les actions (stooq.com) |
| `scripts/test_*.mjs` | Tests unitaires, intégration et fumée |
| `.github/workflows/update-and-deploy.yml` | Tests → données → déploiement Pages, toutes les 30 min |
| `sw.js` / `manifest.webmanifest` | Mode hors-ligne et installation |

## Lancer en local

```bash
npm test          # tous les tests
npm run serve     # http://localhost:8080
```

## ⚠️ Avertissement

TradePilot est un outil d'**aide à la décision**, pas un conseiller financier.
Aucun algorithme ne prédit les marchés avec certitude ; les performances passées
ne préjugent pas des performances futures. Risque de perte totale du capital.
