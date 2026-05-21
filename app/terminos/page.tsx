import type { Metadata } from 'next'
import Link from 'next/link'
import SiteNavbar from '@/components/SiteNavbar'
import SiteFooter from '@/components/SiteFooter'
import { breadcrumbJsonLd } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Términos y condiciones de uso de la plataforma Nubapay.',
  alternates: { canonical: 'https://nubapay.app/terminos' },
}

const sections = [
  {
    num: '1',
    title: 'Aceptación de los Términos',
    body: `Al acceder o utilizar la plataforma Nubapay ("Plataforma"), ya sea como organizador de eventos, vendedor, o comprador/asistente, usted acepta quedar vinculado por estos Términos y Condiciones ("Términos"). Si no está de acuerdo con estos Términos, no utilice la Plataforma. Nubapay se reserva el derecho de modificar estos Términos en cualquier momento, notificando a los usuarios registrados con un mínimo de 15 días de anticipación.`,
  },
  {
    num: '2',
    title: 'Definiciones',
    body: `A los efectos de estos Términos:\n\n"Plataforma" significa el software, aplicaciones web y móviles, APIs y servicios relacionados operados por Nubapay.\n\n"Organizador" significa la persona física o jurídica que crea y gestiona eventos a través de la Plataforma.\n\n"Vendedor" significa el operador de un puesto o stand que procesa pedidos dentro de un evento.\n\n"Comprador" o "Asistente" significa el usuario final que realiza compras en los eventos.\n\n"Pedido" significa una transacción iniciada por un Comprador para adquirir productos o servicios de un Vendedor.\n\n"QR de Retiro" significa el código QR único generado para cada Pedido confirmado.`,
  },
  {
    num: '3',
    title: 'Descripción del Servicio',
    body: `Nubapay es una plataforma de gestión de pedidos y pagos para eventos masivos que permite a los asistentes realizar compras desde sus dispositivos móviles, pagar de forma digital y retirar sus productos con un código QR único y verificado. La Plataforma incluye herramientas para que los Organizadores gestionen productos, categorías, vendedores, puntos de retiro y métricas en tiempo real.`,
  },
  {
    num: '4',
    title: 'Registro y Cuentas',
    body: `Para utilizar las funciones de Organizador o Vendedor, debe crear una cuenta proporcionando información verdadera, precisa y completa. Usted es responsable de mantener la confidencialidad de sus credenciales de acceso y de todas las actividades que ocurran bajo su cuenta. Debe notificar a Nubapay inmediatamente ante cualquier uso no autorizado de su cuenta. Nubapay no será responsable por pérdidas derivadas del uso no autorizado de su cuenta.`,
  },
  {
    num: '5',
    title: 'Elegibilidad',
    body: `Para registrarse como Organizador o Vendedor, debe ser mayor de 18 años y tener capacidad legal para celebrar contratos vinculantes. Los menores de edad pueden utilizar la Plataforma como Compradores únicamente con la supervisión y consentimiento de sus padres o tutores legales.`,
  },
  {
    num: '6',
    title: 'Uso de la Plataforma',
    body: `Usted se compromete a utilizar la Plataforma únicamente para fines lícitos y de conformidad con estos Términos. Queda expresamente prohibido: (a) violar leyes o regulaciones aplicables; (b) transmitir contenido fraudulento, engañoso o ilegal; (c) intentar acceder sin autorización a sistemas o datos de Nubapay; (d) interferir con el funcionamiento normal de la Plataforma; (e) usar la Plataforma para vender productos o servicios ilegales; (f) realizar ingeniería inversa o descompilar el software de la Plataforma.`,
  },
  {
    num: '7',
    title: 'Responsabilidades del Organizador',
    body: `El Organizador es responsable de: (a) la veracidad de la información del evento publicada en la Plataforma; (b) obtener todos los permisos, licencias y habilitaciones necesarias para el evento; (c) garantizar que los productos y servicios ofrecidos cumplan con la normativa vigente; (d) gestionar adecuadamente los puntos de retiro y el personal de su evento; (e) cumplir con las obligaciones fiscales derivadas de las ventas realizadas; (f) comunicar a los asistentes las políticas de devolución y cambio aplicables.`,
  },
  {
    num: '8',
    title: 'Gestión de Productos y Precios',
    body: `El Organizador tiene pleno control sobre los productos, categorías y precios publicados en su catálogo. Nubapay no verifica la exactitud de los precios ni la disponibilidad de los productos. El Organizador es responsable de mantener actualizado el inventario y de comunicar cualquier cambio en los precios o la disponibilidad antes de que los Compradores realicen pedidos.`,
  },
  {
    num: '9',
    title: 'Procesamiento de Pagos',
    body: `Los pagos realizados a través de la Plataforma son procesados por proveedores de servicios de pago terceros ("PSP"), incluyendo pero no limitado a Mercado Pago. Nubapay actúa como intermediario técnico y no almacena datos de tarjetas de crédito o débito. Las transacciones están sujetas a los términos y condiciones del PSP correspondiente. Nubapay no garantiza la disponibilidad continua de ningún método de pago específico.`,
  },
  {
    num: '10',
    title: 'Comisiones y Tarifas',
    body: `Nubapay cobra una comisión por cada transacción procesada a través de la Plataforma. Las tarifas vigentes se encuentran disponibles en el panel de control del Organizador y pueden actualizarse con 30 días de anticipación. Las comisiones se descontarán automáticamente de las liquidaciones periódicas. El Organizador acepta las tarifas vigentes al momento de crear su evento.`,
  },
  {
    num: '11',
    title: 'Liquidaciones',
    body: `Las liquidaciones a los Organizadores se realizan según el cronograma acordado en el contrato de servicio. Nubapay se reserva el derecho de retener fondos en caso de disputas, contracargos, sospechas de fraude o incumplimiento de estos Términos. Los fondos retenidos serán liberados una vez resuelta la situación que motivó la retención.`,
  },
  {
    num: '12',
    title: 'Sistema de QR Antifraude',
    body: `Cada Pedido confirmado genera un QR de Retiro único que debe ser presentado por el Comprador al momento de retirar su pedido. El sistema de verificación implementado por Nubapay valida la autenticidad del QR en tiempo real. Nubapay no garantiza que el sistema de QR sea completamente infalible ante todos los intentos de fraude, pero implementa las medidas de seguridad razonables a nivel tecnológico para minimizar este riesgo.`,
  },
  {
    num: '13',
    title: 'Tecnología Blockchain',
    body: `Nubapay utiliza tecnología blockchain para certificar determinados aspectos del proceso de verificación de QRs. El uso de esta tecnología tiene carácter complementario y no implica que Nubapay garantice la inmutabilidad absoluta de los registros en ninguna red blockchain específica. Los servicios de blockchain están sujetos a la disponibilidad de las redes utilizadas.`,
  },
  {
    num: '14',
    title: 'Agente de Inteligencia Artificial',
    body: `La Plataforma puede incluir funcionalidades de inteligencia artificial ("IA") para asistencia automatizada, recomendaciones de productos y optimización de ventas. Las sugerencias generadas por la IA tienen carácter orientativo y no constituyen asesoramiento profesional. Nubapay no garantiza la exactitud, completitud o adecuación de las recomendaciones generadas por la IA para situaciones específicas.`,
  },
  {
    num: '15',
    title: 'Cancelaciones y Devoluciones',
    body: `Las políticas de cancelación y devolución de pedidos son determinadas por cada Organizador. Nubapay facilita el proceso técnico de cancelación cuando el Organizador lo habilita, pero no es responsable de las decisiones de reembolso tomadas por los Organizadores. Los Compradores deben consultar la política específica del evento antes de realizar una compra.`,
  },
  {
    num: '16',
    title: 'Contracargos',
    body: `En caso de contracargo iniciado por un Comprador, el Organizador es responsable de proporcionar la documentación necesaria para disputar el contracargo. Los costos asociados a los contracargos serán descontados de las liquidaciones del Organizador. Nubapay asistirá en la gestión de contracargos en la medida de sus posibilidades, pero no garantiza resultados favorables.`,
  },
  {
    num: '17',
    title: 'Propiedad Intelectual',
    body: `Todo el contenido de la Plataforma, incluyendo pero no limitado a software, diseño, textos, gráficos, logotipos y nombres comerciales, son propiedad de Nubapay o sus licenciantes y están protegidos por las leyes de propiedad intelectual aplicables. Se concede al usuario una licencia limitada, no exclusiva e intransferible para utilizar la Plataforma según estos Términos. Queda prohibida la reproducción, distribución o modificación no autorizada de cualquier contenido de la Plataforma.`,
  },
  {
    num: '18',
    title: 'Contenido del Usuario',
    body: `Al publicar contenido en la Plataforma (imágenes de productos, descripciones, etc.), el usuario otorga a Nubapay una licencia mundial, no exclusiva y libre de regalías para usar, reproducir y mostrar dicho contenido en el contexto de la prestación del servicio. El usuario garantiza que tiene los derechos necesarios sobre el contenido que publica y que éste no infringe derechos de terceros.`,
  },
  {
    num: '19',
    title: 'Privacidad y Protección de Datos',
    body: `El tratamiento de datos personales se rige por nuestra Política de Privacidad, disponible en la Plataforma. Al usar la Plataforma, usted consiente el tratamiento de sus datos personales de conformidad con dicha política. Nubapay cumple con la Ley N° 25.326 de Protección de Datos Personales de Argentina y, en su caso, con el Reglamento General de Protección de Datos (GDPR) de la Unión Europea.`,
  },
  {
    num: '20',
    title: 'Cookies y Tecnologías de Seguimiento',
    body: `La Plataforma utiliza cookies y tecnologías similares para mejorar la experiencia del usuario, analizar el tráfico y personalizar el contenido. Al usar la Plataforma, usted acepta el uso de estas tecnologías según nuestra Política de Cookies. Puede configurar su navegador para rechazar cookies, aunque esto puede afectar la funcionalidad de la Plataforma.`,
  },
  {
    num: '21',
    title: 'Seguridad',
    body: `Nubapay implementa medidas de seguridad técnicas y organizativas razonables para proteger los datos de los usuarios. Sin embargo, ningún sistema de transmisión por internet es 100% seguro. Nubapay no puede garantizar la seguridad absoluta de la información transmitida a través de la Plataforma. Los usuarios son responsables de mantener la seguridad de sus dispositivos y credenciales de acceso.`,
  },
  {
    num: '22',
    title: 'Disponibilidad del Servicio',
    body: `Nubapay procura que la Plataforma esté disponible de forma continua, pero no garantiza una disponibilidad del 100%. La Plataforma puede estar temporalmente no disponible por mantenimiento programado, actualizaciones, fallos técnicos o causas de fuerza mayor. Nubapay notificará con anticipación razonable los mantenimientos programados que afecten significativamente el servicio.`,
  },
  {
    num: '23',
    title: 'Limitación de Responsabilidad',
    body: `En la máxima medida permitida por la ley, Nubapay no será responsable por: (a) daños indirectos, incidentales, especiales o consecuentes; (b) pérdida de ganancias, datos, goodwill o negocios; (c) interrupciones del servicio o fallos tecnológicos fuera del control razonable de Nubapay; (d) acciones u omisiones de terceros, incluyendo PSPs. La responsabilidad máxima de Nubapay no excederá el monto de las comisiones pagadas por el usuario en los 3 meses anteriores al evento que dio origen al reclamo.`,
  },
  {
    num: '24',
    title: 'Indemnización',
    body: `El usuario se compromete a indemnizar y mantener indemne a Nubapay, sus directivos, empleados y socios, de cualquier reclamación, daño, pérdida o gasto (incluyendo honorarios legales razonables) derivados de: (a) el incumplimiento de estos Términos; (b) el uso indebido de la Plataforma; (c) la violación de derechos de terceros; (d) los productos o servicios ofrecidos por el usuario a través de la Plataforma.`,
  },
  {
    num: '25',
    title: 'Garantías',
    body: `La Plataforma se proporciona "tal cual" y "según disponibilidad". Nubapay no ofrece garantías expresas o implícitas, incluyendo garantías de comerciabilidad, adecuación para un propósito particular o no infracción. Nubapay no garantiza que la Plataforma satisfará los requisitos específicos del usuario o que operará sin errores.`,
  },
  {
    num: '26',
    title: 'Suspensión y Terminación',
    body: `Nubapay puede suspender o terminar el acceso a la Plataforma en caso de: (a) violación de estos Términos; (b) actividades fraudulentas o ilegales; (c) falta de pago de las tarifas correspondientes; (d) inactividad prolongada de la cuenta. En caso de terminación, el Organizador recibirá las liquidaciones pendientes después de deducir cualquier monto adeudado, sujeto al período de retención por disputas aplicable.`,
  },
  {
    num: '27',
    title: 'Resolución de Disputas',
    body: `Ante cualquier disputa entre usuarios (Organizadores, Vendedores o Compradores), Nubapay puede actuar como mediador a solicitud de las partes, pero no está obligado a resolver disputas comerciales entre usuarios. Las disputas entre el usuario y Nubapay se resolverán preferentemente mediante negociación directa. Si no se alcanza un acuerdo, serán resueltas por los tribunales competentes según la cláusula de jurisdicción.`,
  },
  {
    num: '28',
    title: 'Jurisdicción y Ley Aplicable',
    body: `Estos Términos se rigen por las leyes de la República Argentina. Las partes se someten a la jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires para cualquier controversia derivada de estos Términos, renunciando a cualquier otro fuero que pudiera corresponderles.`,
  },
  {
    num: '29',
    title: 'Comunicaciones',
    body: `Las notificaciones a los usuarios se realizarán mediante: (a) correo electrónico a la dirección registrada; (b) notificaciones dentro de la Plataforma; (c) publicaciones en el sitio web. Las notificaciones se considerarán recibidas: en caso de email, 24 horas después del envío; en caso de notificaciones en la Plataforma, al momento de acceder a la cuenta.`,
  },
  {
    num: '30',
    title: 'Integraciones de Terceros',
    body: `La Plataforma puede integrarse con servicios de terceros (redes sociales, plataformas de pago, servicios de análisis, etc.). Nubapay no es responsable por el contenido, las políticas de privacidad o las prácticas de estos servicios de terceros. El uso de servicios integrados de terceros está sujeto a sus propios términos y condiciones.`,
  },
  {
    num: '31',
    title: 'API y Desarrolladores',
    body: `El acceso a la API de Nubapay está sujeto a términos adicionales disponibles en la documentación técnica. Los desarrolladores que utilicen la API deben cumplir con las limitaciones de uso, las políticas de seguridad y los estándares de implementación establecidos por Nubapay. El uso indebido de la API puede resultar en la suspensión del acceso.`,
  },
  {
    num: '32',
    title: 'White Label y Licenciamiento',
    body: `Los servicios de white label y licenciamiento de la Plataforma están sujetos a contratos específicos adicionales. Los términos de dichos contratos prevalecen sobre estos Términos generales en caso de conflicto. Para consultas sobre opciones de licenciamiento, contactar al equipo comercial de Nubapay.`,
  },
  {
    num: '33',
    title: 'Uso de Datos Agregados',
    body: `Nubapay puede utilizar datos agregados y anonimizados derivados del uso de la Plataforma para mejorar el servicio, desarrollar nuevas funcionalidades y generar estadísticas del sector. Estos datos no identificarán a usuarios individuales y serán tratados de conformidad con la Política de Privacidad.`,
  },
  {
    num: '34',
    title: 'Restricciones Geográficas',
    body: `La Plataforma está diseñada principalmente para operar en la República Argentina. El acceso desde otras jurisdicciones está permitido pero puede estar sujeto a restricciones locales sobre las cuales Nubapay no tiene control. Los usuarios fuera de Argentina son responsables de verificar que el uso de la Plataforma cumple con las leyes de su jurisdicción.`,
  },
  {
    num: '35',
    title: 'Fuerza Mayor',
    body: `Nubapay no será responsable por el incumplimiento de sus obligaciones debido a causas fuera de su control razonable, incluyendo pero no limitado a: desastres naturales, pandemias, guerras, actos de gobierno, fallas en infraestructuras de internet, ataques cibernéticos masivos o cortes de energía generalizados.`,
  },
  {
    num: '36',
    title: 'Prohibición de Cesión',
    body: `El usuario no puede ceder sus derechos u obligaciones bajo estos Términos sin el consentimiento previo por escrito de Nubapay. Nubapay puede ceder estos Términos en su totalidad en el contexto de una fusión, adquisición o venta de activos, notificando a los usuarios afectados.`,
  },
  {
    num: '37',
    title: 'Severabilidad',
    body: `Si alguna disposición de estos Términos se considera inválida o inaplicable por un tribunal competente, las demás disposiciones permanecerán en plena vigencia. La disposición inválida será modificada en la medida mínima necesaria para hacerla válida y aplicable, preservando la intención original de las partes.`,
  },
  {
    num: '38',
    title: 'Acuerdo Completo',
    body: `Estos Términos, junto con la Política de Privacidad y cualquier acuerdo adicional específico suscripto con Nubapay, constituyen el acuerdo completo entre las partes respecto al uso de la Plataforma y reemplazan cualquier comunicación o acuerdo anterior sobre el mismo objeto.`,
  },
  {
    num: '39',
    title: 'Renuncia',
    body: `La falta de ejercicio por parte de Nubapay de cualquier derecho o disposición de estos Términos no constituirá una renuncia a dicho derecho o disposición. Cualquier renuncia a un derecho específico solo será efectiva si se realiza por escrito y firmada por un representante autorizado de Nubapay.`,
  },
  {
    num: '40',
    title: 'Relación entre las Partes',
    body: `Estos Términos no crean ninguna sociedad, joint venture, relación de empleo o agencia entre el usuario y Nubapay. El usuario actúa de forma independiente y no tiene autoridad para comprometer a Nubapay de ninguna manera.`,
  },
  {
    num: '41',
    title: 'Menores de Edad',
    body: `La Plataforma no está dirigida a menores de 13 años. Si Nubapay toma conocimiento de que ha recopilado datos personales de menores de 13 años sin el consentimiento verificable de sus padres o tutores, tomará medidas para eliminar dicha información. Los padres o tutores que detecten que un menor ha proporcionado datos sin su consentimiento deben contactar a Nubapay inmediatamente.`,
  },
  {
    num: '42',
    title: 'Accesibilidad',
    body: `Nubapay se compromete a mejorar continuamente la accesibilidad de la Plataforma para personas con discapacidades. Si experimenta dificultades de accesibilidad, comuníquese con nuestro equipo de soporte para que podamos asistirle y mejorar la Plataforma.`,
  },
  {
    num: '43',
    title: 'Idioma',
    body: `Estos Términos se redactan en idioma español. En caso de traducción a otros idiomas, la versión en español prevalecerá en caso de discrepancias o ambigüedades interpretativas.`,
  },
  {
    num: '44',
    title: 'Actualizaciones de la Plataforma',
    body: `Nubapay puede actualizar, modificar o descontinuar funcionalidades de la Plataforma en cualquier momento. Cuando sea posible, Nubapay notificará con anticipación los cambios significativos. El uso continuado de la Plataforma tras los cambios implica la aceptación de los mismos.`,
  },
  {
    num: '45',
    title: 'Soporte y Asistencia',
    body: `Nubapay proporciona soporte técnico a través de los canales disponibles en la Plataforma (chat, email, centro de ayuda). Los tiempos de respuesta son estimados y pueden variar según el volumen de consultas y la complejidad del problema. El soporte prioritario puede estar disponible para planes de servicio específicos.`,
  },
  {
    num: '46',
    title: 'Programa de Referidos',
    body: `Si Nubapay implementa un programa de referidos, sus términos específicos se publicarán en la Plataforma. Nubapay se reserva el derecho de modificar o discontinuar el programa de referidos en cualquier momento, liquidando los beneficios devengados hasta la fecha de modificación.`,
  },
  {
    num: '47',
    title: 'Testimonios y Marketing',
    body: `Al compartir testimonios, casos de éxito o reseñas sobre la Plataforma, el usuario autoriza a Nubapay a utilizar dicho contenido en sus materiales de marketing, redes sociales y comunicaciones comerciales, respetando la posibilidad del usuario de solicitar la eliminación de su testimonio en cualquier momento.`,
  },
  {
    num: '48',
    title: 'Contacto',
    body: `Para cualquier consulta, reclamo o notificación relacionada con estos Términos, puede contactarnos en:\n\nNubapay\nEmail: legal@nubapay.app\nSitio web: www.nubapay.app\n\nÚltima actualización: Mayo 2025`,
  },
]

export default function TerminosPage() {
  const font = "var(--font-dm-sans, 'DM Sans', sans-serif)"

  return (
    <div style={{ fontFamily: font, background: '#FFFFFF', minHeight: '100vh' }}>
      <script type="application/ld+json">{breadcrumbJsonLd([{ name: 'Términos y Condiciones', path: '/terminos' }])}</script>
      <style>{`
        .nb-sidebar-link { display: flex; align-items: center; gap: 8px; padding: 5px 8px; border-radius: 8px; text-decoration: none; font-size: 12px; color: #6B6B7A; font-weight: 500; line-height: 1.35; transition: background 0.12s, color 0.12s; }
        .nb-sidebar-link:hover { background: #F0F0F2; color: #0A0A0F; }
        .nb-back-link:hover { background: #E8E8EA !important; }

        .term-hero { max-width: 1100px; margin: 0 auto; padding: 72px 32px 56px; }
        .term-divider { max-width: 1100px; margin: 0 auto; padding: 0 32px; }
        .term-layout {
          max-width: 1100px; margin: 0 auto;
          padding: 48px 32px 120px;
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 48px;
          align-items: start;
        }
        .term-sidebar { display: block; }

        @media (max-width: 1024px) {
          .term-layout { grid-template-columns: 180px 1fr; gap: 32px; }
        }

        @media (max-width: 768px) {
          .term-hero { padding: 48px 24px 40px; }
          .term-divider { padding: 0 24px; }
          .term-layout { grid-template-columns: 1fr; padding: 32px 24px 80px; gap: 0; }
          .term-sidebar { display: none; }
        }

        @media (max-width: 480px) {
          .term-hero { padding: 40px 20px 32px; }
          .term-divider { padding: 0 20px; }
          .term-layout { padding: 28px 20px 64px; }
        }
      `}</style>

      <SiteNavbar />

      {/* Hero */}
      <div className="term-hero">
        <h1 style={{
          fontSize: 'clamp(40px, 6vw, 72px)',
          fontWeight: 800,
          color: '#0A0A0F',
          letterSpacing: '-0.04em',
          lineHeight: 1.05,
          margin: '0 0 20px',
          maxWidth: '100%',
        }}>
          Términos y Condiciones
        </h1>
        <p style={{
          fontSize: '16px', color: '#6B6B7A',
          lineHeight: 1.65, margin: 0,
          maxWidth: '100%',
        }}>
          Por favor, leé detenidamente estos Términos antes de usar la plataforma. Al usarla, aceptás quedar vinculado por estas condiciones.
        </p>

        {/* Meta info */}
        <div style={{
          display: 'flex', gap: '24px', marginTop: '36px',
          flexWrap: 'wrap',
        }}>
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
      <div className="term-divider">
        <div style={{ height: '1px', background: 'rgba(0,0,0,0.07)' }} />
      </div>

      {/* Content */}
      <div className="term-layout">

        {/* Sidebar */}
        <aside className="term-sidebar" style={{ position: 'sticky', top: '84px' }}>
          <p style={{
            fontSize: '11px', fontWeight: 700, color: '#9A9AA8',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            margin: '0 0 16px',
          }}>
            Índice
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>
            {sections.map(s => (
              <a
                key={s.num}
                href={`#sec-${s.num}`}
                className="nb-sidebar-link"
              >
                <span style={{
                  fontSize: '10px', fontWeight: 700, color: '#C4C4CF',
                  width: '16px', flexShrink: 0, textAlign: 'right',
                }}>
                  {s.num}
                </span>
                {s.title}
              </a>
            ))}
          </div>
        </aside>

        {/* Sections */}
        <main>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
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
                  {/* Number badge */}
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
                    <h2 style={{
                      margin: '0 0 12px',
                      fontSize: '17px',
                      fontWeight: 700,
                      color: '#0A0A0F',
                      letterSpacing: '-0.02em',
                    }}>
                      {section.title}
                    </h2>
                    <div style={{
                      fontSize: '14px',
                      lineHeight: 1.75,
                      color: '#4A4A5A',
                    }}>
                      {section.body.split('\n\n').map((para, i) => (
                        <p key={i} style={{ margin: i === 0 ? 0 : '12px 0 0' }}>
                          {para}
                        </p>
                      ))}
                    </div>
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
                ¿Tenés alguna pregunta?
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                Si necesitás aclaraciones sobre alguno de estos términos, escribinos a{' '}
                <a href="mailto:legal@nubapay.app" style={{ color: '#C6FF00', textDecoration: 'none', fontWeight: 600 }}>
                  legal@nubapay.app
                </a>
                . Te respondemos dentro de las 48 horas hábiles.
              </p>
            </div>
          </div>
        </main>

      </div>

      <SiteFooter />

    </div>
  )
}
