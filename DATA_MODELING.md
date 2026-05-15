# Data Modeling: Items y Loans

## Descripción General

Este documento describe el modelado de datos para las entidades **Item** y **Loan** del sistema de préstamos de biblioteca. El esquema incluye validaciones de integridad referencial, índices optimizados para consultas comunes y restricciones de negocio.

## Entidades

### Item (tabla `items`)

Representa un artículo disponible para prestar en la biblioteca.

#### Campos

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid | Llave primaria, generada automáticamente |
| `code` | varchar(32) | Código único, indexado (ej. BK-0042, MG-0001) |
| `title` | varchar(255) | Título requerido del artículo |
| `type` | enum | Tipo: `book`, `magazine`, `equipment` |
| `isActive` | boolean | Soft delete, default: `true` |
| `createdAt` | timestamp | Marca de tiempo de creación, auto-establecida |
| `updatedAt` | timestamp | Marca de tiempo de actualización, auto-establecida |

#### Índices
- Índice único sobre `code`
- Relación OneToMany con `Loan`

### Loan (tabla `loans`)

Representa un préstamo de un artículo a un usuario.

#### Campos

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | uuid | Llave primaria, generada automáticamente |
| `userId` | uuid | FK → `User(id)`, ON DELETE RESTRICT |
| `itemId` | uuid | FK → `Item(id)`, ON DELETE RESTRICT |
| `loanedAt` | timestamptz | Fecha/hora del préstamo, requerida |
| `dueAt` | timestamptz | Fecha/hora de vencimiento, requerida; debe ser > `loanedAt` |
| `returnedAt` | timestamptz | Fecha/hora de devolución, nullable |
| `status` | enum | Estados: `active`, `returned`, `overdue`, `lost`; default: `active` |
| `priority` | enum | Prioridad: `normal`, `urgent`; default: `normal` |
| `fineAmount` | decimal(10,2) | Monto de multa por retraso, default: `0.00` |
| `createdAt` | timestamp | Marca de tiempo de creación, auto-establecida |
| `updatedAt` | timestamp | Marca de tiempo de actualización, auto-establecida |

#### Índices
- Índice compuesto sobre `(itemId, status)` — para verificar disponibilidad
- Índice compuesto sobre `(userId, status)` — para contar préstamos activos por usuario

#### Restricciones
- `ON DELETE RESTRICT` para las FK de User e Item (no se pueden eliminar mientras tengan préstamos)
- CHECK: `dueAt > loanedAt`

## Relaciones

```
User (1) ──── (N) Loan
Item (1) ──── (N) Loan
```

- **User → Loan**: Un usuario puede tener múltiples préstamos
- **Item → Loan**: Un artículo puede estar en múltiples préstamos (histórico)

## Reglas de Negocio Implementadas

1. **Soft Delete**: Items con `isActive = false` están marcados como inactivos pero no se eliminan
2. **Disponibilidad**: Un artículo solo puede estar prestado una vez (validado en el servicio, no con UNIQUE PARTIAL)
3. **Restricción de Eliminación**: No se puede eliminar un usuario o artículo si hay préstamos asociados
4. **Validación de Fechas**: `dueAt` siempre debe ser posterior a `loanedAt`
5. **Prioridad de Préstamo**: Los préstamos pueden marcarse como urgentes para gestión especial

## DTOs (Data Transfer Objects)

### Item DTOs

- `CreateItemDto`: Para crear nuevos artículos
  - `code`: Requerido, formato XX-NNNN
  - `title`: Requerido, max 255 caracteres
  - `type`: Requerido, enum

- `UpdateItemDto`: Para actualizar artículos existentes
  - Todos los campos opcionales

- `ItemResponseDto`: Para devolver datos de artículos

### Loan DTOs

- `CreateLoanDto`: Para crear nuevos préstamos
  - `userId`: Requerido, UUID
  - `itemId`: Requerido, UUID
  - `loanedAt`: Requerido, ISO 8601
  - `dueAt`: Requerido, ISO 8601
  - `priority`: Opcional, default: `normal`

- `UpdateLoanDto`: Para actualizar préstamos
  - `status`: Opcional, enum
  - `returnedAt`: Opcional, ISO 8601
  - `fineAmount`: Opcional, decimal

- `LoanResponseDto`: Para devolver datos de préstamos

## Migración TypeORM

La migración `1715794130000-InitialSchema.ts` crea:

1. Enum `item_type_enum` con valores: `book`, `magazine`, `equipment`
2. Tabla `items` con columnas y restricciones especificadas
3. Enum `loan_status_enum` con valores: `active`, `returned`, `overdue`, `lost`
4. Enum `loan_priority_enum` con valores: `normal`, `urgent`
5. Tabla `loans` con FK hacia `users` e `items`
6. Índices compuestos para optimización de consultas

### Ejecutar Migración

```bash
npm run migration:run
```

### Revertir Migración

```bash
npm run migration:revert
```

## Notas de Implementación

- **TypeORM**: Versión 0.3.20
- **Base de datos**: PostgreSQL
- **Sincronización**: `synchronize: false` — todas las cambios deben hacerse mediante migraciones
- **Importación automática**: Las entidades se importan automáticamente mediante el patrón `**/*.entity.ts`

## Flujo Típico de Préstamo

1. **Crear Préstamo**: Usuario envía `CreateLoanDto` con userId, itemId, fechas
2. **Validación**: Sistema verifica que:
   - El usuario existe y está activo
   - El artículo existe y está activo
   - El artículo no está prestado a otro usuario (status = 'active')
   - `dueAt > loanedAt`
3. **Registro**: Se crea registro en `loans` con status='active'
4. **Actualización**: Al devolver, se actualiza `returnedAt` y status='returned'
5. **Multas**: Si se devuelve tarde, se calcula y registra en `fineAmount`
