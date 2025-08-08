"use client"

import * as React from "react"

export function Tabs({ defaultValue, children }: { defaultValue: string; children: React.ReactNode }) {
  const [value, setValue] = React.useState(defaultValue)
  return (
    <div data-tabs="">
      {React.Children.map(children, (child: any) => {
        if (!React.isValidElement(child)) return child
        if (child.type === TabsList) {
          return React.cloneElement(child, { value, setValue })
        }
        if (child.type === TabsContent) {
          return React.cloneElement(child, { value })
        }
        return child
      })}
    </div>
  )
}
export function TabsList({ children, value, setValue }: any) {
  return (
    <div className="inline-flex border rounded-lg p-1 bg-muted" role="tablist" aria-label="Tabs">
      {React.Children.map(children, (child: any) => {
        return React.cloneElement(child, { value, setValue })
      })}
    </div>
  )
}
export function TabsTrigger({ value: tabValue, children, value, setValue }: any) {
  const active = value === tabValue
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={() => setValue(tabValue)}
      className={`px-3 py-1.5 rounded-md text-sm ${active ? "bg-white shadow" : "text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  )
}
export function TabsContent({ value, children, value: tabValue }: any) {
  if (value !== tabValue) return null
  return <div role="tabpanel">{children}</div>
}
