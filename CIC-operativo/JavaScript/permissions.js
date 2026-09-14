// JavaScript/permissions.js
// ✅ Control de permisos por rol SIN romper tu sistema actual
// Usa sessionStorage.userRole (admin|operador|profesional|lectura)
// y permite ocultar/deshabilitar UI con data-attributes.

const ROLE = (() => (sessionStorage.getItem("userRole") || "lectura").toLowerCase())();

const PERMS = (() => {
  const base = {
    role: ROLE,

    // Visibilidad de paneles (pediste que todos vean todos)
    canViewPanels: true,

    // Exportaciones / PDF / Excel
    canExport: true,

    // Consultas
    canCreateConsultas: false,
    canEditConsultas: false,
    canDerivarConsultas: false,
    canCambiarEstadoConsultas: false,

    // WhatsApp citatorios / notificaciones
    canSendWhatsApp: false,

    // Usuarios (gestión)
    canCreateUsers: false,
    canEditUsers: false,

    // Profesionales (edición)
    canEditProfessionals: false,
  };

  if (ROLE === "admin") {
    return {
      ...base,
      canCreateConsultas: true,
      canEditConsultas: true,
      canDerivarConsultas: true,
      canCambiarEstadoConsultas: true,
      canSendWhatsApp: true,
      canCreateUsers: true,
      canEditUsers: true,
      canEditProfessionals: true,
    };
  }

  if (ROLE === "operador") {
    return {
      ...base,
      canCreateConsultas: true,
      canEditConsultas: true,
      canDerivarConsultas: true,
      canCambiarEstadoConsultas: true,
      canSendWhatsApp: true,
      canCreateUsers: false,
      canEditUsers: false,
      canEditProfessionals: true,
    };
  }

  if (ROLE === "profesional") {
    return {
      ...base,
      canCreateConsultas: true,
      canEditConsultas: true,
      canDerivarConsultas: true,
      canCambiarEstadoConsultas: true,
      canSendWhatsApp: true,
      canCreateUsers: false,
      canEditUsers: true,
      canEditProfessionals: true,
    };
  }

  // Solo lectura
  return {
    ...base,
    canCreateConsultas: false,
    canEditConsultas: false,
    canDerivarConsultas: false,
    canCambiarEstadoConsultas: false,
    canSendWhatsApp: false,
    canCreateUsers: false,
    canEditUsers: false,
    canEditProfessionals: false,
  };
})();

// Exponemos para que cualquier JS lo use sin romper nada
window.CIC_PERMS = PERMS;

function disable(el, reason = "Sin permisos") {
  if (!el) return;
  el.setAttribute("disabled", "disabled");
  el.setAttribute("aria-disabled", "true");
  el.style.pointerEvents = "none";
  el.style.opacity = "0.55";
  if (!el.getAttribute("title")) el.setAttribute("title", reason);
}

function hide(el) {
  if (!el) return;
  el.style.display = "none";
}

function applyPermSelector(permKey, allowed, reason) {
  const nodes = document.querySelectorAll(`[data-perm="${permKey}"]`);
  nodes.forEach((el) => {
    const mode = (el.getAttribute("data-perm-mode") || "disable").toLowerCase();
    if (allowed) return;
    if (mode === "hide") hide(el);
    else disable(el, reason);
  });
}

export function initPagePermissions(pageKey = "") {
  const role = PERMS.role;

  // Mostrar rol en badges
  const roleBadges = document.querySelectorAll("[data-show-role]");
  roleBadges.forEach((el) => (el.textContent = role));

  // Aplicar permisos genéricos
  applyPermSelector("export", PERMS.canExport, "Solo exportación habilitada.");
  applyPermSelector("consultas-create", PERMS.canCreateConsultas, "No podés crear consultas.");
  applyPermSelector("consultas-edit", PERMS.canEditConsultas, "No podés editar.");
  applyPermSelector("consultas-derivar", PERMS.canDerivarConsultas, "No podés derivar.");
  applyPermSelector("consultas-estado", PERMS.canCambiarEstadoConsultas, "No podés cambiar estado.");
  applyPermSelector("whatsapp", PERMS.canSendWhatsApp, "No podés enviar WhatsApp.");
  applyPermSelector("users-create", PERMS.canCreateUsers, "No podés crear usuarios.");
  applyPermSelector("users-edit", PERMS.canEditUsers, "No podés editar usuarios.");
  applyPermSelector("professionals-edit", PERMS.canEditProfessionals, "No podés editar profesionales.");

  // Compat: data-role-write="true"
  const writeNodes = document.querySelectorAll('[data-role-write="true"]');
  if (role === "lectura") {
    writeNodes.forEach((el) => disable(el, "Modo lectura: no podés modificar datos."));
  }

  if (role === "lectura") {
    document.querySelectorAll("[data-action='send-whatsapp']").forEach((el) =>
      disable(el, "Modo lectura: WhatsApp deshabilitado.")
    );
  }

  // ✅ NUEVO: Inyectar link "Mi Panel" en el nav para el rol profesional
  // Funciona en CUALQUIER página que llame a initPagePermissions()
  if (role === "profesional") {
    const nav = document.querySelector(".nav-links");
    if (nav && !document.getElementById("navMiPanel")) {
      const link = document.createElement("a");
      link.id = "navMiPanel";

      // Detectar si estamos en /Pages/ o en la raíz para armar la ruta correcta
      const enSubcarpeta = window.location.pathname.includes("/Pages/");
      link.href = enSubcarpeta
        ? "profesional-panel.html"
        : "Pages/profesional-panel.html";

      link.textContent = "🏥 Mi Panel";
      link.style.fontWeight = "700";
      link.style.background = "rgba(255,255,255,0.15)";
      link.style.borderRadius = "4px";

      // Insertar ANTES del botón Cerrar Sesión
      const logout = nav.querySelector("a[onclick*='Logout'], a[onclick*='logout']");
      if (logout) {
        nav.insertBefore(link, logout);
      } else {
        nav.appendChild(link);
      }
    }
  }
}