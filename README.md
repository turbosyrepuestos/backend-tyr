# Backend Tyr - E-commerce API

Este proyecto es una API robusta para un e-commerce, construida con NestJS y MongoDB.

## Requisitos Previos

- [Node.js](https://nodejs.org/) (v18 o superior)
- [MongoDB](https://www.mongodb.com/) (Local o Atlas)
- [npm](https://www.npmjs.com/)

## Configuración Local

1.  **Clonar el repositorio:**
    ```bash
    git clone <url-del-repositorio>
    cd backend-tyr
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto y añade las siguientes variables:
    ```env
    PORT=3000
    DB_CONNECTION=mongodb
    DB_HOST=localhost:27017
    DB_NAME=backend-tyr
    # Si usas MongoDB Atlas, usa MONGODB_URI
    # MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/backend-tyr
    #
    # JWT_SECRET=...
    # ACCESS_TOKEN_EXPIRY=30m
    #
    # Firebase Admin (login con Google: POST /auth/google)
    # Pega el JSON completo de la cuenta de servicio en una sola línea o usa comillas JSON escapado
    # FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
    ```

4.  **Ejecutar la aplicación:**
    ```bash
    # Modo desarrollo
    npm run start:dev
    ```

## Módulo de Productos

El módulo de productos permite gestionar el inventario de un e-commerce.

### Documentación de la API (Swagger)

Una vez que la aplicación esté corriendo, puedes acceder a la documentación interactiva en:
[http://localhost:3000/docs](http://localhost:3000/docs) (o el puerto que hayas configurado).

### Modelo de Producto

```json
{
  "id": "string (ej: gtx3584rs)",
  "name": "string",
  "sku": "string",
  "price": "number",
  "currency": "string",
  "brand": "string",
  "secondBrand": ["string"],
  "status": "string (IN STOCK, LOW STOCK, OUT OF STOCK)",
  "description": "string",
  "images": ["string"],
  "specs": [
    { "label": "string", "value": "string" }
  ],
  "compatibility": [
    { "title": "string", "desc": "string" }
  ]
}
```

### Endpoints

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `POST` | `/products` | Crear un nuevo producto |
| `GET` | `/products` | Obtener productos con filtros (`name`, `sku`, `status`, `brand`, `category`, `minPrice`, `maxPrice`, `q`), ordenamiento (`sortBy`, `sortOrder`) y paginación (`page`, `limit`) |
| `GET` | `/products/:id` | Obtener un producto por su ID personalizado |
| `PATCH` | `/products/:id` | Actualizar un producto por su ID |
| `DELETE` | `/products/:id` | Eliminar un producto por su ID |
| `POST` | `/auth/google` | Login con Google: body `{ "idToken": "<Firebase ID token>" }`. El usuario debe existir en BD. |

#### Login con Google (Firebase)

1. En el frontend, configura Firebase Auth y obtén el **ID token** tras `signInWithPopup` / `signInWithCredential` con el proveedor Google.
2. Envía ese token al backend: `POST /auth/google` con `{ "idToken": "..." }`.
3. El servidor valida el token con **Firebase Admin** y busca un usuario en MongoDB con el mismo correo o con `firebaseUid` ya vinculado. Si no existe, responde `401`.
4. La respuesta incluye `access_token`, `refresh_token` y `permissions` (igual que tras verificar el OTP).

- `GET /products?page=1&limit=5`: Obtiene la primera página con 5 productos.
- `GET /products?q=GTX`: Búsqueda global de productos que contengan "GTX".
- `GET /products?status=IN STOCK&name=Turbo`: Filtra por estado y nombre.
- `GET /products?brand=Garrett&minPrice=1000&maxPrice=3000`: Filtra por marca y rango de precio.
- `GET /products?sortBy=price&sortOrder=desc`: Ordena los productos por precio de mayor a menor.
- `GET /products?sortBy=price&sortOrder=asc`: Ordena los productos por precio de menor a mayor.

## Scripts Disponibles

- `npm run build`: Compila el proyecto.
- `npm run start`: Inicia la aplicación.
- `npm run start:dev`: Inicia la aplicación en modo watch.
- `npm run lint`: Ejecuta el linter para corregir errores de estilo.
- `npm run test`: Ejecuta las pruebas unitarias.
