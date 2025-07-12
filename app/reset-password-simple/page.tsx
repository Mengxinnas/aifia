"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { ArrowLeft, Key, Check, Phone, Mail, Zap } from "lucide-react"
import { useToast } from "../../components/ui/use-toast"
import { verifyUserIdentity, quickPasswordReset } from '../../lib/supabase'

export default function SimpleResetPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'verify' | 'reset' | 'success'>('verify')
  const [userEmail, setUserEmail] = useState('')
  const [userPhone, setUserPhone] = useState('')

  const handleVerifyUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.target as HTMLFormElement)
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string

    try {
      await verifyUserIdentity(email, phone)
      
      setUserEmail(email)
      setUserPhone(phone)
      
      toast({
        title: "身份验证成功",
        description: "请设置您的新密码",
      })
      
      setStep('reset')
    } catch (error: any) {
      toast({
        title: "验证失败",
        description: error.message || "请检查邮箱和手机号格式",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.target as HTMLFormElement)
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (newPassword.length < 6) {
      toast({
        title: "密码不符合要求",
        description: "密码至少需要6个字符",
        variant: "destructive"
      })
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "密码不匹配",
        description: "两次输入的密码不一致",
        variant: "destructive"
      })
      setIsLoading(false)
      return
    }

    try {
      const result = await quickPasswordReset(userEmail, userPhone, newPassword)
      
      if (result.success) {
        toast({
          title: "密码重置成功！",
          description: result.message,
        })
        
        setStep('success')
        
        // 3秒后跳转到登录页面
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        throw new Error('重置失败')
      }
    } catch (error: any) {
      toast({
        title: "重置失败",
        description: error.message || "密码重置失败，请稍后重试",
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
          href="/login"
          className="absolute left-8 top-8 flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回登录
        </Link>

        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          <div className="flex flex-col space-y-2 text-center">
            <div className="flex justify-center">
              <div className="h-12 w-12 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl">
                🐷
              </div>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {step === 'verify' && '快速重置密码'}
              {step === 'reset' && '设置新密码'}
              {step === 'success' && '重置成功'}
            </h1>
            <p className="text-sm text-gray-500">
              {step === 'verify' && '无需邮件验证，立即生效'}
              {step === 'reset' && '新密码将立即生效'}
              {step === 'success' && '可以立即使用新密码登录'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-indigo-100">
            {step === 'verify' && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start space-x-2 text-sm text-blue-800">
                    <Zap className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">快速重置</p>
                      <p className="text-xs mt-1">
                        无需邮件验证，密码立即生效，可直接登录
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleVerifyUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Mail className="inline h-4 w-4 mr-1" />
                      注册邮箱
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="rounded-lg"
                      placeholder="name@example.com"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      <Phone className="inline h-4 w-4 mr-1" />
                      注册手机号
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      className="rounded-lg"
                      placeholder="请输入注册时使用的手机号"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-gray-500">
                      请输入注册时使用的完整手机号码
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? "验证中..." : "验证身份"}
                  </Button>
                </form>
              </>
            )}

            {step === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-green-800">
                    <Check className="h-4 w-4" />
                    <span>身份验证成功：{userEmail}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">
                    <Key className="inline h-4 w-4 mr-1" />
                    新密码
                  </Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    minLength={6}
                    className="rounded-lg"
                    placeholder="请输入新密码"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500">
                    密码要求：至少 6 个字符
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">确认新密码</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    className="rounded-lg"
                    placeholder="请再次输入新密码"
                    disabled={isLoading}
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2 text-sm text-yellow-800">
                    <Zap className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">立即生效</p>
                      <p className="text-xs mt-1">
                        新密码设置后立即生效，无需等待任何确认邮件
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? "重置中..." : "立即重置密码"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-lg"
                  onClick={() => setStep('verify')}
                  disabled={isLoading}
                >
                  重新验证身份
                </Button>
              </form>
            )}

            {step === 'success' && (
              <div className="text-center space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex flex-col items-center space-y-3">
                    <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-green-800">密码重置成功！</h3>
                      <p className="text-sm text-green-600 mt-1">
                        新密码已立即生效，现在可以使用新密码登录
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-medium">
                    正在跳转到登录页面...
                  </p>
                  <div className="mt-2">
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{width: '100%'}}></div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => router.push('/login')}
                  className="w-full rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 transition-all duration-300"
                >
                  立即前往登录
                </Button>
              </div>
            )}
          </div>

          {step !== 'success' && (
            <div className="mt-4 text-center text-sm">
              想起密码了？{" "}
              <Link href="/login" className="text-indigo-600 hover:underline">
                返回登录
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 