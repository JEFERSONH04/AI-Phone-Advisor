# 🧪 Casos de Prueba - Formulario Formspree

## 📋 Escenarios de Prueba

### **Test 1: Usuario No Autenticado**

**Paso 1**: Abre la aplicación sin iniciar sesión
**Paso 2**: Navega a "Sugerir Modelo" en navbar
**Paso 3**: El formulario NO debe ser visible

**Resultado Esperado**:
```
✅ Sección visible
✅ Mensaje: "🔐 Inicia sesión para sugerir nuevos modelos"
✅ Botón: "Entrar a Mi Cuenta"
❌ Formulario NO visible (display: none)
```

**Consola**:
```javascript
document.getElementById('modelRequestSection').style.display // "block"
document.getElementById('modelRequestForm').style.display    // "none"
document.getElementById('modelFormNotAuthenticated').style.display // "flex"
```

---

### **Test 2: Autenticación y Visualización**

**Paso 1**: Inicia sesión con credenciales válidas
**Paso 2**: Navega a "Sugerir Modelo"

**Resultado Esperado**:
```
✅ Formulario visible
✅ Campo "Tu Correo" auto-completado con email de sesión
✅ Campo "Tu Correo" es readonly (no editable)
✅ Mensaje de no autenticado oculto
```

**Verificación en Consola**:
```javascript
AppState.currentUser.email // "usuario@ejemplo.com"
document.getElementById('userEmail').value // "usuario@ejemplo.com"
document.getElementById('userEmail').readOnly // true
```

---

### **Test 3: Validación de Campos Obligatorios**

**Paso 1**: Intenta enviar formulario vacío
**Paso 2**: Completa solo "Nombre del Celular"
**Paso 3**: Completa "Nombre" y "Marca" con un solo carácter

**Resultado Esperado**:
```
❌ Intento 1: "Por favor completa todos los campos obligatorios"
❌ Intento 2: "Por favor completa todos los campos obligatorios"
❌ Intento 3: "El nombre del celular debe tener al menos 2 caracteres"
```

---

### **Test 4: Validación de URL**

**Paso 1**: Dejar "Enlace de Referencia" vacío → Debe permitir envío
**Paso 2**: Ingresar URL inválida: "esto no es url"
**Paso 3**: Ingresar URL válida: "https://samsung.com/galaxy-s24"

**Resultado Esperado**:
```
✅ Test 1: Permiso de envío (campo opcional)
❌ Test 2: "Por favor ingresa una URL válida"
✅ Test 3: Permiso de envío
```

---

### **Test 5: Envío Exitoso**

**Paso 1**: Completa todos los campos:
```
Nombre del Celular: iPhone 16 Pro Max
Marca: Apple
Enlace de Referencia: https://apple.com/iphone-16
Correo: usuario@ejemplo.com (auto-completado)
```

**Paso 2**: Haz clic en "Enviar Solicitud"

**Resultado Esperado**:
```
✅ Botón deshabilitado temporalmente
✅ Icono de carga: "⏳ Enviando tu solicitud..."
✅ Mensaje de éxito: "✅ ¡Petición enviada con éxito!"
✅ Subtítulo: "Nuestro equipo revisará tu sugerencia pronto"
✅ Campos limpios (excepto email que se re-completa)
✅ Mensaje de éxito desaparece en 5 segundos
```

**En Formspree (email del admin)**:
```
De: usuario@ejemplo.com
Asunto: New submission from your form
Cuerpo:
  model_name: iPhone 16 Pro Max
  brand: Apple
  reference_link: https://apple.com/iphone-16
  user_email: usuario@ejemplo.com
```

---

### **Test 6: Manejo de Errores de Red**

**Paso 1**: Desconecta la conexión a internet
**Paso 2**: Intenta enviar formulario

**Resultado Esperado**:
```
❌ "Error al enviar la solicitud. Intenta de nuevo."
✅ Botón habilitado (permite reintentar)
✅ Formulario mantiene datos ingresados
```

---

### **Test 7: Responsividad Mobile**

#### **Breakpoint 768px (Tablet)**
```javascript
// Ajustar viewport en DevTools
window.innerWidth // ~768px

Resultado:
✅ Padding reducido en wrapper
✅ Inputs aún tienen espaciado adecuado
✅ Botón es táctil (mín 48px altura)
✅ Mensajes centrados
```

#### **Breakpoint 480px (Mobile)**
```javascript
// Ajustar viewport en DevTools
window.innerWidth // ~480px

Resultado:
✅ Padding mínimo (1rem)
✅ Inputs: font-size 16px (previene zoom automático iOS)
✅ Campos apilados verticalmente
✅ Botón altura 44px
✅ Icono emoji reducido (1.25rem)
✅ Legibilidad mantenida
```

---

## 🔄 Test de Cambio de Sesión

### **Test 8: Logout y Cambio de Visibilidad**

**Paso 1**: Autenticado - Navega a "Sugerir Modelo"
**Paso 2**: Verifica que formulario es visible
**Paso 3**: Haz logout
**Paso 4**: Verifica cambio

**Resultado Esperado**:
```
✅ Paso 2: Formulario visible, email autollenado
✅ Paso 4: Formulario oculto instantáneamente
✅ Paso 4: Aparece mensaje "🔐 Inicia sesión..."
```

---

### **Test 9: Login con Diferente Usuario**

**Paso 1**: Autentica como usuario A
**Paso 2**: Email muestra: usuario_a@ejemplo.com
**Paso 3**: Logout
**Paso 4**: Login como usuario B
**Paso 5**: Email muestra: usuario_b@ejemplo.com

**Resultado Esperado**:
```
✅ Email se actualiza automáticamente
✅ Sin refresh de página
✅ Cambio instantáneo
```

---

## 🐛 Tests de Edge Cases

### **Test 10: Espacios en Blanco Extra**

```javascript
// Ingresa:
Nombre: "   iPhone 16   "
Marca: "  Apple  "

// Esperado:
Form.trim() // Elimina espacios
Envío exitoso con: "iPhone 16" y "Apple"
```

### **Test 11: Caracteres Especiales**

```javascript
// Ingresa:
Nombre: "Samsung Galaxy S24 <script>alert('xss')</script>"

// Esperado:
❌ No ejecuta script
✅ Envía como texto escapado
✅ Formspree lo trata como string
```

### **Test 12: URLs Complejas**

```javascript
// Ingresa:
URL: "https://example.com/path?param1=valor&param2=valor#anchor"

// Esperado:
✅ Validación correcta
✅ Envío de URL completa a Formspree
```

---

## ✅ Checklist de QA

- [ ] Formulario oculto cuando no autenticado
- [ ] Formulario visible cuando autenticado
- [ ] Email auto-completa del usuario
- [ ] Email es readonly (no editable)
- [ ] Validación de campos obligatorios
- [ ] Validación de longitud mínima
- [ ] Validación de URL
- [ ] Envío AJAX (sin refresh)
- [ ] Mensaje de carga aparece
- [ ] Mensaje de éxito aparece
- [ ] Campos se limpian tras éxito
- [ ] Mensaje desaparece tras 5s
- [ ] Responsive en mobile (480px)
- [ ] Responsive en tablet (768px)
- [ ] Responsive en desktop
- [ ] Error handling funciona
- [ ] Cambio de sesión funciona
- [ ] Logout oculta formulario
- [ ] XSS protection funciona
- [ ] Formspree recibe datos correctamente

---

## 📊 Performance Tests

### **Test 13: Tiempo de Inicialización**

```javascript
// En consola:
console.time('initFormspree');
initModelRequestForm();
console.timeEnd('initFormspree');

// Esperado:
< 5ms
```

### **Test 14: Carga de Sección**

```javascript
// Verificar reflow/repaint:
document.getElementById('modelRequestSection').style.display = 'block'

// Esperado:
- Sin jank
- Animación suave
- < 16ms (60fps)
```

---

## 🌐 Tests de Integración

### **Test 15: Flujo Completo**

```
1. Usuario abre sitio → ❌ Formulario oculto
2. Usuario inicia sesión → ✅ Formulario visible
3. Usuario completa datos → ✅ Validación exitosa
4. Usuario envía → ✅ Carga, éxito, limpiar
5. Admin recibe email → ✅ Datos correctos
6. Usuario logout → ❌ Formulario oculto
```

---

## 📧 Verificación de Formspree

### **Confirmar que los datos llegan:**

1. Inicia sesión en `formspree.io`
2. Navega a: `Projects > mojkypkq`
3. Ve a: `Submissions` tab
4. Verifica que aparece tu envío con:
   - `model_name`: iPhone 16 Pro Max
   - `brand`: Apple
   - `reference_link`: [URL]
   - `user_email`: tu@email.com

---

## 🎯 Casos de Suceso

✅ **Todos los tests pasan** = Implementación exitosa

**Si falla alguno:**
- Revisa consola (DevTools F12)
- Verifica que `initModelRequestForm()` se llamó
- Comprueba que `AppState.currentUser` está poblado
- Valida endpoint de Formspree
- Revisa CORS headers

---

## 📝 Template de Reporte

```markdown
## Test: [Nombre]
**Fecha**: [DD/MM/YYYY]
**Navegador**: [Chrome/Firefox/Safari]
**Dispositivo**: [Desktop/Tablet/Mobile]

**Pasos**:
1. ...

**Resultado Esperado**:
- ✅ ...

**Resultado Actual**:
- ✅ ...

**Status**: PASS / FAIL / PENDING
```

---

**Última actualización**: Marzo 2026
**Tester**: QA Team
**Estado**: Listo para Producción ✅
