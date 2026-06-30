# 🛍️ Kiora Client (Tienda Web)

Este es el cliente público web de Kiora. Permite a los usuarios y compradores explorar el catálogo de productos y acceder a los servicios de la tienda de una manera ágil y atractiva.

## 🚀 Tecnologías

Construido con un enfoque fuerte en UX, rendimiento y SEO:

- **Astro v6**: Framework orientado a velocidad y entrega de contenido estático/dinámico.
- **React v19**: Librería principal para interactividad en componentes cliente (islands).
- **Tailwind CSS v4**: Estilos utilitarios rápidos y eficientes.
- **Zustand**: Manejo de estado liviano para carrito y configuraciones del cliente.
- **Framer Motion**: Animaciones fluidas de interfaz.
- **SweetAlert2**: Notificaciones visuales de sistema atractivas.

## 📁 Estructura del Proyecto

```text
client_kiora/
├── public/              # Assets estáticos y logos
├── src/
│   ├── components/      # Componentes React (islas de interactividad)
│   ├── pages/           # Rutas públicas (páginas de producto, catálogo, checkout)
│   ├── store/           # Estado global en Zustand
│   └── styles/          # Estilos globales y configuración Tailwind
├── .env.example         # Ejemplo de configuración local
└── package.json         # Dependencias
```

## 🧞 Comandos y Scripts

Asegúrate de estar en el directorio `client_kiora/`.

| Comando                   | Acción                                                |
| :------------------------ | :---------------------------------------------------- |
| `npm install`             | Instala todas las dependencias.                       |
| `npm run dev`             | Inicia el servidor de desarrollo en `localhost:4321`. |
| `npm run build`           | Compila la aplicación para producción en `./dist/`.   |
| `npm run preview`         | Previsualiza el build de forma local.                 |
| `npm run astro check`     | Ejecuta revisión de tipos de Astro.                   |

## 🔧 Configuración de Entorno

1. Copia `.env.example` a `.env`
2. Modifica la variable apuntando al API Gateway del ecosistema Kiora:
   ```env
   PUBLIC_API_URL=http://localhost:3000
   ```

*(Revisar archivo `.env.docker` o `.env.docker.example` si se va a construir la imagen de Docker para conectar a la red de microservicios `kiora-net` en la IP virtualizada).*

## 🛠️ Notas Técnicas
Dado que esta aplicación es expuesta completamente a Internet:
- Asegúrate de **NUNCA** incluir variables sensibles que no tengan el prefijo `PUBLIC_` y verifica que los tokens del proxy se pidan al backend, no directamente quemados en el cliente.
- Todo endpoint llamado debe realizarse contra las rutas públicas configuradas en el API Gateway para evitar consumir las rutas de administración (`/api/auth/...`).
