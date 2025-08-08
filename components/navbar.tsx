"use client"

import { actionGetBalance } from "@/actions/wallet"
import { actionLogin, actionLogout, actionMe, actionRegister } from "@/actions/auth"
import { useEffect, useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { CreditCard, LogIn, LogOut, Shield, User, Wallet } from 'lucide-react'
import Swal from "sweetalert2"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Me = { _id: string; username: string; role: "user" | "admin" } | null

export default function Navbar() {
  const [me, setMe] = useState<Me>(null)
  const [balance, setBalance] = useState<number>(0)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  async function refresh() {
    const u = await actionMe()
    setMe(u as any)
    if (u) {
      const b = await actionGetBalance()
      setBalance(b.balance)
    } else {
      setBalance(0)
    }
  }
  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 5000)
    return () => clearInterval(t)
  }, [])

  const handleRegister = async () => {
    const { value: formValues } = await Swal.fire({
      title: "สมัครสมาชิก",
      html:
        '<input id="swal-username" class="swal2-input" placeholder="Username">' +
        '<input id="swal-password" class="swal2-input" type="password" placeholder="Password">',
      focusConfirm: false,
      preConfirm: () => {
        const username = (document.getElementById("swal-username") as HTMLInputElement).value
        const password = (document.getElementById("swal-password") as HTMLInputElement).value
        return { username, password }
      },
      confirmButtonText: "สมัคร",
      showCancelButton: true,
      cancelButtonText: "ยกเลิก",
    })
    if (formValues) {
      try {
        await actionRegister(formValues)
        await refresh()
        Swal.fire("สำเร็จ", "สมัครสมาชิกเรียบร้อย", "success")
      } catch (e: any) {
        Swal.fire("ผิดพลาด", e.message || "ไม่สามารถสมัครได้", "error")
      }
    }
  }

  const handleLogin = async () => {
    const { value: formValues } = await Swal.fire({
      title: "เข้าสู่ระบบ",
      html:
        '<input id="swal-username" class="swal2-input" placeholder="Username">' +
        '<input id="swal-password" class="swal2-input" type="password" placeholder="Password">' +
        '<input id="swal-2fa" class="swal2-input" placeholder="2FA (ถ้ามี)">',
      focusConfirm: false,
      preConfirm: () => {
        const username = (document.getElementById("swal-username") as HTMLInputElement).value
        const password = (document.getElementById("swal-password") as HTMLInputElement).value
        const token = (document.getElementById("swal-2fa") as HTMLInputElement).value
        return { username, password, token }
      },
      confirmButtonText: "เข้าสู่ระบบ",
      showCancelButton: true,
      cancelButtonText: "ยกเลิก",
    })
    if (formValues) {
      try {
        await actionLogin(formValues)
        await refresh()
        Swal.fire("สำเร็จ", "เข้าสู่ระบบแล้ว", "success")
        router.push("/dashboard")
      } catch (e: any) {
        Swal.fire("ผิดพลาด", e.message || "เข้าสู่ระบบไม่สำเร็จ", "error")
      }
    }
  }

  const handleLogout = async () => {
    startTransition(async () => {
      await actionLogout()
      await refresh()
      router.push("/")
    })
  }

  return (
    <nav className="border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-extrabold text-xl tracking-tight">
            GameID Shop
          </Link>
          <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/dashboard">หน้าหลัก</Link>
            {me?.role === "admin" && <Link href="/admin" className="text-rose-600">แอดมิน</Link>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {me ? (
            <>
              <div className="hidden md:flex items-center text-sm rounded-full bg-muted px-3 py-1">
                <Wallet className="w-4 h-4 mr-1" />
                <span className="font-semibold">{balance.toLocaleString()} THB</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-gray-100 px-3 py-1 text-sm flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {me.username}
                </div>
                <Button variant="outline" onClick={() => router.push("/dashboard")} className="hidden md:flex">
                  <CreditCard className="w-4 h-4 mr-2" />
                  กระเป๋าเงิน
                </Button>
                <Button variant="ghost" onClick={handleLogout} disabled={isPending}>
                  <LogOut className="w-4 h-4 mr-2" />
                  ออกระบบ
                </Button>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRegister}>
                ลงทะเบียน
              </Button>
              <Button onClick={handleLogin}>
                <LogIn className="w-4 h-4 mr-2" />
                เข้าสู่ระบบ
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
