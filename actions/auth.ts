"use server"

import { db, genId } from "@/lib/db"
import { createSession, destroySession, findUserByUsername, getSessionUser, hashPassword, verifyPassword, requireAdmin } from "@/lib/auth"
import type { User } from "@/lib/types"
import * as speakeasy from "speakeasy"

export async function actionRegister(form: { username: string; password: string }) {
  const username = form.username.trim()
  const password = form.password
  if (!username || !password) throw new Error("กรุณากรอกข้อมูลให้ครบ")
  const existing = await findUserByUsername(username)
  if (existing) throw new Error("มีชื่อผู้ใช้นี้อยู่แล้ว")
  const database = await db()
  const now = new Date().toISOString()
  const passwordHash = await hashPassword(password)
  const user: User = {
    _id: database.kind === "memory" ? genId("u") : crypto.randomUUID(),
    username,
    passwordHash,
    role: "user",
    walletBalance: 0,
    createdAt: now,
  }
  if (database.kind === "memory") {
    database.mem.users.push(user)
  } else {
    await database.users.insertOne(user)
  }
  await createSession(user)
  return { ok: true }
}

export async function actionLogin(form: { username: string; password: string; token?: string }) {
  const username = form.username.trim()
  const password = form.password
  const user = await findUserByUsername(username)
  if (!user) throw new Error("ผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")
  const passOk = await verifyPassword(password, user.passwordHash)
  if (!passOk) throw new Error("ผู้ใช้หรือรหัสผ่านไม่ถูกต้อง")

  // If 2FA enabled, require token
  if (user.twoFA?.enabled) {
    const token = form.token?.trim()
    if (!token) throw new Error("ต้องการรหัส 2FA")
    const verified = speakeasy.totp.verify({
      secret: user.twoFA.secret!,
      encoding: "base32",
      token,
      window: 1,
    })
    if (!verified) throw new Error("รหัส 2FA ไม่ถูกต้อง")
  }

  await createSession(user)
  return { ok: true }
}

export async function actionLogout() {
  await destroySession()
  return { ok: true }
}

export async function actionMe() {
  return await getSessionUser()
}

export async function actionSetup2FA() {
  const database = await db()
  const session = await getSessionUser()
  if (!session) throw new Error("Unauthorized")
  const secret = speakeasy.generateSecret({ name: `GameIDShop (${session.username})` })
  // Save temp secret (not enabled yet) to user
  if (database.kind === "memory") {
    const u = database.mem.users.find((x) => x._id === session._id)
    if (u) {
      u.twoFA = { enabled: false, secret: secret.base32 }
    }
  } else {
    await database.users.updateOne({ _id: session._id }, { $set: { twoFA: { enabled: false, secret: secret.base32 } } })
  }
  return {
    otpauth: secret.otpauth_url,
    base32: secret.base32,
  }
}

export async function actionVerify2FA(token: string) {
  const database = await db()
  const session = await getSessionUser()
  if (!session) throw new Error("Unauthorized")
  const user = database.kind === "memory" ? database.mem.users.find((x) => x._id === session._id) : await database.users.findOne({ _id: session._id })
  if (!user || !user.twoFA?.secret) throw new Error("No secret")
  const verified = speakeasy.totp.verify({
    secret: user.twoFA.secret,
    encoding: "base32",
    token,
    window: 1,
  })
  if (!verified) throw new Error("รหัส 2FA ไม่ถูกต้อง")
  if (database.kind === "memory") {
    user.twoFA.enabled = true
  } else {
    await database.users.updateOne({ _id: user._id }, { $set: { "twoFA.enabled": true } })
  }
  return { ok: true }
}

export async function actionAdminResetPassword(userId: string, newPassword: string) {
  await requireAdmin()
  const database = await db()
  const newHash = await hashPassword(newPassword)
  if (database.kind === "memory") {
    const u = database.mem.users.find((x) => x._id === userId)
    if (!u) throw new Error("ไม่พบบัญชี")
    u.passwordHash = newHash
  } else {
    await database.users.updateOne({ _id: userId }, { $set: { passwordHash: newHash } })
  }
  return { ok: true }
}

export async function actionAdminSetRole(userId: string, role: "user" | "admin") {
  await requireAdmin()
  const database = await db()
  if (database.kind === "memory") {
    const u = database.mem.users.find((x) => x._id === userId)
    if (!u) throw new Error("ไม่พบบัญชี")
    u.role = role
  } else {
    await database.users.updateOne({ _id: userId }, { $set: { role } })
  }
  return { ok: true }
}
