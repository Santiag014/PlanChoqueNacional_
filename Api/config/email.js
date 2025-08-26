/**
 * @fileoverview Configuración y servicio de emails
 * 
 * Este módulo maneja el envío de emails automáticos usando nodemailer
 * con SMTP. Incluye plantillas para diferentes tipos de notificaciones.
 * 
 * @author Plan Choque Terpel Team
 * @version 1.0.0
 * @requires nodem/**
 * Verifica la configuración de email con reintentos
 * @returns {Promise<boolean>} True si la configuración es válida
 */
export async function verificarConfiguracionEmail() {
  const maxReintentos = 3;
  
  for (let intento = 1; intento <= maxReintentos; intento++) {
    try {
      console.log(`🔍 [Intento ${intento}/${maxReintentos}] Verificando configuración SMTP...`);
      await transporter.verify();
      console.log('✅ Configuración de email verificada correctamente');
      return true;
    } catch (error) {
      console.error(`❌ Error en verificación (intento ${intento}/${maxReintentos}):`, error.message);
      
      if (intento < maxReintentos) {
        const tiempoEspera = intento * 1000; // 1s, 2s, 3s
        console.log(`⏳ Esperando ${tiempoEspera}ms antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, tiempoEspera));
      }
    }
  }
  
  console.error('❌ Configuración de email no disponible después de todos los intentos');
  return false;
}

/**
 * @fileoverview Configuración y servicio de emails
 * 
 * Este módulo maneja el envío de emails automáticos usando nodemailer
 * con SMTP. Incluye plantillas para diferentes tipos de notificaciones.
 * 
 * @author Plan Choque Terpel Team
 * @version 1.0.0
 * @requires nodemailer
 */

import nodemailer from 'nodemailer';

// Configuración del transportador SMTP para Hostinger (quemada en código)
const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com', // Servidor SMTP de Hostinger
  port: 465, // Cambiando de vuelta a 587 que suele ser más compatible
  secure: true, // true para 465, false para otros puertos
  auth: {
    user: 'consultas@plandelamejorenergia.com', // Email de Hostinger configurado
    pass: 'Iglumarketing2025-'  // Contraseña del email
  },
  tls: {
    rejectUnauthorized: false, // Para evitar problemas con certificados
    ciphers: 'SSLv3' // Añadir soporte para diferentes ciphers
  },
  // Configuraciones adicionales para mejorar la estabilidad
  connectionTimeout: 60000, // 60 segundos - más tiempo
  greetingTimeout: 30000, // 30 segundos
  socketTimeout: 60000, // 60 segundos
  pool: true, // Usar pool de conexiones
  maxConnections: 5, // Máximo 5 conexiones concurrentes
  maxMessages: 100, // Máximo 100 mensajes por conexión
  rateLimit: 14, // Máximo 14 mensajes por segundo
  // Forzar autenticación específica
  auth: {
    user: 'consultas@plandelamejorenergia.com',
    pass: 'Iglumarketing2025-'
  },
  // Configuración adicional para Hostinger
  requireTLS: true,
  authMethod: 'PLAIN'
});

/**
 * Función auxiliar para enviar emails con reintentos automáticos
 * @param {Object} mailOptions - Opciones del email
 * @param {number} maxReintentos - Número máximo de reintentos
 * @returns {Promise<Object>} Resultado del envío
 */
async function enviarEmailConReintentos(mailOptions, maxReintentos = 3) {
  let ultimoError;
  
  for (let intento = 1; intento <= maxReintentos; intento++) {
    try {
      console.log(`📧 [Intento ${intento}/${maxReintentos}] Enviando email a: ${mailOptions.to}`);
      
      // Verificar conexión antes de enviar
      if (intento === 1) {
        await transporter.verify();
        console.log('✅ Conexión SMTP verificada correctamente');
      }
      
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Email enviado exitosamente en intento ${intento}:`, info.messageId);
      
      return {
        success: true,
        messageId: info.messageId,
        intento: intento
      };
      
    } catch (error) {
      ultimoError = error;
      console.error(`❌ Error en intento ${intento}/${maxReintentos}:`, error.message);
      
      // Si no es el último intento, esperar antes de reintentar
      if (intento < maxReintentos) {
        const tiempoEspera = intento * 2000; // 2s, 4s, 6s...
        console.log(`⏳ Esperando ${tiempoEspera}ms antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, tiempoEspera));
      }
    }
  }
  
  // Si llegamos aquí, todos los intentos fallaron
  throw ultimoError;
}

/**
 * Envía email de notificación cuando cambia el estado de una propuesta
 * @param {Object} datos - Datos para el email
 * @param {string} datos.emailAsesor - Email del asesor
 * @param {string} datos.nombreAsesor - Nombre del asesor
 * @param {string} datos.registroId - ID del registro
 * @param {string} datos.codigoPdv - Código del punto de venta
 * @param {string} datos.nombrePdv - Nombre del punto de venta
 * @param {string} datos.fechaRegistro - Fecha de registro del servicio
 * @param {string} datos.fechaCreacion - Fecha de creación del registro
 * @param {number} datos.nuevoEstado - Nuevo estado (2: aprobado, 3: rechazado)
 * @param {string} datos.comentario - Comentario de mercadeo
 * @param {string} datos.nombreMercadeo - Nombre del usuario de mercadeo
 * @returns {Promise<Object>} Resultado del envío
 */
export async function enviarNotificacionCambioEstado(datos) {
  const {
    emailAsesor,
    nombreAsesor,
    registroId,
    codigoPdv,
    nombrePdv,
    fechaRegistro,
    fechaCreacion,
    nuevoEstado,
    comentario,
    nombreMercadeo
  } = datos;

  // Determinar el estado en texto
  const estadoTexto = nuevoEstado === 2 ? 'APROBADO' : 'RECHAZADO';
  const colorEstado = nuevoEstado === 2 ? '#28a745' : '#dc3545';
  const iconoEstado = nuevoEstado === 2 ? '✅' : '❌';

  // Formatear fechas
  const fechaRegistroFormateada = fechaRegistro ? 
    new Date(fechaRegistro).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }) : 'No especificada';

  const fechaCreacionFormateada = fechaCreacion ?
    new Date(fechaCreacion).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'No especificada';

  // Asunto del email
  const asunto = `Notificación de Evaluación - Propuesta ${estadoTexto}`;

  // Plantilla HTML del email
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notificación de Estado de Propuesta</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            background-color: ${colorEstado};
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .content {
            padding: 20px 0;
        }
        .info-box {
            background-color: #f8f9fa;
            padding: 20px;
            border-left: 4px solid ${colorEstado};
            margin: 20px 0;
            border-radius: 5px;
        }
        .info-box h3 {
            margin-top: 0;
            color: #333;
            font-size: 16px;
        }
        .footer {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            background-color: ${colorEstado};
            color: white;
            border-radius: 20px;
            font-weight: bold;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${iconoEstado} Notificación de Evaluación de Propuesta</h1>
            <div class="status-badge">${estadoTexto}</div>
        </div>
        
        <div class="content">
            <h2>Estimado/a ${nombreAsesor},</h2>
            
            <p>Nos dirigimos a usted para informarle que su propuesta comercial ha sido evaluada por nuestro equipo de Mercadeo.</p>
            
            <div class="info-box">
                <h3>📋 Detalles de la Propuesta</h3>
                <p><strong>Código PDV:</strong> ${codigoPdv || 'No especificado'}</p>
                <p><strong>Punto de Venta:</strong> ${nombrePdv || 'No especificado'}</p>
                <p><strong>Fecha de la factura:</strong> ${fechaRegistroFormateada}</p>
                <p><strong>Fecha de Creación:</strong> ${fechaCreacionFormateada}</p>
                <p><strong>Estado de Evaluación:</strong> <span style="color: ${colorEstado}; font-weight: bold;">${estadoTexto}</span></p>
            </div>
            
            ${comentario ? `
            <div class="info-box">
                <h3>💬 Observaciones del Equipo de Mercadeo</h3>
                <p style="font-style: italic; background-color: #f8f9fa; padding: 10px; border-radius: 5px; border-left: 3px solid ${colorEstado};">"${comentario}"</p>
            </div>
            ` : ''}
            
            ${nuevoEstado === 2 ? 
              '<div style="background-color: #d4edda; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745; margin: 20px 0;"><p style="color: #155724; margin: 0;"><strong>🎉 ¡Felicitaciones!</strong> Su propuesta ha sido aprobada. Le felicitamos por el excelente trabajo realizado y le animamos a continuar con esta calidad en sus futuros registros.</p></div>' :
              '<div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545; margin: 20px 0;"><p style="color: #721c24; margin: 0;"><strong>📝 Propuesta requiere ajustes:</strong> Su propuesta necesita algunas mejoras para cumplir con nuestros estándares. Por favor, revise las observaciones mencionadas y realice las correcciones necesarias.</p></div>'
            }
            
            <p>Para cualquier consulta o aclaración sobre esta evaluación, no dude en contactar a nuestro equipo de Mercadeo, quienes estarán disponibles para brindarle el apoyo necesario.</p>
            
            <p style="margin-top: 30px;">Cordialmente,</p>
            <p style="margin: 0;"><strong>Equipo de Mercadeo</strong><br>
            <em>Plan de la Mejor Energía - Terpel</em></p>
        </div>
        
        <div class="footer">
            <p><strong>Plan de la Mejor Energía - Terpel</strong></p>
            <p>Este es un mensaje automático del sistema. Por favor, no responda a este correo electrónico.</p>
            <p>Para consultas, contacte a su supervisor o al equipo de Mercadeo.</p>
        </div>
    </div>
</body>
</html>`;

  // Texto plano para clientes que no soportan HTML
  const textoPlano = `
PLAN DE LA MEJOR ENERGÍA - TERPEL
Notificación de Evaluación de Propuesta

Estimado/a ${nombreAsesor},

Nos dirigimos a usted para informarle que su propuesta comercial ha sido evaluada por nuestro equipo de Mercadeo.

DETALLES DE LA PROPUESTA:
- Código PDV: ${codigoPdv || 'No especificado'}
- Punto de Venta: ${nombrePdv || 'No especificado'}
- Fecha de Registro del Servicio: ${fechaRegistroFormateada}
- Fecha de Envío: ${fechaCreacionFormateada}
- Estado de Evaluación: ${estadoTexto}

${comentario ? `OBSERVACIONES DEL EQUIPO DE MERCADEO:\n"${comentario}"\n\n` : ''}

${nuevoEstado === 2 ? 
  '¡FELICITACIONES! Su propuesta ha sido aprobada. Le felicitamos por el excelente trabajo realizado.' :
  'PROPUESTA REQUIERE AJUSTES: Su propuesta necesita algunas mejoras. Por favor, revise las observaciones y realice las correcciones necesarias.'
}

Para cualquier consulta sobre esta evaluación, contacte a nuestro equipo de Mercadeo.

Cordialmente,
Equipo de Mercadeo
Plan de la Mejor Energía - Terpel

---
Este es un mensaje automático del sistema. No responda a este correo.
`;

  try {
    // Configurar el mensaje
    const mailOptions = {
      from: {
        name: 'Plan de la Mejor Energía - Terpel',
        address: 'consultas@plandelamejorenergia.com'
      },
      to: emailAsesor,
      cc: ['Santiago.Parraga@bulmarketing.com.co','Juan.Adarme@bullmarketing.com.co'], 
      subject: asunto,
      text: textoPlano,
      html: htmlTemplate,
      priority: 'normal',
      headers: {
        'X-Mailer': 'Plan de la Mejor Energía System',
        'X-Priority': '3'
      }
    };

    // Enviar el email con reintentos automáticos
    const resultado = await enviarEmailConReintentos(mailOptions);
    
    console.log('✅ Email de notificación enviado exitosamente:', resultado.messageId);
    console.log('📧 Destinatarios:', emailAsesor, '+ CC:', 'Santiago.Parraga@bulmarketing.com.co');
    console.log(`🔄 Email enviado en intento número: ${resultado.intento}`);
    
    return {
      success: true,
      messageId: resultado.messageId,
      intento: resultado.intento,
      destinatarios: {
        principal: emailAsesor,
        copia: 'Santiago.Parraga@bulmarketing.com.co'
      }
    };

  } catch (error) {
    console.error('❌ Error enviando email de notificación:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Envía email de notificación administrativa a Santiago
 * @param {Object} datos - Datos para el email
 * @param {string} datos.asunto - Asunto del email
 * @param {string} datos.mensaje - Mensaje del email
 * @param {string} datos.detalles - Detalles adicionales (opcional)
 * @returns {Promise<Object>} Resultado del envío
 */
export async function enviarNotificacionAdministrativa(datos) {
  const { asunto, mensaje, detalles = '' } = datos;
  
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-case=1.0">
    <title>Notificación Administrativa</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border-radius: 8px; }
        .header { background-color: #007bff; color: white; padding: 15px; border-radius: 5px; text-align: center; }
        .content { background-color: white; padding: 20px; margin: 10px 0; border-radius: 5px; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>🔔 Notificación Administrativa - Plan de la Mejor Energia</h2>
        </div>
        <div class="content">
            <h3>📌 ${asunto}</h3>
            <p><strong>Mensaje:</strong></p>
            <p>${mensaje}</p>
            ${detalles ? `<p><strong>Detalles:</strong></p><p>${detalles}</p>` : ''}
            <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-CO')}</p>
        </div>
        <div class="footer">
            <p>Sistema Plan de la Mejor Energia - Notificación Automática</p>
        </div>
    </div>
</body>
</html>`;

  try {
    const mailOptions = {
      from: {
        name: 'Terpel Plan Choque - Sistema',
        address: 'consultas@plandelamejorenergia.com'
      },
      to: 'Santiago.Parraga@bulmarketing.com.co',
      subject: `🔔 [ADMIN] ${asunto}`,
      html: htmlTemplate,
      priority: 'high'
    };

    const resultado = await enviarEmailConReintentos(mailOptions);
    
    console.log('✅ Email administrativo enviado a Santiago:', resultado.messageId);
    console.log(`🔄 Email enviado en intento número: ${resultado.intento}`);
    
    return {
      success: true,
      messageId: resultado.messageId,
      intento: resultado.intento,
      destinatario: 'Santiago.Parraga@bulmarketing.com.co'
    };
  } catch (error) {
    console.error('❌ Error enviando email administrativo:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export default {
  enviarNotificacionCambioEstado,
  verificarConfiguracionEmail,
  enviarNotificacionAdministrativa
};
