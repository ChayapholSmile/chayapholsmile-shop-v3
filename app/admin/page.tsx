"use client"

import Navbar from "@/components/navbar"
import AnnouncementBar from "@/components/announcement-bar"
import BootstrapProvider from "@/components/bootstrap-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState, useTransition } from "react"
import Swal from "sweetalert2"
import { actionAdminCreateAnnouncement } from "@/actions/announcements"
import { actionAdminCreateCoupon } from "@/actions/coupons"
import { actionAdminCreateProduct, actionAdminAddItem, actionAdminEditOrder } from "@/actions/products"
import { actionAdminApproveTopup } from "@/actions/wallet"
import { actionAdminResetPassword, actionAdminSetRole } from "@/actions/auth"

export default function AdminPage() {
  return (
    <BootstrapProvider>
      <AnnouncementBar />
      <Navbar />
      <main className="container mx-auto py-8">
        <h2 className="text-2xl font-bold mb-6">แผงควบคุมแอดมิน</h2>
        <Tabs defaultValue="users">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="users">ผู้ใช้</TabsTrigger>
            <TabsTrigger value="stock">สต็อกสินค้า</TabsTrigger>
            <TabsTrigger value="orders">คำสั่งซื้อ</TabsTrigger>
            <TabsTrigger value="topups">เติมเงิน</TabsTrigger>
            <TabsTrigger value="coupons">คูปอง</TabsTrigger>
            <TabsTrigger value="announce">ประกาศ</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <UsersAdmin />
          </TabsContent>
          <TabsContent value="stock" className="mt-6">
            <StockAdmin />
          </TabsContent>
          <TabsContent value="orders" className="mt-6">
            <OrdersAdmin />
          </TabsContent>
          <TabsContent value="topups" className="mt-6">
            <TopupsAdmin />
          </TabsContent>
          <TabsContent value="coupons" className="mt-6">
            <CouponsAdmin />
          </TabsContent>
          <TabsContent value="announce" className="mt-6">
            <AnnounceAdmin />
          </TabsContent>
        </Tabs>
      </main>
    </BootstrapProvider>
  )
}

function UsersAdmin() {
  const [userId, setUserId] = useState("")
  const [pwd, setPwd] = useState("")
  const [roleUserId, setRoleUserId] = useState("")
  const [role, setRole] = useState<"user" | "admin">("user")
  const [isPending, startTransition] = useTransition()

  const resetPassword = () => {
    if (!userId || !pwd) return
    startTransition(async () => {
      try {
        await actionAdminResetPassword(userId, pwd)
        Swal.fire("สำเร็จ", "รีเซ็ตรหัสผ่านแล้ว", "success")
      } catch (e: any) {
        Swal.fire("ผิดพลาด", e.message || "ล้มเหลว", "error")
      }
    })
  }
  const setRoleFn = () => {
    if (!roleUserId) return
    startTransition(async () => {
      try {
        await actionAdminSetRole(roleUserId, role)
        Swal.fire("สำเร็จ", "อัปเดตสิทธิ์แล้ว", "success")
      } catch (e: any) {
        Swal.fire("ผิดพลาด", e.message || "ล้มเหลว", "error")
      }
    })
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>รีเซ็ตรหัสผ่านผู้ใช้</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>ID ผู้ใช้</Label>
            <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="เช่น u-xxxxxxx" />
          </div>
          <div>
            <Label>รหัสผ่านใหม่</Label>
            <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
          </div>
          <Button onClick={resetPassword} disabled={isPending}>
            รีเซ็ต
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>กำหนดสิทธิ์</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>ID ผู้ใช้</Label>
            <Input value={roleUserId} onChange={(e) => setRoleUserId(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button variant={role === "user" ? "default" : "outline"} onClick={() => setRole("user")}>
              User
            </Button>
            <Button variant={role === "admin" ? "default" : "outline"} onClick={() => setRole("admin")}>
              Admin
            </Button>
          </div>
          <Button onClick={setRoleFn} disabled={isPending}>
            อัปเดตสิทธิ์
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function StockAdmin() {
  const [name, setName] = useState("")
  const [price, setPrice] = useState<number>(0)
  const [type, setType] = useState<"idpass" | "custom">("idpass")
  const [desc, setDesc] = useState("")
  const [schema, setSchema] = useState("")
  const [productId, setProductId] = useState("")
  const [item, setItem] = useState("")

  const [isPending, startTransition] = useTransition()

  const createProduct = () => {
    startTransition(async () => {
      try {
        await actionAdminCreateProduct({
          name,
          price,
          description: desc,
          type,
          customSchema: type === "custom" ? JSON.parse(schema || "[]") : undefined,
        })
        Swal.fire("สำเร็จ", "สร้างสินค้าแล้ว", "success")
      } catch (e: any) {
        Swal.fire("ผิดพลาด", e.message || "ล้มเหลว", "error")
      }
    })
  }

  const addItem = () => {
    startTransition(async () => {
      try {
        const parsed = JSON.parse(item || "{}")
        await actionAdminAddItem(productId, parsed)
        Swal.fire("สำเร็จ", "เพิ่มรายการแล้ว", "success")
      } catch (e: any) {
        Swal.fire("ผิดพลาด", e.message || "ล้มเหลว", "error")
      }
    })
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>สร้างสินค้า</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>ชื่อ</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>ราคา</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(parseInt(e.target.value || "0"))} />
          </div>
          <div className="flex gap-2">
            <Button variant={type === "idpass" ? "default" : "outline"} onClick={() => setType("idpass")}>
              ID-PASS
            </Button>
            <Button variant={type === "custom" ? "default" : "outline"} onClick={() => setType("custom")}>
              Custom Schema
            </Button>
          </div>
          <div>
            <Label>คำอธิบาย</Label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
          {type === "custom" && (
            <div>
              <Label>Custom Schema JSON</Label>
              <textarea
                className="w-full border rounded p-2 text-sm font-mono"
                rows={4}
                placeholder='[{"label":"Code","key":"code","required":true}]'
                value={schema}
                onChange={(e) => setSchema(e.target.value)}
              />
            </div>
          )}
          <Button onClick={createProduct} disabled={isPending}>
            สร้างสินค้า
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>เพิ่มรายการเข้าสินค้า</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Product ID</Label>
            <Input value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="เช่น p-xxxxxxx" />
          </div>
          <div>
            <Label>Item JSON</Label>
            <textarea
              className="w-full border rounded p-2 text-sm font-mono"
              rows={5}
              placeholder='สำหรับ ID-PASS: {"username":"u","password":"p"} สำหรับ Custom: {"payload":{"code":"XXXX"}}'
              value={item}
              onChange={(e) => setItem(e.target.value)}
            />
          </div>
          <Button onClick={addItem} disabled={isPending}>
            เพิ่มรายการ
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function OrdersAdmin() {
  const [orderId, setOrderId] = useState("")
  const [note, setNote] = useState("")
  const [status, setStatus] = useState<"paid" | "refunded" | "cancelled">("paid")
  const [isPending, startTransition] = useTransition()
  const save = () => {
    if (!orderId) return
    startTransition(async () => {
      try {
        await actionAdminEditOrder(orderId, note, status)
        Swal.fire("สำเร็จ", "แก้ไขคำสั่งซื้อแล้ว", "success")
      } catch (e: any) {
        Swal.fire("ผิดพลาด", e.message || "ล้มเหลว", "error")
      }
    })
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>แก้ไขคำสั่งซื้อ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Order ID</Label>
          <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="เช่น ord-xxxxxxx" />
        </div>
        <div>
          <Label>บันทึกผู้ดูแล</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {(["paid", "refunded", "cancelled"] as const).map((s) => (
            <Button key={s} variant={status === s ? "default" : "outline"} onClick={() => setStatus(s)}>
              {s}
            </Button>
          ))}
        </div>
        <Button onClick={save} disabled={isPending}>
          บันทึก
        </Button>
      </CardContent>
    </Card>
  )
}

function TopupsAdmin() {
  const [txId, setTxId] = useState("")
  const [ref, setRef] = useState("")
  const [isPending, startTransition] = useTransition()

  const approve = () => {
    if (!txId) return
    startTransition(async () => {
      try {
        await actionAdminApproveTopup(txId, ref)
        Swal.fire("สำเร็จ", "อนุมัติแล้ว และเพิ่มเงินเข้ากระเป๋า", "success")
      } catch (e: any) {
        Swal.fire("ผิดพลาด", e.message || "ล้มเหลว", "error")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>อนุมัติการเติมเงิน</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>Transaction ID</Label>
          <Input value={txId} onChange={(e) => setTxId(e.target.value)} placeholder="เช่น tx-xxxxxxx" />
        </div>
        <div>
          <Label>เลขอ้างอิง</Label>
          <Input value={ref} onChange={(e) => setRef(e.target.value)} />
        </div>
        <Button onClick={approve} disabled={isPending}>
          อนุมัติ
        </Button>
      </CardContent>
    </Card>
  )
}

function CouponsAdmin() {
  const [code, setCode] = useState("")
  const [type, setType] = useState<"money" | "percent">("money")
  const [value, setValue] = useState<number>(50)
  const [uses, setUses] = useState<number>(10)
  const [exp, setExp] = useState("")
  const [isPending, startTransition] = useTransition()

  const create = () => {
    startTransition(async () => {
      try {
        await actionAdminCreateCoupon({ code, type, value, usesLeft: uses, expiresAt: exp || undefined })
        Swal.fire("สำเร็จ", "สร้างคูปองแล้ว", "success")
      } catch (e: any) {
        Swal.fire("ผิดพลาด", e.message || "ล้มเหลว", "error")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>สร้างคูปอง</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <Label>โค้ด</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div>
            <Label>ประเภท</Label>
            <div className="flex gap-2">
              <Button variant={type === "money" ? "default" : "outline"} onClick={() => setType("money")}>
                เงิน (THB)
              </Button>
              <Button variant={type === "percent" ? "default" : "outline"} onClick={() => setType("percent")}>
                เปอร์เซ็นต์
              </Button>
            </div>
          </div>
          <div>
            <Label>มูลค่า</Label>
            <Input type="number" value={value} onChange={(e) => setValue(parseInt(e.target.value || "0"))} />
          </div>
          <div>
            <Label>จำนวนครั้ง</Label>
            <Input type="number" value={uses} onChange={(e) => setUses(parseInt(e.target.value || "0"))} />
          </div>
          <div className="md:col-span-2">
            <Label>วันหมดอายุ (ISO)</Label>
            <Input placeholder="2025-12-31T23:59:59.000Z" value={exp} onChange={(e) => setExp(e.target.value)} />
          </div>
        </div>
        <Button onClick={create} disabled={isPending}>
          สร้าง
        </Button>
      </CardContent>
    </Card>
  )
}

function AnnounceAdmin() {
  const [msg, setMsg] = useState("")
  const [visible, setVisible] = useState(true)
  const [isPending, startTransition] = useTransition()
  const create = () => {
    if (!msg) return
    startTransition(async () => {
      try {
        await actionAdminCreateAnnouncement(msg, visible)
        setMsg("")
        Swal.fire("สำเร็จ", "ประกาศถูกเผยแพร่แล้ว", "success")
      } catch (e: any) {
        Swal.fire("ผิดพลาด", e.message || "ล้มเหลว", "error")
      }
    })
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>สร้างประกาศ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label>ข้อความ</Label>
          <Input value={msg} onChange={(e) => setMsg(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button variant={visible ? "default" : "outline"} onClick={() => setVisible(true)}>
            แสดง
          </Button>
          <Button variant={!visible ? "default" : "outline"} onClick={() => setVisible(false)}>
            ซ่อน
          </Button>
        </div>
        <Button onClick={create} disabled={isPending}>
          เผยแพร่
        </Button>
      </CardContent>
    </Card>
  )
}
