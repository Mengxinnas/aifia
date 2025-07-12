import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

// 检查并消费使用次数的函数
async function checkAndConsumeUsage(featureType: string) {
  const { supabase } = await import('./supabase')
  const { getCurrentUser } = await import('./supabase')
  
  const user = await getCurrentUser()
  if (!user) {
    return { canUse: false, message: '请先登录' }
  }

  const { data, error } = await supabase.rpc('consume_usage', {
    user_uuid: user.id,
    feature_name: featureType
  })

  if (error) throw error

  const result = data[0]
  return {
    canUse: result.success,
    message: result.message
  }
}

export function useFeatureAccess() {
  const { toast } = useToast()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(false)

  const checkAccess = async (featureType: string): Promise<boolean> => {
    setIsChecking(true)
    try {
      const result = await checkAndConsumeUsage(featureType)
      
      if (result.canUse) {
        return true
      } else {
        // 显示限制提示，包含联系方式
        toast({
          title: "使用受限",
          description: result.message,
          duration: 8000, // 延长显示时间
          action: result.message.includes('15001314535') ? 
            <button 
              onClick={() => {
                navigator.clipboard.writeText('15001314535')
                toast({
                  title: "联系方式已复制",
                  description: "15001314535",
                  duration: 3000
                })
              }}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              复制联系方式
            </button> : undefined
        })
        
        return false
      }
    } catch (error) {
      toast({
        title: "检查失败",
        description: "请稍后重试",
        variant: "destructive"
      })
      return false
    } finally {
      setIsChecking(false)
    }
  }

  const showUpgradePrompt = () => {
    toast({
      title: "需要购买使用次数",
      description: "请联系 15001314535 购买更多使用次数",
      duration: 8000,
      action: (
        <button 
          onClick={() => {
            navigator.clipboard.writeText('15001314535')
            toast({
              title: "联系方式已复制",
              description: "15001314535",
              duration: 3000
            })
          }}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
        >
          复制联系方式
        </button>
      )
    })
  }

  return { checkAccess, isChecking, showUpgradePrompt }
} 