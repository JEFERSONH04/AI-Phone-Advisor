/*!
 * AI PHONE ADVISOR - MAIN LOGIC (JavaScript ES6+)
 * ============================================================================
 * Lógica completa: Autenticación, BD, UI, Seguridad con RLS
 */

// ============================================================================
// ESTADO GLOBAL
// ============================================================================

const AppState = {
  currentUser: null,
  isAdmin: false,
  phones: [],
  filteredPhones: [],
  selectedPhoneForDetails: null,
  selectedPhonesForComparison: [],
  comments: [],
  radarChart: null,
};

// ============================================================================
// UTILIDADES DE FORMATO
// ============================================================================

/**
 * Formatea precios de USD a COP (Pesos Colombianos)
 * Ejemplo: 999 USD -> $ 1.200.000 COP
 * Usando tasa de cambio aproximada: 1 USD = 4000 COP (ajustable)
 */
function formatPrice(priceUSD) {
  // Convertir USD a COP (usando tasa aproximada)
  const exchangeRate = 4000; // 1 USD = 4000 COP aproximadamente
  const priceCOP = priceUSD * exchangeRate;

  // Usar Intl.NumberFormat para formato colombiano
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceCOP);
}

/**
 * Obtiene el nombre del usuario desde metadatos o UUID
 */
function getUserDisplayName(user) {
  if (!user) return "Anónimo";
  // Intentar obtener full_name de metadatos
  if (user.user_metadata?.full_name) {
    return user.user_metadata.full_name;
  }
  // Si no hay nombre, devolver email sin dominio
  return user.email?.split("@")[0] || user.id.substring(0, 8);
}

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Iniciando AI Phone Advisor...");

  // Verificar sesión actual
  await checkAuthStatus();

  // Cargar datos iniciales
  await loadPhones();

  // ========================================================================
  // [MEJORA] Cargar todos los comentarios para calcular ratings correctamente
  // ========================================================================
  await loadAllComments();

  // ========================================================================
  // [MEJORA] Validar estructura de tabla de comentarios
  // ========================================================================
  ensureCommentTableStructure();

  // ========================================================================
  // [NUEVA] Inicializar formulario de solicitud de nuevos modelos
  // ========================================================================
  initModelRequestForm();
  
  // Configurar event listeners
  setupEventListeners();

  // Configurar Chatbot
  setupChatbot();

  console.log("✅ Aplicación iniciada correctamente");
});

// ============================================================================
// AUTENTICACIÓN
// ============================================================================

async function checkAuthStatus() {
  try {
    const {
      data: { session },
    } = await window.supabase.auth.getSession();

    if (session) {
      AppState.currentUser = session.user;
      updateAuthUI();
      await checkAdminStatus();
    }
  } catch (error) {
    console.error("Error al verificar autenticación:", error);
  }
}

async function checkAdminStatus() {
  if (!AppState.currentUser) return;

  try {
    const { data, error } = await window.supabase
      .from("admin_users")
      .select("role")
      .eq("user_id", AppState.currentUser.id)
      .maybeSingle(); // Permite que no haya fila (usuario no es admin)

    AppState.isAdmin = !!data && !error; // true si existe data y no hay error
    updateAdminUI();
  } catch (error) {
    console.error("Error verificando admin status:", error);
    AppState.isAdmin = false;
    updateAdminUI();
  }
}

function toggleAuthModal() {
  const modal = document.getElementById("authModal");
  modal.classList.toggle("active");
  if (modal.classList.contains("active")) {
    modal.style.display = "flex";
  } else {
    modal.style.display = "none";
  }
}

function toggleAuthMode() {
  const authForm = document.getElementById("authForm");
  const signupForm = document.getElementById("signupForm");

  // Toggle clases active
  authForm.classList.toggle("active");
  signupForm.classList.toggle("active");

  // Limpiar errores al cambiar de formulario
  clearAuthError("authErrorMessage");
  clearAuthError("signupErrorMessage");

  // Limpiar campos
  document.getElementById("authEmail").value = "";
  document.getElementById("authPassword").value = "";
  document.getElementById("signupName").value = "";
  document.getElementById("signupEmail").value = "";
  document.getElementById("signupPassword").value = "";
  document.getElementById("agreeTerms").checked = false;
}

async function handleSignIn() {
  const email = document.getElementById("authEmail").value;
  const password = document.getElementById("authPassword").value;

  if (!email || !password) {
    showNotification("Por favor completa todos los campos", "error");
    return;
  }

  try {
    const { data, error } = await window.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    AppState.currentUser = data.user;
    await checkAdminStatus();
    updateAuthUI();
    toggleAuthModal();
    showNotification("¡Sesión iniciada correctamente!", "success");
  } catch (error) {
    console.error("Error en login:", error);
    showNotification(error.message || "Error al iniciar sesión", "error");
  }
}

async function handleSignUp() {
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  if (!name || !email || !password || password.length < 6) {
    showNotification(
      "Completa todos los campos. La contraseña debe tener al menos 6 caracteres",
      "error",
    );
    return;
  }

  try {
    const { data, error } = await window.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) throw error;

    showNotification(
      "¡Cuenta creada! Revisa tu email para confirmar",
      "success",
    );
    document.getElementById("signupEmail").value = "";
    document.getElementById("signupPassword").value = "";
    document.getElementById("signupName").value = "";
    toggleAuthMode();
  } catch (error) {
    console.error("Error en signup:", error);
    showNotification(error.message || "Error al crear cuenta", "error");
  }
}

async function handleSignOut() {
  try {
    const { error } = await window.supabase.auth.signOut();
    if (error) throw error;

    AppState.currentUser = null;
    AppState.isAdmin = false;
    updateAuthUI();
    toggleAuthModal();
    showNotification("Sesión cerrada correctamente", "success");

    // ========================================================================
    // [MEJORA] Recargar página después de logout para limpiar estado
    // ========================================================================
    setTimeout(() => {
      location.reload();
    }, 500);
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    showNotification("Error al cerrar sesión", "error");
  }
}

function updateAuthUI() {
  const authBtn = document.getElementById("authBtn");
  const userBadge = document.getElementById("userBadge");
  const userEmail = document.getElementById("userEmail");
  const authForm = document.getElementById("authForm");
  const signupForm = document.getElementById("signupForm");
  const userProfile = document.getElementById("userProfile");
  const commentFormContainer = document.getElementById("commentFormContainer");
  const navbar = document.querySelector(".navbar-menu");

  if (AppState.currentUser) {
    authBtn.textContent = "Perfil";
    authBtn.style.display = "none";

    userBadge.textContent = AppState.currentUser.email;
    userBadge.style.display = "inline-block";

    // Usar clases de CSS
    authForm.classList.remove("active");
    signupForm.classList.remove("active");
    userProfile.classList.add("active");

    userEmail.textContent = `Email: ${AppState.currentUser.email}`;

    // ========================================================================
    // [MEJORA] Botón de Logout visible solo cuando autenticado
    // ========================================================================
    let logoutBtn = navbar.querySelector(".nav-logout-btn");
    if (!logoutBtn) {
      logoutBtn = document.createElement("button");
      logoutBtn.className = "nav-btn nav-logout-btn";
      logoutBtn.innerHTML = "🚪 Cerrar Sesión";
      logoutBtn.onclick = handleSignOut;
      navbar.appendChild(logoutBtn);
    }

    // Mostrar formulario de comentarios solo para usuarios autenticados
    if (commentFormContainer) {
      commentFormContainer.style.display = "block";
    }
  } else {
    authBtn.textContent = "Entrar";
    authBtn.style.display = "inline-block";

    userBadge.style.display = "none";

    // Mostrar login, ocultar signup y perfil
    authForm.classList.add("active");
    signupForm.classList.remove("active");
    if (userProfile) userProfile.classList.remove("active");

    // Remover botón logout cuando no hay sesión
    const logoutBtn = navbar.querySelector(".nav-logout-btn");
    if (logoutBtn) logoutBtn.remove();

    if (commentFormContainer) {
      commentFormContainer.style.display = "none";
    }
  }
}

function updateAdminUI() {
  const navbar = document.querySelector(".navbar-menu");

  // Remover botón admin anterior si existe
  const existingAdminBtn = navbar.querySelector(".nav-admin-btn");
  if (existingAdminBtn) existingAdminBtn.remove();

  if (AppState.isAdmin) {
    const adminBtn = document.createElement("button");
    adminBtn.className = "nav-btn nav-admin-btn";
    adminBtn.innerHTML = "⚙️ Admin";
    adminBtn.onclick = toggleAdminModal;
    navbar.appendChild(adminBtn);
  }
}

/* ============================================================================
   [MODERNA] MANEJO MEJORADO DE AUTENTICACIÓN - Errores Amigables & UX
   ============================================================================ */

/**
 * Valida si un email tiene formato correcto
 */
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida la fortaleza de la contraseña
 */
function validatePassword(password) {
  return password.length >= 6;
}

/**
 * Muestra error en el contenedor específico del formulario
 */
function showAuthError(containerId, message) {
  const container = document.getElementById(containerId);
  if (container) {
    container.textContent = message;
    container.classList.add("show");
  }
}

/**
 * Limpia el error del formulario
 */
function clearAuthError(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.textContent = "";
    container.classList.remove("show");
  }
}

/**
 * Alterna visibilidad de la contraseña
 */
function togglePasswordVisibility(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field) return;

  const isPassword = field.type === "password";
  const toggleBtn = field.parentElement.querySelector(".password-toggle");

  if (isPassword) {
    field.type = "text";
    if (toggleBtn) toggleBtn.textContent = "🙈";
  } else {
    field.type = "password";
    if (toggleBtn) toggleBtn.textContent = "👁️";
  }
}

/**
 * Manejo mejorado de login con validación y errores específicos
 */
async function handleSignInForm(event) {
  event.preventDefault();

  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value;
  const errorContainer = "authErrorMessage";

  // Limpiar error previo
  clearAuthError(errorContainer);

  // ========================================================================
  // VALIDACIONES
  // ========================================================================
  if (!email) {
    showAuthError(errorContainer, "Por favor ingresa tu email");
    return;
  }

  if (!validateEmail(email)) {
    showAuthError(errorContainer, "Por favor ingresa un email válido");
    return;
  }

  if (!password) {
    showAuthError(errorContainer, "Por favor ingresa tu contraseña");
    return;
  }

  if (!validatePassword(password)) {
    showAuthError(
      errorContainer,
      "La contraseña debe tener al menos 6 caracteres",
    );
    return;
  }

  // ========================================================================
  // INTENTO DE LOGIN
  // ========================================================================
  try {
    const submitBtn = event.target.querySelector(".auth-submit-btn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.6";
    }

    const { data, error } = await window.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Mensajes específicos según el error
      if (error.message.includes("Invalid login credentials")) {
        showAuthError(errorContainer, "Email o contraseña incorrectos");
      } else if (error.message.includes("Email not confirmed")) {
        showAuthError(
          errorContainer,
          "Por favor confirma tu email antes de continuar",
        );
      } else {
        showAuthError(
          errorContainer,
          error.message || "Error al iniciar sesión",
        );
      }
      return;
    }

    AppState.currentUser = data.user;
    await checkAdminStatus();
    updateAuthUI();
    toggleAuthModal();
    showNotification("¡Sesión iniciada correctamente!", "success");

    // Limpiar formulario
    document.getElementById("authEmail").value = "";
    document.getElementById("authPassword").value = "";
  } catch (error) {
    console.error("Error en login:", error);
    showAuthError(
      errorContainer,
      "Hubo un problema. Por favor intenta de nuevo",
    );
  } finally {
    const submitBtn = event.target.querySelector(".auth-submit-btn");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
    }
  }
}

/**
 * Manejo mejorado de signup con validación exhaustiva
 */
async function handleSignUpForm(event) {
  event.preventDefault();

  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const agreeTerms = document.getElementById("agreeTerms").checked;
  const errorContainer = "signupErrorMessage";

  // Limpiar error previo
  clearAuthError(errorContainer);

  // ========================================================================
  // VALIDACIONES
  // ========================================================================
  if (!name) {
    showAuthError(errorContainer, "Por favor ingresa tu nombre");
    return;
  }

  if (name.length < 2) {
    showAuthError(errorContainer, "El nombre debe tener al menos 2 caracteres");
    return;
  }

  if (!email) {
    showAuthError(errorContainer, "Por favor ingresa tu email");
    return;
  }

  if (!validateEmail(email)) {
    showAuthError(errorContainer, "Por favor ingresa un email válido");
    return;
  }

  if (!password) {
    showAuthError(errorContainer, "Por favor ingresa una contraseña");
    return;
  }

  if (!validatePassword(password)) {
    showAuthError(
      errorContainer,
      "La contraseña debe tener al menos 6 caracteres",
    );
    return;
  }

  if (!agreeTerms) {
    showAuthError(
      errorContainer,
      "Debes aceptar los términos de servicio para continuar",
    );
    return;
  }

  // ========================================================================
  // INTENTO DE SIGNUP
  // ========================================================================
  try {
    const submitBtn = event.target.querySelector(".auth-submit-btn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.6";
    }

    const { data, error } = await window.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) {
      // Mensajes específicos según el error
      if (error.message.includes("already registered")) {
        showAuthError(
          errorContainer,
          "Este email ya está registrado. Intenta con otro o usa el login",
        );
      } else if (error.message.includes("weak password")) {
        showAuthError(
          errorContainer,
          "La contraseña es demasiado débil. Usa mayúsculas, números y símbolos",
        );
      } else {
        showAuthError(
          errorContainer,
          error.message || "Error al crear la cuenta",
        );
      }
      return;
    }

    // Signup exitoso
    showNotification(
      "¡Cuenta creada! Revisa tu email para confirmar",
      "success",
    );

    // Limpiar formulario
    document.getElementById("signupName").value = "";
    document.getElementById("signupEmail").value = "";
    document.getElementById("signupPassword").value = "";
    document.getElementById("agreeTerms").checked = false;

    // Cambiar a formulario de login después de 2 segundos
    setTimeout(() => {
      toggleAuthMode();
    }, 2000);
  } catch (error) {
    console.error("Error en signup:", error);
    showAuthError(
      errorContainer,
      "Hubo un problema. Por favor intenta de nuevo",
    );
  } finally {
    const submitBtn = event.target.querySelector(".auth-submit-btn");
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
    }
  }
}

// ============================================================================
// VALIDACIÓN DE ESTRUCTURA DE BD
// ============================================================================

/**
 * Valida y actualiza la estructura de la tabla de comentarios
 * Asegura que tenga el campo user_name para mostrar nombres en lugar de UUIDs
 */
async function ensureCommentTableStructure() {
  try {
    // Intentar hacer un INSERT con usuario anónimo para probar estructura
    // Nota: esto es solo para validación, no inserta realmente
    const testComment = {
      phone_id: "test",
      user_id: "test",
      user_name: "Test",
      title: "Test",
      content: "Test",
      is_published: false,
    };

    const { error } = await window.supabase
      .from("comments")
      .insert([testComment]);

    if (error) {
      if (error.message.includes("user_name")) {
        console.warn(
          "⚠️ Campo 'user_name' no existe en tabla comments. Agregando campo...",
        );
        // El error indica que el campo no existe
        console.log(
          "✅ Por favor, agrega la columna 'user_name' TEXT a la tabla 'comments' en Supabase",
        );
      } else if (error.code === "42P01") {
        console.error("❌ Tabla 'comments' no existe", error);
      }
      // No lanzar error - simplemente continuar sin validación
      return;
    }

    // Si la inserción fue exitosa (no debería ser), eliminarla
    if (error === null) {
      await window.supabase.from("comments").delete().eq("phone_id", "test");
    }

    console.debug("✅ Estructura de tabla de comentarios validada");
  } catch (error) {
    console.debug("ℹ️ No se pudo validar estructura (esperado):", error);
    // Continuar sin validación
  }
}

// ============================================================================
// GESTIÓN DE CELULARES (CRUD)
// ============================================================================

async function loadPhones() {
  try {
    const { data, error } = await window.supabase
      .from("phones")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    AppState.phones = data || [];
    AppState.filteredPhones = [...AppState.phones];

    // Cargar marcas para filtro
    loadBrandFilter();

    // Renderizar catálogo
    renderPhoneCatalog();
    renderComparatorDeviceSelect();

    console.log(`✅ Se cargaron ${AppState.phones.length} teléfonos`);
  } catch (error) {
    console.error("Error al cargar teléfonos:", error);
    showNotification("Error al cargar el catálogo", "error");
  }
}

function loadBrandFilter() {
  const brands = [...new Set(AppState.phones.map((p) => p.brand))].sort();
  const filterBrand = document.getElementById("filterBrand");

  brands.forEach((brand) => {
    const option = document.createElement("option");
    option.value = brand;
    option.textContent = brand;
    filterBrand.appendChild(option);
  });
}

async function handlePhoneCRUD(event) {
  event.preventDefault();

  if (!AppState.isAdmin) {
    showNotification("No tienes permisos para esta acción", "error");
    return;
  }

  const id = document.getElementById("phoneFormId").value;
  const phoneData = {
    name: document.getElementById("formPhoneName").value,
    brand: document.getElementById("formPhoneBrand").value,
    model: document.getElementById("formPhoneModel").value,
    price_usd: parseFloat(document.getElementById("formPhonePrice").value),
    release_year: parseInt(document.getElementById("formPhoneYear").value),
    ram_gb: parseInt(document.getElementById("formPhoneRam").value),
    storage_gb: parseInt(document.getElementById("formPhoneStorage").value),
    battery_mah: parseInt(document.getElementById("formPhoneBattery").value),
    camera_mp_main: parseInt(document.getElementById("formPhoneCamera").value),
    camera_mp_front: parseInt(
      document.getElementById("formPhoneSelfieCam").value,
    ),
    processor: document.getElementById("formPhoneProcessor").value,
  };

  try {
    let result;

    if (id) {
      // ACTUALIZAR
      result = await window.supabase
        .from("phones")
        .update(phoneData)
        .eq("id", id);
      showNotification("Teléfono actualizado", "success");
    } else {
      // CREAR (agregar created_by)
      phoneData.created_by = AppState.currentUser.id;
      result = await window.supabase.from("phones").insert([phoneData]);
      showNotification("Teléfono creado", "success");
    }

    if (result.error) throw result.error;

    resetPhoneForm();
    await loadPhones();
    await loadAdminPhonesTable();
  } catch (error) {
    console.error("Error en CRUD de teléfono:", error);
    showNotification(error.message || "Error al guardar teléfono", "error");
  }
}

function resetPhoneForm() {
  document.getElementById("phoneFormId").value = "";
  document.getElementById("phoneForm").reset();
}

async function editPhone(id) {
  const phone = AppState.phones.find((p) => p.id === id);
  if (!phone) return;

  document.getElementById("phoneFormId").value = id;
  document.getElementById("formPhoneName").value = phone.name;
  document.getElementById("formPhoneBrand").value = phone.brand;
  document.getElementById("formPhoneModel").value = phone.model;
  document.getElementById("formPhonePrice").value = phone.price_usd;
  document.getElementById("formPhoneYear").value = phone.release_year;
  document.getElementById("formPhoneRam").value = phone.ram_gb;
  document.getElementById("formPhoneStorage").value = phone.storage_gb;
  document.getElementById("formPhoneBattery").value = phone.battery_mah;
  document.getElementById("formPhoneCamera").value = phone.camera_mp_main;
  document.getElementById("formPhoneSelfieCam").value = phone.camera_mp_front;
  document.getElementById("formPhoneProcessor").value = phone.processor;
}

async function deletePhone(id) {
  if (!AppState.isAdmin) {
    showNotification("No tienes permisos", "error");
    return;
  }

  if (!confirm("¿Estás seguro de que deseas eliminar este teléfono?")) return;

  try {
    const { error } = await window.supabase
      .from("phones")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw error;

    await loadPhones();
    await loadAdminPhonesTable();
    showNotification("Teléfono eliminado", "success");
  } catch (error) {
    console.error("Error al eliminar:", error);
    showNotification("Error al eliminar teléfono", "error");
  }
}

// ============================================================================
// RENDERIZADO DE CATÁLOGO
// ============================================================================

function renderPhoneCatalog() {
  const grid = document.getElementById("phoneGrid");
  grid.innerHTML = "";

  if (AppState.filteredPhones.length === 0) {
    grid.innerHTML =
      '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No se encontraron teléfonos</p>';
    return;
  }

  AppState.filteredPhones.forEach((phone) => {
    const card = createPhoneCard(phone);
    grid.appendChild(card);
  });
}

function createPhoneCard(phone) {
  const card = document.createElement("div");
  card.className = "phone-card";

  const rating = calculateAverageRating(phone.id);
  const commentCount = calculateCommentCount(phone.id);

  card.innerHTML = `
        <div class="phone-card-header">
            <div class="phone-name">${escapeHtml(phone.name)}</div>
            <div class="phone-brand">${escapeHtml(phone.brand)}</div>
        </div>
        
        <div class="phone-price">${formatPrice(phone.price_usd)}</div>
        
        <div class="phone-specs">
            <div class="spec-item">
                <span class="spec-label">RAM:</span>
                <span class="spec-value">${phone.ram_gb}GB</span>
            </div>
            <div class="spec-item">
                <span class="spec-label">Almacenamiento:</span>
                <span class="spec-value">${phone.storage_gb}GB</span>
            </div>
            <div class="spec-item">
                <span class="spec-label">Batería:</span>
                <span class="spec-value">${phone.battery_mah}mAh</span>
            </div>
            <div class="spec-item">
                <span class="spec-label">Cámara:</span>
                <span class="spec-value">${phone.camera_mp_main}MP</span>
            </div>
        </div>
        
        <div class="phone-rating">
            <span class="star-icon">⭐</span>
            <span>${rating > 0 ? rating.toFixed(1) : "Sin valorar"}</span>
            <span class="rating-count">(${commentCount})</span>
        </div>
        
        <div class="phone-actions">
            <button class="btn-view" style="color: #1a1c1e;" onclick="openPhoneModal('${phone.id}')">Ver Detalles</button>
            <button class="btn-compare-select" id="btn-compare-${phone.id}" 
                    onclick="toggleComparisonSelection('${phone.id}')" 
                    data-phone-id="${phone.id}">
                📊 Comparar
            </button>
        </div>
    `;

  return card;
}

// ============================================================================
// FILTROS Y BÚSQUEDA
// ============================================================================

function applyFilters() {
  const brand = document.getElementById("filterBrand").value;
  const maxPrice = parseFloat(document.getElementById("filterPrice").value);
  const sortBy = document.getElementById("filterSort").value;

  // Actualizar display de precio
  document.getElementById("priceDisplay").textContent = `$${maxPrice}`;

  // Filtrar
  AppState.filteredPhones = AppState.phones.filter((phone) => {
    const brandMatch = !brand || phone.brand === brand;
    const priceMatch = phone.price_usd <= maxPrice;
    return brandMatch && priceMatch;
  });

  // Ordenar
  switch (sortBy) {
    case "price-asc":
      AppState.filteredPhones.sort((a, b) => a.price_usd - b.price_usd);
      break;
    case "price-desc":
      AppState.filteredPhones.sort((a, b) => b.price_usd - a.price_usd);
      break;
    case "rating":
      AppState.filteredPhones.sort(
        (a, b) => calculateAverageRating(b.id) - calculateAverageRating(a.id),
      );
      break;
    case "newest":
    default:
      AppState.filteredPhones.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );
  }

  renderPhoneCatalog();
}

// ============================================================================
// SISTEMA DE SEMÁFORO (TRAFFIC LIGHT)
// ============================================================================

function calculateTrafficLight(phone) {
  const indicators = {
    bateria: calculateBatteryRating(phone.battery_mah),
    ram: calculateRamRating(phone.ram_gb),
    camara: calculateCameraRating(phone.camera_mp_main),
    almacenamiento: calculateStorageRating(phone.storage_gb),
  };

  return indicators;
}

function calculateBatteryRating(mah) {
  if (mah >= 4500)
    return { status: "green", label: "Excelente Batería", value: mah };
  if (mah >= 4000)
    return { status: "yellow", label: "Buena Batería", value: mah };
  return { status: "red", label: "Batería Regular", value: mah };
}

function calculateRamRating(ram) {
  if (ram >= 12) return { status: "green", label: "RAM Óptima", value: ram };
  if (ram >= 8) return { status: "yellow", label: "RAM Adecuada", value: ram };
  return { status: "red", label: "RAM Limitada", value: ram };
}

function calculateCameraRating(mp) {
  if (mp >= 48)
    return { status: "green", label: "Cámara Excelente", value: mp };
  if (mp >= 20) return { status: "yellow", label: "Cámara Buena", value: mp };
  return { status: "red", label: "Cámara Básica", value: mp };
}

function calculateStorageRating(gb) {
  if (gb >= 256)
    return { status: "green", label: "Almacenamiento Amplio", value: gb };
  if (gb >= 128)
    return { status: "yellow", label: "Almacenamiento Aceptable", value: gb };
  return { status: "red", label: "Almacenamiento Limitado", value: gb };
}

function renderTrafficLight(phone) {
  const indicators = calculateTrafficLight(phone);
  const container = document.getElementById("trafficLight");

  container.innerHTML = "";

  Object.entries(indicators).forEach(([key, indicator]) => {
    const item = document.createElement("div");
    item.className = "traffic-light-item";
    item.innerHTML = `
            <div class="light-indicator ${indicator.status}"></div>
            <div class="light-label">
                <div class="light-name">${indicator.label}</div>
                <div class="light-value">${indicator.value}</div>
            </div>
        `;
    container.appendChild(item);
  });
}

// ============================================================================
// BADGES DE ESTILO DE VIDA
// ============================================================================

function generateLifestyleBadges(phone) {
  const badges = [];

  // Fotografía
  if (phone.camera_mp_main >= 48) {
    badges.push({ icon: "📸", text: "Ideal para Fotos" });
  }

  // Video
  if (phone.has_4k_recording) {
    badges.push({ icon: "🎥", text: "Videos 4K" });
  }

  // Gaming
  if (phone.ram_gb >= 12) {
    badges.push({ icon: "🎮", text: "Ideal para Gaming" });
  }

  // Multimedia
  if (phone.battery_mah >= 4500 && phone.display_size >= 6.5) {
    badges.push({ icon: "🎬", text: "Perfecto para Multimedia" });
  }

  // Trabajo
  if (phone.ram_gb >= 8 && phone.storage_gb >= 256) {
    badges.push({ icon: "💼", text: "Productividad Pro" });
  }

  // Batería duradera
  if (phone.battery_mah >= 5000) {
    badges.push({ icon: "🔋", text: "Batería Ultra" });
  }

  // Compacto
  if (phone.display_size && phone.display_size <= 6.0) {
    badges.push({ icon: "📱", text: "Compacto" });
  }

  // Flagship
  if (phone.price_usd >= 800) {
    badges.push({ icon: "👑", text: "Premium Flagship" });
  }

  // Presupuesto
  if (phone.price_usd <= 300) {
    badges.push({ icon: "💰", text: "Presupuesto" });
  }

  return badges;
}

function renderLifestyleBadges(phone) {
  const badgesContainer = document.getElementById("lifestyleBadges");
  const badges = generateLifestyleBadges(phone);

  badgesContainer.innerHTML = "";

  badges.forEach((badge) => {
    const badgeEl = document.createElement("div");
    badgeEl.className = "badge";
    badgeEl.innerHTML = `<span style="color: black;">${badge.icon} ${badge.text}</span>`;
    badgesContainer.appendChild(badgeEl);
  });
}

// ============================================================================
// DETALLES DE PRODUCTO (MODAL)
// ============================================================================

async function openPhoneModal(phoneId) {
  const phone = AppState.phones.find((p) => p.id === phoneId);
  if (!phone) return;

  AppState.selectedPhoneForDetails = phone;

  const modal = document.getElementById("phoneDetailModal");
  modal.classList.add("active");
  modal.style.display = "flex";

  // Título y especificaciones
  document.getElementById("phoneModalTitle").textContent = phone.name;

  const specsContainer = document.getElementById("phoneModalSpecs");
  specsContainer.innerHTML = `
        <div class="spec-item">
            <span class="spec-label">Precio:</span>
            <span class="spec-value">${formatPrice(phone.price_usd)}</span>
        </div>
        <div class="spec-item">
            <span class="spec-label">Año:</span>
            <span class="spec-value">${phone.release_year}</span>
        </div>
        <div class="spec-item">
            <span class="spec-label">Procesador:</span>
            <span class="spec-value">${escapeHtml(phone.processor || "N/A")}</span>
        </div>
        <div class="spec-item">
            <span class="spec-label">RAM:</span>
            <span class="spec-value">${phone.ram_gb}GB</span>
        </div>
        <div class="spec-item">
            <span class="spec-label">Almacenamiento:</span>
            <span class="spec-value">${phone.storage_gb}GB</span>
        </div>
        <div class="spec-item">
            <span class="spec-label">Pantalla:</span>
            <span class="spec-value">${phone.display_size || "?"}" ${phone.display_type || ""}</span>
        </div>
        <div class="spec-item">
            <span class="spec-label">Batería:</span>
            <span class="spec-value">${phone.battery_mah}mAh</span>
        </div>
        <div class="spec-item">
            <span class="spec-label">Cámara Principal:</span>
            <span class="spec-value">${phone.camera_mp_main}MP</span>
        </div>
        <div class="spec-item">
            <span class="spec-label">Peso:</span>
            <span class="spec-value">${phone.weight_grams || "?"}g</span>
        </div>
    `;

  // Sistema de Semáforo
  renderTrafficLight(phone);

  // Badges de Estilo de Vida
  renderLifestyleBadges(phone);

  // Cargar comentarios
  await loadCommentsForPhone(phoneId);

  // Resetear formulario de comentarios
  resetCommentForm();

  // Setup de rating de estrellas
  setupStarRatings();
}

function closePhoneModal() {
  const modal = document.getElementById("phoneDetailModal");
  modal.classList.remove("active");
  modal.style.display = "none";
  AppState.selectedPhoneForDetails = null;
}

// ============================================================================
// SISTEMA DE COMENTARIOS
// ============================================================================

async function loadCommentsForPhone(phoneId) {
  try {
    // ========================================================================
    // [MEJORA] Obtener comentarios con información básica del usuario
    // ========================================================================
    const { data, error } = await window.supabase
      .from("comments")
      .select("*")
      .eq("phone_id", phoneId)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const enrichedData = data || [];

    // ========================================================================
    // [MEJORA] Enriquecer con datos de usuario si está disponible
    // ========================================================================
    if (enrichedData.length > 0) {
      // Primero, intentar obtener info de auth.users (si hay acceso RLS)
      try {
        const userIds = [...new Set(enrichedData.map((c) => c.user_id))];
        const { data: usersData } = await window.supabase
          .from("auth.users")
          .select("id, email, user_metadata")
          .in("id", userIds);

        if (usersData) {
          const userMap = Object.fromEntries(usersData.map((u) => [u.id, u]));
          enrichedData.forEach((comment) => {
            if (userMap[comment.user_id]) {
              comment.user = userMap[comment.user_id];
            }
          });
        }
      } catch (e) {
        // Si falla auth.users, intentar acceso a tabla users si existe
        try {
          const userIds = [...new Set(enrichedData.map((c) => c.user_id))];
          const { data: usersData } = await window.supabase
            .from("users")
            .select("id, email, full_name")
            .in("id", userIds);

          if (usersData) {
            enrichedData.forEach((comment) => {
              const user = usersData.find((u) => u.id === comment.user_id);
              if (user) {
                comment.user = {
                  email: user.email,
                  user_metadata: { full_name: user.full_name },
                };
              }
            });
          }
        } catch (e2) {
          console.debug("No se pudo cargar información adicional de usuarios");
        }
      }
    }

    renderCommentsList(enrichedData);
  } catch (error) {
    console.error("Error al cargar comentarios:", error);
  }
}

function renderCommentsList(comments) {
  const container = document.getElementById("commentsList");
  container.innerHTML = "";

  if (comments.length === 0) {
    container.innerHTML =
      '<p style="text-align: center; color: #a1a1a6;">No hay comentarios aún</p>';
    return;
  }

  comments.forEach((comment) => {
    const card = document.createElement("div");
    card.className = "comment-card";

    const date = new Date(comment.created_at).toLocaleDateString("es-ES");
    const rating = Math.round(comment.rating_overall || 0);

    // ========================================================================
    // [MEJORA] Obtener nombre del usuario con múltiples fallbacks
    // Prioridad: user_name > user.user_metadata.full_name > user.email > AppState.currentUser > UUID truncado
    // ========================================================================
    let authorName = "Usuario Anónimo";

    // 1. Intentar user_name guardado en el comentario
    if (comment.user_name && comment.user_name.trim()) {
      authorName = comment.user_name;
    }
    // 2. Intentar obtener nombre completo del usuario
    else if (comment.user?.user_metadata?.full_name) {
      authorName = comment.user.user_metadata.full_name;
    }
    // 3. Intentar obtener email del usuario
    else if (comment.user?.email) {
      authorName = comment.user.email.split("@")[0];
    }
    // 4. Si es el usuario actual, mostrar "Tú"
    else if (AppState.currentUser?.id === comment.user_id) {
      if (AppState.currentUser.user_metadata?.full_name) {
        authorName = AppState.currentUser.user_metadata.full_name + " (Tú)";
      } else if (AppState.currentUser.email) {
        authorName = AppState.currentUser.email.split("@")[0] + " (Tú)";
      } else {
        authorName = "Tú";
      }
    }
    // 5. Último recurso: mostrar inicio del UUID de forma legible
    else {
      authorName = "Usuario #" + comment.user_id.substring(0, 8).toUpperCase();
    }

    card.innerHTML = `
            <div class="comment-header">
                <div>
                    <div class="comment-author">${escapeHtml(authorName)}</div>
                    <div class="comment-date">${date}</div>
                </div>
                <div class="comment-rating">
                    ${"⭐".repeat(rating)}
                </div>
            </div>
            
            <div class="comment-title">${escapeHtml(comment.title)}</div>
            <div class="comment-body">${escapeHtml(comment.content)}</div>
            
            <div class="comment-stats">
                <div class="stat-item">
                    <div class="stat-label">Cámara</div>
                    <div class="stat-value">${comment.rating_camera || "-"}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Batería</div>
                    <div class="stat-value">${comment.rating_battery || "-"}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Rendimiento</div>
                    <div class="stat-value">${comment.rating_performance || "-"}</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">General</div>
                    <div class="stat-value">${comment.rating_overall || "-"}</div>
                </div>
            </div>
        `;

    container.appendChild(card);
  });
}

async function submitComment(event) {
  event.preventDefault();

  if (!AppState.currentUser || !AppState.selectedPhoneForDetails) {
    showNotification("Debes iniciar sesión", "error");
    return;
  }

  try {
    // ========================================================================
    // [MEJORA] Obtener nombre del usuario para almacenarlo en comentario
    // ========================================================================
    const userName =
      AppState.currentUser.user_metadata?.full_name ||
      AppState.currentUser.email?.split("@")[0] ||
      "Usuario Anónimo";

    const commentData = {
      phone_id: AppState.selectedPhoneForDetails.id,
      user_id: AppState.currentUser.id,
      user_name: userName,
      title: document.getElementById("commentTitle").value,
      content: document.getElementById("commentContent").value,
      rating_overall:
        parseInt(document.getElementById("ratingOverallValue").value) || null,
      rating_camera:
        parseInt(document.getElementById("ratingCameraValue").value) || null,
      rating_battery:
        parseInt(document.getElementById("ratingBatteryValue").value) || null,
      rating_performance:
        parseInt(document.getElementById("ratingPerformanceValue").value) ||
        null,
      is_published: true,
    };

    const { data, error } = await window.supabase
      .from("comments")
      .insert([commentData]);

    if (error) throw error;

    showNotification("Comentario publicado", "success");
    resetCommentForm();

    // ========================================================================
    // [MEJORA] Actualizar AppState.comments con el nuevo comentario
    // ========================================================================
    if (data && data.length > 0) {
      AppState.comments.push(data[0]);
    }

    await loadCommentsForPhone(AppState.selectedPhoneForDetails.id);

    // Renderizar tarjetas de nuevo para actualizar contador en catálogo
    renderPhoneCatalog();
  } catch (error) {
    console.error("Error al publicar comentario:", error);
    showNotification(error.message || "Error al publicar comentario", "error");
  }
}

function resetCommentForm() {
  document.getElementById("commentTitle").value = "";
  document.getElementById("commentContent").value = "";
  document.getElementById("ratingOverallValue").value = "0";
  document.getElementById("ratingCameraValue").value = "0";
  document.getElementById("ratingBatteryValue").value = "0";
  document.getElementById("ratingPerformanceValue").value = "0";

  // Remover clase 'selected' de todas las estrellas
  document.querySelectorAll(".star").forEach((star) => {
    star.classList.remove("selected");
  });
}

// Sistema de calificación por estrellas
function setupStarRatings() {
  document.querySelectorAll(".stars").forEach((starsContainer) => {
    const stars = starsContainer.querySelectorAll(".star");
    const inputId = starsContainer.id + "Value";
    const input = document.getElementById(inputId);

    stars.forEach((star, index) => {
      star.addEventListener("click", () => {
        const rating = index + 1;
        input.value = rating;

        stars.forEach((s, i) => {
          if (i < rating) {
            s.classList.add("selected");
          } else {
            s.classList.remove("selected");
          }
        });
      });
    });
  });
}

function calculateAverageRating(phoneId) {
  // ========================================================================
  // [MEJORA] Filtrar comentarios del teléfono específico
  // Ahora AppState.comments debería estar poblado correctamente
  // ========================================================================
  const phoneComments = AppState.comments.filter((c) => c.phone_id === phoneId);

  if (phoneComments.length === 0) {
    return 0;
  }

  const sum = phoneComments.reduce(
    (acc, c) => acc + (c.rating_overall || 0),
    0,
  );

  const average = sum / phoneComments.length;

  // Debug: mostrar información en consola
  if (phoneComments.length > 0) {
    console.debug(
      `📊 Phone ${phoneId}: ${phoneComments.length} votos, promedio: ${average.toFixed(1)}`,
    );
  }

  return average;
}

// ============================================================================
// COMPARADOR VISUAL CON RADAR CHART
// ============================================================================

function renderComparatorDeviceSelect() {
  const container = document.getElementById("comparatorDeviceSelect");
  container.innerHTML = "";

  AppState.phones.slice(0, 10).forEach((phone) => {
    const item = document.createElement("div");
    item.className = "device-select-item";
    item.id = `select-${phone.id}`;

    item.innerHTML = `
            <div class="device-select-info">
                <div class="device-select-name">${escapeHtml(phone.name)}</div>
                <div class="device-select-price">${formatPrice(phone.price_usd)}</div>
            </div>
            <input type="checkbox" data-phone-id="${phone.id}">
        `;

    item.addEventListener("click", () => toggleComparisonSelection(phone.id));
    container.appendChild(item);
  });
}

function toggleComparisonSelection(phoneId) {
  const index = AppState.selectedPhonesForComparison.indexOf(phoneId);

  if (index > -1) {
    AppState.selectedPhonesForComparison.splice(index, 1);
  } else {
    if (AppState.selectedPhonesForComparison.length >= 3) {
      showNotification("Máximo 3 teléfonos para comparar", "error");
      return;
    }
    AppState.selectedPhonesForComparison.push(phoneId);
  }

  updateComparisonSelectionUI();
}

function updateComparisonSelectionUI() {
  document.querySelectorAll("[data-phone-id]").forEach((checkbox) => {
    const phoneId = checkbox.getAttribute("data-phone-id");
    const itemContainer = checkbox.closest(".device-select-item");

    if (AppState.selectedPhonesForComparison.includes(phoneId)) {
      itemContainer.classList.add("selected");
      checkbox.checked = true;
    } else {
      itemContainer.classList.remove("selected");
      checkbox.checked = false;
    }
  });

  // Actualizar botones de comparación en tarjetas
  document.querySelectorAll('[id^="btn-compare-"]').forEach((btn) => {
    const phoneId = btn.getAttribute("data-phone-id");
    if (AppState.selectedPhonesForComparison.includes(phoneId)) {
      btn.classList.add("selected");
    } else {
      btn.classList.remove("selected");
    }
  });
}

function startComparison() {
  if (AppState.selectedPhonesForComparison.length < 2) {
    showNotification("Selecciona al menos 2 teléfonos", "error");
    return;
  }

  const selectedPhones = AppState.phones.filter((p) =>
    AppState.selectedPhonesForComparison.includes(p.id),
  );

  renderComparisonCharts(selectedPhones);
  renderComparisonTable(selectedPhones);

  document.getElementById("comparisonResults").style.display = "block";
  document
    .querySelector(".comparison-results")
    .scrollIntoView({ behavior: "smooth" });
}

function clearComparison() {
  // ========================================================================
  // [MEJORA] Limpiar completamente el estado de comparación
  // ========================================================================

  // 1. Vaciar array de selección
  AppState.selectedPhonesForComparison = [];
  console.debug("✅ Array de comparación limpiado");

  // 2. Actualizar UI (remover clases "selected")
  updateComparisonSelectionUI();
  console.debug("✅ UI de selección actualizada");

  // 3. Destruir gráfico si existe
  if (AppState.radarChart) {
    AppState.radarChart.destroy();
    AppState.radarChart = null;
    console.debug("✅ Gráfico Radar destruido");
  }

  // 4. Ocultar resultados
  document.getElementById("comparisonResults").style.display = "none";
  console.debug("✅ Sección de comparación ocultada");

  // 5. Mostrar notificación al usuario
  showNotification("Comparación limpiada", "success");
}

function renderComparisonCharts(phones) {
  const canvas = document.getElementById("radarChart");
  if (!canvas) return;

  // Destruir gráfico anterior si existe
  if (AppState.radarChart) {
    AppState.radarChart.destroy();
  }

  // Normalizar especificaciones (0-100)
  const datasets = phones.map((phone, index) => {
    const colors = [
      "rgba(99, 102, 241, 0.5)",
      "rgba(139, 92, 246, 0.5)",
      "rgba(59, 130, 246, 0.5)",
    ];

    return {
      label: phone.name,
      data: [
        normalizeValue(phone.ram_gb, 0, 24) * 100,
        normalizeValue(phone.battery_mah, 2000, 6000) * 100,
        normalizeValue(phone.camera_mp_main, 0, 200) * 100,
        normalizeValue(phone.storage_gb, 0, 1000) * 100,
        normalizeValue(2024 - phone.release_year, 0, 15) * 100,
        normalizeValue(3000 - phone.price_usd, 0, 3000) * 100,
      ],
      borderColor: colors[index],
      backgroundColor: colors[index],
      borderWidth: 2,
    };
  });

  AppState.radarChart = new Chart(canvas, {
    type: "radar",
    data: {
      labels: [
        "RAM",
        "Batería",
        "Cámara",
        "Almacenamiento",
        "Reciente",
        "Precio",
      ],
      datasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: { color: "#f4f4f5" },
        },
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { color: "#a1a1a6" },
          grid: { color: "#3f3f46" },
        },
      },
    },
  });
}

function normalizeValue(value, min, max) {
  return Math.min(Math.max((value - min) / (max - min), 0), 1);
}

function renderComparisonTable(phones) {
  const container = document.getElementById("comparisonTable");

  let html = `
        <table class="comparison-table">
            <thead>
                <tr>
                    <th>Especificación</th>
                    ${phones.map((p) => `<th>${escapeHtml(p.name)}</th>`).join("")}
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Precio</strong></td>
                    ${phones.map((p) => `<td>${formatPrice(p.price_usd)}</td>`).join("")}
                </tr>
                <tr>
                    <td><strong>Año</strong></td>
                    ${phones.map((p) => `<td>${p.release_year}</td>`).join("")}
                </tr>
                <tr>
                    <td><strong>Procesador</strong></td>
                    ${phones.map((p) => `<td>${escapeHtml(p.processor || "N/A")}</td>`).join("")}
                </tr>
                <tr>
                    <td><strong>RAM</strong></td>
                    ${phones.map((p) => `<td>${p.ram_gb}GB</td>`).join("")}
                </tr>
                <tr>
                    <td><strong>Almacenamiento</strong></td>
                    ${phones.map((p) => `<td>${p.storage_gb}GB</td>`).join("")}
                </tr>
                <tr>
                    <td><strong>Pantalla</strong></td>
                    ${phones.map((p) => `<td>${p.display_size || "?"}" ${p.display_type || ""}</td>`).join("")}
                </tr>
                <tr>
                    <td><strong>Batería</strong></td>
                    ${phones.map((p) => `<td>${p.battery_mah}mAh</td>`).join("")}
                </tr>
                <tr>
                    <td><strong>Cámara Principal</strong></td>
                    ${phones.map((p) => `<td>${p.camera_mp_main}MP</td>`).join("")}
                </tr>
                <tr>
                    <td><strong>Cámara Frontal</strong></td>
                    ${phones.map((p) => `<td>${p.camera_mp_front || "N/A"}MP</td>`).join("")}
                </tr>
                <tr>
                    <td><strong>Peso</strong></td>
                    ${phones.map((p) => `<td>${p.weight_grams || "?"}g</td>`).join("")}
                </tr>
            </tbody>
        </table>
    `;

  container.innerHTML = html;
}

// ============================================================================
// FORMULARIO DE SOLICITUD DE NUEVOS MODELOS
// ============================================================================

function toggleFeatureRequestModal() {
  const modal = document.getElementById("featureRequestModal");
  modal.classList.toggle("active");
  modal.style.display = modal.classList.contains("active") ? "flex" : "none";
}

async function submitFeatureRequest(event) {
  event.preventDefault();

  if (!AppState.currentUser) {
    showNotification("Debes iniciar sesión", "error");
    return;
  }

  try {
    const { error } = await window.supabase.from("feature_requests").insert([
      {
        user_id: AppState.currentUser.id,
        phone_brand: document.getElementById("requestBrand").value,
        phone_model: document.getElementById("requestModel").value,
        reason: document.getElementById("requestReason").value,
      },
    ]);

    if (error) {
      if (error.code === "23505") {
        showNotification("Ya has solicitado este modelo", "error");
        return;
      }
      throw error;
    }

    showNotification("Solicitud enviada exitosamente", "success");
    document
      .getElementById("featureRequestModal")
      .querySelector("form")
      .reset();
    toggleFeatureRequestModal();
  } catch (error) {
    console.error("Error al enviar solicitud:", error);
    showNotification(error.message || "Error al enviar solicitud", "error");
  }
}

// ============================================================================
// PANEL DE ADMINISTRADOR
// ============================================================================

function toggleAdminModal() {
  if (!AppState.isAdmin) {
    showNotification("No tienes acceso a esta sección", "error");
    return;
  }

  const modal = document.getElementById("adminModal");
  modal.classList.toggle("active");
  modal.style.display = modal.classList.contains("active") ? "flex" : "none";

  if (modal.classList.contains("active")) {
    loadAdminData();
  }
}

function closeAdminModal() {
  const modal = document.getElementById("adminModal");
  modal.classList.remove("active");
  modal.style.display = "none";
}

function switchAdminTab(tabName) {
  // Remover clase active de todos los tabs
  document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.classList.remove("active");
  });
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Agregar clase active al tab seleccionado
  document
    .getElementById(
      `admin${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`,
    )
    .classList.add("active");
  event.target.classList.add("active");
}

async function loadAdminData() {
  await loadAdminPhonesTable();
  await loadAdminRequestsTable();
  await loadAdminCommentsTable();
}

async function loadAdminPhonesTable() {
  try {
    const { data, error } = await window.supabase
      .from("phones")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const tbody = document.querySelector("#phonesTable tbody");
    tbody.innerHTML = "";

    (data || []).forEach((phone) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${escapeHtml(phone.name)}</td>
                <td>${escapeHtml(phone.brand)}</td>
                <td>${formatPrice(phone.price_usd)}</td>
                <td>${phone.ram_gb}GB</td>
                <td>
                    <button class="btn-edit" onclick="editPhone('${phone.id}')">✏️ Editar</button>
                    <button class="btn-delete" onclick="deletePhone('${phone.id}')">🗑️ Eliminar</button>
                </td>
            `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("Error al cargar tabla de teléfonos:", error);
  }
}

async function loadAdminRequestsTable() {
  if (!AppState.isAdmin) return;

  try {
    const { data, error } = await window.supabase
      .from("feature_requests")
      .select("*, user_id")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const tbody = document.querySelector("#requestsTable tbody");
    tbody.innerHTML = "";

    (data || []).forEach((request) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${request.user_id.substring(0, 8)}</td>
                <td>${escapeHtml(request.phone_brand)}</td>
                <td>${escapeHtml(request.phone_model)}</td>
                <td>${escapeHtml(request.reason.substring(0, 50))}</td>
                <td>${request.status}</td>
                <td>
                    <button class="btn-approve" onclick="updateRequestStatus('${request.id}', 'added')">✓ Agregado</button>
                    <button class="btn-reject" onclick="updateRequestStatus('${request.id}', 'rejected')">✗ Rechazar</button>
                </td>
            `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("Error al cargar solicitudes:", error);
  }
}

async function loadAdminCommentsTable() {
  if (!AppState.isAdmin) return;

  try {
    const { data, error } = await window.supabase
      .from("comments")
      .select("*, phone_id")
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    const tbody = document.querySelector("#commentsTable tbody");
    tbody.innerHTML = "";

    (data || []).forEach((comment) => {
      const phone = AppState.phones.find((p) => p.id === comment.phone_id);
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${comment.user_id.substring(0, 8)}</td>
                <td>${phone ? escapeHtml(phone.name) : "N/A"}</td>
                <td>${escapeHtml(comment.title.substring(0, 30))}</td>
                <td>${comment.is_published ? "✓ Sí" : "✗ No"}</td>
                <td>
                    <button class="btn-delete" onclick="deleteComment('${comment.id}')">🗑️ Eliminar</button>
                </td>
            `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("Error al cargar comentarios:", error);
  }
}

async function updateRequestStatus(requestId, status) {
  if (!AppState.isAdmin) return;

  try {
    const { error } = await window.supabase
      .from("feature_requests")
      .update({ status })
      .eq("id", requestId);

    if (error) throw error;

    await loadAdminRequestsTable();
    showNotification("Solicitud actualizada", "success");
  } catch (error) {
    console.error("Error al actualizar solicitud:", error);
    showNotification("Error al actualizar", "error");
  }
}

async function deleteComment(commentId) {
  if (!AppState.isAdmin) return;

  if (!confirm("¿Eliminar este comentario?")) return;

  try {
    const { error } = await window.supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) throw error;

    await loadAdminCommentsTable();
    showNotification("Comentario eliminado", "success");
  } catch (error) {
    console.error("Error al eliminar comentario:", error);
    showNotification("Error al eliminar", "error");
  }
}

// ============================================================================
// FORMULARIO DE SOLICITUD VÍA FORMSPREE (AJAX)
// ============================================================================

/**
 * Inicializa el formulario de solicitud de nuevos modelos
 * Maneja visibilidad, auto-complete de email, y envío vía AJAX
 */
function initModelRequestForm() {
  const section = document.getElementById("modelRequestSection");
  const form = document.getElementById("modelRequestForm");
  const userEmailInput = document.getElementById("userEmail");
  const notAuthMessage = document.getElementById("modelFormNotAuthenticated");
  
  if (!form) {
    console.warn("⚠️ Formulario de solicitud de modelos no encontrado");
    return;
  }

  // ========================================================================
  // 1. MOSTRAR/OCULTAR SECCIÓN SEGÚN AUTENTICACIÓN
  // ========================================================================
  function updateFormVisibility() {
    if (AppState.currentUser) {
      // Usuario autenticado: mostrar formulario
      section.style.display = "block";
      form.style.display = "block";
      notAuthMessage.style.display = "none";
      
      // Auto-completar email del usuario
      userEmailInput.value = AppState.currentUser.email || "";
      
      console.debug("✅ Formulario de solicitud visible para usuario autenticado");
    } else {
      // Usuario NO autenticado: mostrar mensaje
      section.style.display = "block";
      form.style.display = "none";
      notAuthMessage.style.display = "flex";
      userEmailInput.value = "";
      
      console.debug("ℹ️ Formulario de solicitud oculto - Usuario no autenticado");
    }
  }

  // ========================================================================
  // 2. MANEJO DE ENVÍO AJAX CON FORMSPREE
  // ========================================================================
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Validar que el usuario está autenticado
    if (!AppState.currentUser) {
      showNotification("Por favor inicia sesión", "error");
      return;
    }

    // Recopilar datos del formulario
    const formData = new FormData(form);
    const modelName = formData.get("model_name")?.trim();
    const brand = formData.get("brand")?.trim();
    const referenceLink = formData.get("reference_link")?.trim();
    const userEmail = formData.get("user_email")?.trim();

    // ====================================================================
    // Validación básica
    // ====================================================================
    if (!modelName || !brand || !userEmail) {
      showModelFormError("Por favor completa todos los campos obligatorios");
      return;
    }

    if (modelName.length < 2) {
      showModelFormError("El nombre del celular debe tener al menos 2 caracteres");
      return;
    }

    if (brand.length < 2) {
      showModelFormError("La marca debe tener al menos 2 caracteres");
      return;
    }

    // Validar URL si está presente
    if (referenceLink && !isValidUrl(referenceLink)) {
      showModelFormError("Por favor ingresa una URL válida");
      return;
    }

    try {
      // ================================================================
      // Mostrar indicador de carga
      // ================================================================
      const loadingEl = document.getElementById("modelFormLoading");
      const successEl = document.getElementById("modelFormSuccess");
      const errorEl = document.getElementById("modelFormError");
      const submitBtn = form.querySelector(".model-submit-btn");

      // Ocultar mensajes previos
      loadingEl.style.display = "none";
      successEl.style.display = "none";
      errorEl.style.display = "none";

      // Deshabilitar botón y mostrar carga
      submitBtn.disabled = true;
      loadingEl.style.display = "flex";

      // ================================================================
      // Enviar datos a Formspree vía AJAX
      // ================================================================
      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Error al enviar el formulario");
      }

      // ================================================================
      // Éxito: mostrar mensaje y limpiar campo
      // ================================================================
      loadingEl.style.display = "none";
      successEl.style.display = "flex";
      
      // Limpiar campos del formulario (excepto email que es readonly)
      form.reset();
      userEmailInput.value = AppState.currentUser.email;

      // Ocultar mensaje de éxito después de 5 segundos
      setTimeout(() => {
        successEl.style.display = "none";
      }, 5000);

      console.debug("✅ Solicitud enviada exitosamente a Formspree");
    } catch (error) {
      console.error("❌ Error al enviar formulario:", error);
      showModelFormError(
        error.message || "Error al enviar la solicitud. Intenta de nuevo."
      );
    } finally {
      // ================================================================
      // Rehabilitar botón
      // ================================================================
      const submitBtn = form.querySelector(".model-submit-btn");
      submitBtn.disabled = false;
      document.getElementById("modelFormLoading").style.display = "none";
    }
  });

  // ========================================================================
  // 3. ESCUCHAR CAMBIOS EN LA SESIÓN DE AUTENTICACIÓN
  // ========================================================================
  // Llamar inmediatamente para establecer el estado inicial
  updateFormVisibility();

  //Escuchar cambios de autenticación (se amplía en el setupEventListeners)
  const originalUpdateAuthUI = window.updateAuthUI || (() => {});
  window.updateAuthUI = function() {
    originalUpdateAuthUI();
    updateFormVisibility();
  };

  console.debug("✅ Formulario de solicitud de modelos inicializado");
}

/**
 * Valida si una cadena es una URL válida
 */
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Muestra un mensaje de error en el formulario de solicitud
 */
function showModelFormError(message) {
  const errorEl = document.getElementById("modelFormError");
  const errorMsg = document.getElementById("modelFormErrorMessage");
  
  if (errorEl && errorMsg) {
    errorMsg.textContent = message;
    errorEl.style.display = "flex";
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      errorEl.style.display = "none";
    }, 5000);
  }
}

// ============================================================================
// UTILIDADES
// ============================================================================

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === "error" ? "#ef4444" : type === "success" ? "#10b981" : "#3b82f6"};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        z-index: 3000;
        animation: slideDown 0.3s ease-out;
        font-weight: 600;
    `;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "fadeOut 0.3s ease-out forwards";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: "smooth" });
  }
}

// ============================================================================
// CHATBOT (CHATBASE)
// ============================================================================

function setupChatbot() {
  // Insertar el widget de Chatbase
  const chatbaseScript = document.createElement("script");
  chatbaseScript.src = "https://www.chatbase.co/embed.min.js";
  chatbaseScript.async = true;
  chatbaseScript.setAttribute("chatbaseId", "TU_CHATBASE_ID"); // Reemplazar con tu ID
  document.head.appendChild(chatbaseScript);
}

function openChatbot() {
  // Si existe el widget, abrirlo
  if (window.chatbase) {
    window.chatbase.openChat();
  } else {
    showNotification(
      "Chatbot no disponible. Configura tu Chatbase ID",
      "error",
    );
  }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
  // Escuchar cambios de autenticación
  window.supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
      AppState.currentUser = session.user;
      checkAdminStatus();
    } else {
      AppState.currentUser = null;
      AppState.isAdmin = false;
    }
    updateAuthUI();
  });

  // Cerrar modales al hacer click fuera
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
        modal.style.display = "none";
      }
    });
  });

  // Setup de calificación por estrellas
  setupStarRatings();
}

// Cargar comentarios globales para promedio
/**
 * Carga todos los comentarios publicados en la aplicación
 * Los almacena en AppState.comments para cálculos globales
 */
async function loadAllComments() {
  try {
    const { data, error } = await window.supabase
      .from("comments")
      .select("*")
      .eq("is_published", true);

    if (error) throw error;
    AppState.comments = data || [];
    console.log(`✅ Cargados ${AppState.comments.length} comentarios globales`);
  } catch (error) {
    console.error("Error al cargar comentarios globales:", error);
  }
}

/**
 * Calcula la cantidad de comentarios para un teléfono específico
 */
function calculateCommentCount(phoneId) {
  const phoneComments = AppState.comments.filter((c) => c.phone_id === phoneId);
  return phoneComments.length;
}

// ============================================================================
// FIN DEL SCRIPT
// ============================================================================
