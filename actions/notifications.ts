"use server"

import { db } from "@/lib/db"
import { requireUser } from "@/lib/auth"

export async function actionListNotifications() {
  const user = await requireUser()
  const database = await db()
  if (database.kind === "memory") {
    return database.mem.notifications
      .filter((n) => n.userId === user._id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  return await database.notifications.find({ userId: user._id }).sort({ createdAt: -1 }).toArray()
}
export async function actionUnreadCount() {
  const user = await requireUser()
  const database = await db()
  if (database.kind === "memory") {
    return database.mem.notifications.filter((n) => n.userId === user._id && !n.read).length
  }
  return await database.notifications.countDocuments({ userId: user._id, read: false })
}
export async function actionMarkAllRead() {
  const user = await requireUser()
  const database = await db()
  if (database.kind === "memory") {
    database.mem.notifications.forEach((n) => {
      if (n.userId === user._id) n.read = true
    })
  } else {
    await database.notifications.updateMany({ userId: user._id, read: false }, { $set: { read: true } })
  }
  return { ok: true }
}
