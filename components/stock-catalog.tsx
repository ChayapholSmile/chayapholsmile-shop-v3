"use client"

import { useEffect, useState, useTransition } from "react"
import { actionBuyProduct, actionListProducts } from "@/actions/products"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { PackageOpen, ShieldCheck } from 'lucide-react'
import Swal from "sweetalert2"

type Product = {
  _id: string
  name: string
  description?: string
  price: number
  type: "idpass" | "custom"
  customSchema?: { label: string; key: string; required?: boolean }[]
  items: any[]
}

export default function StockCatalog() {
  const [list, setList] = useState<Product[]>([])
  const [isPending, startTransition] = useTransition()

  async function load() {
    const p = await actionListProducts()
    setList(p as any)
  }
  useEffect(() => {
    load()
  }, [])

  const buy = (id: string) => {
    startTransition(async () => {
      try {
        const res = await actionBuyProduct(id)
        const ord = (res as any).order
        await load()
        let info = ""
        if (ord?.deliveredItem?.username) {
          info = `Username: ${ord.deliveredItem.username}\nPassword: ${ord.deliveredItem.password}`
        } else if (ord?.deliveredItem?.payload) {
          info = Object.entries(ord.deliveredItem.payload).map(([k, v]) => `${k}: ${v}`).join("\n")
        }
        Swal.fire({
          title: "ซื้อสำเร็จ",
          html: `<pre class="text-left whitespace-pre-wrap rounded bg-gray-50 p-3">${info || "รายละเอียดอยู่ในประวัติคำสั่งซื้อ"}</pre>`,
          icon: "success",
        })
      } catch (e: any) {
        Swal.fire("ผิดพลาด", e.message || "ไม่สามารถซื้อสินค้าได้", "error")
      }
    })
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {list.map((p, idx) => {
        const available = p.items.filter((i) => !i.sold).length
        return (
          <motion.div key={p._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
            <Card className="h-full flex flex-col">
              <CardHeader className="space-y-1">
                <CardTitle className="flex items-center justify-between">
                  <span>{p.name}</span>
                  <span className="text-green-700">{p.price.toLocaleString()} THB</span>
                </CardTitle>
                {p.description && <div className="text-sm text-muted-foreground">{p.description}</div>}
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="flex items-center justify-between text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <PackageOpen className="w-4 h-4" />
                    <span>คงเหลือ {available}</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700">
                    <ShieldCheck className="w-4 h-4" />
                    <span>รับประกัน</span>
                  </div>
                </div>
                <Button className="w-full" disabled={!available || isPending} onClick={() => buy(p._id)}>
                  ซื้อทันที
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
