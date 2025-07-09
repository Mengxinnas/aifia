"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Info, Zap, Clock, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { smartSignIn, upgradeToRealSession } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    // 检查是否有活跃的重置
    const activeReset = localStorage.getItem('active_password_reset')
    const tempSession = localStorage.getItem('temp_user_session')
    
    if (activeReset) {
      const resetData = JSON.parse(activeReset)
      if (resetData.supabaseReset) {
        toast({
          title: "密码已重置",
          description: "请使用新密码登录。如果登录失败，密码可能需要几分钟生效",
          duration: 8000,
        })
      } else {
        toast({
          title: "密码已重置",
          description: "请使用新密码登录",
          duration: 5000,
        })
      }
    }
    
    if (tempSession) {
      setShowUpgrade(true)
    }
  }, [toast])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.target as HTMLFormElement)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const result = await smartSignIn(email, password)

      if (result.success) {
        let description = "欢迎回到 AiFi财小猪！"
        
        if (result.fromReset) {
          description = result.tempSession ? 
            "使用新密码登录成功（临时会话）！" : 
            "使用新密码登录成功！"
        }
        
        toast({
          title: "登录成功",
          description,
        })
        
        router.push("/dashboard/accounting-qa")
      } else {
        throw new Error('登录失败')
      }
    } catch (error: any) {
      console.error('登录错误:', error)
      
      let errorMessage = "登录过程中出现错误"
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "邮箱或密码错误，请检查后重试"
        
        // 如果有重置记录，提供额外提示
        const activeReset = localStorage.getItem('active_password_reset')
        if (activeReset) {
          const resetData = JSON.parse(activeReset)
          if (resetData.supabaseReset) {
            errorMessage += "。如果您刚重置密码，请等待几分钟后重试"
          }
        }
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = "邮箱未验证，请查看邮箱验证邮件"
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = "登录尝试过于频繁，请稍后再试"
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "登录失败",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpgradeSession = async () => {
    setIsLoading(true)
    
    try {
      const result = await upgradeToRealSession()
      
      if (result.success) {
        toast({
          title: "会话升级成功",
          description: "已升级为正式会话",
        })
        setShowUpgrade(false)
        router.push("/dashboard/accounting-qa")
      } else {
        toast({
          title: "升级失败",
          description: result.message || "请稍后再试",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "升级失败",
        description: "升级会话时出现错误",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
        <Link
          href="/"
          className="absolute left-8 top-8 flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回首页
        </Link>

        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <div className="flex flex-col space-y-2 text-center">
            <div className="flex justify-center">
              <div className="h-12 w-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl">
                🐷
              </div>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">欢迎回来</h1>
            <p className="text-sm text-gray-500">登录您的 AiFi财小猪 账户</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱地址</Label>
                <Input 
                  id="email" 
                  name="email"
                  type="email" 
                  placeholder="name@example.com" 
                  required 
                  className="rounded-lg" 
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">密码</Label>
                  <Link 
                    href="/reset-password-simple" 
                    className="text-xs text-indigo-600 hover:underline flex items-center space-x-1"
                  >
                    <Zap className="h-3 w-3" />
                    <span>快速重置</span>
                  </Link>
                </div>
                <Input 
                  id="password" 
                  name="password"
                  type="password" 
                  required 
                  minLength={6}
                  className="rounded-lg" 
                  disabled={isLoading}
                  placeholder="请输入密码"
                />
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Info className="h-3 w-3" />
                  <span>密码为至少6个字符</span>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? "登录中..." : "邮箱登录"}
              </Button>
            </form>
          </div>

          <div className="mt-4 text-center text-sm">
            还没有账户？{" "}
            <Link href="/signup" className="text-indigo-600 hover:underline">
              注册
            </Link>
          </div>

          <div className="text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-center space-x-2 text-sm text-blue-800">
                <Zap className="h-4 w-4" />
                <span>忘记密码？使用快速重置，无需邮件验证，立即生效！</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
