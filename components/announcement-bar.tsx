"use client"

import { useEffect, useState } from "react"
import { Megaphone } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"
import { actionListAnnouncements } from "@/actions/announcements"

type Ann = { _id: string; message: string }

export default function AnnouncementBar({ refreshMs = 10000 }: { refreshMs?: number }) {
  const [list, setList] = useState<Ann[]>([])
  async function load() {
    try {
      const a = await actionListAnnouncements()
      setList(a as any)
    } catch {
      // ignore
    }
  }
  useEffect(() => {
    load()
    const t = setInterval(load, refreshMs)
    return () => clearInterval(t)
  }, [refreshMs])

  if (!list.length) return null
  return (
    <div className="w-full bg-yellow-50 border-b">
      <div className="container mx-auto py-2">
        <div className="flex items-center gap-2 text-yellow-900">
          <Megaphone className="w-4 h-4" />
          <div className="overflow-hidden relative h-6">
            <AnimatePresence initial={false}>
              {list.map((a) => (
                <motion.div
                  key={a._id}
                  className="absolute"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="text-sm">{a.message}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
