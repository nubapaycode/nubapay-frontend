import type { Metadata } from 'next'
import Link from 'next/link'
import SiteNavbar from '@/components/SiteNavbar'

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Política de privacidad y protección de datos personales de Nubapay.',
}

type Section = { num: string; title: string; body: string; children?: { subtitle: string; body: string }[] }

const sections: Section[] = [
  {
    num: '1',
    title: 'Identificación del responsable',
    body: `La plataforma Nubapay es operada por:\n\nRazón social / titular: [completar]\nCUIT / identificación fiscal: [completar]\nDomicilio legal: [completar]\nCorreo de contacto: [completar]\nSitio web: [completar]\nJurisdicción: República Argentina\n\nEn adelante, "Nubapay", "la Plataforma", "nosotros" o "el Responsable".`,
  },
  {
    num: '2',
    title: 'Alcance de esta Política',
    body: `Esta Política de Privacidad aplica a todas las personas que interactúen con Nubapay, incluyendo:\n\n• Asistentes o compradores que realizan pedidos en eventos.\n• Organizadores que contratan o administran la Plataforma.\n• Staff, operadores, cajeros, supervisores o usuarios autorizados por el Organizador.\n• Personas que acceden a la landing, sitio web o web app.\n• Personas que se contactan con Nubapay por soporte, WhatsApp, email, formularios u otros canales.\n• Usuarios que interactúan con integraciones, agentes automatizados o sistemas de mensajería conectados a Nubapay.\n\nCuando el Organizador recolecte o trate datos por cuenta propia, o cuando use la información fuera de Nubapay, será responsable de cumplir con sus propias obligaciones legales y de privacidad.`,
  },
  {
    num: '3',
    title: 'Marco legal aplicable',
    body: `Esta Política se interpreta conforme la normativa aplicable en materia de protección de datos personales en la República Argentina, incluyendo la Ley 25.326 de Protección de Datos Personales y sus normas complementarias.\n\nLa Agencia de Acceso a la Información Pública (AAIP) es la autoridad de aplicación de la Ley 25.326 en Argentina.\n\nLa Ley 25.326 reconoce a los titulares de datos personales derechos de información, acceso, rectificación, actualización y supresión respecto de sus datos.`,
  },
  {
    num: '4',
    title: 'Qué datos personales podemos recolectar',
    body: `Nubapay podrá recolectar y tratar diferentes categorías de datos personales, según el tipo de usuario y el uso de la Plataforma.`,
    children: [
      {
        subtitle: '4.1. Datos de identificación',
        body: `• Nombre y apellido.\n• DNI, CUIT, CUIL o identificación fiscal, si corresponde.\n• Razón social o nombre comercial.\n• Cargo o rol dentro de una organización.\n• Nombre de usuario o identificador interno.`,
      },
      {
        subtitle: '4.2. Datos de contacto',
        body: `• Correo electrónico.\n• Número de teléfono.\n• WhatsApp.\n• Dirección comercial o fiscal.\n• Canales de contacto declarados por el usuario.`,
      },
      {
        subtitle: '4.3. Datos de cuenta y acceso',
        body: `• Credenciales de acceso.\n• Rol asignado dentro de la Plataforma.\n• Permisos de usuario.\n• Historial de inicio de sesión.\n• Identificadores de sesión.\n• Registros de actividad dentro del panel.\n• Fecha, hora y dispositivo de acceso.\n\nLas contraseñas se almacenan mediante mecanismos técnicos de protección adecuados como hash u otros estándares razonables de seguridad.`,
      },
      {
        subtitle: '4.4. Datos de pedidos',
        body: `• Productos seleccionados y cantidades.\n• Precio y estado del pedido.\n• Evento y punto de retiro asignado.\n• Fecha y hora de compra y retiro.\n• Código o identificador del pedido.\n• QR de retiro e historial de validación.\n• Observaciones o instrucciones relacionadas al pedido.`,
      },
      {
        subtitle: '4.5. Datos de pagos',
        body: `• Medio de pago utilizado.\n• Estado, monto y moneda.\n• Fecha y hora de la operación.\n• Identificador de transacción y del proveedor de pago.\n• Información parcial, tokenizada o enmascarada del medio de pago.\n• Comprobantes o registros de pago.\n\nNubapay no almacena datos completos de tarjetas de crédito o débito. Los pagos pueden ser procesados por proveedores externos que aplican sus propias políticas de privacidad.`,
      },
      {
        subtitle: '4.6. Datos técnicos y de navegación',
        body: `• Dirección IP.\n• Tipo de dispositivo, sistema operativo y navegador.\n• Fecha y hora de acceso.\n• Páginas visitadas e interacciones dentro de la Plataforma.\n• Cookies y tecnologías similares.\n• Datos de rendimiento, errores o fallas técnicas.\n• Información de ubicación aproximada derivada de la IP.`,
      },
      {
        subtitle: '4.7. Datos de soporte y comunicaciones',
        body: `• Mensajes enviados por email, WhatsApp, formularios, chat o redes sociales.\n• Consultas, reclamos o solicitudes.\n• Archivos adjuntos y capturas de pantalla compartidas.\n• Historial de conversaciones y respuestas de soporte.`,
      },
      {
        subtitle: '4.8. Datos de organizadores y eventos',
        body: `• Datos comerciales e información del evento.\n• Catálogo de productos, precios, stock y promociones.\n• Puntos de retiro y usuarios de staff.\n• Configuración operativa.\n• Reportes de ventas y métricas.\n• Datos fiscales o de facturación.`,
      },
      {
        subtitle: '4.9. Datos del staff u operadores',
        body: `• Nombre, correo electrónico y teléfono.\n• Rol y permisos asignados.\n• Pedidos gestionados y QR escaneados.\n• Acciones realizadas en el panel.\n• Fecha y hora de actividad.`,
      },
      {
        subtitle: '4.10. Datos de métricas y analítica',
        body: `• Cantidad de pedidos y productos más vendidos.\n• Ventas totales y horarios de mayor demanda.\n• Rendimiento por punto de retiro.\n• Tiempos de preparación y entrega.\n• Intentos de escaneo de QR.\n• Patrones de uso de la Plataforma.\n\nCuando sea posible, estos datos se utilizarán de forma agregada o anonimizada.`,
      },
    ],
  },
  {
    num: '5',
    title: 'Datos sensibles',
    body: `Nubapay no solicita intencionalmente datos sensibles tales como datos de salud, origen racial o étnico, opiniones políticas, convicciones religiosas, afiliación sindical, información genética, biométrica o vida sexual.\n\nEl usuario se compromete a no enviar datos sensibles salvo que sea estrictamente necesario y exista una base legal válida. Si Nubapay recibe datos sensibles de forma accidental, podrá eliminarlos o bloquearlos.`,
  },
  {
    num: '6',
    title: 'Datos de menores de edad',
    body: `Nubapay no está dirigida principalmente a menores de edad. En eventos donde puedan participar menores, el Organizador será responsable de cumplir las normas aplicables.\n\nSi un padre, madre, tutor o representante legal considera que un menor proporcionó datos sin autorización, podrá contactarse con Nubapay para solicitar la revisión, eliminación o bloqueo de dichos datos.`,
  },
  {
    num: '7',
    title: 'Finalidades del tratamiento',
    body: `Nubapay podrá tratar datos personales para las siguientes finalidades:`,
    children: [
      {
        subtitle: '7.1. Prestación del servicio',
        body: `Permitir el acceso a la Plataforma, crear cuentas, mostrar catálogos, procesar pedidos, generar QR de retiro, validar entregas, gestionar puntos de retiro y operar paneles administrativos.`,
      },
      {
        subtitle: '7.2. Gestión de pagos',
        body: `Procesar pagos, confirmar operaciones, asociar pagos con pedidos, gestionar devoluciones o reembolsos, conciliar operaciones y cumplir obligaciones contables, fiscales o legales.`,
      },
      {
        subtitle: '7.3. Prevención de fraude y seguridad',
        body: `Validar QR únicos, evitar retiros duplicados, detectar operaciones sospechosas, prevenir accesos no autorizados, monitorear actividad anómala e investigar incidentes.`,
      },
      {
        subtitle: '7.4. Soporte y atención al usuario',
        body: `Responder consultas, gestionar reclamos, resolver problemas técnicos, brindar asistencia y dar seguimiento a incidencias.`,
      },
      {
        subtitle: '7.5. Comunicación operativa',
        body: `Enviar confirmaciones de pedido, estados de pago, QR de retiro, cambios en el pedido, información del evento, alertas operativas y avisos de seguridad.`,
      },
      {
        subtitle: '7.6. Mejora de la Plataforma',
        body: `Analizar el uso del sistema, corregir errores, mejorar funcionalidades, optimizar la experiencia de usuario y desarrollar nuevas herramientas.`,
      },
      {
        subtitle: '7.7. Métricas y reportes',
        body: `Generar reportes sobre ventas, pedidos, productos, puntos de retiro, tiempos de atención, rendimiento del evento y demanda por horario. Estos reportes pueden ser compartidos con el Organizador correspondiente.`,
      },
      {
        subtitle: '7.8. Marketing y comunicaciones comerciales',
        body: `Cuando corresponda, enviar información sobre servicios, novedades, promociones, invitaciones y encuestas de satisfacción. El usuario podrá solicitar dejar de recibir comunicaciones comerciales en cualquier momento.`,
      },
      {
        subtitle: '7.9. Cumplimiento legal',
        body: `Cumplir obligaciones legales, responder requerimientos de autoridades, conservar registros contables o fiscales, gestionar reclamos y defender derechos.`,
      },
    ],
  },
  {
    num: '8',
    title: 'Bases legales para el tratamiento',
    body: `Nubapay podrá tratar datos personales sobre la base de:\n\n• El consentimiento del usuario.\n• La ejecución de una relación contractual o precontractual.\n• El cumplimiento de obligaciones legales.\n• El interés legítimo de Nubapay, del Organizador o de terceros, siempre que no prevalezcan derechos del titular de los datos.\n• La necesidad de prevenir fraude y proteger la seguridad de la Plataforma.\n• La gestión de reclamos, defensa de derechos o cumplimiento de requerimientos de autoridad competente.`,
  },
  {
    num: '9',
    title: 'Cómo recolectamos los datos',
    body: `Podemos obtener datos personales de las siguientes formas:\n\n• Directamente del usuario, cuando completa formularios, realiza pedidos o crea cuentas.\n• A través del Organizador, cuando carga información de eventos, staff o usuarios autorizados.\n• Automáticamente, mediante cookies, logs e identificadores técnicos.\n• A través de proveedores externos, como pasarelas de pago o herramientas de analítica.\n• A través de integraciones con canales de comunicación como WhatsApp, email o chat web.\n• A partir del uso de la Plataforma, mediante registros operativos y validaciones de QR.`,
  },
  {
    num: '10',
    title: 'Con quién compartimos datos personales',
    body: `Nubapay podrá compartir datos personales únicamente cuando sea necesario para operar la Plataforma, cumplir obligaciones legales, brindar soporte o mejorar el servicio.`,
    children: [
      {
        subtitle: '10.1. Con Organizadores',
        body: `Compartimos datos vinculados a pedidos realizados en su evento: nombre o identificador del comprador, detalle del pedido, estado del pago, QR de retiro, punto de retiro, estado de entrega y métricas. El Organizador deberá usar dichos datos únicamente para gestionar el evento.`,
      },
      {
        subtitle: '10.2. Con proveedores de pago',
        body: `Compartimos información con pasarelas de pago, bancos, billeteras virtuales y procesadores para procesar pagos, confirmar operaciones, gestionar reembolsos y prevenir fraude.`,
      },
      {
        subtitle: '10.3. Con proveedores tecnológicos',
        body: `Compartimos datos con proveedores de hosting, bases de datos, infraestructura cloud, email, mensajería, soporte, analítica, monitoreo, seguridad, automatización e inteligencia artificial. Estos proveedores deben tratar los datos conforme instrucciones de Nubapay.`,
      },
      {
        subtitle: '10.4. Con integraciones de mensajería o agentes automatizados',
        body: `Nubapay podrá integrarse con herramientas de mensajería, automatización o agentes de IA para responder consultas, enviar confirmaciones y asistir en la operación. Estas herramientas procesan únicamente los datos necesarios para cumplir dichas funciones.`,
      },
      {
        subtitle: '10.5. Con autoridades por obligación legal',
        body: `Compartimos datos para cumplir obligaciones legales, responder requerimientos judiciales o administrativos, cooperar con autoridades competentes, proteger derechos de Nubapay o investigar fraude.`,
      },
    ],
  },
  {
    num: '11',
    title: 'Transferencias internacionales de datos',
    body: `Algunos proveedores tecnológicos, de infraestructura, pagos, mensajería, soporte o analítica pueden encontrarse fuera de la República Argentina. En esos casos, Nubapay procurará adoptar medidas razonables para proteger la información conforme la normativa aplicable.`,
  },
  {
    num: '12',
    title: 'Conservación de datos',
    body: `Nubapay conservará los datos personales durante el tiempo necesario para cumplir las finalidades descriptas, incluyendo la prestación del servicio, gestión de pedidos, procesamiento de pagos, soporte, prevención de fraude, cumplimiento legal y resolución de reclamos.\n\nAlgunos registros podrán conservarse por plazos más extensos cuando existan obligaciones legales, reclamos pendientes, investigaciones o necesidad de preservar evidencia operativa.`,
  },
  {
    num: '13',
    title: 'Seguridad de la información',
    body: `Nubapay adopta medidas técnicas y organizativas razonables para proteger los datos personales, que pueden incluir:\n\n• Control de accesos y gestión de roles.\n• Cifrado en tránsito.\n• Almacenamiento seguro de credenciales.\n• Registros de actividad y monitoreo.\n• Validación de QR únicos.\n• Copias de seguridad.\n• Medidas de prevención de fraude.\n\nNingún sistema es completamente invulnerable. Nubapay no puede garantizar seguridad absoluta frente a ataques o eventos fuera de su control razonable.`,
  },
  {
    num: '14',
    title: 'Responsabilidad del usuario sobre sus datos',
    body: `El usuario se compromete a proporcionar información verdadera, actualizada y completa, y a:\n\n• Mantener la confidencialidad de sus credenciales.\n• No compartir su cuenta con terceros no autorizados.\n• No compartir QR de retiro con personas no autorizadas.\n• Informar accesos indebidos o sospechas de fraude.\n\nNubapay no será responsable por consecuencias derivadas de datos falsos, incompletos o compartidos indebidamente por el usuario.`,
  },
  {
    num: '15',
    title: 'Cookies y tecnologías similares',
    body: `Nubapay podrá utilizar cookies, píxeles, almacenamiento local e identificadores de sesión para permitir el funcionamiento técnico, recordar preferencias, mantener sesiones activas, analizar tráfico, medir rendimiento, detectar errores y prevenir fraude.`,
    children: [
      {
        subtitle: '15.1. Tipos de cookies',
        body: `• Cookies necesarias: esenciales para el funcionamiento.\n• Cookies de rendimiento: ayudan a entender cómo se usa Nubapay.\n• Cookies de funcionalidad: permiten recordar preferencias.\n• Cookies de seguridad: ayudan a prevenir accesos indebidos o fraude.\n• Cookies de analítica o marketing: permiten medir campañas y comportamiento agregado.`,
      },
      {
        subtitle: '15.2. Gestión de cookies',
        body: `El usuario puede configurar su navegador para rechazar o eliminar cookies. Sin embargo, esto puede afectar funcionalidades como inicio de sesión, pedidos, pagos o validación de QR.`,
      },
    ],
  },
  {
    num: '16',
    title: 'Analítica y métricas',
    body: `Nubapay podrá utilizar herramientas de analítica para comprender cómo se utiliza la Plataforma y mejorar su rendimiento. La información puede incluir datos técnicos, comportamiento de navegación e interacciones. Cuando sea posible, los datos se procesarán de forma agregada o anonimizada.`,
  },
  {
    num: '17',
    title: 'Inteligencia artificial y automatizaciones',
    body: `Nubapay podrá utilizar herramientas de automatización o inteligencia artificial para responder consultas, asistir en soporte, interpretar errores, generar respuestas automáticas y mejorar flujos de atención.\n\nCuando estas herramientas procesen datos personales, Nubapay procurará limitar la información compartida a lo necesario. Las respuestas automáticas pueden no ser perfectas. Ante reclamos importantes, pagos, devoluciones o conflictos, el usuario podrá solicitar atención humana.`,
  },
  {
    num: '18',
    title: 'Respaldo criptográfico o blockchain',
    body: `Nubapay podrá ofrecer mecanismos de respaldo criptográfico o registro de operaciones mediante tecnologías blockchain. Estos mecanismos podrán registrar hashes, identificadores técnicos o metadatos mínimos para verificar una operación.\n\nNubapay procurará no registrar datos personales innecesarios en redes públicas. Ciertos registros blockchain pueden tener características de inmutabilidad, por lo que se diseñan cuidadosamente para no exponer datos personales.`,
  },
  {
    num: '19',
    title: 'Comunicaciones comerciales',
    body: `Nubapay podrá enviar comunicaciones comerciales o informativas a usuarios que hayan contratado o consultado nuestros servicios, incluyendo novedades de producto, promociones, invitaciones, casos de uso y encuestas.\n\nEl usuario podrá solicitar darse de baja en cualquier momento mediante el enlace incluido en los mensajes o escribiendo a [completar email]. Las comunicaciones operativas, legales o de seguridad podrán seguir enviándose independientemente.`,
  },
  {
    num: '20',
    title: 'Derechos de los titulares de datos',
    body: `El titular de los datos podrá ejercer conforme la normativa aplicable los siguientes derechos:\n\n• Acceso: conocer qué datos personales tratamos.\n• Rectificación: corregir datos inexactos o incompletos.\n• Actualización: actualizar datos desactualizados.\n• Supresión: solicitar la eliminación cuando corresponda.\n• Oposición: oponerse a ciertos tratamientos cuando resulte aplicable.\n• Revocación del consentimiento.\n• Información sobre el tratamiento de sus datos.\n\nPara ejercer estos derechos, escribir a [completar email] con el asunto "Solicitud de datos personales" e información suficiente para acreditar identidad.`,
  },
  {
    num: '21',
    title: 'Plazos de respuesta',
    body: `Nubapay procurará responder las solicitudes de ejercicio de derechos dentro de los plazos legales aplicables. En algunos casos puede requerirse información adicional para verificar la identidad del solicitante.\n\nLa eliminación puede no ser inmediata cuando exista obligación legal de conservación, reclamos pendientes, necesidad de prevención de fraude o defensa de derechos.`,
  },
  {
    num: '22',
    title: 'Autoridad de control',
    body: `En Argentina, la Agencia de Acceso a la Información Pública (AAIP) es la autoridad de control en materia de protección de datos personales.\n\nEl usuario podrá realizar consultas o reclamos ante la AAIP si considera que sus derechos no fueron debidamente atendidos.`,
  },
  {
    num: '23',
    title: 'Datos tratados por el Organizador',
    body: `En muchos casos, Nubapay actúa como plataforma tecnológica utilizada por un Organizador. El Organizador puede determinar qué productos ofrece, qué datos solicita al comprador, cómo gestiona reclamos, qué usuarios de staff tienen acceso y qué reportes descarga.\n\nEl Organizador será responsable por el uso que haga de los datos personales fuera de la Plataforma y por cumplir con sus propias obligaciones legales de protección de datos.`,
  },
  {
    num: '24',
    title: 'Acceso del staff a datos personales',
    body: `El Staff autorizado por el Organizador podrá acceder a datos necesarios para operar el evento: detalle del pedido, estado del pago, QR de retiro, punto de retiro y estado de entrega.\n\nEl Organizador deberá limitar los accesos del Staff a lo estrictamente necesario. Nubapay podrá registrar la actividad del Staff para fines de seguridad, auditoría y prevención de fraude.`,
  },
  {
    num: '25',
    title: 'Reclamos, devoluciones y soporte',
    body: `Cuando un usuario realice un reclamo o solicitud de soporte, Nubapay podrá tratar los datos necesarios para analizar y responder el caso, incluyendo identificación del usuario, pedido relacionado, pago asociado, historial de QR y comunicaciones previas.\n\nEn algunos casos será necesario compartir información con el Organizador, proveedor de pago o proveedor tecnológico involucrado.`,
  },
  {
    num: '26',
    title: 'Eventos cancelados o modificados',
    body: `En caso de cancelación, suspensión o modificación de un evento, Nubapay podrá tratar datos para informar cambios, identificar pedidos afectados, gestionar devoluciones, coordinar con el Organizador y cumplir obligaciones legales o contractuales.`,
  },
  {
    num: '27',
    title: 'Prevención de abuso y uso indebido',
    body: `Nubapay podrá monitorear el uso de la Plataforma para detectar intentos de fraude, uso duplicado de QR, manipulación de pedidos, accesos indebidos, actividad automatizada no autorizada e incumplimientos de los Términos y Condiciones.\n\nEn esos casos, Nubapay podrá bloquear, suspender, limitar o revisar cuentas, pedidos, QR, eventos o accesos.`,
  },
  {
    num: '28',
    title: 'Enlaces a sitios de terceros',
    body: `La Plataforma puede contener enlaces o integraciones con sitios, servicios o plataformas de terceros. Nubapay no controla las políticas de privacidad ni las prácticas de dichos terceros. El usuario deberá revisar las políticas correspondientes antes de proporcionar datos o utilizar servicios externos.`,
  },
  {
    num: '29',
    title: 'Cambios en esta Política',
    body: `Nubapay podrá modificar esta Política en cualquier momento. Cuando los cambios sean relevantes, podrá comunicarlos mediante el sitio web, email o notificaciones dentro de la Plataforma. El uso continuado de Nubapay luego de la publicación de los cambios implicará el conocimiento de la nueva versión.`,
  },
  {
    num: '30',
    title: 'Confidencialidad',
    body: `Nubapay se compromete a tratar los datos personales con confidencialidad y a limitar su acceso a personas, proveedores o sistemas que necesiten conocerlos para cumplir las finalidades indicadas en esta Política. El personal, colaboradores o proveedores con acceso a datos deberán actuar bajo obligaciones de confidencialidad.`,
  },
  {
    num: '31',
    title: 'Exactitud de la información',
    body: `El usuario garantiza que los datos proporcionados son verdaderos, exactos, completos y actualizados. Nubapay no será responsable por daños, demoras, errores o fallas operativas derivadas de información incorrecta, falsa o desactualizada proporcionada por el usuario, el Organizador o el Staff.`,
  },
  {
    num: '32',
    title: 'Baja de cuenta y eliminación de datos',
    body: `El usuario podrá solicitar la baja de su cuenta o eliminación de sus datos personales escribiendo a [completar email].\n\nLa baja no implica la eliminación inmediata de todos los datos, ya que Nubapay podrá conservar información para cumplir obligaciones legales, gestionar pagos pendientes, resolver reclamos, prevenir fraude, mantener registros contables o fiscales y defender derechos.`,
  },
  {
    num: '33',
    title: 'Datos anonimizados o agregados',
    body: `Nubapay podrá utilizar datos anonimizados, agregados o estadísticos para fines comerciales, analíticos, técnicos o de mejora del servicio. Estos datos no permitirán identificar directamente a una persona determinada.`,
  },
  {
    num: '34',
    title: 'Medidas ante incidentes de seguridad',
    body: `En caso de detectar un incidente de seguridad que pueda comprometer datos personales, Nubapay podrá adoptar medidas razonables para investigar el incidente, contener sus efectos, restaurar la seguridad, informar a usuarios afectados cuando corresponda, comunicar a autoridades si fuera requerido e implementar mejoras preventivas.`,
  },
  {
    num: '35',
    title: 'Contacto',
    body: `Para consultas, solicitudes o reclamos relacionados con esta Política o el tratamiento de datos personales:\n\nResponsable: [completar]\nCorreo electrónico: [completar]\nWhatsApp: [completar]\nDomicilio: [completar]\nSitio web: [completar]`,
  },
  {
    num: '36',
    title: 'Aceptación',
    body: `Al utilizar Nubapay, el usuario reconoce que leyó y comprendió esta Política de Privacidad, y acepta el tratamiento de sus datos personales conforme las finalidades, condiciones y alcances aquí descriptos.`,
  },
]

export default function PrivacidadPage() {
  const font = "var(--font-dm-sans, 'DM Sans', sans-serif)"

  return (
    <div style={{ fontFamily: font, background: '#FFFFFF', minHeight: '100vh' }}>
      <style>{`
        .nb-sidebar-link { display: flex; align-items: center; gap: 8px; padding: 5px 8px; border-radius: 8px; text-decoration: none; font-size: 12px; color: #6B6B7A; font-weight: 500; line-height: 1.35; transition: background 0.12s, color 0.12s; }
        .nb-sidebar-link:hover { background: #F0F0F2; color: #0A0A0F; }

        .priv-hero { max-width: 1100px; margin: 0 auto; padding: 72px 32px 56px; }
        .priv-divider { max-width: 1100px; margin: 0 auto; padding: 0 32px; }
        .priv-layout {
          max-width: 1100px; margin: 0 auto;
          padding: 48px 32px 120px;
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 48px;
          align-items: start;
        }
        .priv-sidebar { display: block; }
        .priv-footer {
          border-top: 1px solid rgba(0,0,0,0.06);
          padding: 28px 32px;
          display: flex; align-items: center; justify-content: space-between;
          max-width: 1100px; margin: 0 auto;
          flex-wrap: wrap; gap: 12px;
        }

        @media (max-width: 1024px) {
          .priv-layout { grid-template-columns: 180px 1fr; gap: 32px; }
        }

        @media (max-width: 768px) {
          .priv-hero { padding: 48px 24px 40px; }
          .priv-divider { padding: 0 24px; }
          .priv-layout { grid-template-columns: 1fr; padding: 32px 24px 80px; gap: 0; }
          .priv-sidebar { display: none; }
          .priv-footer { padding: 24px; flex-direction: column; align-items: flex-start; gap: 16px; }
        }

        @media (max-width: 480px) {
          .priv-hero { padding: 40px 20px 32px; }
          .priv-divider { padding: 0 20px; }
          .priv-layout { padding: 28px 20px 64px; }
          .priv-footer { padding: 20px; }
        }
      `}</style>

      <SiteNavbar />

      {/* Hero */}
      <div className="priv-hero">
        <h1 style={{
          fontSize: 'clamp(40px, 6vw, 72px)',
          fontWeight: 800,
          color: '#0A0A0F',
          letterSpacing: '-0.04em',
          lineHeight: 1.05,
          margin: '0 0 20px',
          maxWidth: '100%',
        }}>
          Política de Privacidad
        </h1>
        <p style={{ fontSize: '16px', color: '#6B6B7A', lineHeight: 1.65, margin: 0, maxWidth: '100%' }}>
          En Nubapay valoramos la privacidad de nuestros usuarios y nos comprometemos a proteger los datos personales recolectados y tratados a través de nuestra plataforma. Al acceder o utilizarla, declarás haber leído y comprendido esta Política.
        </p>

        {/* Meta info */}
        <div style={{ display: 'flex', gap: '24px', marginTop: '36px', flexWrap: 'wrap' }}>
          {[
            { label: 'Última actualización', value: 'Mayo 2025' },
            { label: 'Versión', value: '1.0' },
            { label: 'Jurisdicción', value: 'República Argentina' },
          ].map(item => (
            <div key={item.label} style={{
              padding: '12px 16px',
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.07)',
              borderRadius: '12px',
              minWidth: '160px',
            }}>
              <p style={{ margin: '0 0 3px', fontSize: '11px', fontWeight: 600, color: '#9A9AA8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {item.label}
              </p>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#0A0A0F' }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="priv-divider">
        <div style={{ height: '1px', background: 'rgba(0,0,0,0.07)' }} />
      </div>

      {/* Content */}
      <div className="priv-layout">

        {/* Sidebar */}
        <aside className="priv-sidebar" style={{ position: 'sticky', top: '84px' }}>
          <p style={{
            fontSize: '11px', fontWeight: 700, color: '#9A9AA8',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            margin: '0 0 16px',
          }}>
            Índice
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>
            {sections.map(s => (
              <a key={s.num} href={`#sec-${s.num}`} className="nb-sidebar-link">
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#C4C4CF', width: '16px', flexShrink: 0, textAlign: 'right' }}>
                  {s.num}
                </span>
                {s.title}
              </a>
            ))}
          </div>
        </aside>

        {/* Sections */}
        <main>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sections.map((section, idx) => (
              <div
                key={section.num}
                id={`sec-${section.num}`}
                style={{
                  padding: '28px 0',
                  borderBottom: idx < sections.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                }}
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <span style={{
                    flexShrink: 0,
                    width: '28px', height: '28px',
                    borderRadius: '8px',
                    background: '#F0F0F2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 800, color: '#9A9AA8',
                    marginTop: '2px',
                  }}>
                    {section.num}
                  </span>

                  <div style={{ flex: 1 }}>
                    <h2 style={{ margin: '0 0 12px', fontSize: '17px', fontWeight: 700, color: '#0A0A0F', letterSpacing: '-0.02em' }}>
                      {section.title}
                    </h2>
                    <div style={{ fontSize: '14px', lineHeight: 1.75, color: '#4A4A5A' }}>
                      {section.body.split('\n\n').map((para, i) => (
                        <p key={i} style={{ margin: i === 0 ? 0 : '12px 0 0', whiteSpace: 'pre-line' }}>
                          {para}
                        </p>
                      ))}
                    </div>

                    {section.children && (
                      <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {section.children.map(child => (
                          <div key={child.subtitle} style={{
                            padding: '16px',
                            background: '#FAFAFA',
                            borderRadius: '12px',
                            border: '1px solid rgba(0,0,0,0.05)',
                          }}>
                            <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: '#0A0A0F', letterSpacing: '-0.01em' }}>
                              {child.subtitle}
                            </p>
                            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.7, color: '#4A4A5A', whiteSpace: 'pre-line' }}>
                              {child.body}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom note */}
          <div style={{
            marginTop: '48px',
            padding: '24px',
            background: '#0A0A0F',
            borderRadius: '20px',
            display: 'flex', alignItems: 'flex-start', gap: '16px',
          }}>
            <div style={{
              width: '36px', height: '36px', flexShrink: 0,
              background: 'rgba(198,255,0,0.12)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM8 5v4M8 11v.5" stroke="#C6FF00" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
                ¿Tenés consultas sobre tus datos?
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                Escribinos a{' '}
                <a href="mailto:privacidad@nubapay.com" style={{ color: '#C6FF00', textDecoration: 'none', fontWeight: 600 }}>
                  privacidad@nubapay.com
                </a>
                . Te respondemos dentro de las 48 horas hábiles.
              </p>
            </div>
          </div>
        </main>

      </div>

      {/* Footer */}
      <div className="priv-footer">
        <span style={{ fontSize: '13px', color: '#9A9AA8' }}>
          © 2025 Nubapay. Todos los derechos reservados.
        </span>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link href="/terminos" style={{ fontSize: '13px', color: '#6B6B7A', textDecoration: 'none' }}>
            Términos
          </Link>
          <Link href="/privacidad" style={{ fontSize: '13px', color: '#0A0A0F', fontWeight: 600, textDecoration: 'none' }}>
            Privacidad
          </Link>
          <a href="mailto:privacidad@nubapay.com" style={{ fontSize: '13px', color: '#6B6B7A', textDecoration: 'none' }}>
            Contacto
          </a>
        </div>
      </div>

    </div>
  )
}
