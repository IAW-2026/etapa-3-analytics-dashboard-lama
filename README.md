# Analytics Dashboard

Aplicacion **Analytics Dashboard** del Proyecto IAW 2026.

Herramienta de lectura y analisis que consolida metricas del sistema LAMA completo. Esta primera version ya define la estructura de dashboard y trabaja con datos mock, preparada para reemplazar esas fuentes por APIs protegidas con Clerk.

## Funcionalidades incluidas

- Indicadores clave del negocio:
  - ingresos aprobados
  - transacciones aprobadas
  - usuarios activos
  - pedidos completados
  - calificacion promedio
  - productos activos
- Visualizaciones de ingresos por mes, estado de ordenes y estado de envios.
- Tablas de productos destacados y ordenes recientes.
- Embudo operativo de ordenes creadas, pagadas, enviadas y finalizadas.
- Alertas operativas accionables para pagos pendientes/rechazados y ordenes pagadas sin envio, con links al recurso afectado.
- Indicador de salud de integraciones segun fuentes conectadas, mockeadas o con error.
- Seccion `Insights IA` con mejor dia de venta, mejor franja horaria, proyeccion mensual y recomendaciones automaticas.
- Integracion opcional con Gemini para generar resumen ejecutivo; si no hay `GEMINI_API_KEY`, usa analisis local.
- API interna `GET /api/analytics/summary` para centralizar la consolidacion de datos.
- Panel de fuentes de datos que indica que integraciones siguen en modo mock.
- Integracion inicial con `GET /api/productos` y `GET /api/ordenes-ventas` de Seller App, con fallback a mock si la API responde error.
- Integracion inicial con `GET /api/compradores` de Buyer App, con preferencias incluidas en cada comprador y fallback a mock si la API responde error. Los filtros `search`, `estado`, `page` y `pageSize` son opcionales.
- Integracion inicial con `GET /api/envios` de Shipping App, con fallback a mock si la API responde error.
- Integracion inicial con `GET /api/pagos` de Payments App, con fallback a mock si la API responde error.

## Stack

- Next.js
- React
- TypeScript
- Clerk
- CSS propio

## Ejecutar localmente

```bash
npm install
npm run dev
```

La aplicacion queda disponible en:

```text
http://localhost:3000
```

Para validar produccion:

```bash
npm run build
```

## Webapps a integrar

URLs conocidas:

```text
Seller App:   https://proyecto-c-seller-lama.vercel.app
Shipping App: https://proyecto-c-shipping-lama.vercel.app
Buyer App:    https://proyecto-c-buyer2-lama.vercel.app
Payments App: https://proyecto-c-payments-lama.vercel.app
```

Como las APIs usan seguridad con Clerk, el dashboard no deberia consumir endpoints protegidos directamente desde el navegador. La estrategia recomendada es consultar desde rutas internas de Next, usando credenciales de servidor o endpoints especificos de analytics.

Las llamadas entre servicios se autentican con `x-api-key` y se identifican con `x-service-name`.

Variables de entorno esperadas:

```text
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.1-flash-lite

SELLER_API_BASE_URL=https://proyecto-c-seller-lama.vercel.app
ANALYTICS_SERVICE_NAME=analytics
ANALYTICS_SERVICE_NAME_HEADER=x-service-name
SELLER_API_KEY=
SELLER_API_KEY_HEADER=x-api-key
BUYER_API_KEY=
BUYER_API_KEY_HEADER=x-api-key
BUYER_CUSTOMERS_PATH=/api/compradores
BUYER_SEARCH=
BUYER_STATUS=
BUYER_PAGE=
BUYER_PAGE_SIZE=
SHIPPING_API_KEY=
SHIPPING_API_KEY_HEADER=x-api-key
PAYMENTS_API_KEY=
PAYMENTS_API_KEY_HEADER=x-api-key
CONTROL_PLANE_API_KEY=
ANALYTICS_API_KEY=
```

Si `GET /api/productos` o `GET /api/ordenes-ventas` responden `401`, revisar en Seller que la key de Analytics este habilitada para esos endpoints y que el header configurado coincida con el esperado por la API.

## Proximo paso tecnico

Si Analytics necesita rankings globales de preferencias y usa filtros o paginado en Buyer, pedir un endpoint agregado a Buyer. Las preferencias incluidas en `GET /api/compradores` corresponden a la respuesta solicitada.
