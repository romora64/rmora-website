-- ============================================================
-- rmora-website — Schema + seed de producción
-- Ejecutar: mysql -u romora -p website < scripts/schema.sql
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `open_id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `login_method` varchar(50) NOT NULL DEFAULT 'google',
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_signed_in` timestamp NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `open_id` (`open_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `password_hash` varchar(255),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at` timestamp NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `meetings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `attendee_name` varchar(255) NOT NULL,
  `attendee_email` varchar(255) NOT NULL,
  `notes` text,
  `calendar_event_id` varchar(255),
  `meet_link` varchar(500),
  `status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
  `internal_notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `contact_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `subject` varchar(500) NOT NULL,
  `message` text NOT NULL,
  `status` enum('unread','read','replied','archived') NOT NULL DEFAULT 'unread',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `availability_blocks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `block_type` enum('full_day','time_range') NOT NULL,
  `date` date NOT NULL,
  `start_time` time,
  `end_time` time,
  `reason` varchar(500),
  `recurring` enum('none','weekly','daily','weekday') NOT NULL DEFAULT 'none',
  `end_date` date,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `publications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('Artículo','Ponencia','Investigación','Blog') NOT NULL,
  `title` varchar(500) NOT NULL,
  `description` text,
  `published_at` date NOT NULL,
  `storage_link` varchar(500) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `licenses` (
  `code` varchar(50) NOT NULL,
  `description` text NOT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `resources` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `resource_type` enum('Documento','Software','Concepto') NOT NULL,
  `publication_date` date NOT NULL,
  `description` text NOT NULL,
  `context` text,
  `objective` text,
  `license` varchar(50),
  `link` varchar(500),
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_resources_license` FOREIGN KEY (`license`) REFERENCES `licenses` (`code`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `testimonials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `opinion` text NOT NULL,
  `name` varchar(255) NOT NULL,
  `relation` varchar(100) NOT NULL,
  `institution` varchar(255),
  `display_order` int NOT NULL DEFAULT 0,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ─── Datos iniciales ──────────────────────────────────────────────────────────

-- Admin
INSERT IGNORE INTO `admins` (`email`, `name`, `is_active`) VALUES
('romora.291164@gmail.com', 'Ronald Mora', 1);

-- Licencias
INSERT IGNORE INTO `licenses` (`code`, `description`) VALUES
('MIT', 'Permite usar, copiar, modificar y vender software sin apenas restricciones, siempre que se incluya el aviso de copyright original en todas las copias.'),
('Apache 2.0', 'Permite usar, modificar y distribuir software comercialmente sin obligar a liberar el código fuente. Requiere mantener los avisos de derechos de autor, incluye protección de patentes y no requiere cambios de licencia en trabajos derivados.'),
('CC BY', '(Atribución) - Permite cualquier uso (comercial y adaptaciones) siempre que se reconozca al autor.'),
('CC BY-SA', '(Atribución-CompartirIgual) - Permite modificaciones y uso comercial, pero las nuevas obras deben tener la misma licencia.'),
('CC BY-ND', '(Atribución-SinDerivadas) - Permite compartir comercialmente sin modificar la obra, citando al autor.'),
('CC BY-NC', '(Atribución-NoComercial) - Permite modificar y adaptar la obra, pero no para fines comerciales.'),
('CC BY-NC-SA', '(Atribución-NoComercial-CompartirIgual) - Permite adaptar y compartir la obra sin fines comerciales, bajo la misma licencia.'),
('CC BY-NC-ND', '(Atribución-NoComercial-SinDerivadas) - Solo permite descargar y compartir el trabajo, sin cambios ni uso comercial.'),
('CC0', '(Dominio Público) - El autor libera todos sus derechos, permitiendo uso libre sin restricciones.');

-- Publicaciones
INSERT IGNORE INTO `publications` (`type`, `title`, `published_at`, `storage_link`) VALUES
('Artículo', 'Educar para el Desempleo o para la Revolución: La disyuntiva de la educación universitaria', '2025-11-01', 'https://drive.google.com/file/d/19HCm1Oo79Lqym1iyt3j4sQc41RUtrLeg/view?usp=drive_link'),
('Blog', 'Cómo hablar con la IA - El arte del Prompt', '2025-07-01', 'https://drive.google.com/file/d/1RP44W8YOKZZIgBKylkdOcnbokQwmb_r5/view?usp=drive_link'),
('Artículo', 'Actualización y marco de referencia de los nuevos paradigmas en Ingeniería de Sistemas', '2019-03-01', 'https://drive.google.com/file/d/1WWovcm0-gzHQnotiKxscE327Dsokmqhc/view?usp=drive_link'),
('Artículo', 'Uso de los servicios en la nube como herramienta de enseñanza-aprendizaje', '2018-03-01', 'https://drive.google.com/file/d/1hRN0zxrsk-vqqg_19ItUNeBJwM7regSc/view?usp=drive_link'),
('Artículo', 'Redes inalámbricas de datos - nuestra realidad', '2007-09-01', 'https://drive.google.com/file/d/1iPOdLiI4QV1IHaz82iDfBETji15-joeI/view?usp=drive_link');
