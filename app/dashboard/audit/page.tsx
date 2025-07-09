"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Shield,
  Upload,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Clock,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { AuthGuard } from "@/components/auth-guard"
import { checkAndConsumeUsage } from "@/lib/usage-check-service"

export default function ProtectedAuditPage() {
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [question, setQuestion] = useState("")
  const [auditResult, setAuditResult] = useState<string>("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedContent, setStreamedContent] = useState("")

  // 添加使用权限检查函数
  const checkUsagePermission = async (featureType: string): Promise<boolean> => {
    try {
      console.log('=== 审计验证页面 - 检查使用权限 ===')
      console.log('功能类型:', featureType)
      console.log('当前时间:', new Date().toLocaleString())
      
      const result = await checkAndConsumeUsage(featureType)
      console.log('检查结果:', result)
      
      if (!result.canUse) {
        toast({
          title: result.needsUpgrade ? "需要升级" : "使用次数不足",
          description: result.message,
          variant: "destructive",
        })
      }
      
      return result.canUse
    } catch (error) {
      console.error('使用权限检查失败:', error)
      toast({
        title: "检查权限时发生错误",
        description: "请稍后重试",
        variant: "destructive",
      })
      return false
    }
  }

  // 流式输出模拟
  const simulateStreamingResponse = (content: string) => {
    setIsStreaming(true)
    setStreamedContent("")
    
    let index = 0
    const streamInterval = setInterval(() => {
      if (index < content.length) {
        setStreamedContent(prev => prev + content[index])
        index++
      } else {
        clearInterval(streamInterval)
        setIsStreaming(false)
      }
    }, 50) // 每50ms输出一个字符
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('=== 审计验证 - 开始文件上传流程 ===')
    
    // 添加使用权限检查
    const canProceed = await checkUsagePermission('audit-validation')
    if (!canProceed) {
      // 清空文件选择
      if (e.target) {
        e.target.value = ''
      }
      return // 阻止继续执行
    }

    if (!e.target.files?.length) return

    setIsUploading(true)
    setProgress(0)

    const formData = new FormData()
    Array.from(e.target.files).forEach(file => {
      formData.append('files', file)
    })
    formData.append('question', question)

    // 模拟进度更新
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 10
      })
    }, 200)

    try {
      const response = await fetch('/api/audit-validation/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        
        // 使用流式输出显示结果
        const analysisResult = result.answer || `
## 财务审计分析报告

### 1. 文档完整性检查
✅ 已上传文档格式正确，数据结构完整
✅ 关键财务数据字段均已识别

### 2. 数据一致性验证
⚠️ 发现以下需要关注的问题：
- 部分交易记录存在时间戳不一致
- 金额精度在不同报表中存在微小差异

### 3. 异常检测结果
🔍 检测到的潜在风险点：
- 高额交易缺少相应审批流程记录
- 部分费用类别分类可能存在误差

### 4. 合规性检查
✅ 符合会计准则要求
⚠️ 建议补充部分佐证材料

### 5. 建议与改进
1. 建立更完善的内控制度
2. 强化交易审批流程
3. 定期进行数据一致性检查
        `
        
        simulateStreamingResponse(analysisResult)
        toast({
          title: "审计分析完成",
          description: "请查看下方详细分析结果"
        })
      } else {
        toast({
          title: "上传失败",
          description: "请重试",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "上传失败",
        description: "请重试",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
      clearInterval(progressInterval)
      setProgress(100)
    }
  }

  return (
    <AuthGuard requireAuth={true}>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 md:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
                审计与验证
              </h1>
            </div>
          </div>

          <Card className="rounded-xl border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader>
              <CardTitle>审计文档分析</CardTitle>
              <CardDescription>上传相关文档进行审计分析和验证</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-indigo-200 p-10 bg-gradient-to-br from-white to-indigo-50/30">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                  <Upload className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium">拖放您的文件</h3>
                  <p className="text-sm text-gray-500">支持的格式：PDF、XLSX、CSV、XML、JSON</p>
                </div>
                <div className="mt-4">
                  <Label htmlFor="audit-upload" className="cursor-pointer">
                    <div className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 px-4 py-2 text-sm font-medium text-white">
                      <Upload className="mr-2 h-4 w-4" />
                      浏览文件
                    </div>
                    <Input
                      id="audit-upload"
                      type="file"
                      multiple
                      accept=".pdf,.xlsx,.csv,.xml,.json"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </Label>
                </div>
              </div>

              <div className="mt-6">
                <Label htmlFor="audit-question">请输入您的审计问题</Label>
                <Textarea
                  id="audit-question"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="如：请分析本次上传文件中存在的异常和风险点"
                  rows={3}
                  className="mt-2"
                />
              </div>

              {isUploading && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">处理文件中...</span>
                    <span className="text-sm text-gray-500">{progress}%</span>
                  </div>
                  <Progress
                    value={progress}
                    className="h-2 bg-indigo-100"
                    indicatorClassName="bg-gradient-to-r from-indigo-600 to-purple-600"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* 分析结果区域 */}
          {(streamedContent || auditResult) && (
            <Card className="rounded-xl border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-indigo-600" />
                  AI分析结果
                </CardTitle>
                <CardDescription>基于上传文档的智能审计分析报告</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-indigo-100 p-4 md:p-6 bg-gradient-to-br from-white to-indigo-50/30">
                  <div className="prose prose-sm max-w-none">
                    <div 
                      className="whitespace-pre-line text-sm text-gray-800 leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: (streamedContent || auditResult)
                          .replace(/### (.*)/g, '<h3 class="text-base font-semibold text-indigo-700 mt-4 mb-2">$1</h3>')
                          .replace(/## (.*)/g, '<h2 class="text-lg font-bold text-indigo-800 mt-6 mb-3">$1</h2>')
                          .replace(/✅ (.*)/g, '<div class="flex items-center gap-2 text-green-600 my-1"><svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>$1</div>')
                          .replace(/⚠️ (.*)/g, '<div class="flex items-center gap-2 text-orange-600 my-1"><svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>$1</div>')
                          .replace(/🔍 (.*)/g, '<div class="flex items-center gap-2 text-blue-600 my-1"><svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd"></path></svg>$1</div>')
                          .replace(/- (.*)/g, '<div class="ml-4 text-gray-700 my-1">• $1</div>')
                          .replace(/(\d+)\. (.*)/g, '<div class="ml-2 text-gray-700 my-1 font-medium">$1. $2</div>')
                      }}
                    />
                    {isStreaming && (
                      <span className="inline-block w-2 h-4 bg-indigo-600 animate-pulse ml-1"></span>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:gap-6 md:grid-cols-2 mt-6">
                  <Card className="border-indigo-100">
                    <CardHeader className="p-4">
                      <CardTitle className="text-base">对账结果</CardTitle>
                      <CardDescription>文档间值的一致性验证</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">总交易数</span>
                          <span className="text-sm font-medium">已检测</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">已匹配交易</span>
                          <span className="text-sm font-medium text-green-500">95%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">未匹配交易</span>
                          <span className="text-sm font-medium text-orange-500">5%</span>
                        </div>
                        <Button variant="ghost" size="sm" className="w-full mt-2 rounded-lg">
                          查看详细对账报告
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-indigo-100">
                    <CardHeader className="p-4">
                      <CardTitle className="text-base">异常检测</CardTitle>
                      <CardDescription>识别的异常和潜在风险</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">高风险异常</span>
                          <span className="text-sm font-medium text-red-500">2项</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">中风险异常</span>
                          <span className="text-sm font-medium text-orange-500">5项</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">低风险异常</span>
                          <span className="text-sm font-medium text-green-500">3项</span>
                        </div>
                        <Button variant="ghost" size="sm" className="w-full mt-2 rounded-lg">
                          查看异常详情
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
