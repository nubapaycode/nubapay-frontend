/**
 * Contenido del centro de ayuda (`/ayuda`). Lo usan la página (cliente) y el JSON-LD de FAQ (servidor),
 * así que acá va solo texto plano: nada de JSX.
 */

export type HelpTopicId = 'compras' | 'entradas' | 'organizadores' | 'cobros' | 'cuenta'

export type HelpFaq = { q: string; a: string }

export type HelpTopic = {
  id: HelpTopicId
  label: string
  /** Para quién es la sección (se muestra arriba de las preguntas). */
  blurb: string
  faqs: HelpFaq[]
}

export const SUPPORT_EMAIL = 'contacto@nubapay.app'
export const SECURITY_EMAIL = 'seguridad@nubapay.app'

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'compras',
    label: 'Compras y pedidos',
    blurb: 'Para quien compró algo en un evento desde el celular.',
    faqs: [
      {
        q: '¿Necesito descargar una app para comprar?',
        a: 'No. Todo funciona desde el navegador del celular: escaneás el QR del evento o entrás desde el link que compartió el organizador, elegís, pagás y listo.',
      },
      {
        q: '¿Con qué puedo pagar?',
        a: 'Lo define cada organizador. Lo más común es Mercado Pago (tarjeta o dinero en cuenta); algunos eventos también aceptan efectivo o transferencia. Los medios disponibles aparecen al momento de pagar.',
      },
      {
        q: '¿Dónde encuentro el QR de mi pedido?',
        a: 'Aparece apenas termina la compra y además te llega por email, con un link para volver a abrirlo cuando quieras. Si no lo ves, revisá la carpeta de spam o promociones.',
      },
      {
        q: 'Me cobraron pero no veo mi pedido',
        a: 'A veces el pago tarda unos minutos en confirmarse. Revisá tu email (también spam). Si pasado un rato sigue sin aparecer, escribinos desde el formulario de abajo con el email que usaste y, si lo tenés, el comprobante del pago.',
      },
      {
        q: '¿Puedo retirar mi pedido en partes?',
        a: 'Sí. En el punto de retiro pueden entregarte una parte; el QR sigue valiendo para lo que falta hasta que retires todo.',
      },
      {
        q: '¿Otra persona puede retirar con mi QR?',
        a: 'Sí: el QR vale por el pedido, así que quien lo muestre puede retirarlo. Cuidalo como si fuera efectivo y no compartas capturas con desconocidos.',
      },
      {
        q: '¿Qué pasa si cancelan mi pedido o quiero un reembolso?',
        a: 'Las devoluciones las maneja el organizador de cada evento. Si cancelan tu pedido te llega un email y el QR deja de valer. Para pedir un reembolso, contactá al organizador; si no sabés cómo, escribinos y te ayudamos a llegar a él.',
      },
    ],
  },
  {
    id: 'entradas',
    label: 'Entradas y QR',
    blurb: 'Para quien tiene una entrada, un estacionamiento o cualquier pase con QR.',
    faqs: [
      {
        q: '¿Cómo entro al evento con mi entrada?',
        a: 'Mostrá el QR en el acceso desde el celular; no hace falta imprimirlo. Subí el brillo de la pantalla para que se lea más rápido.',
      },
      {
        q: '¿El QR se puede usar más de una vez?',
        a: 'No. Cada QR es único y se invalida al escanearse, así nadie puede entrar ni retirar dos veces con el mismo código.',
      },
      {
        q: 'Me dicen que mi QR ya fue usado',
        a: 'Eso pasa si alguien más lo escaneó antes (por ejemplo, con una captura que compartiste). Acercate al staff del evento con el email de la compra; si necesitás ayuda después, escribinos.',
      },
      {
        q: '¿Puedo pasarle mi entrada a otra persona?',
        a: 'Sí: alcanza con que esa persona muestre el QR. Pasáselo solo a quien va a usarlo, porque vale para el primero que lo presente.',
      },
    ],
  },
  {
    id: 'organizadores',
    label: 'Organizar un evento',
    blurb: 'Para productoras, boliches, festivales y cualquiera que venda en su evento.',
    faqs: [
      {
        q: '¿Cómo empiezo a usar Nubapay?',
        a: 'Pedí una demo desde la página de registro. Te contactamos, te creamos la cuenta y te acompañamos a armar tu primer evento.',
      },
      {
        q: '¿Cuánto tarda configurar un evento?',
        a: 'Muy poco: catálogo, puntos de retiro y medios de pago se dejan listos en menos de 20 minutos. No necesitás conocimientos técnicos.',
      },
      {
        q: '¿Necesito comprar lectores o equipos?',
        a: 'No. El escáner funciona con la cámara de cualquier celular, desde el mismo panel.',
      },
      {
        q: '¿Puedo sumar a mi equipo?',
        a: 'Sí. Desde Equipo invitás a tu staff por email y elegís qué herramientas puede usar cada uno: escáner, pedidos, catálogo, pagos.',
      },
      {
        q: '¿Puedo tener varias barras o puntos de retiro?',
        a: 'Sí. Creás un punto por cada barra o sector y elegís qué productos se entregan en cada uno.',
      },
      {
        q: '¿Dónde aprendo a usar cada herramienta del panel?',
        a: 'En la documentación del panel tenés una guía con capturas para cada herramienta, del dashboard al escáner.',
      },
    ],
  },
  {
    id: 'cobros',
    label: 'Pagos y cobros',
    blurb: 'Cómo llega la plata de las ventas y qué le corresponde a Nubapay.',
    faqs: [
      {
        q: '¿Cómo recibo la plata de las ventas?',
        a: 'Conectás tu cuenta de Mercado Pago (o Sipago) en Métodos de pago y los cobros online se acreditan en esa cuenta. Los pagos en efectivo o por transferencia los recibís vos en el evento.',
      },
      {
        q: '¿Cuánto cobra Nubapay?',
        a: 'Depende del plan de tu evento y te lo detallamos en la demo. En el panel, dentro de Cobros, ves en todo momento lo que le corresponde a Nubapay por las ventas aprobadas.',
      },
      {
        q: '¿Nubapay guarda los datos de las tarjetas?',
        a: 'No. Los pagos se procesan con proveedores certificados como Mercado Pago, que son los que manejan los datos de la tarjeta.',
      },
      {
        q: '¿Puedo ver y exportar todos los cobros?',
        a: 'Sí. En Pagos tenés cada cobro con su estado y el pedido al que pertenece, y desde Pedidos podés exportar a CSV con los filtros que elijas.',
      },
    ],
  },
  {
    id: 'cuenta',
    label: 'Cuenta y acceso',
    blurb: 'Contraseñas, invitaciones y seguridad de tu cuenta.',
    faqs: [
      {
        q: 'Me olvidé la contraseña',
        a: 'Pedí una nueva desde "Recuperar contraseña": te llega un email con un link para elegirla. El link vence, así que usalo en el momento.',
      },
      {
        q: 'Me invitaron a un evento y no puedo entrar',
        a: 'Entrá con el mismo email al que te llegó la invitación. Si el email no aparece, revisá spam o pedile al organizador que te la reenvíe desde Equipo.',
      },
      {
        q: 'Encontré un problema de seguridad',
        a: `Escribinos a ${SECURITY_EMAIL} con los detalles. Lo revisamos con prioridad y te respondemos.`,
      },
    ],
  },
]

export const ALL_HELP_FAQS: HelpFaq[] = HELP_TOPICS.flatMap(t => t.faqs)
