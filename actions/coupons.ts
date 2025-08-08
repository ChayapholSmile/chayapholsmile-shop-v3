"use server"

import { db, genId } from "@/lib/db"
import { requireAdmin, requireUser } from "@/lib/auth"
import type { Coupon } from "@/lib/types"

export async function actionAdminCreateCoupon(data: Pick<Coupon, "code" | "type" | "value" | "usesLeft" | "expiresAt">) {
  await requireAdmin()
  const database = await db()
  const coupon: Coupon = {
    _id: database.kind === "memory" ? genId("cp") : crypto.randomUUID(),
    code: data.code.toUpperCase(),
    type: data.type,
    value: data.value,
    usesLeft: data.usesLeft,
    expiresAt: data.expiresAt,
    createdAt: new Date().toISOString(),
  }
  if (database.kind === "memory") {
    database.mem.coupons.push(coupon)
  } else {
    await database.coupons.insertOne(coupon)
  }
  return { ok: true }
}

export async function actionRedeemCoupon(code: string) {
  const session = await requireUser()
  const database = await db()
  const now = new Date().toISOString()
  const codeU = code.trim().toUpperCase()
  let coupon: Coupon | null = null
  if (database.kind === "memory") {
    coupon = database.mem.coupons.find((c) => c.code === codeU) || null
  } else {
    coupon = await database.coupons.findOne({ code: codeU })
  }
  if (!coupon) throw new Error("ไม่พบคูปอง")
  if (coupon.usesLeft <= 0) throw new Error("คูปองถูกใช้หมดแล้ว")
  if (coupon.expiresAt && coupon.expiresAt < now) throw new Error("คูปองหมดอายุแล้ว")

  // Apply
  let credit = 0
  if (coupon.type === "money") credit = coupon.value
  else if (coupon.type === "percent") credit = Math.round(100 * (coupon.value / 100)) // Simple demo: 100 THB base -> adjust as needed

  if (database.kind === "memory") {
    const u = database.mem.users.find((x) => x._id === session._id)!
    u.walletBalance += credit
    coupon.usesLeft -= 1
    database.mem.notifications.push({
      _id: genId("ntf"),
      userId: u._id,
      type: "wallet",
      message: `คูปองสำเร็จ +${credit} THB`,
      read: false,
      createdAt: now,
    })
  } else {
    await database.users.updateOne({ _id: session._id }, { $inc: { walletBalance: credit } })
    await database.coupons.updateOne({ _id: coupon._id }, { $inc: { usesLeft: -1 } })
    await database.notifications.insertOne({
      _id: crypto.randomUUID(),
      userId: session._id,
      type: "wallet",
      message: `คูปองสำเร็จ +${credit} THB`,
      read: false,
      createdAt: now,
    })
  }
  return { ok: true, credit }
}
