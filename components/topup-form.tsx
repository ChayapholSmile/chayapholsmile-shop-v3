"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { actionCreateTopup, actionListTransactions } from "@/actions/wallet"
import { calculateFee } from "@/lib/fees"
import type { PaymentMethod, Transaction } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import Swal from "sweetalert2"

export default function TopupForm({ defaultAmount = 100 }: { defaultAmount?: number }) {
  const [method, setMethod] = useState<PaymentMethod>("promptpay")
  const [amount, setAmount] = useState<number>(defaultAmount)
  const [txs, setTxs] = useState<Transaction[]>([])
  const [isPending, startTransition] = useTransition()

  const { fee, total } = useMemo(() => calculateFee(isNaN(amount) ? 0 : amount, method), [amount, method])

  async function refreshTx() {
    try {
      const list = await actionListTransactions()
      setTxs(list as any)
    } catch {}
  }
  useEffect(() => {
    refreshTx()
    const t = setInterval(refreshTx, 5000)
    return () => clearInterval(t)
  }, [])

  const createTopup = () => {
    if (amount <= 0) {
      Swal.fire("แจ้งเตือน", "กรุณากรอกจำนวนเงินให้ถูกต้อง", "warning")
      return
    }
    startTransition(async () => {
      try {
        const res = await actionCreateTopup(amount, method)
        await refreshTx()
        Swal.fire("สร้างคำขอสำเร็จ", "โปรดชำระเงินและแจ้งเลขอ้างอิงให้แอดมินตรวจสอบ", "success")
      } catch (e: any) {
        Swal.fire("ผิดพลาด", e.message || "ไม่สามารถสร้างคำขอได้", "error")
      }
    })
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>เติมเงิน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>วิธีชำระเงิน</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  onClick={() => setMethod("promptpay")}
                  className={`border rounded-md px-3 py-2 ${method === "promptpay" ? "border-green-600 bg-green-50" : "border-muted-foreground/20"}`}
                >
                  PromptPay
                </button>
                <button
                  onClick={() => setMethod("truemoney")}
                  className={`border rounded-md px-3 py-2 ${method === "truemoney" ? "border-orange-600 bg-orange-50" : "border-muted-foreground/20"}`}
                >
                  TrueMoney
                </button>
                <button
                  onClick={() => setMethod("truemoney-angpao")}
                  className={`border rounded-md px-3 py-2 ${method === "truemoney-angpao" ? "border-rose-600 bg-rose-50" : "border-muted-foreground/20"}`}
                >
                  อั่งเปา TrueMoney
                </button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>จำนวนเงิน (THB)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value || "0"))}
                min={1}
                placeholder="ระบุจำนวนเงิน"
              />
            </div>
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-muted p-3 text-sm"
            >
              <div className="flex justify-between">
                <span>ค่าธรรมเนียม</span>
                <span>{fee.toLocaleString()} THB</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>ยอดชำระรวม</span>
                <span>{total.toLocaleString()} THB</span>
              </div>
            </motion.div>
            <div className="flex gap-2">
              <Button onClick={createTopup} disabled={isPending}>
                ยืนยันสร้างคำขอ
              </Button>
              <Button variant="outline" onClick={refreshTx}>
                รีเฟรชสถานะ
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              หลังจากชำระแล้ว โปรดแจ้งเลขอ้างอิงให้แอดมินทำการอนุมัติ ระบบจะเพิ่มเงินทันทีเมื่ออนุมัติ
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>ประวัติคำขอเติมเงิน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {txs.map((t) => (
            <motion.div
              key={t._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="border rounded-md p-3 flex items-center justify-between"
            >
              <div className="text-sm">
                <div className="font-medium">
                  {t.method} • {new Date(t.createdAt).toLocaleString()}
                </div>
                <div className="text-muted-foreground">
                  {t.amount.toLocaleString()} THB + ค่าธรรมเนียม {t.fee.toLocaleString()} THB
                </div>
              </div>
              <div className={`text-xs px-2 py-1 rounded ${
                t.status === "approved" ? "bg-green-100 text-green-800" :
                t.status === "failed" ? "bg-rose-100 text-rose-800" :
                "bg-amber-100 text-amber-800"
              }`}>
                {t.status}
              </div>
            </motion.div>
          ))}
          {!txs.length && <div className="text-sm text-muted-foreground">ยังไม่มีรายการ</div>}
        </CardContent>
      </Card>
    </div>
  )
}
