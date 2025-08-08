import BootstrapProvider from "@/components/bootstrap-provider"
import AnnouncementBar from "@/components/announcement-bar"
import Navbar from "@/components/navbar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"

export default function Page() {
  return (
    <BootstrapProvider>
      <AnnouncementBar />
      <Navbar />
      <main className="bg-gradient-to-b from-white to-slate-50">
        <section className="container mx-auto py-12 md:py-20">
          <div className="row g-4 items-center">
            <div className="col-12 col-md-6">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-5xl font-extrabold leading-tight"
              >
                ร้านขายไอดีเกม ครบ จบ ง่าย ปลอดภัย
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-muted-foreground mt-4"
              >
                รองรับ ID-PASS, สต็อกแบบกำหนดฟอร์มเอง ระบบกระเป๋าเงิน เติมเงิน PromptPay/TrueMoney คูปอง และอีกมากมาย
              </motion.p>
              <div className="mt-6 flex gap-3">
                <Link href="/dashboard">
                  <Button size="lg">เริ่มต้นใช้งาน</Button>
                </Link>
                <a href="#features">
                  <Button size="lg" variant="outline">
                    ดูรายละเอียด
                  </Button>
                </a>
              </div>
            </div>
            <div className="col-12 col-md-6">
              <motion.img
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src="/placeholder-h7sty.png"
                alt="ตัวอย่างหน้าร้าน"
                className="w-full rounded-lg shadow-lg"
              />
            </div>
          </div>
        </section>
        <section id="features" className="container mx-auto py-12">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "ปลอดภัยสูง", desc: "เข้ารหัสรหัสผ่าน (bcrypt+salt), 2FA" },
              { title: "ซิงค์ตลอดเวลา", desc: "ยอดเงิน/ประกาศ/แจ้งเตือนอัปเดตอัตโนมัติ" },
              { title: "แอดมินทรงพลัง", desc: "จัดการผู้ใช้ สต็อก คำสั่งซื้อ คูปอง" },
            ].map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}>
                <div className="border rounded-xl p-6 bg-white shadow-sm h-full">
                  <div className="text-xl font-semibold">{f.title}</div>
                  <div className="text-muted-foreground mt-2">{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </BootstrapProvider>
  )
}
