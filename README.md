# 📱 AI Phone Advisor - MVP Serverless

**Una aplicación web serverless para recomendaciones de celulares impulsadas por IA**

---

## 📋 Tabla de Contenidos

- [Visión General](#visión-general)
- [Stack Tecnológico](#stack-tecnológico)
- [Requisitos Previos](#requisitos-previos)
- [Configuración Inicial](#configuración-inicial)
- [Estructura de Archivos](#estructura-de-archivos)
- [Funcionalidades](#funcionalidades)
- [Seguridad y RLS](#seguridad-y-rls)
- [Despliegue en GitHub Pages](#despliegue-en-github-pages)
- [Guía de Administrador](#guía-de-administrador)

---

## Visión General

**AI Phone Advisor** es un MVP que demuestra cómo construir una aplicación web moderna **sin servidor** (Serverless) utilizando:

- **Frontend**: HTML5, CSS3, JavaScript Vanilla (ES6+)
- **Base de Datos**: Supabase (PostgreSQL + Auth)
- **IA**: Widget de Chatbase integrado
- **Hospedaje**: GitHub Pages (estático)

### Características Principales

✅ **Catálogo dinámico** de celulares con filtros avanzados  
✅ **Comparador visual** con gráficos Radar (Chart.js)  
✅ **Sistema de Semáforo** (Green/Yellow/Red) para specs técnicas  
✅ **Badges de estilo de vida** personalizados  
✅ **Autenticación segura** con RLS en Supabase  
✅ **Panel de administrador** para CRUD de productos  
✅ **Sistema de comentarios** con valoraciones  
✅ **Solicitudes de nuevos modelos** de usuarios  
✅ **Chatbot IA** integrado (Chatbase)  
✅ **Modo oscuro profesional** con Glassmorphism

---

## Stack Tecnológico

### Frontend

- **HTML5**: Estructura semántica
- **CSS3**: Variables, Grid, Flexbox, Animaciones, Glassmorphism
- **JavaScript ES6+**: Async/await, Módulos, Arrow functions

### Backend (Serverless)

- **Supabase (PostgreSQL)**
  - Autenticación con JWT
  - Row Level Security (RLS) para control de permisos
  - Realtime Subscriptions (opcional)
  - Edge Functions (opcional)

### Librerías Externas (Mínimas)

- **Chart.js 4.4.0**: Gráficos Radar para comparativas
- **Supabase JS Client 2.38.0**: SDK de Supabase
- **Chatbase Widget**: Asistente de IA

### Hospedaje

- **GitHub Pages**: Alojamiento estático
- **Dominio**: Tu repositorio (ejemplo: `usuario.github.io/ai-phone-advisor`)

---

## Requisitos Previos

1. **Cuenta de Supabase** (gratuita en https://supabase.com)
2. **Repositorio de GitHub** con Pages habilitado
3. **Cuenta de Chatbase** (opcional, para el chatbot)
4. **Git** instalado en tu máquina

---

## Configuración Inicial

### 1️⃣ Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto
3. Copia tu **URL del proyecto** y **Clave Anónima**

### 2️⃣ Configurar Base de Datos

1. En Supabase, ve a **SQL Editor**
2. Copia todo el contenido de `DATABASE_SCHEMA.sql`
3. Pégalo en el editor SQL y ejecuta
4. Verifica que se crearon las tablas: `phones`, `comments`, `feature_requests`, `admin_users`

### 3️⃣ Configurar Variables de Entorno

1. Abre `supabase-config.js`
2. Reemplaza:

   ```javascript
   const SUPABASE_URL = "https://tu-proyecto.supabase.co";
   const SUPABASE_ANON_KEY = "tu-clave-anonima-aqui";
   ```

3. Abre `main.js` y configura Chatbase:
   ```javascript
   chatbaseScript.setAttribute("chatbaseId", "TU_CHATBASE_ID");
   ```

### 4️⃣ Crear Primer Admin

1. En Supabase, regístrate como usuario en la app
2. Obtén tu `user_id` desde la tabla `auth.users`
3. Inserta en `admin_users`:
   ```sql
   INSERT INTO admin_users (user_id, role)
   VALUES ('tu-uuid-aqui', 'super_admin');
   ```

### 5️⃣ Agregar Teléfonos de Ejemplo

(Como admin, puedes usar el panel de administrador)

---

## Estructura de Archivos

```
ai-phone-advisor/
├── index.html                 # Estructura HTML principal
├── styles.css                 # Estilos CSS (modo oscuro, glassmorphism)
├── main.js                    # Lógica principal (ES6+)
├── supabase-config.js         # Configuración de Supabase
├── DATABASE_SCHEMA.sql        # Schema SQL con RLS
├── README.md                  # Este archivo
└── .gitignore                 # Ignorar archivos innecesarios
```

### Archivos Clave

#### `index.html`

- Header con navbar y autenticación
- Sección Hero
- Catálogo con filtros
- Comparador visual
- Modales para autenticación, detalles, admin
- Sistema de comentarios

#### `styles.css`

- 500+ líneas de CSS custom
- Variables CSS para temas
- Modo oscuro: `#09090b` (fondo), `#18181b` (tarjetas)
- Colores de acento: Índigo `#6366f1`, Violeta `#8b5cf6`
- Glassmorphism sutil con `backdrop-filter: blur(10px)`
- Animaciones fluidas (fadeIn, slideUp, slideDown)
- Responsive para móvil, tablet, desktop

#### `main.js`

- **Autenticación**: Sign In, Sign Up, Sign Out, Admin Check
- **CRUD de Celulares**: Insert, Update, Delete (solo admins via RLS)
- **Renderizado Dinámico**: Catálogo, Detalles, Comparador
- **Filtros**: Marca, Precio, Ordenamiento
- **Sistema de Semáforo**: Cálculo automático de status (Green/Yellow/Red)
- **Badges de Estilo de Vida**: Fotografía, Gaming, Batería, etc.
- **Comentarios**: Crear, leer, rating de estrellas
- **Comparador Radar**: Chart.js con normalización
- **Panel Admin**: Gestión de CRUD, solicitudes, comentarios

#### `supabase-config.js`

- Configuración centralizada de Supabase
- Cliente de Supabase inicializado

#### `DATABASE_SCHEMA.sql`

- **Tablas**: `phones`, `comments`, `feature_requests`, `admin_users`
- **RLS Policies**: Visitante (SELECT), Usuario (INSERT comments), Admin (CRUD phones)
- **Índices**: Para performance en BD
- **Triggers**: Actualización automática de timestamps
- **Vistas**: `phones_with_comment_count` para frontend

---

## Funcionalidades

### 👤 Visitante (Anónimo)

- ✅ Ver catálogo completo de celulares
- ✅ Usar filtros (marca, precio, ordenamiento)
- ✅ Ver detalles del producto
- ✅ Consultar Radar Chart de comparativas
- ✅ Leer comentarios de usuarios
- ✅ Usar Chatbot IA
- ❌ No puede comentar
- ❌ No puede solicitar nuevos modelos

### 👥 Usuario Autenticado

- ✅ Todas las funciones de visitante
- ✅ Crear comentarios con rating
- ✅ Solicitar nuevos modelos
- ✅ Ver su perfil
- ❌ Editar/borrar solo sus propios comentarios
- ❌ No acceso a panel admin

### ⚙️ Administrador

- ✅ Todas las funciones de usuario
- ✅ CRUD completo de celulares (Create, Read, Update, Delete)
- ✅ Gestionar solicitudes de usuarios
- ✅ Moderar comentarios
- ✅ Acceso a estadísticas
- ✅ Panel dedicado con tabs

---

## Seguridad y RLS

### Arquitectura de Seguridad

La **seguridad crítica está en Supabase RLS**, no en JavaScript:

```sql
-- Solo admins pueden crear celulares
CREATE POLICY "phones_insert_admin_only"
  ON phones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Visitantes pueden ver solo celulares activos
CREATE POLICY "phones_select_public"
  ON phones FOR SELECT
  USING (is_active = TRUE);

-- Usuarios pueden crear comentarios (autenticación requerida)
CREATE POLICY "comments_insert_authenticated"
  ON comments FOR INSERT
  WITH CHECK (user_id = auth.uid());
```

### Flujo de Seguridad

1. **Frontend**: Validación UX (feedback instantáneo)
2. **Supabase Auth**: Verificación de identidad
3. **RLS Policies**: Verificación final de permisos en BD
4. **JavaScript**: SIN lógica critica (excepto UX)

### Principios

- 🔒 **RLS es tu firewall**: Las políticas son obligatorias
- 🚫 **No confíes en el frontend**: Cualquiera puede abrir DevTools
- 🔑 **Usa JWT de Supabase**: Incluido automáticamente en requests
- 📜 **Auditoría**: Supabase registra todas las operaciones

---

## Despliegue en GitHub Pages

### 1️⃣ Crear Repositorio

```bash
git clone https://github.com/tu-usuario/ai-phone-advisor.git
cd ai-phone-advisor
```

### 2️⃣ Configurar GitHub Pages

1. Ve a **Settings** del repo
2. Encuentra **Pages**
3. Selecciona **Branch**: `main` y **Folder**: `/root`
4. Guarda

### 3️⃣ Hacer Push

```bash
git add .
git commit -m "🚀 Initial AI Phone Advisor MVP"
git push origin main
```

### 4️⃣ Acceder

Tu app estará disponible en:

```
https://tu-usuario.github.io/ai-phone-advisor
```

### 5️⃣ Configurar Dominio Personalizado (Opcional)

En **Settings** > **Pages** > **Custom domain**:

```
aiphone.tudominio.com
```

---

## Guía de Administrador

### Acceder al Panel

1. Inicia sesión con tu cuenta admin
2. Verás el botón **⚙️ Admin** en la navbar
3. Click para abrir el panel

### Tab: Gestionar Celulares

#### Crear Nuevo Celular

1. Completa el formulario con:
   - Nombre (ej: "iPhone 15 Pro")
   - Marca (ej: "Apple")
   - Modelo (ej: "iPhone 15 Pro")
   - Precio en USD
   - Año de lanzamiento
   - RAM, Almacenamiento, Batería
   - Cámaras
   - Procesador

2. Click **Guardar Celular**

#### Editar Celular

1. Busca el celular en la tabla
2. Click **✏️ Editar**
3. El formulario se auto-llena
4. Modifica y guarda

#### Eliminar Celular

1. Click **🗑️ Eliminar**
2. Confirma
3. El celular se marca como inactivo (soft delete)

### Tab: Solicitudes de Usuarios

- Ver todas las solicitudes de nuevos modelos
- Cambiar estado: `pending` → `added` o `rejected`
- Ver razón del usuario

### Tab: Comentarios

- Ver todos los comentarios de usuarios
- Eliminar comentarios inapropiados
- Los comentarios eliminados desaparecen del catálogo

---

## Sistema de Semáforo Automático

El sistema calcula automáticamente el status basado en rangos:

### Batería

- 🟢 **Verde**: ≥ 4500mAh
- 🟡 **Amarillo**: 4000-4499mAh
- 🔴 **Rojo**: < 4000mAh

### RAM

- 🟢 **Verde**: ≥ 12GB
- 🟡 **Amarillo**: 8-11GB
- 🔴 **Rojo**: < 8GB

### Cámara

- 🟢 **Verde**: ≥ 48MP
- 🟡 **Amarillo**: 20-47MP
- 🔴 **Rojo**: < 20MP

### Almacenamiento

- 🟢 **Verde**: ≥ 256GB
- 🟡 **Amarillo**: 128-255GB
- 🔴 **Rojo**: < 128GB

---

## Badges de Estilo de Vida

Se generan dinámicamente según specs:

| Condición                           | Badge                       |
| ----------------------------------- | --------------------------- |
| Cámara ≥ 48MP                       | 📸 Ideal para Fotos         |
| Tiene grabación 4K                  | 🎥 Videos 4K                |
| RAM ≥ 12GB                          | 🎮 Ideal para Gaming        |
| Batería ≥ 4500mAh + Pantalla ≥ 6.5" | 🎬 Perfecto para Multimedia |
| RAM ≥ 8GB + Almac. ≥ 256GB          | 💼 Productividad Pro        |
| Batería ≥ 5000mAh                   | 🔋 Batería Ultra            |
| Pantalla ≤ 6"                       | 📱 Compacto                 |
| Precio ≥ $800                       | 👑 Premium Flagship         |
| Precio ≤ $300                       | 💰 Presupuesto              |

---

## Comparador Radar Chart

### Especificaciones Comparadas

El Radar Chart normaliza y compara:

- **RAM** (0-24GB → 0-100%)
- **Batería** (2000-6000mAh → 0-100%)
- **Cámara** (0-200MP → 0-100%)
- **Almacenamiento** (0-1000GB → 0-100%)
- **Recencia** (0-15 años → 0-100%)
- **Precio** (más barato = mejor, 0-100%)

### Usar el Comparador

1. Selecciona 2-3 teléfonos del catálogo
2. Click **Comparar Seleccionados**
3. Visualiza:
   - Gráfico Radar interactivo
   - Tabla comparativa detallada

---

## Integración Chatbot (Chatbase)

### Configurar

1. Ve a [chatbase.co](https://chatbase.co)
2. Crea un chatbot
3. Entrena con información sobre teléfonos
4. Copia el **Chatbase ID**
5. Pégalo en `main.js`:
   ```javascript
   chatbaseScript.setAttribute("chatbaseId", "TU_CHATBASE_ID");
   ```

### El widget aparecerá en:

- Botón **💬 Chatbot IA** en la navbar
- Chat flotante en la esquina

---

## Variables de Base de Datos

### Tabla: `phones`

```sql
- id (UUID, PK)
- name (TEXT, UNIQUE)
- brand, model (TEXT)
- price_usd (DECIMAL)
- release_year (INTEGER)
- display_size, display_type, display_refresh_rate
- processor, cores
- ram_gb, storage_gb
- battery_mah, charging_watt
- camera_mp_main, camera_mp_ultra_wide, camera_mp_tele, camera_mp_front
- has_4k_recording, has_ois
- weight_grams, dimensions_mm, ip_rating
- colors_available (TEXT[])
- created_at, updated_at, created_by (FK)
- is_active (BOOLEAN)
```

### Tabla: `comments`

```sql
- id (UUID, PK)
- phone_id (FK)
- user_id (FK)
- title, content (TEXT)
- rating_overall, rating_camera, rating_battery, rating_performance (1-5)
- created_at, updated_at
- is_published (BOOLEAN)
```

### Tabla: `feature_requests`

```sql
- id (UUID, PK)
- user_id (FK)
- phone_brand, phone_model (TEXT)
- reason (TEXT)
- created_at
- status (pending/reviewed/added/rejected)
- admin_notes (TEXT)
```

### Tabla: `admin_users`

```sql
- id (UUID, PK)
- user_id (FK, UNIQUE)
- role (moderator/admin/super_admin)
- created_at
- granted_by (FK)
```

---

## Optimizaciones de Performance

✅ **CSS Variables**: Reutilización de estilos  
✅ **Compresión**: HTML, CSS, JS sin deps pesadas  
✅ **Lazy Loading**: Imágenes (cuando se agreguen)  
✅ **Caching**: Supabase cachea automáticamente  
✅ **Índices BD**: En columnas clave (brand, user_id, status)  
✅ **RLS Optimizado**: Políticas eficientes sin N+1

---

## Próximas Mejoras (Roadmap)

- [ ] Galería de imágenes de productos
- [ ] Reviews detalladas con imágenes
- [ ] Favoritos / Wishlist
- [ ] Historial de búsquedas
- [ ] Notificaciones en tiempo real
- [ ] Dark mode toggle (already dark-first)
- [ ] Multi-idioma (i18n)
- [ ] PWA (Progressive Web App)
- [ ] Integración con APIs de precios
- [ ] Recomendaciones con ML

---

## Solución de Problemas

### ❌ "No se conecta a Supabase"

- Verifica `SUPABASE_URL` y `SUPABASE_ANON_KEY`
- Revisa la consola del navegador (DevTools)
- Asegúrate de haber ejecutado `DATABASE_SCHEMA.sql`

### ❌ "No veo los teléfonos"

- Verifica que la tabla `phones` tenga datos
- Revisa que `is_active = true`
- Abre DevTools y revisa la Network tab

### ❌ "No puedo crear comentarios"

- Inicia sesión primero
- Verifica que `is_authenticated = true`
- Revisa las RLS policies

### ❌ "El admin panel no aparece"

- Verifica que estés en la tabla `admin_users`
- Recarga la página después de insertarte
- Usa el correo exacto de tu sesión

---

## Contacto y Soporte

Para reportar bugs o solicitar features:

- Abre un Issue en GitHub
- Describe el problema con detalles
- Incluye screenshots si es necesario

---

## Licencia

MIT License - Libre para usar en proyectos personales y comerciales

---

## Creador

**Desarrollador Web Senior Full-Stack**  
Especializado en Arquite Serverless y Diseño de Interfaces SaaS  
🚀 Construyendo MVPs modernos sin servidor

---

**Última actualización**: Marzo 2026  
**Versión**: 1.0.0 (MVP)
