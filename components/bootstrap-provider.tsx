"use client"

// Import Bootstrap CSS once
import "bootstrap/dist/css/bootstrap.min.css"
import { PropsWithChildren } from "react"

export default function BootstrapProvider(props: PropsWithChildren) {
  return <>{props.children}</>
}
