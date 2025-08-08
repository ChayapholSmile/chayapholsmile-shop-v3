"use server"

import { db, genId } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import type { Announcement } from "@/lib/types"

export async function actionListAnnouncements() {
  const database = await db()
  if (database.kind === "memory") {
    return database.mem.announcements.filter((a) => a.visible).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  return await database.announcements.find({ visible: true }).sort({ createdAt: -1 }).toArray()
}

export async function actionAdminCreateAnnouncement(message: string, visible: boolean) {
  await requireAdmin()
  const database = await db()
  const a: Announcement = {
    _id: database.kind === "memory" ? genId("ann") : crypto.randomUUID(),
    message,
    visible,
    createdAt: new Date().toISOString(),
  }
  if (database.kind === "memory") {
    database.mem.announcements.push(a)
  } else {
    await database.announcements.insertOne(a)
  }
  return { ok: true }
}

export async function actionAdminToggleAnnouncement(id: string, visible: boolean) {
  await requireAdmin()
  const database = await db()
  if (database.kind === "memory") {
    const a = database.mem.announcements.find((x) => x._id === id)
    if (!a) throw new Error("ไม่พบประกาศ")
    a.visible = visible
  } else {
    await database.announcements.updateOne({ _id: id }, { $set: { visible } })
  }
  return { ok: true }
}
