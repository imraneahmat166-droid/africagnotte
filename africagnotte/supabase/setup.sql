-- ================================================================
-- AfriCagnotte — Script de configuration Supabase
-- Instructions :
--   1. Ouvrir https://supabase.com → votre projet → SQL Editor
--   2. Copier-coller CE FICHIER ENTIER
--   3. Cliquer "Run"
--   4. Remplacer 'votre@email.com' par votre vrai email
-- ================================================================

-- Étape 1 : Exécuter le schéma principal
\i 001_initial_schema.sql

-- Étape 2 : Exécuter les migrations admin/storage
\i 002_admin_storage_notifications.sql

-- Étape 3 : Définir votre compte admin
-- ⚠️  REMPLACEZ 'votre@email.com' par votre email
-- (Créez d'abord votre compte via l'interface, PUIS exécutez cette ligne)
-- UPDATE profiles SET role = 'admin' WHERE email = 'votre@email.com';

-- Étape 4 : Vérification
SELECT 'Tables créées:' as info;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

SELECT 'Bucket storage:' as info;
SELECT id, name, public FROM storage.buckets WHERE id = 'campaign-images';

SELECT 'Tout est prêt !' as info;
