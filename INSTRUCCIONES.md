# Dashboard de Funnel de Ventas - Ciplastic

Sistema de métricas conectado a Go High Level para medir el rendimiento del funnel de ventas.

---

## 📋 Requisitos Previos

- Node.js versión 18 o superior
- Cuenta de Go High Level con acceso a API
- NPM o Yarn

---

## 🔑 Paso 1: Obtener las Credenciales de Go High Level

### Obtener tu API Key

1. Inicia sesión en tu cuenta de Go High Level
2. Ve a **Settings** (Configuración) en el menú lateral izquierdo
3. Haz clic en **Business Profile**
4. Busca la sección **API Key**
5. Si no tienes una, haz clic en **Generate API Key**
6. Copia la API Key generada

### Obtener tu Location ID

1. En la misma página de **Business Profile**
2. Busca el campo **Location ID**
3. Copia este ID (es un código alfanumérico)

### Obtener tu Pipeline ID

1. Ve a la sección **Opportunities** (Oportunidades)
2. Asegúrate de estar en el pipeline que quieres analizar
3. Mira la URL de tu navegador, se verá algo así:
   ```
   https://app.gohighlevel.com/v2/location/xxx/opportunities/pipeline/PIPELINE_ID_AQUI
   ```
4. Copia el ID del pipeline de la URL

---

## ⚙️ Paso 2: Configurar el Proyecto

### 2.1 Crear archivo de configuración

1. Copia el archivo `.env.example` y renómbralo a `.env`:
   ```bash
   copy .env.example .env
   ```

2. Abre el archivo `.env` y completa tus credenciales:
   ```env
   GHL_API_KEY=tu_api_key_aqui
   GHL_LOCATION_ID=tu_location_id_aqui
   GHL_PIPELINE_ID=tu_pipeline_id_aqui
   ```

### 2.2 Configurar los nombres de tus etapas

En el archivo `.env`, ajusta los nombres de las etapas para que coincidan **exactamente** con los nombres de tu pipeline en GHL:

```env
STAGE_NUEVO_LEAD=E1. NUEVO LEAD
STAGE_INTERES_PENDIENTE=E2.INTERES EN VV- PENDIENTE DE...
# ... etc
```

> **Importante**: Los nombres deben coincidir exactamente como aparecen en tu Go High Level.

---

## 🚀 Paso 3: Instalar y Ejecutar

### 3.1 Instalar dependencias

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
npm run install:all
```

Esto instalará las dependencias del backend y del frontend.

### 3.2 Ejecutar en modo desarrollo

```bash
npm run dev
```

Esto iniciará:
- Backend en: http://localhost:3001
- Frontend en: http://localhost:5173

### 3.3 Abrir el Dashboard

Abre tu navegador y ve a: **http://localhost:5173**

---

## 📊 Métricas Disponibles

El dashboard muestra las siguientes métricas:

| Métrica | Descripción |
|---------|-------------|
| **Total Leads** | Cantidad total de leads en el periodo |
| **Leads Calificados** | Leads con intercambio de información (pasaron de E1) |
| **Agendadas a Valoración** | Citas de valoración programadas |
| **Valoradas con Cotización** | Valoraciones realizadas con cotización entregada |
| **No Contactadas** | Leads pendientes de contacto |
| **Oportunidades de Cierre** | Alta y Media probabilidad de cierre |
| **Depósitos del Mes** | Total de cierres con depósito |
| **Depósitos de Campañas** | Cierres provenientes de campañas de redes sociales |
| **Tasa de Conversión** | Porcentaje de lead a cierre |
| **Tiempo Promedio de Cierre** | Días promedio desde lead hasta depósito |

---

## 🖥️ Despliegue en Servidor

### Construir para producción

```bash
npm run build
```

### Ejecutar en producción

```bash
npm start
```

El servidor servirá tanto el API como el frontend desde el puerto 3001.

### Variables de entorno en producción

```env
NODE_ENV=production
PORT=3001
```

---

## 🔧 Solución de Problemas

### "Error de conexión con Go High Level"

1. Verifica que tu API Key sea correcta
2. Confirma que tienes permisos de API en tu cuenta GHL
3. Asegúrate de que el Location ID y Pipeline ID sean correctos

### "No hay datos"

1. Verifica que el rango de fechas seleccionado tenga oportunidades
2. Confirma que los nombres de las etapas en `.env` coincidan con GHL

### "El frontend no carga"

1. Asegúrate de que el backend esté corriendo (`npm run server`)
2. Verifica que no haya otro proceso usando el puerto 3001

---

## 📁 Estructura del Proyecto

```
📦 FUNNEL DE VENTAS CIPLASTIC
├── 📁 backend
│   ├── 📁 routes        # Endpoints de la API
│   ├── 📁 services      # Lógica de negocio y conexión GHL
│   └── server.js        # Servidor Express
├── 📁 frontend
│   ├── 📁 src
│   │   ├── 📁 components  # Componentes React del dashboard
│   │   ├── App.jsx        # Componente principal
│   │   └── main.jsx       # Punto de entrada
│   └── index.html
├── .env.example           # Plantilla de configuración
├── package.json           # Dependencias del proyecto
└── INSTRUCCIONES.md       # Este archivo
```

---

## 🔄 Actualización de Datos

- Los datos se actualizan automáticamente al cambiar el rango de fechas
- Usa el botón **Actualizar** para refrescar manualmente
- El sistema hace cache de 15 minutos para optimizar las llamadas a la API

---

## 📞 Soporte

Si tienes problemas con la configuración o necesitas ayuda adicional, revisa:

1. La documentación oficial de Go High Level API
2. Los logs del servidor en la terminal
3. La consola del navegador (F12) para errores del frontend
