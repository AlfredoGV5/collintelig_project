-- =============================================================
-- Collintelig - Esquema de base de datos
-- Motor: MySQL 8.0 o superior
-- Todas las fechas se guardan en UTC.
-- =============================================================

-- DROP DATABASE IF EXISTS collintelig;   -- descomenta SOLO si quieres empezar de cero
CREATE DATABASE IF NOT EXISTS collintelig
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE collintelig;

-- -------------------------------------------------------------
-- 1. Usuarios (dueños)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre           VARCHAR(100) NOT NULL,
  email            VARCHAR(150) NOT NULL,
  password_hash    VARCHAR(255) NOT NULL,
  expo_push_token  VARCHAR(255) NULL,
  activo           TINYINT(1)   NOT NULL DEFAULT 1,
  creado_en        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 2. Mascotas
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mascotas (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id        INT UNSIGNED NOT NULL,
  nombre            VARCHAR(80)  NOT NULL,
  raza              VARCHAR(80)  NULL,
  sexo              ENUM('macho','hembra') NULL,
  fecha_nacimiento  DATE         NULL,
  peso_kg           DECIMAL(5,2) NULL,
  tamano            ENUM('pequeno','mediano','grande') NOT NULL DEFAULT 'mediano',
  foto_url          VARCHAR(255) NULL,
  creado_en         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_mascotas_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios(id) ON DELETE CASCADE,
  INDEX idx_mascotas_usuario (usuario_id)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 3. Umbrales de alerta por mascota (valores iniciales, se calibran)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS umbrales_mascota (
  mascota_id           INT UNSIGNED PRIMARY KEY,
  inactividad_max_min  SMALLINT UNSIGNED NOT NULL DEFAULT 240,   -- min seguidos en reposo (de día)
  hiperactividad_min   SMALLINT UNSIGNED NOT NULL DEFAULT 30,    -- min seguidos de actividad intensa
  impacto_g            FLOAT             NOT NULL DEFAULT 4.0,   -- pico de aceleración en g
  horario_dia_inicio   TIME              NOT NULL DEFAULT '08:00:00',  -- hora local
  horario_dia_fin      TIME              NOT NULL DEFAULT '21:00:00',
  bateria_baja_pct     TINYINT UNSIGNED  NOT NULL DEFAULT 20,
  sin_conexion_min     SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  sensibilidad_ml      FLOAT             NOT NULL DEFAULT 0.05,  -- 'contamination' del modelo
  CONSTRAINT fk_umbrales_mascota FOREIGN KEY (mascota_id)
    REFERENCES mascotas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 4. Dispositivos (collares)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dispositivos (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  mascota_id        INT UNSIGNED NULL,
  codigo_serie      VARCHAR(40)  NOT NULL,
  api_key_hash      CHAR(64)     NOT NULL,            -- SHA-256 de la llave; la llave nunca se guarda
  firmware_version  VARCHAR(20)  NULL,
  frecuencia_hz     SMALLINT UNSIGNED NOT NULL DEFAULT 20,
  bateria_pct       TINYINT UNSIGNED  NULL,
  ultima_conexion   DATETIME     NULL,
  procesado_hasta   DATETIME     NULL,                -- hasta dónde se calcularon ventanas
  activo            TINYINT(1)   NOT NULL DEFAULT 1,
  creado_en         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_disp_serie   (codigo_serie),
  UNIQUE KEY uq_disp_apikey  (api_key_hash),
  UNIQUE KEY uq_disp_mascota (mascota_id),            -- un collar por perro
  CONSTRAINT fk_disp_mascota FOREIGN KEY (mascota_id)
    REFERENCES mascotas(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 5. Lecturas crudas del sensor (retención: 7 días)
--    Aceleración en g, giroscopio en grados/segundo
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lecturas (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dispositivo_id  INT UNSIGNED NOT NULL,
  ts              DATETIME(3)  NOT NULL,              -- con milisegundos
  ax FLOAT NOT NULL,
  ay FLOAT NOT NULL,
  az FLOAT NOT NULL,
  gx FLOAT NULL,
  gy FLOAT NULL,
  gz FLOAT NULL,
  magnitud FLOAT AS (SQRT(ax*ax + ay*ay + az*az)) STORED,   -- calculada por MySQL
  recibido_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lect_disp FOREIGN KEY (dispositivo_id)
    REFERENCES dispositivos(id) ON DELETE CASCADE,
  INDEX idx_lect_disp_ts (dispositivo_id, ts),
  INDEX idx_lect_ts (ts)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 6. Ventanas de actividad (1 fila por minuto por collar)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ventanas_actividad (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dispositivo_id   INT UNSIGNED NOT NULL,
  mascota_id       INT UNSIGNED NULL,
  inicio           DATETIME NOT NULL,
  fin              DATETIME NOT NULL,
  n_muestras       SMALLINT UNSIGNED NOT NULL,
  mag_media        FLOAT NOT NULL,
  mag_std          FLOAT NOT NULL,
  mag_min          FLOAT NOT NULL,
  mag_max          FLOAT NOT NULL,
  mag_p95          FLOAT NOT NULL,
  energia          FLOAT NOT NULL,       -- promedio de (magnitud - 1 g)^2
  giro_medio       FLOAT NULL,
  cruces_media     SMALLINT UNSIGNED NULL,  -- cruces por la media: aproxima pasos
  nivel_actividad  ENUM('reposo','ligera','moderada','intensa') NOT NULL,
  score_anomalia   FLOAT NULL,           -- mayor = más raro
  es_anomalia      TINYINT(1) NOT NULL DEFAULT 0,
  creado_en        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ventana (dispositivo_id, inicio),
  INDEX idx_vent_mascota_inicio (mascota_id, inicio),
  CONSTRAINT fk_vent_disp FOREIGN KEY (dispositivo_id)
    REFERENCES dispositivos(id) ON DELETE CASCADE,
  CONSTRAINT fk_vent_mascota FOREIGN KEY (mascota_id)
    REFERENCES mascotas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 7. Modelos de Machine Learning (uno activo por mascota)
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS modelos_ml (
  id                        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  mascota_id                INT UNSIGNED NOT NULL,
  version                   INT UNSIGNED NOT NULL,
  algoritmo                 VARCHAR(50)  NOT NULL DEFAULT 'IsolationForest',
  archivo                   LONGBLOB     NOT NULL,     -- modelo serializado con joblib
  n_ventanas_entrenamiento  INT UNSIGNED NOT NULL,
  parametros                JSON NULL,
  metricas                  JSON NULL,
  activo                    TINYINT(1) NOT NULL DEFAULT 1,
  entrenado_en              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_modelo_version (mascota_id, version),
  CONSTRAINT fk_modelo_mascota FOREIGN KEY (mascota_id)
    REFERENCES mascotas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 8. Alertas
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alertas (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  mascota_id      INT UNSIGNED NOT NULL,
  dispositivo_id  INT UNSIGNED NULL,
  tipo ENUM('inactividad_prolongada','hiperactividad','impacto_caida',
            'patron_anomalo','bateria_baja','sin_conexion') NOT NULL,
  severidad       ENUM('baja','media','alta') NOT NULL,
  mensaje         VARCHAR(255) NOT NULL,
  valor           FLOAT NULL,
  ts_evento       DATETIME NOT NULL,              -- UTC
  leida           TINYINT(1) NOT NULL DEFAULT 0,
  notificada      TINYINT(1) NOT NULL DEFAULT 0,
  creado_en       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_alertas_mascota_ts (mascota_id, ts_evento),
  INDEX idx_alertas_tipo (mascota_id, tipo, ts_evento),
  CONSTRAINT fk_alerta_mascota FOREIGN KEY (mascota_id)
    REFERENCES mascotas(id) ON DELETE CASCADE,
  CONSTRAINT fk_alerta_disp FOREIGN KEY (dispositivo_id)
    REFERENCES dispositivos(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- 9. Vista: resumen diario por mascota (1 ventana = 1 minuto)
--    CDMX = UTC-6 todo el año (sin horario de verano desde 2022)
-- -------------------------------------------------------------
CREATE OR REPLACE VIEW v_resumen_diario AS
SELECT
  mascota_id,
  DATE(inicio - INTERVAL 6 HOUR)                            AS fecha,
  CAST(SUM(nivel_actividad = 'reposo')   AS UNSIGNED)       AS min_reposo,
  CAST(SUM(nivel_actividad = 'ligera')   AS UNSIGNED)       AS min_ligera,
  CAST(SUM(nivel_actividad = 'moderada') AS UNSIGNED)       AS min_moderada,
  CAST(SUM(nivel_actividad = 'intensa')  AS UNSIGNED)       AS min_intensa,
  CAST(SUM(es_anomalia)                  AS UNSIGNED)       AS ventanas_anomalas,
  CAST(COUNT(*)                          AS UNSIGNED)       AS minutos_registrados
FROM ventanas_actividad
WHERE mascota_id IS NOT NULL
GROUP BY mascota_id, DATE(inicio - INTERVAL 6 HOUR);

-- -------------------------------------------------------------
-- 10. Usuario de la aplicación (solo para tu MySQL local)
--     En la nube créalo desde el panel del proveedor.
-- -------------------------------------------------------------
CREATE USER IF NOT EXISTS 'collintelig_app'@'%' IDENTIFIED BY 'app_local_123';
GRANT SELECT, INSERT, UPDATE, DELETE ON collintelig.* TO 'collintelig_app'@'%';
FLUSH PRIVILEGES;