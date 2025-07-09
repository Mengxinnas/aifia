"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Shield } from "lucide-react"

export default function VerifyPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-4">
      <div className="text-center space-y-4">
        <Shield className="h-12 w-12 text-indigo-600 mx-auto" />
        <h1 className="text-2xl font-bold">验证您的邮箱</h1>
        <p className="text-gray-600">
          我们已向您的邮箱发送了验证链接，<br />
          请查看邮箱并点击链接完成验证。
        </p>
      </div>
    </div>
  )
} 