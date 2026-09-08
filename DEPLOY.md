# Деплой math-club на Layero (РФ, бесплатный тариф)

Требования: Node.js 20+, аккаунт на https://app.layero.ru

## 1. Вход в Layero

```powershell
cd C:\disk_d\QA_MANUAL\math-club
npx layero@latest login
```

Откройте ссылку из терминала и подтвердите код.

## 2. Имя организации (один раз)

```powershell
npx layero@latest username ваш-логин
```

## 3. База данных Layero

```powershell
npx layero@latest db create math-club
```

Сохраните строку подключения — она показывается **один раз**.

Подключите БД к проекту (после первого деплоя, шаг 4):

```powershell
npx layero@latest db connect math-club
```

## 4. Переменные окружения

```powershell
# Секрет сессии (сгенерируйте случайную строку 32+ символов)
npx layero@latest env set SESSION_SECRET="ВАШ_СЛУЧАЙНЫЙ_СЕКРЕТ_32_СИМВОЛА"
```

Если БД Layero выдаёт токен отдельно:

```powershell
npx layero@latest env set TURSO_AUTH_TOKEN="токен_из_layero_db_create"
```

`DATABASE_URL` задаётся автоматически командой `db connect`.

## 5. Первый деплой (preview)

```powershell
npx layero@latest deploy --name math-club --yes
```

## 6. Публикация в production

```powershell
npx layero@latest deploy --prod --yes
```

## 7. Начальные данные (один раз)

После деплоя, с production DATABASE_URL из панели Layero:

```powershell
$env:DATABASE_URL="libsql://..."
$env:TURSO_AUTH_TOKEN="..."
npm run db:seed
```

## 8. Свой домен .ru (опционально)

```powershell
npx layero@latest domains
```

В панели app.layero.ru добавьте домен и настройте CNAME у регистратора.

## Полезные команды

```powershell
npx layero@latest whoami          # текущий аккаунт
npx layero@latest deploys           # список деплоев
npx layero@latest logs              # логи сборки
npx layero@latest logs --runtime    # логи приложения
npx layero@latest diagnose          # разбор ошибки деплоя
npx layero@latest env list          # переменные (без значений)
```

## Учётные записи по умолчанию

| Роль | Логин | Пароль |
|------|-------|--------|
| Учитель | admin | admin |
| Родители | math | math14 |
