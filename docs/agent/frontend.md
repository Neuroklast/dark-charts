# Frontend

## Colors

CI palette in `app/globals.css` — see `AGENTS.md`.

## Lenis

Single `LenisProvider` in `app/providers.tsx`. Import `useLenis` from `@/components/animations/LenisProvider`.

## Images

Use `getSquareThumbnail()` / `getOptimizedImageUrl()` from `src/lib/imageUtils.ts`.

## Accessibility

- Skip link in `app/layout.tsx`
- WCAG 2.1 AA minimum on public pages

## i18n

`LanguageContext` (en/de). Thread strings via props from RSC parents when adding new UI.