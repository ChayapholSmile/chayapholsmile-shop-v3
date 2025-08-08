"use client"

import Navbar from "@/components/navbar"
import AnnouncementBar from "@/components/announcement-bar"
import TopupForm from "@/components/topup-form"
import StockCatalog from "@/components/stock-catalog"
import NotificationsBell from "@/components/notifications-bell"
import { useEffect, useState } from "react"
import { actionListOrders } from "@/actions/products"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import BootstrapProvider from "@/components/bootstrap-provider"

type Order = {
  _id: string
  productName: string
  createdAt: string
  amount: number
  status: string
  deliveredItem?: any
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])

  async function loadOrders() {
    try {
      const o = await actionListOrders()
      setOrders(o as any)
    } catch {}
  }
  useEffect(() => {
    loadOrders()
    const t = setInterval(loadOrders, 8000)
    return () => clearInterval(t)
  }, [])

  return (
    <BootstrapProvider>
      <AnnouncementBar />
      <Navbar />
      <main className="container mx-auto py-8 space-y-10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">แดชบอร์ด</h2>
          <NotificationsBell />
        </div>
        <TopupForm />
        <section className="space-y-4">
          <h3 className="text-xl font-semibold">สินค้า</h3>
          <StockCatalog />
        </section>
        <section className="space-y-4">
          <h3 className="text-xl font-semibold">คำสั่งซื้อของฉัน</h3>
          <div className="grid lg:grid-cols-2 gap-4">
            {orders.map((o) => (
              <Card key={o._id}>
                <CardHeader>
                  <CardTitle className="flex justify-between">
                    <span>{o.productName}</span>
                    <span className="text-sm text-muted-foreground">{new Date(o.createdAt).toLocaleString()}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <div>ราคา: {o.amount.toLocaleString()} THB</div>
                  <div>สถานะ: {o.status}</div>
                  {o.deliveredItem?.username && (
                    <div className="mt-2 rounded bg-gray-50 p-2">
                      <div>Username: {o.deliveredItem.username}</div>
                      <div>Password: {o.deliveredItem.password}</div>
                    </div>
                  )}
                  {o.deliveredItem?.payload && (
                    <div className="mt-2 rounded bg-gray-50 p-2">
                      {Object.entries(o.deliveredItem.payload).map(([k, v]) => (
                        <div key={k}>
                          {k}: {String(v)}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {!orders.length && <div className="text-sm text-muted-foreground">ยังไม่มีคำสั่งซื้อ</div>}
          </div>
        </section>
      </main>
    </BootstrapProvider>
  )
}
