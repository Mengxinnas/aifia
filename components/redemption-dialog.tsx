"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { redeemCode } from '@/lib/redemption-service'
import { Gift, Sparkles } from 'lucide-react'

interface RedemptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function RedemptionDialog({ open, onOpenChange, onSuccess }: RedemptionDialogProps) {
  const { toast } = useToast()
  const [code, setCode] = useState('')
  const [isRedeeming, setIsRedeeming] = useState(false)

  const formatCode = (value: string) => {
    // 移除非字母数字字符，转大写
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    
    // 限制长度为12位
    const limited = cleaned.slice(0, 12)
    
    // 格式化为 XXXX-XXXX-XXXX
    if (limited.length <= 4) {
      return limited
    } else if (limited.length <= 8) {
      return `${limited.slice(0, 4)}-${limited.slice(4)}`
    } else {
      return `${limited.slice(0, 4)}-${limited.slice(4, 8)}-${limited.slice(8)}`
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCode(e.target.value)
    setCode(formatted)
  }

  const handleRedeem = async () => {
    const cleanCode = code.replace(/-/g, '')
    
    if (cleanCode.length !== 12) {
      toast({
        title: "兑换码格式错误",
        description: "请输入完整的12位兑换码",
        variant: "destructive"
      })
      return
    }

    setIsRedeeming(true)
    try {
      const result = await redeemCode(cleanCode)
      
      if (result.success) {
        toast({
          title: "兑换成功！",
          description: `🎉 您获得了 ${result.usesAdded} 次使用权限`,
        })
        setCode('')
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast({
          title: "兑换失败",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "兑换失败",
        description: "请稍后重试",
        variant: "destructive"
      })
    } finally {
      setIsRedeeming(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-indigo-600" />
            兑换使用权限
          </DialogTitle>
          <DialogDescription>
            输入您购买的12位兑换码来获得更多使用次数
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">兑换码</label>
            <Input
              placeholder="XXXX-XXXX-XXXX"
              value={code}
              onChange={handleCodeChange}
              className="text-center text-lg font-mono tracking-wider"
              maxLength={14} // 包含连字符
            />
            <p className="text-xs text-gray-500 text-center">
              兑换码格式：4字母-4数字-4字母，如 ABCD-1234-EFGH
            </p>
          </div>

          {/* 套餐说明 */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium">套餐说明</span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• 5次使用包：¥16.6</div>
              <div>• 10次使用包：¥29.9</div>
              <div className="text-indigo-600 font-medium mt-2">
                兑换后立即可用，无使用期限限制
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              取消
            </Button>
            <Button 
              onClick={handleRedeem}
              disabled={isRedeeming || code.replace(/-/g, '').length !== 12}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {isRedeeming ? '兑换中...' : '立即兑换'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 