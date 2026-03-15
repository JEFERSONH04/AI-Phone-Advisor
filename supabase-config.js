/*!
 * AI PHONE ADVISOR - SUPABASE CONFIGURATION
 * ============================================================================
 * Este archivo configura la conexión con Supabase
 * Reemplaza los valores con tus credenciales reales
 */

// REEMPLAZA ESTOS VALORES CON TUS CREDENCIALES DE SUPABASE
const SUPABASE_URL = "https://rblfqealefmomarocrrc.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJibGZxZWFsZWZtb21hcm9jcnJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNzgzNjQsImV4cCI6MjA4ODg1NDM2NH0.WIYLwRdtQzXyQoFFEt64bRUzsxQWtOF6mpTCRol1g5s";

// Esperar a que la librería de Supabase esté disponible
if (window.supabase && window.supabase.createClient) {
  // Crear cliente de Supabase usando la librería global
  const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
  );
  window.supabase = supabaseClient;
  console.log("✅ Supabase inicializado correctamente");
} else {
  console.error(
    "❌ Librería de Supabase no cargada. Verifica el CDN en index.html",
  );
}
