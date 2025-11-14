// assets/js/admin-productos.js
document.addEventListener("DOMContentLoaded", async function () {
  let productos = [];
  let isSaving = false;

  // 1️⃣ Verificar autenticación - PERMITIR CLIENTES TAMBIÉN
  const user = JSON.parse(localStorage.getItem("loggedInUser") || "null");
  const token = localStorage.getItem("jwtToken");
  
  console.log('🔐 === INICIANDO VERIFICACIÓN DE AUTENTICACIÓN ===');
  console.log('👤 Usuario del localStorage:', user);
  console.log('🗝️ Token del localStorage:', token ? '✅ Presente' : '❌ Faltante');

  // ✅ PERMITIR ACCESO A ADMIN Y CLIENTE
  if (!user || !token) {
    console.error('❌ Acceso denegado: No autenticado o token faltante');
    console.log('🔍 Redirigiendo a index.html...');
    window.location.href = "../index.html";
    return;
  }

  console.log('✅ Acceso permitido. Usuario autenticado:', user.email, 'Rol:', user.role);

  // Mostrar información del usuario en la interfaz
  mostrarInfoUsuario(user);

  // 2️⃣ Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      console.log('🚪 Cerrando sesión...');
      localStorage.removeItem("loggedInUser");
      localStorage.removeItem("jwtToken");
      window.location.href = "../index.html";
    };
  } else {
    console.warn('⚠️ Botón de logout no encontrado');
  }

  // 3️⃣ Cargar productos
  async function cargarProductos() {
    try {
      console.log('📦 === INICIANDO CARGA DE PRODUCTOS ===');
      console.log('🔐 Token que se enviará:', token.substring(0, 20) + '...');
      
      const response = await fetch("http://127.0.0.1:8081/api/productos", {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Respuesta del servidor:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Acceso denegado. No tienes permisos para ver productos.');
        } else if (response.status === 401) {
          throw new Error('Token inválido o expirado. Por favor inicia sesión nuevamente.');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 Datos recibidos del servidor:', data);
      
      // ✅ MANEJAR AMBAS ESTRUCTURAS DE RESPUESTA
      let productosData;
      let usuarioInfo;
      
      if (Array.isArray(data)) {
        // Caso 1: El backend devuelve un array directo de productos
        console.log('📋 Backend devolvió array directo de productos');
        productosData = data;
        usuarioInfo = {
          email: user.email,
          rol: user.role,
          autenticado: true
        };
      } else if (data.productos && data.usuario) {
        // Caso 2: El backend devuelve la estructura esperada con usuario y productos
        console.log('📋 Backend devolvió estructura con usuario y productos');
        productosData = data.productos;
        usuarioInfo = data.usuario;
      } else {
        console.warn('⚠️ Estructura de respuesta inesperada:', data);
        throw new Error('Estructura de respuesta inválida del servidor');
      }
      
      console.log('✅ Productos cargados exitosamente');
      console.log('🔐 Información del usuario:', usuarioInfo);
      console.log(`👤 Usuario: ${usuarioInfo.email} | Rol: ${usuarioInfo.rol} | Autenticado: ${usuarioInfo.autenticado}`);
      console.log('📊 Total de productos:', productosData.length);
      
      // Actualizar información del usuario en la interfaz
      mostrarInfoUsuarioEnTabla(usuarioInfo);
      
      // Mostrar productos
      mostrarProductos(productosData);
      
      console.log('✅ === CARGA DE PRODUCTOS COMPLETADA ===');
      
    } catch (error) {
      console.error("❌ Error cargando productos:", error);
      const tbody = document.querySelector("#productsTable tbody");
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" class="text-center text-danger py-4">
              <i class="bi bi-exclamation-triangle display-4"></i>
              <h5 class="mt-2">Error al cargar productos</h5>
              <p class="text-muted">${error.message}</p>
              <button class="btn btn-primary mt-2" onclick="location.reload()">
                <i class="bi bi-arrow-clockwise"></i> Reintentar
              </button>
            </td>
          </tr>
        `;
      }
    }
  }

  function mostrarInfoUsuario(user) {
    console.log('👤 Mostrando información del usuario en interfaz...');
    const userInfoElement = document.getElementById('userInfo');
    if (userInfoElement) {
      const isAdmin = user.role === 'ADMIN';
      userInfoElement.innerHTML = `
        <div class="alert ${isAdmin ? 'alert-info' : 'alert-warning'} d-flex align-items-center">
          <i class="bi bi-person-check me-2"></i>
          <div>
            <strong>Usuario:</strong> ${user.email} | 
            <strong>Rol:</strong> <span class="badge ${isAdmin ? 'bg-primary' : 'bg-warning'}">${user.role}</span> | 
            <strong>Estado:</strong> <span class="badge bg-success">Conectado</span>
            <small class="ms-2 text-muted">(Frontend)</small>
            ${!isAdmin ? '<br><small class="text-warning">⚠️ Modo de solo lectura - Algunas funciones pueden estar limitadas</small>' : ''}
          </div>
        </div>
      `;
      console.log('✅ Información del usuario mostrada en interfaz');
    } else {
      console.warn('⚠️ Elemento userInfo no encontrado en el DOM');
      // Crear el elemento si no existe
      const container = document.querySelector('.container-fluid');
      if (container) {
        const newUserInfo = document.createElement('div');
        newUserInfo.id = 'userInfo';
        newUserInfo.className = 'alert alert-warning';
        newUserInfo.innerHTML = `
          <strong>Usuario:</strong> ${user.email} | 
          <strong>Rol:</strong> <span class="badge bg-warning">${user.role}</span>
        `;
        container.prepend(newUserInfo);
        console.log('✅ Elemento userInfo creado dinámicamente');
      }
    }
  }

  function mostrarInfoUsuarioEnTabla(usuarioInfo) {
    console.log('🔐 Mostrando información del usuario desde backend...');
    let backendUserInfo = document.getElementById('backendUserInfo');
    if (!backendUserInfo) {
      backendUserInfo = document.createElement('div');
      backendUserInfo.id = 'backendUserInfo';
      backendUserInfo.className = 'alert alert-secondary mt-2';
      const container = document.querySelector('.container-fluid');
      if (container) {
        container.prepend(backendUserInfo);
        console.log('✅ Elemento backendUserInfo creado dinámicamente');
      } else {
        console.warn('⚠️ No se pudo encontrar el contenedor para backendUserInfo');
        return;
      }
    }
    
    if (usuarioInfo.autenticado) {
      const isAdmin = usuarioInfo.rol === 'ADMIN';
      backendUserInfo.innerHTML = `
        <i class="bi bi-shield-check"></i>
        <strong>Backend:</strong> Usuario: ${usuarioInfo.email} | 
        Rol: <span class="badge ${isAdmin ? 'bg-info' : 'bg-warning'}">${usuarioInfo.rol}</span> | 
        Token: <span class="badge bg-success">✅ Válido</span>
        <small class="ms-2 text-muted">(Verificado por Spring Security)</small>
      `;
      console.log('✅ Información del backend mostrada correctamente');
    } else {
      backendUserInfo.innerHTML = `
        <i class="bi bi-shield-exclamation"></i>
        <strong>Backend:</strong> 
        <span class="badge bg-warning">No autenticado</span> | 
        Token: <span class="badge bg-danger">❌ Inválido o faltante</span>
      `;
    }
  }

  function mostrarProductos(productosData) {
    console.log('🛍️ Mostrando productos en tabla...');
    productos = productosData;

    const tbody = document.querySelector("#productsTable tbody");
    if (!tbody) {
      console.error('❌ No se encontró la tabla productsTable');
      return;
    }

    tbody.innerHTML = "";

    if (!productos.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="text-center text-muted py-4">
            <i class="bi bi-inbox display-4"></i>
            <p class="mt-2">No hay productos disponibles</p>
          </td>
        </tr>
      `;
      console.log('ℹ️ No hay productos para mostrar');
      return;
    }

    const user = JSON.parse(localStorage.getItem("loggedInUser") || "null");
    const isAdmin = user && user.role === 'ADMIN';

    console.log(`👤 Mostrando productos para rol: ${user.role}, isAdmin: ${isAdmin}`);

    productos.forEach((p) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
      <td>${p.idProducto}</td>
      <td>${p.nombre}</td>
      <td>${p.categoriaNombre || "Sin categoría"}</td>
      <td>${p.descripcion || ""}</td>
      <td>S/ ${(p.precio ?? 0).toFixed(2)}</td>
      <td>
        <span class="badge ${p.stockActual > 10 ? 'bg-success' : p.stockActual > 0 ? 'bg-warning' : 'bg-danger'}">
          ${p.stockActual ?? 0}
        </span>
      </td>
      <td>
        <img src="${p.imagenPrincipal || "../assets/img/no-image.png"}" 
             alt="${p.nombre}" 
             width="60" 
             height="60" 
             style="object-fit: cover; border-radius: 5px;">
      </td>
      <td>${p.fechaVencimiento ? new Date(p.fechaVencimiento).toLocaleDateString() : "-"}</td>
      <td>
        ${isAdmin ? `
          <button class="btn btn-warning btn-sm editar-btn" data-id="${p.idProducto}" title="Editar">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-danger btn-sm eliminar-btn" data-id="${p.idProducto}" title="Eliminar">
            <i class="bi bi-trash"></i>
          </button>
        ` : `
          <span class="text-muted">Solo lectura</span>
        `}
      </td>
    `;
      tbody.appendChild(fila);
    });

    if (isAdmin) {
      configurarBotones();
    }

    console.log(`✅ ${productos.length} productos mostrados en la tabla`);
  }

  function configurarBotones() {
    console.log('⚙️ Configurando botones de edición/eliminación...');
    document.querySelectorAll(".eliminar-btn").forEach((btn) => {
      btn.onclick = async (e) => {
        const id = e.currentTarget.dataset.id;
        if (confirm("¿Seguro que deseas eliminar este producto?")) {
          await eliminarProducto(id);
          await cargarProductos();
        }
      };
    });

    document.querySelectorAll(".editar-btn").forEach((btn) => {
      btn.onclick = async (e) => {
        const id = e.currentTarget.dataset.id;
        const producto = productos.find((p) => p.idProducto == id);
        if (!producto) return;
        await mostrarModalEdicion(producto);
      };
    });
    console.log('✅ Botones configurados correctamente');
  }

  // 4️⃣ Ocultar/mostrar botón "Agregar Producto" según el rol
  function configurarInterfazSegunRol() {
    console.log('🎛️ Configurando interfaz según rol...');
    const user = JSON.parse(localStorage.getItem("loggedInUser") || "null");
    const isAdmin = user && user.role === 'ADMIN';
    const addProductBtn = document.getElementById("addProductBtn");
    
    if (addProductBtn) {
      if (!isAdmin) {
        addProductBtn.style.display = 'none';
        console.log('🔒 Botón "Agregar Producto" ocultado - Rol: CLIENTE');
      } else {
        addProductBtn.style.display = 'block';
        console.log('🔓 Botón "Agregar Producto" visible - Rol: ADMIN');
      }
    } else {
      console.warn('⚠️ Botón "Agregar Producto" no encontrado');
    }
  }

  // 5️⃣ Modal agregar producto
  document.getElementById("addProductBtn").onclick = async function () {
    document.getElementById("productModalLabel").textContent = "Agregar Producto";
    document.getElementById("productForm").reset();
    document.getElementById("productId").value = "";
    await cargarCategoriasSelect();
    new bootstrap.Modal(document.getElementById("productModal")).show();
  };

  // 6️⃣ Modal editar producto
  async function mostrarModalEdicion(p) {
    await cargarCategoriasSelect();

    const form = document.getElementById("productForm");
    form.reset();

    document.getElementById("productModalLabel").textContent = "Editar Producto";
    document.getElementById("productId").value = p.idProducto || "";
    document.getElementById("productName").value = p.nombre || "";
    document.getElementById("productCategory").value = p.idCategoria || "";
    document.getElementById("productDescription").value = p.descripcion || "";
    document.getElementById("productPrice").value = p.precio ?? "";
    document.getElementById("productStock").value = p.stockActual ?? "";
    document.getElementById("productImage").value = p.imagenPrincipal || "";
    document.getElementById("productFechaCaducidad").value = p.fechaVencimiento ? p.fechaVencimiento.split("T")[0] : "";
    document.getElementById("productRequiereReceta").value = p.requiereReceta ? "true" : "false";
    document.getElementById("productEsControlado").value = p.esControlado ? "true" : "false";
    document.getElementById("productLaboratorio").value = p.laboratorio || "";
    document.getElementById("productPrincipioActivo").value = p.principioActivo || "";
    document.getElementById("productConcentracion").value = p.concentracion || "";
    document.getElementById("productFormaFarmaceutica").value = p.formaFarmaceutica || "";

    new bootstrap.Modal(document.getElementById("productModal")).show();
  }

  // 7️⃣ Guardar producto
  const form = document.getElementById("productForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const user = JSON.parse(localStorage.getItem("loggedInUser") || "null");
    if (!user || user.role !== 'ADMIN') {
      mostrarAlerta('warning', 'No tienes permisos para modificar productos');
      return;
    }

    if (isSaving) return;
    isSaving = true;

    // Mostrar loading
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';
    submitBtn.disabled = true;

    const id = document.getElementById("productId").value.trim();

    const producto = {
      nombre: document.getElementById("productName").value.trim(),
      idCategoria: parseInt(document.getElementById("productCategory").value),
      descripcion: document.getElementById("productDescription").value.trim(),
      precio: parseFloat(document.getElementById("productPrice").value),
      stockActual: parseInt(document.getElementById("productStock").value),
      imagenPrincipal: document.getElementById("productImage").value.trim(),
      fechaVencimiento: document.getElementById("productFechaCaducidad").value || null,
      requiereReceta: document.getElementById("productRequiereReceta").value === "true",
      esControlado: document.getElementById("productEsControlado").value === "true",
      laboratorio: document.getElementById("productLaboratorio").value.trim(),
      principioActivo: document.getElementById("productPrincipioActivo").value.trim(),
      concentracion: document.getElementById("productConcentracion").value.trim(),
      formaFarmaceutica: document.getElementById("productFormaFarmaceutica").value.trim(),
      estado: true,
    };

    try {
      const url = id
        ? `http://127.0.0.1:8081/api/productos/${id}`
        : "http://127.0.0.1:8081/api/productos";
      const method = id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(producto),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar producto");
      }

      const result = await response.json();
      console.log('✅ Producto guardado:', result);
      
      const modal = bootstrap.Modal.getInstance(document.getElementById("productModal"));
      if (modal) modal.hide();

      await cargarProductos();
      
      mostrarAlerta('success', result.mensaje || 'Producto guardado exitosamente');
      
    } catch (error) {
      console.error("❌ Error al guardar producto:", error);
      mostrarAlerta('danger', `Error al guardar el producto: ${error.message}`);
    } finally {
      isSaving = false;
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });

  // 8️⃣ Eliminar producto
  async function eliminarProducto(id) {
    const user = JSON.parse(localStorage.getItem("loggedInUser") || "null");
    if (!user || user.role !== 'ADMIN') {
      mostrarAlerta('warning', 'No tienes permisos para eliminar productos');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8081/api/productos/${id}`, { 
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al eliminar producto");
      }

      const result = await response.json();
      console.log('✅ Producto eliminado:', result);
      
      mostrarAlerta('success', result.mensaje || 'Producto eliminado exitosamente');
      
    } catch (error) {
      console.error("❌ Error al eliminar producto:", error);
      mostrarAlerta('danger', `Error al eliminar el producto: ${error.message}`);
    }
  }

  // 9️⃣ Cargar categorías
  async function cargarCategoriasSelect() {
    const select = document.getElementById("productCategory");
    select.innerHTML = `<option value="">Selecciona una categoría</option>`;
    try {
      const response = await fetch("http://127.0.0.1:8081/api/categorias");
      const categorias = await response.json();
      categorias.forEach((cat) => {
        const opt = document.createElement("option");
        opt.value = cat.idCategoria;
        opt.textContent = cat.nombre;
        select.appendChild(opt);
      });
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  }

  // 🔟 Función para mostrar alertas
  function mostrarAlerta(tipo, mensaje) {
    const alerta = document.createElement('div');
    alerta.className = `alert alert-${tipo} alert-dismissible fade show`;
    alerta.innerHTML = `
      ${mensaje}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container-fluid');
    if (container) {
      container.insertBefore(alerta, container.firstChild);
      
      setTimeout(() => {
        if (alerta.parentNode) {
          alerta.remove();
        }
      }, 5000);
    }
  }

  // 🔄 Inicializar
  console.log('🚀 === INICIALIZANDO ADMIN PRODUCTOS ===');
  configurarInterfazSegunRol();
  await cargarProductos();
  console.log('✅ === ADMIN PRODUCTOS INICIALIZADO CORRECTAMENTE ===');
});

// 🧼 Limpieza de backdrop y scroll al cerrar modal
document.addEventListener("hidden.bs.modal", function () {
  document.querySelectorAll(".modal-backdrop").forEach((b) => b.remove());
  document.body.classList.remove("modal-open");
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
});