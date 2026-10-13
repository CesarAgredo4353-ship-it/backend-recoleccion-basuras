# Backend - App de avisos de recolección de basuras

API REST para registrar y consultar avisos de recolección de basuras por sector.

## Requisitos
- Node.js instalado (https://nodejs.org, versión LTS)

## Cómo ejecutar

1. Abre una terminal (Símbolo del sistema o PowerShell) dentro de esta carpeta.
2. Instala las dependencias:
   ```
   npm install
   ```
3. Inicia el servidor:
   ```
   npm start
   ```
4. El servidor queda corriendo en: `http://localhost:3000`

## Configurar la URL en la app Android

En el proyecto de Android, usa como base URL: `http://10.0.2.2:3000/` si corres el backend
en el mismo computador y pruebas con el **emulador** (10.0.2.2 es la forma en que el emulador
ve a "localhost" de tu PC). Si pruebas en un celular físico conectado a la misma red,
usa la IP local de tu computador en vez de 10.0.2.2 (ej. `http://192.168.1.X:3000/`).

## Persistencia

Los datos se guardan en el archivo `db.json`, que se crea automáticamente la primera
vez que corres el servidor. Los datos sobreviven aunque reinicies el servidor.

## Entidades

- **Sector**: `{ id, nombre, zona }`
- **Aviso**: `{ id, sectorId, hora, estado }` (estado: "activo" o "inactivo")

## Endpoints disponibles

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/sectores` | Lista todos los sectores |
| GET | `/api/sectores/:id` | Obtiene un sector |
| POST | `/api/sectores` | Crea un sector (`nombre`, `zona`) |
| PUT | `/api/sectores/:id` | Actualiza un sector |
| DELETE | `/api/sectores/:id` | Elimina un sector |
| GET | `/api/avisos` | Lista todos los avisos |
| GET | `/api/avisos?sector=ID` | Filtra avisos por sector |
| GET | `/api/avisos/:id` | Obtiene un aviso |
| POST | `/api/avisos` | Crea un aviso (`sectorId`, `hora`) |
| PUT | `/api/avisos/:id` | Actualiza la hora de un aviso |
| PATCH | `/api/avisos/:id/desactivar` | Marca un aviso como inactivo |
| DELETE | `/api/avisos/:id` | Elimina un aviso |

## Regla de negocio

No se puede crear un nuevo aviso **activo** para un sector si ya existe uno activo
en ese sector (responde con código **409 Conflict**).

## Ejemplo rápido de prueba (con curl)

```
curl -X POST http://localhost:3000/api/sectores -H "Content-Type: application/json" -d "{\"nombre\":\"Manzana 3\",\"zona\":\"Entrada del barrio\"}"

curl -X POST http://localhost:3000/api/avisos -H "Content-Type: application/json" -d "{\"sectorId\":1,\"hora\":\"3:00 PM\"}"
```
