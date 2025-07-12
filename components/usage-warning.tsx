"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "./ui/alert"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { canUseFeature } from "../lib/usage-service"
import { getCurrentUser } from "../lib/supabase"
import { AlertTriangle, Crown, Zap, Gift, Phone } from "lucide-react"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { getUserUsageStatus, type UserUsageStatus } from '../lib/redemption-service'

interface UsageWarningProps {
  className?: string
}

export function UsageWarning({ className = "" }: UsageWarningProps) {
  const router = useRouter()
  const [usageStats, setUsageStats] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userStatus, setUserStatus] = useState<UserUsageStatus | null>(null)

  useEffect(() => {
    loadUsageStats()
    loadUserStatus()
  }, [])

  const loadUsageStats = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        setIsLoading(false)
        return
      }

      setUser(currentUser)
      const stats = await canUseFeature(currentUser.id)
      setUsageStats(stats)
    } catch (error) {
      console.error('加载使用统计失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadUserStatus = async () => {
    try {
      const status = await getUserUsageStatus()
      setUserStatus(status)
    } catch (error) {
      console.error('获取用户状态失败:', error)
    }
  }

  if (isLoading || !user || !usageStats || !userStatus) {
    return null
  }

  // 剩余次数较少时显示警告
  const totalRemaining = userStatus.freeUsesRemaining + userStatus.paidUsesRemaining
  
  if (userStatus.needsPurchase) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <span className="font-medium text-orange-800">免费体验已结束</span>
            <div className="text-sm text-orange-600 mt-1">
              您已使用完6次免费额度，请联系 <span className="font-semibold">15001314535</span> 购买更多使用次数
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              // 复制联系方式到剪贴板
              navigator.clipboard.writeText('15001314535')
              alert('联系方式已复制到剪贴板：15001314535')
            }}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Phone className="h-4 w-4 mr-1" />
            联系购买
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (totalRemaining <= 2 && totalRemaining > 0) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <Crown className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <span className="font-medium text-yellow-800">使用次数即将用完</span>
            <div className="text-sm text-yellow-600 mt-1">
              剩余 {totalRemaining} 次使用机会，请提前联系 <span className="font-semibold">15001314535</span> 购买
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText('15001314535')
              alert('联系方式已复制到剪贴板：15001314535')
            }}
            className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
          >
            <Phone className="h-4 w-4 mr-1" />
            联系购买
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return null
} 