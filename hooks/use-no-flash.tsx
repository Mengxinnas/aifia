"use client"

import { useEffect, useState } from "react"

/**
 * 防闪屏Hook - 确保组件在客户端完全挂载后再渲染
 */
export function useNoFlash() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return isMounted
} 