// utils.js - VERSIÓN DEFINITIVA (2025) - Funciona con cualquier backend
// Soporta: arrays directos, Page<>, wrappers personalizados, errores 401, etc.

async function cargarDatosGenerico(config) {
    const {
        url,
        tablaId,
        columnas = 8,
        token,
        callbackMostrarDatos,
        callbackEstadisticas,
        spinner = true
    } = config;

    const tabla = document.getElementById(tablaId);
    if (!tabla) {
        console.error(`No se encontró la tabla con ID: ${tablaId}`);
        return;
    }

    const tbody = tabla.querySelector("tbody");
    if (!tbody) {
        console.error(`No se encontró tbody en tabla ${tablaId}`);
        return;
    }

    // Mostrar spinner
    if (spinner) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${columnas}" class="text-center py-5">
                    <div class="spinner-border text-danger" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <p class="mt-3 text-muted">Cargando datos...</p>
                </td>
            </tr>`;
    }

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                ...(token && { "Authorization": `Bearer ${token}` })
            }
        });

        // MANEJO DE 401 - TOKEN EXPIRADO
        if (response.status === 401) {
            alert("Tu sesión ha expirado. Serás redirigido al inicio.");
            localStorage.removeItem("jwtToken");
            localStorage.removeItem("loggedInUser");
            window.location.href = "../index.html";
            return;
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // DETECCIÓN INTELIGENTE DEL ARRAY DE DATOS
        let arrayDatos = [];

        if (data && data.productos && Array.isArray(data.productos)) {
            // TU WRAPPER PERSONALIZADO (el que tienes ahora)
            arrayDatos = data.productos;
            console.log("Wrapper personalizado detectado → usando data.productos");
        }
        else if (data && data.content && Array.isArray(data.content)) {
            // Spring Data Page<>
            arrayDatos = data.content;
            console.log("Page<Producto> detectado → usando data.content");
        }
        else if (Array.isArray(data)) {
            // Array directo
            arrayDatos = data;
            console.log("Array directo recibido");
        }
        else {
            console.warn("Formato de respuesta desconocido:", data);
            throw new Error("El servidor no devolvió un array válido");
        }

        // ÉXITO: ejecutar callbacks
        if (callbackMostrarDatos) {
            callbackMostrarDatos(arrayDatos);
        }
        if (callbackEstadisticas) {
            callbackEstadisticas(data, arrayDatos);
        }

    } catch (error) {
        console.error("Error en cargarDatosGenerico:", error);

        tbody.innerHTML = `
            <tr>
                <td colspan="${columnas}" class="text-center py-5">
                    <i class="bi bi-exclamation-triangle-fill text-danger display-4"></i>
                    <h5 class="mt-3 text-danger">Error al cargar datos</h5>
                    <p class="text-muted">${error.message}</p>
                    <button class="btn btn-outline-primary mt-3" onclick="location.reload()">
                        <i class="bi bi-arrow-clockwise"></i> Reintentar
                    </button>
                </td>
            </tr>`;
    }
}

// BONUS: función para mostrar alertas bonitas
function showToast(mensaje, tipo = "success", duracion = 4000) {
    const toast = document.createElement("div");
    toast.className = `alert alert-${tipo} alert-dismissible fade show position-fixed`;
    toast.style.top = "20px";
    toast.style.right = "20px";
    toast.style.zIndex = "9999";
    toast.style.minWidth = "300px";
    toast.innerHTML = `
        ${mensaje}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, duracion);
}

// Exportar si usas modules (opcional)
if (typeof module !== "undefined" && module.exports) {
    module.exports = { cargarDatosGenerico, showToast };
}