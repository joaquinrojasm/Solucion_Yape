export const STORAGE_KEY = "yape-universidad-v1";
export const CONTACTS = [
  { id: "ana", name: "Ana Torres", phone: "900000101", color: "pink" },
  { id: "diego", name: "Diego Ramírez", phone: "900000102", color: "blue" },
  { id: "lucia", name: "Lucía Mendoza", phone: "900000103", color: "orange" },
  { id: "mateo", name: "Mateo García", phone: "900000104", color: "green" },
  { id: "sofia", name: "Sofía Flores", phone: "900000105", color: "purple" },
  {
    id: "bodega",
    name: "Bodega Don Pepe",
    phone: "900000106",
    color: "orange",
  },
];

export const money = (cents) =>
  `S/ ${(cents / 100).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const initials = (name) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
export const dateLabel = (date) =>
  new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Lima",
  }).format(new Date(date));

export function initialWallet() {
  return {
    balance: 125080,
    transactions: [
      {
        id: "DEMO-005",
        name: "Ana Torres",
        phone: "900000101",
        cents: 3500,
        type: "received",
        date: "2026-11-17T17:30:00Z",
        message: "Para el almuerzo",
        color: "pink",
      },
      {
        id: "DEMO-004",
        name: "Bodega Don Pepe",
        phone: "900000106",
        cents: 1250,
        type: "sent",
        date: "2026-11-17T14:15:00Z",
        message: "Las compras de hoy",
        color: "orange",
      },
      {
        id: "DEMO-003",
        name: "Diego Ramírez",
        phone: "900000102",
        cents: 5000,
        type: "received",
        date: "2026-11-16T23:42:00Z",
        message: "Trabajo de la universidad",
        color: "blue",
      },
      {
        id: "DEMO-002",
        name: "Lucía Mendoza",
        phone: "900000103",
        cents: 2000,
        type: "sent",
        date: "2026-11-16T20:10:00Z",
        message: "Gracias por todo",
        color: "orange",
      },
      {
        id: "DEMO-001",
        name: "Mateo García",
        phone: "900000104",
        cents: 850,
        type: "sent",
        date: "2026-11-15T16:25:00Z",
        message: "Un cafecito",
        color: "green",
      },
    ],
  };
}

export function loadWallet() {
  try {
    const wallet = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (
      Number.isSafeInteger(wallet?.balance) &&
      wallet.balance >= 0 &&
      Array.isArray(wallet.transactions) &&
      wallet.transactions.every(
        (tx) =>
          typeof tx.name === "string" &&
          Number.isSafeInteger(tx.cents) &&
          tx.cents > 0 &&
          ["sent", "received"].includes(tx.type) &&
          Number.isFinite(Date.parse(tx.date)),
      )
    )
      return wallet;
  } catch {
    /* Recupera los datos de demostración si el almacenamiento no está disponible. */
  }
  return initialWallet();
}

export function parseAmount(input) {
  const normalized = String(input).trim().replace(",", ".");
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(normalized))
    throw new Error("Ingresa un monto válido con hasta 2 decimales.");
  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (cents <= 0) throw new Error("El monto debe ser mayor a S/ 0.00.");
  if (cents > 50000)
    throw new Error("Puedes simular un yapeo de hasta S/ 500.00.");
  return cents;
}

export function sendPayment(wallet, contact, amount, message = "") {
  if (!CONTACTS.some((item) => item.id === contact?.id))
    throw new Error("Selecciona un contacto de demostración.");
  const cents = parseAmount(amount);
  if (cents > wallet.balance)
    throw new Error("Tu saldo no es suficiente para este yapeo.");
  const transaction = {
    id: `DEMO-${crypto.randomUUID()}`,
    name: contact.name,
    phone: contact.phone,
    color: contact.color,
    cents,
    type: "sent",
    message: message.trim().slice(0, 80),
    date: new Date().toISOString(),
  };
  return {
    balance: wallet.balance - cents,
    transactions: [transaction, ...wallet.transactions],
  };
}
