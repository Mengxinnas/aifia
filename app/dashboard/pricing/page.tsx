"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "../../../components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Badge } from "../../../components/ui/badge"
import { Progress } from "../../../components/ui/progress"
import { useToast } from "../../../components/ui/use-toast"
import { AuthGuard } from "../../../components/auth-guard"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../components/ui/dialog"
import { getCurrentUser } from "../../../lib/supabase"
import { DatabaseStatus } from "../../../components/database-status"
import { 
  getUserUsageStatus, 
  getRedemptionHistory,
  type UserUsageStatus,
  PACKAGES,
  type PackageType
} from '../../../lib/usage-service'
import { simulatePayment, PAYMENT_CONFIG } from "../../../lib/payment-service"
import {
  Check,
  Zap,
  Crown,
  CreditCard,
  History,
  TrendingUp,
  Star,
  AlertTriangle,
  Smartphone,
  QrCode,
  Gift,
  MessageCircle,
  Clock,
  ArrowRight
} from "lucide-react"
import Image from "next/image"
import { RedemptionDialog } from '../../../components/redemption-dialog'

function PricingPage() {
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [userStatus, setUserStatus] = useState<UserUsageStatus>({
    freeUsesRemaining: 6,
    paidUsesRemaining: 0,
    totalUsed: 0,
    canUse: true,
    needsPurchase: false
  })
  const [redemptionHistory, setRedemptionHistory] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState<'5_times' | '10_times' | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null)
  const [isRedemptionDialogOpen, setIsRedemptionDialogOpen] = useState(false)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    setIsLoading(true)
    try {
      // 分别加载用户状态和兑换历史，避免一个失败影响另一个
      const status = await getUserUsageStatus()
      setUserStatus(status)
      
      // 单独处理兑换历史，失败时不影响整体加载
      try {
        const history = await getRedemptionHistory()
        setRedemptionHistory(history)
      } catch (historyError) {
        console.warn('加载兑换历史失败，但不影响页面使用:', historyError)
        setRedemptionHistory([]) // 设为空数组
      }
      
    } catch (error) {
      console.error('加载用户数据失败:', error)
      toast({
        title: "加载失败",
        description: "无法加载用户数据，请刷新页面重试",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePurchase = (packageType: '5_times' | '10_times') => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "购买前需要登录账户",
        variant: "destructive"
      })
      return
    }

    setSelectedPackage(packageType)
    setShowPaymentDialog(true)
  }

  const handleRedemptionSuccess = () => {
    // 兑换成功后刷新数据
    loadUserData()
    setIsRedemptionDialogOpen(false)
  }

  const getUsageProgress = () => {
    if (!usageStats) return 0
    const totalFreeUses = 6
    const usedFreeUses = totalFreeUses - usageStats.free_uses_remaining
    return (usedFreeUses / totalFreeUses) * 100
  }

  const getFeatureDisplayName = (featureType: string) => {
    const names = {
      'accounting-qa': '会计问答',
      'financial-analysis': '财务分析',
      'batch-ledger': '批量台账',
      'audit-validation': '审计验证',
      'batch-accounting': '批量记账',
      'batch-contract': '批量合同',
      'invoice-parser': '发票解析',
      'financial-report': '财务报告'
    }
    return names[featureType] || featureType
  }

  if (isLoading) {
    return (
      <AuthGuard requireAuth={true}>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAuth={true}>
      <DashboardLayout>
        <div className="max-w-6xl mx-auto space-y-8">
          {/* 页面标题 */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              使用量与购买
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              免费体验6次，购买兑换码继续享受 AiFi财小猪 的专业服务
            </p>
          </div>

          {/* 使用状态卡片 */}
          <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-indigo-600" />
                  当前状态
                </div>
                <Button
                  onClick={() => setIsRedemptionDialogOpen(true)}
                  size="sm"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Gift className="h-4 w-4 mr-2" />
                  输入兑换码
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{userStatus.totalUsed}</div>
                  <div className="text-sm text-gray-600">累计使用</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{userStatus.freeUsesRemaining}</div>
                  <div className="text-sm text-gray-600">免费剩余</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{userStatus.paidUsesRemaining}</div>
                  <div className="text-sm text-gray-600">付费剩余</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {userStatus.freeUsesRemaining + userStatus.paidUsesRemaining}
                  </div>
                  <div className="text-sm text-gray-600">总剩余</div>
                </div>
              </div>
              
              {userStatus.needsPurchase && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-700 mb-2">
                    <Zap className="h-4 w-4" />
                    <span className="font-medium">免费体验已结束</span>
                  </div>
                  <p className="text-sm text-orange-600">
                    您已使用完6次免费额度，购买兑换码后可继续使用所有功能
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 套餐介绍 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(PACKAGES).map(([key, pkg]) => (
              <Card key={key} className="relative border-2 hover:border-indigo-300 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{pkg.name}</span>
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                      ¥{pkg.price}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-600">
                      {pkg.uses}次
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {pkg.description}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>支持所有功能模块</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>专业AI分析</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>永久有效</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>优先技术支持</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => handlePurchase(key as '5_times' | '10_times')}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    disabled={isPurchasing === key}
                  >
                    {isPurchasing === key ? '处理中...' : '立即购买'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 兑换历史 */}
          {redemptionHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  兑换历史
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {redemptionHistory.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <div>
                          <div className="font-medium">
                            {item.redemption_codes?.package_type === '5_times' ? '5次使用包' : '10次使用包'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {new Date(item.redeemed_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">+{item.uses_added}次</div>
                        <div className="text-sm text-gray-600">
                          ¥{item.redemption_codes?.price}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 付费流程说明 */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-center text-blue-800">购买流程</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                    1
                  </div>
                  <h3 className="font-medium">选择套餐</h3>
                  <p className="text-sm text-gray-600">根据使用需求选择合适的套餐</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                    2
                  </div>
                  <h3 className="font-medium">微信支付</h3>
                  <p className="text-sm text-gray-600">添加微信：xiaoxingxing 完成支付</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                    3
                  </div>
                  <h3 className="font-medium">获取兑换码</h3>
                  <p className="text-sm text-gray-600">收到兑换码后在此页面输入激活</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 兑换码对话框 */}
        <RedemptionDialog
          open={isRedemptionDialogOpen}
          onOpenChange={setIsRedemptionDialogOpen}
          onSuccess={handleRedemptionSuccess}
        />

        {/* 购买支付对话框 */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>购买 {selectedPackage && PACKAGES[selectedPackage].name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center p-6 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600 mb-2">
                  ¥{selectedPackage && PACKAGES[selectedPackage].price}
                </div>
                <div className="text-gray-600">
                  {selectedPackage && PACKAGES[selectedPackage].uses}次使用权限
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="text-center">
                  <h3 className="font-medium mb-2">付款方式</h3>
                  <div className="space-y-2">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium">微信支付</div>
                      <div className="text-sm text-gray-600">微信号：xiaoxingxing</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium">支付宝</div>
                      <div className="text-sm text-gray-600">账号：xiaoxingxing@example.com</div>
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 text-center">
                  支付完成后，请提供支付截图获取兑换码
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowPaymentDialog(false)}
                  variant="outline" 
                  className="flex-1"
                >
                  取消
                </Button>
                <Button 
                  onClick={() => {
                    setShowPaymentDialog(false)
                    toast({
                      title: "支付提醒",
                      description: "请按照提供的方式完成支付，然后联系客服获取兑换码",
                    })
                  }}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600"
                >
                  我已了解
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </AuthGuard>
  )
}

export default PricingPage 