# Servicios, Controladores y DTOs - Implementación Completada

## 📋 Resumen

Implementación de `ItemsModule` y `LoansModule` con controladores, servicios, DTOs validados y documentación Swagger. Todos los endpoints autenticados con JWT.

## 🏗️ Módulos Creados

### ItemsModule
- **Archivo**: `src/modules/auth/items.module.ts`
- **Servicio**: `ItemsService`
- **Controlador**: `ItemsController`
- **Rutas**: 
  - `POST /items` - Crear item (201)
  - `GET /items` - Listar items (200)
  - `GET /items/:id` - Detalle (200)
  - `PATCH /items/:id` - Actualizar (200)
  - `DELETE /items/:id` - Soft delete (204)

### LoansModule
- **Archivo**: `src/modules/auth/loans.module.ts`
- **Servicio**: `LoansService`
- **Controlador**: `LoansController`
- **Rutas**:
  - `POST /loans` - Crear préstamo (201)
  - `GET /loans` - Listar préstamos (200)
  - `GET /loans/:id` - Detalle (200)
  - `PATCH /loans/:id/return` - Marcar devuelto (200)
  - `PATCH /loans/:id/mark-lost` - Marcar perdido (200)

## 📁 Archivos Creados

### Servicios
1. **`src/modules/auth/items.service.ts`** (153 líneas)
   - `create(CreateItemDto)`: Crear item con validación de código único
   - `findAll(type?)`: Listar items activos con cálculo de `isAvailable`
   - `findOne(id)`: Obtener detalle de item
   - `update(id, UpdateItemDto)`: Actualizar título o tipo
   - `remove(id)`: Soft delete
   - `checkItemAvailability()`: Verificar si item está disponible

2. **`src/modules/auth/loans.service.ts`** (179 líneas)
   - `create(CreateLoanDto)`: Crear préstamo con validaciones
   - `findAll(userId?, itemId?, status?)`: Listar con filtros
   - `findOne(id)`: Obtener detalle
   - `markAsReturned(id)`: Marcar devuelto y calcular multa
   - `markAsLost(id)`: Marcar como perdido

### Controladores
1. **`src/modules/auth/items.controller.ts`** (91 líneas)
   - Todos los endpoints protegidos con `@UseGuards(JwtAuthGuard)`
   - Decoradores Swagger: `@ApiBearerAuth()`, `@ApiOperation()`, `@ApiResponse()`
   - Códigos HTTP correctos: 201 POST, 200 GET/PATCH, 204 DELETE

2. **`src/modules/auth/loans.controller.ts`** (127 líneas)
   - Todos los endpoints protegidos
   - Decoradores Swagger completos
   - Códigos HTTP correctos

### Módulos
1. **`src/modules/auth/items.module.ts`**
   - Registra Item y Loan en TypeORM
   - Exporta ItemsService

2. **`src/modules/auth/loans.module.ts`**
   - Registra Loan, Item y User en TypeORM
   - Exporta LoansService

## 📝 DTOs Actualizados

### Item DTOs
- `CreateItemDto`:
  - `code`: string (regex XX-NNNN, máx 32)
  - `title`: string (máx 255)
  - `type`: ItemType enum

- `UpdateItemDto`: todos opcionales
  - `title`: string opcional
  - `type`: ItemType opcional

- `ItemResponseDto`:
  - ✨ `isAvailable`: boolean (calculado en tiempo real)
  - Todos los campos del item

### Loan DTOs
- `CreateLoanDto`:
  - `userId`: UUID v4
  - `itemId`: UUID v4
  - `dueAt`: ISO 8601 date string
  - `priority`: enum opcional (default 'normal')

- `UpdateLoanDto`:
  - `status`: enum opcional
  - `returnedAt`: date string opcional
  - `fineAmount`: decimal opcional

- `LoanResponseDto`: todos los campos del loan

## 🔐 Autenticación

- ✅ Todos los endpoints requieren JWT
- ✅ `@ApiBearerAuth()` en todos los controladores
- ✅ `@UseGuards(JwtAuthGuard)` en todos los controladores
- ✅ Sin decorador `@Public()`

## ✅ Validaciones Implementadas

### ItemsService
- ✓ Código único (ConflictException si duplicado)
- ✓ Item activo requerido
- ✓ No eliminar si hay préstamos activos
- ✓ Calcular isAvailable en cada consulta

### LoansService
- ✓ Usuario existe y está activo
- ✓ Item existe y está activo
- ✓ Item no está prestado a otro usuario
- ✓ dueAt > loanedAt
- ✓ Calcular multa automáticamente si hay retraso
- ✓ Multa = días de retraso × tarifa diaria (dailyFineRate)
- ✓ No devolver préstamo si no está activo
- ✓ No marcar perdido si ya está devuelto

## 📊 Filtros Implementados

### GET /items
- `?type=book|magazine|equipment` - Filtrar por tipo

### GET /loans
- `?userId=<uuid>` - Filtrar por usuario
- `?itemId=<uuid>` - Filtrar por item
- `?status=active|returned|overdue|lost` - Filtrar por estado

## 🧮 Cálculos Automáticos

### isAvailable (ItemsService)
```typescript
isAvailable = !existsActiveLoan(itemId)
// true si no hay préstamo activo
// false si hay préstamo activo
```

### fineAmount (LoansService)
```typescript
if (returnedAt > dueAt) {
  daysLate = Math.ceil((returnedAt - dueAt) / (1000*60*60*24))
  fineAmount = daysLate * dailyFineRate // configurable
}
```

## 📋 Códigos HTTP Implementados

| Endpoint | Método | Código | Descripción |
|----------|--------|--------|-------------|
| /items | POST | 201 | Creado |
| /items | GET | 200 | OK |
| /items/:id | GET | 200 | OK |
| /items/:id | PATCH | 200 | OK |
| /items/:id | DELETE | 204 | Sin contenido |
| /items/:id | GET | 404 | No encontrado |
| /items | POST | 409 | Conflicto (código duplicado) |
| /loans | POST | 201 | Creado |
| /loans | GET | 200 | OK |
| /loans/:id | GET | 200 | OK |
| /loans/:id/return | PATCH | 200 | OK |
| /loans/:id/mark-lost | PATCH | 200 | OK |
| /loans/:id | GET | 404 | No encontrado |
| /loans | POST | 400 | Inválido (DTO/regla negocio) |
| /loans | POST | 404 | Recurso no encontrado |
| /loans | POST | 409 | Conflicto (item prestado) |

## 🔧 Configuración Utilizada

```typescript
loans: {
  maxActivePerUser: 3      // máximo préstamos por usuario
  dailyFineRate: 0.50      // multa diaria por retraso
  maxLoanDays: 30          // días máximos de préstamo
}
```

## 📚 Documentación Swagger

Todos los endpoints incluyen:
- `@ApiOperation()` con descripción
- `@ApiResponse()` con códigos y tipos
- `@ApiQuery()` para parámetros opcionales
- `@ApiBearerAuth()` indicando autenticación
- `@ApiProperty()` en DTOs

Accede a Swagger en: `http://localhost:3000/api/docs`

## 🚀 Actualización AppModule

```typescript
@Module({
  imports: [
    // ... ConfigModule, TypeOrmModule
    AuthModule,
    ItemsModule,    // ← NUEVO
    LoansModule,    // ← NUEVO
    HealthModule,
  ],
})
export class AppModule {}
```

## 📝 Ejemplo de Uso

### Crear Item
```bash
POST /items
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "BK-0042",
  "title": "Clean Code",
  "type": "book"
}

# Respuesta 201
{
  "id": "...",
  "code": "BK-0042",
  "title": "Clean Code",
  "type": "book",
  "isActive": true,
  "isAvailable": true,
  "createdAt": "2026-05-15T...",
  "updatedAt": "2026-05-15T..."
}
```

### Crear Préstamo
```bash
POST /loans
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "<user-uuid>",
  "itemId": "<item-uuid>",
  "dueAt": "2026-05-30T23:59:59Z",
  "priority": "normal"
}

# Respuesta 201
{
  "id": "...",
  "userId": "...",
  "itemId": "...",
  "loanedAt": "2026-05-15T...",
  "dueAt": "2026-05-30T23:59:59Z",
  "returnedAt": null,
  "status": "active",
  "priority": "normal",
  "fineAmount": "0.00",
  "createdAt": "2026-05-15T...",
  "updatedAt": "2026-05-15T..."
}
```

### Devolver Préstamo (con multa si hay retraso)
```bash
PATCH /loans/<loan-id>/return
Authorization: Bearer <token>

# Respuesta 200
{
  "id": "...",
  "status": "returned",
  "returnedAt": "2026-05-31T10:00:00Z",  // 1 día de retraso
  "fineAmount": "0.50"                    // 1 día × $0.50
}
```

## ✨ Características Implementadas

- ✅ Autenticación JWT en todos los endpoints
- ✅ Validación con class-validator
- ✅ Documentación Swagger completa
- ✅ Códigos HTTP correctos
- ✅ Manejo de errores (404, 400, 409)
- ✅ Soft delete para items
- ✅ Cálculo automático de multas
- ✅ Disponibilidad de items en tiempo real
- ✅ Filtros opcionales en listados
- ✅ Transacciones de base de datos

## 🔄 Flujos Implementados

### Flujo de Préstamo
1. Crear préstamo (POST /loans)
2. Validar usuario y item
3. Verificar disponibilidad
4. Crear registro
5. Retornar con estado ACTIVE

### Flujo de Devolución
1. Marcar como devuelto (PATCH /loans/:id/return)
2. Calcular multa si hay retraso
3. Actualizar status a RETURNED
4. Retornar con fineAmount

### Flujo de Item Perdido
1. Marcar como perdido (PATCH /loans/:id/mark-lost)
2. Asignar multa fija
3. Cambiar status a LOST

---

**Implementación completada y lista para usar.**
