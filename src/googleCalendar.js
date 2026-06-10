// ── Google Calendar OAuth Integration ────────────────────────
const CLIENT_ID = "1082789441339-8bumi6dht7obr58gh679sf9nsunh78v6.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly";
const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";
const TOKEN_KEY = "gcal_access_token";
const TOKEN_EXP_KEY = "gcal_token_exp";

let tokenClient = null;
let gapiInited = false;
let gisInited = false;
let accessToken = null;

const saveToken = (token) => {
  accessToken = token;
  localStorage.setItem(TOKEN_KEY, token);
  // Token dura 1 hora, guardamos expiración
  localStorage.setItem(TOKEN_EXP_KEY, Date.now() + 55*60*1000);
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

export const initGoogleCalendar = () => new Promise((resolve, reject) => {
  // Restaurar token guardado
  const savedToken = loadSavedToken();

  const tryResolve = () => {
    if (gapiInited && gisInited) {
      if (savedToken) {
        window.gapi.client.setToken({ access_token: savedToken });
        window.dispatchEvent(new Event("gcal_authed"));
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
        saveToken(resp.access_token);
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
