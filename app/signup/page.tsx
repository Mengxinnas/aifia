"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Shield, ArrowLeft, Clock, Phone } from "lucide-react"
import { useToast } from "../../../components/ui/use-toast"
import { signUpWithPhoneNumber, testConnection } from '../../../lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    // 组件加载时测试连接
    testConnection()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (cooldown > 0) {
      interval = setInterval(() => {
        setCooldown(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [cooldown])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (cooldown > 0) {
      toast({
        title: "请稍等",
        description: `请等待 ${cooldown} 秒后再试`,
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    const formData = new FormData(e.target as HTMLFormElement)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const phone = formData.get('phone') as string

    // 验证密码长度
    if (password.length < 6) {
      toast({
        title: "密码不符合要求",
        description: "密码至少需要6个字符",
        variant: "destructive"
      })
      setIsLoading(false)
      return
    }

    // 验证密码确认
    if (password !== confirmPassword) {
      toast({
        title: "密码不匹配",
        description: "两次输入的密码不一致，请重新输入",
        variant: "destructive"
      })
      setIsLoading(false)
      return
    }

    // 验证手机号格式
    if (!phone || phone.trim() === '') {
      toast({
        title: "手机号必填",
        description: "请输入有效的手机号码",
        variant: "destructive"
      })
      setIsLoading(false)
      return
    }

    // 验证手机号格式（支持中国大陆手机号）
    const phoneRegex = /^(\+86)?1[3-9]\d{9}$/
    if (!phoneRegex.test(phone.replace(/\s+/g, ''))) {
      toast({
        title: "手机号格式错误",
        description: "请输入正确的中国大陆手机号码",
        variant: "destructive"
      })
      setIsLoading(false)
      return
    }

    const cleanPhone = phone.replace(/\s+/g, '').replace(/^\+86/, '') // 清理手机号格式

    console.log('尝试注册:', {
      email,
      phone: cleanPhone,
      hasPhone: !!cleanPhone
    })

    try {
      const { data, error } = await signUpWithPhoneNumber(email, password, cleanPhone)

      if (error) {
        throw error
      }

      if (data.user) {
        console.log('注册成功，用户数据:', {
          userId: data.user.id,
          email: data.user.email,
          metadata: data.user.user_metadata,
          phone: data.user.user_metadata?.phone
        })

        toast({
          title: "注册成功！",
          description: "欢迎使用 AiFi财小猪，正在跳转到仪表板...",
        })
        
        setTimeout(() => {
          router.push('/dashboard/accounting-qa')
        }, 1500)
      } else {
        throw new Error('注册成功但未返回用户信息')
      }
    } catch (error: any) {
      console.error('注册错误:', error)
      
      let errorMessage = "注册失败"
      let cooldownTime = 0
      
      // 处理不同类型的错误
      if (error.name === 'AuthRetryableFetchError') {
        errorMessage = "网络连接超时，请检查网络后重试"
        cooldownTime = 10
      } else if (error.message?.includes('email rate limit exceeded') || 
                 error.message?.includes('rate limit')) {
        errorMessage = "注册请求过于频繁，请等待一分钟后再试"
        cooldownTime = 60
      } else if (error.message?.includes('User already registered') || 
                 error.message?.includes('already registered')) {
        errorMessage = "该邮箱已被注册，请直接登录或使用其他邮箱"
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = "邮箱格式不正确，请检查输入"
      } else if (error.message?.includes('Password')) {
        errorMessage = "密码强度不够，请使用至少6位字符"
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
        errorMessage = "网络请求失败，请检查网络连接"
        cooldownTime = 5
      } else if (error.status >= 500 || error.message?.includes('504') || error.message?.includes('502')) {
        errorMessage = "服务器暂时不可用，请稍后重试"
        cooldownTime = 15
      } else if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "注册失败",
        description: errorMessage,
        variant: "destructive"
      })

      if (cooldownTime > 0) {
        setCooldown(cooldownTime)
      }
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
            <h1 className="text-2xl font-semibold tracking-tight">创建账户</h1>
            <p className="text-sm text-gray-500">注册 AiFi财小猪 开始使用</p>
          </div>

          {cooldown > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center space-x-2 text-yellow-700">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  请等待 <strong>{cooldown}</strong> 秒后再试
                </span>
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱地址 <span className="text-red-500">*</span></Label>
                <Input 
                  id="email" 
                  name="email"
                  type="email" 
                  placeholder="name@example.com" 
                  required 
                  className="rounded-lg" 
                  disabled={isLoading || cooldown > 0}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">
                  <Phone className="inline h-4 w-4 mr-1" />
                  手机号码 <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="phone" 
                  name="phone"
                  type="tel" 
                  placeholder="请输入中国大陆手机号，如：13812345678"
                  required 
                  className="rounded-lg" 
                  disabled={isLoading || cooldown > 0}
                />
                <p className="text-xs text-gray-500">
                  支持格式：138****5678 或 +86138****5678
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密码 <span className="text-red-500">*</span></Label>
                <Input 
                  id="password" 
                  name="password"
                  type="password" 
                  required 
                  minLength={6}
                  className="rounded-lg" 
                  disabled={isLoading || cooldown > 0}
                  placeholder="请输入密码"
                />
                <p className="text-xs text-gray-500">
                  密码要求：至少 6 个字符
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认密码 <span className="text-red-500">*</span></Label>
                <Input 
                  id="confirmPassword" 
                  name="confirmPassword"
                  type="password" 
                  required 
                  minLength={6}
                  className="rounded-lg" 
                  disabled={isLoading || cooldown > 0}
                  placeholder="请再次输入密码"
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 transition-all duration-300"
                disabled={isLoading || cooldown > 0}
              >
                {isLoading ? "创建中..." : "创建账户"}
              </Button>
            </form>
          </div>

          <div className="mt-4 text-center text-sm">
            已有账户？{" "}
            <Link href="/login" className="text-indigo-600 hover:underline">
              登录
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
