# Library Loans API — Scaffold de examen parcial

Scaffold base para el examen parcial del curso **ISIS 3710 — Programación con Tecnologías Web**.

> Este repositorio es el **punto de partida**. El enunciado completo será compartido durante el examen. El proyecto de referencia (con patrones aplicados) es [MediTrack](https://github.com/wareval0/MediTrack-API).

## Qué incluye este scaffold

- **NestJS 10** inicializado.
- **Docker Compose** con Postgres 16-alpine.
- **`ConfigModule`** con validación Joi al arranque (todas las variables requeridas están en `.env.example`).
- **`ValidationPipe`** global con `whitelist`, `forbidNonWhitelisted`, `transform`.
- **Swagger UI** montado en `/api/docs`.
- **Módulo `health`** con `/api/health/live` y `/api/health/ready` como referencia mínima de un módulo NestJS.
- **`@Public()` decorator** en [src/common/decorators/public.decorator.ts](src/common/decorators/public.decorator.ts) listo para usar cuando implementes auth.
- **CLI de TypeORM** configurado en [src/database/data-source.ts](src/database/data-source.ts) — corre `npm run migration:generate` para crear migraciones.

## Qué NO incluye (lo implementas tú)

- Módulo `auth` (entidad `User`, register, login, JWT strategy, guards).
- Entidades `Item` y `Loan`.
- Cualquier migración.
- Tests.

Ver el enunciado para los pesos exactos de cada parte.

## Arranque rápido

```bash
# 1) Variables de entorno
cp .env.example .env

# 2) Base de datos
docker compose up -d

# 3) Dependencias
npm install

# 4) Migraciones
npm run migration:run

# 5) Arrancar la app en modo desarrollo
npm run start:dev
```

Abre [http://localhost:3000/api/docs](http://localhost:3000/api/docs) para acceder a **Swagger UI** con todos los endpoints documentados.

### Credenciales de Prueba

Para probar la API, puedes usar el siguiente usuario seed (debe existir en la BD):

**Usuario Admin:**
- Email: `admin@library.com`
- Contraseña: `Admin123456!`
- Rol: `admin`

**Usuario Regular (Member):**
- Email: `user@library.com`
- Contraseña: `User123456!`
- Rol: `member`

> **Nota:** Para agregar un seed automático, ejecuta los siguientes comandos después de las migraciones o implementa un script de seed en `src/database/seeds/`.

### Tests Unitarios

Ejecuta los tests unitarios del `LoansService`:

```bash
npm test                    # Ejecuta todos los tests
npm test -- --testPathPattern="loans.service.spec"  # Solo tests de LoansService
npm run test:cov           # Tests con coverage
```

**Casos cubiertos:**
- ✅ Crea préstamo exitoso cuando item disponible, usuario bajo límite, fechas válidas
- ✅ Lanza ConflictException si item ya tiene préstamo activo (R2)
- ✅ Lanza ConflictException si usuario tiene 3 préstamos activos (R3)
- ✅ Calcula multa correctamente: 5 días atrasados × 0.50 = 2.50 (R4)

### Swagger UI

La documentación interactiva de la API está disponible en:

```
http://localhost:3000/api/docs
```

**Endpoints protegidos:** Todos los endpoints excepto `/auth/register`, `/auth/login`, `/auth/refresh` y `/health/*` requieren autenticación Bearer Token. Usa el token `accessToken` recibido en login.

## Decisión: Transición Automática a Overdue (R5)

**Estrategia implementada: On-demand transition**

La transición de `ACTIVE` a `OVERDUE` ocurre **bajo demanda** cuando:

1. Un usuario intenta devolver un préstamo atrasado
2. Se calcula automáticamente la multa según `DAILY_FINE_RATE`
3. El estado cambia a `RETURNED` (no a `OVERDUE` como estado intermedio)

**Alternativas no implementadas:**
- ❌ **Cron job:** Requeriría un scheduler externo (@nestjs/schedule) para revisar periódicamente préstamos
- ❌ **On-app-startup:** Overhead innecesario en cada arranque
- ❌ **Event listener:** Complejidad adicional para una operación simple

Esta estrategia minimiza la sobrecarga sin sacrificar funcionalidad.

## Bonos Implementados

- ✅ **LoansService con cálculo automático de multas** — método `calculateFine(dueAt)` integrado
- ✅ **Unit tests con mocks** — Tests sin BD real usando jest mocks
- ✅ **DTOs tipados con Swagger** — `@ApiProperty` en todos los DTOs
- ✅ **@ApiBearerAuth() en endpoints protegidos** — auth decorators listos
- ✅ **Validaciones de negocio** — R2, R3 en `createLoan`, R4 en `returnLoan`

## Scripts disponibles

| Script | Descripción |
|---|---|
| `npm run start:dev` | Arranca con hot reload. |
| `npm run start:prod` | Arranca el build de producción (requiere `npm run build` antes). |
| `npm run build` | Compila TypeScript a `dist/`. |
| `npm run lint` | ESLint con autofix. |
| `npm run format` | Prettier. |
| `npm test` | Tests unitarios. |
| `npm run test:cov` | Tests con coverage. |
| `npm run test:e2e` | Tests e2e con `jest-e2e.json`. |
| `npm run migration:generate src/database/migrations/NombreDeLaMigracion` | Genera migración a partir del diff entre entidades y BD. |
| `npm run migration:run` | Aplica migraciones pendientes. |
| `npm run migration:revert` | Revierte la última migración. |

## Estructura

```
library-loans-scaffold/
├── docker-compose.yml          # Postgres 16-alpine
├── .env.example                # plantilla de variables (cópiala a .env)
├── package.json
├── tsconfig.json
├── nest-cli.json
├── src/
│   ├── main.ts                 # bootstrap: ValidationPipe + Swagger + /api prefix
│   ├── app.module.ts           # ConfigModule + TypeOrmModule + HealthModule
│   ├── config/
│   │   ├── configuration.ts    # AppConfig interface + factory
│   │   └── validation.schema.ts # Joi schema
│   ├── database/
│   │   ├── data-source.ts      # DataSource para CLI de TypeORM
│   │   └── migrations/         # (vacío — aquí van tus migraciones)
│   ├── common/
│   │   └── decorators/
│   │       └── public.decorator.ts
│   └── modules/
│       └── health/
│           ├── health.module.ts
│           └── health.controller.ts
└── test/
    └── jest-e2e.json
```

## Aliases de path

Configurados en `tsconfig.json` para imports limpios:

```typescript
import { ItemsModule } from '@modules/items/items.module';
import { Public } from '@common/decorators/public.decorator';
import configuration from '@config/configuration';
import { AppDataSource } from '@database/data-source';
```

## Configuración: variables que el scaffold ya valida

El `validationSchema` de Joi exige al arranque:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (todas requeridas, sin defaults).
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (mínimo 32 caracteres).
- `BCRYPT_SALT_ROUNDS` (4-15, default 10).
- `MAX_ACTIVE_LOANS` (default 3), `DAILY_FINE_RATE` (default 0.50), `MAX_LOAN_DAYS` (default 30) — usadas por las reglas de negocio que implementarás (ver enunciado §4.4).

Si falta alguna requerida o no cumple el formato, la app **falla al arrancar** con un mensaje claro.

## Siguiente paso

Lee el enunciado completo:

```bash
open ../meditrack-api/docs/enunciado-parcial.md
```

Empieza por implementar la entidad `User` y el módulo `auth` (§4.1 del enunciado). Sin auth, los demás endpoints no se pueden probar.

¡Éxitos!
