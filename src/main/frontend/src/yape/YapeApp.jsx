import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import {
  IconArrowLeft,
  IconArrowDownLeft,
  IconArrowUpRight,
  IconBell,
  IconCheck,
  IconChevronRight,
  IconDownload,
  IconEye,
  IconEyeOff,
  IconHeadset,
  IconHome,
  IconLogout,
  IconQrcode,
  IconSearch,
  IconSend,
  IconShieldCheck,
  IconUser,
  IconX,
  IconRefresh,
  IconHistory,
  IconChevronDown,
  IconInfoCircle,
  IconCamera,
  IconSparkles,
} from "@tabler/icons-react";
import {
  CONTACTS,
  STORAGE_KEY,
  dateLabel,
  initialWallet,
  initials,
  loadWallet,
  money,
  sendPayment,
} from "./wallet";
import "./yape.css";

const SERVICES = [
  {
    id: "recargas",
    label: "Recargar celular",
    image: "recargas.svg",
    description: "Recarga tu celular al toque.",
    action: "Recargar",
  },
  {
    id: "servicios",
    label: "Yapear servicios",
    image: "servicios.svg",
    description: "Agua, luz, internet y mucho más.",
    action: "Pagar servicio",
  },
  { id: "promos", label: "Promos", image: "promos.svg" },
  { id: "codigo", label: "Código de aprobación", sprite: [870, 540] },
  {
    id: "creditos",
    label: "Créditos",
    image: "creditos.svg",
    description: "Simula un crédito para eso que tienes en mente.",
    action: "Simular crédito",
  },
  { id: "tienda", label: "Tienda", image: "tienda.svg" },
  {
    id: "dolares",
    label: "Dólares",
    image: "dolares.svg",
    description: "Explora cómo cambiar soles a dólares.",
    action: "Calcular cambio",
  },
  {
    id: "remesas",
    label: "Remesas",
    sprite: [870, 850],
    description: "Tu dinero del extranjero, más cerca de ti.",
  },
  {
    id: "seguros",
    label: "Seguros y SOAT",
    sprite: [120, 1160],
    description: "Cuida lo que más quieres.",
  },
  {
    id: "bus",
    label: "Viajar en bus",
    sprite: [370, 1160],
    description: "Tu próximo destino empieza aquí.",
  },
  {
    id: "entradas",
    label: "Entradas",
    sprite: [620, 1160],
    description: "La emoción de estar ahí.",
  },
  { id: "todo", label: "Ver todo", sprite: [870, 1160] },
];
const PROMOS = [
  {
    title: "¡Un antojo a precio yapero!",
    text: "Descubre las promos que tenemos para ti.",
    image: "promos.svg",
    tag: "Yape Promos",
    tone: "peach",
  },
  {
    title: "Tu próxima compra está aquí",
    text: "Encuentra algo que te encante.",
    image: "tienda.svg",
    tag: "Yape Tienda",
    tone: "lilac",
  },
  {
    title: "Un empujoncito para tus planes",
    text: "Conoce la experiencia de Créditos.",
    image: "creditos.svg",
    tag: "Créditos",
    tone: "mint",
  },
];

function ServiceIcon({ service }) {
  return (
    <span
      className={`service-icon ${service.sprite ? "official-sprite" : ""}`}
      style={
        service.sprite
          ? { "--sprite-x": service.sprite[0], "--sprite-y": service.sprite[1] }
          : undefined
      }
    >
      {service.image && <img src={`/yape/${service.image}`} alt="" />}
    </span>
  );
}

function Avatar({ person, size = "" }) {
  return (
    <span
      className={`avatar ${person.color || "purple"} ${size}`}
      aria-hidden="true"
    >
      {initials(person.name)}
    </span>
  );
}

function TransactionList({ transactions, onSelect }) {
  return (
    <div className="transaction-list">
      {transactions.length ? (
        transactions.map((tx) => (
          <button
            className="transaction"
            key={tx.id}
            onClick={() => onSelect(tx)}
          >
            <Avatar person={tx} />
            <span className="transaction-person">
              <strong>{tx.name}</strong>
              <span>
                {tx.type === "received" ? "Te yapeó" : "Yapeaste"} ·{" "}
                {dateLabel(tx.date)}
              </span>
            </span>
            <span className={`transaction-amount ${tx.type}`}>
              <strong>
                {tx.type === "received" ? "+" : "−"} {money(tx.cents)}
              </strong>
              {tx.type === "received" ? (
                <IconArrowDownLeft size={14} />
              ) : (
                <IconArrowUpRight size={14} />
              )}
            </span>
          </button>
        ))
      ) : (
        <div className="empty-state">
          <IconHistory size={38} />
          <h3>No encontramos movimientos</h3>
          <p>Prueba con otro nombre o cambia el filtro.</p>
        </div>
      )}
    </div>
  );
}

function AppHeader({ title, back = "/", children }) {
  return (
    <header className="page-header">
      <Link to={back} className="icon-button" aria-label="Volver">
        <IconArrowLeft />
      </Link>
      <h1>{title}</h1>
      {children || <span className="header-spacer" />}
    </header>
  );
}

function PaymentActions() {
  return (
    <nav className="payment-actions" aria-label="Acciones principales">
      <Link className="button outline" to="/app/escanear">
        <IconQrcode size={22} />
        Escanear QR
      </Link>
      <Link className="button primary" to="/app/contactos">
        <IconSend size={22} />
        Yapear
      </Link>
    </nav>
  );
}

function DemoQR({ large = false }) {
  const canvas = useRef(null);
  useEffect(() => {
    QRCode.toCanvas(
      canvas.current,
      "YAPE-DEMO-UNIVERSIDAD:CARLOS:SOLO-DATOS-FICTICIOS",
      {
        width: large ? 260 : 210,
        margin: 1,
        color: { dark: "#54206b", light: "#ffffff" },
      },
    ).catch(() => {});
  }, [large]);
  return (
    <canvas
      className="demo-qr"
      ref={canvas}
      aria-label="Código QR de demostración, sin datos de una cuenta real"
      role="img"
    />
  );
}

export default function YapeApp() {
  const navigate = useNavigate();
  const location = useLocation();
  const [wallet, setWallet] = useState(loadWallet);
  const [showBalance, setShowBalance] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sheet, setSheet] = useState(null);
  const [contact, setContact] = useState(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [slide, setSlide] = useState(0);
  const [serviceValue, setServiceValue] = useState("");
  const [serviceResult, setServiceResult] = useState("");
  const [notice, setNotice] = useState("");
  const [notificationsRead, setNotificationsRead] = useState(false);
  const sheetRef = useRef(null);
  const sheetTrigger = useRef(null);
  const sending = useRef(false);
  const path = location.pathname;
  const isContacts =
    path.includes("contactos") || path.includes("transferences");
  const isPayment = path.includes("yapear");
  const isMovements = path.includes("movimientos");
  const isScanner = path.includes("escanear");
  const isQR = path.includes("mi-qr");
  const isReceipt = path.includes("constancia") && receipt;
  const isLogin = path.includes("/auth/");
  const isHome =
    !isContacts &&
    !isPayment &&
    !isMovements &&
    !isScanner &&
    !isQR &&
    !isReceipt &&
    !isLogin;

  useEffect(() => {
    if (path.includes("constancia") && !receipt)
      navigate("/app/movimientos", { replace: true });
  }, [path, receipt, navigate]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
    } catch {
      /* La sesión sigue funcionando cuando el navegador bloquea localStorage. */
    }
  }, [wallet]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setQuery("");
    setError("");
  }, [path]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!sheet) return;
    sheetTrigger.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetRef.current?.focus();
    const keyHandler = (event) => {
      if (event.key === "Escape") setSheet(null);
      if (event.key === "Tab") {
        const focusable = sheetRef.current?.querySelectorAll(
          "button, a[href], input, select, textarea",
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === sheetRef.current)
        ) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", keyHandler);
      sheetTrigger.current?.focus();
    };
  }, [sheet]);

  function openService(service) {
    setServiceValue("");
    setServiceResult("");
    setSheet(service.id);
  }

  function selectContact(person) {
    setContact(person);
    setAmount("");
    setMessage("");
    setError("");
    navigate("/app/yapear");
  }

  function pay(event) {
    event.preventDefault();
    if (sending.current) return;
    sending.current = true;
    try {
      const updated = sendPayment(wallet, contact, amount, message);
      setWallet(updated);
      setReceipt(updated.transactions[0]);
      navigate("/app/constancia");
    } catch (paymentError) {
      setError(paymentError.message);
    } finally {
      sending.current = false;
    }
  }

  function resetDemo() {
    setWallet(initialWallet());
    setReceipt(null);
    setContact(null);
    setShowBalance(false);
    setFilter("all");
    setSheet(null);
    navigate("/");
    setNotice("Tu demo está lista para comenzar de nuevo.");
  }

  const normalizedQuery = query
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const matchingServices = SERVICES.filter((service) =>
    service.label
      .toLocaleLowerCase("es")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .includes(normalizedQuery),
  );
  const matchingContacts = CONTACTS.filter((person) =>
    `${person.name} ${person.phone}`
      .toLocaleLowerCase("es")
      .includes(query.toLocaleLowerCase("es")),
  );
  const transactions = wallet.transactions.filter(
    (tx) =>
      (filter === "all" || tx.type === filter) &&
      `${tx.name} ${tx.message}`
        .toLocaleLowerCase("es")
        .includes(query.toLocaleLowerCase("es")),
  );
  const selectedService = SERVICES.find((service) => service.id === sheet);
  const promo = PROMOS[slide];

  return (
    <div className="demo-stage">
      <aside className="desktop-caption">
        <span className="caption-dot" />
        PROYECTO UNIVERSITARIO
        <span className="caption-line" />
        <span>Una experiencia inspirada en Yape</span>
      </aside>
      <div className={`phone-app ${isHome ? "home-screen" : ""}`}>
        <div className="demo-ribbon">
          <IconShieldCheck size={12} />
          <span>SIMULACIÓN UNIVERSITARIA</span>
          <span className="ribbon-dot">·</span>
          <span>Datos ficticios</span>
        </div>

        {isHome && (
          <>
            <section className="home-purple">
              <header className="home-header">
                <button
                  className="icon-button"
                  aria-label="Abrir mi perfil"
                  onClick={() => setSheet("perfil")}
                >
                  <IconUser size={26} />
                </button>
                <div className="greeting">
                  Hola, Carlos <span>Gratis</span>
                </div>
                <button
                  className="icon-button"
                  aria-label="Ayuda"
                  onClick={() => setSheet("ayuda")}
                >
                  <IconHeadset size={25} />
                </button>
                <button
                  className="icon-button notification-button"
                  aria-label="Notificaciones"
                  onClick={() => {
                    setNotificationsRead(true);
                    setSheet("notificaciones");
                  }}
                >
                  <IconBell size={25} />
                  {!notificationsRead && <i />}
                </button>
              </header>
              <label className="search-box home-search">
                <span>
                  <IconSearch size={23} />
                </span>
                <input
                  aria-label="Buscar una funcionalidad"
                  placeholder="Buscar una funcionalidad"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                {query && (
                  <button
                    className="clear-search"
                    onClick={() => setQuery("")}
                    aria-label="Limpiar búsqueda"
                  >
                    <IconX size={18} />
                  </button>
                )}
              </label>
              <div className="services-grid">
                {matchingServices.map((service) => (
                  <button
                    className="service"
                    key={service.id}
                    onClick={() => openService(service)}
                  >
                    <ServiceIcon service={service} />
                    <span>{service.label}</span>
                  </button>
                ))}
              </div>
              {!matchingServices.length && (
                <p className="no-services">No encontramos esa funcionalidad.</p>
              )}
              {!query && (
                <>
                  <button
                    className="official-promo"
                    aria-label="Ver promoción de gas"
                    onClick={() =>
                      setSheet(
                        slide === 0
                          ? "promo-gas"
                          : PROMOS[slide].tag === "Créditos"
                            ? "creditos"
                            : "tienda",
                      )
                    }
                  >
                    {slide === 0 ? (
                      <span
                        className="official-banner"
                        role="img"
                        aria-label="Promoción visual de referencia YAPEGAS de la aplicación Yape"
                      />
                    ) : (
                      <span className={`alternate-promo ${promo.tone}`}>
                        <span className="promo-copy">
                          <small>{promo.tag}</small>
                          <strong>{promo.title}</strong>
                          <span>{promo.text}</span>
                        </span>
                        <img src={`/yape/${promo.image}`} alt="" />
                      </span>
                    )}
                    <span className="promo-demo-label">
                      PROMO DE DEMOSTRACIÓN
                    </span>
                  </button>
                  <div className="carousel-dots" aria-label="Promociones">
                    {PROMOS.map((item, index) => (
                      <button
                        key={item.tag}
                        aria-label={`Ver promoción ${index + 1}`}
                        aria-pressed={slide === index}
                        className={slide === index ? "active" : ""}
                        onClick={() => setSlide(index)}
                      />
                    ))}
                  </div>
                </>
              )}
            </section>
            <section className="home-white">
              <button
                className="balance-card"
                onClick={() => setShowBalance(!showBalance)}
                aria-expanded={showBalance}
              >
                {showBalance ? <IconEyeOff size={22} /> : <IconEye size={22} />}
                <span>
                  {showBalance ? "Tu saldo disponible" : "Mostrar saldo"}
                </span>
                {showBalance && <strong>{money(wallet.balance)}</strong>}
                <IconChevronDown
                  size={18}
                  className={showBalance ? "rotate" : ""}
                />
              </button>
              <div className="section-heading">
                <h2>Últimos movimientos</h2>
                <Link to="/app/movimientos">
                  Ver todos <IconChevronRight size={16} />
                </Link>
              </div>
              <TransactionList
                transactions={wallet.transactions.slice(0, 3)}
                onSelect={(tx) => {
                  setReceipt(tx);
                  navigate("/app/constancia");
                }}
              />
              <button
                className="qr-shortcut"
                onClick={() => navigate("/app/mi-qr")}
              >
                <span className="qr-mini">
                  <IconQrcode size={25} />
                </span>
                <span>
                  <strong>Recibe yapeos con tu QR</strong>
                  <small>Muéstralo y listo, así de fácil.</small>
                </span>
                <IconChevronRight size={20} />
              </button>
              <p className="academic-note">
                Un proyecto para aprender. Todas las operaciones son simuladas.
              </p>
            </section>
            <PaymentActions />
          </>
        )}

        {isContacts && (
          <>
            <AppHeader title="Yapear" />
            <main className="page-body contacts-page">
              <h2>¿A quién le vas a yapear?</h2>
              <p className="muted">Elige un contacto para comenzar.</p>
              <label className="search-box light-search">
                <IconSearch size={21} />
                <input
                  autoComplete="off"
                  aria-label="Buscar contacto"
                  placeholder="Busca por nombre o celular"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <div className="info-inline">
                <IconInfoCircle size={17} />
                Contactos ficticios para tu demostración
              </div>
              <h3 className="list-label">
                MIS CONTACTOS <span>{matchingContacts.length}</span>
              </h3>
              <div className="contact-list">
                {matchingContacts.map((person) => (
                  <button
                    className="contact"
                    key={person.id}
                    onClick={() => selectContact(person)}
                  >
                    <Avatar person={person} />
                    <span>
                      <strong>{person.name}</strong>
                      <small>
                        {person.phone.replace(
                          /(\d{3})(\d{3})(\d{3})/,
                          "$1 $2 $3",
                        )}
                      </small>
                    </span>
                    <span className="contact-brand">yape</span>
                    <IconChevronRight size={19} />
                  </button>
                ))}
              </div>
              {!matchingContacts.length && (
                <div className="empty-state">
                  <IconSearch size={38} />
                  <h3>No encontramos ese contacto</h3>
                  <p>Usa uno de los contactos ficticios de la demo.</p>
                </div>
              )}
            </main>
          </>
        )}

        {isPayment && (
          <>
            <AppHeader title="Yapear" back="/app/contactos" />
            <main className="page-body payment-page">
              {contact ? (
                <form onSubmit={pay}>
                  <Avatar person={contact} size="large" />
                  <p className="muted">Vas a yapear a</p>
                  <h2>{contact.name}</h2>
                  <p className="contact-phone">
                    {contact.phone.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3")}
                  </p>
                  <label className="amount-label" htmlFor="payment-amount">
                    ¿Cuánto vas a yapear?
                  </label>
                  <div className="amount-field">
                    <span>S/</span>
                    <input
                      autoFocus
                      id="payment-amount"
                      aria-describedby="amount-help payment-error"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={amount}
                      onChange={(event) => {
                        setAmount(event.target.value);
                        setError("");
                      }}
                      autoComplete="off"
                      maxLength={10}
                    />
                  </div>
                  <p id="amount-help" className="amount-help">
                    Disponible: <strong>{money(wallet.balance)}</strong>
                    <span>Máximo S/ 500.00 por yapeo simulado</span>
                  </p>
                  <label className="message-field">
                    Agrega un mensaje <span>(opcional)</span>
                    <input
                      placeholder="¿Para qué es este yapeo?"
                      maxLength={80}
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                    />
                  </label>
                  <div className="payment-tip">
                    <IconShieldCheck size={20} />
                    <p>
                      Este yapeo usa tu saldo ficticio.
                      <br />
                      Puedes practicar con tranquilidad.
                    </p>
                  </div>
                  {error && (
                    <p className="form-error" role="alert" id="payment-error">
                      {error}
                    </p>
                  )}
                  <button
                    className="button primary full"
                    type="submit"
                    disabled={!amount.trim()}
                  >
                    <IconSend size={21} />
                    Yapear
                  </button>
                </form>
              ) : (
                <div className="empty-state">
                  <IconUser size={44} />
                  <h2>Primero elige un contacto</h2>
                  <Link to="/app/contactos" className="button primary">
                    Ver contactos
                  </Link>
                </div>
              )}
            </main>
          </>
        )}

        {isMovements && (
          <>
            <AppHeader title="Mis movimientos" />
            <main className="page-body movements-page">
              <div className="movements-balance">
                <span>Saldo disponible</span>
                <strong>{money(wallet.balance)}</strong>
                <small>Saldo de demostración</small>
              </div>
              <label className="search-box light-search">
                <IconSearch size={20} />
                <input
                  placeholder="Buscar un movimiento"
                  aria-label="Buscar un movimiento"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <div className="filter-tabs" aria-label="Filtrar movimientos">
                {[
                  ["all", "Todos"],
                  ["received", "Recibidos"],
                  ["sent", "Enviados"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    aria-pressed={filter === value}
                    className={filter === value ? "selected" : ""}
                    onClick={() => setFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="list-label">{transactions.length} MOVIMIENTOS</p>
              <TransactionList
                transactions={transactions}
                onSelect={(tx) => {
                  setReceipt(tx);
                  navigate("/app/constancia");
                }}
              />
              <p className="academic-note">
                Tus movimientos se guardan en este navegador.
              </p>
            </main>
          </>
        )}

        {isQR && (
          <>
            <AppHeader title="Mi QR" />
            <main className="page-body qr-page">
              <img src="/yape/logo.png" className="purple-logo" alt="Yape" />
              <h2>¡Que te yapeen al toque!</h2>
              <p className="muted">Este es tu QR de demostración.</p>
              <div className="qr-card">
                <DemoQR large />
                <strong>Carlos Mendoza</strong>
                <span>Cuenta universitaria de demostración</span>
              </div>
              <div className="info-inline">
                <IconInfoCircle size={18} />
                Este QR contiene solo un texto de práctica.
              </div>
              <button
                className="button primary full"
                onClick={() => {
                  const canvas = document.querySelector(".demo-qr");
                  const anchor = document.createElement("a");
                  anchor.download = "yape-qr-demo.png";
                  anchor.href = canvas.toDataURL("image/png");
                  anchor.click();
                  setNotice("QR de demostración descargado.");
                }}
              >
                <IconDownload size={20} />
                Descargar mi QR
              </button>
            </main>
          </>
        )}

        {isScanner && (
          <>
            <AppHeader title="Escanear QR" />
            <main className="scanner-page">
              <div className="scan-intro">
                <IconCamera size={32} />
                <h2>Escanea y yapea</h2>
                <p>Encuadra un QR para continuar.</p>
              </div>
              <div className="scanner-frame">
                <span />
                <DemoQR />
                <i />
              </div>
              <p className="scan-hint">Escáner de demostración</p>
              <div className="scanner-bottom">
                <h3>Probemos con un QR de ejemplo</h3>
                <p>
                  Simula el escaneo del QR de Bodega Don Pepe para practicar un
                  pago.
                </p>
                <button
                  className="button primary full"
                  onClick={() =>
                    selectContact(
                      CONTACTS.find((person) => person.id === "bodega"),
                    )
                  }
                >
                  <IconQrcode size={21} />
                  Usar QR de ejemplo
                </button>
                <Link to="/app/mi-qr" className="text-button">
                  Ver mi QR
                </Link>
              </div>
            </main>
          </>
        )}

        {isReceipt && (
          <>
            <AppHeader title="Detalle del movimiento" back="/app/movimientos" />
            <main className="receipt-page">
              <div className="receipt-brand">
                <img src="/yape/logo.png" alt="Yape" />
                <span>
                  <IconCheck size={18} />
                  SIMULACIÓN
                </span>
              </div>
              <div className="receipt-card">
                <span className="receipt-success">
                  <IconCheck size={38} stroke={3} />
                </span>
                <h2>
                  {receipt.type === "received"
                    ? "¡Recibiste un yapeo!"
                    : "¡Yapeaste!"}
                </h2>
                <strong className="receipt-amount">
                  {money(receipt.cents)}
                </strong>
                <h3>{receipt.name}</h3>
                <p className="receipt-date">{dateLabel(receipt.date)}</p>
                {receipt.message && (
                  <p className="receipt-message">“{receipt.message}”</p>
                )}
                <div className="receipt-divider" />
                <dl>
                  <div>
                    <dt>Nro. de celular</dt>
                    <dd>*** *** {receipt.phone?.slice(-3)}</dd>
                  </div>
                  <div>
                    <dt>Destino</dt>
                    <dd>Yape · Demo</dd>
                  </div>
                  <div>
                    <dt>Operación</dt>
                    <dd>{receipt.id.slice(0, 17)}</dd>
                  </div>
                </dl>
                <div className="receipt-watermark">
                  DEMOSTRACIÓN UNIVERSITARIA
                  <br />
                  <span>Sin valor como constancia de pago</span>
                </div>
              </div>
              <Link className="button primary full" to="/app/contactos">
                <IconSend size={20} />
                Nuevo yapeo
              </Link>
              <Link className="receipt-home" to="/">
                <IconHome size={18} />
                Volver al inicio
              </Link>
            </main>
          </>
        )}

        {isLogin && (
          <main className="welcome-page">
            <img src="/yape/logo.png" alt="Yape" />
            <div className="welcome-illustration">
              <img src="/yape/app-icon.webp" alt="Icono de Yape" />
              <span>
                <IconSparkles size={28} />
              </span>
            </div>
            <h1>¡Hola de nuevo!</h1>
            <p>
              Tu experiencia yapera
              <br />
              empieza aquí.
            </p>
            <Link to="/" className="button primary full">
              Ingresar a la demo
              <IconArrowUpRight size={22} />
            </Link>
            <Link className="welcome-qr" to="/app/mi-qr">
              <IconQrcode size={23} />
              Mostrar mi QR
            </Link>
            <small>Proyecto universitario · Sin credenciales reales</small>
          </main>
        )}

        {!isHome && !isReceipt && !isLogin && (
          <footer className="inner-footer">
            <img src="/yape/logo.png" alt="Yape" />
            <span>SIMULACIÓN UNIVERSITARIA</span>
          </footer>
        )}
        {notice && (
          <div className="toast-message" role="status">
            <IconCheck size={19} />
            {notice}
          </div>
        )}
      </div>
      <p className="desktop-footnote">
        Hecho para aprender. Inspirado en Yape.
      </p>

      {sheet && (
        <div
          className="sheet-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSheet(null);
          }}
        >
          <section
            ref={sheetRef}
            tabIndex={-1}
            className="bottom-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheet-title"
          >
            <div className="sheet-handle" />
            <button
              className="sheet-close icon-button"
              aria-label="Cerrar ventana"
              onClick={() => setSheet(null)}
            >
              <IconX size={23} />
            </button>
            {sheet === "perfil" && (
              <>
                <div className="profile-summary">
                  <Avatar
                    person={{ name: "Carlos Mendoza", color: "purple" }}
                    size="large"
                  />
                  <h2 id="sheet-title">Carlos Mendoza</h2>
                  <p>Cuenta de demostración</p>
                  <span className="demo-pill">Proyecto universitario</span>
                </div>
                <div className="menu-list">
                  <button
                    onClick={() => {
                      setSheet(null);
                      navigate("/app/mi-qr");
                    }}
                  >
                    <IconQrcode />
                    Mi QR
                    <IconChevronRight />
                  </button>
                  <button
                    onClick={() => {
                      setSheet(null);
                      navigate("/app/movimientos");
                    }}
                  >
                    <IconHistory />
                    Mis movimientos
                    <IconChevronRight />
                  </button>
                  <button onClick={() => setSheet("reiniciar")}>
                    <IconRefresh />
                    Reiniciar demostración
                    <IconChevronRight />
                  </button>
                  <button
                    onClick={() => {
                      setSheet(null);
                      navigate("/auth/login");
                    }}
                  >
                    <IconLogout />
                    Salir de la demo
                    <IconChevronRight />
                  </button>
                </div>
              </>
            )}
            {sheet === "reiniciar" && (
              <>
                <span className="sheet-hero-icon">
                  <IconRefresh size={36} />
                </span>
                <h2 id="sheet-title">¿Comenzamos de nuevo?</h2>
                <p>
                  Tu saldo ficticio volverá a S/ 1,250.80 y se restaurarán los
                  movimientos de ejemplo.
                </p>
                <button className="button primary full" onClick={resetDemo}>
                  Sí, reiniciar demo
                </button>
                <button
                  className="text-button"
                  onClick={() => setSheet("perfil")}
                >
                  Conservar mis movimientos
                </button>
              </>
            )}
            {sheet === "ayuda" && (
              <>
                <span className="sheet-hero-icon">
                  <IconHeadset size={36} />
                </span>
                <h2 id="sheet-title">¡Estamos para aprender!</h2>
                <p>Esta es una simulación académica inspirada en Yape.</p>
                <div className="help-steps">
                  <p>
                    <strong>1. Explora el inicio</strong>Prueba los servicios y
                    muestra tu saldo.
                  </p>
                  <p>
                    <strong>2. Haz tu primer yapeo</strong>Elige un contacto
                    ficticio e ingresa un monto.
                  </p>
                  <p>
                    <strong>3. Revisa tus movimientos</strong>Tu saldo y tus
                    yapeos se guardan en este navegador.
                  </p>
                </div>
                <button
                  className="button primary full"
                  onClick={() => setSheet(null)}
                >
                  ¡Entendido!
                </button>
              </>
            )}
            {sheet === "notificaciones" && (
              <>
                <span className="sheet-hero-icon">
                  <IconBell size={35} />
                </span>
                <h2 id="sheet-title">Tus notificaciones</h2>
                <div className="notification-card">
                  <span className="notification-icon">
                    <IconCheck />
                  </span>
                  <div>
                    <strong>¡Te damos la bienvenida!</strong>
                    <p>
                      Tu cuenta demo está lista. Tienes S/ 1,250.80 ficticios
                      para explorar la experiencia.
                    </p>
                    <small>Demostración universitaria</small>
                  </div>
                </div>
              </>
            )}
            {sheet === "todo" && (
              <>
                <h2 id="sheet-title">Todo lo que puedes hacer</h2>
                <p>Descubre tu universo yapero.</p>
                <div className="all-services">
                  {SERVICES.filter((service) => service.id !== "todo").map(
                    (service) => (
                      <button
                        key={service.id}
                        onClick={() => openService(service)}
                      >
                        <ServiceIcon service={service} />
                        <span>{service.label}</span>
                        <IconChevronRight size={18} />
                      </button>
                    ),
                  )}
                </div>
              </>
            )}
            {sheet === "codigo" && (
              <>
                <span className="sheet-hero-icon">
                  <IconShieldCheck size={38} />
                </span>
                <h2 id="sheet-title">Código de aprobación</h2>
                <p>Así se ve el código para aprobar una compra.</p>
                <div className="approval-code">0 0 0</div>
                <span className="demo-pill">
                  Código ficticio · Solo demostración
                </span>
                <p className="small-note">
                  Ninguna compra real se puede aprobar con este código.
                </p>
              </>
            )}
            {sheet === "promo-gas" && (
              <>
                <div className="sheet-banner official-banner" />
                <h2 id="sheet-title">Un precio bien yapero</h2>
                <p>
                  Este banner original forma parte de la referencia visual de
                  Yape. En esta simulación puedes explorar la experiencia sin
                  realizar compras.
                </p>
                <span className="demo-pill">
                  Promoción visual de demostración
                </span>
                <button
                  className="button primary full"
                  onClick={() => setSheet("promos")}
                >
                  Ver más promos
                </button>
              </>
            )}
            {(sheet === "promos" || sheet === "tienda") && (
              <>
                <h2 id="sheet-title">
                  {sheet === "promos"
                    ? "Promos para alegrar tu día"
                    : "Bienvenido a Yape Tienda"}
                </h2>
                <p>Un vistazo a todo lo que puedes encontrar.</p>
                <div className="promo-cards">
                  {PROMOS.map((item, index) => (
                    <button
                      className={`promo-card ${item.tone}`}
                      key={item.tag}
                      onClick={() => {
                        setServiceResult(
                          `Elegiste “${item.title}”. Esta oferta es una muestra para tu proyecto universitario.`,
                        );
                      }}
                    >
                      <img src={`/yape/${item.image}`} alt="" />
                      <div>
                        <small>{item.tag}</small>
                        <strong>{item.title}</strong>
                        <span>
                          {index === 0 ? "Ver promo" : "Descubrir"}
                          <IconChevronRight size={15} />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                {serviceResult && (
                  <p className="result-box" role="status">
                    {serviceResult}
                  </p>
                )}
              </>
            )}
            {selectedService &&
              !["todo", "codigo", "promos", "tienda"].includes(sheet) && (
                <>
                  <div className="sheet-service-icon">
                    <ServiceIcon service={selectedService} />
                  </div>
                  <h2 id="sheet-title">{selectedService.label}</h2>
                  <p>{selectedService.description}</p>
                  {["recargas", "servicios", "creditos", "dolares"].includes(
                    sheet,
                  ) ? (
                    <form
                      className="service-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const value = Number(serviceValue);
                        if (!Number.isFinite(value) || value <= 0) return;
                        setServiceResult(
                          sheet === "dolares"
                            ? `Con un tipo de cambio ficticio de S/ 3.75, recibirías US$ ${(value / 3.75).toFixed(2)}. Este valor es solo un ejemplo académico.`
                            : sheet === "creditos"
                              ? `Simulación de ${money(Math.round(value * 100))} en 6 cuotas: ${money(Math.round((value * 100) / 6))} por cuota, sin intereses en este ejemplo académico. No se solicita ni desembolsa un crédito.`
                              : `¡Listo! Simulaste ${sheet === "recargas" ? "una recarga" : "un pago de servicio"} de ${money(Math.round(value * 100))}. Tu saldo se conserva en esta vista de práctica.`,
                        );
                      }}
                    >
                      <label>
                        Monto en soles
                        <input
                          type="number"
                          inputMode="decimal"
                          min="0.01"
                          max="10000"
                          step="0.01"
                          placeholder="S/ 0.00"
                          required
                          value={serviceValue}
                          onChange={(event) => {
                            setServiceValue(event.target.value);
                            setServiceResult("");
                          }}
                        />
                      </label>
                      <button className="button primary full">
                        {selectedService.action}
                      </button>
                      {serviceResult && (
                        <p className="result-box" role="status">
                          {serviceResult}
                        </p>
                      )}
                    </form>
                  ) : (
                    <>
                      <img
                        className="service-feature-image"
                        src={
                          sheet === "remesas"
                            ? "/yape/remesas.png"
                            : "/yape/seguridad.png"
                        }
                        alt={
                          sheet === "remesas"
                            ? "Ilustración oficial de remesas Yape"
                            : "Imagen oficial de Yape"
                        }
                      />
                      <p className="info-inline">
                        <IconInfoCircle size={18} />
                        Vista de exploración de la simulación universitaria.
                      </p>
                      <button
                        className="button primary full"
                        onClick={() => setSheet(null)}
                      >
                        Volver a mi inicio
                      </button>
                    </>
                  )}
                </>
              )}
            <p className="sheet-footer">
              Demo universitaria · Operaciones ficticias
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
