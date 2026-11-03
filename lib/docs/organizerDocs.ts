/**
 * Contenido de la documentación del panel del organizador (`/documentacion`).
 *
 * Las capturas viven en `public/documentacion/` y salen del panel real con los datos de `mocks/`.
 * Cada paso puede marcar un punto de la captura (`spot`, en % del ancho y alto de la imagen)
 * para señalar dónde se toca.
 */

export type DocGroupKey = 'inicio' | 'operacion' | 'catalogo' | 'dinero' | 'ajustes' | 'comprador'

export const DOC_GROUPS: { key: DocGroupKey; label: string }[] = [
  { key: 'inicio', label: 'Primeros pasos' },
  { key: 'operacion', label: 'Operación' },
  { key: 'catalogo', label: 'Catálogo' },
  { key: 'dinero', label: 'Dinero' },
  { key: 'ajustes', label: 'Ajustes' },
  { key: 'comprador', label: 'Tu comprador' },
]

export type DocImage = {
  src: string
  alt: string
  width: number
  height: number
  /** Captura de celular: se muestra angosta y centrada. */
  phone?: boolean
}

export type DocStep = {
  title: string
  body: string
  /** Captura del paso. Si ningún paso del artículo la tiene, se muestra como lista de pasos. */
  image?: DocImage
  /** Punto a señalar sobre la captura, en porcentaje (0–100). */
  spot?: { x: number; y: number }
}

/** Paso con captura: lo que necesita el recorrido interactivo. */
export type DocImageStep = DocStep & { image: DocImage }

/** Un artículo es ilustrado cuando todos sus pasos traen captura. */
export function isIllustrated(steps: DocStep[]): steps is DocImageStep[] {
  return steps.length > 0 && steps.every(s => s.image !== undefined)
}

export type DocArticle = {
  slug: string
  group: DocGroupKey
  title: string
  /** Una línea: qué resuelve la herramienta. */
  summary: string
  /** Segmento bajo `/eventos/:eventId/` para abrir la herramienta (sin barra inicial). */
  toolPath?: string
  /** Dónde encontrarla en el menú. */
  location?: string
  /** Quién puede usarla. */
  access?: string
  steps: DocStep[]
  /** Lo que conviene saber antes de usarla. */
  notes?: string[]
  tips?: string[]
  /** Otros artículos relacionados (slugs). */
  related?: string[]
}

const W = 1470
const H = 802

function shot(name: string, alt: string): DocImage {
  return { src: `/documentacion/${name}.jpg`, alt, width: W, height: H }
}

const img = {
  eventos: { src: '/documentacion/eventos.jpg', alt: 'Lista Mis eventos con el botón Nuevo evento', width: 800, height: 360 },
  dashboard: shot('dashboard', 'Dashboard con lo recaudado, el gráfico de ventas y los medios de pago'),
  dashboardPeriodo: shot('dashboard-periodo', 'Selector de período del dashboard abierto'),
  pedidos: shot('pedidos', 'Lista de pedidos con filtros por estado'),
  pedidosDetalle: shot('pedidos-detalle', 'Panel lateral con el detalle de un pedido'),
  pedidosSeleccion: shot('pedidos-seleccion', 'Tres pedidos seleccionados con la barra de acciones'),
  pedidosEscaneos: shot('pedidos-escaneos', 'Vista Escaneos: comprados contra escaneados por producto'),
  escaner: { src: '/documentacion/escaner.jpg', alt: 'Escáner listo para activar la cámara', width: 720, height: 660 },
  escanerCamara: { src: '/documentacion/escaner-camara.jpg', alt: 'Escáner con la cámara activa', width: 720, height: 660 },
  escanerElegir: { src: '/documentacion/escaner-elegir.jpg', alt: 'Escáner preguntando qué se entrega ahora', width: 720, height: 660 },
  escanerVerificado: { src: '/documentacion/escaner-verificado.jpg', alt: 'Pedido verificado en el escáner', width: 720, height: 660 },
  catalogo: shot('catalogo', 'Catálogo con la lista de productos'),
  catalogoNuevo: shot('catalogo-nuevo', 'Menú Nuevo con las opciones Producto y Combo'),
  catalogoEditar: shot('catalogo-editar', 'Panel para editar un producto'),
  bloques: shot('bloques', 'Bloques destacados con banner y productos'),
  tickets: shot('tickets', 'Tickets con cupo, precio y link de venta'),
  puntos: shot('puntos-retiro', 'Puntos de retiro con sus productos asignados'),
  link: shot('link-catalogo', 'Link del catálogo con la portada y el enlace público'),
  cobros: { src: '/documentacion/cobros.jpg', alt: 'Cobros con accesos a Pagos y Métodos de pago', width: W, height: 328 },
  pagos: shot('pagos', 'Lista de pagos con estado, pedido y medio'),
  metodos: shot('metodos-pago', 'Métodos de pago disponibles'),
  mercadopago: shot('mercadopago', 'Guía para conectar Mercado Pago, paso 1 de 7'),
  equipo: shot('equipo', 'Equipo con los integrantes y sus herramientas'),
  equipoInvitar: shot('equipo-invitar', 'Formulario para invitar un integrante'),
  config: shot('configuracion', 'Configuración del evento'),
  buscador: shot('buscador', 'Buscador rápido abierto con resultados de pedidos'),
  compradorCatalogo: { src: '/images/landing-v2/screen-1-catalogo.webp', alt: 'Catálogo público en el celular', width: 1179, height: 2394, phone: true },
  compradorCarrito: { src: '/images/landing-v2/screen-2-carrito.webp', alt: 'Carrito del comprador', width: 1179, height: 2394, phone: true },
  compradorCheckout: { src: '/images/landing-v2/screen-3-checkout.webp', alt: 'Confirmación del pedido con nombre, email y medio de pago', width: 1179, height: 2394, phone: true },
  compradorQr: { src: '/images/landing-v2/screen-4-qr.webp', alt: 'Código QR de retiro del comprador', width: 1179, height: 2394, phone: true },
} satisfies Record<string, DocImage>

/** Convierte coordenadas de la captura (px) a porcentaje. */
function at(x: number, y: number, w = W, h = H) {
  return { x: Math.round((x / w) * 1000) / 10, y: Math.round((y / h) * 1000) / 10 }
}

/** Para las capturas del escáner, recortadas desde (507, 10) de la pantalla completa. */
function atScanner(x: number, y: number) {
  return at(x - 507, y - 10, 720, 660)
}

export const DOC_ARTICLES: DocArticle[] = [
  {
    slug: 'primeros-pasos',
    group: 'inicio',
    title: 'Primeros pasos',
    summary: 'De cero a vender: creá el evento, cargá lo que vendés, conectá los cobros y compartí el link.',
    location: 'Mis eventos',
    access: 'Dueño del evento',
    steps: [
      {
        title: 'Creá tu evento',
        body: 'En Mis eventos tocá “Nuevo evento”, poné el nombre y guardalo. Cada evento tiene su propio panel, con métricas, catálogo, pedidos y escáner.',
        image: img.eventos,
        spot: at(683, 124, 800, 360),
      },
      {
        title: 'Abrí su panel',
        body: 'Tocá “Abrir” para entrar al evento. Para pasar a otro evento, usá el selector de arriba a la izquierda.',
        image: img.eventos,
        spot: at(666, 234, 800, 360),
      },
      {
        title: 'Cargá lo que vas a vender',
        body: 'En Catálogo creá categorías, productos y combos. Si vendés entradas o estacionamiento, cargalos en Tickets.',
        image: img.catalogoNuevo,
        spot: at(1381, 164),
      },
      {
        title: 'Conectá cómo vas a cobrar',
        body: 'En Cobros → Métodos de pago conectá Mercado Pago o Sipago, o activá el efectivo. Hasta que no haya un medio activo, el catálogo no puede cobrar.',
        image: img.metodos,
        spot: at(660, 223),
      },
      {
        title: 'Compartí el link',
        body: 'Subí la portada y elegí el texto del enlace en Link del catálogo. Ese link es el que compartís con tu público, o el que imprimís como QR en el lugar.',
        image: img.link,
        spot: at(820, 773),
      },
      {
        title: 'Sumá a tu equipo',
        body: 'Invitá por email a quienes van a escanear, despachar o cobrar, cada uno solo con las herramientas que necesita.',
        image: img.equipo,
        spot: at(1352, 106),
      },
    ],
    tips: [
      'Con ⌘K (o Ctrl+K) abrís el buscador desde cualquier pantalla del panel.',
      'Antes del evento, hacé una compra de prueba con el link para ver el recorrido completo de tu comprador.',
    ],
    related: ['catalogo', 'metodos-pago', 'link-catalogo', 'equipo'],
  },
  {
    slug: 'buscador',
    group: 'inicio',
    title: 'Buscador rápido',
    summary: 'Saltá a cualquier herramienta o pedido sin usar el menú.',
    location: 'Barra lateral → Buscar… (⌘K)',
    access: 'Todo el equipo',
    steps: [
      {
        title: 'Abrilo con ⌘K',
        body: 'Apretá ⌘K en Mac o Ctrl+K en Windows, o tocá “Buscar…” en la barra lateral.',
        image: img.buscador,
        spot: at(735, 125),
      },
      {
        title: 'Escribí y elegí',
        body: 'Podés buscar un pedido por número, cliente o producto, ir a una herramienta o lanzar acciones como “Ver pedidos sin retirar” o “Exportar todos los pedidos”. Movete con las flechas y abrí con Enter.',
        image: img.buscador,
        spot: at(735, 219),
      },
    ],
    notes: ['Solo aparecen las herramientas y acciones que tu usuario tiene permitidas.'],
  },

  // ── Operación ─────────────────────────────────────────────────────────────
  {
    slug: 'dashboard',
    group: 'operacion',
    title: 'Dashboard',
    summary: 'Cuánto vendiste, cómo te pagan y qué se está moviendo ahora.',
    toolPath: 'resumen',
    location: 'Operación → Dashboard',
    access: 'Permiso “Dashboard / métricas”',
    steps: [
      {
        title: 'Leé las cifras principales',
        body: 'Arriba ves lo recaudado, la cantidad de pedidos, el ticket promedio y los pedidos activos. Cada cifra es una pestaña: tocala y el gráfico pasa a mostrar esa métrica.',
        image: img.dashboard,
        spot: at(378, 274),
      },
      {
        title: 'Elegí el período',
        body: 'Cambiá entre hoy, los últimos 7 o 30 días, todo el evento o un rango propio en el calendario. Atajos de teclado: H (hoy), S (7 días), M (30 días) y T (todo).',
        image: img.dashboardPeriodo,
        spot: at(379, 172),
      },
      {
        title: 'Filtrá por medio de pago',
        body: 'Tocá Mercado Pago, Efectivo o Transferencia y todo el tablero se recalcula solo para ese medio. Volvé a tocarlo para quitar el filtro.',
        image: img.dashboard,
        spot: at(560, 736),
      },
      {
        title: 'Seguí el ritmo en vivo',
        body: '“Ritmo en vivo” muestra los pedidos y lo recaudado en la última hora, minuto a minuto. No depende del período que elegiste.',
        image: img.dashboard,
        spot: at(1135, 667),
      },
      {
        title: 'Ocultá los montos',
        body: 'Con el ícono del ojo tapás las cifras de dinero, útil si proyectás el panel o lo mostrás en público. El panel recuerda tu elección.',
        image: img.dashboard,
        spot: at(1429, 108),
      },
    ],
    notes: [
      'El período y los filtros quedan en la dirección de la página: si la compartís con alguien de tu equipo, ve lo mismo que vos.',
      'Con el botón de la tabla, al lado del gráfico, ves los mismos números en filas.',
    ],
    related: ['pedidos', 'pagos'],
  },
  {
    slug: 'pedidos',
    group: 'operacion',
    title: 'Pedidos',
    summary: 'Todos los pedidos del evento, con su estado de pago y de retiro, actualizados solos.',
    toolPath: 'pedidos',
    location: 'Operación → Pedidos',
    access: 'Permiso “Pedidos”',
    steps: [
      {
        title: 'Filtrá por estado',
        body: 'Las pestañas separan los pedidos sin retirar, con entrega parcial, entregados y cancelados. El número indica cuántos hay en cada una.',
        image: img.pedidos,
        spot: at(343, 160),
      },
      {
        title: 'Buscá un pedido',
        body: 'Escribí el número, el nombre del cliente o un producto. Apretá “/” para ir directo al buscador. Con Pago y Categoría acotás todavía más.',
        image: img.pedidos,
        spot: at(720, 216),
      },
      {
        title: 'Abrí el detalle',
        body: 'Tocá un pedido para ver cuándo se pagó, qué falta retirar, los datos del cliente y el medio de pago. Con las flechas de arriba pasás al pedido anterior o siguiente sin cerrar el panel.',
        image: img.pedidosDetalle,
        spot: at(1237, 250),
      },
      {
        title: 'Trabajá con varios a la vez',
        body: 'Marcá varios pedidos para exportarlos en CSV, copiar los emails de los clientes o cancelarlos juntos.',
        image: img.pedidosSeleccion,
        spot: at(733, 752),
      },
      {
        title: 'Exportá la lista',
        body: '“Exportar” descarga un CSV con los pedidos y los filtros que tenés aplicados, para abrirlo en Excel o Google Sheets.',
        image: img.pedidos,
        spot: at(1396, 216),
      },
      {
        title: 'Compará comprados contra escaneados',
        body: 'En la vista Escaneos ves, por producto, cuántas unidades se compraron y cuántas ya se entregaron. Sirve para saber qué stock falta despachar.',
        image: img.pedidosEscaneos,
        spot: at(1357, 107),
      },
    ],
    notes: [
      'La lista se actualiza sola; no hace falta recargar la página.',
      'Cancelar un pedido es permanente: el QR deja de servir para retirar y el panel pide confirmarlo dos veces.',
    ],
    related: ['escaner', 'pagos'],
  },
  {
    slug: 'escaner',
    group: 'operacion',
    title: 'Escáner',
    summary: 'Validá el QR del comprador y registrá lo que entregás, en el momento.',
    toolPath: 'escaner',
    location: 'Celular: botón central de la barra inferior',
    access: 'Permiso “Escáner QR”',
    steps: [
      {
        title: 'Activá la cámara',
        body: 'La primera vez el navegador te va a pedir permiso para usar la cámara. Aceptalo; si lo rechazaste, habilitalo desde la configuración del sitio en el navegador.',
        image: img.escaner,
        spot: atScanner(866, 341),
      },
      {
        title: 'Apuntá al QR del comprador',
        body: 'Centrá el código en el recuadro. El panel lo lee solo y trae el pedido.',
        image: img.escanerCamara,
        spot: atScanner(866, 358),
      },
      {
        title: 'Elegí qué entregás ahora',
        body: 'Con + y − marcá cuántas unidades de cada producto estás entregando. Si en tu barra solo despachás bebidas, marcá solo esas: el resto queda pendiente para otro punto de retiro.',
        image: img.escanerElegir,
        spot: atScanner(1049, 260),
      },
      {
        title: 'Confirmá la entrega',
        body: 'Tocá “Marcar entregados”. El botón indica cuántas unidades vas a registrar.',
        image: img.escanerElegir,
        spot: atScanner(866, 389),
      },
      {
        title: 'Listo, al siguiente',
        body: '“Pedido verificado” confirma la entrega. Tocá “Escanear otro” para seguir con la fila.',
        image: img.escanerVerificado,
        spot: atScanner(760, 210),
      },
    ],
    notes: [
      'Si quedan productos o entradas sin entregar, el mismo QR se puede volver a escanear más tarde.',
      'Si el QR ya se usó completo, el escáner lo avisa y no deja entregar dos veces.',
      'Con pago en efectivo, el escáner primero te pide confirmar que recibiste el dinero y después habilita la entrega.',
      'Las entradas (tickets) se marcan como “usadas”, no como entregadas.',
    ],
    tips: ['Usalo desde el celular: en la barra inferior el escáner es el botón central.'],
    related: ['pedidos', 'puntos-retiro', 'tickets'],
  },

  {
    slug: 'arrepentimientos',
    group: 'operacion',
    title: 'Arrepentimientos',
    summary: 'Recibí las solicitudes de compradores que se arrepintieron y cancelá el QR de sus pedidos.',
    toolPath: 'arrepentimientos',
    location: 'Operación → Arrepentimientos',
    access: 'Permiso “Pedidos”',
    steps: [
      {
        title: 'El comprador usa el botón del catálogo',
        body: 'Al final de tu catálogo hay un botón “Botón de arrepentimiento”. Lleva a un formulario donde el comprador deja su nombre y apellido, e-mail, alias o datos bancarios del titular, WhatsApp, el detalle de la compra y un screenshot de la confirmación. Todos los campos son obligatorios.',
      },
      {
        title: 'Compartí el link si hace falta',
        body: 'Arriba de la lista está el “Link del formulario”. Tocá “Copiar link” para mandárselo a un comprador que te escribe por fuera del catálogo.',
      },
      {
        title: 'Revisá las solicitudes',
        body: 'La lista muestra cada solicitud con nombre, e-mail, fecha y cuántos pedidos tiene ese e-mail en el evento. Filtrá por Pendientes, Gestionados o Todos. El número junto a “Pendientes” cuenta las que todavía no atendiste.',
      },
      {
        title: 'Entrá al detalle',
        body: 'Ves todos los datos que cargó el comprador (con el screenshot ampliable) y, abajo, los pedidos del evento hechos con ese mismo e-mail. Comparalos con el detalle y el screenshot para confirmar que es su compra.',
      },
      {
        title: 'Cancelá el QR del pedido',
        body: 'En el pedido que corresponda tocá “Cancelar QR”. Te pedimos confirmación y te recordamos que solo se cancela el QR. El pedido pasa a Cancelado, el QR deja de funcionar en el escáner y el comprador recibe un aviso por e-mail.',
      },
      {
        title: 'Devolvé el pago y marcá la solicitud',
        body: 'Cancelar el QR no devuelve el dinero: el reembolso lo hacés vos, a la cuenta que el comprador indicó en “Alias o datos bancarios”, y lo coordinás con él por WhatsApp. Cuando termines, tocá “Marcar como gestionado” para sacarla de Pendientes.',
      },
    ],
    notes: [
      'Cancelar el QR no devuelve el pago. Nubapay no hace reembolsos: el organizador del evento es quien devuelve el dinero.',
      'Cancelar un QR no se puede deshacer. Los pedidos ya entregados no se pueden cancelar.',
      'Si no aparece ningún pedido, es que el comprador usó otro e-mail al comprar. Buscalo en Pedidos por nombre o por el detalle que dejó.',
      'Cada persona puede enviar hasta 3 solicitudes por evento cada 24 horas.',
    ],
    tips: ['Respondé por WhatsApp apenas llegue la solicitud: confirma que la recibiste y evita que la repita.'],
    related: ['pedidos', 'escaner', 'pagos'],
  },

  // ── Catálogo ──────────────────────────────────────────────────────────────
  {
    slug: 'catalogo',
    group: 'catalogo',
    title: 'Productos y combos',
    summary: 'Lo que se vende en el catálogo público: productos, combos, categorías y promociones.',
    toolPath: 'productos',
    location: 'Catálogo → Productos y combos',
    access: 'Permiso “Catálogo y promos”',
    steps: [
      {
        title: 'Creá un producto o un combo',
        body: 'Tocá “Nuevo”. Un producto es algo que se vende suelto; un combo agrupa varios productos con un solo precio.',
        image: img.catalogoNuevo,
        spot: at(1381, 164),
      },
      {
        title: 'Completá sus datos',
        body: 'Nombre, precio, categoría, una descripción opcional y una foto (JPG, PNG o WebP de hasta 5 MB). Tocá cualquier producto de la lista para editarlo.',
        image: img.catalogoEditar,
        spot: at(1277, 139),
      },
      {
        title: 'Pausalo o activalo',
        body: 'El interruptor de cada fila lo muestra u oculta en el catálogo al instante, sin borrarlo. Útil cuando algo se agota.',
        image: img.catalogo,
        spot: at(1400, 382),
      },
      {
        title: 'Ordená el catálogo',
        body: 'Arrastrá las filas: tus compradores ven los productos en ese mismo orden.',
        image: img.catalogo,
        spot: at(1306, 329),
      },
      {
        title: 'Organizá por categorías',
        body: 'Con “Categorías” creás, editás y eliminás las secciones del menú (por ejemplo Cervezas, Comidas, Postres).',
        image: img.catalogo,
        spot: at(1248, 164),
      },
      {
        title: 'Editá varios juntos',
        body: 'Marcá varios productos para pausarlos, activarlos o eliminarlos de una sola vez.',
        image: img.catalogo,
        spot: at(346, 329),
      },
    ],
    notes: [
      'Promociones: dentro de cada producto podés cargar un precio promocional con etiqueta y fechas de inicio y fin. El precio promo tiene que ser menor al precio de lista.',
      'Si eliminás un producto que forma parte de un combo y el combo queda vacío, el combo se pausa solo.',
      '“Link”, arriba a la derecha, te lleva a la configuración del enlace público.',
    ],
    related: ['bloques', 'puntos-retiro', 'link-catalogo'],
  },
  {
    slug: 'bloques',
    group: 'catalogo',
    title: 'Bloques destacados',
    summary: 'Secciones con banner propio que aparecen arriba del catálogo, con productos elegidos a mano.',
    toolPath: 'bloques',
    location: 'Catálogo → Bloques destacados',
    access: 'Permiso “Catálogo y promos”',
    steps: [
      {
        title: 'Creá un bloque',
        body: 'Tocá “Nuevo bloque”, poné un título, subí un banner y elegí los productos o combos que querés destacar.',
        image: img.bloques,
        spot: at(1366, 164),
      },
      {
        title: 'Editalo cuando quieras',
        body: 'Con “Editar” cambiás el título, el banner o los productos del bloque.',
        image: img.bloques,
        spot: at(577, 361),
      },
      {
        title: 'Elegí el orden',
        body: 'Los bloques aparecen arriba del catálogo en este orden. Arrastralos o usá las flechas para moverlos.',
        image: img.bloques,
        spot: at(648, 361),
      },
      {
        title: 'Mostralo u ocultalo',
        body: 'Con el interruptor sacás un bloque del catálogo sin borrarlo, por ejemplo para usarlo solo en un horario.',
        image: img.bloques,
        spot: at(1400, 266),
      },
    ],
    tips: ['Usá bloques para empujar lo que más te conviene vender: combos, promos o lo que tiene más stock.'],
    related: ['catalogo'],
  },
  {
    slug: 'tickets',
    group: 'catalogo',
    title: 'Tickets',
    summary: 'Entradas, estacionamiento o lo que quieras, con cupo y precio propios y su propio link de venta.',
    toolPath: 'tickets',
    location: 'Catálogo → Tickets',
    access: 'Permiso “Catálogo y promos”',
    steps: [
      {
        title: 'Creá un ticket',
        body: 'Tocá “Nuevo ticket” y cargá nombre, descripción, precio y cupo. Si no ponés cupo, se vende sin límite.',
        image: img.tickets,
        spot: at(1368, 126),
      },
      {
        title: 'Compartí el link de tickets',
        body: 'Los tickets se venden en su propio link. Copialo, abrilo o descargá su QR para imprimirlo.',
        image: img.tickets,
        spot: at(1320, 207),
      },
      {
        title: 'Seguí cada cupo',
        body: 'La barra muestra cuánto del cupo se vendió. Cuando quedan pocos, el ticket lo avisa; al agotarse, deja de venderse solo.',
        image: img.tickets,
        spot: at(506, 404),
      },
      {
        title: 'Pausá la venta',
        body: 'Con el interruptor “En venta” abrís o cerrás un ticket cuando quieras, por ejemplo para terminar una preventa.',
        image: img.tickets,
        spot: at(760, 407),
      },
      {
        title: 'Mirá el total del evento',
        body: 'Arriba ves cuántos tickets se vendieron, cuánto recaudaron y cuántas personas ya ingresaron.',
        image: img.tickets,
        spot: at(420, 279),
      },
    ],
    notes: [
      'El link de tickets necesita que el evento tenga portada. Subila en Link del catálogo.',
      'Los tickets también aparecen en el catálogo como una sección aparte. El orden en que los arrastres es el que ve el comprador.',
      '“Ingresaron” cuenta las entradas ya marcadas como usadas con el escáner.',
    ],
    related: ['escaner', 'link-catalogo'],
  },
  {
    slug: 'puntos-retiro',
    group: 'catalogo',
    title: 'Puntos de retiro',
    summary: 'Dónde se entrega cada producto: barras, cantinas o mostradores.',
    toolPath: 'puntos-de-retiro',
    location: 'Catálogo → Puntos de retiro',
    access: 'Permiso “Puntos de retiro”',
    steps: [
      {
        title: 'Creá un punto',
        body: 'Tocá “Nuevo punto”, poné el nombre y una descripción que ayude a encontrarlo (por ejemplo “Entrada norte, cerca de la tribuna”).',
        image: img.puntos,
        spot: at(1367, 126),
      },
      {
        title: 'Asigná lo que falta',
        body: 'El aviso de arriba lista los productos que no están en ningún punto. Con “Asignar a…” los mandás a un punto de una vez.',
        image: img.puntos,
        spot: at(1362, 205),
      },
      {
        title: 'Editá sus productos',
        body: 'Con “Editar” elegís qué productos se entregan en ese punto.',
        image: img.puntos,
        spot: at(346, 533),
      },
      {
        title: 'Abrilo o cerralo',
        body: 'El interruptor desactiva un punto sin perder su configuración, por ejemplo si una barra cierra antes.',
        image: img.puntos,
        spot: at(633, 330),
      },
    ],
    notes: [
      'En Configuración podés hacer que el email de confirmación le diga al comprador en qué punto retira.',
      'Así tu equipo sabe qué despacha cada barra al escanear.',
    ],
    related: ['escaner', 'configuracion'],
  },
  {
    slug: 'link-catalogo',
    group: 'catalogo',
    title: 'Link del catálogo',
    summary: 'La portada, la presentación y el enlace público que compartís con tu gente.',
    toolPath: 'tienda',
    location: 'Catálogo → botón “Link”',
    access: 'Permiso “Catálogo y promos”',
    steps: [
      {
        title: 'Subí la portada',
        body: 'Es la imagen que ven tus clientes al abrir el menú. Medida recomendada: 1600 × 600 px, en JPG, PNG o WebP.',
        image: img.link,
        spot: at(872, 350),
      },
      {
        title: 'Elegí cómo se presenta',
        body: 'Con “Presentación de categorías”, el catálogo muestra primero botones de categoría y el comprador elige una (o “Ver todos”) antes de ver los productos.',
        image: img.link,
        spot: at(1143, 582),
      },
      {
        title: 'Definí tu enlace',
        body: 'Elegí el texto corto del link: solo minúsculas, números y guiones, y no puede repetirse con otro evento. Guardalo y compartilo.',
        image: img.link,
        spot: at(820, 773),
      },
    ],
    notes: ['Si cambiás el texto del enlace, el link anterior deja de funcionar: actualizá los QR impresos.'],
    related: ['catalogo', 'tickets', 'comprador'],
  },

  // ── Dinero ────────────────────────────────────────────────────────────────
  {
    slug: 'pagos',
    group: 'dinero',
    title: 'Pagos',
    summary: 'Cada cobro del evento, con su estado y el pedido al que pertenece.',
    toolPath: 'pagos',
    location: 'Dinero → Cobros → Pagos',
    access: 'Permiso “Pagos”',
    steps: [
      {
        title: 'Entrá desde Cobros',
        body: 'Cobros reúne todo lo de dinero: los pagos recibidos y las pasarelas conectadas.',
        image: img.cobros,
        spot: at(660, 190, W, 328),
      },
      {
        title: 'Filtrá y ordená',
        body: 'Filtrá por estado (aprobado, pendiente o rechazado) y por medio de pago, buscá por número de pedido o cliente, y ordená por fecha o por monto.',
        image: img.pagos,
        spot: at(1170, 217),
      },
      {
        title: 'Ir al pedido',
        body: 'Tocá el número para abrir el pedido de ese pago, con sus productos y su estado de retiro.',
        image: img.pagos,
        spot: at(466, 307),
      },
    ],
    notes: ['Un pago “Pendiente” en efectivo se aprueba cuando tu equipo confirma el cobro al escanear el QR.'],
    related: ['metodos-pago', 'pedidos'],
  },
  {
    slug: 'metodos-pago',
    group: 'dinero',
    title: 'Métodos de pago',
    summary: 'Conectá las pasarelas con las que vas a cobrar este evento.',
    toolPath: 'metodos-pago',
    location: 'Dinero → Cobros → Métodos de pago',
    access: 'Solo el dueño del evento',
    steps: [
      {
        title: 'Elegí una pasarela',
        body: 'Mercado Pago y Sipago depositan los cobros directo en tu cuenta. Tocá una para conectarla.',
        image: img.metodos,
        spot: at(660, 223),
      },
      {
        title: 'Seguí la guía paso a paso',
        body: 'Para Mercado Pago, la guía te lleva en 7 pasos: entrar al panel de developers, crear la aplicación y pegar las credenciales.',
        image: img.mercadopago,
        spot: at(872, 204),
      },
      {
        title: 'Activá el efectivo si lo usás',
        body: 'Con efectivo, el comprador paga al retirar y tu equipo confirma el cobro al escanear su QR.',
        image: img.metodos,
        spot: at(977, 475),
      },
    ],
    notes: [
      '“Tarjeta en el sitio” permite pagar con tarjeta sin salir del catálogo. Para activarla necesitás Mercado Pago conectado y su clave pública.',
      'Mientras no haya pagos conectados, la barra lateral muestra el acceso “Conectar pagos”.',
    ],
    related: ['pagos'],
  },
  // ── Ajustes ───────────────────────────────────────────────────────────────
  {
    slug: 'equipo',
    group: 'ajustes',
    title: 'Equipo',
    summary: 'Invitá integrantes por email; entran al panel solo con las herramientas que les des.',
    toolPath: 'equipo',
    location: 'Ajustes → Equipo',
    access: 'Solo el dueño del evento',
    steps: [
      {
        title: 'Invitá a alguien',
        body: 'Tocá “Invitar integrante”. Si la persona ya usa Nubapay en otro evento, se suma directo; si es nueva, recibe por email el acceso con una contraseña temporal.',
        image: img.equipo,
        spot: at(1352, 106),
      },
      {
        title: 'Empezá con una plantilla',
        body: 'Acreditación (escanea en la entrada), Barra (despacha y escanea), Producción (sigue ventas y pedidos) o Administración (acceso a todo). Después podés ajustar.',
        image: img.equipoInvitar,
        spot: at(735, 354),
      },
      {
        title: 'Elegí sus herramientas',
        body: 'Marcá a qué tiene acceso: dashboard, catálogo, escáner, pedidos, puntos de retiro o pagos. Tiene que haber al menos una.',
        image: img.equipoInvitar,
        spot: at(735, 563),
      },
      {
        title: 'Enviá la invitación',
        body: 'La persona recibe el email y entra al panel de este evento.',
        image: img.equipoInvitar,
        spot: at(853, 661),
      },
      {
        title: 'Ajustá los permisos',
        body: 'Con “Editar” cambiás las herramientas de un integrante, le reenviás el acceso o lo quitás del evento.',
        image: img.equipo,
        spot: at(1391, 367),
      },
    ],
    notes: ['Equipo, Configuración y Métodos de pago solo los ve el dueño del evento.'],
    related: ['escaner', 'primeros-pasos'],
  },
  {
    slug: 'configuracion',
    group: 'ajustes',
    title: 'Configuración',
    summary: 'Nombre, descripción, fechas y estado del evento.',
    toolPath: 'configuracion',
    location: 'Ajustes → Configuración',
    access: 'Solo el dueño del evento',
    steps: [
      {
        title: 'Editá la información pública',
        body: 'El nombre y la descripción son lo que ve el comprador en el catálogo.',
        image: img.config,
        spot: at(872, 297),
      },
      {
        title: 'Poné las fechas',
        body: 'Inicio y fin son opcionales y se muestran al público.',
        image: img.config,
        spot: at(722, 515),
      },
      {
        title: 'Abrí o cerrá las ventas',
        body: 'Con “Evento activo” apagado, el catálogo público deja de aceptar pedidos nuevos. Los pedidos ya hechos siguen valiendo.',
        image: img.config,
        spot: at(1126, 586),
      },
      {
        title: 'Avisá el punto de retiro',
        body: 'Si lo activás, el email de confirmación del pedido incluye el nombre del punto donde retira el comprador.',
        image: img.config,
        spot: at(1126, 675),
      },
    ],
    notes: ['Los cambios se aplican al tocar “Guardar cambios”.'],
    related: ['puntos-retiro'],
  },

  {
    slug: 'dominio-propio',
    group: 'ajustes',
    title: 'Dominio propio',
    summary: 'Conectá tu dominio (por ejemplo pedidos.tumarca.com) para que tu catálogo salga bajo tu propia dirección.',
    toolPath: 'marca',
    location: 'Ajustes → Cuenta → Marca y dominios',
    access: 'Solo el dueño, en cuentas con marca blanca',
    steps: [
      {
        title: 'Entrá a Marca y dominios',
        body: 'En Ajustes → Cuenta tocá “Marca y dominios” y bajá hasta la sección “Tu propio dominio”. Si no ves esa opción, tu cuenta todavía no tiene la marca blanca habilitada.',
      },
      {
        title: 'Escribí tu dirección web',
        body: 'En “Dirección web” ingresá el dominio completo, por ejemplo pedidos.tumarca.com, y tocá “Agregar”. Recomendamos un subdominio (pedidos., entradas., tienda.) para no tocar el sitio principal de tu marca.',
      },
      {
        title: 'Copiá los registros DNS',
        body: 'Te mostramos los registros que tenés que cargar: un CNAME apuntando a cname.vercel-dns.com (si usás un dominio sin subdominio, un registro A con la IP que ves en pantalla y un CNAME para www) y un registro TXT con tu código de verificación. Copialos antes de cerrar la página: el código TXT no se vuelve a mostrar.',
      },
      {
        title: 'Cargalos en tu proveedor de dominio',
        body: 'Entrá al panel de donde compraste el dominio (GoDaddy, Namecheap, Cloudflare, etc.), abrí la zona de DNS y creá cada registro con el tipo, el nombre y el valor exactos. En Cloudflare dejá el CNAME en “Solo DNS” (nube gris).',
      },
      {
        title: 'Verificá el dominio',
        body: 'Volvé a Nubapay y tocá “Verificar”. Si los registros ya se propagaron, el dominio pasa de Pendiente a Activo. La propagación puede tardar hasta 48 horas: si falla, esperá y probá de nuevo.',
      },
      {
        title: 'Compartí tu nueva dirección',
        body: 'Cuando el dominio está Activo, el catálogo, los tickets y el botón de arrepentimiento también se abren desde tu dominio, y los links que copiás en el panel ya usan esa dirección.',
      },
    ],
    notes: [
      'El código TXT se muestra una sola vez, al agregar el dominio. Si lo perdés, eliminá el dominio y agregalo de nuevo para generar uno nuevo.',
      'El dominio sin verificar no sirve tu catálogo: hasta que figure Activo, seguí compartiendo tu dirección de Nubapay.',
      'Eliminar un dominio es definitivo y deja de funcionar al instante: actualizá los QR y links impresos antes de borrarlo.',
      'No necesitás dominio propio para vender: tu catálogo funciona desde el primer momento en tu dirección de Nubapay.',
    ],
    tips: ['Si no sabés dónde cargar los DNS, pedile a quien administra tu dominio que cree los tres registros que te mostramos.'],
    related: ['link-catalogo', 'configuracion'],
  },

  // ── Comprador ─────────────────────────────────────────────────────────────
  {
    slug: 'comprador',
    group: 'comprador',
    title: 'Lo que ve tu comprador',
    summary: 'El recorrido desde que abre tu link hasta que retira con su QR, sin descargar nada ni crear cuenta.',
    location: 'Tu link público',
    access: 'Cualquier persona con el link',
    steps: [
      {
        title: 'Abre el catálogo',
        body: 'Ve tu portada, los bloques destacados y los productos por categoría. Puede buscar y filtrar por precio.',
        image: img.compradorCatalogo,
      },
      {
        title: 'Arma su carrito',
        body: 'Suma productos y ajusta cantidades. El carrito le sugiere otros productos para agregar.',
        image: img.compradorCarrito,
      },
      {
        title: 'Confirma y paga',
        body: 'Deja su nombre y su email y elige cómo pagar entre los medios que activaste.',
        image: img.compradorCheckout,
      },
      {
        title: 'Retira con su QR',
        body: 'Al pagar ve su código QR de retiro. Lo muestra en la barra o en la entrada y tu equipo lo escanea. Las entradas compradas por el link de tickets le llegan además por email.',
        image: img.compradorQr,
      },
    ],
    notes: ['Si el pedido tiene productos de distintos puntos de retiro, el mismo QR sirve en cada uno.'],
    related: ['link-catalogo', 'escaner'],
  },
]

export function getDocArticle(slug: string): DocArticle | undefined {
  return DOC_ARTICLES.find(a => a.slug === slug)
}

/** Artículo anterior y siguiente en el orden de la navegación. */
export function getAdjacentArticles(slug: string): { prev?: DocArticle; next?: DocArticle } {
  const i = DOC_ARTICLES.findIndex(a => a.slug === slug)
  if (i === -1) return {}
  return { prev: DOC_ARTICLES[i - 1], next: DOC_ARTICLES[i + 1] }
}
