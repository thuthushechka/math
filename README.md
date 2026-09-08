# Математический кружок — учёт посещений и задач

Бесплатный веб-сайт для учёта посещений математического кружка (классы 4–7).

## Возможности

- **Учитель (admin/admin):** загрузка фото доски (OCR), ручной ввод, журнал, справочник учеников, настройки
- **Родители (math/math14):** просмотр журнала класса, оплата за прошлый/текущий месяц
- Soft-delete, архив, подтверждение удаления словом «УДАЛИТЬ»
- Резервное копирование SQLite

## Локальная разработка

```bash
cd math-club
npm install
cp .env.example .env
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

### Учётные записи по умолчанию

| Роль | Логин | Пароль |
|------|-------|--------|
| Учитель | `admin` | `admin` |
| Родители | `math` | `math14` |

Пароли меняются в `/admin/settings`.

## Деплой на Layero (РФ, бесплатно) — рекомендуется

Подробная инструкция: [DEPLOY.md](./DEPLOY.md)

```powershell
cd math-club
npx layero@latest login
npx layero@latest username ваш-логин
npx layero@latest deploy --name math-club --yes
npx layero@latest db create math-club
npx layero@latest db connect math-club
npx layero@latest env set SESSION_SECRET="случайная-строка-32-символа"
npx layero@latest deploy --prod --yes
# seed один раз с production DATABASE_URL
npm run db:seed
```

Сайт будет на `*.layero.app`. Свой `.ru` — через `layero domains` (тариф Pro) или DNS у регистратора.

## Деплой на Vercel + Turso (альтернатива)

### 1. Turso — база данных

```bash
# Установите Turso CLI: https://docs.turso.tech/cli
turso auth signup
turso db create math-club
turso db show math-club --url
turso db tokens create math-club
```

### 2. GitHub

```bash
git init
git add .
git commit -m "Initial math club app"
git remote add origin https://github.com/YOUR_USER/math-club.git
git push -u origin main
```

### 3. Vercel

1. Импортируйте репозиторий на [vercel.com](https://vercel.com)
2. Добавьте переменные окружения:

| Переменная | Значение |
|------------|----------|
| `DATABASE_URL` | `libsql://your-db.turso.io` |
| `TURSO_AUTH_TOKEN` | токен из Turso CLI |
| `SESSION_SECRET` | случайная строка (32+ символов) |

3. Build Command: `prisma generate && prisma migrate deploy && npm run db:seed && next build`

   Или добавьте в `package.json`:
   ```json
   "build": "prisma generate && prisma migrate deploy && next build"
   ```
   и выполните seed вручную после первого деплоя.

### 4. Первый запуск на production

После деплоя выполните seed (один раз):

```bash
# Локально с production DATABASE_URL
DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npm run db:seed
```

### 5. Еженедельный бэкап (Turso)

```bash
turso db shell math-club .dump > backup-$(date +%Y-%m-%d).sql
```

Или используйте кнопку «Скачать бэкап БД» в `/admin/settings` (для локального SQLite).

## Структура

```
src/
├── app/
│   ├── login/          # Вход
│   ├── parent/         # Кабинет родителей
│   └── admin/          # Админка учителя
├── components/         # JournalTable, PhotoUpload, ...
└── lib/                # auth, db, ocr-parser, name-matcher
```

## Технологии

- Next.js 16, React 19, Tailwind CSS 4
- Prisma + SQLite (локально) / Turso libSQL (production)
- Tesseract.js (OCR в браузере)
- Fuse.js (fuzzy-match имён)
- bcrypt + JWT cookie-сессии

## Лицензия

MIT
