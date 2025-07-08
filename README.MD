## Установка docker на сервер

## По пути backend/.env => в FRONTEND_URL= в кавычках указать frontend url на ip либо домен сервера

## По пути frontend/.env => в VITE_BACKEND_URL в указать ip либо домен сервера

# В корне проекта после установки докера => docker compose up -d

## При первом запуске зайти в папку бекенд и сделать `env DATABASE_URL=postgresql://postgres:ddd000f34@localhost:5432/brand_market prisma db push` что бы засетапить базу 

# envs
```
# Database url всегда такая. Только если не поменяете пароль
DATABASE_URL="postgresql://postgres:ddd000f34@db:5432/brand_market"

JWT_SECRET=

API_URL=
FRONTEND_URL=

WESTWALLET_API_KEY=
WESTWALLET_SECRET_KEY=

CRYPTOBOT_API_TOKEN=
# позволяет использовать тестовые ключи от криптобота
CRYPTOBOT_USE_TESTNET=false

# список включённых платёжек через запятую
ENABLED_PAYMENTS=westwallet,cryptobot,btcpay
```