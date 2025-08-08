"use server"

import { db, genId } from "@/lib/db"
import { getSessionUser, requireAdmin, requireUser } from "@/lib/auth"
import type { Order, Product, ProductItem } from "@/lib/types"

export async function actionListProducts() {
  const database = await db()
  if (database.kind === "memory") {
    return database.mem.products
  }
  return await database.products.find({}).sort({ createdAt: -1 }).toArray()
}

export async function actionBuyProduct(productId: string) {
  const user = await requireUser()
  const database = await db()
  const now = new Date().toISOString()

  if (database.kind === "memory") {
    const p = database.mem.products.find((x) => x._id === productId)
    if (!p) throw new Error("ไม่พบสินค้า")
    const u = database.mem.users.find((x) => x._id === user._id)!
    if (u.walletBalance < p.price) throw new Error("ยอดเงินไม่เพียงพอ")
    const item = p.items.find((i) => !i.sold)
    if (!item) throw new Error("สินค้าไม่พอในสต็อก")
    // Mark sold
    item.sold = true
    item.buyerId = user._id
    item.soldAt = now
    // Deduct wallet
    u.walletBalance -= p.price
    // Create order
    const order: Order = {
      _id: genId("ord"),
      userId: user._id,
      productId: p._id,
      productName: p.name,
      amount: p.price,
      status: "paid",
      deliveredItem: item,
      createdAt: now,
    }
    database.mem.orders.push(order)
    // Notification
    database.mem.notifications.push({
      _id: genId("ntf"),
      userId: user._id,
      type: "order",
      message: `สั่งซื้อสำเร็จ: ${p.name}`,
      read: false,
      createdAt: now,
    })
    return { ok: true, order }
  }

  // Mongo path (simplified optimistic approach)
  const p = await database.products.findOne({ _id: productId })
  if (!p) throw new Error("ไม่พบสินค้า")
  const u = await database.users.findOne({ _id: user._id })
  if (!u || (u.walletBalance ?? 0) < p.price) throw new Error("ยอดเงินไม่เพียงพอ")
  // Find unsold item
  const item: ProductItem | undefined = (p.items || []).find((i) => !i.sold)
  if (!item) throw new Error("สินค้าไม่พอในสต็อก")
  item.sold = true
  item.buyerId = user._id
  item.soldAt = now
  await database.products.updateOne({ _id: p._id }, { $set: { items: p.items } })
  await database.users.updateOne({ _id: user._id }, { $inc: { walletBalance: -p.price } })
  const order: Order = {
    _id: crypto.randomUUID(),
    userId: user._id,
    productId: p._id,
    productName: p.name,
    amount: p.price,
    status: "paid",
    deliveredItem: item,
    createdAt: now,
  }
  await database.orders.insertOne(order)
  await database.notifications.insertOne({
    _id: crypto.randomUUID(),
    userId: user._id,
    type: "order",
    message: `สั่งซื้อสำเร็จ: ${p.name}`,
    read: false,
    createdAt: now,
  })
  return { ok: true, order }
}

export async function actionListOrders() {
  const user = await requireUser()
  const database = await db()
  if (database.kind === "memory") {
    return database.mem.orders.filter((o) => o.userId === user._id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  return await database.orders.find({ userId: user._id }).sort({ createdAt: -1 }).toArray()
}

// Admin CRUD for products
export async function actionAdminCreateProduct(data: Pick<Product, "name" | "description" | "price" | "type" | "customSchema">) {
  await requireAdmin()
  const database = await db()
  const prod: Product = {
    _id: database.kind === "memory" ? genId("p") : crypto.randomUUID(),
    name: data.name,
    description: data.description,
    price: data.price,
    type: data.type,
    customSchema: data.customSchema,
    items: [],
    createdAt: new Date().toISOString(),
  }
  if (database.kind === "memory") {
    database.mem.products.push(prod)
  } else {
    await database.products.insertOne(prod)
  }
  return { ok: true, prod }
}

export async function actionAdminAddItem(productId: string, item: ProductItem) {
  await requireAdmin()
  const database = await db()
  if (database.kind === "memory") {
    const p = database.mem.products.find((x) => x._id === productId)
    if (!p) throw new Error("ไม่พบสินค้า")
    p.items.push({ ...item, _id: genId("itm"), sold: false })
    return { ok: true }
  }
  const p = await database.products.findOne({ _id: productId })
  if (!p) throw new Error("ไม่พบสินค้า")
  p.items.push({ ...item, _id: crypto.randomUUID(), sold: false })
  await database.products.updateOne({ _id: productId }, { $set: { items: p.items } })
  return { ok: true }
}

export async function actionAdminEditOrder(orderId: string, adminNotes: string, status: "paid" | "refunded" | "cancelled") {
  await requireAdmin()
  const database = await db()
  if (database.kind === "memory") {
    const o = database.mem.orders.find((x) => x._id === orderId)
    if (!o) throw new Error("ไม่พบคำสั่งซื้อ")
    o.adminNotes = adminNotes
    o.status = status
    return { ok: true }
  }
  await database.orders.updateOne({ _id: orderId }, { $set: { adminNotes, status } })
  return { ok: true }
}
