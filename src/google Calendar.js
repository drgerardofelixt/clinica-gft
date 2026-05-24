// ── Google Calendar OAuth Integration ────────────────────────
// Client ID del proyecto clinica-gft en Google Cloud Console
const CLIENT_ID = "1082789441339-8bumi6dht7obr58gh679sf9nsunh78v6.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly";
const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";

let tokenClient = null;
let gapiInited = false;
let gisInited = false;
let accessToken = null;

// Cargar GAPI
export const initGoogleCalendar = () => new Promise((resolve, reject) => {
  // Cargar gapi
  const gapiScript = document.createElement("script");
  gapiScript.src = "https://apis.google.com/js/api.js";
  gapiScript.onload = () => {
    window.gapi.load("client", async () => {
      await window.gapi.client.init({
        discoveryDocs: [DISCOVERY_DOC],
      });
      gapiInited = true;
      if (gisInited) resolve();
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
        if (resp.error) return;
        accessToken = resp.access_token;
        window.gapi.client.setToken({ access_token: accessToken });
        localStorage.setItem("gcal_token", accessToken);
        window.dispatchEvent(new Event("gcal_authed"));
      },
    });
    gisInited = true;
    if (gapiInited) resolve();
  };
  gisScript.onerror = reject;
  document.head.appendChild(gisScript);

  // Restaurar token guardado
  const saved = localStorage.getItem("gcal_token");
  if (saved) accessToken = saved;
});

// Pedir autorización
export const authorizeGoogleCalendar = () => {
  if (!tokenClient) { alert("Google Calendar no iniciado. Recarga la página."); return; }
  tokenClient.requestAccessToken({ prompt: accessToken ? "" : "consent" });
};

// Verificar si está autorizado
export const isGoogleAuthorized = () => !!accessToken;

// Desconectar
export const revokeGoogleAccess = () => {
  if (accessToken) {
    window.google?.accounts.oauth2.revoke(accessToken);
    accessToken = null;
    localStorage.removeItem("gcal_token");
    window.dispatchEvent(new Event("gcal_revoked"));
  }
};

// Crear evento en Google Calendar
export const crearEventoGCal = async (nombre, telefono, fecha, hora, tipoCita, duracionMin) => {
  if (!accessToken) { authorizeGoogleCalendar(); return null; }
  
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
        summary: `${nombre} — ${tipo}`,
        description: `Cita: ${tipo} (${duracionMin} min)${telefono?"\nTeléfono: "+telefono:""}`,
        location: "Av. Adolfo de la Huerta 200A 2do piso, Col. Pitic, Hermosillo, Sonora",
        start: { dateTime: iniISO, timeZone: "America/Hermosillo" },
        end:   { dateTime: finISO, timeZone: "America/Hermosillo" },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 60 },
            { method: "popup", minutes: 15 },
          ]
        }
      }
    });
    return resp.result;
  } catch(e) {
    console.error("Error creando evento:", e);
    if (e.status === 401) {
      accessToken = null;
      localStorage.removeItem("gcal_token");
      authorizeGoogleCalendar();
    }
    return null;
  }
};

// Leer eventos de Google Calendar (próximos 60 días)
export const leerEventosGCal = async () => {
  if (!accessToken) return [];
  try {
    const ahora = new Date().toISOString();
    const hasta = new Date(Date.now() + 60*24*60*60*1000).toISOString();
    const resp = await window.gapi.client.calendar.events.list({
      calendarId: "primary",
      timeMin: ahora,
      timeMax: hasta,
      showDeleted: false,
      singleEvents: true,
      maxResults: 200,
      orderBy: "startTime",
    });
    return resp.result.items || [];
  } catch(e) {
    console.error("Error leyendo eventos:", e);
    if (e.status === 401) {
      accessToken = null;
      localStorage.removeItem("gcal_token");
    }
    return [];
  }
};
