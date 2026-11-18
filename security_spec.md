# AssetGuard — Especificación de seguridad

## Autenticación y autorización

- Todo usuario debe autenticarse con Firebase Auth (correo, Google o sesión anónima de demostración).
- Los permisos de backend se basan en **custom claims** de Firebase Auth, no en un campo `role` que el cliente pueda escribir.
- Claim esperado: `request.auth.token.role` con uno de: `admin`, `planner`, `technician`, `viewer`.
- Un administrador se provisiona fuera de la app, con el Admin SDK. Script del repo:

  ```powershell
  node functions/scripts/set-role.mjs --uid <UID> --role admin --project asset-guard-demo
  ```

  El usuario debe cerrar sesión y volver a entrar (o refrescar el ID token) para que el claim aplique.

- El perfil en `/users/{uid}` es informativo para la UI. Las reglas de Firestore solo permiten que un usuario cree su propio perfil con `role: 'viewer'`. Cambiar el rol en Firestore no otorga privilegios.

### Matriz de acceso (custom claims)

| Rol | Lectura operativa | Reportar fallas / taller / HACCP / OT | Inventario y SMP (alta/edición de catálogo) | Administración y borrar |
|---|---|---|---|---|
| `admin` | Sí | Sí | Sí | Sí |
| `planner` | Sí | Sí | Sí | Borrar inventario y OT |
| `technician` | Sí | Sí | Stock / fechas de ejecución | No |
| `viewer` | Sí | No | No | No |

## Inteligencia Artificial (Gemini)

- La API key de Gemini **nunca** vive en el cliente ni en `environment.ts`.
- El cliente invoca HTTPS callable functions (`analyzeMaintenanceHistory`, `generateExecutiveReport`, `generateLotoProcedure`, `analyzeImage`, `getOperatorAdvice`).
- Cada función exige un ID token de Firebase (`request.auth`).
- La clave se inyecta con el secreto `GEMINI_API_KEY` (`defineSecret`). Configurar y desplegar:

  ```bash
  firebase functions:secrets:set GEMINI_API_KEY
  firebase deploy --only functions
  ```

- El HTML que devuelve la IA se sanitiza en el cliente con DOMPurify (fail-closed: si no hay sanitizador, no se renderiza HTML).
- El JSON de inspección visual se limpia de fences markdown y literales `undefined` en el servidor.

## Firebase

- Las reglas de Firestore (`firestore.rules`) aplican RBAC por custom claims, validan esquemas y dejan los logs HACCP inmutables (sin update).
- Las reglas de Realtime Database existentes no se relajan: no se adoptan reglas abiertas de lectura/escritura.
- No se deben commitear credenciales de AI Studio, `firebase-applet-config.json`, ni secretos en el repositorio.

## Pruebas

- Vitest cubre analítica por zona, helpers de RBAC, mapeo de errores de Auth al español mexicano, limpieza de JSON de inspección y el cliente del proxy de Gemini.
