// ── Google Calendar OAuth Integration ────────────────────────
const CLIENT_ID = "1082789441339-8bumi6dht7obr58gh679sf9nsunh78v6.apps.googleusercontent.com";
// Scope amplio "calendar" requerido para calendars.insert (crear el calendario dedicado).
// Se conservan events/readonly por compatibilidad. El doctor debe re-autorizar UNA vez.
const SCOPES = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly";
const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";
const TOKEN_KEY = "gcal_access_token";
const TOKEN_EXP_KEY = "gcal_token_exp";
const TOKEN_SCOPE_KEY = "gcal_token_scope";   // permisos realmente concedidos por el doctor
// Calendario dedicado nuevo (Agenda v2). El "primary" viejo queda como archivo histórico.
const CALENDARIO_CONSULTORIO_NOMBRE = "Consultorio Dr. Félix Tapia";
const CALENDAR_ID_KEY = "gcal_calendar_id";

let tokenClient = null;
let gapiInited = false;
let gisInited = false;
let accessToken = null;
let refreshTimer = null;   // temporizador único del refresco proactivo (siempre uno a la vez)

const saveToken = (token, scope) => {
  accessToken = token;
  localStorage.setItem(TOKEN_KEY, token);
  // Token dura 1 hora, guardamos expiración
  localStorage.setItem(TOKEN_EXP_KEY, Date.now() + 55*60*1000);
  // Guardamos los permisos concedidos (la respuesta OAuth los devuelve en resp.scope).
  if (scope != null) localStorage.setItem(TOKEN_SCOPE_KEY, scope);
  programarRefresco();   // reprograma el refresco proactivo para este token nuevo
};

const loadSavedToken = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  const exp = parseInt(localStorage.getItem(TOKEN_EXP_KEY)||"0");
  if (token && Date.now() < exp) {
    accessToken = token;
    return token;
  }
  // Token expirado
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXP_KEY);
  return null;
};

// ── Refresco proactivo del token (silencioso) ────────────────
// Pide un token nuevo sin interacción. Solo funciona si el usuario ya autorizó antes y hay sesión Google.
// En caso de fallo, el callback de GIS registra el error y NO reprograma → degrada al flujo reactivo (no peor que hoy).
const refrescarTokenSilencioso = () => {
  if (!tokenClient) return;                             // GIS aún no cargó → nada que hacer
  try { tokenClient.requestAccessToken({ prompt: "" }); }
  catch(e) { console.warn("Refresco silencioso de token falló (no crítico):", e); }
};

// Programa el refresco ~5 min ANTES de que venza el token. Un solo temporizador a la vez (cancela el anterior).
const programarRefresco = () => {
  if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null; }
  const exp = parseInt(localStorage.getItem(TOKEN_EXP_KEY)||"0");
  if (!exp) return;                                     // sin token → no programar
  const delay = Math.max(exp - Date.now() - 5*60*1000, 1000);  // 5 min antes; nunca negativo ni en bucle cerrado
  refreshTimer = setTimeout(() => { refreshTimer = null; refrescarTokenSilencioso(); }, delay);
};

export const initGoogleCalendar = () => new Promise((resolve, reject) => {
  // Restaurar token guardado
  const savedToken = loadSavedToken();

  const tryResolve = () => {
    if (gapiInited && gisInited) {
      if (savedToken) {
        window.gapi.client.setToken({ access_token: savedToken });
        window.dispatchEvent(new Event("gcal_authed"));
        programarRefresco();   // token restaurado de sesión previa → programa su refresco proactivo
      }
      resolve();
    }
  };

  // Cargar GAPI
  const gapiScript = document.createElement("script");
  gapiScript.src = "https://apis.google.com/js/api.js";
  gapiScript.onload = () => {
    window.gapi.load("client", async () => {
      try {
        await window.gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] });
        gapiInited = true;
        tryResolve();
      } catch(e) { reject(e); }
    });
  };
  gapiScript.onerror = reject;
  document.head.appendChild(gapiScript);

  // Cargar GIS
  const gisScript = document.createElement("script");
  gisScript.src = "https://accounts.google.com/gsi/client";
  gisScript.onload = () => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (resp) => {
        if (resp.error) { console.error("OAuth error:", resp); return; }
        saveToken(resp.access_token, resp.scope);
        window.gapi.client.setToken({ access_token: resp.access_token });
        window.dispatchEvent(new Event("gcal_authed"));
      },
    });
    gisInited = true;
    tryResolve();
  };
  gisScript.onerror = reject;
  document.head.appendChild(gisScript);
});

export const authorizeGoogleCalendar = () => {
  if (!tokenClient) { alert("Google Calendar no iniciado. Recarga la página."); return; }
  // Si ya tenemos token válido, no pedir de nuevo
  const saved = loadSavedToken();
  if (saved) {
    window.gapi.client.setToken({ access_token: saved });
    window.dispatchEvent(new Event("gcal_authed"));
    return;
  }
  tokenClient.requestAccessToken({ prompt: "" });
};

export const isGoogleAuthorized = () => {
  return !!loadSavedToken();
};

export const revokeGoogleAccess = () => {
  if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null; }  // detén el refresco proactivo
  if (accessToken) {
    window.google?.accounts.oauth2.revoke(accessToken);
  }
  accessToken = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXP_KEY);
  window.dispatchEvent(new Event("gcal_revoked"));
};

export const crearEventoGCal = async (nombre, telefono, fecha, hora, tipoCita, duracionMin, titulo, colorId) => {
  if (!isGoogleAuthorized()) { authorizeGoogleCalendar(); return null; }
  const token = loadSavedToken();
  window.gapi.client.setToken({ access_token: token });

  const [year, month, day] = fecha.split("-");
  const [hr, mn] = hora.split(":");
  const iniISO = `${fecha}T${hora}:00`;
  const iniDate = new Date(parseInt(year), parseInt(month)-1, parseInt(day), parseInt(hr), parseInt(mn));
  const finDate = new Date(iniDate.getTime() + (duracionMin||30)*60000);
  const finISO = `${finDate.getFullYear()}-${String(finDate.getMonth()+1).padStart(2,"0")}-${String(finDate.getDate()).padStart(2,"0")}T${String(finDate.getHours()).padStart(2,"0")}:${String(finDate.getMinutes()).padStart(2,"0")}:00`;
  const tipo = tipoCita === "primera" ? "Primera vez" : "Seguimiento";

  try {
    const resp = await window.gapi.client.calendar.events.insert({
      calendarId: "primary",
      resource: {
        summary: titulo || `${nombre} — ${tipo}`,
        ...(colorId ? { colorId: String(colorId) } : {}),
        description: `Cita: ${tipo} (${duracionMin} min)${telefono?"\nTeléfono: "+telefono:""}`,
        location: "Av. Adolfo de la Huerta 200A 2do piso, Col. Pitic, Hermosillo, Sonora",
        start: { dateTime: iniISO, timeZone: "America/Hermosillo" },
        end:   { dateTime: finISO, timeZone: "America/Hermosillo" },
        reminders: { useDefault: false, overrides: [
          { method: "popup", minutes: 60 },
          { method: "popup", minutes: 15 },
        ]},
      }
    });
    return resp.result;
  } catch(e) {
    console.error("Error creando evento GCal:", e);
    if (e.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXP_KEY);
      accessToken = null;
      window.dispatchEvent(new Event("gcal_revoked"));
    }
    return null;
  }
};

// Mueve/actualiza un evento existente (cambio de fecha/hora/duración) vía PATCH
export const actualizarEventoGCal = async (eventId, fecha, hora, duracionMin, titulo) => {
  if (!isGoogleAuthorized()) { authorizeGoogleCalendar(); return null; }
  const token = loadSavedToken();
  window.gapi.client.setToken({ access_token: token });

  const [year, month, day] = fecha.split("-");
  const [hr, mn] = hora.split(":");
  const iniISO = `${fecha}T${hora}:00`;
  const iniDate = new Date(parseInt(year), parseInt(month)-1, parseInt(day), parseInt(hr), parseInt(mn));
  const finDate = new Date(iniDate.getTime() + (duracionMin||30)*60000);
  const finISO = `${finDate.getFullYear()}-${String(finDate.getMonth()+1).padStart(2,"0")}-${String(finDate.getDate()).padStart(2,"0")}T${String(finDate.getHours()).padStart(2,"0")}:${String(finDate.getMinutes()).padStart(2,"0")}:00`;

  try {
    const resp = await window.gapi.client.calendar.events.patch({
      calendarId: "primary",
      eventId,
      resource: {
        ...(titulo ? { summary: titulo } : {}),
        start: { dateTime: iniISO, timeZone: "America/Hermosillo" },
        end:   { dateTime: finISO, timeZone: "America/Hermosillo" },
      }
    });
    return resp.result;
  } catch(e) {
    console.error("Error actualizando evento GCal:", e);
    if (e.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXP_KEY);
      accessToken = null;
      window.dispatchEvent(new Event("gcal_revoked"));
    }
    return null;
  }
};

export const leerEventosGCal = async () => {
  if (!isGoogleAuthorized()) return [];
  const token = loadSavedToken();
  window.gapi.client.setToken({ access_token: token });

  try {
    const ahora = new Date().toISOString();
    const hasta = new Date(Date.now() + 90*24*60*60*1000).toISOString();
    const resp = await window.gapi.client.calendar.events.list({
      calendarId: "primary",
      timeMin: ahora,
      timeMax: hasta,
      showDeleted: false,
      singleEvents: true,
      maxResults: 500,
      orderBy: "startTime",
    });
    return resp.result.items || [];
  } catch(e) {
    console.error("Error leyendo GCal:", e);
    if (e.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXP_KEY);
      accessToken = null;
      window.dispatchEvent(new Event("gcal_revoked"));
    }
    return [];
  }
};

// ── AGENDA v2 — Calendario dedicado ──────────────────────────
// Limpia el token cuando expira (401). Helper interno reusado por las funciones v2.
const _manejar401 = (e) => {
  if (e && e.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXP_KEY);
    accessToken = null;
    window.dispatchEvent(new Event("gcal_revoked"));
  }
};

// ── Registro del último error de escritura (para surface visible en la app) ──
// Antes los errores se tragaban con console.error. Ahora se guarda el último para que
// la capa de la app lo muestre en una alerta. Se limpia al empezar cada intento.
let _ultimoError = null;
export const getUltimoErrorGCal = () => _ultimoError;
export const limpiarUltimoErrorGCal = () => { _ultimoError = null; };
const _registrarError = (e, contexto) => {
  const status = e?.status || e?.result?.error?.code || null;
  const mensaje = e?.result?.error?.message || e?.message || "error desconocido";
  let pista = "";
  if (status === 401) pista = "La sesión de Google expiró. Reconecta Google Calendar en Ajustes.";
  else if (status === 403) pista = "Permiso insuficiente (posible acceso de solo lectura). Reconecta Google Calendar en Ajustes para conceder permiso de escritura.";
  _ultimoError = { status, mensaje, pista, contexto };
  console.error(`GCal[${contexto}] ${status||""}: ${mensaje}`, e);
};

// ── Verificación de permisos (scope) del token ───────────────────────────────
// ¿El scope concedido incluye permiso de ESCRITURA de eventos?
const _scopeEsEscritura = (s) => !!s && (
  s.includes("https://www.googleapis.com/auth/calendar.events")
  || /(^|\s)https:\/\/www\.googleapis\.com\/auth\/calendar(\s|$)/.test(s)
);
export const getScopeGuardado = () => localStorage.getItem(TOKEN_SCOPE_KEY) || "";
export const tieneScopeEscritura = () => _scopeEsEscritura(getScopeGuardado());

// Consulta a Google el scope REAL del access_token actual (sirve incluso para tokens
// viejos guardados antes de este cambio, cuyo scope no quedó registrado localmente).
// Cachea el scope real en TOKEN_SCOPE_KEY. Devuelve {autorizado, escritura, scope, error?}.
export const verificarScopeToken = async () => {
  const token = loadSavedToken();
  if (!token) return { autorizado:false, escritura:false, scope:"" };
  try {
    const r = await fetch("https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=" + encodeURIComponent(token));
    if (!r.ok) return { autorizado:true, escritura:false, scope:"", error:"tokeninfo HTTP "+r.status };
    const info = await r.json();
    const scope = info.scope || "";
    localStorage.setItem(TOKEN_SCOPE_KEY, scope);   // cachea el scope real
    return { autorizado:true, escritura:_scopeEsEscritura(scope), scope };
  } catch(e) {
    return { autorizado:true, escritura:false, scope:"", error:String(e?.message||e) };
  }
};

// Fuerza re-consentimiento con el SCOPES amplio actual (incluye escritura). Muestra la
// pantalla de consentimiento para que el doctor re-conceda aunque ya tenga un token viejo.
export const reconectarGoogleCalendar = () => {
  if (!tokenClient) { alert("Google Calendar no iniciado. Recarga la página."); return; }
  tokenClient.requestAccessToken({ prompt: "consent" });
};

// Devuelve el calendarId dedicado cacheado (sin tocar la red). null si aún no se ha resuelto.
export const getCalendarioConsultorioId = () => localStorage.getItem(CALENDAR_ID_KEY) || null;

// Busca el calendario "Consultorio Dr. Félix Tapia"; si no existe lo crea. Devuelve su calendarId (o null).
// Cachea el id en localStorage (CALENDAR_ID_KEY) y verifica que siga existiendo en cada llamada.
export const obtenerOCrearCalendarioConsultorio = async () => {
  if (!isGoogleAuthorized()) { authorizeGoogleCalendar(); return null; }
  window.gapi.client.setToken({ access_token: loadSavedToken() });

  // 1) Cache local — verificar que el calendario sigue existiendo.
  const cached = localStorage.getItem(CALENDAR_ID_KEY);
  if (cached) {
    try {
      await window.gapi.client.calendar.calendars.get({ calendarId: cached });
      return cached;
    } catch(e) {
      if (e.status === 404) localStorage.removeItem(CALENDAR_ID_KEY); // fue borrado → recrear
      else { _manejar401(e); if (e.status === 401) return null; }
    }
  }

  try {
    // 2) Buscar por nombre exacto en la lista de calendarios.
    const lista = await window.gapi.client.calendar.calendarList.list({ maxResults: 250 });
    const found = (lista.result.items || []).find(c => (c.summary || "") === CALENDARIO_CONSULTORIO_NOMBRE);
    if (found) { localStorage.setItem(CALENDAR_ID_KEY, found.id); return found.id; }

    // 3) No existe → crearlo (requiere scope amplio "calendar").
    const creado = await window.gapi.client.calendar.calendars.insert({
      resource: { summary: CALENDARIO_CONSULTORIO_NOMBRE, timeZone: "America/Hermosillo" }
    });
    const nuevoId = creado.result.id;
    localStorage.setItem(CALENDAR_ID_KEY, nuevoId);
    return nuevoId;
  } catch(e) {
    _manejar401(e);
    _registrarError(e, "obtener/crear calendario");
    return null;
  }
};

// Crea un evento en el calendario indicado. Recibe ISO datetime completos (inicio/fin).
// Devuelve el evento creado (incluye .id) o null. NO reintenta — un solo insert.
export const crearEventoEnCalendario = async (calendarId, { summary, descripcion="", inicioISO, finISO, colorId, location } = {}) => {
  if (!isGoogleAuthorized()) { authorizeGoogleCalendar(); return null; }
  if (!calendarId) { console.warn("crearEventoEnCalendario: calendarId faltante"); return null; }
  window.gapi.client.setToken({ access_token: loadSavedToken() });
  try {
    const resp = await window.gapi.client.calendar.events.insert({
      calendarId,
      resource: {
        summary: summary || "Cita",
        ...(descripcion ? { description: descripcion } : {}),
        ...(location ? { location } : {}),
        ...(colorId ? { colorId: String(colorId) } : {}),
        start: { dateTime: inicioISO, timeZone: "America/Hermosillo" },
        end:   { dateTime: finISO,   timeZone: "America/Hermosillo" },
        reminders: { useDefault: false, overrides: [
          { method: "popup", minutes: 60 },
          { method: "popup", minutes: 15 },
        ]},
      }
    });
    return resp.result;
  } catch(e) {
    _manejar401(e);
    _registrarError(e, "crear evento");
    return null;
  }
};

// Actualiza (PATCH) un evento existente en el calendario indicado. Devuelve el evento o null.
export const actualizarEventoEnCalendario = async (calendarId, eventId, { summary, inicioISO, finISO, colorId } = {}) => {
  if (!isGoogleAuthorized()) { authorizeGoogleCalendar(); return null; }
  if (!calendarId || !eventId) { console.warn("actualizarEventoEnCalendario: calendarId/eventId faltante"); return null; }
  window.gapi.client.setToken({ access_token: loadSavedToken() });
  try {
    const resp = await window.gapi.client.calendar.events.patch({
      calendarId,
      eventId,
      resource: {
        ...(summary ? { summary } : {}),
        ...(colorId ? { colorId: String(colorId) } : {}),
        ...(inicioISO ? { start: { dateTime: inicioISO, timeZone: "America/Hermosillo" } } : {}),
        ...(finISO   ? { end:   { dateTime: finISO,   timeZone: "America/Hermosillo" } } : {}),
      }
    });
    return resp.result;
  } catch(e) {
    _manejar401(e);
    _registrarError(e, "actualizar evento");
    return null;
  }
};

// Lee eventos del calendario indicado en un rango (por defecto: ahora → +90 días). Devuelve array.
export const leerEventosDeCalendario = async (calendarId, { timeMin, timeMax } = {}) => {
  if (!isGoogleAuthorized()) return [];
  if (!calendarId) return [];
  window.gapi.client.setToken({ access_token: loadSavedToken() });
  try {
    const resp = await window.gapi.client.calendar.events.list({
      calendarId,
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax || new Date(Date.now() + 90*24*60*60*1000).toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults: 500,
      orderBy: "startTime",
    });
    return resp.result.items || [];
  } catch(e) {
    console.error("Error leyendo eventos del calendario dedicado:", e);
    _manejar401(e);
    return [];
  }
};

// Lista TODOS los calendarios del doctor (consultorio + personales). Solo lectura. Devuelve [] si falla.
export const listarCalendariosDisponibles = async () => {
  if (!isGoogleAuthorized()) return [];
  window.gapi.client.setToken({ access_token: loadSavedToken() });
  try {
    const resp = await window.gapi.client.calendar.calendarList.list({ maxResults: 250 });
    return (resp.result.items || []).map(c => ({
      id: c.id, summary: c.summary || c.id, primary: !!c.primary, accessRole: c.accessRole,
    }));
  } catch(e) {
    console.error("Error listando calendarios:", e);
    _manejar401(e);
    return [];
  }
};

// Borra un evento del calendario indicado. Devuelve true si se borró (o ya no existía), false si falló.
export const borrarEventoEnCalendario = async (calendarId, eventId) => {
  if (!isGoogleAuthorized()) { authorizeGoogleCalendar(); return false; }
  if (!calendarId || !eventId) return false;
  window.gapi.client.setToken({ access_token: loadSavedToken() });
  try {
    await window.gapi.client.calendar.events.delete({ calendarId, eventId });
    return true;
  } catch(e) {
    if (e.status === 404 || e.status === 410) return true; // ya no existe → objetivo cumplido
    _manejar401(e);
    _registrarError(e, "borrar evento");
    return false;
  }
};
