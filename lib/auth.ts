import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { db, genId } from "./db"
import type { User } from "./types"

const cookieName = "sid"
const alg = "HS256"

function getSecret() {
  const secret = process.env.JWT_SECRET || "dev-secret-change-me"
  return new TextEncoder().encode(secret)
}

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(12)
  const hash = await bcrypt.hash(password, salt)
  return hash
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function createSession(user: User) {
  const token = await new SignJWT({
    sub: user._id,
    username: user.username,
    role: user.role,
  })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime("15d")
    .sign(getSecret())
  cookies().set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 15,
  })
}

export async function destroySession() {
  cookies().set(cookieName, "", { httpOnly: true, path: "/", maxAge: 0 })
}

export async function getSessionUser(): Promise<Pick<User, "_id" | "username" | "role"> | null> {
  const token = cookies().get(cookieName)?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return {
      _id: String(payload.sub),
      username: String(payload.username),
      role: (payload.role as any) || "user",
    }
  } catch {
    return null
  }
}

export async function requireUser() {
  const u = await getSessionUser()
  if (!u) throw new Error("Unauthorized")
  return u
}

export async function requireAdmin() {
  const u = await requireUser()
  if (u.role !== "admin") throw new Error("Forbidden")
  return u
}

// Helpers for memory db user lookup/creation
export async function findUserByUsername(username: string) {
  const database = await db()
  if (database.kind === "memory") {
    const u = database.mem.users.find((x) => x.username === username)
    return u || null
  }
  return await database.users.findOne({ username })
}

export async function findUserById(id: string) {
  const database = await db()
  if (database.kind === "memory") {
    return database.mem.users.find((x) => x._id === id) || null
  }
  return await database.users.findOne({ _id: id })
}

export async function createUser(username: string, password: string) {
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
    return user
  }
  await database.users.insertOne(user)
  return user
}
