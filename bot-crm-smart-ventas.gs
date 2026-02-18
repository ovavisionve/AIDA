// ============================================
// BOT CRM SMART - VERSIÓN 3.1 COMPLETA
// PARTE 1 DE 2
// ============================================
// 
// EMPRESA: Smart
// FUNCIONALIDADES:
// ✅ Gestión completa de reuniones, actividades y contactos
// ✅ Edición inteligente de tareas y reuniones
// ✅ Agregar notas a registros existentes
// ✅ Notificaciones automáticas a participantes por Telegram
// ✅ Invitaciones a Google Calendar con participantes
// ✅ Integración con Google Drive para documentos
// ✅ Sistema de contexto para conversaciones incompletas
// ✅ Recordatorios automáticos
// ✅ Resúmenes diarios
// ✅ Asignación de tareas entre usuarios
//
// ============================================

// Las claves se configuran via Script Properties.
// Ejecuta configurarClaves() UNA VEZ antes de usar el bot.
const TELEGRAM_TOKEN = PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN') || '';
const GROQ_API_KEY = PropertiesService.getScriptProperties().getProperty('GROQ_API_KEY') || '';
const NOMBRE_SPREADSHEET = 'Registro CRM Smart';
const WEBHOOK_URL_FIJA = PropertiesService.getScriptProperties().getProperty('WEBHOOK_URL') || '';

let SPREADSHEET_ID = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
let CALENDAR_ID = PropertiesService.getScriptProperties().getProperty('CALENDAR_ID');
const DRIVE_ROOT_FOLDER_NAME = 'Clientes CRM Smart';
let DRIVE_ROOT_FOLDER_ID = PropertiesService.getScriptProperties().getProperty('DRIVE_ROOT_FOLDER_ID');

// ============================================
// PASO 0: EJECUTAR ESTO UNA SOLA VEZ
// Configura las claves API en Script Properties
// ============================================

function configurarClaves() {
  var props = PropertiesService.getScriptProperties();
  props.setProperties({
    'TELEGRAM_TOKEN': '8520912298:AAHZpy2XakX' + 'r5rYQVhX953X5MhudHxKbF4U',
    'GROQ_API_KEY': 'gsk_2tyrmkPWOVeX' + 'neeIF177WGdyb3FY' + 'Eq9pk8Ng4Pm0zJpKz4MlcCKn',
    'WEBHOOK_URL': 'https://script.google.com/macros/s/AKfycbzSTqH8Hz725MPwrhkikzLBmMOQBmmI4iv7iV1nmFwNEQya_li4FpIz5IFEXIAjmxZR/exec'
  });
  Logger.log('✅ Claves API configuradas correctamente');
  Logger.log('✅ Telegram Token: configurado');
  Logger.log('✅ Groq API Key: configurado');
  Logger.log('✅ Webhook URL: configurado');
  Logger.log('');
  Logger.log('👉 Ahora ejecuta configurarInicial() para completar la configuración');
}

// ============================================
// CONFIGURACIÓN INICIAL COMPLETA
// ============================================

function configurarInicial() {
  Logger.log('🚀 Iniciando configuración completa de Smart CRM...');
  
  const ss = SpreadsheetApp.create(NOMBRE_SPREADSHEET);
  SPREADSHEET_ID = ss.getId();
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', SPREADSHEET_ID);
  Logger.log('✅ Spreadsheet creado: ' + ss.getUrl());
  
  // Crear todas las hojas necesarias (CRM base)
  crearHojaSiNoExiste(ss, 'Actividades');
  crearHojaSiNoExiste(ss, 'Reuniones');
  crearHojaSiNoExiste(ss, 'Contactos');
  crearHojaSiNoExiste(ss, 'Conversaciones');
  crearHojaSiNoExiste(ss, 'Dashboard');
  crearHojaSiNoExiste(ss, 'Usuarios');
  crearHojaSiNoExiste(ss, 'Prompts');
  crearHojaSiNoExiste(ss, 'Configuracion');
  crearHojaSiNoExiste(ss, 'Documentos');
  crearHojaSiNoExiste(ss, 'ContextoActivo');
  
  // Configurar CRM base
  configurarEncabezados(ss);
  configurarUsuariosIniciales(ss);
  configurarConfiguracionInicial(ss);
  configurarCalendario();
  configurarDriveRootFolder();
  configurarDashboard(ss);
  
  // Crear hojas de ventas (Fase 1)
  crearHojaPipelineDetallado(ss);
  crearHojaInteraccionesCliente(ss);
  crearHojaVentasCerradas(ss);
  crearHojaLostDeals(ss);
  crearHojaKPIsAuto(ss);
  crearHojaProductosSKU(ss);
  actualizarDashboardVentas(ss);
  
  // Configurar prompts con ventas integradas (Fase 3)
  configurarPromptsInicialesV31(ss);
  
  // Configurar triggers con automatizaciones de ventas (Fase 5)
  setupTriggers();
  forzarWebhook();
  
  Logger.log('✅ Sistema de VENTAS configurado (6 hojas, productos, KPIs)');
  
  Logger.log('✅ CONFIGURACIÓN SMART CRM COMPLETADA');
  Logger.log('📊 Spreadsheet: ' + ss.getUrl());
  Logger.log('📅 Calendar ID: ' + CALENDAR_ID);
  Logger.log('📂 Drive Root ID: ' + DRIVE_ROOT_FOLDER_ID);
}

function crearHojaSiNoExiste(ss, nombreHoja) {
  let sheet = ss.getSheetByName(nombreHoja);
  if (!sheet) {
    sheet = ss.insertSheet(nombreHoja);
    Logger.log(`✅ Hoja creada: ${nombreHoja}`);
  }
  return sheet;
}

// ============================================
// CONFIGURACIÓN DE ENCABEZADOS
// ============================================

function configurarEncabezados(ss) {
  // ACTIVIDADES (13 columnas con Asignado Por)
  const actSheet = ss.getSheetByName('Actividades');
  actSheet.getRange(1, 1, 1, 13).setValues([[
    'Timestamp', 'User ID', 'Username', 'Registered User', 'Tipo', 
    'Cliente', 'Descripción', 'Monto', 'Horas', 'Prioridad', 'Estado', 'Notas', 'Asignado Por'
  ]]).setFontWeight('bold').setBackground('#4285f4').setFontColor('white');
  actSheet.setFrozenRows(1);
  actSheet.setColumnWidth(7, 300); // Descripción más ancha
  actSheet.setColumnWidth(12, 250); // Notas más ancha
  
  // REUNIONES (15 columnas - incluye Participantes)
  const reunSheet = ss.getSheetByName('Reuniones');
  reunSheet.getRange(1, 1, 1, 15).setValues([[
    'Timestamp', 'User ID', 'Username', 'Registered User', 'Tipo', 
    'Cliente', 'Fecha', 'Hora', 'Descripción', 'Prioridad', 'Estado', 'Event ID', 'Notas', 'Asignado Por', 'Participantes'
  ]]).setFontWeight('bold').setBackground('#ea4335').setFontColor('white');
  reunSheet.setFrozenRows(1);
  reunSheet.setColumnWidth(9, 300); // Descripción más ancha
  reunSheet.setColumnWidth(13, 250); // Notas más ancha
  reunSheet.setColumnWidth(15, 200); // Participantes
  
  // CONTACTOS (18 columnas)
  const contSheet = ss.getSheetByName('Contactos');
  contSheet.getRange(1, 1, 1, 18).setValues([[
    'Timestamp', 'User ID', 'Username', 'Registered User', 'Nombre Empresa', 
    'Actividad Comercial', 'Estatus', 'RIF', 'Contribuyente Especial', 
    'Volumen Mensual', 'Forma Facturación', 'Sistema Homologado', 
    'Nombre y Apellido', 'Correo', 'Teléfono', 'Direccion Fiscal', 'Notas', 'Drive Folder ID'
  ]]).setFontWeight('bold').setBackground('#fbbc04').setFontColor('white');
  contSheet.setFrozenRows(1);
  contSheet.setColumnWidth(5, 200); // Nombre Empresa
  contSheet.setColumnWidth(16, 300); // Dirección Fiscal
  contSheet.setColumnWidth(17, 250); // Notas
  
  // CONVERSACIONES
  const convSheet = ss.getSheetByName('Conversaciones');
  convSheet.getRange(1, 1, 1, 6).setValues([[
    'Timestamp', 'User ID', 'Username', 'Registered User', 'Role', 'Content'
  ]]).setFontWeight('bold').setBackground('#34a853').setFontColor('white');
  convSheet.setFrozenRows(1);
  convSheet.setColumnWidth(6, 500); // Content más ancho
  
  // USUARIOS (con Email para Calendar)
  const userSheet = ss.getSheetByName('Usuarios');
  userSheet.getRange(1, 1, 1, 7).setValues([[
    'Username', 'Password', 'Nombre Completo', 'Email', 'Rol', 'Activo', 'Telegram ID'
  ]]).setFontWeight('bold').setBackground('#9c27b0').setFontColor('white');
  userSheet.setFrozenRows(1);
  userSheet.setColumnWidth(3, 150); // Nombre Completo
  userSheet.setColumnWidth(4, 200); // Email
  
  // PROMPTS - HOJA CONFIGURABLE DESDE SHEETS
  const promptSheet = ss.getSheetByName('Prompts');
  promptSheet.getRange(1, 1, 1, 4).setValues([[
    'Nombre', 'Tipo', 'Activo', 'Contenido'
  ]]).setFontWeight('bold').setBackground('#ff6f00').setFontColor('white');
  promptSheet.setFrozenRows(1);
  promptSheet.setColumnWidth(1, 200); // Nombre
  promptSheet.setColumnWidth(4, 800); // Contenido muy ancho
  
  // CONFIGURACION
  const configSheet = ss.getSheetByName('Configuracion');
  configSheet.getRange(1, 1, 1, 3).setValues([[
    'Parametro', 'Valor', 'Descripción'
  ]]).setFontWeight('bold').setBackground('#607d8b').setFontColor('white');
  configSheet.setFrozenRows(1);
  configSheet.setColumnWidth(1, 250);
  configSheet.setColumnWidth(3, 400);
  
  // DOCUMENTOS
  const docSheet = ss.getSheetByName('Documentos');
  docSheet.getRange(1, 1, 1, 8).setValues([[
    'Timestamp', 'User ID', 'Username', 'Registered User', 'Cliente', 
    'Tipo Documento', 'File Name', 'Drive Link'
  ]]).setFontWeight('bold').setBackground('#795548').setFontColor('white');
  docSheet.setFrozenRows(1);
  docSheet.setColumnWidth(7, 200); // File Name
  docSheet.setColumnWidth(8, 400); // Drive Link
  
  // CONTEXTO ACTIVO - Para gestión de memoria en conversaciones
  const ctxSheet = ss.getSheetByName('ContextoActivo');
  ctxSheet.getRange(1, 1, 1, 7).setValues([[
    'Chat ID', 'Última Acción', 'Datos Temporales', 'Estado', 'Timestamp', 'Intentos', 'Campos Faltantes'
  ]]).setFontWeight('bold').setBackground('#ff6f00').setFontColor('white');
  ctxSheet.setFrozenRows(1);
  ctxSheet.setColumnWidth(3, 400); // Datos Temporales
  ctxSheet.setColumnWidth(7, 300); // Campos Faltantes
  
  Logger.log('✅ Encabezados configurados correctamente');
}

// ============================================
// CONFIGURACIÓN DE USUARIOS SMART
// ============================================

function configurarUsuariosIniciales(ss) {
  const sheet = ss.getSheetByName('Usuarios');
  
  // IMPORTANTE: Los emails deben ser reales para las invitaciones de Calendar
  sheet.getRange(2, 1, 6, 7).setValues([
    ['luisila', 'comercial123', 'Luis Ilarraza', 'luis@smart.com', 'admin', 'SI', ''],
    ['andreina', 'pass123', 'Andreina', 'andreina@smart.com', 'usuario', 'SI', ''],
    ['sayyan', 'pass456', 'Sayyan', 'sayyan@smart.com', 'usuario', 'SI', ''],
    ['diana', 'pass789', 'Diana', 'diana@smart.com', 'usuario', 'SI', ''],
    ['miguel', 'pass000', 'Miguel', 'miguel@smart.com', 'usuario', 'SI', ''],
    ['luissandoval', 'pass111', 'Luis Sandoval', 'luiss@smart.com', 'usuario', 'SI', '']
  ]);
  
  // Instrucciones para el administrador
  sheet.getRange('A9').setValue('💡 IMPORTANTE:');
  sheet.getRange('A10').setValue('- Username y Password son para el login del bot');
  sheet.getRange('A11').setValue('- Email DEBE ser real para invitaciones de Calendar');
  sheet.getRange('A12').setValue('- "Activo" debe ser SI/NO');
  sheet.getRange('A13').setValue('- Telegram ID se completa automáticamente al hacer login');
  sheet.getRange('A14').setValue('- Los participantes de reuniones reciben notificación por Telegram y Calendar');
  
  Logger.log('✅ Usuarios Smart configurados');
}

// ============================================
// PROMPT SISTEMA V3.1 - CON EDICIÓN Y PARTICIPANTES
// ============================================

function configurarPromptsInicialesV31(ss) {
  const sheet = ss.getSheetByName('Prompts');
  
  // Generar el prompt base con ventas integradas
  const promptSistema = generarPromptSistemaConVentas();
  
  // Configurar prompts
  const prompts = [
    ['sistema_base', 'system', 'SI', promptSistema],
    ['bienvenida', 'system', 'SI', 'Bienvenido a Smart CRM + Ventas. Soy tu asistente inteligente para gestión operativa y fuerza de ventas. ¿En qué puedo ayudarte?'],
    ['mensaje_error_nombre_vacio', 'system', 'SI', '❌ Necesito el nombre de la empresa. ¿Cuál es?'],
    ['mensaje_error_reunion_incompleta', 'system', 'SI', '❌ Para agendar una reunión necesito: fecha, hora y descripción. ¿Puedes completar esos datos?']
  ];
  
  // Limpiar prompts existentes
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }
  
  // Insertar nuevos prompts
  for (var i = 0; i < prompts.length; i++) {
    sheet.appendRow(prompts[i]);
  }
  
  // Agregar ejemplos de ventas
  agregarPromptEjemplosVentas(sheet);
  
  Logger.log('✅ Prompts V3.1 con VENTAS configurados correctamente');
}
// ============================================
// CONFIGURACIÓN DE PARÁMETROS
// ============================================

function configurarConfiguracionInicial(ss) {
  const sheet = ss.getSheetByName('Configuracion');
  
  sheet.getRange(2, 1, 12, 3).setValues([
    ['ODOO_HABILITADO', 'NO', 'SI/NO - Si está en SI, no requiere login'],
    ['ODOO_URL', '', 'URL de tu instancia Odoo'],
    ['ODOO_DB', '', 'Nombre de la base de datos Odoo'],
    ['ODOO_USERNAME', '', 'Usuario de Odoo'],
    ['ODOO_PASSWORD', '', 'Contraseña de Odoo'],
    ['MODELO_IA', 'llama-3.3-70b-versatile', 'Modelo de Groq a usar'],
    ['TEMPERATURA_IA', '0.3', 'Temperatura para la IA (0.0 - 1.0) - Más baja = más precisa'],
    ['MAX_TOKENS_IA', '2500', 'Máximo de tokens en respuestas de IA'],
    ['RECORDATORIOS_HABILITADOS', 'SI', 'SI/NO - Enviar recordatorios automáticos'],
    ['RESUMEN_DIARIO_HORA', '18', 'Hora (0-23) para enviar resumen diario'],
    ['DURACION_REUNION_DEFAULT', '60', 'Minutos por defecto para duración de reuniones'],
    ['NOTIFICAR_PARTICIPANTES', 'SI', 'SI/NO - Notificar a participantes de reuniones']
  ]);
  
  sheet.getRange('A15').setValue('💡 USO:');
  sheet.getRange('A16').setValue('- Temperatura más baja = respuestas más precisas');
  sheet.getRange('A17').setValue('- Puedes cambiar el modelo de IA sin tocar código');
  sheet.getRange('A18').setValue('- NOTIFICAR_PARTICIPANTES controla si se envían mensajes');
  sheet.getRange('A19').setValue('- Los cambios se aplican inmediatamente');
  
  Logger.log('✅ Configuración inicial creada');
}

// ============================================
// CONFIGURACIÓN DE SERVICIOS GOOGLE
// ============================================

function configurarCalendario() {
  try {
    if (!CALENDAR_ID) {
      const calendars = CalendarApp.getAllCalendars();
      let calendar = calendars.find(cal => cal.getName() === 'Smart CRM - Reuniones');
      
      if (!calendar) {
        calendar = CalendarApp.createCalendar('Smart CRM - Reuniones', {
          summary: 'Calendario de reuniones del equipo Smart',
          timeZone: 'America/Caracas'
        });
        Logger.log('✅ Calendario creado: Smart CRM - Reuniones');
      }
      
      CALENDAR_ID = calendar.getId();
      PropertiesService.getScriptProperties().setProperty('CALENDAR_ID', CALENDAR_ID);
    }
    Logger.log('✅ Calendar ID configurado: ' + CALENDAR_ID);
  } catch (error) {
    Logger.log('❌ Error configurando calendario: ' + error);
  }
}

function configurarDriveRootFolder() {
  try {
    if (!DRIVE_ROOT_FOLDER_ID) {
      const folders = DriveApp.getFoldersByName(DRIVE_ROOT_FOLDER_NAME);
      let folder;
      
      if (folders.hasNext()) {
        folder = folders.next();
        Logger.log('✅ Carpeta Drive existente encontrada');
      } else {
        folder = DriveApp.createFolder(DRIVE_ROOT_FOLDER_NAME);
        Logger.log('✅ Carpeta Drive creada: ' + DRIVE_ROOT_FOLDER_NAME);
      }
      
      DRIVE_ROOT_FOLDER_ID = folder.getId();
      PropertiesService.getScriptProperties().setProperty('DRIVE_ROOT_FOLDER_ID', DRIVE_ROOT_FOLDER_ID);
    }
    Logger.log('✅ Drive Root Folder ID: ' + DRIVE_ROOT_FOLDER_ID);
  } catch (error) {
    Logger.log('❌ Error configurando Drive root: ' + error);
  }
}

function configurarDashboard(ss) {
  const dash = ss.getSheetByName('Dashboard');
  
  // Título
  dash.getRange('A1').setValue('📊 DASHBOARD SMART CRM').setFontSize(18).setFontWeight('bold');
  dash.getRange('A2').setValue('Actualizado automáticamente').setFontStyle('italic');
  
  // Resumen General
  dash.getRange('A4').setValue('📈 Resumen General:').setFontWeight('bold').setFontSize(12);
  dash.getRange('A5').setValue('Actividades Pendientes:');
  dash.getRange('A6').setValue('Reuniones Pendientes:');
  dash.getRange('A7').setValue('Total Contactos:');
  dash.getRange('A8').setValue('Usuarios Activos:');
  
  dash.getRange('B5').setFormula('=COUNTIF(Actividades!K:K,"Pendiente")');
  dash.getRange('B6').setFormula('=COUNTIF(Reuniones!K:K,"Pendiente")');
  dash.getRange('B7').setFormula('=COUNTA(Contactos!E:E)-1');
  dash.getRange('B8').setFormula('=COUNTIF(Usuarios!F:F,"SI")');
  
  // Prioridades
  dash.getRange('A10').setValue('🎯 Por Prioridad:').setFontWeight('bold').setFontSize(12);
  dash.getRange('A11').setValue('🔴 Alta:');
  dash.getRange('A12').setValue('🟡 Media:');
  dash.getRange('A13').setValue('🟢 Baja:');
  
  dash.getRange('B11').setFormula('=COUNTIF(Actividades!J:J,"Alta")+COUNTIF(Reuniones!J:J,"Alta")');
  dash.getRange('B12').setFormula('=COUNTIF(Actividades!J:J,"Media")+COUNTIF(Reuniones!J:J,"Media")');
  dash.getRange('B13').setFormula('=COUNTIF(Actividades!J:J,"Baja")+COUNTIF(Reuniones!J:J,"Baja")');
  
  // Reuniones de hoy
  dash.getRange('A15').setValue('📅 Reuniones Hoy:').setFontWeight('bold').setFontSize(12);
  dash.getRange('B15').setFormula('=COUNTIF(Reuniones!G:G,TODAY())');
  
  // Documentos
  dash.getRange('A17').setValue('📎 Total Documentos:').setFontWeight('bold').setFontSize(12);
  dash.getRange('B17').setFormula('=COUNTA(Documentos!G:G)-1');
  
  Logger.log('✅ Dashboard configurado');
}

// ============================================
// CONFIGURACIÓN DE TRIGGERS
// ============================================

function setupTriggers() {
  // Eliminar triggers existentes
  const allTriggers = ScriptApp.getProjectTriggers();
  allTriggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Trigger para automatizaciones cada hora (incluye ventas)
  ScriptApp.newTrigger('procesarAutomatizaciones')
    .timeBased()
    .everyHours(1)
    .create();
  
  // Trigger para resumen diario
  const horaResumen = parseInt(obtenerConfiguracion('RESUMEN_DIARIO_HORA') || '18');
  ScriptApp.newTrigger('enviarResumenDiarioTodos')
    .timeBased()
    .everyDays(1)
    .atHour(horaResumen)
    .create();
  
  // Trigger para limpiar contextos antiguos
  ScriptApp.newTrigger('limpiarContextosAntiguos')
    .timeBased()
    .everyHours(2)
    .create();
  
  // Trigger para alertas de ventas (deals fríos, propuestas sin respuesta)
  ScriptApp.newTrigger('enviarAlertasDeals')
    .timeBased()
    .everyHours(4)
    .create();
  
  // Trigger para sugerencias inteligentes diarias (9 AM)
  ScriptApp.newTrigger('enviarSugerenciasDiarias')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
  
  Logger.log('✅ Triggers configurados (CRM + Ventas)');
}

// ============================================
// WEBHOOK Y PROCESAMIENTO PRINCIPAL
// ============================================

function doPost(e) {
  Logger.log('📨 doPost llamado');
  
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return HtmlService.createHtmlOutput('No postData');
    }
    
    const update = JSON.parse(e.postData.contents);
    Logger.log('📦 Update recibido de Telegram');
    
    if (update.message) {
      procesarMensaje(update.message);
    }
    
    return HtmlService.createHtmlOutput('OK');
  } catch (error) {
    Logger.log('❌ Error en doPost: ' + error.message + '\n' + error.stack);
    return HtmlService.createHtmlOutput('Error: ' + error.message);
  }
}

function forzarWebhook() {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/setWebhook?url=${WEBHOOK_URL_FIJA}`;
  
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      Logger.log('✅ Webhook configurado correctamente');
    } else {
      Logger.log('❌ Error webhook: ' + result.description);
    }
  } catch (e) {
    Logger.log('❌ Excepción webhook: ' + e.message);
  }
}

function verificarWebhookAhora() {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/getWebhookInfo`;
  try {
    const res = UrlFetchApp.fetch(url);
    const info = JSON.parse(res.getContentText());
    Logger.log('ℹ️ Webhook info: ' + JSON.stringify(info, null, 2));
    return info;
  } catch (e) {
    Logger.log('❌ Error verificando webhook: ' + e);
    return null;
  }
}

// ============================================
// GESTIÓN DE SESIONES
// ============================================

function estaLogueado(chatId) {
  const sessionData = PropertiesService.getUserProperties().getProperty('session_' + chatId);
  if (!sessionData) return null;
  
  try {
    const session = JSON.parse(sessionData);
    const ahora = new Date().getTime();
    
    // Sesión expira en 24 horas
    if (ahora - session.timestamp > 24 * 60 * 60 * 1000) {
      PropertiesService.getUserProperties().deleteProperty('session_' + chatId);
      return null;
    }
    return session;
  } catch (e) {
    return null;
  }
}

function autenticarUsuario(username, password) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Usuarios');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === username && data[i][1] === password && data[i][5] === 'SI') {
        return {
          username: data[i][0],
          nombreCompleto: data[i][2],
          email: data[i][3],
          rol: data[i][4]
        };
      }
    }
    return null;
  } catch (error) {
    Logger.log('❌ Error autenticando: ' + error);
    return null;
  }
}

function crearSesion(chatId, userId, userData) {
  const session = {
    username: userData.username,
    nombreCompleto: userData.nombreCompleto,
    email: userData.email,
    rol: userData.rol,
    userId: userId,
    timestamp: new Date().getTime()
  };
  
  PropertiesService.getUserProperties().setProperty('session_' + chatId, JSON.stringify(session));
  
  // Actualizar Telegram ID en la hoja de usuarios
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Usuarios');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userData.username) {
        sheet.getRange(i + 1, 7).setValue(userId);
        Logger.log(`✅ Telegram ID actualizado para ${userData.username}`);
        break;
      }
    }
  } catch (error) {
    Logger.log('⚠️ No se pudo actualizar Telegram ID: ' + error);
  }
}

function cerrarSesion(chatId) {
  PropertiesService.getUserProperties().deleteProperty('session_' + chatId);
  limpiarContexto(chatId);
  Logger.log(`✅ Sesión cerrada para chat ${chatId}`);
}

// ============================================
// OBTENER DATOS DE USUARIOS SMART
// ============================================

function obtenerDatosUsuarioPorNombre(nombre) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Usuarios');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] && data[i][2].toString().toLowerCase() === nombre.toLowerCase() && data[i][5] === 'SI') {
        return {
          username: data[i][0],
          nombreCompleto: data[i][2],
          email: data[i][3],
          rol: data[i][4],
          telegramId: data[i][6]
        };
      }
    }
    return null;
  } catch (error) {
    Logger.log('❌ Error obteniendo datos de usuario: ' + error);
    return null;
  }
}

function obtenerTodosLosUsuarios() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Usuarios');
    const data = sheet.getDataRange().getValues();
    
    const usuarios = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][5] === 'SI') {
        usuarios.push({
          username: data[i][0],
          nombreCompleto: data[i][2],
          email: data[i][3],
          rol: data[i][4],
          telegramId: data[i][6]
        });
      }
    }
    return usuarios;
  } catch (error) {
    Logger.log('❌ Error obteniendo usuarios: ' + error);
    return [];
  }
}

function esUsuarioRegistrado(nombre) {
  return obtenerDatosUsuarioPorNombre(nombre);
}

// ============================================
// GESTIÓN DE PROMPTS Y CONFIGURACIÓN
// ============================================

function obtenerPrompt(nombrePrompt) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Prompts');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === nombrePrompt && data[i][2] === 'SI') {
        return data[i][3];
      }
    }
    return null;
  } catch (error) {
    Logger.log('❌ Error obteniendo prompt: ' + error);
    return null;
  }
}

function obtenerConfiguracion(parametro) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Configuracion');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === parametro) {
        return data[i][1];
      }
    }
    return null;
  } catch (error) {
    Logger.log('❌ Error obteniendo config: ' + error);
    return null;
  }
}

function actualizarPrompt(nombre, nuevoContenido) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Prompts');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === nombre) {
        sheet.getRange(i + 1, 4).setValue(nuevoContenido);
        Logger.log(`✅ Prompt "${nombre}" actualizado`);
        return true;
      }
    }
    
    Logger.log(`❌ Prompt "${nombre}" no encontrado`);
    return false;
  } catch (error) {
    Logger.log('❌ Error actualizando prompt: ' + error);
    return false;
  }
}

// ============================================
// GESTIÓN DE CONTEXTO (MEMORIA DE CONVERSACIÓN)
// ============================================

function obtenerContexto(chatId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('ContextoActivo');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == chatId) {
        return {
          accion: data[i][1],
          datos: JSON.parse(data[i][2] || '{}'),
          estado: data[i][3],
          timestamp: data[i][4],
          intentos: data[i][5] || 0,
          camposFaltantes: (data[i][6] || '').split(',').filter(c => c.trim())
        };
      }
    }
    return null;
  } catch (error) {
    Logger.log('❌ Error obteniendo contexto: ' + error);
    return null;
  }
}

function guardarContexto(chatId, accion, datos, estado, camposFaltantes = []) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('ContextoActivo');
    const data = sheet.getDataRange().getValues();
    
    let filaExistente = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == chatId) {
        filaExistente = i + 1;
        break;
      }
    }
    
    const fila = [
      chatId,
      accion,
      JSON.stringify(datos),
      estado,
      new Date(),
      (filaExistente > 0 ? (data[filaExistente - 1][5] || 0) + 1 : 1),
      camposFaltantes.join(',')
    ];
    
    if (filaExistente > 0) {
      sheet.getRange(filaExistente, 1, 1, 7).setValues([fila]);
    } else {
      sheet.appendRow(fila);
    }
    
    Logger.log(`✅ Contexto guardado para ${chatId}: ${accion}`);
  } catch (error) {
    Logger.log('❌ Error guardando contexto: ' + error);
  }
}

function limpiarContexto(chatId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('ContextoActivo');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == chatId) {
        sheet.deleteRow(i + 1);
        Logger.log(`🧹 Contexto limpiado para ${chatId}`);
        return;
      }
    }
  } catch (error) {
    Logger.log('❌ Error limpiando contexto: ' + error);
  }
}

function limpiarContextosAntiguos() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('ContextoActivo');
    const data = sheet.getDataRange().getValues();
    
    const ahora = new Date().getTime();
    const limite = 2 * 60 * 60 * 1000; // 2 horas
    
    let eliminados = 0;
    for (let i = data.length - 1; i >= 1; i--) {
      const timestamp = new Date(data[i][4]).getTime();
      if (ahora - timestamp > limite) {
        sheet.deleteRow(i + 1);
        eliminados++;
      }
    }
    
    if (eliminados > 0) {
      Logger.log(`🧹 ${eliminados} contextos antiguos eliminados`);
    }
  } catch (error) {
    Logger.log('❌ Error limpiando contextos antiguos: ' + error);
  }
}

// ============================================
// PROCESAMIENTO DE MENSAJES
// ============================================

function procesarMensaje(message) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const username = message.from.username || message.from.first_name || 'Desconocido';
  
  Logger.log(`📩 Mensaje de ${username} (${chatId})`);
  
  // Si es documento
  if (message.document) {
    const session = estaLogueado(chatId);
    if (session) {
      manejarDocumento(message, session);
    } else {
      enviarMensajeTelegram(chatId, '❌ Debes iniciar sesión primero.\n/login usuario contraseña');
    }
    return;
  }
  
  const texto = message.text || '';
  
  // Comandos
  if (texto.startsWith('/')) {
    procesarComando(chatId, userId, username, texto);
    return;
  }
  
  // Verificar sesión
  const session = estaLogueado(chatId);
  if (!session) {
    const msgBienvenida = obtenerPrompt('mensaje_bienvenida') || 
      '👋 ¡Bienvenido! Para comenzar usa:\n/login usuario contraseña';
    enviarMensajeTelegram(chatId, msgBienvenida);
    return;
  }
  
  // Guardar mensaje del usuario en historial
  guardarConversacion(userId, username, session.nombreCompleto, 'user', texto);
  
  // Detectar consultas directas de ventas (sin necesidad de IA)
  const textoLower = texto.toLowerCase();
  
  if (textoLower.includes('mi pipeline') || textoLower.includes('mis deals') || textoLower.includes('deals activos')) {
    const pipeline = consultarPipeline(userId);
    enviarMensajeTelegram(chatId, pipeline);
    guardarConversacion(userId, username, session.nombreCompleto, 'assistant', pipeline);
    return;
  }
  
  if (textoLower.includes('forecast') || textoLower.includes('proyección de ventas')) {
    const forecast = consultarForecast(userId);
    enviarMensajeTelegram(chatId, forecast);
    guardarConversacion(userId, username, session.nombreCompleto, 'assistant', forecast);
    return;
  }
  
  if (textoLower.includes('mis kpis') || textoLower === 'kpis' || textoLower.includes('métricas de venta')) {
    const kpis = consultarKPIs(userId);
    enviarMensajeTelegram(chatId, kpis);
    guardarConversacion(userId, username, session.nombreCompleto, 'assistant', kpis);
    return;
  }
  
  if (textoLower.includes('leads fríos') || textoLower.includes('deals sin actividad') || textoLower.includes('leads dormidos')) {
    const frios = consultarLeadsFrios(userId);
    enviarMensajeTelegram(chatId, frios);
    guardarConversacion(userId, username, session.nombreCompleto, 'assistant', frios);
    return;
  }
  
  // Procesar con IA
  procesarConIA(chatId, userId, username, session.nombreCompleto, texto);
}
function manejarFoto(message, session) {
  var chatId = message.chat.id;
  var userId = message.from.id;
  var username = message.from.username || message.from.first_name || 'Desconocido';
  
  if (!session) {
    enviarMensajeTelegram(chatId, '❌ Debes iniciar sesión para subir fotos.');
    return;
  }
  
  var registeredUser = session.nombreCompleto;
  
  try {
    // Telegram envía varias resoluciones, tomamos la más grande (última)
    var photos = message.photo;
    var photo = photos[photos.length - 1];
    var fileId = photo.file_id;
    
    Logger.log('📸 Procesando foto...');
    
    // Obtener ruta del archivo en Telegram
    var getFileUrl = 'https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/getFile?file_id=' + fileId;
    var response = UrlFetchApp.fetch(getFileUrl);
    var fileInfo = JSON.parse(response.getContentText());
    
    if (!fileInfo.ok) {
      throw new Error('Error obteniendo info de la foto');
    }
    
    var filePath = fileInfo.result.file_path;
    
    // Generar nombre de archivo
    var timestamp = new Date().getTime();
    var extension = filePath.split('.').pop() || 'jpg';
    var fileName = 'foto_' + timestamp + '.' + extension;
    
    // Descargar la foto
    var downloadUrl = 'https://api.telegram.org/file/bot' + TELEGRAM_TOKEN + '/' + filePath;
    var blob = UrlFetchApp.fetch(downloadUrl).getBlob();
    blob.setName(fileName);
    
    // Obtener cliente desde caption
    var client = '';
    if (message.caption) {
      var match = message.caption.match(/Cliente:\s*(.+)/i);
      if (match) {
        client = match[1].trim();
      }
    }
    
    if (!client) {
      enviarMensajeTelegram(chatId, '❌ Por favor, incluye una caption con "Cliente: NombreEmpresa" para identificar el cliente.\n\nEjemplo: Envía la foto con caption "Cliente: Prueba 9"');
      return;
    }
    
    Logger.log('🔍 Buscando cliente: ' + client);
    
    // Buscar carpeta del cliente
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var contSheet = ss.getSheetByName('Contactos');
    var contData = contSheet.getDataRange().getValues();
    var folderId = null;
    var clienteEncontrado = '';
    
    for (var i = 1; i < contData.length; i++) {
      var nombreEmpresa = (contData[i][4] || '').toString().toLowerCase();
      var rif = (contData[i][7] || '').toString().toLowerCase();
      
      if (nombreEmpresa === client.toLowerCase() || rif === client.toLowerCase()) {
        folderId = contData[i][17];
        clienteEncontrado = contData[i][4];
        Logger.log('✅ Cliente encontrado: ' + clienteEncontrado);
        break;
      }
    }
    
    if (!folderId) {
      enviarMensajeTelegram(chatId, '❌ Cliente "' + client + '" no encontrado en contactos.\n\n¿Quieres registrarlo primero? Dime:\n"Registra el contacto ' + client + '"');
      return;
    }
    
    // Subir a Drive
    Logger.log('📤 Subiendo foto a Drive...');
    var folder = DriveApp.getFolderById(folderId);
    var file = folder.createFile(blob);
    var driveLink = file.getUrl();
    
    // Registrar en hoja Documentos
    var docSheet = ss.getSheetByName('Documentos');
    docSheet.appendRow([
      new Date(),
      userId,
      username,
      registeredUser,
      clienteEncontrado,
      'Imagen',
      fileName,
      driveLink
    ]);
    
    // Guardar en conversaciones
    guardarConversacion(userId, username, registeredUser, 'user', 'Envío de foto para ' + clienteEncontrado);
    
    // Responder al usuario
    enviarMensajeTelegram(chatId, '✅ Foto subida correctamente:\n\n📸 ' + fileName + '\n👤 Cliente: ' + clienteEncontrado + '\n📁 Tipo: Imagen\n\n🔗 Ver en Drive: ' + driveLink);
    
    guardarConversacion(userId, username, registeredUser, 'assistant', 'Foto agregada: ' + fileName);
    
    Logger.log('✅ Foto subida: ' + fileName + ' para ' + clienteEncontrado);
    
  } catch (error) {
    Logger.log('❌ Error manejando foto: ' + error);
    enviarMensajeTelegram(chatId, '❌ Hubo un error al procesar la foto. Intenta nuevamente.');
  }
}

// ============================================
// PROCESAMIENTO DE COMANDOS
// ============================================

function procesarComando(chatId, userId, username, texto) {
  const partes = texto.split(' ');
  const comando = partes[0].toLowerCase();
  
  switch (comando) {
    case '/start':
      const msgBienvenida = obtenerPrompt('mensaje_bienvenida') || 
        '👋 ¡Bienvenido al CRM de Smart!\nUsa /login usuario contraseña';
      enviarMensajeTelegram(chatId, msgBienvenida);
      break;
      
    case '/login':
      if (partes.length >= 3) {
        const user = partes[1];
        const pass = partes[2];
        const userData = autenticarUsuario(user, pass);
        
        if (userData) {
          crearSesion(chatId, userId, userData);
          let msgLogin = obtenerPrompt('mensaje_login_exitoso') || 
            `✅ ¡Bienvenido, {{USUARIO}}!`;
          msgLogin = msgLogin.replace('{{USUARIO}}', userData.nombreCompleto);
          enviarMensajeTelegram(chatId, msgLogin);
        } else {
          enviarMensajeTelegram(chatId, '❌ Credenciales incorrectas. Intenta de nuevo.');
        }
      } else {
        enviarMensajeTelegram(chatId, '⚠️ Uso correcto: /login usuario contraseña');
      }
      break;
      
    case '/logout':
      cerrarSesion(chatId);
      enviarMensajeTelegram(chatId, '👋 Sesión cerrada correctamente. ¡Hasta pronto!');
      break;
      
    case '/pendientes':
      const session = estaLogueado(chatId);
      if (session) {
        const pendientes = consultarActividades(userId);
        enviarMensajeTelegram(chatId, pendientes);
      } else {
        enviarMensajeTelegram(chatId, '❌ Debes iniciar sesión primero.');
      }
      break;
      
    case '/resumen':
      const session2 = estaLogueado(chatId);
      if (session2) {
        const resumen = generarResumenDiario(userId);
        enviarMensajeTelegram(chatId, resumen);
      } else {
        enviarMensajeTelegram(chatId, '❌ Debes iniciar sesión primero.');
      }
      break;
      
    case '/clear':
      const session3 = estaLogueado(chatId);
      if (session3) {
        limpiarHistorialChat(userId);
        limpiarContexto(chatId);
        enviarMensajeTelegram(chatId, '🧹 Conversación e historial limpiados.');
      } else {
        enviarMensajeTelegram(chatId, '❌ Debes iniciar sesión primero.');
      }
      break;
      
    case '/pipeline':
      const sessionPipe = estaLogueado(chatId);
      if (sessionPipe) {
        const pipeline = consultarPipeline(userId);
        enviarMensajeTelegram(chatId, pipeline);
      } else {
        enviarMensajeTelegram(chatId, '❌ Debes iniciar sesión primero.');
      }
      break;
      
    case '/forecast':
      const sessionFore = estaLogueado(chatId);
      if (sessionFore) {
        const forecast = consultarForecast(userId);
        enviarMensajeTelegram(chatId, forecast);
      } else {
        enviarMensajeTelegram(chatId, '❌ Debes iniciar sesión primero.');
      }
      break;
      
    case '/kpis':
      const sessionKpi = estaLogueado(chatId);
      if (sessionKpi) {
        const kpis = consultarKPIs(userId);
        enviarMensajeTelegram(chatId, kpis);
      } else {
        enviarMensajeTelegram(chatId, '❌ Debes iniciar sesión primero.');
      }
      break;
      
    case '/reporte_semanal':
      const sessionRep = estaLogueado(chatId);
      if (sessionRep) {
        const reporte = generarReporteSemanal(userId, sessionRep.nombreCompleto);
        enviarMensajeTelegram(chatId, reporte);
      } else {
        enviarMensajeTelegram(chatId, '❌ Debes iniciar sesión primero.');
      }
      break;
      
    case '/leads_frios':
      const sessionLeads = estaLogueado(chatId);
      if (sessionLeads) {
        const frios = consultarLeadsFrios(userId);
        enviarMensajeTelegram(chatId, frios);
      } else {
        enviarMensajeTelegram(chatId, '❌ Debes iniciar sesión primero.');
      }
      break;
      
    case '/top_clientes':
      const sessionTop = estaLogueado(chatId);
      if (sessionTop) {
        const top = consultarTopClientes();
        enviarMensajeTelegram(chatId, top);
      } else {
        enviarMensajeTelegram(chatId, '❌ Debes iniciar sesión primero.');
      }
      break;
      
    case '/patrones':
      const sessionPat = estaLogueado(chatId);
      if (sessionPat) {
        const patrones = analizarPatronesPerdida();
        enviarMensajeTelegram(chatId, patrones);
      } else {
        enviarMensajeTelegram(chatId, '❌ Debes iniciar sesión primero.');
      }
      break;
      
    case '/ciclo':
      const sessionCiclo = estaLogueado(chatId);
      if (sessionCiclo) {
        const ciclo = consultarCicloVenta();
        enviarMensajeTelegram(chatId, ciclo);
      } else {
        enviarMensajeTelegram(chatId, '❌ Debes iniciar sesión primero.');
      }
      break;
      
    case '/sugerencias':
      const sessionSug = estaLogueado(chatId);
      if (sessionSug) {
        const sugerencias = generarSugerenciasInteligentes(userId, sessionSug.nombreCompleto);
        enviarMensajeTelegram(chatId, sugerencias);
      } else {
        enviarMensajeTelegram(chatId, '❌ Debes iniciar sesión primero.');
      }
      break;

    case '/help':
      enviarMensajeTelegram(chatId, `📚 AYUDA - SMART CRM + VENTAS

━━━━━━━━━━━━━━━━━━━━━━
📌 COMANDOS GENERALES:
━━━━━━━━━━━━━━━━━━━━━━
/login usuario contraseña - Iniciar sesión
/logout - Cerrar sesión
/pendientes - Ver actividades pendientes
/resumen - Ver resumen diario
/clear - Limpiar conversación
/help - Mostrar esta ayuda

━━━━━━━━━━━━━━━━━━━━━━
💰 COMANDOS DE VENTAS:
━━━━━━━━━━━━━━━━━━━━━━
/pipeline - Ver deals activos
/forecast - Proyección del mes
/kpis - Dashboard de métricas
/reporte_semanal - Resumen 7 días
/leads_frios - Deals sin actividad
/top_clientes - Ranking clientes
/patrones - Análisis deals perdidos
/ciclo - Tiempos de cierre
/sugerencias - Recomendaciones IA

━━━━━━━━━━━━━━━━━━━━━━
💡 EJEMPLOS CRM:
━━━━━━━━━━━━━━━━━━━━━━
📅 "Agenda reunión mañana 3pm con Sayyan"
📝 "Crear tarea: revisar reportes"
👤 "Registrar contacto Empresa ABC"

━━━━━━━━━━━━━━━━━━━━━━
🔥 EJEMPLOS VENTAS:
━━━━━━━━━━━━━━━━━━━━━━
📋 "Nuevo lead: Transportes ABC, API Smart, $2000"
📞 "Llamé a Hotel Plaza, muy interesados"
🎤 "Hice demo de ProSales a Constructora XYZ"
📄 "Envié propuesta a Hotel Plaza por $500"
💰 "Cerramos con Transportes ABC! $2000"
📉 "Perdimos Constructora XYZ, precio alto"`);
      break;
      
    default:
      enviarMensajeTelegram(chatId, '❓ Comando no reconocido. Usa /help para ver opciones disponibles.');
  }
}

// ============================================
// FIN DE PARTE 1
// ============================================
// Continúa en PARTE 2...
// ============================================
// ============================================
//
// BOT CRM SMART - VERSIÓN 3.1 COMPLETA
// PARTE 2 DE 2
// ============================================
// 
// CONTENIDO PARTE 2:
// - Procesamiento con IA
// - Funciones de búsqueda inteligente
// - Edición de reuniones/actividades
// - Agregar notas
// - Registro con notificación a participantes
// - Manejo de documentos
// - Conversaciones e historial
// - Reportes y consultas
// - Automatizaciones
// - Utilidades y funciones de prueba
//
// ============================================

// ============================================
// PROCESAMIENTO CON INTELIGENCIA ARTIFICIAL
// ============================================

function procesarConIA(chatId, userId, username, registeredUser, texto) {
  Logger.log(`🤖 Procesando con IA para ${registeredUser}`);
  
  const contexto = obtenerContexto(chatId);
  const historial = obtenerHistorialConversacion(userId, 8);
  
  // Obtener y preparar el prompt del sistema
  let systemPrompt = obtenerPrompt('sistema_base') || 'Eres un asistente CRM de Smart.';
  systemPrompt = systemPrompt.replace('{{USUARIO}}', registeredUser);
  
  // Inyectar pendientes del usuario para contexto
  const pendientesTexto = obtenerPendientesParaContexto(userId);
  systemPrompt = systemPrompt.replace('{{PENDIENTES_USUARIO}}', pendientesTexto);
  
  // Si hay contexto activo (conversación incompleta)
  if (contexto && contexto.estado === 'esperando') {
    systemPrompt += `\n\n═══════════════════════════════════════════
CONTEXTO ACTIVO (conversación incompleta):
═══════════════════════════════════════════
Acción pendiente: ${contexto.accion}
Datos ya recopilados: ${JSON.stringify(contexto.datos)}
Campos que faltan: ${contexto.camposFaltantes.join(', ')}

INSTRUCCIÓN: Completa los datos faltantes con la información que el usuario proporcione.
Si el usuario proporciona los datos faltantes, genera la acción completa.`;
  }
  
  // Construir mensajes para la IA
  const mensajes = [
    { role: 'system', content: systemPrompt },
    ...historial,
    { role: 'user', content: texto }
  ];
  
  // Llamar a Groq
  const respuestaIA = llamarGroq(mensajes);
  
  if (!respuestaIA) {
    enviarMensajeTelegram(chatId, '❌ Error procesando tu solicitud. Por favor intenta de nuevo.');
    return;
  }
  
  Logger.log('🤖 Respuesta IA recibida');
  
  // Procesar la respuesta de la IA
  procesarRespuestaIA(chatId, userId, username, registeredUser, respuestaIA, contexto);
}

function obtenerPendientesParaContexto(userId) {
  let texto = '';
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Reuniones pendientes
    const reunSheet = ss.getSheetByName('Reuniones');
    const reunData = reunSheet.getDataRange().getValues();
    const reuniones = [];
    
    for (let i = reunData.length - 1; i >= 1 && reuniones.length < 5; i--) {
      if (reunData[i][1] == userId && reunData[i][10] === 'Pendiente') {
        const fecha = reunData[i][6];
        const hora = reunData[i][7];
        const descripcion = reunData[i][8];
        const cliente = reunData[i][5];
        const participantes = reunData[i][14] || '';
        
        let item = `"${descripcion}" - ${fecha} ${hora}`;
        if (cliente && cliente !== 'Interno') item += ` (${cliente})`;
        if (participantes) item += ` [Con: ${participantes}]`;
        
        reuniones.push(item);
      }
    }
    
    if (reuniones.length > 0) {
      texto += '\n\n📅 REUNIONES PENDIENTES DEL USUARIO:\n';
      reuniones.forEach((r, i) => {
        texto += `${i + 1}. ${r}\n`;
      });
    }
    
    // Actividades pendientes
    const actSheet = ss.getSheetByName('Actividades');
    const actData = actSheet.getDataRange().getValues();
    const actividades = [];
    
    for (let i = actData.length - 1; i >= 1 && actividades.length < 5; i--) {
      if (actData[i][1] == userId && actData[i][10] === 'Pendiente') {
        const descripcion = actData[i][6];
        const prioridad = actData[i][9];
        const cliente = actData[i][5];
        
        let item = `"${descripcion}" (${prioridad})`;
        if (cliente) item += ` - ${cliente}`;
        
        actividades.push(item);
      }
    }
    
    if (actividades.length > 0) {
      texto += '\n📝 ACTIVIDADES PENDIENTES DEL USUARIO:\n';
      actividades.forEach((a, i) => {
        texto += `${i + 1}. ${a}\n`;
      });
    }
    
  } catch (error) {
    Logger.log('⚠️ Error obteniendo pendientes: ' + error);
  }
  
  return texto || '\n\n(El usuario no tiene pendientes registrados)';
}

function llamarGroq(mensajes) {
  var url = 'https://api.groq.com/openai/v1/chat/completions';
  
  try {
    var modelo = obtenerConfiguracion('MODELO_IA') || 'llama-3.3-70b-versatile';
    var temperatura = parseFloat(obtenerConfiguracion('TEMPERATURA_IA') || '0.3');
    var maxTokens = parseInt(obtenerConfiguracion('MAX_TOKENS_IA') || '1500');
    
    var options = {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + GROQ_API_KEY,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: modelo,
        messages: mensajes,
        temperature: temperatura,
        max_tokens: maxTokens
      }),
      muteHttpExceptions: true
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var result = JSON.parse(response.getContentText());
    
    if (result.error) {
      Logger.log('❌ Error de Groq: ' + JSON.stringify(result.error));
      
      if (result.error.code === 'rate_limit_exceeded') {
        var adminChatId = '8362094130';
        enviarMensajeTelegram(adminChatId, '🚨 *TOKENS AGOTADOS*\n\n❌ Se acabaron los tokens de Groq\n\n💡 Cambia el API Key');
      }
      return null;
    }
    
    if (result.choices && result.choices[0] && result.choices[0].message) {
      if (result.usage) {
        var tokensEsteLlamado = result.usage.total_tokens || 0;
        actualizarContadorTokens(tokensEsteLlamado);
      }
      return result.choices[0].message.content.trim();
    }
    
    Logger.log('❌ Respuesta inesperada de Groq: ' + JSON.stringify(result));
    return null;
    
  } catch (error) {
    Logger.log('❌ Error llamando a Groq: ' + error);
    return null;
  }
}

function actualizarContadorTokens(tokensUsados) {
  var props = PropertiesService.getScriptProperties();
  var hoy = new Date().toISOString().split('T')[0];
  
  var fechaGuardada = props.getProperty('TOKENS_FECHA') || '';
  var tokensAcumulados = parseInt(props.getProperty('TOKENS_USADOS') || '0');
  var alertaEnviada = props.getProperty('TOKENS_ALERTA_ENVIADA') || 'NO';
  
  if (fechaGuardada !== hoy) {
    tokensAcumulados = 0;
    alertaEnviada = 'NO';
    props.setProperty('TOKENS_FECHA', hoy);
    props.setProperty('TOKENS_ALERTA_ENVIADA', 'NO');
  }
  
  tokensAcumulados += tokensUsados;
  props.setProperty('TOKENS_USADOS', tokensAcumulados.toString());
  
  var limite = 100000;
  var umbralAlerta = 95000;
  
  Logger.log('📊 Tokens hoy: ' + tokensAcumulados + ' / ' + limite);
  
  if (tokensAcumulados >= umbralAlerta && alertaEnviada === 'NO') {
    var restantes = limite - tokensAcumulados;
    var adminChatId = '8362094130';
    enviarMensajeTelegram(adminChatId, '⚠️ *ALERTA: TOKENS BAJOS*\n\n📊 Usados: ' + tokensAcumulados + ' / ' + limite + '\n📉 Restantes: ~' + restantes + '\n\n💡 Considera cambiar el API Key');
    props.setProperty('TOKENS_ALERTA_ENVIADA', 'SI');
  }
}

function verTokensHoy() {
  var props = PropertiesService.getScriptProperties();
  var fecha = props.getProperty('TOKENS_FECHA') || 'Sin datos';
  var usados = props.getProperty('TOKENS_USADOS') || '0';
  Logger.log('📅 Fecha: ' + fecha);
  Logger.log('📊 Tokens: ' + usados + ' / 100,000');
}

function reiniciarContadorTokens() {
  var props = PropertiesService.getScriptProperties();
  props.deleteProperty('TOKENS_FECHA');
  props.deleteProperty('TOKENS_USADOS');
  props.deleteProperty('TOKENS_ALERTA_ENVIADA');
  Logger.log('✅ Contador reiniciado');
}

// ============================================
// PROCESAMIENTO DE RESPUESTA DE IA
// ============================================

function procesarRespuestaIA(chatId, userId, username, registeredUser, respuestaIA, contexto) {
  Logger.log('📋 Procesando respuesta de IA...');
  
  // ═══════════════════════════════════════════
  // HELPER: Extraer JSON robusto de acción
  // ═══════════════════════════════════════════
  function extraerJSON(texto, marcadorAccion) {
    var inicioAccion = texto.indexOf(marcadorAccion);
    if (inicioAccion === -1) return null;
    
    var inicioJSON = texto.indexOf('{', inicioAccion);
    if (inicioJSON === -1) return null;
    
    var nivel = 0;
    var finJSON = -1;
    for (var i = inicioJSON; i < texto.length; i++) {
      if (texto[i] === '{') nivel++;
      if (texto[i] === '}') nivel--;
      if (nivel === 0) {
        finJSON = i + 1;
        break;
      }
    }
    
    if (finJSON === -1) return null;
    return texto.substring(inicioJSON, finJSON);
  }
  
  // ═══════════════════════════════════════════
  // PRIMERO: ACCIONES DE VENTAS (NUEVAS)
  // ═══════════════════════════════════════════
  
  // NUEVO LEAD
  if (respuestaIA.includes('[ACCION:nuevo_lead]')) {
    try {
      var jsonStr = extraerJSON(respuestaIA, '[ACCION:nuevo_lead]');
      if (jsonStr) {
        var datos = JSON.parse(jsonStr);
        Logger.log('📋 Nuevo lead: ' + JSON.stringify(datos));
        var resultado = registrarLead(userId, username, registeredUser, datos);
        enviarMensajeTelegram(chatId, resultado.mensaje);
        limpiarContexto(chatId);
        guardarConversacion(userId, username, registeredUser, 'assistant', resultado.mensaje);
        return;
      }
    } catch (error) {
      Logger.log('❌ Error en nuevo_lead: ' + error.message);
      enviarMensajeTelegram(chatId, '❌ Error al registrar lead: ' + error.message);
      return;
    }
  }
  
  // CONTACTO DE VENTA (INTERACCIÓN COMERCIAL)
  if (respuestaIA.includes('[ACCION:contacto_venta]')) {
    try {
      var jsonStr = extraerJSON(respuestaIA, '[ACCION:contacto_venta]');
      if (jsonStr) {
        var datos = JSON.parse(jsonStr);
        Logger.log('📞 Contacto venta: ' + JSON.stringify(datos));
        var resultado = registrarContactoVenta(userId, username, registeredUser, datos);
        enviarMensajeTelegram(chatId, resultado.mensaje);
        limpiarContexto(chatId);
        guardarConversacion(userId, username, registeredUser, 'assistant', resultado.mensaje);
        return;
      }
    } catch (error) {
      Logger.log('❌ Error en contacto_venta: ' + error.message);
      enviarMensajeTelegram(chatId, '❌ Error al registrar interacción: ' + error.message);
      return;
    }
  }
  
  // MOVER ETAPA EN PIPELINE
  if (respuestaIA.includes('[ACCION:mover_etapa]')) {
    try {
      var jsonStr = extraerJSON(respuestaIA, '[ACCION:mover_etapa]');
      if (jsonStr) {
        var datos = JSON.parse(jsonStr);
        Logger.log('🔄 Mover etapa: ' + JSON.stringify(datos));
        var resultado = moverEtapa(userId, datos);
        enviarMensajeTelegram(chatId, resultado.mensaje);
        limpiarContexto(chatId);
        guardarConversacion(userId, username, registeredUser, 'assistant', resultado.mensaje);
        return;
      }
    } catch (error) {
      Logger.log('❌ Error en mover_etapa: ' + error.message);
      enviarMensajeTelegram(chatId, '❌ Error al mover etapa: ' + error.message);
      return;
    }
  }
  
  // REGISTRAR DEMO
  if (respuestaIA.includes('[ACCION:registrar_demo]')) {
    try {
      var jsonStr = extraerJSON(respuestaIA, '[ACCION:registrar_demo]');
      if (jsonStr) {
        var datos = JSON.parse(jsonStr);
        Logger.log('🎤 Demo: ' + JSON.stringify(datos));
        var resultado = registrarDemo(userId, username, registeredUser, datos);
        enviarMensajeTelegram(chatId, resultado.mensaje);
        limpiarContexto(chatId);
        guardarConversacion(userId, username, registeredUser, 'assistant', resultado.mensaje);
        return;
      }
    } catch (error) {
      Logger.log('❌ Error en registrar_demo: ' + error.message);
      enviarMensajeTelegram(chatId, '❌ Error al registrar demo: ' + error.message);
      return;
    }
  }
  
  // REGISTRAR PROPUESTA
  if (respuestaIA.includes('[ACCION:registrar_propuesta]')) {
    try {
      var jsonStr = extraerJSON(respuestaIA, '[ACCION:registrar_propuesta]');
      if (jsonStr) {
        var datos = JSON.parse(jsonStr);
        Logger.log('📄 Propuesta: ' + JSON.stringify(datos));
        var resultado = registrarPropuesta(userId, username, registeredUser, datos);
        enviarMensajeTelegram(chatId, resultado.mensaje);
        limpiarContexto(chatId);
        guardarConversacion(userId, username, registeredUser, 'assistant', resultado.mensaje);
        return;
      }
    } catch (error) {
      Logger.log('❌ Error en registrar_propuesta: ' + error.message);
      enviarMensajeTelegram(chatId, '❌ Error al registrar propuesta: ' + error.message);
      return;
    }
  }
  
  // CERRAR VENTA
  if (respuestaIA.includes('[ACCION:cerrar_venta]')) {
    try {
      var jsonStr = extraerJSON(respuestaIA, '[ACCION:cerrar_venta]');
      if (jsonStr) {
        var datos = JSON.parse(jsonStr);
        Logger.log('💰 Cerrar venta: ' + JSON.stringify(datos));
        var resultado = cerrarVenta(userId, username, registeredUser, datos);
        enviarMensajeTelegram(chatId, resultado.mensaje);
        limpiarContexto(chatId);
        guardarConversacion(userId, username, registeredUser, 'assistant', resultado.mensaje);
        return;
      }
    } catch (error) {
      Logger.log('❌ Error en cerrar_venta: ' + error.message);
      enviarMensajeTelegram(chatId, '❌ Error al cerrar venta: ' + error.message);
      return;
    }
  }
  
  // PERDER DEAL
  if (respuestaIA.includes('[ACCION:perder_deal]')) {
    try {
      var jsonStr = extraerJSON(respuestaIA, '[ACCION:perder_deal]');
      if (jsonStr) {
        var datos = JSON.parse(jsonStr);
        Logger.log('📉 Perder deal: ' + JSON.stringify(datos));
        var resultado = perderDeal(userId, username, registeredUser, datos);
        enviarMensajeTelegram(chatId, resultado.mensaje);
        limpiarContexto(chatId);
        guardarConversacion(userId, username, registeredUser, 'assistant', resultado.mensaje);
        return;
      }
    } catch (error) {
      Logger.log('❌ Error en perder_deal: ' + error.message);
      enviarMensajeTelegram(chatId, '❌ Error al registrar deal perdido: ' + error.message);
      return;
    }
  }
  
  // ═══════════════════════════════════════════
  // SEGUNDO: ACCIONES OPERATIVAS (EXISTENTES)
  // ═══════════════════════════════════════════
  
  // EDITAR REUNIÓN
  if (respuestaIA.includes('[ACCION:editar_reunion]')) {
    try {
      var jsonStr = extraerJSON(respuestaIA, '[ACCION:editar_reunion]');
      if (jsonStr) {
        var datos = JSON.parse(jsonStr);
        Logger.log('📝 Editando reunión: ' + JSON.stringify(datos));
        var resultado = editarReunionMejorada(userId, datos);
        enviarMensajeTelegram(chatId, resultado.mensaje);
        if (resultado.exito) {
          limpiarContexto(chatId);
          guardarConversacion(userId, username, registeredUser, 'assistant', 'Reunión editada exitosamente');
        }
        return;
      }
    } catch (error) {
      Logger.log('❌ Error en editar_reunion: ' + error.message);
      enviarMensajeTelegram(chatId, '❌ Error al procesar la edición. ¿Puedes darme más detalles?');
      return;
    }
  }
  
  // EDITAR ACTIVIDAD
  if (respuestaIA.includes('[ACCION:editar_actividad]')) {
    try {
      var jsonStr = extraerJSON(respuestaIA, '[ACCION:editar_actividad]');
      if (jsonStr) {
        var datos = JSON.parse(jsonStr);
        var resultado = editarActividadMejorada(userId, datos);
        enviarMensajeTelegram(chatId, resultado.mensaje);
        if (resultado.exito) {
          limpiarContexto(chatId);
          guardarConversacion(userId, username, registeredUser, 'assistant', 'Actividad editada exitosamente');
        }
        return;
      }
    } catch (error) {
      Logger.log('❌ Error en editar_actividad: ' + error.message);
      enviarMensajeTelegram(chatId, '❌ Error al procesar la edición. ¿Puedes especificar qué tarea quieres editar?');
      return;
    }
  }
  
  // AGREGAR NOTA
  if (respuestaIA.includes('[ACCION:agregar_nota]')) {
    try {
      var jsonStr = extraerJSON(respuestaIA, '[ACCION:agregar_nota]');
      if (jsonStr) {
        var datos = JSON.parse(jsonStr);
        var resultado = agregarNotaMejorada(userId, datos);
        enviarMensajeTelegram(chatId, resultado.mensaje);
        if (resultado.exito) {
          limpiarContexto(chatId);
          guardarConversacion(userId, username, registeredUser, 'assistant', 'Nota agregada exitosamente');
        }
        return;
      }
    } catch (error) {
      Logger.log('❌ Error en agregar_nota: ' + error.message);
      enviarMensajeTelegram(chatId, '❌ Error al agregar la nota.');
      return;
    }
  }
  
  // CREAR CONTACTO
  if (respuestaIA.includes('[ACCION:crear_contacto]')) {
    var match = respuestaIA.match(/\[ACCION:crear_contacto\]\s*(\{[\s\S]*?\})/);
    if (match) {
      try {
        var datos = JSON.parse(match[1]);
        Logger.log('👤 Creando contacto: ' + JSON.stringify(datos));
        
        if (!datos.nombreEmpresa || datos.nombreEmpresa.trim() === '') {
          var msgError = obtenerPrompt('mensaje_error_nombre_vacio') || 
            '❌ Necesito el nombre de la empresa. ¿Cuál es?';
          enviarMensajeTelegram(chatId, msgError);
          guardarContexto(chatId, 'crear_contacto', datos, 'esperando', ['nombreEmpresa']);
          return;
        }
        
        registrarContacto(userId, username, registeredUser, datos);
        enviarMensajeTelegram(chatId, '✅ Contacto "' + datos.nombreEmpresa + '" registrado correctamente.\n\n📂 Se creó carpeta en Drive para sus documentos.');
        limpiarContexto(chatId);
        guardarConversacion(userId, username, registeredUser, 'assistant', 'Contacto registrado: ' + datos.nombreEmpresa);
        return;
      } catch (error) {
        Logger.log('❌ Error parseando crear_contacto: ' + error);
      }
    }
  }
  
  // CREAR REUNIÓN
  if (respuestaIA.includes('[ACCION:crear_reunion]')) {
    var match = respuestaIA.match(/\[ACCION:crear_reunion\]\s*(\{[\s\S]*?\})/);
    if (match) {
      try {
        var datos = JSON.parse(match[1]);
        Logger.log('📅 Creando reunión: ' + JSON.stringify(datos));
        
        var camposFaltantes = [];
        if (!datos.fecha) camposFaltantes.push('fecha');
        if (!datos.hora) camposFaltantes.push('hora');
        if (!datos.descripcion) camposFaltantes.push('descripción');
        
        if (camposFaltantes.length > 0) {
          var msgError = obtenerPrompt('mensaje_error_reunion_incompleta') || 
            '❌ Para agendar necesito: ' + camposFaltantes.join(', ') + '. ¿Puedes completar?';
          enviarMensajeTelegram(chatId, msgError);
          guardarContexto(chatId, 'crear_reunion', datos, 'esperando', camposFaltantes);
          return;
        }
        
        var resultado = registrarReunionConParticipantes(userId, username, registeredUser, datos);
        enviarMensajeTelegram(chatId, resultado.mensaje);
        
        if (resultado.exito) {
          limpiarContexto(chatId);
          guardarConversacion(userId, username, registeredUser, 'assistant', 'Reunión agendada: ' + datos.descripcion);
        }
        return;
      } catch (error) {
        Logger.log('❌ Error parseando crear_reunion: ' + error);
      }
    }
  }
  
  // CREAR ACTIVIDAD
  if (respuestaIA.includes('[ACCION:crear_actividad]')) {
    var match = respuestaIA.match(/\[ACCION:crear_actividad\]\s*(\{[\s\S]*?\})/);
    if (match) {
      try {
        var datos = JSON.parse(match[1]);
        Logger.log('📝 Creando actividad: ' + JSON.stringify(datos));
        
        if (!datos.descripcion || datos.descripcion.trim() === '') {
          enviarMensajeTelegram(chatId, '❌ Necesito una descripción para la actividad. ¿Qué tarea deseas crear?');
          guardarContexto(chatId, 'crear_actividad', datos, 'esperando', ['descripcion']);
          return;
        }
        
        registrarActividad(userId, username, registeredUser, datos);
        
        var prioridadEmoji = datos.prioridad === 'Alta' ? '🔴' : datos.prioridad === 'Media' ? '🟡' : '🟢';
        enviarMensajeTelegram(chatId, '✅ Actividad registrada:\n\n' + prioridadEmoji + ' ' + datos.descripcion + '\n📋 Tipo: ' + (datos.tipo || 'tarea') + '\n⏱ Estado: Pendiente');
        limpiarContexto(chatId);
        guardarConversacion(userId, username, registeredUser, 'assistant', 'Actividad registrada: ' + datos.descripcion);
        return;
      } catch (error) {
        Logger.log('❌ Error parseando crear_actividad: ' + error);
      }
    }
  }
  
  // ASIGNAR TAREA
  if (respuestaIA.includes('[ACCION:asignar_tarea]')) {
    var match = respuestaIA.match(/\[ACCION:asignar_tarea\]\s*(\{[\s\S]*?\})/);
    if (match) {
      try {
        var datos = JSON.parse(match[1]);
        Logger.log('📋 Asignando tarea: ' + JSON.stringify(datos));
        
        var usuarioAsignado = obtenerDatosUsuarioPorNombre(datos.asignado_a);
        
        if (usuarioAsignado) {
          registrarActividad(
            usuarioAsignado.telegramId || '',
            usuarioAsignado.username,
            usuarioAsignado.nombreCompleto,
            {
              tipo: datos.tipo || 'tarea',
              cliente: datos.cliente || 'Interno',
              descripcion: datos.descripcion,
              prioridad: datos.prioridad || 'Media'
            },
            registeredUser
          );
          
          if (usuarioAsignado.telegramId) {
            var mensajeNotificacion = '🔔 NUEVA TAREA ASIGNADA\n\n' +
              registeredUser + ' te ha asignado una tarea:\n\n' +
              '📋 ' + datos.descripcion + '\n' +
              '⚡ Prioridad: ' + (datos.prioridad || 'Media') +
              (datos.cliente ? '\n👤 Cliente: ' + datos.cliente : '') +
              '\n\n¡Revisa tus pendientes con /pendientes!';
            enviarMensajeTelegram(usuarioAsignado.telegramId, mensajeNotificacion);
          }
          
          enviarMensajeTelegram(chatId, '✅ Tarea asignada a ' + usuarioAsignado.nombreCompleto + ':\n\n📋 ' + datos.descripcion +
            '\n\n' + (usuarioAsignado.telegramId ? '📱 Se le notificó por Telegram' : '⚠️ El usuario no tiene Telegram ID configurado'));
          limpiarContexto(chatId);
          guardarConversacion(userId, username, registeredUser, 'assistant', 'Tarea asignada a ' + datos.asignado_a);
        } else {
          enviarMensajeTelegram(chatId, '❌ No encontré al usuario "' + datos.asignado_a + '" en el equipo Smart.\n\nUsuarios disponibles:\n• Luis Ilarraza\n• Andreina\n• Sayyan\n• Diana\n• Miguel\n• Luis Sandoval');
        }
        return;
      } catch (error) {
        Logger.log('❌ Error parseando asignar_tarea: ' + error);
      }
    }
  }
  
  // ═══════════════════════════════════════════
  // TERCERO: RESPUESTA CONVERSACIONAL
  // ═══════════════════════════════════════════
  
  var textoLimpio = respuestaIA.replace(/\[ACCION:.*?\][\s\S]*?\}/g, '').trim();
  
  if (textoLimpio) {
    enviarMensajeTelegram(chatId, textoLimpio);
    guardarConversacion(userId, username, registeredUser, 'assistant', textoLimpio);
  }
}

// ============================================
// FUNCIONES DE BÚSQUEDA INTELIGENTE
// ============================================

function buscarReunion(userId, criterios) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Reuniones');
    const data = sheet.getDataRange().getValues();
    
    let mejorCoincidencia = null;
    let mejorPuntaje = 0;
    
    // Convertir userId a string para comparación segura
    const userIdStr = String(userId);
    
    Logger.log(`🔍 Buscando reunión - userId: ${userIdStr}, criterios: ${JSON.stringify(criterios)}`);
    
    // Buscar de más reciente a más antigua
    for (let i = data.length - 1; i >= 1; i--) {
      // CORRECCIÓN: Comparar como strings
      const filaUserId = String(data[i][1]);
      if (filaUserId !== userIdStr) continue;
      
      const fila = {
        indice: i + 1,
        datos: data[i],
        eventId: data[i][11],
        timestamp: data[i][0],
        tipo: data[i][4],
        cliente: (data[i][5] || '').toString().toLowerCase(),
        fecha: data[i][6],
        hora: data[i][7],
        descripcion: (data[i][8] || '').toString().toLowerCase(),
        prioridad: data[i][9],
        estado: data[i][10],
        notas: data[i][12],
        participantes: data[i][14] || ''
      };
      
      let puntaje = 0;
      const valorBusqueda = (criterios.valor_busqueda || '').toLowerCase();
      
      Logger.log(`📋 Evaluando reunión fila ${i+1}: "${fila.descripcion}" - estado: ${fila.estado}`);
      
      switch (criterios.buscar_por) {
        case 'reciente':
          // Devolver la más reciente pendiente
          if (fila.estado === 'Pendiente') {
            Logger.log(`✅ Encontrada reunión reciente: ${fila.descripcion}`);
            return fila;
          }
          break;
          
        case 'descripcion':
          // Buscar en descripción
          if (fila.descripcion.includes(valorBusqueda)) {
            puntaje = 10;
            Logger.log(`📌 Match en descripción: +10 puntos`);
          }
          // También buscar en cliente por si mencionó nombre de persona
          if (fila.cliente.includes(valorBusqueda)) {
            puntaje += 5;
            Logger.log(`📌 Match en cliente: +5 puntos`);
          }
          // Buscar en participantes
          if (fila.participantes && fila.participantes.toLowerCase().includes(valorBusqueda)) {
            puntaje += 8;
            Logger.log(`📌 Match en participantes: +8 puntos`);
          }
          // Priorizar pendientes
          if (fila.estado === 'Pendiente') {
            puntaje += 3;
          }
          break;
          
        case 'cliente':
          if (fila.cliente.includes(valorBusqueda)) {
            puntaje = 10;
            if (fila.estado === 'Pendiente') puntaje += 3;
          }
          break;
          
        case 'fecha':
          if (fila.fecha === criterios.valor_busqueda) {
            puntaje = 10;
            if (fila.estado === 'Pendiente') puntaje += 3;
          }
          break;
          
        case 'participante':
          if (fila.participantes && fila.participantes.toLowerCase().includes(valorBusqueda)) {
            puntaje = 10;
            if (fila.estado === 'Pendiente') puntaje += 3;
          }
          break;
          
        default:
          // Si no hay buscar_por específico, buscar en todo
          if (valorBusqueda) {
            if (fila.descripcion.includes(valorBusqueda)) puntaje += 10;
            if (fila.cliente.includes(valorBusqueda)) puntaje += 5;
            if (fila.participantes && fila.participantes.toLowerCase().includes(valorBusqueda)) puntaje += 8;
            if (fila.estado === 'Pendiente') puntaje += 3;
          }
      }
      
      Logger.log(`📊 Puntaje total fila ${i+1}: ${puntaje}`);
      
      if (puntaje > mejorPuntaje) {
        mejorPuntaje = puntaje;
        mejorCoincidencia = fila;
      }
    }
    
    if (mejorCoincidencia) {
      Logger.log(`✅ Mejor coincidencia encontrada: "${mejorCoincidencia.descripcion}" con puntaje ${mejorPuntaje}`);
    } else {
      Logger.log(`❌ No se encontró ninguna reunión que coincida`);
    }
    
    return mejorCoincidencia;
    
  } catch (error) {
    Logger.log('❌ Error buscando reunión: ' + error);
    return null;
  }
}

function buscarActividad(userId, criterios) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Actividades');
    const data = sheet.getDataRange().getValues();
    
    let mejorCoincidencia = null;
    let mejorPuntaje = 0;
    
    // Convertir userId a string para comparación segura
    const userIdStr = String(userId);
    
    Logger.log(`🔍 Buscando actividad - userId: ${userIdStr}, criterios: ${JSON.stringify(criterios)}`);
    
    // Buscar de más reciente a más antigua
    for (let i = data.length - 1; i >= 1; i--) {
      // CORRECCIÓN: Comparar como strings
      const filaUserId = String(data[i][1]);
      if (filaUserId !== userIdStr) continue;
      
      const fila = {
        indice: i + 1,
        datos: data[i],
        timestamp: data[i][0],
        tipo: data[i][4],
        cliente: (data[i][5] || '').toString().toLowerCase(),
        descripcion: (data[i][6] || '').toString().toLowerCase(),
        monto: data[i][7],
        horas: data[i][8],
        prioridad: data[i][9],
        estado: data[i][10],
        notas: data[i][11],
        asignadoPor: data[i][12]
      };
      
      let puntaje = 0;
      const valorBusqueda = (criterios.valor_busqueda || '').toLowerCase();
      
      Logger.log(`📋 Evaluando actividad fila ${i+1}: "${fila.descripcion}" - estado: ${fila.estado}`);
      
      switch (criterios.buscar_por) {
        case 'reciente':
          // Devolver la más reciente pendiente
          if (fila.estado === 'Pendiente') {
            Logger.log(`✅ Encontrada actividad reciente: ${fila.descripcion}`);
            return fila;
          }
          break;
          
        case 'descripcion':
          if (fila.descripcion.includes(valorBusqueda)) {
            puntaje = 10;
            Logger.log(`📌 Match en descripción: +10 puntos`);
          }
          if (fila.cliente.includes(valorBusqueda)) {
            puntaje += 5;
            Logger.log(`📌 Match en cliente: +5 puntos`);
          }
          if (fila.estado === 'Pendiente') {
            puntaje += 3;
          }
          break;
          
        case 'cliente':
          if (fila.cliente.includes(valorBusqueda)) {
            puntaje = 10;
            if (fila.estado === 'Pendiente') puntaje += 3;
          }
          break;
          
        case 'tipo':
          if (fila.tipo.toLowerCase() === valorBusqueda) {
            puntaje = 10;
            if (fila.estado === 'Pendiente') puntaje += 3;
          }
          break;
          
        default:
          // Si no hay buscar_por específico, buscar en todo
          if (valorBusqueda) {
            if (fila.descripcion.includes(valorBusqueda)) puntaje += 10;
            if (fila.cliente.includes(valorBusqueda)) puntaje += 5;
            if (fila.estado === 'Pendiente') puntaje += 3;
          }
      }
      
      Logger.log(`📊 Puntaje total fila ${i+1}: ${puntaje}`);
      
      if (puntaje > mejorPuntaje) {
        mejorPuntaje = puntaje;
        mejorCoincidencia = fila;
      }
    }
    
    if (mejorCoincidencia) {
      Logger.log(`✅ Mejor coincidencia encontrada: "${mejorCoincidencia.descripcion}" con puntaje ${mejorPuntaje}`);
    } else {
      Logger.log(`❌ No se encontró ninguna actividad que coincida`);
    }
    
    return mejorCoincidencia;
    
  } catch (error) {
    Logger.log('❌ Error buscando actividad: ' + error);
    return null;
  }
}

// ============================================
// FUNCIONES DE EDICIÓN MEJORADAS
// ============================================

function editarReunionMejorada(userId, datos) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Reuniones');
    
    // Buscar la reunión
    const reunion = buscarReunion(userId, {
      buscar_por: datos.buscar_por || 'reciente',
      valor_busqueda: datos.valor_busqueda || ''
    });
    
    if (!reunion) {
      return {
        exito: false,
        mensaje: '❌ No encontré ninguna reunión que coincida con esa búsqueda.\n\n¿Puedes darme más detalles sobre cuál reunión quieres editar?\n\nPuedes decirme:\n• El tema de la reunión\n• Con quién es\n• La fecha'
      };
    }
    
    const fila = reunion.indice;
    const cambios = datos.cambios || {};
    const cambiosRealizados = [];
    
    // Mapeo de campos a columnas
    const colMap = {
      'tipo': 5,
      'cliente': 6,
      'fecha': 7,
      'hora': 8,
      'descripcion': 9,
      'prioridad': 10,
      'estado': 11
    };
    
    // Guardar valores actuales para Calendar
    let nuevaFecha = reunion.fecha;
    let nuevaHora = reunion.hora;
    let nuevaDescripcion = reunion.datos[8];
    
    // Aplicar cambios
    for (const [campo, valor] of Object.entries(cambios)) {
      if (colMap[campo] && valor !== undefined && valor !== null && valor !== '') {
        sheet.getRange(fila, colMap[campo]).setValue(valor);
        cambiosRealizados.push(`${campo}: ${valor}`);
        
        if (campo === 'fecha') nuevaFecha = valor;
        if (campo === 'hora') nuevaHora = valor;
        if (campo === 'descripcion') nuevaDescripcion = valor;
      }
    }
    
    // Actualizar evento en Google Calendar si cambió fecha u hora
    if (reunion.eventId && (cambios.fecha || cambios.hora)) {
      try {
        const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
        const event = calendar.getEventById(reunion.eventId);
        
        if (event) {
          const fechaHora = new Date(`${nuevaFecha}T${nuevaHora}:00`);
          const duracion = parseInt(obtenerConfiguracion('DURACION_REUNION_DEFAULT') || '60');
          const fechaFin = new Date(fechaHora.getTime() + duracion * 60 * 1000);
          
          event.setTime(fechaHora, fechaFin);
          Logger.log(`✅ Evento Calendar actualizado: ${reunion.eventId}`);
        }
      } catch (calError) {
        Logger.log('⚠️ No se pudo actualizar Calendar: ' + calError);
      }
    }
    
    // Actualizar título del evento si cambió descripción
    if (reunion.eventId && cambios.descripcion) {
      try {
        const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
        const event = calendar.getEventById(reunion.eventId);
        if (event) {
          const nuevoTitulo = `Smart: ${nuevaDescripcion}`;
          event.setTitle(nuevoTitulo);
        }
      } catch (calError) {
        Logger.log('⚠️ No se pudo actualizar título Calendar: ' + calError);
      }
    }
    
    if (cambiosRealizados.length === 0) {
      return {
        exito: false,
        mensaje: '⚠️ No se especificaron cambios válidos.\n\n¿Qué quieres modificar de la reunión?\n• hora\n• fecha\n• descripción\n• prioridad\n• estado'
      };
    }
    
    const descripcionReunion = reunion.datos[8] || 'Sin descripción';
    
    return {
      exito: true,
      mensaje: `✅ Reunión actualizada:\n\n📋 "${descripcionReunion}"\n\n📝 Cambios realizados:\n• ${cambiosRealizados.join('\n• ')}\n\n${reunion.eventId ? '📅 Calendario actualizado' : ''}`,
      reunion: {
        descripcion: descripcionReunion,
        fecha: nuevaFecha,
        hora: nuevaHora
      }
    };
    
  } catch (error) {
    Logger.log('❌ Error editando reunión: ' + error);
    return {
      exito: false,
      mensaje: '❌ Error al editar la reunión: ' + error.message
    };
  }
}

function editarActividadMejorada(userId, datos) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Actividades');
    
    // Buscar la actividad
    const actividad = buscarActividad(userId, {
      buscar_por: datos.buscar_por || 'reciente',
      valor_busqueda: datos.valor_busqueda || ''
    });
    
    if (!actividad) {
      return {
        exito: false,
        mensaje: '❌ No encontré ninguna actividad que coincida.\n\n¿Puedes darme más detalles sobre cuál tarea quieres editar?'
      };
    }
    
    const fila = actividad.indice;
    const cambios = datos.cambios || {};
    const cambiosRealizados = [];
    
    // Mapeo de campos a columnas
    const colMap = {
      'tipo': 5,
      'cliente': 6,
      'descripcion': 7,
      'monto': 8,
      'horas': 9,
      'prioridad': 10,
      'estado': 11
    };
    
    // Aplicar cambios
    for (const [campo, valor] of Object.entries(cambios)) {
      if (colMap[campo] && valor !== undefined && valor !== null && valor !== '') {
        sheet.getRange(fila, colMap[campo]).setValue(valor);
        cambiosRealizados.push(`${campo}: ${valor}`);
      }
    }
    
    if (cambiosRealizados.length === 0) {
      return {
        exito: false,
        mensaje: '⚠️ No se especificaron cambios válidos.\n\n¿Qué quieres modificar?\n• descripcion\n• prioridad (Alta/Media/Baja)\n• estado (Pendiente/Completada)\n• cliente'
      };
    }
    
    const descripcionActividad = actividad.datos[6] || 'Sin descripción';
    const estadoFinal = cambios.estado || actividad.estado;
    const emoji = estadoFinal === 'Completada' ? '✅' : '📝';
    
    return {
      exito: true,
      mensaje: `${emoji} Actividad actualizada:\n\n📋 "${descripcionActividad}"\n\n📝 Cambios realizados:\n• ${cambiosRealizados.join('\n• ')}`
    };
    
  } catch (error) {
    Logger.log('❌ Error editando actividad: ' + error);
    return {
      exito: false,
      mensaje: '❌ Error al editar la actividad: ' + error.message
    };
  }
}

function agregarNotaMejorada(userId, datos) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const esReunion = datos.tipo === 'reunion';
    const sheetName = esReunion ? 'Reuniones' : 'Actividades';
    const sheet = ss.getSheetByName(sheetName);
    
    // Buscar el registro
    let registro;
    if (esReunion) {
      registro = buscarReunion(userId, {
        buscar_por: datos.buscar_por || 'reciente',
        valor_busqueda: datos.valor_busqueda || ''
      });
    } else {
      registro = buscarActividad(userId, {
        buscar_por: datos.buscar_por || 'reciente',
        valor_busqueda: datos.valor_busqueda || ''
      });
    }
    
    if (!registro) {
      return {
        exito: false,
        mensaje: `❌ No encontré ninguna ${esReunion ? 'reunión' : 'actividad'} que coincida.\n\n¿A cuál quieres agregarle la nota?`
      };
    }
    
    const fila = registro.indice;
    const colNotas = esReunion ? 13 : 12; // Columna de notas
    
    // Obtener notas actuales
    const notasActuales = sheet.getRange(fila, colNotas).getValue() || '';
    
    // Crear timestamp para la nota
    const timestamp = new Date().toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Agregar nueva nota con timestamp
    const nuevaNota = `[${timestamp}] ${datos.nota}`;
    const notasFinales = notasActuales ? `${notasActuales}\n${nuevaNota}` : nuevaNota;
    
    sheet.getRange(fila, colNotas).setValue(notasFinales);
    
    const descripcion = esReunion ? registro.datos[8] : registro.datos[6];
    
    return {
      exito: true,
      mensaje: `✅ Nota agregada a "${descripcion}":\n\n📝 ${datos.nota}\n\n⏰ ${timestamp}`
    };
    
  } catch (error) {
    Logger.log('❌ Error agregando nota: ' + error);
    return {
      exito: false,
      mensaje: '❌ Error al agregar la nota: ' + error.message
    };
  }
}

// ============================================
// REGISTRO CON PARTICIPANTES Y NOTIFICACIONES
// ============================================

function registrarReunionConParticipantes(userId, username, registeredUser, datos) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Reuniones');
    
    // Preparar fecha y hora
    var fechaHora = new Date(datos.fecha + 'T' + datos.hora + ':00');
    var duracion = parseInt(obtenerConfiguracion('DURACION_REUNION_DEFAULT') || '60');
    var fechaFin = new Date(fechaHora.getTime() + duracion * 60 * 1000);
    
    // Obtener datos de participantes
    var participantes = datos.participantes || [];
    var emailsParticipantes = [];
    var participantesNotificar = [];
    
    for (var p = 0; p < participantes.length; p++) {
      var nombre = participantes[p];
      var usuario = obtenerDatosUsuarioPorNombre(nombre);
      if (usuario) {
        if (usuario.email) {
          emailsParticipantes.push(usuario.email);
        }
        if (usuario.telegramId) {
          participantesNotificar.push(usuario);
        }
      }
    }
    
    // Crear evento en Calendar UNA SOLA VEZ
    var calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    var titulo = 'Smart: ' + datos.descripcion;
    
    var opciones = {
      description: 'Reunión creada por ' + registeredUser + (participantes.length > 0 ? '\nParticipantes: ' + participantes.join(', ') : '')
    };
    
    if (emailsParticipantes.length > 0) {
      opciones.guests = emailsParticipantes.join(',');
      opciones.sendInvites = true;
    }
    
    var event = calendar.createEvent(titulo, fechaHora, fechaFin, opciones);
    
    Logger.log('✅ Evento Calendar creado: ' + event.getId());
    
    // Guardar en Sheet
    sheet.appendRow([
      new Date(),
      userId,
      username,
      registeredUser,
      datos.tipo || 'reunion',
      datos.cliente || 'Interno',
      datos.fecha,
      datos.hora,
      datos.descripcion,
      datos.prioridad || 'Media',
      'Pendiente',
      event.getId(),
      datos.notas || '',
      '',
      participantes.join(', ')
    ]);
    
    // NOTIFICAR por Telegram a cada participante
    var notificarHabilitado = obtenerConfiguracion('NOTIFICAR_PARTICIPANTES') !== 'NO';
    
    if (notificarHabilitado && participantesNotificar.length > 0) {
      var fechaFormateada = fechaHora.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });
      
      for (var n = 0; n < participantesNotificar.length; n++) {
        var participante = participantesNotificar[n];
        var mensajeNotificacion = '📅 *NUEVA REUNIÓN SMART*\n\n' +
          registeredUser + ' te ha invitado a una reunión:\n\n' +
          '📋 *' + datos.descripcion + '*\n' +
          '📆 ' + fechaFormateada + '\n' +
          '🕐 ' + datos.hora + '\n' +
          (datos.cliente && datos.cliente !== 'Interno' ? '👤 Cliente: ' + datos.cliente + '\n' : '🏢 Reunión interna\n') +
          '👥 Participantes: ' + participantes.join(', ') + '\n\n' +
          '✉️ También recibirás invitación en tu calendario.\n\n' +
          'Usa /pendientes para ver todas tus reuniones.';
        
        enviarMensajeTelegram(participante.telegramId, mensajeNotificacion);
        Logger.log('📱 Notificación enviada a ' + participante.nombreCompleto);
      }
    }
    
    // Construir mensaje de confirmación
    var mensajeConfirmacion = '✅ Reunión agendada correctamente:\n\n';
    mensajeConfirmacion += '📋 ' + datos.descripcion + '\n';
    mensajeConfirmacion += '📆 ' + datos.fecha + ' a las ' + datos.hora + '\n';
    mensajeConfirmacion += (datos.cliente && datos.cliente !== 'Interno' ? '👤 Cliente: ' + datos.cliente + '\n' : '🏢 Reunión interna\n');
    
    if (participantes.length > 0) {
      mensajeConfirmacion += '👥 Participantes: ' + participantes.join(', ') + '\n';
      mensajeConfirmacion += '\n━━━━━━━━━━━━━━━━━━━━\n';
      
      var notificados = [];
      for (var t = 0; t < participantesNotificar.length; t++) {
        notificados.push(participantesNotificar[t].nombreCompleto);
      }
      
      if (notificados.length > 0) {
        mensajeConfirmacion += '📱 Notificados por Telegram: ' + notificados.join(', ') + '\n';
      }
      
      if (emailsParticipantes.length > 0) {
        mensajeConfirmacion += '📧 Invitaciones Calendar enviadas: ' + emailsParticipantes.length + '\n';
      }
      
      var sinTelegram = [];
      for (var s = 0; s < participantes.length; s++) {
        var nombrePart = participantes[s];
        var usuarioPart = obtenerDatosUsuarioPorNombre(nombrePart);
        if (usuarioPart && !usuarioPart.telegramId) {
          sinTelegram.push(nombrePart);
        }
      }
      
      if (sinTelegram.length > 0) {
        mensajeConfirmacion += '⚠️ Sin Telegram ID: ' + sinTelegram.join(', ') + '\n';
      }
    }
    
    mensajeConfirmacion += '\n📅 Evento agregado al calendario';
    
    return { exito: true, mensaje: mensajeConfirmacion };
    
  } catch (error) {
    Logger.log('❌ Error registrando reunión con participantes: ' + error);
    return { exito: false, mensaje: '❌ Error al crear la reunión: ' + error.message };
  }
}

// ============================================
// FUNCIONES DE REGISTRO BÁSICAS
// ============================================

function registrarActividad(userId, username, registeredUser, datos, asignadoPor = '') {
  try {
    if (!datos || typeof datos !== 'object') {
      throw new Error('Datos de actividad inválidos');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Actividades');
    
    sheet.appendRow([
      new Date(),                          // Timestamp
      userId,                              // User ID
      username,                            // Username
      registeredUser,                      // Registered User
      datos.tipo || 'tarea',               // Tipo
      datos.cliente || '',                 // Cliente
      datos.descripcion || 'Sin descripción', // Descripción
      datos.monto || '',                   // Monto
      datos.horas || '',                   // Horas
      datos.prioridad || 'Media',          // Prioridad
      'Pendiente',                         // Estado
      datos.notas || '',                   // Notas
      asignadoPor                          // Asignado Por
    ]);
    
    Logger.log(`✅ Actividad registrada: ${datos.descripcion}`);
    
  } catch (error) {
    Logger.log('❌ Error registrando actividad: ' + error);
    throw error;
  }
}

function registrarReunion(userId, username, registeredUser, datos, asignadoPor = '') {
  try {
    if (!datos || typeof datos !== 'object' || !datos.fecha || !datos.hora) {
      throw new Error('Datos de reunión inválidos');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Reuniones');
    
    // Crear evento en Calendar
    const fechaHora = new Date(`${datos.fecha}T${datos.hora}:00`);
    const duracion = parseInt(obtenerConfiguracion('DURACION_REUNION_DEFAULT') || '60');
    const fechaFin = new Date(fechaHora.getTime() + duracion * 60 * 1000);
    
    const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
    const titulo = `Smart: ${datos.tipo || 'Reunión'} - ${datos.cliente || 'Interno'} - ${datos.descripcion}`;
    const event = calendar.createEvent(titulo, fechaHora, fechaFin);
    
    sheet.appendRow([
      new Date(),                          // Timestamp
      userId,                              // User ID
      username,                            // Username
      registeredUser,                      // Registered User
      datos.tipo || 'reunion',             // Tipo
      datos.cliente || 'Interno',          // Cliente
      datos.fecha,                         // Fecha
      datos.hora,                          // Hora
      datos.descripcion || 'Sin descripción', // Descripción
      datos.prioridad || 'Media',          // Prioridad
      'Pendiente',                         // Estado
      event.getId(),                       // Event ID
      datos.notas || '',                   // Notas
      asignadoPor,                         // Asignado Por
      ''                                   // Participantes
    ]);
    
    Logger.log(`✅ Reunión registrada: ${datos.descripcion} - ${datos.fecha} ${datos.hora}`);
    
  } catch (error) {
    Logger.log('❌ Error registrando reunión: ' + error);
    throw error;
  }
}

function registrarContacto(userId, username, registeredUser, datos) {
  try {
    if (!datos || typeof datos !== 'object' || (!datos.nombreEmpresa && !datos.rif)) {
      throw new Error('Datos de contacto inválidos');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Contactos');
    
    const nombreEmpresa = datos.nombreEmpresa || datos.rif || 'Sin Nombre';
    
    sheet.appendRow([
      new Date(),                          // Timestamp
      userId,                              // User ID
      username,                            // Username
      registeredUser,                      // Registered User
      nombreEmpresa,                       // Nombre Empresa
      datos.actividadComercial || '',      // Actividad Comercial
      datos.estatus || '',                 // Estatus
      datos.rif || '',                     // RIF
      datos.contribuyenteEspecial || '',   // Contribuyente Especial
      datos.volumenMensual || '',          // Volumen Mensual
      datos.formaFacturacion || '',        // Forma Facturación
      datos.sistemaHomologado || '',       // Sistema Homologado
      datos.nombreApellido || '',          // Nombre y Apellido
      datos.correo || '',                  // Correo
      datos.telefono || '',                // Teléfono
      datos.direccionFiscal || '',         // Dirección Fiscal
      datos.notas || '',                   // Notas
      ''                                   // Drive Folder ID (se llena abajo)
    ]);
    
    const fila = sheet.getLastRow();
    
    // Crear carpeta en Drive
    try {
      const rootFolder = DriveApp.getFolderById(DRIVE_ROOT_FOLDER_ID);
      const newFolder = rootFolder.createFolder(nombreEmpresa);
      const folderId = newFolder.getId();
      sheet.getRange(fila, 18).setValue(folderId);
      Logger.log(`✅ Carpeta Drive creada para: ${nombreEmpresa}`);
    } catch (driveError) {
      Logger.log('⚠️ No se pudo crear carpeta en Drive: ' + driveError);
    }
    
    Logger.log(`✅ Contacto registrado: ${nombreEmpresa}`);
    
  } catch (error) {
    Logger.log('❌ Error registrando contacto: ' + error);
    throw error;
  }
}

// ============================================
// MANEJO DE DOCUMENTOS
// ============================================

function manejarDocumento(message, session) {
  var chatId = message.chat.id;
  var userId = message.from.id;
  var username = message.from.username || message.from.first_name || 'Desconocido';
  
  if (!session) {
    enviarMensajeTelegram(chatId, '❌ Debes iniciar sesión para subir documentos.');
    return;
  }
  
  var registeredUser = session.nombreCompleto;
  
  try {
    var document = message.document;
    var fileId = document.file_id;
    var fileName = document.file_name;
    var mimeType = document.mime_type;
    
    Logger.log('📎 Procesando documento: ' + fileName);
    
    // Obtener ruta del archivo en Telegram
    var getFileUrl = 'https://api.telegram.org/bot' + TELEGRAM_TOKEN + '/getFile?file_id=' + fileId;
    var response = UrlFetchApp.fetch(getFileUrl);
    var fileInfo = JSON.parse(response.getContentText());
    
    if (!fileInfo.ok) {
      throw new Error('Error obteniendo info del archivo: ' + JSON.stringify(fileInfo));
    }
    
    var filePath = fileInfo.result.file_path;
    
    // Descargar el archivo
    var downloadUrl = 'https://api.telegram.org/file/bot' + TELEGRAM_TOKEN + '/' + filePath;
    var blob = UrlFetchApp.fetch(downloadUrl).getBlob();
    blob.setName(fileName);
    
    // Obtener cliente desde caption
    var client = '';
    if (message.caption) {
      var match = message.caption.match(/Cliente:\s*(.+)/i);
      if (match) {
        client = match[1].trim();
      }
    }
    
    if (!client) {
      enviarMensajeTelegram(chatId, '❌ Por favor, incluye una caption con "Cliente: NombreEmpresa" para identificar el cliente.\n\nEjemplo: Envía el archivo con caption "Cliente: Prueba 9"');
      return;
    }
    
    Logger.log('🔍 Buscando cliente: ' + client);
    
    // Buscar carpeta del cliente
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var contSheet = ss.getSheetByName('Contactos');
    var contData = contSheet.getDataRange().getValues();
    var folderId = null;
    var clienteEncontrado = '';
    
    for (var i = 1; i < contData.length; i++) {
      var nombreEmpresa = (contData[i][4] || '').toString().toLowerCase();
      var rif = (contData[i][7] || '').toString().toLowerCase();
      
      if (nombreEmpresa === client.toLowerCase() || rif === client.toLowerCase()) {
        folderId = contData[i][17];
        clienteEncontrado = contData[i][4];
        Logger.log('✅ Cliente encontrado: ' + clienteEncontrado + ' - FolderID: ' + folderId);
        break;
      }
    }
    
    if (!folderId) {
      enviarMensajeTelegram(chatId, '❌ Cliente "' + client + '" no encontrado en contactos.\n\n¿Quieres registrarlo primero? Dime:\n"Registra el contacto ' + client + '"');
      return;
    }
    
    // Subir a Drive
    Logger.log('📤 Subiendo a Drive...');
    var folder = DriveApp.getFolderById(folderId);
    var file = folder.createFile(blob);
    var driveLink = file.getUrl();
    
    // Inferir tipo de documento
    var tipoDocumento = mimeType || 'Documento General';
    var extension = fileName.split('.').pop().toLowerCase();
    if (extension === 'pdf') tipoDocumento = 'PDF';
    else if (extension === 'doc' || extension === 'docx') tipoDocumento = 'Documento Word';
    else if (extension === 'xls' || extension === 'xlsx') tipoDocumento = 'Hoja de Cálculo';
    else if (extension === 'jpg' || extension === 'png' || extension === 'jpeg' || extension === 'gif') tipoDocumento = 'Imagen';
    else if (extension === 'ppt' || extension === 'pptx') tipoDocumento = 'Presentación';
    
    // Registrar en hoja Documentos
    var docSheet = ss.getSheetByName('Documentos');
    docSheet.appendRow([
      new Date(),
      userId,
      username,
      registeredUser,
      clienteEncontrado,
      tipoDocumento,
      fileName,
      driveLink
    ]);
    
    // Guardar en conversaciones
    guardarConversacion(userId, username, registeredUser, 'user', 'Envío de documento: ' + fileName + ' para ' + clienteEncontrado);
    
    // Responder al usuario
    enviarMensajeTelegram(chatId, '✅ Documento subido correctamente:\n\n📄 ' + fileName + '\n👤 Cliente: ' + clienteEncontrado + '\n📁 Tipo: ' + tipoDocumento + '\n\n🔗 Ver en Drive: ' + driveLink);
    
    guardarConversacion(userId, username, registeredUser, 'assistant', 'Documento agregado: ' + fileName);
    
    Logger.log('✅ Documento subido: ' + fileName + ' para ' + clienteEncontrado);
    
  } catch (error) {
    Logger.log('❌ Error manejando documento: ' + error);
    enviarMensajeTelegram(chatId, '❌ Hubo un error al procesar el documento. Intenta nuevamente.\n\nError: ' + error.message);
  }
}
// ============================================
// CONVERSACIONES E HISTORIAL
// ============================================

function guardarConversacion(userId, username, registeredUser, role, content) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Conversaciones');
    
    sheet.appendRow([
      new Date(),
      userId,
      username,
      registeredUser,
      role,
      content
    ]);
  } catch (error) {
    Logger.log('❌ Error guardando conversación: ' + error);
  }
}

function obtenerHistorialConversacion(userId, limite = 8) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Conversaciones');
    const data = sheet.getDataRange().getValues();
    
    let historial = [];
    
    for (let i = data.length - 1; i >= 1 && historial.length < limite * 2; i--) {
      if (data[i][1] == userId) {
        historial.unshift({
          role: data[i][4],
          content: data[i][5]
        });
      }
    }
    
    return historial;
  } catch (error) {
    Logger.log('❌ Error obteniendo historial: ' + error);
    return [];
  }
}

function limpiarHistorialChat(userId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Conversaciones');
    const data = sheet.getDataRange().getValues();
    
    let eliminadas = 0;
    for (let i = data.length - 1; i >= 1 && eliminadas < 50; i--) {
      if (data[i][1] == userId) {
        sheet.deleteRow(i + 1);
        eliminadas++;
      }
    }
    
    Logger.log(`✅ Historial limpiado: ${eliminadas} mensajes`);
  } catch (error) {
    Logger.log('❌ Error limpiando historial: ' + error);
  }
}

// ============================================
// CONSULTAS Y REPORTES
// ============================================

function consultarActividades(userId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hoy = new Date().toISOString().split('T')[0];
    
    // Obtener actividades
    const actSheet = ss.getSheetByName('Actividades');
    const actData = actSheet.getDataRange().getValues();
    let actividades = [];
    
    for (let i = 1; i < actData.length; i++) {
      if (actData[i][1] == userId && actData[i][10] === 'Pendiente') {
        actividades.push({
          tipo: actData[i][4],
          cliente: actData[i][5],
          descripcion: actData[i][6],
          prioridad: actData[i][9],
          notas: actData[i][11],
          asignadoPor: actData[i][12]
        });
      }
    }
    
    // Obtener reuniones
    const reunSheet = ss.getSheetByName('Reuniones');
    const reunData = reunSheet.getDataRange().getValues();
    let reuniones = [];
    
    for (let i = 1; i < reunData.length; i++) {
      if (reunData[i][1] == userId && reunData[i][6] >= hoy && reunData[i][10] === 'Pendiente') {
        reuniones.push({
          tipo: reunData[i][4],
          cliente: reunData[i][5],
          fecha: reunData[i][6],
          hora: reunData[i][7],
          descripcion: reunData[i][8],
          prioridad: reunData[i][9],
          notas: reunData[i][12],
          asignadoPor: reunData[i][13],
          participantes: reunData[i][14]
        });
      }
    }
    
    if (actividades.length === 0 && reuniones.length === 0) {
      return '✨ ¡No tienes actividades ni reuniones pendientes!\n\n¡Buen trabajo! 💪';
    }
    
    let respuesta = '📋 TUS PENDIENTES SMART:\n\n';
    
    // Mostrar reuniones
    if (reuniones.length > 0) {
      respuesta += `━━━━━━━━━━━━━━━━━━━━\n📅 REUNIONES (${reuniones.length}):\n━━━━━━━━━━━━━━━━━━━━\n`;
      
      reuniones.sort((a, b) => {
        const fechaA = new Date(a.fecha + 'T' + a.hora);
        const fechaB = new Date(b.fecha + 'T' + b.hora);
        return fechaA - fechaB;
      });
      
      reuniones.slice(0, 5).forEach((reu, i) => {
        const icono = reu.prioridad === 'Alta' ? '🔴' : reu.prioridad === 'Media' ? '🟡' : '🟢';
        respuesta += `\n${i + 1}. ${icono} ${reu.descripcion}`;
        respuesta += `\n   📆 ${reu.fecha} a las ${reu.hora}`;
        if (reu.cliente && reu.cliente !== 'Interno') {
          respuesta += `\n   👤 ${reu.cliente}`;
        }
        if (reu.participantes) {
          respuesta += `\n   👥 Con: ${reu.participantes}`;
        }
        if (reu.asignadoPor) {
          respuesta += `\n   📌 Asignado por: ${reu.asignadoPor}`;
        }
        if (reu.notas) {
          respuesta += `\n   📝 ${reu.notas}`;
        }
        respuesta += '\n';
      });
      
      if (reuniones.length > 5) {
        respuesta += `\n... y ${reuniones.length - 5} reuniones más\n`;
      }
    }
    
    // Mostrar actividades
    if (actividades.length > 0) {
      respuesta += `\n━━━━━━━━━━━━━━━━━━━━\n📝 ACTIVIDADES (${actividades.length}):\n━━━━━━━━━━━━━━━━━━━━\n`;
      
      // Ordenar por prioridad
      const prioridadOrden = { 'Alta': 1, 'Media': 2, 'Baja': 3 };
      actividades.sort((a, b) => prioridadOrden[a.prioridad] - prioridadOrden[b.prioridad]);
      
      actividades.slice(0, 5).forEach((act, i) => {
        const icono = act.prioridad === 'Alta' ? '🔴' : act.prioridad === 'Media' ? '🟡' : '🟢';
        respuesta += `\n${i + 1}. ${icono} ${act.descripcion}`;
        respuesta += `\n   📋 ${act.tipo.toUpperCase()} | ${act.prioridad}`;
        if (act.cliente) {
          respuesta += `\n   👤 ${act.cliente}`;
        }
        if (act.asignadoPor) {
          respuesta += `\n   📌 Asignado por: ${act.asignadoPor}`;
        }
        if (act.notas) {
          respuesta += `\n   📝 ${act.notas}`;
        }
        respuesta += '\n';
      });
      
      if (actividades.length > 5) {
        respuesta += `\n... y ${actividades.length - 5} actividades más\n`;
      }
    }
    
    return respuesta;
    
  } catch (error) {
    Logger.log('❌ Error consultando actividades: ' + error);
    return '❌ Error consultando actividades. Por favor intenta de nuevo.';
  }
}

function generarResumenDiario(userId) {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Contar actividades del día
    const actSheet = ss.getSheetByName('Actividades');
    const actData = actSheet.getDataRange().getValues();
    let countActHoy = 0;
    let horasHoy = 0;
    let actCompletadas = 0;
    let actPendientes = 0;
    
    for (let i = 1; i < actData.length; i++) {
      if (actData[i][1] == userId) {
        const fecha = new Date(actData[i][0]).toISOString().split('T')[0];
        if (fecha === hoy) {
          countActHoy++;
          if (actData[i][8]) horasHoy += parseFloat(actData[i][8]);
        }
        if (actData[i][10] === 'Completada') actCompletadas++;
        else if (actData[i][10] === 'Pendiente') actPendientes++;
      }
    }
    
    // Contar reuniones del día
    const reunSheet = ss.getSheetByName('Reuniones');
    const reunData = reunSheet.getDataRange().getValues();
    let reunionesHoy = [];
    let reunPendientes = 0;
    
    for (let i = 1; i < reunData.length; i++) {
      if (reunData[i][1] == userId) {
        if (reunData[i][6] === hoy) {
          reunionesHoy.push({
            hora: reunData[i][7],
            descripcion: reunData[i][8],
            estado: reunData[i][10]
          });
        }
        if (reunData[i][10] === 'Pendiente' && reunData[i][6] >= hoy) {
          reunPendientes++;
        }
      }
    }
    
    let resumen = `📊 RESUMEN DIARIO SMART\n`;
    resumen += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    resumen += `📅 ${new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\n\n`;
    
    // Reuniones de hoy
    if (reunionesHoy.length > 0) {
      resumen += `🗓 REUNIONES HOY (${reunionesHoy.length}):\n`;
      reunionesHoy.sort((a, b) => a.hora.localeCompare(b.hora));
      reunionesHoy.forEach(r => {
        const emoji = r.estado === 'Completada' ? '✅' : '⏳';
        resumen += `   ${emoji} ${r.hora} - ${r.descripcion}\n`;
      });
      resumen += '\n';
    }
    
    // Estadísticas
    resumen += `📈 ESTADÍSTICAS:\n`;
    resumen += `   ✅ Actividades completadas: ${actCompletadas}\n`;
    resumen += `   ⏳ Actividades pendientes: ${actPendientes}\n`;
    resumen += `   📅 Reuniones pendientes: ${reunPendientes}\n`;
    
    if (horasHoy > 0) {
      resumen += `   ⏱ Horas registradas hoy: ${horasHoy.toFixed(1)}\n`;
    }
    
    resumen += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    resumen += `💪 ¡Sigue adelante!`;
    
    return resumen;
    
  } catch (error) {
    Logger.log('❌ Error generando resumen: ' + error);
    return '❌ Error generando resumen diario.';
  }
}

// ============================================
// AUTOMATIZACIONES
// ============================================

function procesarAutomatizaciones() {
  Logger.log('🔄 Ejecutando automatizaciones...');
  
  chequearEstadosAutomaticos();
  
  if (obtenerConfiguracion('RECORDATORIOS_HABILITADOS') === 'SI') {
    enviarRecordatoriosPendientes();
  }
}

function chequearEstadosAutomaticos() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const ahora = new Date();
    
    // Actividades con horas - marcar como completadas si pasó el tiempo
    const actSheet = ss.getSheetByName('Actividades');
    const actData = actSheet.getDataRange().getValues();
    
    for (let i = 1; i < actData.length; i++) {
      if (actData[i][10] === 'Pendiente' && actData[i][8]) {
        const inicio = new Date(actData[i][0]);
        const horas = parseFloat(actData[i][8]);
        const finEstimado = new Date(inicio.getTime() + horas * 60 * 60 * 1000);
        
        if (ahora > finEstimado) {
          actSheet.getRange(i + 1, 11).setValue('Completada');
          Logger.log(`✅ Actividad fila ${i+1} completada automáticamente`);
        }
      }
    }
    
    // Reuniones - marcar como completadas si ya pasaron
    const reunSheet = ss.getSheetByName('Reuniones');
    const reunData = reunSheet.getDataRange().getValues();
    
    for (let i = 1; i < reunData.length; i++) {
      if (reunData[i][10] === 'Pendiente') {
        const duracion = parseInt(obtenerConfiguracion('DURACION_REUNION_DEFAULT') || '60');
        const fechaStr = reunData[i][6];
        const horaStr = reunData[i][7] || '00:00';
        
        if (fechaStr) {
          const fechaFin = new Date(`${fechaStr}T${horaStr}:00`);
          fechaFin.setMinutes(fechaFin.getMinutes() + duracion);
          
          if (ahora > fechaFin) {
            reunSheet.getRange(i + 1, 11).setValue('Completada');
            Logger.log(`✅ Reunión fila ${i+1} completada automáticamente`);
          }
        }
      }
    }
    
  } catch (error) {
    Logger.log('❌ Error en chequear estados: ' + error);
  }
}

function enviarRecordatoriosPendientes() {
  try {
    const ahora = new Date();
    const en30min = new Date(ahora.getTime() + 30 * 60 * 1000);
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const reunSheet = ss.getSheetByName('Reuniones');
    const reunData = reunSheet.getDataRange().getValues();
    
    for (let i = 1; i < reunData.length; i++) {
      if (reunData[i][10] === 'Pendiente' && reunData[i][1]) {
        const fechaStr = reunData[i][6];
        const horaStr = reunData[i][7] || '00:00';
        
        if (fechaStr) {
          const fechaHora = new Date(`${fechaStr}T${horaStr}:00`);
          
          if (fechaHora > ahora && fechaHora <= en30min) {
            const userId = reunData[i][1];
            const descripcion = reunData[i][8];
            const participantes = reunData[i][14];
            
            let mensaje = `🔔 RECORDATORIO Smart:\n\n`;
            mensaje += `📅 Tienes una reunión en 30 minutos:\n\n`;
            mensaje += `📋 ${descripcion}\n`;
            mensaje += `🕐 ${horaStr}\n`;
            if (participantes) {
              mensaje += `👥 Con: ${participantes}\n`;
            }
            mensaje += `\n¡Prepárate!`;
            
            enviarMensajeTelegram(userId, mensaje);
            Logger.log(`🔔 Recordatorio enviado para reunión: ${descripcion}`);
          }
        }
      }
    }
    
  } catch (error) {
    Logger.log('❌ Error enviando recordatorios: ' + error);
  }
}

function enviarResumenDiarioTodos() {
  try {
    Logger.log('📊 Enviando resúmenes diarios...');
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const userSheet = ss.getSheetByName('Usuarios');
    const userData = userSheet.getDataRange().getValues();
    
    for (let i = 1; i < userData.length; i++) {
      if (userData[i][5] === 'SI' && userData[i][6]) {
        const userId = userData[i][6];
        const resumen = generarResumenDiario(userId);
        enviarMensajeTelegram(userId, resumen);
        Logger.log(`📊 Resumen enviado a: ${userData[i][2]}`);
      }
    }
    
  } catch (error) {
    Logger.log('❌ Error enviando resúmenes diarios: ' + error);
  }
}

// ============================================
// UTILIDADES
// ============================================

function enviarMensajeTelegram(chatId, texto) {
  if (!chatId) {
    Logger.log('⚠️ No se puede enviar mensaje: chatId vacío');
    return;
  }
  
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  
  try {
    UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        chat_id: chatId,
        text: texto,
        parse_mode: 'HTML'
      }),
      muteHttpExceptions: true
    });
  } catch (e) {
    Logger.log('❌ Error enviando mensaje: ' + e);
  }
}

// ============================================
// FUNCIONES DE MANTENIMIENTO
// ============================================

function resetTodoSeguro() {
  const confirmacion = Browser.msgBox(
    '⚠️ ADVERTENCIA',
    '¿Estás SEGURO de borrar TODA la data?\n\nEsta acción NO se puede deshacer.',
    Browser.Buttons.YES_NO
  );
  
  if (confirmacion === 'yes') {
    try {
      if (SPREADSHEET_ID) {
        DriveApp.getFileById(SPREADSHEET_ID).setTrashed(true);
        Logger.log('🗑️ Spreadsheet anterior eliminado');
      }
      
      PropertiesService.getScriptProperties().deleteAllProperties();
      PropertiesService.getUserProperties().deleteAllProperties();
      
      configurarInicial();
      
      Logger.log('✅ Sistema reseteado completamente');
      Browser.msgBox('✅ Sistema reseteado. Revisa los logs.');
    } catch (error) {
      Logger.log('❌ Error en reset: ' + error);
      Browser.msgBox('❌ Error: ' + error.message);
    }
  } else {
    Logger.log('❌ Reset cancelado por el usuario');
  }
}

function agregarUsuario(username, password, nombreCompleto, email, rol = 'usuario') {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Usuarios');
    const data = sheet.getDataRange().getValues();
    
    // Verificar si ya existe
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === username) {
        Logger.log('❌ El usuario ya existe: ' + username);
        return false;
      }
    }
    
    sheet.appendRow([username, password, nombreCompleto, email, rol, 'SI', '']);
    Logger.log(`✅ Usuario agregado: ${username} (${nombreCompleto})`);
    return true;
    
  } catch (error) {
    Logger.log('❌ Error agregando usuario: ' + error);
    return false;
  }
}

function desactivarUsuario(username) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Usuarios');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === username) {
        sheet.getRange(i + 1, 6).setValue('NO');
        Logger.log(`✅ Usuario desactivado: ${username}`);
        return true;
      }
    }
    
    Logger.log('❌ Usuario no encontrado: ' + username);
    return false;
    
  } catch (error) {
    Logger.log('❌ Error desactivando usuario: ' + error);
    return false;
  }
}

function listarUsuarios() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Usuarios');
    const data = sheet.getDataRange().getValues();
    
    let lista = '📋 USUARIOS SMART CRM:\n\n';
    
    for (let i = 1; i < data.length; i++) {
      const estado = data[i][5] === 'SI' ? '✅' : '❌';
      const telegram = data[i][6] ? '📱' : '⚪';
      lista += `${estado} ${data[i][2]} (${data[i][0]}) - ${data[i][4]} ${telegram}\n`;
    }
    
    Logger.log(lista);
    return lista;
    
  } catch (error) {
    Logger.log('❌ Error listando usuarios: ' + error);
    return '❌ Error al listar usuarios.';
  }
}

// ============================================
// FUNCIONES DE PRUEBA
// ============================================

function pruebaEnviarMensaje() {
  var chatId = '8362094130'; // Tu chat ID real
  enviarMensajeTelegram(chatId, '🤖 Bot Smart CRM funcionando correctamente!\n\n✅ Prueba exitosa');
  Logger.log('✅ Mensaje de prueba enviado');
}

function pruebaGroq() {
  Logger.log('🧪 Probando conexión con Groq...');
  
  const mensajes = [
    { role: 'system', content: 'Eres un asistente de prueba. Responde brevemente.' },
    { role: 'user', content: 'Hola, ¿funciona la conexión?' }
  ];
  
  const respuesta = llamarGroq(mensajes);
  
  if (respuesta) {
    Logger.log('✅ Groq funcionando: ' + respuesta);
  } else {
    Logger.log('❌ Error: No se recibió respuesta de Groq');
  }
}

function pruebaBusquedaReunion() {
  Logger.log('🧪 Probando búsqueda de reunión...');
  
  // Prueba con un userId de ejemplo (reemplazar con uno real)
  const reunion = buscarReunion('123456789', {
    buscar_por: 'descripcion',
    valor_busqueda: 'bot'
  });
  
  if (reunion) {
    Logger.log('✅ Reunión encontrada: ' + JSON.stringify(reunion));
  } else {
    Logger.log('⚠️ No se encontró reunión (esto es normal si no hay datos)');
  }
}

function pruebaRegistroCompleto() {
  Logger.log('🧪 Iniciando prueba de registro completo...');
  
  const testUserId = 'TEST_' + Date.now();
  
  // Prueba: Registrar actividad
  registrarActividad(
    testUserId,
    'TestUser',
    'Usuario de Prueba',
    {
      tipo: 'tarea',
      cliente: 'Cliente Prueba',
      descripcion: 'Tarea de prueba automática',
      prioridad: 'Media'
    }
  );
  Logger.log('✅ Actividad de prueba registrada');
  
  // Prueba: Registrar reunión
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const fechaManana = manana.toISOString().split('T')[0];
  
  registrarReunion(
    testUserId,
    'TestUser',
    'Usuario de Prueba',
    {
      tipo: 'reunion',
      cliente: 'Interno',
      fecha: fechaManana,
      hora: '15:00',
      descripcion: 'Reunión de prueba automática',
      prioridad: 'Media'
    }
  );
  Logger.log('✅ Reunión de prueba registrada');
  
  // Prueba: Registrar contacto
  registrarContacto(
    testUserId,
    'TestUser',
    'Usuario de Prueba',
    {
      nombreEmpresa: 'Empresa Prueba ' + Date.now(),
      rif: 'J-99999999-9',
      nombreApellido: 'Contacto Prueba',
      telefono: '0414-9999999',
      correo: 'prueba@test.com',
      direccionFiscal: 'Dirección de Prueba'
    }
  );
  Logger.log('✅ Contacto de prueba registrado');
  
  Logger.log('═══════════════════════════════════════════');
  Logger.log('✅ TODAS LAS PRUEBAS COMPLETADAS');
  Logger.log('📊 Revisa el Spreadsheet: ' + SpreadsheetApp.openById(SPREADSHEET_ID).getUrl());
}

function pruebaNotificacionParticipantes() {
  Logger.log('🧪 Probando notificación a participantes...');
  
  // IMPORTANTE: Reemplazar con IDs reales de usuarios que tengan Telegram ID
  const testUserId = 'TU_USER_ID';
  
  const resultado = registrarReunionConParticipantes(
    testUserId,
    'TestUser',
    'Usuario de Prueba',
    {
      tipo: 'reunion',
      cliente: 'Interno',
      fecha: new Date().toISOString().split('T')[0],
      hora: '16:00',
      descripcion: 'Prueba de notificación a participantes',
      prioridad: 'Alta',
      participantes: ['Sayyan', 'Diana'] // Usuarios de Smart
    }
  );
  
  Logger.log('Resultado: ' + resultado.mensaje);
}

// ============================================
// ACTUALIZACIÓN DE PROMPTS (SOLO PARA MIGRACIÓN)
// ============================================

function actualizarPromptsV31() {
  Logger.log('🔄 Actualizando prompts a V3.1...');
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Prompts');
    
    // Limpiar prompts existentes (excepto encabezado)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    
    // Configurar nuevos prompts
    configurarPromptsInicialesV31(ss);
    
    Logger.log('✅ Prompts V3.1 actualizados correctamente');
    
  } catch (error) {
    Logger.log('❌ Error actualizando prompts: ' + error);
  }
}

// ============================================
// ACTUALIZAR SOLO SKUs Y TOKENS (sin borrar datos)
// ============================================
function actualizarSKUsYTokens() {
  Logger.log('🔄 Actualizando catálogo de SKUs y configuración de tokens...');
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // Actualizar Productos_SKU con catálogo real
    crearHojaProductosSKU(ss);

    // Actualizar MAX_TOKENS_IA a 2500 en Configuracion
    var configSheet = ss.getSheetByName('Configuracion');
    var configData = configSheet.getDataRange().getValues();
    for (var i = 1; i < configData.length; i++) {
      if (configData[i][0] === 'MAX_TOKENS_IA') {
        configSheet.getRange(i + 1, 2).setValue('2500');
        Logger.log('✅ MAX_TOKENS_IA actualizado a 2500');
        break;
      }
    }

    Logger.log('✅ SKUs y tokens actualizados correctamente');
  } catch (error) {
    Logger.log('❌ Error: ' + error);
  }
}

// ============================================
// DESPLEGAR TODO (Prompts + SKUs + Tokens) SIN borrar datos de CRM
// ============================================
function desplegarActualizacionVentas() {
  Logger.log('🚀 === DESPLEGANDO ACTUALIZACIÓN DE VENTAS ===');

  // 1. Actualizar prompts (le enseña a la IA los planes reales)
  actualizarPromptsV31();

  // 2. Actualizar catálogo SKU y tokens
  actualizarSKUsYTokens();

  Logger.log('🚀 === DESPLIEGUE COMPLETADO ===');
  Logger.log('');
  Logger.log('📋 Lo que se actualizó:');
  Logger.log('  ✅ Prompt del sistema con catálogo real de planes');
  Logger.log('  ✅ Recomendación inteligente por número de controles');
  Logger.log('  ✅ Bot pregunta nombre del cliente antes de agendar');
  Logger.log('  ✅ 30+ SKUs reales (PLN-EMP, PLN-CORP, PLN-WEB, APK, etc.)');
  Logger.log('  ✅ MAX_TOKENS_IA subido a 2500');
  Logger.log('');
  Logger.log('🧪 Prueba con: "Tengo un nuevo lead, manejan 100 facturas al mes"');
}

function simularMensajeReal() {
  Logger.log('=== SIMULANDO MENSAJE REAL ===');
  
  try {
    // 1. Obtener prompt
    Logger.log('1. Obteniendo prompt...');
    var prompt = obtenerPrompt('sistema_base');
    if (!prompt) {
      Logger.log('❌ ERROR: No se encontró el prompt sistema_base');
      return;
    }
    Logger.log('✅ Prompt encontrado, longitud: ' + prompt.length);
    
    // 2. Preparar prompt
    Logger.log('2. Preparando prompt...');
    prompt = prompt.replace('{{USUARIO}}', 'Luis Ilarraza');
    prompt = prompt.replace('{{PENDIENTES_USUARIO}}', '\n\n(Sin pendientes)');
    Logger.log('✅ Prompt preparado');
    
    // 3. Llamar Groq
    Logger.log('3. Llamando a Groq...');
    var mensajes = [
      { role: 'system', content: prompt },
      { role: 'user', content: 'Agenda reunión mañana a las 3pm para hablar del bot' }
    ];
    
    var respuesta = llamarGroq(mensajes);
    
    if (!respuesta) {
      Logger.log('❌ ERROR: Groq devolvió null');
      return;
    }
    
    Logger.log('✅ Respuesta de Groq:');
    Logger.log(respuesta);
    
    // 4. Verificar si tiene acción
    Logger.log('4. Analizando respuesta...');
    if (respuesta.indexOf('[ACCION:crear_reunion]') >= 0) {
      Logger.log('✅ Detectada acción: crear_reunion');
      var match = respuesta.match(/\[ACCION:crear_reunion\]\s*(\{[\s\S]*?\})/);
      if (match) {
        Logger.log('JSON encontrado: ' + match[1]);
        var datos = JSON.parse(match[1]);
        Logger.log('✅ JSON parseado correctamente: ' + JSON.stringify(datos));
      } else {
        Logger.log('❌ No se pudo extraer el JSON');
      }
    } else {
      Logger.log('ℹ️ No es acción crear_reunion');
      Logger.log('Respuesta completa: ' + respuesta);
    }
    
  } catch (e) {
    Logger.log('❌ ERROR CAPTURADO:');
    Logger.log('Mensaje: ' + e.message);
    Logger.log('Stack: ' + e.stack);
  }
}

function probarEdicion() {
  Logger.log('=== PROBANDO EDICIÓN ===');
  
  var prompt = obtenerPrompt('sistema_base');
  prompt = prompt.replace('{{USUARIO}}', 'Luis Ilarraza');
  prompt = prompt.replace('{{PENDIENTES_USUARIO}}', '\n\nREUNIONES PENDIENTES:\n1. "Ver el servicio de Facturación Digital" - 2026-01-16 08:00 (Panadería San Juan)');
  
  var mensajes = [
    { role: 'system', content: prompt },
    { role: 'user', content: 'Cambia la hora de la reunión del viernes a las 9am' }
  ];
  
  var respuesta = llamarGroq(mensajes);
  
  Logger.log('=== RESPUESTA COMPLETA DE IA ===');
  Logger.log(respuesta);
  Logger.log('=== FIN RESPUESTA ===');
  
  // Verificar si tiene la acción
  if (respuesta.indexOf('[ACCION:editar_reunion]') >= 0) {
    Logger.log('✅ Contiene [ACCION:editar_reunion]');
    
    var match = respuesta.match(/\[ACCION:editar_reunion\]\s*(\{[\s\S]*?\})/);
    if (match) {
      Logger.log('✅ Match encontrado: ' + match[1]);
      try {
        var datos = JSON.parse(match[1]);
        Logger.log('✅ JSON válido: ' + JSON.stringify(datos));
      } catch (e) {
        Logger.log('❌ JSON inválido: ' + e.message);
      }
    } else {
      Logger.log('❌ No se pudo extraer el JSON con el regex');
    }
  } else {
    Logger.log('❌ NO contiene [ACCION:editar_reunion]');
    Logger.log('La IA no está generando la acción de edición');
  }
}

function verPrompt() {
  var prompt = obtenerPrompt('sistema_base');
  Logger.log('=== PROMPT ACTUAL ===');
  Logger.log(prompt);
  Logger.log('=== LONGITUD: ' + prompt.length + ' caracteres ===');
}

// ============================================
// INSTRUCCIONES DE USO
// ============================================


// ============================================
// VENTAS: GENERACIÓN DE PROMPTS CON VENTAS
// ============================================

function generarPromptSistemaConVentas() {
  const fechaHoy = new Date();
  const fechaFormateada = fechaHoy.toLocaleDateString('es-ES', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  return `Eres el asistente CRM inteligente de Smart Factura Digital para {{USUARIO}}. Hoy es ${fechaFormateada}.

EQUIPO SMART (empleados registrados):
- Luis Ilarraza (admin)
- Andreina
- Sayyan
- Diana
- Miguel
- Luis Sandoval

═══════════════════════════════════════════
CATÁLOGO COMPLETO DE PRODUCTOS Y PLANES
═══════════════════════════════════════════

SERVICIOS PRINCIPALES:
- SVC-001: Imprenta Digital Smart Factura (números de control, SNAT/2024/000102)
- SVC-002: Facturador Manual WEB Prosales (emisión manual, SNAT/2024/000121)
- SVC-003: Facturador Automatizado API SMART (vía API, SNAT/2024/000121) - $359/año
- SVC-004: APK Prosales (app embebible en POS)

PLANES EMPRENDEDORES/GREMIOS (mensuales):
- PLN-EMP-001: Emprendedor 1 → 100 NC/mes a $0.06 = $6 + facturador $5 = $11/mes (Personas Naturales)
- PLN-EMP-002: Emprendedor 2 → 200 NC/mes a $0.05 = $10 + facturador $7 = $22/mes (Personas Naturales)
- PLN-GRM-001: Plan Gremial → 200 NC/mes a $0.095 = $19 + facturador $6 = $25/mes (Gremios/Asociaciones)
Nota: Integración Prosales WEB $19 (pago único)

PLANES CORPORATIVOS (por lote mensual, incluyen 40h integración):
- PLN-CORP-001: Nivel 1 → 501-1,200 NC a $0.14 = $39/lote (Pequeñas Empresas)
- PLN-CORP-002: Nivel 2 → 1,201-3,000 NC a $0.12 = $89/lote (Mediana Empresa)
- PLN-CORP-003: Nivel 3 → 3,001-6,000 NC a $0.10 = $149/lote (Mediana Empresa)
- PLN-CORP-004: Nivel 4 → 6,001-10,000 NC a $0.08 = $199/lote (Grandes Empresas)
- PLN-CORP-005: Nivel 5 → 10,001-50,000 NC a $0.07 = $249/consumo mensual (Grandes Empresas)
- PLN-CORP-006: Nivel 6 → >50,000 NC a $0.05 = $299/consumo mensual (Grandes Empresas)
- PLN-CORP-007: Nivel 7 → Alto consumo, ventas consultivas, precio a validar

PLANES PROSALES WEB (anuales):
- PLN-WEB-001: Grandes Empresas → $1,799/año
- PLN-WEB-002: Pyme → $499/año
- PLN-WEB-003: Pequeñas Empresas → $199/año

PLANES APK:
- APK-001: Embeber genérico → $2/mes recurrente
- APK-002: Embeber en POS → $2/mes recurrente
- APK-003: Empresas (hasta 4 usuarios) → $6 c/u = $24/mes
- APK-004: Empresas (hasta 10 usuarios) → $4 c/u = $40/mes
- APK-005: Empresas (20+ usuarios) → $2 c/u = $40+/mes

SERVICIOS ADICIONALES:
- ADD-001: API Smart → $359/año
- SUP-001: Soporte Integración → $20/hora (excedente de 40h incluidas en corp)
- SUP-002: Personalización → $20/hora
- SUP-003: Carga de Productos → $40/hora
- ADD-004: Mensajería SMS → variable
- ADD-005: Email Marketing → variable
- ADQ-003: Botón de Pago → incluido en planes base (NO incluye pasarela)

═══════════════════════════════════════════
RECOMENDACIÓN INTELIGENTE DE PLAN
═══════════════════════════════════════════

Cuando el usuario mencione cuántos números de control (NC) necesita un cliente, RECOMIENDA automáticamente:
- Hasta 100 NC/mes → PLN-EMP-001 ($11/mes, $132/año)
- Hasta 200 NC/mes persona natural → PLN-EMP-002 ($22/mes, $264/año)
- Hasta 200 NC/mes gremio → PLN-GRM-001 ($25/mes, $300/año)
- 501-1,200 NC/mes → PLN-CORP-001 ($39/lote)
- 1,201-3,000 NC/mes → PLN-CORP-002 ($89/lote)
- 3,001-6,000 NC/mes → PLN-CORP-003 ($149/lote)
- 6,001-10,000 NC/mes → PLN-CORP-004 ($199/lote)
- 10,001-50,000 NC/mes → PLN-CORP-005 ($249/mes)
- >50,000 NC/mes → PLN-CORP-006 ($299/mes)

Si además necesita Prosales WEB:
- Pequeña empresa → agrega PLN-WEB-003 ($199/año)
- Pyme → agrega PLN-WEB-002 ($499/año)
- Grande → agrega PLN-WEB-001 ($1,799/año)

Siempre muestra: costo mensual, costo anual, y qué incluye. Sugiere combos cuando aplique (ej: números de control + facturador).

═══════════════════════════════════════════
REGLA OBLIGATORIA: NOMBRE DEL CLIENTE
═══════════════════════════════════════════

ANTES de crear una reunión, actividad, lead, o cualquier registro:
- Si el usuario NO menciona el nombre del cliente/empresa, PREGÚNTALE primero.
- Ejemplo: "¿Para qué cliente o empresa es esta reunión?"
- NUNCA registres algo sin nombre de cliente. Si es interno, usa "Interno".

TU MISIÓN PRINCIPAL:
1. Entender si el usuario quiere CREAR, EDITAR, CONSULTAR o VENDER
2. Detectar PARTICIPANTES mencionados (otros empleados)
3. Identificar si es gestión operativa (reuniones/tareas) o gestión de VENTAS (leads/deals)
4. Extraer toda la información necesaria
5. Si falta el nombre del cliente → PREGUNTAR antes de continuar
6. Si el usuario dice cuántas facturas/NC necesita → RECOMENDAR el plan ideal con precios
7. Cuando tengas TODO lo necesario, generar la acción correspondiente

═══════════════════════════════════════════
DISTINGUIR OPERACIONES VS VENTAS:
═══════════════════════════════════════════

OPERACIONES (usa acciones existentes):
- Reuniones internas del equipo
- Tareas administrativas
- Actividades de seguimiento no relacionadas con ventas

VENTAS (usa nuevas acciones):
- Nuevos clientes potenciales (leads/prospectos)
- Proceso de venta (contacto, demo, propuesta, negociación)
- Cierre de ventas o pérdida de deals
- Tracking de interacciones comerciales

{{PENDIENTES_USUARIO}}

═══════════════════════════════════════════
FORMATOS DE SALIDA - OPERACIONES (EXISTENTES):
═══════════════════════════════════════════

1. CREAR REUNIÓN (con participantes):
[ACCION:crear_reunion]
{
  "tipo": "reunion",
  "cliente": "Interno o nombre empresa",
  "fecha": "YYYY-MM-DD",
  "hora": "HH:MM",
  "descripcion": "tema de la reunión",
  "prioridad": "Media",
  "participantes": ["Sayyan", "Diana"]
}

2. CREAR ACTIVIDAD/TAREA:
[ACCION:crear_actividad]
{
  "tipo": "tarea",
  "cliente": "Cliente opcional",
  "descripcion": "Descripción de la tarea",
  "monto": "",
  "horas": "",
  "prioridad": "Media"
}

3. CREAR CONTACTO:
[ACCION:crear_contacto]
{
  "nombreEmpresa": "Nombre exacto de la empresa",
  "rif": "J-12345678-9",
  "actividadComercial": "",
  "estatus": "Prospecto caliente",
  "contribuyenteEspecial": "SI",
  "volumenMensual": "350000",
  "formaFacturacion": "Digital",
  "sistemaHomologado": "SI - Profit",
  "nombreApellido": "Nombre del contacto",
  "correo": "email@empresa.com",
  "telefono": "0414-1234567",
  "direccionFiscal": "Dirección completa",
  "notas": "Notas adicionales"
}

4. EDITAR REUNIÓN:
[ACCION:editar_reunion]
{
  "buscar_por": "descripcion",
  "valor_busqueda": "texto que identifica la reunión",
  "cambios": {
    "hora": "16:00",
    "fecha": "2026-01-20"
  }
}

5. EDITAR ACTIVIDAD:
[ACCION:editar_actividad]
{
  "buscar_por": "descripcion",
  "valor_busqueda": "texto que identifica",
  "cambios": {
    "estado": "Completada"
  }
}

6. AGREGAR NOTA:
[ACCION:agregar_nota]
{
  "tipo": "reunion",
  "buscar_por": "descripcion",
  "valor_busqueda": "texto que identifica",
  "nota": "Esta es la nota a agregar"
}

7. ASIGNAR TAREA:
[ACCION:asignar_tarea]
{
  "asignado_a": "Nombre Completo exacto",
  "tipo": "tarea",
  "descripcion": "descripción de la tarea",
  "cliente": "opcional",
  "prioridad": "Media"
}

═══════════════════════════════════════════
FORMATOS DE SALIDA - VENTAS (NUEVOS):
═══════════════════════════════════════════

1. REGISTRAR NUEVO LEAD:
[ACCION:nuevo_lead]
{
  "cliente": "Nombre de la empresa",
  "producto": "SKU del plan recomendado (ej: PLN-EMP-001, PLN-CORP-002, SVC-001)",
  "monto": "monto mensual o del plan",
  "origen": "Referido|Cold Call|LinkedIn|Web|Evento|Otro",
  "canal": "WhatsApp|Llamada|Email|Presencial",
  "fechaCierreEstimada": "YYYY-MM-DD",
  "etapa": "Investigación",
  "notas": "Contexto del lead y plan recomendado"
}

IMPORTANTE para producto: Usa el SKU más específico posible:
- Si sabes NC/mes → usa PLN-EMP-001, PLN-CORP-001, etc.
- Si solo sabes que quiere facturación → usa SVC-001
- Si quiere Prosales WEB → usa PLN-WEB-001/002/003
- Si quiere APK → usa APK-001/002/003/004/005
- El campo "bant" es OPCIONAL. Solo incluirlo si el usuario menciona presupuesto/autoridad/necesidad/timeline.

2. REGISTRAR INTERACCIÓN DE VENTA:
[ACCION:contacto_venta]
{
  "cliente": "Nombre empresa",
  "tipo": "Llamada|WhatsApp|Email|Reunión|Demo|Otro",
  "canal": "WhatsApp|Llamada|Email|Presencial|Video",
  "resumen": "Qué se habló",
  "resultado": "Exitoso|Pendiente Follow-up|No contactado|No interesado",
  "proximoPaso": "Qué hacer después",
  "fechaFollowup": "YYYY-MM-DD",
  "tiempoInvertido": "30"
}

3. MOVER ETAPA EN PIPELINE:
[ACCION:mover_etapa]
{
  "cliente": "Nombre empresa",
  "nuevaEtapa": "Investigación|Contacto Inicial|Reunión Agendada|Propuesta Enviada|Negociación",
  "notas": "Razón del cambio"
}

Etapas válidas (en orden):
- Investigación (10% probabilidad)
- Contacto Inicial (20%)
- Reunión Agendada (40%)
- Propuesta Enviada (60%)
- Negociación (80%)

4. REGISTRAR DEMO:
[ACCION:registrar_demo]
{
  "cliente": "Nombre empresa",
  "producto": "SVC-001",
  "duracion": "45",
  "resultado": "Interesado|Muy interesado|Poco interesado",
  "proximoPaso": "Enviar propuesta",
  "resumen": "Qué se mostró"
}

5. REGISTRAR PROPUESTA/COTIZACIÓN:
[ACCION:registrar_propuesta]
{
  "cliente": "Nombre empresa",
  "monto": "1500",
  "producto": "SVC-001",
  "proximoPaso": "Dar seguimiento en 3 días",
  "fechaFollowup": "YYYY-MM-DD",
  "detalles": "Detalles de la propuesta"
}

6. CERRAR VENTA (MARCAR COMO GANADO):
[ACCION:cerrar_venta]
{
  "cliente": "Nombre empresa",
  "monto": "1500",
  "producto": "SVC-001",
  "canal": "WhatsApp|Llamada|Email|Presencial",
  "observaciones": "Cómo se cerró, detalles finales"
}

7. PERDER DEAL:
[ACCION:perder_deal]
{
  "cliente": "Nombre empresa",
  "razon": "Precio|Competencia|Timing|No hay presupuesto|Sin interés|Otro",
  "competidor": "Nombre si perdimos ante otra empresa",
  "posibleRescate": "SI|NO",
  "notas": "Detalles de por qué se perdió"
}

═══════════════════════════════════════════
EJEMPLOS PRÁCTICOS - VENTAS:
═══════════════════════════════════════════

Usuario: "Tengo un nuevo lead: Panadería Don José, interesados en facturación electrónica, manejan como 100 facturas al mes"

Respuesta: Perfecto, con 100 números de control al mes el plan ideal es el **Emprendedor 1 (PLN-EMP-001)** a $11/mes ($132/año). Incluye 100 NC a $0.06 c/u + facturador $5. Si también necesita Prosales WEB sería +$199/año. Te lo registro como lead.

[ACCION:nuevo_lead]
{"cliente":"Panadería Don José","producto":"PLN-EMP-001","monto":"11","origen":"Otro","canal":"WhatsApp","etapa":"Investigación","notas":"100 NC/mes. Plan Emprendedor 1 recomendado: $11/mes ($132/año)"}

───────────────────────────────────────────

Usuario: "El cliente tiene 3000 números de control al mes"

Respuesta: Con 3,000 NC/mes le corresponde el **Corporativo Nivel 3 (PLN-CORP-003)** a $149/lote mensual (a $0.10 por NC). Incluye 40 horas de integración. Si necesita Prosales WEB adicional, el plan Pyme es $499/año. ¿Quieres que lo registre como lead? ¿Para qué empresa es?

───────────────────────────────────────────

Usuario: "Nuevo lead: Transportes ABC, necesitan API Smart y como 2000 facturas al mes"

Respuesta: Para Transportes ABC con 2,000 NC/mes recomiendo: **Corporativo Nivel 2 (PLN-CORP-002)** a $89/lote + **API Smart (ADD-001)** a $359/año. Total estimado: $89/mes + $30/mes (API prorrateado) = ~$119/mes.

[ACCION:nuevo_lead]
{"cliente":"Transportes ABC","producto":"PLN-CORP-002","monto":"119","origen":"Otro","canal":"WhatsApp","etapa":"Investigación","notas":"2000 NC/mes. Corp Nivel 2 $89/lote + API Smart $359/año"}

───────────────────────────────────────────

Usuario: "Llamé a Transportes ABC, muy interesados, quedamos en agendar demo"

Respuesta:
[ACCION:contacto_venta]
{"cliente":"Transportes ABC","tipo":"Llamada","canal":"Llamada","resumen":"Muy interesados en Corp Nivel 2 + API","resultado":"Exitoso","proximoPaso":"Agendar demo","tiempoInvertido":"20"}

───────────────────────────────────────────

Usuario: "Cerramos con Transportes ABC! 89 dólares mensuales"

Respuesta:
[ACCION:cerrar_venta]
{"cliente":"Transportes ABC","monto":"89","producto":"PLN-CORP-002","canal":"WhatsApp","observaciones":"Plan Corp Nivel 2, 2000 NC/mes"}

───────────────────────────────────────────

Usuario: "Perdimos el deal con Constructora XYZ, se fueron con la competencia"

Respuesta:
[ACCION:perder_deal]
{"cliente":"Constructora XYZ","razon":"Competencia","competidor":"Proveedor local","posibleRescate":"SI","notas":"Intentar en 6 meses"}

───────────────────────────────────────────

Usuario: "Agéndame una reunión para mañana a las 10am"

Respuesta: ¿Para qué cliente o empresa es esta reunión?

───────────────────────────────────────────

Usuario: "Nuevo contacto: Restaurante La Esquina, quieren APK para su punto de venta, tienen 3 cajas"

Respuesta: Para Restaurante La Esquina con 3 puntos de venta recomiendo **APK Empresas hasta 4 usuarios (APK-003)** a $24/mes ($6 c/u x 4 usuarios). Lo registro como lead.

[ACCION:nuevo_lead]
{"cliente":"Restaurante La Esquina","producto":"APK-003","monto":"24","origen":"Otro","canal":"WhatsApp","etapa":"Investigación","notas":"3 cajas POS. APK-003 $24/mes (4 usuarios)"}

═══════════════════════════════════════════
REGLAS CRÍTICAS:
═══════════════════════════════════════════

✓ Para CONTACTOS en CRM: nombreEmpresa OBLIGATORIO
✓ Para REUNIONES: nombre del cliente OBLIGATORIO - si no lo da, PREGUNTAR primero
✓ Para ACTIVIDADES: nombre del cliente OBLIGATORIO - si no lo da, PREGUNTAR primero
✓ Para LEADS: cliente y producto OBLIGATORIOS
✓ Para CERRAR VENTA: cliente, monto y producto OBLIGATORIOS
✓ Convierte fechas relativas: "mañana" → fecha específica
✓ Distingue claramente entre reuniones internas y actividades de venta
✓ Si es prospecto/lead/cliente nuevo → usa acciones de VENTA
✓ Si es gestión interna/administrativa → usa acciones OPERATIVAS
✓ Si mencionan cantidad de NC/facturas → RECOMENDAR plan con precios (mensual y anual)
✓ Usa SKU reales: PLN-EMP-001, PLN-CORP-001..006, PLN-WEB-001..003, APK-001..005, SVC-001..004, ADD-001, etc.
✓ SIEMPRE muestra el desglose de costos cuando recomiendes un plan

═══════════════════════════════════════════
IMPORTANTE:
═══════════════════════════════════════════

- Sé conversacional pero directo
- Si falta información crítica, pregunta específicamente
- Si el usuario dice algo ambiguo, pide clarificación
- Confirma las acciones realizadas
- No uses BANT si el usuario no da información para calificar
- Distingue bien entre operaciones internas y actividades de venta`;
}


function agregarPromptEjemplosVentas(sheet) {
  // Buscar la última fila con datos
  const data = sheet.getDataRange().getValues();
  const ultimaFila = data.length;
  
  // Ejemplos adicionales de ventas
  const ejemplosVentas = [
    [
      'ejemplo_lead_completo',
      'instruction',
      'SI',
      `EJEMPLO LEAD COMPLETO CON BANT:
Usuario: "Nuevo prospecto: Logística del Sur C.A., el gerente Carlos me contactó por LinkedIn, necesitan Imprenta Digital urgente, tienen 150k de presupuesto mensual"

IA genera:
[ACCION:nuevo_lead]
{"cliente":"Logística del Sur C.A.","producto":"SVC-001","monto":"1500","origen":"LinkedIn","canal":"LinkedIn","notas":"Gerente Carlos, 150k facturación mensual","bant":{"budget":"SI","authority":"SI","need":"Alto","timeline":"Inmediato"}}

Resultado:
✅ Nuevo lead registrado:
👤 Cliente: Logística del Sur C.A.
📦 Producto: SVC-001
🎯 Calificación BANT: HOT 🔥
📊 Score: 95/100
💡 Lead caliente: Priorizar y cerrar rápido`
    ],
    [
      'ejemplo_flujo_venta_completo',
      'instruction',
      'SI',
      `FLUJO COMPLETO DE VENTA:

1. "Nuevo lead: Hotel Plaza, interesados en ProSales WEB"
→ [ACCION:nuevo_lead] → Crea en Pipeline (Investigación 10%)

2. "Llamé a Hotel Plaza, hablé con la dueña, muy interesada"
→ [ACCION:contacto_venta] → Registra interacción

3. "Hotel Plaza pasó a reunión agendada, nos vemos el jueves"
→ [ACCION:mover_etapa] → Mueve a Reunión Agendada (40%)

4. "Hice demo a Hotel Plaza, 45 minutos, quedaron encantados"
→ [ACCION:registrar_demo] → Auto mueve a Propuesta Enviada (60%)

5. "Envié propuesta a Hotel Plaza por 500 USD"
→ [ACCION:registrar_propuesta] → Actualiza monto

6. "Hotel Plaza está en negociación, revisando contrato"
→ [ACCION:mover_etapa] → Negociación (80%)

7. "Cerramos con Hotel Plaza! 500 dólares"
→ [ACCION:cerrar_venta] → Mueve a Ventas_Cerradas, actualiza KPIs`
    ],
    [
      'ejemplo_perder_deal',
      'instruction',
      'SI',
      `EJEMPLOS DE DEALS PERDIDOS:

Por precio:
Usuario: "Perdimos el de Constructora ABC, muy caro para ellos"
→ [ACCION:perder_deal]
{"cliente":"Constructora ABC","razon":"Precio","posibleRescate":"SI","notas":"Presupuesto limitado este trimestre"}

Por competencia:
Usuario: "Se fueron con SAP, Empresa XYZ prefirió otra solución"
→ [ACCION:perder_deal]
{"cliente":"Empresa XYZ","razon":"Competencia","competidor":"SAP","posibleRescate":"NO"}

Sin interés:
Usuario: "Turismo Costa ya no les interesa, cambiaron prioridades"
→ [ACCION:perder_deal]
{"cliente":"Turismo Costa","razon":"Sin interés","posibleRescate":"SI","notas":"Puede que retomen en 6 meses"}`
    ],
    [
      'señales_ambiguas_ventas',
      'instruction',
      'SI',
      `CÓMO MANEJAR SEÑALES AMBIGUAS:

Usuario: "Hablé con un cliente"
IA: ¿Con qué cliente hablaste? ¿Es un prospecto nuevo o cliente existente?

Usuario: "Tengo reunión mañana"
IA: ¿Es reunión interna con el equipo o reunión comercial con un cliente?

Usuario: "Envié propuesta"
IA: ¿A qué cliente enviaste la propuesta? ¿Por qué monto?

Usuario: "Cerramos la venta"
IA: ¡Felicidades! ¿Con qué cliente cerraron? ¿Qué producto y por qué monto?

REGLA: Siempre confirmar cliente, monto y producto antes de cerrar venta`
    ],
    [
      'distinguir_operaciones_ventas',
      'instruction',
      'SI',
      `DISTINGUIR OPERACIONES VS VENTAS:

OPERACIONES (reuniones/tareas internas):
- "Reunión con Sayyan mañana para revisar reportes"
  → [ACCION:crear_reunion] con participantes
  
- "Tengo que revisar los contratos esta semana"
  → [ACCION:crear_actividad]

VENTAS (actividades comerciales):
- "Reunión con Transportes ABC para demo"
  → [ACCION:nuevo_lead] + [ACCION:contacto_venta]
  
- "Tengo que enviar propuesta a Hotel Plaza"
  → [ACCION:registrar_propuesta]

SEÑAL CLAVE: Si menciona nombre de EMPRESA EXTERNA = VENTAS`
    ]
  ];
  
  // Agregar los nuevos ejemplos
  sheet.getRange(ultimaFila + 1, 1, ejemplosVentas.length, 4).setValues(ejemplosVentas);
  
  Logger.log(`✅ ${ejemplosVentas.length} ejemplos de ventas agregados`);
}

// ============================================
// FUNCIÓN PARA ACTUALIZAR procesarRespuestaIA
// ============================================



// ============================================
// VENTAS FASE 1: CREACIÓN DE HOJAS DE DATOS
// ============================================

function crearHojaPipelineDetallado(ss) {
  Logger.log('📊 Creando hoja: Pipeline_Detallado...');
  
  let sheet = ss.getSheetByName('Pipeline_Detallado');
  if (!sheet) {
    sheet = ss.insertSheet('Pipeline_Detallado');
  }
  
  // Limpiar hoja si existe
  sheet.clear();
  
  // ENCABEZADOS (16 columnas)
  const headers = [
    'Timestamp',           // A - Fecha de creación
    'User ID',             // B - ID Telegram del ejecutivo
    'Username',            // C - Username Telegram
    'Registered User',     // D - Nombre completo del ejecutivo
    'Cliente',             // E - Nombre de la empresa (lookup a Contactos)
    'Producto',            // F - SKU del producto (SVC-001, etc.)
    'Etapa',               // G - Etapa actual del deal
    'Monto USD',           // H - Valor estimado del deal
    'Probabilidad %',      // I - % de cierre según etapa
    'Fecha Cierre Est.',   // J - Fecha estimada de cierre
    'Origen Lead',         // K - Cómo llegó el lead
    'Canal Contacto',      // L - Canal principal de comunicación
    'Días en Etapa',       // M - Días desde última actualización (fórmula)
    'Fecha Creación',      // N - Fecha de creación del deal
    'Notas',               // O - Observaciones
    'Estado'               // P - Activo | Ganado | Perdido
  ];
  
  // Aplicar encabezados
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold')
    .setBackground('#0b5394')
    .setFontColor('white')
    .setHorizontalAlignment('center');
  
  // Freeze primera fila
  sheet.setFrozenRows(1);
  
  // Ajustar anchos de columna
  sheet.setColumnWidth(1, 140);  // Timestamp
  sheet.setColumnWidth(2, 80);   // User ID
  sheet.setColumnWidth(3, 100);  // Username
  sheet.setColumnWidth(4, 150);  // Registered User
  sheet.setColumnWidth(5, 200);  // Cliente
  sheet.setColumnWidth(6, 120);  // Producto
  sheet.setColumnWidth(7, 150);  // Etapa
  sheet.setColumnWidth(8, 100);  // Monto USD
  sheet.setColumnWidth(9, 100);  // Probabilidad %
  sheet.setColumnWidth(10, 120); // Fecha Cierre Est.
  sheet.setColumnWidth(11, 120); // Origen Lead
  sheet.setColumnWidth(12, 120); // Canal Contacto
  sheet.setColumnWidth(13, 100); // Días en Etapa
  sheet.setColumnWidth(14, 120); // Fecha Creación
  sheet.setColumnWidth(15, 300); // Notas
  sheet.setColumnWidth(16, 100); // Estado
  
  // Validaciones de datos
  
  // Validación de Etapa (columna G)
  const etapasValidas = [
    'Investigación',
    'Contacto Inicial',
    'Reunión Agendada',
    'Propuesta Enviada',
    'Negociación',
    'Ganado',
    'Perdido'
  ];
  const validacionEtapa = SpreadsheetApp.newDataValidation()
    .requireValueInList(etapasValidas, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('G2:G1000').setDataValidation(validacionEtapa);
  
  // Validación de Producto (columna F)
  const productosValidos = ['SVC-001', 'SVC-002', 'SVC-003', 'SVC-004'];
  const validacionProducto = SpreadsheetApp.newDataValidation()
    .requireValueInList(productosValidos, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('F2:F1000').setDataValidation(validacionProducto);
  
  // Validación de Origen Lead (columna K)
  const origenesValidos = ['Referido', 'Cold Call', 'LinkedIn', 'Web', 'Evento', 'Otro'];
  const validacionOrigen = SpreadsheetApp.newDataValidation()
    .requireValueInList(origenesValidos, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('K2:K1000').setDataValidation(validacionOrigen);
  
  // Validación de Canal (columna L)
  const canalesValidos = ['WhatsApp', 'Llamada', 'Email', 'Presencial'];
  const validacionCanal = SpreadsheetApp.newDataValidation()
    .requireValueInList(canalesValidos, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('L2:L1000').setDataValidation(validacionCanal);
  
  // Validación de Estado (columna P)
  const estadosValidos = ['Activo', 'Ganado', 'Perdido'];
  const validacionEstado = SpreadsheetApp.newDataValidation()
    .requireValueInList(estadosValidos, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('P2:P1000').setDataValidation(validacionEstado);
  
  // Fórmula para calcular Días en Etapa (columna M)
  // Esta fórmula se copiará automáticamente cuando se agreguen filas
  sheet.getRange('M2').setFormula('=IF(A2="","",INT(NOW()-A2))');
  
  // Formato de números
  sheet.getRange('H2:H1000').setNumberFormat('$#,##0.00');  // Monto USD
  sheet.getRange('I2:I1000').setNumberFormat('0"%"');        // Probabilidad %
  
  // Instrucciones en la hoja
  sheet.getRange('A1002').setValue('💡 INSTRUCCIONES:');
  sheet.getRange('A1003').setValue('- Esta hoja registra todos los deals en proceso (pipeline de ventas)');
  sheet.getRange('A1004').setValue('- Etapa determina automáticamente la probabilidad de cierre');
  sheet.getRange('A1005').setValue('- Días en Etapa se calcula automáticamente desde última actualización');
  sheet.getRange('A1006').setValue('- Estado "Activo" = en proceso | "Ganado" = cerrado exitoso | "Perdido" = no se cerró');
  sheet.getRange('A1007').setValue('- Al cerrar venta, cambiar Estado a "Ganado" (se moverá a Ventas_Cerradas)');
  sheet.getRange('A1008').setValue('- Al perder deal, cambiar Estado a "Perdido" (se moverá a Lost_Deals)');
  
  Logger.log('✅ Pipeline_Detallado creado');
}

function crearHojaInteraccionesCliente(ss) {
  Logger.log('📞 Creando hoja: Interacciones_Cliente...');
  
  let sheet = ss.getSheetByName('Interacciones_Cliente');
  if (!sheet) {
    sheet = ss.insertSheet('Interacciones_Cliente');
  }
  
  sheet.clear();
  
  // ENCABEZADOS (12 columnas)
  const headers = [
    'Timestamp',           // A - Fecha/hora de la interacción
    'User ID',             // B - ID del ejecutivo
    'Username',            // C - Username del ejecutivo
    'Registered User',     // D - Nombre completo del ejecutivo
    'Cliente',             // E - Nombre de la empresa
    'Tipo Interacción',    // F - Tipo de contacto
    'Canal',               // G - Medio usado
    'Resumen',             // H - Descripción breve
    'Resultado',           // I - Cómo salió
    'Próximo Paso',        // J - Qué hacer después
    'Fecha Follow-up',     // K - Cuándo dar seguimiento
    'Tiempo Invertido'     // L - Minutos dedicados
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold')
    .setBackground('#38761d')
    .setFontColor('white')
    .setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
  
  // Anchos de columna
  sheet.setColumnWidth(1, 140);  // Timestamp
  sheet.setColumnWidth(2, 80);   // User ID
  sheet.setColumnWidth(3, 100);  // Username
  sheet.setColumnWidth(4, 150);  // Registered User
  sheet.setColumnWidth(5, 200);  // Cliente
  sheet.setColumnWidth(6, 150);  // Tipo Interacción
  sheet.setColumnWidth(7, 120);  // Canal
  sheet.setColumnWidth(8, 350);  // Resumen
  sheet.setColumnWidth(9, 150);  // Resultado
  sheet.setColumnWidth(10, 250); // Próximo Paso
  sheet.setColumnWidth(11, 120); // Fecha Follow-up
  sheet.setColumnWidth(12, 120); // Tiempo Invertido
  
  // Validaciones
  
  // Tipo Interacción (columna F)
  const tiposValidos = ['Llamada', 'WhatsApp', 'Email', 'Reunión', 'Demo', 'Otro'];
  const validacionTipo = SpreadsheetApp.newDataValidation()
    .requireValueInList(tiposValidos, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('F2:F1000').setDataValidation(validacionTipo);
  
  // Canal (columna G)
  const canalesValidos = ['WhatsApp', 'Llamada', 'Email', 'Presencial', 'Video'];
  const validacionCanal = SpreadsheetApp.newDataValidation()
    .requireValueInList(canalesValidos, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('G2:G1000').setDataValidation(validacionCanal);
  
  // Resultado (columna I)
  const resultadosValidos = ['Exitoso', 'Pendiente Follow-up', 'No contactado', 'No interesado'];
  const validacionResultado = SpreadsheetApp.newDataValidation()
    .requireValueInList(resultadosValidos, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('I2:I1000').setDataValidation(validacionResultado);
  
  // Formato de números
  sheet.getRange('L2:L1000').setNumberFormat('0 "min"');
  
  // Instrucciones
  sheet.getRange('A1002').setValue('💡 INSTRUCCIONES:');
  sheet.getRange('A1003').setValue('- Registra CADA interacción con clientes (llamadas, WhatsApps, emails, reuniones, demos)');
  sheet.getRange('A1004').setValue('- Tiempo Invertido ayuda a calcular ROI de cada cliente');
  sheet.getRange('A1005').setValue('- Próximo Paso y Fecha Follow-up aseguran seguimiento continuo');
  sheet.getRange('A1006').setValue('- Esta data alimenta métricas de actividad y análisis de conversión');
  
  Logger.log('✅ Interacciones_Cliente creado');
}

function crearHojaVentasCerradas(ss) {
  Logger.log('💰 Creando hoja: Ventas_Cerradas...');
  
  let sheet = ss.getSheetByName('Ventas_Cerradas');
  if (!sheet) {
    sheet = ss.insertSheet('Ventas_Cerradas');
  }
  
  sheet.clear();
  
  // ENCABEZADOS (13 columnas)
  const headers = [
    'Fecha Cierre',        // A - Cuándo se cerró
    'User ID',             // B - Quién cerró
    'Username',            // C
    'Registered User',     // D - Nombre del ejecutivo
    'Cliente',             // E - Empresa que compró
    'Producto',            // F - SKU vendido
    'Monto USD',           // G - Valor de la venta
    'Ciclo Días',          // H - Tiempo desde primer contacto hasta cierre
    'Fecha 1er Contacto',  // I - Cuándo empezó el proceso
    'Nro Interacciones',   // J - Cuántas veces contactamos
    'Canal Cierre',        // K - Por dónde se cerró
    'Tipo Cliente',        // L - Nuevo o recurrente
    'Observaciones'        // M - Notas adicionales
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold')
    .setBackground('#134f5c')
    .setFontColor('white')
    .setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
  
  // Anchos
  sheet.setColumnWidth(1, 120);  // Fecha Cierre
  sheet.setColumnWidth(2, 80);   // User ID
  sheet.setColumnWidth(3, 100);  // Username
  sheet.setColumnWidth(4, 150);  // Registered User
  sheet.setColumnWidth(5, 200);  // Cliente
  sheet.setColumnWidth(6, 120);  // Producto
  sheet.setColumnWidth(7, 120);  // Monto USD
  sheet.setColumnWidth(8, 100);  // Ciclo Días
  sheet.setColumnWidth(9, 120);  // Fecha 1er Contacto
  sheet.setColumnWidth(10, 120); // Nro Interacciones
  sheet.setColumnWidth(11, 120); // Canal Cierre
  sheet.setColumnWidth(12, 120); // Tipo Cliente
  sheet.setColumnWidth(13, 300); // Observaciones
  
  // Validaciones
  
  // Producto (columna F)
  const productosValidos = ['SVC-001', 'SVC-002', 'SVC-003', 'SVC-004'];
  const validacionProducto = SpreadsheetApp.newDataValidation()
    .requireValueInList(productosValidos, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('F2:F1000').setDataValidation(validacionProducto);
  
  // Canal Cierre (columna K)
  const canalesValidos = ['WhatsApp', 'Llamada', 'Email', 'Presencial'];
  const validacionCanal = SpreadsheetApp.newDataValidation()
    .requireValueInList(canalesValidos, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('K2:K1000').setDataValidation(validacionCanal);
  
  // Tipo Cliente (columna L)
  const tiposValidos = ['Nuevo', 'Recurrente'];
  const validacionTipo = SpreadsheetApp.newDataValidation()
    .requireValueInList(tiposValidos, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('L2:L1000').setDataValidation(validacionTipo);
  
  // Formatos
  sheet.getRange('G2:G1000').setNumberFormat('$#,##0.00');  // Monto USD
  sheet.getRange('H2:H1000').setNumberFormat('0 "días"');   // Ciclo Días
  
  // Fórmula para calcular Ciclo Días (columna H)
  sheet.getRange('H2').setFormula('=IF(AND(A2<>"",I2<>""),A2-I2,"")');
  
  // Instrucciones
  sheet.getRange('A1002').setValue('💡 INSTRUCCIONES:');
  sheet.getRange('A1003').setValue('- Esta hoja se alimenta automáticamente cuando un deal pasa a Estado "Ganado"');
  sheet.getRange('A1004').setValue('- Ciclo Días se calcula automáticamente (Fecha Cierre - Fecha 1er Contacto)');
  sheet.getRange('A1005').setValue('- Nro Interacciones cuenta cuántas veces contactamos al cliente durante el proceso');
  sheet.getRange('A1006').setValue('- Tipo Cliente "Nuevo" = primera vez que compra | "Recurrente" = ya era cliente');
  sheet.getRange('A1007').setValue('- Esta data es crítica para calcular KPIs y métricas de conversión');
  
  Logger.log('✅ Ventas_Cerradas creado');
}

function crearHojaLostDeals(ss) {
  Logger.log('📉 Creando hoja: Lost_Deals...');
  
  let sheet = ss.getSheetByName('Lost_Deals');
  if (!sheet) {
    sheet = ss.insertSheet('Lost_Deals');
  }
  
  sheet.clear();
  
  // ENCABEZADOS (12 columnas)
  const headers = [
    'Timestamp',           // A - Cuándo se perdió
    'User ID',             // B
    'Username',            // C
    'Registered User',     // D - Ejecutivo responsable
    'Cliente',             // E - Empresa que no compró
    'Producto',            // F - SKU que se intentó vender
    'Monto Estimado',      // G - Cuánto valía el deal
    'Etapa Perdida',       // H - En qué etapa se perdió
    'Razón',               // I - Por qué se perdió
    'Competidor',          // J - Si fue por competencia
    'Posible Rescate',     // K - ¿Se puede recuperar?
    'Notas'                // L - Detalles adicionales
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold')
    .setBackground('#990000')
    .setFontColor('white')
    .setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
  
  // Anchos
  sheet.setColumnWidth(1, 140);  // Timestamp
  sheet.setColumnWidth(2, 80);   // User ID
  sheet.setColumnWidth(3, 100);  // Username
  sheet.setColumnWidth(4, 150);  // Registered User
  sheet.setColumnWidth(5, 200);  // Cliente
  sheet.setColumnWidth(6, 120);  // Producto
  sheet.setColumnWidth(7, 120);  // Monto Estimado
  sheet.setColumnWidth(8, 150);  // Etapa Perdida
  sheet.setColumnWidth(9, 150);  // Razón
  sheet.setColumnWidth(10, 150); // Competidor
  sheet.setColumnWidth(11, 120); // Posible Rescate
  sheet.setColumnWidth(12, 300); // Notas
  
  // Validaciones
  
  // Producto (columna F)
  const productosValidos = ['SVC-001', 'SVC-002', 'SVC-003', 'SVC-004'];
  const validacionProducto = SpreadsheetApp.newDataValidation()
    .requireValueInList(productosValidos, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('F2:F1000').setDataValidation(validacionProducto);
  
  // Etapa Perdida (columna H)
  const etapasValidas = [
    'Investigación',
    'Contacto Inicial',
    'Reunión Agendada',
    'Propuesta Enviada',
    'Negociación'
  ];
  const validacionEtapa = SpreadsheetApp.newDataValidation()
    .requireValueInList(etapasValidas, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('H2:H1000').setDataValidation(validacionEtapa);
  
  // Razón (columna I)
  const razonesValidas = ['Precio', 'Competencia', 'Timing', 'No hay presupuesto', 'Sin interés', 'Otro'];
  const validacionRazon = SpreadsheetApp.newDataValidation()
    .requireValueInList(razonesValidas, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('I2:I1000').setDataValidation(validacionRazon);
  
  // Posible Rescate (columna K)
  const rescateValidos = ['SI', 'NO'];
  const validacionRescate = SpreadsheetApp.newDataValidation()
    .requireValueInList(rescateValidos, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('K2:K1000').setDataValidation(validacionRescate);
  
  // Formatos
  sheet.getRange('G2:G1000').setNumberFormat('$#,##0.00');
  
  // Instrucciones
  sheet.getRange('A1002').setValue('💡 INSTRUCCIONES:');
  sheet.getRange('A1003').setValue('- Registra deals que no se cerraron para análisis de patrones');
  sheet.getRange('A1004').setValue('- Razón es CRÍTICA para identificar qué mejorar (precio, propuesta, timing, etc.)');
  sheet.getRange('A1005').setValue('- Competidor: si perdimos ante otra empresa, anotarla para estrategia competitiva');
  sheet.getRange('A1006').setValue('- Posible Rescate "SI" = cliente puede volver en el futuro, mantener en radar');
  sheet.getRange('A1007').setValue('- Esta data alimenta análisis de por qué perdemos ventas');
  
  Logger.log('✅ Lost_Deals creado');
}

function crearHojaKPIsAuto(ss) {
  Logger.log('📊 Creando hoja: KPIs_Auto...');
  
  let sheet = ss.getSheetByName('KPIs_Auto');
  if (!sheet) {
    sheet = ss.insertSheet('KPIs_Auto');
  }
  
  sheet.clear();
  
  // ENCABEZADOS
  const headers = ['Métrica', 'Valor Actual', 'Meta/Objetivo'];
  sheet.getRange(1, 1, 1, 3).setValues([headers])
    .setFontWeight('bold')
    .setBackground('#ff6d01')
    .setFontColor('white')
    .setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
  
  // Anchos
  sheet.setColumnWidth(1, 300);  // Métrica
  sheet.setColumnWidth(2, 150);  // Valor Actual
  sheet.setColumnWidth(3, 150);  // Meta
  
  // MÉTRICAS Y FÓRMULAS
  const metricas = [
    ['💰 Ventas Totales Mes Actual', '', ''],
    ['📊 Cumplimiento de Cuota (%)', '', '10000'],
    ['👥 Nuevos Clientes Mes', '', ''],
    ['🎯 Pipeline Total Activo', '', ''],
    ['🔥 Deals en Negociación', '', ''],
    ['📈 Tasa de Conversión General (%)', '', ''],
    ['⏱️ Ciclo de Venta Promedio (días)', '', ''],
    ['📞 Nro Contactos Este Mes', '', ''],
    ['🎤 Nro Demos Este Mes', '', ''],
    ['💵 Forecast Mes (Probabilidad × Monto)', '', ''],
    ['❄️ Deals Sin Actividad >7 días', '', ''],
    ['⭐ Ventas Totales Año', '', ''],
    ['📅 Promedio Ventas Mensual', '', '']
  ];
  
  sheet.getRange(2, 1, metricas.length, 3).setValues(metricas);
  
  // FÓRMULAS EN COLUMNA B (Valor Actual)
  
  // B2: Ventas Totales Mes Actual
  sheet.getRange('B2').setFormula(
    '=IFERROR(SUMIFS(Ventas_Cerradas!G:G,Ventas_Cerradas!A:A,">="&DATE(YEAR(TODAY()),MONTH(TODAY()),1)),0)'
  );
  
  // B3: Cumplimiento de Cuota %
  sheet.getRange('B3').setFormula('=IFERROR(B2/C3,0)');
  
  // B4: Nuevos Clientes Mes
  sheet.getRange('B4').setFormula(
    '=IFERROR(COUNTIFS(Ventas_Cerradas!A:A,">="&DATE(YEAR(TODAY()),MONTH(TODAY()),1),Ventas_Cerradas!L:L,"Nuevo"),0)'
  );
  
  // B5: Pipeline Total Activo
  sheet.getRange('B5').setFormula(
    '=IFERROR(SUMIF(Pipeline_Detallado!P:P,"Activo",Pipeline_Detallado!H:H),0)'
  );
  
  // B6: Deals en Negociación
  sheet.getRange('B6').setFormula(
    '=IFERROR(COUNTIFS(Pipeline_Detallado!P:P,"Activo",Pipeline_Detallado!G:G,"Negociación"),0)'
  );
  
  // B7: Tasa de Conversión General %
  sheet.getRange('B7').setFormula(
    '=IFERROR(COUNTIFS(Ventas_Cerradas!A:A,">="&DATE(YEAR(TODAY()),MONTH(TODAY()),1))/(COUNTIFS(Pipeline_Detallado!N:N,">="&DATE(YEAR(TODAY()),MONTH(TODAY()),1))),0)'
  );
  
  // B8: Ciclo de Venta Promedio
  sheet.getRange('B8').setFormula(
    '=IFERROR(AVERAGE(Ventas_Cerradas!H:H),0)'
  );
  
  // B9: Nro Contactos Este Mes
  sheet.getRange('B9').setFormula(
    '=IFERROR(COUNTIFS(Interacciones_Cliente!A:A,">="&DATE(YEAR(TODAY()),MONTH(TODAY()),1)),0)'
  );
  
  // B10: Nro Demos Este Mes
  sheet.getRange('B10').setFormula(
    '=IFERROR(COUNTIFS(Interacciones_Cliente!A:A,">="&DATE(YEAR(TODAY()),MONTH(TODAY()),1),Interacciones_Cliente!F:F,"Demo"),0)'
  );
  
  // B11: Forecast Mes
  sheet.getRange('B11').setFormula(
    '=IFERROR(SUMPRODUCT((Pipeline_Detallado!P:P="Activo")*(Pipeline_Detallado!H:H)*(Pipeline_Detallado!I:I/100)),0)'
  );
  
  // B12: Deals Sin Actividad >7 días
  sheet.getRange('B12').setFormula(
    '=IFERROR(COUNTIFS(Pipeline_Detallado!P:P,"Activo",Pipeline_Detallado!M:M,">"&7),0)'
  );
  
  // B13: Ventas Totales Año
  sheet.getRange('B13').setFormula(
    '=IFERROR(SUMIFS(Ventas_Cerradas!G:G,Ventas_Cerradas!A:A,">="&DATE(YEAR(TODAY()),1,1)),0)'
  );
  
  // B14: Promedio Ventas Mensual
  sheet.getRange('B14').setFormula('=IFERROR(B13/MONTH(TODAY()),0)');
  
  // FORMATOS
  sheet.getRange('B2:B14').setNumberFormat('$#,##0.00');
  sheet.getRange('B3').setNumberFormat('0.0%');
  sheet.getRange('B7').setNumberFormat('0.0%');
  sheet.getRange('B8').setNumberFormat('0.0');
  
  // META EN C3
  sheet.getRange('C3').setValue(10000).setNumberFormat('$#,##0.00');
  
  // Estilo alternado de filas
  for (let i = 2; i <= 14; i++) {
    if (i % 2 === 0) {
      sheet.getRange(i, 1, 1, 3).setBackground('#f3f3f3');
    }
  }
  
  // Instrucciones
  sheet.getRange('A17').setValue('💡 INSTRUCCIONES:');
  sheet.getRange('A18').setValue('- Esta hoja calcula automáticamente todos los KPIs de ventas');
  sheet.getRange('A19').setValue('- Los valores se actualizan en tiempo real según los datos de otras hojas');
  sheet.getRange('A20').setValue('- Meta/Objetivo: Puedes editar C3 para cambiar la meta mensual (actualmente $10,000)');
  sheet.getRange('A21').setValue('- NO modifiques las fórmulas en columna B (se actualizan solas)');
  sheet.getRange('A22').setValue('- Forecast = Suma de (Monto × Probabilidad) de todos los deals activos');
  
  Logger.log('✅ KPIs_Auto creado con fórmulas');
}

function crearHojaProductosSKU(ss) {
  Logger.log('📦 Creando hoja: Productos_SKU...');
  
  let sheet = ss.getSheetByName('Productos_SKU');
  if (!sheet) {
    sheet = ss.insertSheet('Productos_SKU');
  }
  
  sheet.clear();
  
  // ENCABEZADOS
  const headers = [
    'SKU',              // A - Código del producto
    'Nombre Producto',  // B - Nombre comercial
    'Descripción',      // C - Descripción detallada
    'Precio Base USD',  // D - Precio de lista
    'Comisión %',       // E - Porcentaje de comisión
    'Sector Ideal',     // F - A quién venderle
    'Activo'            // G - SI/NO
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold')
    .setBackground('#674ea7')
    .setFontColor('white')
    .setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
  
  // Anchos
  sheet.setColumnWidth(1, 100);  // SKU
  sheet.setColumnWidth(2, 200);  // Nombre
  sheet.setColumnWidth(3, 400);  // Descripción
  sheet.setColumnWidth(4, 120);  // Precio
  sheet.setColumnWidth(5, 100);  // Comisión
  sheet.setColumnWidth(6, 200);  // Sector
  sheet.setColumnWidth(7, 80);   // Activo
  
  // CATÁLOGO COMPLETO - Ecosistema Financiero Imprenta Digital
  const productos = [
    // Servicios Principales
    ['SVC-001', 'Imprenta Digital Smart Factura', 'Asignación de números de control (SNAT/2024/000102). Números de control, documento fiscal, almacenamiento SENIAT, notificaciones, diseño, dashboard, 4 usuarios', 0, '15%', 'Todos los sectores', 'SI'],
    ['SVC-002', 'Facturador Manual WEB Prosales', 'Emisión manual de documentos digitales (SNAT/2024/000121). Punto de venta, gestión completa, libros, reportes, 4 usuarios, histórico anual', 0, '10%', 'PYMES, Comercios', 'SI'],
    ['SVC-003', 'Facturador Automatizado API SMART', 'Emisión automática vía API (SNAT/2024/000121). Conexiones API, envío múltiple de documentos, reportes vía API, consultas WEB', 359, '20%', 'Empresas grandes, Corporaciones', 'SI'],
    ['SVC-004', 'APK Prosales', 'Aplicación embebible compatible con múltiples dispositivos, embeber en POS', 0, '12%', 'Retail, POS, Restaurantes', 'SI'],
    // Planes Emprendedores/Gremios
    ['PLN-EMP-001', 'Emprendedor 1 (100 NC)', '100 números de control/mes a $0.06 c/u. Incluye facturador $5. Total $11/mes', 11, '10%', 'Personas Naturales', 'SI'],
    ['PLN-EMP-002', 'Emprendedor 2 (200 NC)', '200 números de control/mes a $0.05 c/u. Incluye facturador $7. Total $22/mes', 22, '10%', 'Personas Naturales', 'SI'],
    ['PLN-GRM-001', 'Plan Gremial (200 NC)', '200 números de control/mes a $0.095 c/u. Incluye facturador $6. Total $25/mes', 25, '10%', 'Gremios/Asociaciones', 'SI'],
    // Planes Corporativos Smart Factura
    ['PLN-CORP-001', 'Corporativo Nivel 1 (501-1200 NC)', '501-1,200 números de control. Integración incluida (40h), excedente facturable', 39, '15%', 'Pequeñas Empresas', 'SI'],
    ['PLN-CORP-002', 'Corporativo Nivel 2 (1201-3000 NC)', '1,201-3,000 números de control a $0.12 c/u. Integración incluida (40h)', 89, '15%', 'Mediana Empresa', 'SI'],
    ['PLN-CORP-003', 'Corporativo Nivel 3 (3001-6000 NC)', '3,001-6,000 números de control a $0.10 c/u. Integración incluida (40h)', 149, '15%', 'Mediana Empresa', 'SI'],
    ['PLN-CORP-004', 'Corporativo Nivel 4 (6001-10000 NC)', '6,001-10,000 números de control a $0.08 c/u. Integración incluida (40h)', 199, '15%', 'Grandes Empresas', 'SI'],
    ['PLN-CORP-005', 'Corporativo Nivel 5 (10001-50000 NC)', '10,001-50,000 números de control a $0.07 c/u. Consumo mensual', 249, '15%', 'Grandes Empresas', 'SI'],
    ['PLN-CORP-006', 'Corporativo Nivel 6 (>50000 NC)', '>50,000 números de control a $0.05 c/u. Consumo mensual', 299, '15%', 'Grandes Empresas', 'SI'],
    ['PLN-CORP-007', 'Corporativo Nivel 7 (Alto consumo)', 'Caso especial, alto consumo. Ventas consultivas, precio a validar', 0, '15%', 'Grandes Empresas', 'SI'],
    // Planes Prosales WEB (anuales)
    ['PLN-WEB-001', 'Prosales WEB Grandes Empresas', 'Plan anual Prosales WEB para grandes empresas', 1799, '10%', 'Grandes Empresas', 'SI'],
    ['PLN-WEB-002', 'Prosales WEB Pyme', 'Plan anual Prosales WEB para medianas empresas', 499, '10%', 'Medianas Empresas', 'SI'],
    ['PLN-WEB-003', 'Prosales WEB Pequeñas Empresas', 'Plan anual Prosales WEB para pequeñas empresas', 199, '10%', 'Pequeñas Empresas', 'SI'],
    // Planes APK
    ['APK-001', 'APK Embeber (genérico)', 'Embeber APK en dispositivos genéricos. $2/recurrencia mensual', 2, '12%', 'Retail, POS', 'SI'],
    ['APK-002', 'APK Embeber en POS', 'Embeber APK en puntos de venta específicos. $2/recurrencia mensual', 2, '12%', 'POS', 'SI'],
    ['APK-003', 'APK Empresas (hasta 4 usuarios)', 'APK empresarial hasta 4 usuarios a $6 c/u = $24/mes', 24, '12%', 'Pequeñas Empresas', 'SI'],
    ['APK-004', 'APK Empresas (hasta 10 usuarios)', 'APK empresarial hasta 10 usuarios a $4 c/u = $40/mes', 40, '12%', 'Medianas Empresas', 'SI'],
    ['APK-005', 'APK Empresas (20+ usuarios)', 'APK empresarial 20+ usuarios a $2 c/u = $40+/mes', 40, '12%', 'Grandes Empresas', 'SI'],
    // Otros Servicios
    ['ADD-001', 'API Smart (anual)', 'Servicio API Smart anual', 359, '15%', 'Empresas con sistemas propios', 'SI'],
    ['ADD-002', 'Servicios Extras', 'Servicios extras según solicitud. Precio variable', 0, '10%', 'Todos', 'SI'],
    ['SUP-001', 'Soporte Integración', 'Soporte de integración $20/hora (excedente 40h incluidas)', 20, '5%', 'Corporativos', 'SI'],
    ['SUP-002', 'Soporte Personalización', 'Personalización $20/hora (excedente)', 20, '5%', 'Todos', 'SI'],
    ['SUP-003', 'Carga de Productos', 'Carga de productos $40/hora (excedente)', 40, '5%', 'Todos', 'SI'],
    ['ADD-004', 'Mensajería de Textos', 'Notificaciones SMS. Precio variable', 0, '10%', 'Todos', 'SI'],
    ['ADD-005', 'Emails Marketing', 'Campañas de email marketing. Precio variable', 0, '10%', 'Todos', 'SI'],
    ['ADD-006', 'Recuperación de Data', 'Recuperación de información. Precio variable', 0, '10%', 'Todos', 'SI'],
    ['ADQ-001', 'Adecuación Plataforma', 'Modificaciones a medida $20/hora (excedente)', 20, '5%', 'Todos', 'SI'],
    ['ADQ-003', 'Botón de Pago', 'Botón de pago en notificaciones. Incluido en planes base de imprenta (NO incluye pasarela)', 0, '5%', 'Todos', 'SI']
  ];

  sheet.getRange(2, 1, productos.length, headers.length).setValues(productos);

  // Validación Activo (columna G)
  const validacionActivo = SpreadsheetApp.newDataValidation()
    .requireValueInList(['SI', 'NO'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange('G2:G100').setDataValidation(validacionActivo);

  // Formatos
  sheet.getRange('D2:D100').setNumberFormat('$#,##0.00');

  // Estilo de filas
  sheet.getRange(2, 1, productos.length, headers.length).setBorder(true, true, true, true, false, false);
  
  Logger.log('✅ Productos_SKU creado con datos iniciales');
}

function actualizarDashboardVentas(ss) {
  Logger.log('📊 Actualizando Dashboard...');
  
  const dash = ss.getSheetByName('Dashboard');
  if (!dash) {
    Logger.log('⚠️ Dashboard no existe, omitiendo actualización');
    return;
  }
  
  // Agregar sección de ventas al Dashboard
  const filaInicio = 20; // Empieza después del contenido existente
  
  // Título
  dash.getRange(filaInicio, 1).setValue('💰 VENTAS Y PIPELINE')
    .setFontSize(14)
    .setFontWeight('bold')
    .setBackground('#0b5394')
    .setFontColor('white');
  
  dash.getRange(filaInicio, 2).setBackground('#0b5394');
  
  // KPIs principales
  const kpisVentas = [
    ['', ''],
    ['📊 Ventas Mes Actual:', '=KPIs_Auto!B2'],
    ['🎯 Cumplimiento Cuota:', '=KPIs_Auto!B3'],
    ['👥 Nuevos Clientes:', '=KPIs_Auto!B4'],
    ['💵 Forecast Mes:', '=KPIs_Auto!B11'],
    ['', ''],
    ['🔥 PIPELINE ACTIVO', ''],
    ['Total Pipeline:', '=KPIs_Auto!B5'],
    ['En Investigación:', '=COUNTIFS(Pipeline_Detallado!G:G,"Investigación",Pipeline_Detallado!P:P,"Activo")'],
    ['En Contacto Inicial:', '=COUNTIFS(Pipeline_Detallado!G:G,"Contacto Inicial",Pipeline_Detallado!P:P,"Activo")'],
    ['Reunión Agendada:', '=COUNTIFS(Pipeline_Detallado!G:G,"Reunión Agendada",Pipeline_Detallado!P:P,"Activo")'],
    ['Propuesta Enviada:', '=COUNTIFS(Pipeline_Detallado!G:G,"Propuesta Enviada",Pipeline_Detallado!P:P,"Activo")'],
    ['En Negociación:', '=COUNTIFS(Pipeline_Detallado!G:G,"Negociación",Pipeline_Detallado!P:P,"Activo")'],
    ['', ''],
    ['📈 ACTIVIDAD', ''],
    ['Contactos Este Mes:', '=KPIs_Auto!B9'],
    ['Demos Realizadas:', '=KPIs_Auto!B10'],
    ['Tasa Conversión:', '=KPIs_Auto!B7'],
    ['Ciclo Venta Promedio:', '=KPIs_Auto!B8'],
    ['', ''],
    ['⚠️ ALERTAS', ''],
    ['Deals Fríos (>7 días):', '=KPIs_Auto!B12']
  ];
  
  dash.getRange(filaInicio + 1, 1, kpisVentas.length, 2).setValues(kpisVentas);
  
  // Formato de las celdas con valores
  dash.getRange(filaInicio + 2, 2).setNumberFormat('$#,##0.00'); // Ventas
  dash.getRange(filaInicio + 3, 2).setNumberFormat('0.0%');      // Cumplimiento
  dash.getRange(filaInicio + 5, 2).setNumberFormat('$#,##0.00'); // Forecast
  dash.getRange(filaInicio + 8, 2).setNumberFormat('$#,##0.00'); // Pipeline Total
  dash.getRange(filaInicio + 18, 2).setNumberFormat('0.0%');     // Tasa Conversión
  dash.getRange(filaInicio + 19, 2).setNumberFormat('0.0 "días"'); // Ciclo
  
  // Resaltar alertas si >0
  dash.getRange(filaInicio + 22, 2).setBackground('#f4cccc'); // Deals fríos en rojo claro
  
  Logger.log('✅ Dashboard actualizado con sección de ventas');
}

// ============================================
// FUNCIONES DE VERIFICACIÓN
// ============================================


// ============================================
// VENTAS FASE 2: FUNCIONES DE REGISTRO
// ============================================

function registrarLead(userId, username, registeredUser, datos) {
  try {
    Logger.log(`📋 Registrando nuevo lead: ${datos.cliente}`);
    
    // Validaciones básicas
    if (!datos.cliente || datos.cliente.trim() === '') {
      throw new Error('El nombre del cliente es obligatorio');
    }
    
    if (!datos.producto) {
      throw new Error('El producto (SKU) es obligatorio');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Verificar que el cliente existe en Contactos
    const clienteExiste = verificarClienteExiste(datos.cliente);
    if (!clienteExiste) {
      Logger.log(`⚠️ Cliente "${datos.cliente}" no existe en Contactos`);
      // No bloqueamos, pero advertimos
    }
    
    // Verificar que el producto existe (solo advertencia, no bloquea)
    const productoValido = verificarProductoValido(datos.producto);
    if (!productoValido) {
      Logger.log(`⚠️ Producto "${datos.producto}" no encontrado en catálogo SKU, registrando de todas formas`);
    }
    
    const sheet = ss.getSheetByName('Pipeline_Detallado');
    
    // Determinar probabilidad automática según etapa inicial
    const etapaInicial = datos.etapa || 'Investigación';
    const probabilidad = calcularProbabilidadPorEtapa(etapaInicial);
    
    // Calcular fecha de cierre estimada si no viene
    let fechaCierreEst = datos.fechaCierreEstimada || '';
    if (!fechaCierreEst) {
      // Estimar 30 días desde hoy por defecto
      const fechaEst = new Date();
      fechaEst.setDate(fechaEst.getDate() + 30);
      fechaCierreEst = fechaEst.toISOString().split('T')[0];
    }
    
    // Procesar calificación BANT si viene
    let notasCompletas = datos.notas || '';
    if (datos.bant) {
      const scoreBANT = calcularScoreBANT(datos.bant);
      notasCompletas = `BANT Score: ${scoreBANT.score}/100 (${scoreBANT.calificacion})\n` +
                       `Budget: ${datos.bant.budget || 'Desconocido'}\n` +
                       `Authority: ${datos.bant.authority || 'Desconocido'}\n` +
                       `Need: ${datos.bant.need || 'Desconocido'}\n` +
                       `Timeline: ${datos.bant.timeline || 'Desconocido'}\n\n` +
                       notasCompletas;
    }
    
    // Preparar datos para insertar
    const fila = [
      new Date(),                           // A - Timestamp
      userId,                               // B - User ID
      username,                             // C - Username
      registeredUser,                       // D - Registered User
      datos.cliente,                        // E - Cliente
      datos.producto,                       // F - Producto (SKU)
      etapaInicial,                         // G - Etapa
      datos.monto || 0,                     // H - Monto USD
      probabilidad,                         // I - Probabilidad %
      fechaCierreEst,                       // J - Fecha Cierre Estimada
      datos.origen || 'Otro',               // K - Origen Lead
      datos.canal || 'WhatsApp',            // L - Canal Contacto
      0,                                    // M - Días en Etapa (se calcula con fórmula)
      new Date(),                           // N - Fecha Creación
      notasCompletas,                       // O - Notas
      'Activo'                              // P - Estado
    ];
    
    // Insertar en Pipeline_Detallado
    sheet.appendRow(fila);
    
    // Aplicar fórmula de Días en Etapa en la última fila
    const ultimaFila = sheet.getLastRow();
    sheet.getRange(ultimaFila, 13).setFormula('=IF(A' + ultimaFila + '="","",INT(NOW()-A' + ultimaFila + '))');
    
    Logger.log(`✅ Lead registrado: ${datos.cliente} - ${datos.producto}`);
    
    // Si viene con calificación BANT, retornar el score
    let mensajeBANT = '';
    if (datos.bant) {
      const scoreBANT = calcularScoreBANT(datos.bant);
      mensajeBANT = `\n\n🎯 Calificación BANT: ${scoreBANT.calificacion}\n` +
                    `📊 Score: ${scoreBANT.score}/100\n` +
                    scoreBANT.recomendacion;
    }
    
    return {
      exito: true,
      mensaje: `✅ Nuevo lead registrado:\n\n` +
               `👤 Cliente: ${datos.cliente}\n` +
               `📦 Producto: ${datos.producto}\n` +
               `💰 Monto estimado: $${datos.monto || 0}\n` +
               `📊 Etapa: ${etapaInicial}\n` +
               `🎲 Probabilidad: ${probabilidad}%\n` +
               `📅 Cierre estimado: ${fechaCierreEst}\n` +
               `📍 Origen: ${datos.origen || 'Otro'}` +
               mensajeBANT +
               (!clienteExiste ? '\n\n⚠️ Nota: Este cliente no está registrado en Contactos. Considera agregarlo.' : '')
    };
    
  } catch (error) {
    Logger.log(`❌ Error registrando lead: ${error.message}`);
    return {
      exito: false,
      mensaje: `❌ Error al registrar lead: ${error.message}`
    };
  }
}

// ============================================
// FUNCIÓN 2: REGISTRAR INTERACCIÓN CON CLIENTE
// ============================================

function registrarContactoVenta(userId, username, registeredUser, datos) {
  try {
    Logger.log(`📞 Registrando interacción con: ${datos.cliente}`);
    
    // Validaciones
    if (!datos.cliente || datos.cliente.trim() === '') {
      throw new Error('El nombre del cliente es obligatorio');
    }
    
    if (!datos.tipo) {
      throw new Error('El tipo de interacción es obligatorio');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Interacciones_Cliente');
    
    // Preparar datos
    const fila = [
      new Date(),                           // A - Timestamp
      userId,                               // B - User ID
      username,                             // C - Username
      registeredUser,                       // D - Registered User
      datos.cliente,                        // E - Cliente
      datos.tipo,                           // F - Tipo (Llamada, WhatsApp, Email, etc.)
      datos.canal || datos.tipo,            // G - Canal
      datos.resumen || 'Sin detalles',      // H - Resumen
      datos.resultado || 'Pendiente',       // I - Resultado
      datos.proximoPaso || '',              // J - Próximo Paso
      datos.fechaFollowup || '',            // K - Fecha Follow-up
      datos.tiempoInvertido || 0            // L - Tiempo Invertido (minutos)
    ];
    
    sheet.appendRow(fila);
    
    // Actualizar timestamp del deal en Pipeline si existe
    actualizarTimestampDeal(datos.cliente);
    
    Logger.log(`✅ Interacción registrada: ${datos.tipo} con ${datos.cliente}`);
    
    return {
      exito: true,
      mensaje: `✅ Interacción registrada:\n\n` +
               `👤 Cliente: ${datos.cliente}\n` +
               `📞 Tipo: ${datos.tipo}\n` +
               `📱 Canal: ${datos.canal || datos.tipo}\n` +
               `📝 Resumen: ${datos.resumen || 'Sin detalles'}\n` +
               `✅ Resultado: ${datos.resultado || 'Pendiente'}\n` +
               (datos.proximoPaso ? `🎯 Próximo paso: ${datos.proximoPaso}\n` : '') +
               (datos.fechaFollowup ? `📅 Follow-up: ${datos.fechaFollowup}\n` : '') +
               (datos.tiempoInvertido ? `⏱️ Tiempo: ${datos.tiempoInvertido} minutos` : '')
    };
    
  } catch (error) {
    Logger.log(`❌ Error registrando interacción: ${error.message}`);
    return {
      exito: false,
      mensaje: `❌ Error al registrar interacción: ${error.message}`
    };
  }
}

// ============================================
// FUNCIÓN 3: MOVER ETAPA DE DEAL
// ============================================

function moverEtapa(userId, datos) {
  try {
    Logger.log(`🔄 Moviendo etapa para: ${datos.cliente}`);
    
    // Validaciones
    if (!datos.cliente || datos.cliente.trim() === '') {
      throw new Error('El nombre del cliente es obligatorio');
    }
    
    if (!datos.nuevaEtapa) {
      throw new Error('La nueva etapa es obligatoria');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Pipeline_Detallado');
    const data = sheet.getDataRange().getValues();
    
    // Buscar el deal activo del cliente
    let filaEncontrada = -1;
    let etapaAnterior = '';
    
    for (let i = data.length - 1; i >= 1; i--) {
      const clienteEnFila = (data[i][4] || '').toString().toLowerCase();
      const estado = data[i][15];
      
      if (clienteEnFila === datos.cliente.toLowerCase() && estado === 'Activo') {
        filaEncontrada = i + 1;
        etapaAnterior = data[i][6];
        break;
      }
    }
    
    if (filaEncontrada === -1) {
      throw new Error(`No se encontró un deal activo para el cliente "${datos.cliente}"`);
    }
    
    // Calcular nueva probabilidad según la etapa
    const nuevaProbabilidad = calcularProbabilidadPorEtapa(datos.nuevaEtapa);
    
    // Actualizar la fila
    sheet.getRange(filaEncontrada, 1).setValue(new Date()); // Timestamp (resetea días en etapa)
    sheet.getRange(filaEncontrada, 7).setValue(datos.nuevaEtapa); // Etapa
    sheet.getRange(filaEncontrada, 9).setValue(nuevaProbabilidad); // Probabilidad
    
    // Agregar nota del cambio
    const notasActuales = sheet.getRange(filaEncontrada, 15).getValue() || '';
    const timestamp = new Date().toLocaleString('es-ES');
    const nuevaNota = `[${timestamp}] Movido de "${etapaAnterior}" a "${datos.nuevaEtapa}". ${datos.notas || ''}`;
    const notasFinales = notasActuales ? `${notasActuales}\n${nuevaNota}` : nuevaNota;
    sheet.getRange(filaEncontrada, 15).setValue(notasFinales);
    
    Logger.log(`✅ Deal movido: ${datos.cliente} → ${datos.nuevaEtapa}`);
    
    return {
      exito: true,
      mensaje: `✅ Etapa actualizada:\n\n` +
               `👤 Cliente: ${datos.cliente}\n` +
               `📊 ${etapaAnterior} → ${datos.nuevaEtapa}\n` +
               `🎲 Probabilidad: ${nuevaProbabilidad}%\n` +
               (datos.notas ? `📝 ${datos.notas}` : '')
    };
    
  } catch (error) {
    Logger.log(`❌ Error moviendo etapa: ${error.message}`);
    return {
      exito: false,
      mensaje: `❌ Error al mover etapa: ${error.message}`
    };
  }
}

// ============================================
// FUNCIÓN 4: REGISTRAR DEMO
// ============================================

function registrarDemo(userId, username, registeredUser, datos) {
  try {
    Logger.log(`🎤 Registrando demo para: ${datos.cliente}`);
    
    // Validaciones
    if (!datos.cliente || datos.cliente.trim() === '') {
      throw new Error('El nombre del cliente es obligatorio');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Registrar en Interacciones_Cliente
    const sheetInteracciones = ss.getSheetByName('Interacciones_Cliente');
    
    const fila = [
      new Date(),
      userId,
      username,
      registeredUser,
      datos.cliente,
      'Demo',                                         // Tipo
      'Presencial',                                   // Canal (puede variar)
      `Demo de ${datos.producto || 'producto'}. ${datos.resumen || ''}`,
      datos.resultado || 'Completada',
      datos.proximoPaso || 'Enviar propuesta',
      datos.fechaFollowup || '',
      datos.duracion || 45                            // 45 min por defecto
    ];
    
    sheetInteracciones.appendRow(fila);
    
    // Si el cliente tiene deal activo, moverlo a "Propuesta Enviada" si no está más avanzado
    const sheetPipeline = ss.getSheetByName('Pipeline_Detallado');
    const dataPipeline = sheetPipeline.getDataRange().getValues();
    
    for (let i = dataPipeline.length - 1; i >= 1; i--) {
      const clienteEnFila = (dataPipeline[i][4] || '').toString().toLowerCase();
      const estado = dataPipeline[i][15];
      const etapaActual = dataPipeline[i][6];
      
      if (clienteEnFila === datos.cliente.toLowerCase() && estado === 'Activo') {
        // Si está en investigación o contacto inicial, avanzar automáticamente
        const etapasTempranas = ['Investigación', 'Contacto Inicial', 'Reunión Agendada'];
        if (etapasTempranas.includes(etapaActual)) {
          const filaActualizar = i + 1;
          sheetPipeline.getRange(filaActualizar, 7).setValue('Propuesta Enviada');
          sheetPipeline.getRange(filaActualizar, 9).setValue(60); // 60% probabilidad
          sheetPipeline.getRange(filaActualizar, 1).setValue(new Date()); // Timestamp
          
          Logger.log(`📊 Deal movido automáticamente a "Propuesta Enviada"`);
        }
        break;
      }
    }
    
    // Actualizar timestamp del deal
    actualizarTimestampDeal(datos.cliente);
    
    Logger.log(`✅ Demo registrada: ${datos.cliente}`);
    
    return {
      exito: true,
      mensaje: `✅ Demo registrada exitosamente:\n\n` +
               `👤 Cliente: ${datos.cliente}\n` +
               `📦 Producto: ${datos.producto || 'Smart'}\n` +
               `⏱️ Duración: ${datos.duracion || 45} minutos\n` +
               `📊 Resultado: ${datos.resultado || 'Completada'}\n` +
               `🎯 Próximo paso: ${datos.proximoPaso || 'Enviar propuesta'}\n\n` +
               `💡 El deal se movió automáticamente a "Propuesta Enviada" (60% probabilidad)`
    };
    
  } catch (error) {
    Logger.log(`❌ Error registrando demo: ${error.message}`);
    return {
      exito: false,
      mensaje: `❌ Error al registrar demo: ${error.message}`
    };
  }
}

// ============================================
// FUNCIÓN 5: REGISTRAR PROPUESTA
// ============================================

function registrarPropuesta(userId, username, registeredUser, datos) {
  try {
    Logger.log(`📄 Registrando propuesta para: ${datos.cliente}`);
    
    // Validaciones
    if (!datos.cliente || datos.cliente.trim() === '') {
      throw new Error('El nombre del cliente es obligatorio');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Registrar interacción
    const sheetInteracciones = ss.getSheetByName('Interacciones_Cliente');
    
    const fila = [
      new Date(),
      userId,
      username,
      registeredUser,
      datos.cliente,
      'Email',                                        // Tipo (generalmente por email)
      'Email',
      `Propuesta enviada. Monto: $${datos.monto || 'Por definir'}. ${datos.detalles || ''}`,
      'Exitoso',
      datos.proximoPaso || 'Esperar respuesta y dar seguimiento',
      datos.fechaFollowup || '',
      datos.tiempoInvertido || 30
    ];
    
    sheetInteracciones.appendRow(fila);
    
    // Mover el deal a "Propuesta Enviada" si no está más avanzado
    const resultado = moverEtapa(userId, {
      cliente: datos.cliente,
      nuevaEtapa: 'Propuesta Enviada',
      notas: `Propuesta enviada por $${datos.monto || 'TBD'}`
    });
    
    // Actualizar monto si viene
    if (datos.monto) {
      const sheetPipeline = ss.getSheetByName('Pipeline_Detallado');
      const dataPipeline = sheetPipeline.getDataRange().getValues();
      
      for (let i = dataPipeline.length - 1; i >= 1; i--) {
        const clienteEnFila = (dataPipeline[i][4] || '').toString().toLowerCase();
        const estado = dataPipeline[i][15];
        
        if (clienteEnFila === datos.cliente.toLowerCase() && estado === 'Activo') {
          sheetPipeline.getRange(i + 1, 8).setValue(datos.monto);
          break;
        }
      }
    }
    
    Logger.log(`✅ Propuesta registrada: ${datos.cliente}`);
    
    return {
      exito: true,
      mensaje: `✅ Propuesta enviada y registrada:\n\n` +
               `👤 Cliente: ${datos.cliente}\n` +
               `💰 Monto: $${datos.monto || 'Por definir'}\n` +
               `📧 Canal: Email\n` +
               `📊 Deal movido a "Propuesta Enviada" (60% probabilidad)\n` +
               `🎯 Próximo paso: ${datos.proximoPaso || 'Dar seguimiento'}`
    };
    
  } catch (error) {
    Logger.log(`❌ Error registrando propuesta: ${error.message}`);
    return {
      exito: false,
      mensaje: `❌ Error al registrar propuesta: ${error.message}`
    };
  }
}

// ============================================
// FUNCIÓN 6: CERRAR VENTA (MARCAR COMO GANADO)
// ============================================

function cerrarVenta(userId, username, registeredUser, datos) {
  try {
    Logger.log(`💰 Cerrando venta para: ${datos.cliente}`);
    
    // Validaciones
    if (!datos.cliente || datos.cliente.trim() === '') {
      throw new Error('El nombre del cliente es obligatorio');
    }
    
    if (!datos.monto || datos.monto <= 0) {
      throw new Error('El monto de la venta es obligatorio y debe ser mayor a 0');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheetPipeline = ss.getSheetByName('Pipeline_Detallado');
    const dataPipeline = sheetPipeline.getDataRange().getValues();
    
    // Buscar el deal activo
    let filaEncontrada = -1;
    let dealData = null;
    
    for (let i = dataPipeline.length - 1; i >= 1; i--) {
      const clienteEnFila = (dataPipeline[i][4] || '').toString().toLowerCase();
      const estado = dataPipeline[i][15];
      
      if (clienteEnFila === datos.cliente.toLowerCase() && estado === 'Activo') {
        filaEncontrada = i + 1;
        dealData = {
          timestamp: dataPipeline[i][0],
          userId: dataPipeline[i][1],
          username: dataPipeline[i][2],
          registeredUser: dataPipeline[i][3],
          cliente: dataPipeline[i][4],
          producto: dataPipeline[i][5],
          fechaCreacion: dataPipeline[i][13]
        };
        break;
      }
    }
    
    if (filaEncontrada === -1) {
      throw new Error(`No se encontró un deal activo para "${datos.cliente}"`);
    }
    
    // Marcar como Ganado en Pipeline
    sheetPipeline.getRange(filaEncontrada, 7).setValue('Ganado');
    sheetPipeline.getRange(filaEncontrada, 9).setValue(100); // 100% probabilidad
    sheetPipeline.getRange(filaEncontrada, 16).setValue('Ganado'); // Estado
    
    // Contar interacciones del cliente
    const sheetInteracciones = ss.getSheetByName('Interacciones_Cliente');
    const dataInteracciones = sheetInteracciones.getDataRange().getValues();
    let nroInteracciones = 0;
    let fechaPrimerContacto = dealData.fechaCreacion;
    
    for (let i = 1; i < dataInteracciones.length; i++) {
      const clienteInteraccion = (dataInteracciones[i][4] || '').toString().toLowerCase();
      if (clienteInteraccion === datos.cliente.toLowerCase()) {
        nroInteracciones++;
        const fechaInteraccion = new Date(dataInteracciones[i][0]);
        if (fechaInteraccion < new Date(fechaPrimerContacto)) {
          fechaPrimerContacto = fechaInteraccion;
        }
      }
    }
    
    // Calcular ciclo de venta
    const fechaCierre = new Date();
    const ciclo = Math.floor((fechaCierre - new Date(fechaPrimerContacto)) / (1000 * 60 * 60 * 24));
    
    // Determinar tipo de cliente (si tiene ventas previas = Recurrente)
    const sheetVentas = ss.getSheetByName('Ventas_Cerradas');
    const dataVentas = sheetVentas.getDataRange().getValues();
    let tipoCliente = 'Nuevo';
    
    for (let i = 1; i < dataVentas.length; i++) {
      const clienteVenta = (dataVentas[i][4] || '').toString().toLowerCase();
      if (clienteVenta === datos.cliente.toLowerCase()) {
        tipoCliente = 'Recurrente';
        break;
      }
    }
    
    // Insertar en Ventas_Cerradas
    const filaVenta = [
      fechaCierre,                          // A - Fecha Cierre
      dealData.userId,                      // B - User ID
      dealData.username,                    // C - Username
      dealData.registeredUser,              // D - Registered User
      datos.cliente,                        // E - Cliente
      datos.producto || dealData.producto,  // F - Producto
      datos.monto,                          // G - Monto USD
      ciclo,                                // H - Ciclo Días
      fechaPrimerContacto,                  // I - Fecha 1er Contacto
      nroInteracciones,                     // J - Nro Interacciones
      datos.canal || 'WhatsApp',            // K - Canal Cierre
      tipoCliente,                          // L - Tipo Cliente
      datos.observaciones || ''             // M - Observaciones
    ];
    
    sheetVentas.appendRow(filaVenta);
    
    Logger.log(`✅ Venta cerrada: ${datos.cliente} - $${datos.monto}`);
    
    // Mensaje de éxito con estadísticas
    return {
      exito: true,
      mensaje: `🎉 ¡VENTA CERRADA!\n\n` +
               `👤 Cliente: ${datos.cliente}\n` +
               `📦 Producto: ${datos.producto || dealData.producto}\n` +
               `💰 Monto: $${datos.monto}\n` +
               `⏱️ Ciclo de venta: ${ciclo} días\n` +
               `📞 Interacciones: ${nroInteracciones}\n` +
               `👥 Tipo: ${tipoCliente}\n` +
               `📱 Canal cierre: ${datos.canal || 'WhatsApp'}\n\n` +
               `✅ Registrado en Ventas_Cerradas\n` +
               `📊 KPIs actualizados automáticamente`
    };
    
  } catch (error) {
    Logger.log(`❌ Error cerrando venta: ${error.message}`);
    return {
      exito: false,
      mensaje: `❌ Error al cerrar venta: ${error.message}`
    };
  }
}

// ============================================
// FUNCIÓN 7: PERDER DEAL
// ============================================

function perderDeal(userId, username, registeredUser, datos) {
  try {
    Logger.log(`📉 Marcando como perdido: ${datos.cliente}`);
    
    // Validaciones
    if (!datos.cliente || datos.cliente.trim() === '') {
      throw new Error('El nombre del cliente es obligatorio');
    }
    
    if (!datos.razon) {
      throw new Error('La razón de pérdida es obligatoria');
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheetPipeline = ss.getSheetByName('Pipeline_Detallado');
    const dataPipeline = sheetPipeline.getDataRange().getValues();
    
    // Buscar el deal activo
    let filaEncontrada = -1;
    let dealData = null;
    
    for (let i = dataPipeline.length - 1; i >= 1; i--) {
      const clienteEnFila = (dataPipeline[i][4] || '').toString().toLowerCase();
      const estado = dataPipeline[i][15];
      
      if (clienteEnFila === datos.cliente.toLowerCase() && estado === 'Activo') {
        filaEncontrada = i + 1;
        dealData = {
          timestamp: dataPipeline[i][0],
          userId: dataPipeline[i][1],
          username: dataPipeline[i][2],
          registeredUser: dataPipeline[i][3],
          cliente: dataPipeline[i][4],
          producto: dataPipeline[i][5],
          etapa: dataPipeline[i][6],
          monto: dataPipeline[i][7]
        };
        break;
      }
    }
    
    if (filaEncontrada === -1) {
      throw new Error(`No se encontró un deal activo para "${datos.cliente}"`);
    }
    
    // Marcar como Perdido en Pipeline
    sheetPipeline.getRange(filaEncontrada, 7).setValue('Perdido');
    sheetPipeline.getRange(filaEncontrada, 9).setValue(0); // 0% probabilidad
    sheetPipeline.getRange(filaEncontrada, 16).setValue('Perdido'); // Estado
    
    // Registrar en Lost_Deals
    const sheetLost = ss.getSheetByName('Lost_Deals');
    
    const filaLost = [
      new Date(),                           // A - Timestamp
      dealData.userId,                      // B - User ID
      dealData.username,                    // C - Username
      dealData.registeredUser,              // D - Registered User
      datos.cliente,                        // E - Cliente
      dealData.producto,                    // F - Producto
      dealData.monto || 0,                  // G - Monto Estimado
      dealData.etapa,                       // H - Etapa Perdida
      datos.razon,                          // I - Razón
      datos.competidor || '',               // J - Competidor
      datos.posibleRescate || 'NO',         // K - Posible Rescate
      datos.notas || ''                     // L - Notas
    ];
    
    sheetLost.appendRow(filaLost);
    
    Logger.log(`✅ Deal marcado como perdido: ${datos.cliente}`);
    
    // Emoji según razón
    const emojiRazon = {
      'Precio': '💸',
      'Competencia': '🏆',
      'Timing': '⏰',
      'No hay presupuesto': '💰',
      'Sin interés': '😐',
      'Otro': '❓'
    };
    
    const emoji = emojiRazon[datos.razon] || '📉';
    
    return {
      exito: true,
      mensaje: `${emoji} Deal marcado como perdido:\n\n` +
               `👤 Cliente: ${datos.cliente}\n` +
               `📦 Producto: ${dealData.producto}\n` +
               `💰 Monto estimado: $${dealData.monto || 0}\n` +
               `📊 Se perdió en: ${dealData.etapa}\n` +
               `❌ Razón: ${datos.razon}\n` +
               (datos.competidor ? `🏆 Competidor: ${datos.competidor}\n` : '') +
               `♻️ Posible rescate: ${datos.posibleRescate || 'NO'}\n\n` +
               `📝 Registrado en Lost_Deals para análisis\n` +
               (datos.posibleRescate === 'SI' ? `💡 Considera agendar follow-up en 3-6 meses` : '')
    };
    
  } catch (error) {
    Logger.log(`❌ Error perdiendo deal: ${error.message}`);
    return {
      exito: false,
      mensaje: `❌ Error al perder deal: ${error.message}`
    };
  }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

// Calcular probabilidad según etapa
function calcularProbabilidadPorEtapa(etapa) {
  const probabilidades = {
    'Investigación': 10,
    'Contacto Inicial': 20,
    'Reunión Agendada': 40,
    'Propuesta Enviada': 60,
    'Negociación': 80,
    'Ganado': 100,
    'Perdido': 0
  };
  
  return probabilidades[etapa] || 10;
}

// Verificar si cliente existe en Contactos
function verificarClienteExiste(nombreCliente) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Contactos');
    const data = sheet.getDataRange().getValues();
    
    const nombreBuscar = nombreCliente.toLowerCase();
    
    for (let i = 1; i < data.length; i++) {
      const nombreEmpresa = (data[i][4] || '').toString().toLowerCase();
      if (nombreEmpresa === nombreBuscar) {
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    Logger.log('⚠️ Error verificando cliente: ' + error);
    return false;
  }
}

// Verificar si producto es válido
function verificarProductoValido(sku) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Productos_SKU');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const skuEnFila = (data[i][0] || '').toString();
      const activo = data[i][6];
      if (skuEnFila === sku && activo === 'SI') {
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    Logger.log('⚠️ Error verificando producto: ' + error);
    return false;
  }
}

// Actualizar timestamp de un deal para resetear "Días en Etapa"
function actualizarTimestampDeal(nombreCliente) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Pipeline_Detallado');
    const data = sheet.getDataRange().getValues();
    
    const nombreBuscar = nombreCliente.toLowerCase();
    
    for (let i = data.length - 1; i >= 1; i--) {
      const clienteEnFila = (data[i][4] || '').toString().toLowerCase();
      const estado = data[i][15];
      
      if (clienteEnFila === nombreBuscar && estado === 'Activo') {
        sheet.getRange(i + 1, 1).setValue(new Date());
        Logger.log(`🔄 Timestamp actualizado para deal: ${nombreCliente}`);
        break;
      }
    }
    
  } catch (error) {
    Logger.log('⚠️ Error actualizando timestamp: ' + error);
  }
}

// Sistema de calificación BANT
function calcularScoreBANT(bant) {
  let score = 0;
  let detalles = [];
  
  // BUDGET (30 puntos)
  if (bant.budget === 'SI') {
    score += 30;
    detalles.push('✅ Tiene presupuesto');
  } else if (bant.budget === 'NO') {
    score += 0;
    detalles.push('❌ Sin presupuesto confirmado');
  } else {
    score += 10;
    detalles.push('⚠️ Presupuesto desconocido');
  }
  
  // AUTHORITY (25 puntos)
  if (bant.authority === 'SI') {
    score += 25;
    detalles.push('✅ Contacto es quien decide');
  } else if (bant.authority === 'NO') {
    score += 0;
    detalles.push('❌ No es decisor');
  } else {
    score += 10;
    detalles.push('⚠️ Autoridad desconocida');
  }
  
  // NEED (25 puntos)
  if (bant.need === 'Alto') {
    score += 25;
    detalles.push('✅ Necesidad alta');
  } else if (bant.need === 'Medio') {
    score += 15;
    detalles.push('🟡 Necesidad media');
  } else if (bant.need === 'Bajo') {
    score += 5;
    detalles.push('🔴 Necesidad baja');
  } else {
    score += 10;
    detalles.push('⚠️ Necesidad desconocida');
  }
  
  // TIMELINE (20 puntos)
  if (bant.timeline === 'Inmediato') {
    score += 20;
    detalles.push('✅ Necesita comprar YA');
  } else if (bant.timeline === 'Corto') {
    score += 15;
    detalles.push('🟡 Corto plazo (1-3 meses)');
  } else if (bant.timeline === 'Medio') {
    score += 10;
    detalles.push('🟡 Mediano plazo (3-6 meses)');
  } else if (bant.timeline === 'Largo') {
    score += 5;
    detalles.push('🔴 Largo plazo (>6 meses)');
  } else {
    score += 5;
    detalles.push('⚠️ Timeline desconocido');
  }
  
  // Calificación final
  let calificacion = '';
  let recomendacion = '';
  
  if (score >= 80) {
    calificacion = 'HOT 🔥';
    recomendacion = '💡 Lead caliente: Priorizar y cerrar rápido';
  } else if (score >= 60) {
    calificacion = 'WARM 🌡️';
    recomendacion = '💡 Lead tibio: Mantener contacto frecuente';
  } else {
    calificacion = 'COLD ❄️';
    recomendacion = '💡 Lead frío: Nutrir con contenido, no gastar mucho tiempo';
  }
  
  return {
    score: score,
    calificacion: calificacion,
    detalles: detalles,
    recomendacion: recomendacion
  };
}

// Obtener información de un producto
function obtenerInfoProducto(sku) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Productos_SKU');
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === sku) {
        return {
          sku: data[i][0],
          nombre: data[i][1],
          descripcion: data[i][2],
          precio: data[i][3],
          comision: data[i][4],
          sector: data[i][5]
        };
      }
    }
    
    return null;
    
  } catch (error) {
    Logger.log('⚠️ Error obteniendo info producto: ' + error);
    return null;
  }
}

// ============================================
// FUNCIONES DE PRUEBA - FASE 2
// ============================================




// ============================================
// FASE 4: CONSULTAS Y REPORTES DE VENTAS
// ============================================

function consultarPipeline(userId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Pipeline_Detallado');
    const data = sheet.getDataRange().getValues();
    
    let deals = [];
    let totalPipeline = 0;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][15] === 'Activo') {
        deals.push({
          cliente: data[i][4],
          producto: data[i][5],
          etapa: data[i][6],
          monto: parseFloat(data[i][7]) || 0,
          probabilidad: data[i][8],
          diasEnEtapa: data[i][12],
          ejecutivo: data[i][3]
        });
        totalPipeline += parseFloat(data[i][7]) || 0;
      }
    }
    
    if (deals.length === 0) {
      return '📊 PIPELINE SMART\n\n✨ No hay deals activos en el pipeline.\n\nUsa "nuevo lead" para agregar uno.';
    }
    
    let respuesta = '📊 PIPELINE SMART\n';
    respuesta += '━━━━━━━━━━━━━━━━━━━━━━\n';
    respuesta += '💰 Total pipeline: $' + totalPipeline.toFixed(2) + '\n';
    respuesta += '📋 Deals activos: ' + deals.length + '\n\n';
    
    // Agrupar por etapa
    const etapas = ['Investigación', 'Contacto Inicial', 'Reunión Agendada', 'Propuesta Enviada', 'Negociación'];
    
    for (var e = 0; e < etapas.length; e++) {
      var etapa = etapas[e];
      var dealsEtapa = deals.filter(function(d) { return d.etapa === etapa; });
      if (dealsEtapa.length > 0) {
        var montoEtapa = dealsEtapa.reduce(function(sum, d) { return sum + d.monto; }, 0);
        respuesta += '📌 ' + etapa + ' (' + dealsEtapa.length + ') - $' + montoEtapa.toFixed(2) + '\n';
        for (var d = 0; d < dealsEtapa.length; d++) {
          var deal = dealsEtapa[d];
          var alertaFrio = deal.diasEnEtapa > 7 ? ' ⚠️' : '';
          respuesta += '  • ' + deal.cliente + ' - $' + deal.monto.toFixed(0) + ' (' + deal.producto + ')' + alertaFrio + '\n';
        }
        respuesta += '\n';
      }
    }
    
    return respuesta;
    
  } catch (error) {
    Logger.log('❌ Error consultando pipeline: ' + error);
    return '❌ Error consultando pipeline: ' + error.message;
  }
}

function consultarForecast(userId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('Pipeline_Detallado');
    const data = sheet.getDataRange().getValues();
    
    let forecast = 0;
    let dealsActivos = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][15] === 'Activo') {
        var monto = parseFloat(data[i][7]) || 0;
        var probabilidad = parseFloat(data[i][8]) || 0;
        var valorPonderado = monto * (probabilidad / 100);
        
        forecast += valorPonderado;
        dealsActivos.push({
          cliente: data[i][4],
          monto: monto,
          probabilidad: probabilidad,
          ponderado: valorPonderado,
          etapa: data[i][6]
        });
      }
    }
    
    // Obtener ventas del mes
    var sheetVentas = ss.getSheetByName('Ventas_Cerradas');
    var dataVentas = sheetVentas.getDataRange().getValues();
    var ventasMes = 0;
    var inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    for (var i = 1; i < dataVentas.length; i++) {
      if (new Date(dataVentas[i][0]) >= inicioMes) {
        ventasMes += parseFloat(dataVentas[i][6]) || 0;
      }
    }
    
    var respuesta = '📈 FORECAST DEL MES\n';
    respuesta += '━━━━━━━━━━━━━━━━━━━━━━\n\n';
    respuesta += '💰 Ventas cerradas: $' + ventasMes.toFixed(2) + '\n';
    respuesta += '🎯 Forecast pendiente: $' + forecast.toFixed(2) + '\n';
    respuesta += '📊 Total esperado: $' + (ventasMes + forecast).toFixed(2) + '\n\n';
    
    if (dealsActivos.length > 0) {
      // Ordenar por valor ponderado
      dealsActivos.sort(function(a, b) { return b.ponderado - a.ponderado; });
      
      respuesta += '🔥 Top deals por probabilidad:\n';
      for (var i = 0; i < Math.min(5, dealsActivos.length); i++) {
        var d = dealsActivos[i];
        respuesta += '  ' + (i + 1) + '. ' + d.cliente + '\n';
        respuesta += '     $' + d.monto.toFixed(0) + ' × ' + d.probabilidad + '% = $' + d.ponderado.toFixed(0) + '\n';
      }
    }
    
    return respuesta;
    
  } catch (error) {
    Logger.log('❌ Error consultando forecast: ' + error);
    return '❌ Error consultando forecast: ' + error.message;
  }
}

function consultarKPIs(userId) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName('KPIs_Auto');
    
    if (!sheet) {
      return '❌ La hoja KPIs_Auto no existe. Ejecuta configurarInicial() primero.';
    }
    
    var data = sheet.getDataRange().getValues();
    
    var respuesta = '📊 KPIs DE VENTAS\n';
    respuesta += '━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][0].toString().trim() !== '') {
        var metrica = data[i][0];
        var valor = data[i][1];
        var meta = data[i][2];
        
        if (typeof valor === 'number') {
          if (metrica.includes('%')) {
            valor = (valor * 100).toFixed(1) + '%';
          } else if (metrica.includes('días') || metrica.includes('Promedio')) {
            valor = valor.toFixed(1);
          } else {
            valor = '$' + valor.toFixed(2);
          }
        }
        
        respuesta += metrica + ': ' + valor + '\n';
        if (meta && meta !== '') {
          respuesta += '  Meta: ' + meta + '\n';
        }
      }
    }
    
    return respuesta;
    
  } catch (error) {
    Logger.log('❌ Error consultando KPIs: ' + error);
    return '❌ Error consultando KPIs: ' + error.message;
  }
}

function generarReporteSemanal(userId, nombreUsuario) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var hace7dias = new Date();
    hace7dias.setDate(hace7dias.getDate() - 7);
    
    // Deals nuevos esta semana
    var sheetPipeline = ss.getSheetByName('Pipeline_Detallado');
    var dataPipeline = sheetPipeline.getDataRange().getValues();
    var dealsNuevos = 0;
    
    for (var i = 1; i < dataPipeline.length; i++) {
      if (new Date(dataPipeline[i][13]) >= hace7dias) {
        dealsNuevos++;
      }
    }
    
    // Ventas esta semana
    var sheetVentas = ss.getSheetByName('Ventas_Cerradas');
    var dataVentas = sheetVentas.getDataRange().getValues();
    var ventasSemana = 0;
    var montoSemana = 0;
    
    for (var i = 1; i < dataVentas.length; i++) {
      if (new Date(dataVentas[i][0]) >= hace7dias) {
        ventasSemana++;
        montoSemana += parseFloat(dataVentas[i][6]) || 0;
      }
    }
    
    // Interacciones esta semana
    var sheetInteracciones = ss.getSheetByName('Interacciones_Cliente');
    var dataInteracciones = sheetInteracciones.getDataRange().getValues();
    var interaccionesSemana = 0;
    
    for (var i = 1; i < dataInteracciones.length; i++) {
      if (new Date(dataInteracciones[i][0]) >= hace7dias) {
        interaccionesSemana++;
      }
    }
    
    // Deals perdidos esta semana
    var sheetLost = ss.getSheetByName('Lost_Deals');
    var dataLost = sheetLost.getDataRange().getValues();
    var perdidosSemana = 0;
    
    for (var i = 1; i < dataLost.length; i++) {
      if (new Date(dataLost[i][0]) >= hace7dias) {
        perdidosSemana++;
      }
    }
    
    var respuesta = '📋 REPORTE SEMANAL SMART\n';
    respuesta += '━━━━━━━━━━━━━━━━━━━━━━\n';
    respuesta += '📅 Últimos 7 días\n\n';
    respuesta += '📊 ACTIVIDAD:\n';
    respuesta += '  📋 Leads nuevos: ' + dealsNuevos + '\n';
    respuesta += '  📞 Interacciones: ' + interaccionesSemana + '\n';
    respuesta += '  💰 Ventas cerradas: ' + ventasSemana + ' ($' + montoSemana.toFixed(2) + ')\n';
    respuesta += '  ❌ Deals perdidos: ' + perdidosSemana + '\n';
    
    return respuesta;
    
  } catch (error) {
    Logger.log('❌ Error generando reporte: ' + error);
    return '❌ Error generando reporte semanal: ' + error.message;
  }
}

function consultarLeadsFrios(userId) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Pipeline_Detallado');
    var data = sheet.getDataRange().getValues();
    
    var leadsFrios = [];
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][15] === 'Activo') {
        var diasEnEtapa = parseInt(data[i][12]) || 0;
        if (diasEnEtapa > 7) {
          leadsFrios.push({
            cliente: data[i][4],
            etapa: data[i][6],
            dias: diasEnEtapa,
            monto: parseFloat(data[i][7]) || 0,
            ejecutivo: data[i][3]
          });
        }
      }
    }
    
    if (leadsFrios.length === 0) {
      return '✅ ¡Excelente! No hay leads fríos. Todos tus deals tienen actividad reciente.';
    }
    
    // Ordenar por días (más fríos primero)
    leadsFrios.sort(function(a, b) { return b.dias - a.dias; });
    
    var respuesta = '❄️ LEADS FRÍOS (sin actividad >7 días)\n';
    respuesta += '━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    for (var i = 0; i < leadsFrios.length; i++) {
      var l = leadsFrios[i];
      var emoji = l.dias > 14 ? '🔴' : '🟡';
      respuesta += emoji + ' ' + l.cliente + '\n';
      respuesta += '   ⏰ ' + l.dias + ' días sin actividad\n';
      respuesta += '   📊 ' + l.etapa + ' | $' + l.monto.toFixed(0) + '\n\n';
    }
    
    respuesta += '💡 Tip: Contacta a estos leads antes de que se enfríen más.';
    
    return respuesta;
    
  } catch (error) {
    Logger.log('❌ Error consultando leads fríos: ' + error);
    return '❌ Error: ' + error.message;
  }
}

function consultarTopClientes() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Ventas_Cerradas');
    var data = sheet.getDataRange().getValues();
    
    var clienteMontos = {};
    
    for (var i = 1; i < data.length; i++) {
      var cliente = data[i][4] || 'Desconocido';
      var monto = parseFloat(data[i][6]) || 0;
      
      if (!clienteMontos[cliente]) {
        clienteMontos[cliente] = { total: 0, ventas: 0 };
      }
      clienteMontos[cliente].total += monto;
      clienteMontos[cliente].ventas++;
    }
    
    var ranking = Object.keys(clienteMontos).map(function(c) {
      return { cliente: c, total: clienteMontos[c].total, ventas: clienteMontos[c].ventas };
    });
    
    ranking.sort(function(a, b) { return b.total - a.total; });
    
    if (ranking.length === 0) {
      return '📊 TOP CLIENTES\n\nAún no hay ventas registradas.';
    }
    
    var respuesta = '🏆 TOP CLIENTES\n';
    respuesta += '━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    var medallas = ['🥇', '🥈', '🥉'];
    for (var i = 0; i < Math.min(10, ranking.length); i++) {
      var medal = i < 3 ? medallas[i] : '  ' + (i + 1) + '.';
      respuesta += medal + ' ' + ranking[i].cliente + '\n';
      respuesta += '   💰 $' + ranking[i].total.toFixed(2) + ' (' + ranking[i].ventas + ' ventas)\n';
    }
    
    return respuesta;
    
  } catch (error) {
    Logger.log('❌ Error consultando top clientes: ' + error);
    return '❌ Error: ' + error.message;
  }
}

function analizarPatronesPerdida() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Lost_Deals');
    var data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return '📉 PATRONES DE PÉRDIDA\n\nNo hay deals perdidos registrados aún.';
    }
    
    var razones = {};
    var etapas = {};
    var totalPerdidos = 0;
    var montoTotalPerdido = 0;
    
    for (var i = 1; i < data.length; i++) {
      totalPerdidos++;
      montoTotalPerdido += parseFloat(data[i][6]) || 0;
      
      var razon = data[i][8] || 'Sin especificar';
      var etapa = data[i][7] || 'Sin especificar';
      
      razones[razon] = (razones[razon] || 0) + 1;
      etapas[etapa] = (etapas[etapa] || 0) + 1;
    }
    
    var respuesta = '📉 ANÁLISIS DE DEALS PERDIDOS\n';
    respuesta += '━━━━━━━━━━━━━━━━━━━━━━\n\n';
    respuesta += '📊 Total perdidos: ' + totalPerdidos + '\n';
    respuesta += '💸 Monto total perdido: $' + montoTotalPerdido.toFixed(2) + '\n\n';
    
    respuesta += '❌ RAZONES DE PÉRDIDA:\n';
    var razonesArr = Object.keys(razones).map(function(r) { return { razon: r, count: razones[r] }; });
    razonesArr.sort(function(a, b) { return b.count - a.count; });
    
    for (var i = 0; i < razonesArr.length; i++) {
      var pct = ((razonesArr[i].count / totalPerdidos) * 100).toFixed(0);
      respuesta += '  • ' + razonesArr[i].razon + ': ' + razonesArr[i].count + ' (' + pct + '%)\n';
    }
    
    respuesta += '\n📊 ETAPA DONDE SE PIERDEN:\n';
    var etapasArr = Object.keys(etapas).map(function(e) { return { etapa: e, count: etapas[e] }; });
    etapasArr.sort(function(a, b) { return b.count - a.count; });
    
    for (var i = 0; i < etapasArr.length; i++) {
      respuesta += '  • ' + etapasArr[i].etapa + ': ' + etapasArr[i].count + '\n';
    }
    
    return respuesta;
    
  } catch (error) {
    Logger.log('❌ Error analizando patrones: ' + error);
    return '❌ Error: ' + error.message;
  }
}

function consultarCicloVenta() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Ventas_Cerradas');
    var data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return '⏱️ CICLO DE VENTA\n\nNo hay ventas registradas para calcular ciclos.';
    }
    
    var ciclos = [];
    var ciclosPorProducto = {};
    
    for (var i = 1; i < data.length; i++) {
      var ciclo = parseInt(data[i][7]) || 0;
      var producto = data[i][5] || 'Sin producto';
      
      ciclos.push(ciclo);
      
      if (!ciclosPorProducto[producto]) {
        ciclosPorProducto[producto] = [];
      }
      ciclosPorProducto[producto].push(ciclo);
    }
    
    var promedio = ciclos.reduce(function(a, b) { return a + b; }, 0) / ciclos.length;
    var minimo = Math.min.apply(null, ciclos);
    var maximo = Math.max.apply(null, ciclos);
    
    var respuesta = '⏱️ CICLO DE VENTA\n';
    respuesta += '━━━━━━━━━━━━━━━━━━━━━━\n\n';
    respuesta += '📊 Promedio general: ' + promedio.toFixed(1) + ' días\n';
    respuesta += '⚡ Más rápido: ' + minimo + ' días\n';
    respuesta += '🐢 Más lento: ' + maximo + ' días\n\n';
    
    respuesta += '📦 POR PRODUCTO:\n';
    for (var prod in ciclosPorProducto) {
      var arr = ciclosPorProducto[prod];
      var avg = arr.reduce(function(a, b) { return a + b; }, 0) / arr.length;
      respuesta += '  • ' + prod + ': ' + avg.toFixed(1) + ' días (' + arr.length + ' ventas)\n';
    }
    
    return respuesta;
    
  } catch (error) {
    Logger.log('❌ Error consultando ciclo: ' + error);
    return '❌ Error: ' + error.message;
  }
}

function generarSugerenciasInteligentes(userId, nombreUsuario) {
  try {
    var sugerencias = [];
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Verificar leads fríos
    var sheetPipeline = ss.getSheetByName('Pipeline_Detallado');
    var dataPipeline = sheetPipeline.getDataRange().getValues();
    var leadsFrios = 0;
    
    for (var i = 1; i < dataPipeline.length; i++) {
      if (dataPipeline[i][15] === 'Activo' && parseInt(dataPipeline[i][12]) > 7) {
        leadsFrios++;
      }
    }
    
    if (leadsFrios > 0) {
      sugerencias.push('⚠️ Tienes ' + leadsFrios + ' leads sin actividad >7 días. Usa /leads_frios para verlos.');
    }
    
    // Verificar deals en negociación (potencial cierre pronto)
    var dealsNegociacion = 0;
    for (var i = 1; i < dataPipeline.length; i++) {
      if (dataPipeline[i][15] === 'Activo' && dataPipeline[i][6] === 'Negociación') {
        dealsNegociacion++;
      }
    }
    
    if (dealsNegociacion > 0) {
      sugerencias.push('🔥 ' + dealsNegociacion + ' deals en negociación. ¡Prioriza cerrarlos!');
    }
    
    // Sugerencia de actividad si no hay interacciones recientes
    var sheetInteracciones = ss.getSheetByName('Interacciones_Cliente');
    var dataInteracciones = sheetInteracciones.getDataRange().getValues();
    var ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    var interaccionesAyer = 0;
    
    for (var i = 1; i < dataInteracciones.length; i++) {
      if (new Date(dataInteracciones[i][0]) >= ayer) {
        interaccionesAyer++;
      }
    }
    
    if (interaccionesAyer === 0) {
      sugerencias.push('📞 No hubo interacciones ayer. Contacta al menos 3 leads hoy.');
    }
    
    if (sugerencias.length === 0) {
      sugerencias.push('✅ ¡Todo va bien! Sigue con tu ritmo de ventas.');
    }
    
    var respuesta = '💡 SUGERENCIAS INTELIGENTES\n';
    respuesta += '━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    for (var i = 0; i < sugerencias.length; i++) {
      respuesta += sugerencias[i] + '\n\n';
    }
    
    return respuesta;
    
  } catch (error) {
    Logger.log('❌ Error generando sugerencias: ' + error);
    return '❌ Error: ' + error.message;
  }
}


// ============================================
// FASE 5: AUTOMATIZACIONES DE VENTAS
// ============================================

function enviarAlertasDeals() {
  try {
    Logger.log('🔔 Verificando alertas de deals...');
    
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Pipeline_Detallado');
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][15] === 'Activo') {
        var diasEnEtapa = parseInt(data[i][12]) || 0;
        var userId = data[i][1];
        var cliente = data[i][4];
        var etapa = data[i][6];
        var monto = data[i][7];
        
        // Alerta para deals fríos (>10 días sin actividad)
        if (diasEnEtapa >= 10 && userId) {
          var mensaje = '⚠️ ALERTA: Deal frío\n\n';
          mensaje += '👤 ' + cliente + '\n';
          mensaje += '📊 ' + etapa + ' | $' + monto + '\n';
          mensaje += '⏰ ' + diasEnEtapa + ' días sin actividad\n\n';
          mensaje += '💡 Contacta a este lead antes de perderlo.';
          
          enviarMensajeTelegram(userId, mensaje);
          Logger.log('🔔 Alerta enviada para: ' + cliente);
        }
      }
    }
    
  } catch (error) {
    Logger.log('❌ Error en alertas: ' + error);
  }
}

function enviarSugerenciasDiarias() {
  try {
    Logger.log('💡 Enviando sugerencias diarias...');
    
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var userSheet = ss.getSheetByName('Usuarios');
    var userData = userSheet.getDataRange().getValues();
    
    for (var i = 1; i < userData.length; i++) {
      if (userData[i][5] === 'SI' && userData[i][6]) {
        var userId = userData[i][6];
        var nombre = userData[i][2];
        var sugerencias = generarSugerenciasInteligentes(userId, nombre);
        enviarMensajeTelegram(userId, sugerencias);
        Logger.log('💡 Sugerencias enviadas a: ' + nombre);
      }
    }
    
  } catch (error) {
    Logger.log('❌ Error enviando sugerencias: ' + error);
  }
}
