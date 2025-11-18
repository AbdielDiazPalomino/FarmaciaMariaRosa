// assets/js/role-manager.js

/**
 * Gestor de roles y permisos para el panel de administración
 * Controla qué opciones del sidebar se muestran según el rol del usuario
 */

class RoleManager {
    constructor() {
        this.user = null;
        this.rolePermissions = {
            'ADMIN': [
                'productos', 'categorias', 'lotes', 'clientes', 
                'reservas', 'estadisticas', 'mensajes', 'usuarios'
            ],
            'CAJERO': [
                'productos', 'categorias', 'lotes', 'clientes', 'reservas'
            ],
            'SECRETARIO': [
                'productos', 'categorias', 'lotes', 'clientes', 'mensajes'
            ],
            'CLIENTE': [
                'productos' // Solo puede ver productos
            ]
        };
    }

    // Inicializar el gestor de roles
    init() {
        this.user = JSON.parse(localStorage.getItem("loggedInUser") || "null");
        if (!this.user) {
            console.warn('⚠️ No hay usuario autenticado');
            return false;
        }
        
        console.log(`🔐 Rol detectado: ${this.user.role}`);
        return true;
    }

    // Verificar si el usuario tiene acceso a una sección específica
    hasAccess(section) {
        if (!this.user) return false;
        
        const userRole = this.user.role.toUpperCase();
        const allowedSections = this.rolePermissions[userRole] || [];
        
        return allowedSections.includes(section.toLowerCase());
    }

    // Obtener todas las secciones permitidas para el usuario actual
    getAllowedSections() {
        if (!this.user) return [];
        
        const userRole = this.user.role.toUpperCase();
        return this.rolePermissions[userRole] || [];
    }

    // Aplicar restricciones de roles al sidebar
    applySidebarRestrictions() {
        if (!this.user) {
            console.warn('⚠️ No se puede aplicar restricciones: usuario no autenticado');
            return;
        }

        const sections = {
            'productos': {
                desktop: '#tab-productos',
                mobile: '#adminSidebarTabsMobile [data-bs-target="#panel-productos"]',
                url: 'admin-productos.html'
            },
            'categorias': {
                desktop: '#tab-categorias',
                mobile: '#adminSidebarTabsMobile [data-bs-target="#panel-categorias"]',
                url: 'admin-categorias.html'
            },
            'lotes': {
                desktop: '#tab-lotes',
                mobile: '#adminSidebarTabsMobile [data-bs-target="#panel-lotes"]',
                url: 'admin-lotes.html'
            },
            'clientes': {
                desktop: '#tab-clientes',
                mobile: '#adminSidebarTabsMobile [data-bs-target="#panel-clientes"]',
                url: 'admin-clientes.html'
            },
            'reservas': {
                desktop: '#tab-reservas',
                mobile: '#adminSidebarTabsMobile [data-bs-target="#panel-reservas"]',
                url: 'admin-reservas.html'
            },
            'estadisticas': {
                desktop: '#tab-estadisticas',
                mobile: '#adminSidebarTabsMobile [data-bs-target="#panel-estadisticas"]',
                url: 'admin-estadisticas.html'
            },
            'mensajes': {
                desktop: '#tab-mensajes',
                mobile: '#adminSidebarTabsMobile [data-bs-target="#panel-mensajes"]',
                url: 'admin-mensajes.html'
            },
            'usuarios': {
                desktop: '#tab-usuarios',
                mobile: '#adminSidebarTabsMobile [href="admin-usuarios.html"]',
                url: 'admin-usuarios.html'
            }
        };

        // Ocultar/mostrar secciones según permisos
        Object.keys(sections).forEach(section => {
            const hasAccess = this.hasAccess(section);
            const sectionConfig = sections[section];

            // Sidebar desktop
            const desktopElement = document.querySelector(sectionConfig.desktop);
            if (desktopElement) {
                const listItem = desktopElement.closest('.nav-item');
                if (listItem) {
                    listItem.style.display = hasAccess ? 'block' : 'none';
                }
            }

            // Sidebar móvil
            const mobileElement = document.querySelector(sectionConfig.mobile);
            if (mobileElement) {
                const listItem = mobileElement.closest('.nav-item');
                if (listItem) {
                    listItem.style.display = hasAccess ? 'block' : 'none';
                }
            }

            console.log(`🔐 ${section}: ${hasAccess ? '✅ Acceso permitido' : '❌ Acceso denegado'}`);
        });

        // Mostrar información del rol en la interfaz
        this.showRoleInfo();
    }

    // Mostrar información del rol del usuario
    showRoleInfo() {
        const userInfoElement = document.getElementById('userRoleInfo');
        if (!userInfoElement) {
            // Crear elemento si no existe
            const container = document.querySelector('.admin-main-content');
            if (container) {
                const roleInfo = document.createElement('div');
                roleInfo.id = 'userRoleInfo';
                roleInfo.className = 'alert alert-secondary mb-3';
                container.insertBefore(roleInfo, container.firstChild);
            } else {
                return;
            }
        }

        const roleInfoElement = document.getElementById('userRoleInfo');
        if (roleInfoElement) {
            const allowedSections = this.getAllowedSections();
            const roleName = this.user.role.charAt(0).toUpperCase() + this.user.role.slice(1).toLowerCase();
            
            roleInfoElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <strong><i class="bi bi-person-badge"></i> Rol:</strong> 
                        <span class="badge bg-primary">${roleName}</span>
                        <strong class="ms-2">Secciones permitidas:</strong>
                        ${allowedSections.map(section => 
                            `<span class="badge bg-success me-1">${section}</span>`
                        ).join('')}
                    </div>
                    <small class="text-muted">Permisos basados en Spring Security</small>
                </div>
            `;
        }
    }

    // Verificar acceso antes de redirigir a una página
    checkAccessBeforeRedirect(section, redirectUrl) {
        if (!this.hasAccess(section)) {
            this.showAccessDeniedAlert(section);
            return false;
        }
        window.location.href = redirectUrl;
        return true;
    }

    // Mostrar alerta de acceso denegado
    showAccessDeniedAlert(section) {
        const alerta = document.createElement('div');
        alerta.className = 'alert alert-warning alert-dismissible fade show';
        alerta.innerHTML = `
            <i class="bi bi-shield-exclamation"></i>
            <strong>Acceso denegado</strong><br>
            No tienes permisos para acceder a la sección de <strong>${section}</strong>.
            <br><small class="text-muted">Tu rol (${this.user.role}) no tiene los privilegios necesarios.</small>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.container-fluid');
        if (container) {
            container.insertBefore(alerta, container.firstChild);
        }
    }

    // Proteger página actual (ejecutar al cargar una página específica)
    protectPage(allowedRoles = []) {
        if (!this.user) {
            window.location.href = "../index.html";
            return false;
        }

        const userRole = this.user.role.toUpperCase();
        const hasAccess = allowedRoles.includes(userRole);
        
        if (!hasAccess) {
            this.showAccessDeniedAlert('esta página');
            setTimeout(() => {
                window.location.href = "admin-productos.html";
            }, 3000);
            return false;
        }

        return true;
    }
}

// Crear instancia global
const roleManager = new RoleManager();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    if (roleManager.init()) {
        roleManager.applySidebarRestrictions();
        
        // Añadir event listeners para redirecciones protegidas
        setupProtectedRedirects();
    }
});

// Configurar redirecciones protegidas
function setupProtectedRedirects() {
    // Productos
    setupRedirect('tab-productos', 'productos', 'admin-productos.html');
    setupRedirect('adminSidebarTabsMobile [data-bs-target="#panel-productos"]', 'productos', 'admin-productos.html');

    // Categorías
    setupRedirect('tab-categorias', 'categorias', 'admin-categorias.html');
    setupRedirect('adminSidebarTabsMobile [data-bs-target="#panel-categorias"]', 'categorias', 'admin-categorias.html');

    // Lotes
    setupRedirect('tab-lotes', 'lotes', 'admin-lotes.html');
    setupRedirect('adminSidebarTabsMobile [data-bs-target="#panel-lotes"]', 'lotes', 'admin-lotes.html');

    // Clientes
    setupRedirect('tab-clientes', 'clientes', 'admin-clientes.html');
    setupRedirect('adminSidebarTabsMobile [data-bs-target="#panel-clientes"]', 'clientes', 'admin-clientes.html');

    // Reservas
    setupRedirect('tab-reservas', 'reservas', 'admin-reservas.html');
    setupRedirect('adminSidebarTabsMobile [data-bs-target="#panel-reservas"]', 'reservas', 'admin-reservas.html');

    // Estadísticas
    setupRedirect('tab-estadisticas', 'estadisticas', 'admin-estadisticas.html');
    setupRedirect('adminSidebarTabsMobile [data-bs-target="#panel-estadisticas"]', 'estadisticas', 'admin-estadisticas.html');

    // Mensajes
    setupRedirect('tab-mensajes', 'mensajes', 'admin-mensajes.html');
    setupRedirect('adminSidebarTabsMobile [data-bs-target="#panel-mensajes"]', 'mensajes', 'admin-mensajes.html');

    // Usuarios
    setupRedirect('tab-usuarios', 'usuarios', 'admin-usuarios.html');
    setupRedirect('#adminSidebarTabsMobile [href="admin-usuarios.html"]', 'usuarios', 'admin-usuarios.html');
}

function setupRedirect(elementSelector, section, redirectUrl) {
    const element = document.querySelector(elementSelector);
    if (element) {
        element.addEventListener('click', function(e) {
            e.preventDefault();
            roleManager.checkAccessBeforeRedirect(section, redirectUrl);
        });
    }
}

// Función global para verificar permisos (útil en otras páginas)
window.checkPermission = function(section) {
    return roleManager.hasAccess(section);
};

// Función global para proteger páginas específicas
window.protectPage = function(allowedRoles) {
    return roleManager.protectPage(allowedRoles);
};