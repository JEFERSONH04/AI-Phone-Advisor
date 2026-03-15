-- ============================================================================
-- AI PHONE ADVISOR - SEED DATA DE EJEMPLO
-- ============================================================================
-- Ejecuta este script para llenar la BD con datos de prueba
-- Reemplaza 'TU_USER_ID' con tu UUID real de admin

-- ============================================================================
-- PRIMERO: Obtén tu user_id
-- ============================================================================
-- SELECT id FROM auth.users LIMIT 1;
-- O ve a Supabase > Authentication > Users y copia el uuid

-- ============================================================================
-- INSERTAR CELULARES
-- ============================================================================

INSERT INTO phones (
  name, brand, model, price_usd, release_year,
  display_size, display_type, display_refresh_rate,
  processor, cores, ram_gb, storage_gb,
  battery_mah, charging_watt, has_wireless_charging,
  camera_mp_main, camera_mp_ultra_wide, camera_mp_tele, camera_mp_front,
  has_4k_recording, has_ois,
  weight_grams, dimensions_mm, ip_rating, colors_available,
  created_by
) VALUES
-- Apple iPhones
(
  'iPhone 15 Pro Max', 'Apple', 'iPhone 15 Pro Max', 1199.00, 2023,
  6.7, 'OLED', 120,
  'A17 Pro', 6, 8, 256,
  4323, 30, true,
  48, 12, 12, 12,
  true, true,
  240.0, '159.9x77.8x8.3', 'IP68',
  ARRAY['Titanio Negro', 'Titanio Blanco', 'Titanio Azul'],
  'TU_USER_ID'::uuid
),

(
  'iPhone 15', 'Apple', 'iPhone 15', 799.00, 2023,
  6.1, 'OLED', 60,
  'A17 Pro', 6, 6, 128,
  3349, 20, false,
  48, 12, NULL, 12,
  true, false,
  170.0, '147.8x71.6x7.80', 'IP67',
  ARRAY['Negro', 'Rosa', 'Azul', 'Amarillo'],
  'TU_USER_ID'::uuid
),

-- Samsung Galaxy
(
  'Samsung Galaxy S24 Ultra', 'Samsung', 'Galaxy S24 Ultra', 1299.99, 2024,
  6.8, 'AMOLED', 120,
  'Snapdragon 8 Gen 3 Leading', 8, 12, 512,
  4900, 45, true,
  200, 50, 10, 12,
  true, true,
  232.0, '162.8x79.0x8.6', 'IP68',
  ARRAY['Titanio Negro', 'Titanio Gris', 'Titanio Oro'],
  'TU_USER_ID'::uuid
),

(
  'Samsung Galaxy S24', 'Samsung', 'Galaxy S24', 799.99, 2024,
  6.2, 'AMOLED', 120,
  'Snapdragon 8 Gen 3 Leading', 8, 12, 256,
  4000, 25, false,
  50, 12, 10, 20,
  true, true,
  167.0, '147x70.6x8.6', 'IP68',
  ARRAY['Gris', 'Plata', 'Azul', 'Rojo'],
  'TU_USER_ID'::uuid
),

-- Google Pixel
(
  'Google Pixel 8 Pro', 'Google', 'Pixel 8 Pro', 999.00, 2023,
  6.7, 'OLED', 120,
  'Google Tensor G3', 8, 12, 256,
  5050, 30, true,
  50, 48, 48, 20,
  true, true,
  221.0, '162.6x72.0x8.5', 'IP68',
  ARRAY['Obsidiana', 'Porcelana', 'Porcelana Mate'],
  'TU_USER_ID'::uuid
),

(
  'Google Pixel 8', 'Google', 'Pixel 8', 799.00, 2023,
  6.2, 'OLED', 120,
  'Google Tensor G3', 8, 8, 128,
  4700, 30, true,
  50, 48, NULL, 10,
  true, true,
  187.0, '150.5x72.0x8.5', 'IP68',
  ARRAY['Obsidiana', 'Porcelana'],
  'TU_USER_ID'::uuid
),

-- OnePlus
(
  'OnePlus 12', 'OnePlus', 'OnePlus 12', 799.00, 2024,
  6.7, 'AMOLED', 120,
  'Snapdragon 8 Gen 3 Leading', 8, 12, 256,
  5400, 100, true,
  50, 48, 8, 32,
  true, true,
  220.0, '163.0x74.1x8.75', 'IP69',
  ARRAY['Negro Silencioso', 'Verde Tranquilo'],
  'TU_USER_ID'::uuid
),

-- Xiaomi
(
  'Xiaomi 14 Ultra', 'Xiaomi', 'Xiaomi 14 Ultra', 1099.00, 2024,
  6.73, 'AMOLED', 120,
  'Snapdragon 8 Gen 3 Leading', 8, 16, 512,
  5910, 90, true,
  50, 50, 50, 32,
  true, true,
  218.0, '162.69x74.6x8.77', 'IP68',
  ARRAY['Negro', 'Plata', 'Blanco', 'Naranja'],
  'TU_USER_ID'::uuid
),

-- Motorola
(
  'Motorola Edge 50 Pro', 'Motorola', 'Edge 50 Pro', 649.99, 2024,
  6.7, 'OLED', 144,
  'Snapdragon 8 Gen 3 Leading', 8, 12, 512,
  5100, 68, true,
  50, 50, 10, 32,
  true, true,
  201.0, '162.6x72.0x8.5', 'IP68',
  ARRAY['Negro', 'Plata'],
  'TU_USER_ID'::uuid
),

-- OPPO
(
  'OPPO Find X6 Ultra', 'OPPO', 'Find X6 Ultra', 549.99, 2023,
  6.82, 'AMOLED', 120,
  'Snapdragon 8 Gen 2 Leading', 8, 16, 512,
  5000, 100, true,
  50, 48, 12, 32,
  true, true,
  218.0, '162.6x72.6x9.55', 'IP68',
  ARRAY['Negro', 'Plata'],
  'TU_USER_ID'::uuid
),

-- Presupuesto
(
  'Samsung Galaxy A54', 'Samsung', 'Galaxy A54', 449.99, 2023,
  6.4, 'AMOLED', 90,
  'Exynos 1280', 8, 6, 128,
  5000, 25, false,
  50, 12, 5, 32,
  true, false,
  201.0, '158.8x77.8x8.7', 'IP67',
  ARRAY['Gris', 'Rosa', 'Violeta', 'Blanco'],
  'TU_USER_ID'::uuid
),

(
  'OnePlus Nord N20', 'OnePlus', 'Nord N20', 299.99, 2023,
  6.43, 'AMOLED', 90,
  'Snapdragon 695', 8, 6, 128,
  4500, 33, false,
  50, 8, NULL, 16,
  true, false,
  186.0, '159.6x73.2x8.5', 'IP54',
  ARRAY['Gris Glacial', 'Azul Glacial'],
  'TU_USER_ID'::uuid
),

(
  'Xiaomi Redmi Note 13', 'Xiaomi', 'Redmi Note 13', 249.99, 2024,
  6.67, 'AMOLED', 120,
  'MediaTek Helio G99', 8, 6, 128,
  5000, 33, false,
  108, 8, 2, 16,
  true, false,
  194.0, '163.9x74.76x7.97', 'IP54',
  ARRAY['Negro Medianoche', 'Azul Océano'],
  'TU_USER_ID'::uuid
);

-- ============================================================================
-- INSERTAR COMENTARIOS DE EJEMPLO
-- ============================================================================
-- NOTA: Reemplaza 'USER_ID_1' con IDs reales de usuarios autenticados
-- Puedes obtenerlos de: SELECT id FROM auth.users;

-- Para este ejemplo, usaremos UUIDs ficticios
-- En producción, estos deberían ser usuarios reales

INSERT INTO comments (
  phone_id, user_id, title, content,
  rating_overall, rating_camera, rating_battery, rating_performance,
  is_published
) VALUES

-- Comentarios para iPhone 15 Pro Max
(
  (SELECT id FROM phones WHERE name = 'iPhone 15 Pro Max' LIMIT 1),
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'Excelente teléfono profesional',
  'El mejor teléfono que he tenido. La cámara es increíble para fotografía profesional. La batería me dura todo el día con uso intenso.',
  5, 5, 5, 5,
  true
),

(
  (SELECT id FROM phones WHERE name = 'iPhone 15 Pro Max' LIMIT 1),
  'a0000000-0000-0000-0000-000000000002'::uuid,
  'Muy caro pero vale la pena',
  'Considero que el precio es alto, pero la construcción premium y el desempeño justifican la inversión.',
  4, 5, 4, 5,
  true
),

-- Comentarios para Samsung Galaxy S24
(
  (SELECT id FROM phones WHERE name = 'Samsung Galaxy S24' LIMIT 1),
  'a0000000-0000-0000-0000-000000000003'::uuid,
  'Mejor que el iPhone para mi',
  'Me encanta el display AMOLED y la tasa de refresco de 120Hz. El procesador es muy rápido.',
  5, 4, 4, 5,
  true
),

-- Comentarios para Google Pixel 8 Pro
(
  (SELECT id FROM phones WHERE name = 'Google Pixel 8 Pro' LIMIT 1),
  'a0000000-0000-0000-0000-000000000004'::uuid,
  'Entre los mejores en fotografía',
  'Las cámaras son increíbles, especialmente en procesamiento de imagen. El software es limpio y rápido.',
  5, 5, 4, 4,
  true
),

-- Comentarios para presupuesto (Samsung Galaxy A54)
(
  (SELECT id FROM phones WHERE name = 'Samsung Galaxy A54' LIMIT 1),
  'a0000000-0000-0000-0000-000000000005'::uuid,
  'Excelente relación precio-rendimiento',
  'Por este precio es difícil encontrar algo mejor. El display AMOLED en un móvil de presupuesto es raro y bienvenido.',
  4, 3, 4, 4,
  true
);

-- ============================================================================
-- INSERTAR SOLICITUDES DE USUARIOS
-- ============================================================================

INSERT INTO feature_requests (
  user_id, phone_brand, phone_model, reason, status
) VALUES
(
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'Apple',
  'iPhone 16 Pro',
  'Quiero ver las especificaciones del próximo iPhone',
  'pending'
),

(
  'a0000000-0000-0000-0000-000000000002'::uuid,
  'Samsung',
  'Galaxy Z Fold 6',
  'Me interesa el teléfono plegable para comprar',
  'pending'
),

(
  'a0000000-0000-0000-0000-000000000003'::uuid,
  'Nothing',
  'Phone 2',
  'La marca Nothing está ganando popularidad',
  'pending'
);

-- ============================================================================
-- FIN DE SEED DATA
-- ============================================================================
-- NOTA IMPORTANTE:
-- 1. Reemplaza 'TU_USER_ID' con tu UUID de admin real
-- 2. Los UUIDs de comentarios (a0000000-...) son ficticios
--    Para datos reales, usa IDs de usuarios autenticados
-- 3. Los comentarios con UUIDs ficticios NO aparecerán en la app
--    pero sirven como referencia de estructura
