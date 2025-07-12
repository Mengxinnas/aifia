"use client"

import { useState } from "react"
import { Button } from "../../components/ui/button"
import { supabase } from "../../lib/supabase"

export default function TestSupabasePage() {
  const [result, setResult] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const testAuthSignUp = async () => {
    setLoading(true)
    setResult("开始测试注册功能...")

    try {
      const testEmail = `test${Date.now()}@example.com`
      const testPassword = "password123"

      console.log('测试注册:', { email: testEmail })

      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        }
      })

      console.log('注册响应:', { data, error })

      setResult(`测试邮箱: ${testEmail}
测试密码: ${testPassword}

注册结果:
${JSON.stringify({ data, error }, null, 2)}`)

    } catch (error: any) {
      console.error('测试错误:', error)
      setResult(`测试失败: ${error.message}
错误详情: ${JSON.stringify(error, null, 2)}`)
    } finally {
      setLoading(false)
    }
  }

  const testBasicConnection = async () => {
    setLoading(true)
    setResult("测试基础连接...")

    try {
      // 测试获取会话
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      setResult(`会话测试:
数据: ${JSON.stringify(sessionData, null, 2)}
错误: ${sessionError ? JSON.stringify(sessionError, null, 2) : 'None'}`)

    } catch (error: any) {
      setResult(`连接测试失败: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase 功能测试</h1>
      
      <div className="space-x-4 mb-4">
        <Button onClick={testBasicConnection} disabled={loading}>
          {loading ? "测试中..." : "测试基础连接"}
        </Button>
        
        <Button onClick={testAuthSignUp} disabled={loading} variant="outline">
          {loading ? "测试中..." : "测试注册功能"}
        </Button>
      </div>

      {result && (
        <pre className="mt-4 p-4 bg-gray-100 rounded text-sm overflow-auto whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </div>
  )
} 