"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Alert, AlertDescription } from "./ui/alert"
import { Button } from "./ui/button"
import { testDatabaseConnection } from "../lib/usage-service"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"

export function DatabaseStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkConnection = async () => {
    setIsChecking(true)
    try {
      const result = await testDatabaseConnection()
      setIsConnected(result.success)
      setError(result.error || null)
    } catch (err: any) {
      setIsConnected(false)
      setError(err.message)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkConnection()
  }, [])

  return (
    <Card className="rounded-xl border-indigo-100">
      <CardHeader>
        <CardTitle className="flex items-center">
          数据库状态检查
          <Button
            variant="ghost"
            size="sm"
            onClick={checkConnection}
            disabled={isChecking}
            className="ml-2"
          >
            <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription>
          检查付费功能所需的数据库表是否存在
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected === null ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>正在检查数据库连接...</AlertDescription>
          </Alert>
        ) : isConnected ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              数据库连接正常，付费功能可以使用
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div>
                <p className="font-medium mb-2">数据库表缺失或连接失败</p>
                <p className="text-sm mb-2">错误信息: {error}</p>
                <p className="text-sm">
                  请在 Supabase SQL Editor 中执行表创建脚本
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
} 