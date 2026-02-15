-- Init script para PostgreSQL
-- Se ejecuta automáticamente al crear el contenedor

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Zona horaria por defecto Venezuela
SET timezone = 'America/Caracas';
