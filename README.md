Proyecto de Autenticación con SSO
Este proyecto es el backend de una aplicación que utiliza un sistema de autenticación híbrido con Single Sign-On (SSO) a través de Google y un método tradicional de correo electrónico y contraseña.

🚀 Inicio Rápido
Requisitos
Node.js (versión 18 o superior)

PostgreSQL

Yarn o npm

Pasos de Instalación
Clona el repositorio.

Instala las dependencias del proyecto:

npm install

Crea un archivo .env basado en el .env.example y configura tus variables de entorno.

Crea la base de datos y ejecuta el script de las tablas.

Inicia el servidor en modo de desarrollo:

npm run dev

O en modo de producción:

npm start

📂 Estructura del Proyecto
La arquitectura del proyecto está diseñada para ser modular y escalable, con una clara separación de responsabilidades:

src/config: Gestión de la configuración.

src/controllers: Lógica de la API.

src/routes: Definición de endpoints.

src/services: Lógica de negocio.

src/models: Interacción con la base de datos.

src/middlewares: Lógica de autenticación y validación.

src/types: Tipos e interfaces globales.

src/utils: Funciones auxiliares.