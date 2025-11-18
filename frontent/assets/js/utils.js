// En utils.js - actualizar la función cargarDatosGenerico
function cargarDatosGenerico(config) {
    const { 
        url, 
        tablaId, 
        columnas, 
        token,  // ✅ NUEVO PARÁMETRO
        callbackMostrarDatos, 
        callbackEstadisticas 
    } = config;
    
    fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }) // ✅ AÑADIR TOKEN SI EXISTE
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error al cargar datos desde ${url}`);
        }
        return response.json();
    })
    .then(data => {
        if (callbackMostrarDatos) {
            callbackMostrarDatos(data);
        }
        if (callbackEstadisticas) {
            callbackEstadisticas(data);
        }
    })
    .catch(error => {
        console.error(error);
        const tbody = document.querySelector(`#${tablaId} tbody`);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="${columnas}" class="text-center text-danger py-4">
                        <i class="bi bi-exclamation-triangle display-4"></i>
                        <h5 class="mt-2">Error al cargar datos</h5>
                        <p class="text-muted">${error.message}</p>
                        <button class="btn btn-primary mt-2" onclick="location.reload()">
                            <i class="bi bi-arrow-clockwise"></i> Reintentar
                        </button>
                    </td>
                </tr>
            `;
        }
    });
}