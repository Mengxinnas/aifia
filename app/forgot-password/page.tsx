"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ForgotPasswordPage() {
  const router = useRouter()

  useEffect(() => {
    // 自动重定向到快速重置页面
    router.replace('/reset-password-simple')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500">正在跳转到快速重置页面...</p>
      </div>
    </div>
  )
} 