"use client"

import { useEffect, useState } from "react"
import { actionListNotifications, actionMarkAllRead, actionUnreadCount } from "@/actions/notifications"
import { Bell, CheckCheck } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type Noti = { _id: string; message: string; createdAt: string }

export default function NotificationsBell() {
  const [count, setCount] = useState(0)
  const [list, setList] = useState<Noti[]>([])

  async function refresh() {
    try {
      const c = await actionUnreadCount()
      setCount(Number(c))
      const l = await actionListNotifications()
      setList((l as any) || [])
    } catch {
      // ignore
    }
  }
  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 5000)
    return () => clearInterval(t)
  }, [])

  const markRead = async () => {
    await actionMarkAllRead()
    await refresh()
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 text-[10px] bg-rose-600 text-white rounded-full px-1.5 py-0.5">
              {count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">การแจ้งเตือน</div>
          <Button variant="ghost" size="sm" onClick={markRead}>
            <CheckCheck className="w-4 h-4 mr-1" />
            อ่านแล้ว
          </Button>
        </div>
        <div className="max-h-72 overflow-auto space-y-2">
          {list.map((n) => (
            <div key={n._id} className="text-sm rounded border p-2">
              <div>{n.message}</div>
              <div className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</div>
            </div>
          ))}
          {!list.length && <div className="text-sm text-muted-foreground">ไม่มีการแจ้งเตือน</div>}
        </div>
      </PopoverContent>
    </Popover>
  )
}
