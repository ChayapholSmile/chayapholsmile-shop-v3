import { getMongoClient } from "./mongodb"
import type { Announcement, Coupon, Notification, Order, Product, Settings, Transaction, User } from "./types"

// Memory fallback so you can preview without env vars.
type Collections = {
  users: User[]
  transactions: Transaction[]
  products: Product[]
  orders: Order[]
  coupons: Coupon[]
  announcements: Announcement[]
  notifications: Notification[]
  settings: Settings[]
}

declare global {
  // eslint-disable-next-line no-var
  var __MEM_DB__: Collections | undefined
}

// Initialize memory DB
function getMem(): Collections {
  if (!globalThis.__MEM_DB__) {
    globalThis.__MEM_DB__ = {
      users: [],
      transactions: [],
      products: [],
      orders: [],
      coupons: [],
      announcements: [],
      notifications: [],
      settings: [],
    }
    // Seed admin user
    const now = new Date().toISOString()
    globalThis.__MEM_DB__.users.push({
      _id: "admin-1",
      username: "admin",
      passwordHash: "", // set via reset in UI
      role: "admin",
      walletBalance: 0,
      createdAt: now,
    })
    // Seed sample product
    globalThis.__MEM_DB__.products.push({
      _id: "p-1",
      name: "ID-PASS: DragonQuest",
      description: "บัญชีเกมพร้อมใช้งาน ประกัน 7 วัน",
      price: 199,
      type: "idpass",
      items: [
        { _id: "i-1", username: "dq_user_101", password: "pass123", sold: false },
        { _id: "i-2", username: "dq_user_102", password: "pass123", sold: false },
      ],
      createdAt: now,
    })
    // Seed custom schema product
    globalThis.__MEM_DB__.products.push({
      _id: "p-2",
      name: "Custom Stock: Valorant Points",
      description: "โค้ดเติม VP ใช้ได้ครั้งเดียว",
      price: 129,
      type: "custom",
      customSchema: [
        { label: "Code", key: "code", required: true },
        { label: "Region", key: "region" },
      ],
      items: [
        { _id: "c-1", payload: { code: "VALO-XXXX-1111", region: "TH" }, sold: false },
        { _id: "c-2", payload: { code: "VALO-XXXX-2222", region: "TH" }, sold: false },
      ],
      createdAt: now,
    })
    // Settings
    globalThis.__MEM_DB__.settings.push({
      _id: "settings",
      paymentAccounts: {
        note: "ชำระแล้วแจ้งเลขอ้างอิงให้แอดมินตรวจสอบ",
      },
      createdAt: now,
      updatedAt: now,
    })
  }
  return globalThis.__MEM_DB__
}

export async function db() {
  const client = await getMongoClient()
  if (!client) {
    // Memory adapter
    const mem = getMem()
    return {
      kind: "memory" as const,
      mem,
    }
  }
  const mdb = client.db()
  return {
    kind: "mongo" as const,
    users: mdb.collection<User>("users"),
    transactions: mdb.collection<Transaction>("transactions"),
    products: mdb.collection<Product>("products"),
    orders: mdb.collection<Order>("orders"),
    coupons: mdb.collection<Coupon>("coupons"),
    announcements: mdb.collection<Announcement>("announcements"),
    notifications: mdb.collection<Notification>("notifications"),
    settings: mdb.collection<Settings>("settings"),
  }
}

// Simple id generator for memory mode
export function genId(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}
