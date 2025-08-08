"use server"

import { db, genId } from "@/lib/db"
import { calculateFee } from "@/lib/fees"
import { getSessionUser, requireAdmin, requireUser } from "@/lib/auth"
import type { PaymentMethod, Transaction } from "@/lib/types"

export async function actionGetBalance() {
  const user = await getSessionUser()
  if (!user) return { balance: 0 }
  const database = await db()
  if (database.kind === "memory") {
    const u = database.mem.users.find((x) => x._id === user._id)!
    return { balance: u.walletBalance }
  }
  const u = await database.users.findOne({ _id: user._id })
  return { balance: u?.walletBalance ?? 0 }
}

export async function actionCreateTopup(amount: number, method: PaymentMethod) {
  const session = await requireUser()
  if (amount <= 0) throw new Error("ยอดเงินไม่ถูกต้อง")
  const database = await db()
  const { fee, total } = calculateFee(amount, method)
  const now = new Date().toISOString()
  const tx: Transaction = {
    _id: database.kind === "memory" ? genId("tx") : crypto.randomUUID(),
    userId: session._id,
    amount,
    fee,
    method,
    status: "pending",
    createdAt: now,
  }
  if (database.kind === "memory") {
    database.mem.transactions.push(tx)
  } else {
    await database.transactions.insertOne(tx)
  }
  return { ok: true, tx }
}

export async function actionListTransactions() {
  const session = await requireUser()
  const database = await db()
  if (database.kind === "memory") {
    return database.mem.transactions.filter((t) => t.userId === session._id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  return await database.transactions.find({ userId: session._id }).sort({ createdAt: -1 }).toArray()
}

export async function actionAdminApproveTopup(txId: string, reference?: string) {
  await requireAdmin()
  const database = await db()
  if (database.kind === "memory") {
    const t = database.mem.transactions.find((x) => x._id === txId)
    if (!t) throw new Error("ไม่พบธุรกรรม")
    if (t.status !== "pending") throw new Error("สถานะไม่ถูกต้อง")
    t.status = "approved"
    t.reference = reference
    const u = database.mem.users.find((x) => x._id === t.userId)!
    // Atomic update
    u.walletBalance = u.walletBalance + t.amount
    // Notification
    database.mem.notifications.push({
      _id: genId("ntf"),
      userId: u._id,
      type: "wallet",
      message: `เติมเงินสำเร็จ +${t.amount} THB`,
      read: false,
      createdAt: new Date().toISOString(),
    })
    return { ok: true }
  }
  const tx = await database.transactions.findOne({ _id: txId })
  if (!tx || tx.status !== "pending") throw new Error("ไม่พบธุรกรรมหรือสถานะไม่ถูกต้อง")
  await database.transactions.updateOne({ _id: txId }, { $set: { status: "approved", reference } })
  await database.users.updateOne({ _id: tx.userId }, { $inc: { walletBalance: tx.amount } })
  await database.notifications.insertOne({
    _id: crypto.randomUUID(),
    userId: tx.userId,
    type: "wallet",
    message: `เติมเงินสำเร็จ +${tx.amount} THB`,
    read: false,
    createdAt: new Date().toISOString(),
  })
  return { ok: true }
}
