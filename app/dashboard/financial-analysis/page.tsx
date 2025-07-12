"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { DashboardLayout } from "../../../components/dashboard-layout"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import {
  BarChart3,
  Upload,
  Download,
  FileSpreadsheet,
  FileIcon as FilePdf,
  MessageSquare,
  PieChart,
  LineChart,
  Plus,
  ArrowRight,
  FileText,
  Presentation,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
} from "lucide-react"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Progress } from "../../../components/ui/progress"
import { useToast } from "../../../components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select"
import { Separator } from "../../../components/ui/separator"
import { Textarea } from "../../../components/ui/textarea"
import { Badge } from "../../../components/ui/badge"
import { AuthGuard } from "../../../components/auth-guard"
import { UsageWarning } from '../../../components/usage-warning'
import { checkAndConsumeUsage } from '../../../lib/usage-check-service'
import { useRouter } from 'next/navigation'

// 添加财务分析Markdown渲染组件
const FinancialMarkdownRenderer: React.FC<{ content: string; className?: string }> = ({ 
  content, 
  className = "" 
}) => {
  const renderMarkdown = (text: string) => {
    // 处理一级标题 - 财务分析报告
    text = text.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-slate-800 mb-6 mt-8 pb-3 border-b-2 border-indigo-200 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">$1</h1>')
    
    // 处理二级标题 - 主要章节
    text = text.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-slate-700 mb-4 mt-6 pb-2 border-b border-slate-200 flex items-center"><span class="w-3 h-3 bg-indigo-500 rounded-full mr-3"></span>$1</h2>')
    
    // 处理三级标题 - 子章节  
    text = text.replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium text-indigo-700 mb-3 mt-4 flex items-center"><span class="w-2 h-2 bg-indigo-400 rounded-full mr-2"></span>$1</h3>')
    
    // 处理四级标题
    text = text.replace(/^#### (.*$)/gim, '<h4 class="text-base font-medium text-slate-600 mb-2 mt-3">$1</h4>')
    
    // 处理粗体文本 - 关键指标和重要信息
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-800 bg-yellow-50 px-1 py-0.5 rounded">$1</strong>')
    
    // 处理斜体
    text = text.replace(/\*(.*?)\*/g, '<em class="italic text-indigo-600">$1</em>')
    
    // 处理代码和数据块
    text = text.replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-slate-800 px-2 py-1 rounded text-sm font-mono border border-slate-200">$1</code>')
    
    // 处理百分比数据（特殊样式）
    text = text.replace(/(\d+\.?\d*%)/g, '<span class="font-semibold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200">$1</span>')
    
    // 处理货币数据
    text = text.replace(/([¥$€£]\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g, '<span class="font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">$1</span>')
    
    // 处理中文财务数字（万元、亿元等）
    text = text.replace(/(\d{1,3}(?:,\d{3})*(?:\.\d{2})?(?:\s?万元?|\s?亿元?|\s?元))/g, '<span class="font-medium text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">$1</span>')
    
    // 处理风险警告
    text = text.replace(/⚠️\s*(.*?)(?=\n|$)/g, '<div class="bg-amber-50 border-l-4 border-amber-400 p-3 my-3 rounded-r"><div class="flex items-center"><span class="text-amber-600 text-lg mr-2">⚠️</span><span class="text-amber-800 font-medium">$1</span></div></div>')
    
    // 处理积极信息
    text = text.replace(/✅\s*(.*?)(?=\n|$)/g, '<div class="bg-green-50 border-l-4 border-green-400 p-3 my-3 rounded-r"><div class="flex items-center"><span class="text-green-600 text-lg mr-2">✅</span><span class="text-green-800 font-medium">$1</span></div></div>')
    
    // 处理信息提示
    text = text.replace(/ℹ️\s*(.*?)(?=\n|$)/g, '<div class="bg-blue-50 border-l-4 border-blue-400 p-3 my-3 rounded-r"><div class="flex items-center"><span class="text-blue-600 text-lg mr-2">ℹ️</span><span class="text-blue-800 font-medium">$1</span></div></div>')
    
    // 处理无序列表
    text = text.replace(/^[\s]*[-\*\+] (.*)$/gim, '<li class="text-slate-700 ml-6 mb-2 leading-relaxed flex items-start hover:bg-slate-50 p-1 rounded transition-colors"><span class="text-indigo-500 mr-2 mt-2 text-lg">•</span><span>$1</span></li>')
    
    // 处理有序列表
    text = text.replace(/^[\s]*(\d+)\. (.*)$/gim, '<li class="text-slate-700 ml-6 mb-2 leading-relaxed flex items-start hover:bg-slate-50 p-1 rounded transition-colors"><span class="text-indigo-600 mr-2 font-medium min-w-6 bg-indigo-100 rounded-full text-center text-sm">$1</span><span>$2</span></li>')
    
    // 处理分隔线
    text = text.replace(/^---$/gim, '<hr class="my-6 border-t-2 border-gradient-to-r from-indigo-200 to-purple-200">')
    
    // 处理段落换行
    text = text.replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed text-slate-700">')
    text = text.replace(/\n/g, '<br>')
    
    // 包装在段落中
    if (!text.includes('<h1>') && !text.includes('<h2>') && !text.includes('<h3>')) {
      text = '<p class="mb-4 leading-relaxed text-slate-700">' + text + '</p>'
    }
    
    return text
  }

  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      <style jsx>{`
        ul { list-style: none; padding-left: 0; margin: 1rem 0; }
        ol { list-style: none; padding-left: 0; margin: 1rem 0; }
        table { width: 100%; border-collapse: collapse; margin: 1rem 0; background: white; border-radius: 0.5rem; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
        th { background: linear-gradient(135deg, #f8fafc, #e2e8f0); font-weight: 600; color: #334155; padding: 0.75rem; text-align: left; }
        td { padding: 0.75rem; border-bottom: 1px solid #f1f5f9; }
        tr:hover td { background-color: #f8fafc; }
      `}</style>
      <div 
        className="bg-white rounded-lg"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />
    </div>
  )
}

// 文件上传结果接口
interface UploadResult {
  filename: string
  status: 'success' | 'error'
  chunks_count?: number
  keywords?: string[]
  text_length?: number
  error?: string
}

// 问答结果接口
interface QAResult {
  answer: string
  sources: Array<{
    file_name: string
    text: string
    similarity_score: number
  }>
  context_used: boolean
}

function FinancialAnalysisPage() {
  const { toast } = useToast()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 状态管理
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("query")
  const [query, setQuery] = useState("")
  const [isQuerying, setIsQuerying] = useState(false)
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])
  const [qaResult, setQaResult] = useState<QAResult | null>(null)
  const [indexStats, setIndexStats] = useState<any>(null)
  const [backendStatus, setBackendStatus] = useState<{
    status: 'checking' | 'connected' | 'disconnected';
    backendUrl?: string;
    error?: string;
  }>({ status: 'checking' });
  const [selectedAnalysisType, setSelectedAnalysisType] = useState("comprehensive")
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [generatedReport, setGeneratedReport] = useState<any>(null)
  const [isDownloadingReport, setIsDownloadingReport] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)
  const [isCancellingTask, setIsCancellingTask] = useState(false)

  // 添加报告页面独立的上传状态
  const [reportUploadResults, setReportUploadResults] = useState<UploadResult[]>([])
  const [isReportUploading, setIsReportUploading] = useState(false)
  const [reportProgress, setReportProgress] = useState(0)

  // 流式分析相关状态
  const [streamStatus, setStreamStatus] = useState<string>("")
  const [streamContent, setStreamContent] = useState<string>("")
  const [isStreamComplete, setIsStreamComplete] = useState<boolean>(false)

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      const response = await fetch('/api/financial-qa/status');
      const result = await response.json();
      
      if (result.success) {
        setBackendStatus({
          status: 'connected',
          backendUrl: result.backend_url
        });
      } else {
        setBackendStatus({
          status: 'disconnected',
          backendUrl: result.backend_url,
          error: result.error
        });
      }
    } catch (error) {
      setBackendStatus({
        status: 'disconnected',
        error: error instanceof Error ? error.message : '连接检查失败'
      });
    }
  };

  // 检查使用权限的函数
  const checkUsagePermission = async (featureType: string): Promise<boolean> => {
    try {
      console.log('=== 开始检查使用权限 ===')
      console.log('功能类型:', featureType)
      console.log('当前时间:', new Date().toLocaleString())
      
      // 先获取当前用户信息
      const { getCurrentUser } = await import('../../../lib/supabase')
      const user = await getCurrentUser()
      console.log('当前用户:', user?.id, user?.email)
      
      if (!user) {
        console.error('用户未登录')
        toast({
          title: "请先登录",
          description: "使用功能前需要登录",
          variant: "destructive"
        })
        return false
      }
      
      const result = await checkAndConsumeUsage(featureType)
      
      console.log('=== 权限检查结果 ===')
      console.log('完整结果对象:', result)
      console.log('可以使用:', result.canUse)
      console.log('消息:', result.message)
      console.log('需要升级:', result.needsUpgrade)
      
      if (result.canUse) {
        console.log('✅ 使用权限验证成功，消费了一次使用次数')
        toast({
          title: "使用成功",
          description: result.message,
          duration: 3000
        })
        return true
      } else {
        console.log('❌ 使用权限验证失败')
        toast({
          title: "使用受限",
          description: result.message,
          action: result.needsUpgrade ? (
            <button
              onClick={() => router.push('/dashboard/pricing')}
              className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
            >
              购买兑换码
            </button>
          ) : undefined,
          duration: 5000
        })
        return false
      }
    } catch (error) {
      console.error('=== 检查使用权限异常 ===', error)
      toast({
        title: "检查失败",
        description: "请稍后重试",
        variant: "destructive"
      })
      return false
    }
  }

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('=== 开始文件上传流程 ===')
    
    if (!e.target.files?.length) return

    setIsUploading(true)
    setProgress(0)
    setUploadResults([])

    try {
      const files = Array.from(e.target.files)
      const formData = new FormData()
      
      files.forEach(file => {
        formData.append('files', file)
      })

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      console.log('开始上传文件...')

      // 调用上传API
      const response = await fetch('/api/financial-qa/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      console.log('上传响应状态:', response.status)

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          const errorText = await response.text().catch(() => '未知错误')
          errorMessage = errorText || errorMessage
        }
        throw new Error(`文件上传失败: ${errorMessage}`)
      }

      let result
      try {
        const responseText = await response.text()
        console.log('服务器响应:', responseText)
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error('解析响应失败:', parseError)
        throw new Error('服务器返回的数据格式错误')
      }
      
      console.log('解析后的结果:', result)
      
      // 检查result是否存在且有success属性
      if (!result || typeof result !== 'object') {
        throw new Error('服务器返回无效数据')
      }
      
      if (result.success) {
        // 更安全地处理results数组
        let results = []
        if (result.results && Array.isArray(result.results)) {
          results = result.results
        } else if (result.results) {
          // 如果results不是数组，尝试转换
          console.warn('results不是数组，尝试转换:', result.results)
          results = [result.results]
        } else {
          // 如果没有results，创建一个基于文件的默认结果
          console.warn('没有找到results，创建默认结果')
          results = files.map(file => ({
            filename: file.name,
            status: 'success' as const,
            chunks_count: 1,
            text_length: 0
          }))
        }
        
        console.log('处理后的results:', results)
        setUploadResults(results)
        
        // 安全地设置stats
        if (result.stats) {
          setIndexStats(result.stats)
        }
        
        // 安全地计算成功数量
        const successCount = results.filter((r: UploadResult) => r && r.status === 'success').length
        const totalCount = results.length
        
        console.log(`成功处理: ${successCount}/${totalCount} 个文件`)
        
        toast({
          title: "文件处理完成",
          description: `成功处理 ${successCount}/${totalCount} 个文件`,
        })
        
        // 如果有成功的文件，自动切换到数据查询标签
        if (successCount > 0) {
          setTimeout(() => {
            setActiveTab("query")
          }, 1000)
        }
      } else {
        throw new Error(result.error || result.message || '处理失败')
      }

    } catch (error) {
      console.error('文件上传错误:', error)
      toast({
        title: "上传失败",
        description: error instanceof Error ? error.message : "文件处理失败",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setProgress(0)
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 处理问答查询
  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    console.log('=== 开始问答查询流程 ===')
    
    // 添加使用权限检查
    const canProceed = await checkUsagePermission('financial-analysis')
    if (!canProceed) {
      console.log('使用权限检查失败，取消问答查询')
      return
    }

    console.log('使用权限检查通过，继续问答查询')

    setIsQuerying(true);
    setQaResult(null);

    try {
      console.log('=== 问答请求调试 ===');
      console.log('问题:', query.trim());
      console.log('uploadResults:', uploadResults);
      console.log('后端状态:', backendStatus);

      // 首先检查后端状态
      if (backendStatus.status !== 'connected') {
        throw new Error(`后端服务未连接。URL: ${backendStatus.backendUrl}, 错误: ${backendStatus.error}`);
      }

      // 检查是否有上传的文件
      if (uploadResults.length === 0 || !uploadResults.some(result => result.status === 'success')) {
        throw new Error('请先成功上传文档再进行查询');
      }

      console.log('开始发送问答请求...');

      const response = await fetch('/api/financial-qa/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: query.trim() }),
      });

      console.log('问答API响应状态:', response.status);

      if (!response.ok) {
        let errorMessage = '查询失败';
        try {
          const errorData = await response.json();
          errorMessage = (errorData && (errorData.error || errorData.message)) || errorMessage;
        } catch (parseError) {
          console.error('解析错误响应失败:', parseError);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('问答API返回结果:', result);
      
      // 安全地检查结果
      if (result && result.success === true) {
        setQaResult(result);
        toast({
          title: "查询完成",
          description: "已生成分析结果",
        });
      } else {
        // 更安全地提取错误信息
        let errorMessage = '查询失败：后端返回未知错误';
        
        if (result) {
          if (typeof result.error === 'string' && result.error.length > 0) {
            errorMessage = result.error;
          } else if (typeof result.message === 'string' && result.message.length > 0) {
            errorMessage = result.message;
          }
        }
        
        console.log('提取的错误信息:', errorMessage);
        throw new Error(errorMessage);
      }

    } catch (error) {
      console.error('查询错误:', error);
      
      // 更安全的错误信息提取
      let finalErrorMessage = "查询处理失败";
      
      if (error instanceof Error && error.message) {
        finalErrorMessage = error.message;
      } else if (typeof error === 'string') {
        finalErrorMessage = error;
      }
      
      console.log('最终错误信息:', finalErrorMessage);
      
      toast({
        title: "查询失败",
        description: finalErrorMessage,
        variant: "destructive",
      });
    } finally {
      setIsQuerying(false);
    }
  };

  // 清空索引
  const handleClearIndex = async () => {
    try {
      const response = await fetch('/api/financial-qa/upload', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('清空失败')
      }

      setUploadResults([])
      setIndexStats(null)
      setQaResult(null)
      
      toast({
        title: "索引已清空",
        description: "所有上传的文档已清除",
      })

    } catch (error) {
      console.error('清空索引错误:', error)
      toast({
        title: "清空失败",
        description: error instanceof Error ? error.message : "清空索引失败",
        variant: "destructive",
      })
    }
  }

  const handleExport = (format: string) => {
    toast({
      title: `正在导出为 ${format}`,
      description: "您的分析报告正在准备下载。",
    })
  }

  const handleStartAnalysis = async () => {
    const canProceed = await checkUsagePermission('financial-analysis')
    if (!canProceed) {
      return
    }

    if (backendStatus.status !== 'connected') {
      toast({
        title: "服务未连接",
        description: `后端服务未连接。URL: ${backendStatus.backendUrl}, 错误: ${backendStatus.error}`,
        variant: "destructive"
      })
      return
    }

    if (uploadResults.length === 0 || !uploadResults.some(result => result.status === 'success')) {
      toast({
        title: "请先上传文件",
        description: "请先成功上传财务数据文件再进行分析",
        variant: "destructive"
      })
      return
    }

    if (selectedAnalysisType === "comprehensive") {
      await generateFinancialReport()
    } else {
      setActiveTab("query")
    }
  }

  const generateFinancialReport = async () => {
    setIsGeneratingReport(true)
    setCurrentTaskId(null)
    
    try {
      console.log('开始生成财务分析报告...')
      
      const response = await fetch('/api/financial-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis_type: selectedAnalysisType,
          company_name: '分析企业'
        }),
      })

      if (!response.ok) {
        let errorMessage = '生成报告失败'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorMessage
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      if (result.success) {
        setGeneratedReport(result.data)
        setCurrentTaskId(result.data.task_id)
        
        toast({
          title: "报告生成成功",
          description: "财务分析报告已生成完成",
        })
      } else if (result.cancelled) {
        toast({
          title: "任务已取消",
          description: "报告生成已被用户取消",
        })
      } else {
        throw new Error(result.message || '生成报告失败')
      }

    } catch (error) {
      console.error('生成报告错误:', error)
      
      toast({
        title: "生成报告失败",
        description: error instanceof Error ? error.message : "生成财务分析报告失败",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingReport(false)
      setCurrentTaskId(null)
    }
  }

  const downloadWordReport = async () => {
    setIsDownloadingReport(true)
    
    try {
      // 既然能点击下载，generatedReport一定存在
      if (!generatedReport || !generatedReport.analysis_result) {
        throw new Error('报告数据异常，请重新生成报告')
      }

      // 如果已有下载链接，直接下载
      if (generatedReport.download_url) {
        // 修复：使用更可靠的下载方式
        const link = document.createElement('a')
        link.href = generatedReport.download_url
        link.download = generatedReport.report_file || '财务分析报告.docx'
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast({
          title: "下载开始",
          description: "Word格式报告正在下载...",
        })
        return
      }

      // 如果没有下载链接，基于已有的分析结果生成Word文档
      const response = await fetch('/api/financial-report/generate-word-only', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis_result: generatedReport.analysis_result,
          analysis_type: generatedReport.analysis_type || selectedAnalysisType,
          company_name: generatedReport.company_name || '分析企业'
        }),
      })

      if (!response.ok) {
        throw new Error(`生成Word文档失败: HTTP ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success && result.data.download_url) {
        // 更新报告数据以包含下载信息
        setGeneratedReport(prev => ({
          ...prev,
          download_url: result.data.download_url,
          report_file: result.data.report_file
        }))
        
        // 直接下载
        const link = document.createElement('a')
        link.href = result.data.download_url
        link.download = result.data.report_file
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast({
          title: "下载开始",
          description: "Word格式报告正在下载...",
        })
      } else {
        throw new Error(result.message || '生成下载链接失败')
      }

    } catch (error) {
      console.error('下载Word报告错误:', error)
      toast({
        title: "下载失败",
        description: error instanceof Error ? error.message : "下载Word报告失败",
        variant: "destructive",
      })
    } finally {
      setIsDownloadingReport(false)
    }
  }

  const cancelReportGeneration = async () => {
    if (!currentTaskId) return
    
    setIsCancellingTask(true)
    
    try {
      const response = await fetch('/api/financial-analysis/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task_id: currentTaskId
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "任务已取消",
          description: "财务分析报告生成已停止",
        })
        setIsGeneratingReport(false)
        setCurrentTaskId(null)
      } else {
        throw new Error(result.message || '取消任务失败')
      }

    } catch (error) {
      toast({
        title: "取消失败",
        description: error instanceof Error ? error.message : "取消任务失败",
        variant: "destructive",
      })
    } finally {
      setIsCancellingTask(false)
    }
  }

  // 报告页面的文件上传处理
  const handleReportFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return

    setIsReportUploading(true)
    setReportProgress(0)
    setReportUploadResults([])

    try {
      const files = Array.from(e.target.files)
      const formData = new FormData()
      
      files.forEach(file => {
        formData.append('files', file)
      })

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setReportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/financial-qa/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setReportProgress(100)

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          errorMessage = await response.text().catch(() => '未知错误') || errorMessage
        }
        throw new Error(`文件上传失败: ${errorMessage}`)
      }

      const result = await response.json()
      
      if (result.success) {
        let results = []
        if (Array.isArray(result.results)) {
          results = result.results
        } else if (result.files && Array.isArray(result.files)) {
          results = result.files.map((file: any) => ({
            filename: file.filename || file.name || '未知文件',
            status: 'success' as const,
            chunks_count: file.chunks_count || 0,
            text_length: file.text_length || 0,
            keywords: file.keywords || []
          }))
        }

        setReportUploadResults(results)
        
        toast({
          title: "文件上传成功",
          description: `成功处理 ${results.length} 个文件`,
        })
      } else {
        throw new Error(result.message || result.error || '上传处理失败')
      }

    } catch (error) {
      console.error('报告页面上传错误:', error)
      toast({
        title: "上传失败",
        description: error instanceof Error ? error.message : "文件上传失败",
        variant: "destructive",
      })
    } finally {
      setIsReportUploading(false)
      setReportProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleStreamAnalysis = async () => {
    console.log('=== 开始流式分析流程 ===')
    
    // 添加使用权限检查
    const canProceed = await checkUsagePermission('financial-analysis')
    if (!canProceed) {
      console.log('使用权限检查失败，取消流式分析')
      return
    }

    console.log('使用权限检查通过，继续流式分析')

    if (reportUploadResults.filter(r => r.status === 'success').length === 0) {
      toast({
        title: "请先上传文件",
        description: "请先上传财务数据文件再开始分析",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingReport(true);
    setStreamContent('');
    setIsStreamComplete(false);
    setStreamStatus('初始化分析...');
    
    const taskId = `task-${Date.now()}`;
    setCurrentTaskId(taskId);

    try {
      console.log('=== 开始流式财务分析 ===');
      console.log('上传文件数量:', reportUploadResults.filter(r => r.status === 'success').length);
      console.log('分析类型:', selectedAnalysisType);
      
      // 使用现有的后端流式接口
      const streamUrl = `/api/financial-analysis/stream?analysis_type=${selectedAnalysisType}&task_id=${taskId}`;
      console.log('请求URL:', streamUrl);
      
      const response = await fetch(streamUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
          'Cache-Control': 'no-cache'
        }
      });

      console.log('响应状态:', response.status);
      console.log('响应头Content-Type:', response.headers.get('content-type'));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('流式请求失败:', response.status, errorText);
        console.error('请求URL:', streamUrl);
        console.error('响应头:', response.headers);
        throw new Error(`流式请求失败: ${response.status} - ${errorText || response.statusText}`);
      }

      if (!response.body) {
        throw new Error('响应体为空');
      }

      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let accumulatedContent = '';
      let buffer = '';
      let chunkCount = 0;

      console.log('开始读取流式数据...');
      setStreamStatus('连接成功，开始接收数据...');

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('流式响应读取完成，总块数:', chunkCount);
            break;
          }

          chunkCount++;
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // 每处理10个块输出一次日志
          if (chunkCount % 10 === 0) {
            console.log(`已处理 ${chunkCount} 个数据块，缓冲区大小: ${buffer.length}`);
          }
          
          // 按行分割处理
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              
              if (!dataStr) continue;
              
              try {
                const data = JSON.parse(dataStr);
                console.log('解析的流式数据:', data.type, data.message || (data.content ? `内容长度: ${data.content.length}` : ''));
                
                switch (data.type) {
                  case 'status':
                    setStreamStatus(data.message);
                    break;
                  case 'analysis_start':
                    setStreamContent('');
                    accumulatedContent = '';
                    setStreamStatus('AI分析开始，正在生成报告...');
                    console.log('=== 分析开始 ===');
                    break;
                  case 'analysis_chunk':
                    if (data.content) {
                      accumulatedContent += data.content;
                      setStreamContent(accumulatedContent);
                      
                      // 每1000字符输出一次进度
                      if (accumulatedContent.length % 1000 < data.content.length) {
                        console.log(`内容更新，总长度: ${accumulatedContent.length} 字符`);
                        setStreamStatus(`正在生成报告... (${Math.floor(accumulatedContent.length/100)} KB)`);
                      }
                    }
                    break;
                  case 'analysis_complete':
                    setIsStreamComplete(true);
                    setStreamStatus('分析完成');
                    console.log('=== 分析完成 ===');
                    console.log('最终内容长度:', accumulatedContent.length);
                    break;
                  case 'error':
                    console.error('流式错误:', data.message);
                    throw new Error(data.message);
                }
              } catch (parseError) {
                console.warn('解析流式数据失败:', parseError);
                console.warn('原始数据:', dataStr.substring(0, 200));
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // 分析完成后，设置生成的报告
      if (accumulatedContent.length > 0) {
        const reportData = {
          task_id: taskId,
          analysis_result: accumulatedContent,
          analysis_type: selectedAnalysisType,
          company_name: '分析企业',
          processed_files: reportUploadResults
            .filter(r => r.status === 'success')
            .map(r => r.filename),
          stream_generated: true,
          content_length: accumulatedContent.length
        };
        
        setGeneratedReport(reportData);
        console.log('=== 报告数据已设置 ===');
        console.log('最终报告长度:', accumulatedContent.length);
        
        toast({
          title: "分析完成",
          description: `财务分析报告已生成完成 (${Math.floor(accumulatedContent.length/100)} KB)`,
        });
      } else {
        console.warn('未收到分析内容');
        toast({
          title: "分析完成",
          description: "分析完成，但未收到内容，请检查网络连接",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('=== 流式分析错误 ===');
      console.error(error);
      
      toast({
        title: "分析失败",
        description: error instanceof Error ? error.message : "生成财务分析报告失败",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
      setCurrentTaskId(null);
    }
  };

  return (
    <AuthGuard requireAuth={true}>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <UsageWarning />
          <div className="flex flex-col gap-4 md:gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
                财务分析
              </h1>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 rounded-lg bg-indigo-100/50">
              <TabsTrigger
                value="query"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-xs py-1.5"
              >
                <MessageSquare className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden xs:inline">问答</span>
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-xs py-1.5"
              >
                <FileText className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden xs:inline">报告</span>
              </TabsTrigger>
              <TabsTrigger
                value="visualization"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-xs py-1.5"
              >
                <BarChart3 className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden xs:inline">可视化</span>
              </TabsTrigger>
            </TabsList>

            {/* 问答标签页 - 包含上传功能 */}
            <TabsContent value="query" className="mt-6 space-y-6">
              {/* 上传区域 */}
              <Card className="rounded-xl border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader>
                  <CardTitle>上传数据文档</CardTitle>
                  <CardDescription>上传财务数据文档进行分析和问答</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* 后端状态提示 */}
                  <div className="mb-4">
                    {backendStatus.status === 'checking' && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center text-yellow-700">
                          <div className="animate-spin h-4 w-4 border-2 border-yellow-700 border-t-transparent rounded-full mr-2"></div>
                          <span className="text-sm">检查后端服务状态...</span>
                        </div>
                      </div>
                    )}
                    
                    {backendStatus.status === 'connected' && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center text-green-700">
                          <div className="h-4 w-4 bg-green-500 rounded-full mr-2"></div>
                          <span className="text-sm">后端服务已连接 ({backendStatus.backendUrl})</span>
                        </div>
                      </div>
                    )}
                    
                    {backendStatus.status === 'disconnected' && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center text-red-700">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <div className="text-sm">
                            <div>后端服务未连接</div>
                            <div className="text-xs mt-1">URL: {backendStatus.backendUrl}</div>
                            <div className="text-xs">错误: {backendStatus.error}</div>
                            <div className="text-xs mt-1">请确保运行: <code>cd backend && python app.py</code></div>
                            <button 
                              onClick={checkBackendStatus}
                              className="mt-2 px-2 py-1 bg-red-100 hover:bg-red-200 rounded text-xs"
                            >
                              重新检查
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-indigo-200 p-10 bg-gradient-to-br from-white to-indigo-50/30">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                      <Upload className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-medium">拖放您的文件</h3>
                      <p className="text-sm text-gray-500">支持的格式：XLSX、CSV、DOCX、TXT</p>
                    </div>
                    <div className="mt-4">
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 px-4 py-2 text-sm font-medium text-white"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        浏览文件
                      </Button>
                    </div>
                  </div>

                  {isUploading && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">处理文件中...</span>
                        <span className="text-sm text-gray-500">{progress}%</span>
                      </div>
                    <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  {/* 上传结果显示 */}
                  {uploadResults.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-4">处理结果</h3>
                      <div className="space-y-3">
                        {uploadResults.map((result, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              {result.status === 'success' ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                              <div>
                                <p className="font-medium">{result.filename}</p>
                                {result.status === 'success' ? (
                                  <p className="text-sm text-gray-500">
                                    {result.chunks_count} 个文本块, {result.text_length} 字符
                                  </p>
                                ) : (
                                  <p className="text-sm text-red-500">{result.error}</p>
                                )}
                              </div>
                            </div>
                            {result.status === 'success' && result.keywords && (
                              <div className="flex gap-1">
                                {result.keywords.slice(0, 3).map((keyword, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {keyword}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 问答区域 */}
              <Card className="rounded-xl border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    数据问答
                  </CardTitle>
                  <CardDescription>
                    基于上传的文档内容进行智能问答分析
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleQuerySubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="query-input">您的问题</Label>
                      <Textarea
                        id="query-input"
                        placeholder="例如：分析2023年第二季度的销售趋势和主要变化"
                        className="min-h-[120px] rounded-lg border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        {indexStats ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            已加载 {indexStats.files?.length || 0} 个文档
                          </span>
                        ) : uploadResults.length > 0 ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            已上传 {uploadResults.filter(r => r.status === 'success').length} 个文档
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                            请先上传文档
                          </span>
                        )}
                      </div>
                      
                      <Button
                        type="submit"
                        disabled={isQuerying || !query.trim()}
                        className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
                      >
                        {isQuerying ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            分析中...
                          </>
                        ) : (
                          <>
                            <Search className="mr-2 h-4 w-4" />
                            提交查询
                          </>
                        )}
                      </Button>
                    </div>
                  </form>

                  {/* 查询结果显示 */}
                  {qaResult && (
                    <>
                      <Separator className="my-6" />
                      
                      <div className="space-y-6">
                        <div className="rounded-lg border border-indigo-100 p-6 bg-gradient-to-br from-white to-indigo-50/30">
                          <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-indigo-600" />
                            分析结果
                          </h3>
                          
                          <div className="prose prose-sm max-w-none">
                            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                              {qaResult.answer}
                            </div>
                          </div>
                          
                          {qaResult.context_used && (
                            <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              基于文档内容生成
                            </div>
                          )}
                        </div>

                        {/* 相关文档片段 */}
                        {qaResult.sources && qaResult.sources.length > 0 && (
                          <div>
                            <h4 className="text-base font-medium mb-3">相关文档片段</h4>
                            <div className="space-y-3">
                              {qaResult.sources.map((source, index) => (
                                <div key={index} className="p-4 bg-white rounded-lg border border-gray-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-indigo-600">
                                      {source.file_name}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      相似度: {(source.similarity_score * 100).toFixed(1)}%
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 line-clamp-3">
                                    {source.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 报告标签页 - 独立的上传和分析功能 */}
            <TabsContent value="reports" className="mt-6 space-y-6">
              {!generatedReport ? (
                <Card className="rounded-xl border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <CardHeader>
                    <CardTitle>生成财务分析报告</CardTitle>
                    <CardDescription>上传财务数据文件，生成专业的分析报告</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* 上传文件部分 */}
                    <div className="mb-6">
                      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-indigo-200 p-8 bg-gradient-to-br from-white to-indigo-50/30">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                          <Upload className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-base font-medium">上传财务数据</h3>
                          <p className="text-sm text-gray-500">支持：XLSX、CSV、DOCX</p>
                        </div>
                        <div>
                          <Label htmlFor="report-upload" className="cursor-pointer">
                            <div className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 px-4 py-2 text-sm font-medium text-white">
                              <Upload className="mr-2 h-4 w-4" />
                              选择文件
                            </div>
                            <Input
                              id="report-upload"
                              type="file"
                              multiple
                              accept=".xlsx,.csv,.docx,.txt"
                              className="hidden"
                              onChange={handleReportFileUpload}
                            />
                          </Label>
                        </div>
                      </div>

                      {isReportUploading && (
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">处理文件中...</span>
                            <span className="text-sm text-gray-500">{reportProgress}%</span>
                          </div>
                          <Progress value={reportProgress} className="h-2" />
                        </div>
                      )}
                    </div>

                    {/* 报告页面上传结果显示 */}
                    {reportUploadResults.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-medium mb-4">处理结果</h3>
                        <div className="space-y-3">
                          {reportUploadResults.map((result, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                {result.status === 'success' ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-500" />
                                )}
                                <div>
                                  <p className="font-medium">{result.filename}</p>
                                  {result.status === 'success' ? (
                                    <p className="text-sm text-gray-500">
                                      {result.chunks_count} 个文本块, {result.text_length} 字符
                                    </p>
                                  ) : (
                                    <p className="text-sm text-red-500">{result.error}</p>
                                  )}
                                </div>
                              </div>
                              {result.status === 'success' && result.keywords && (
                                <div className="flex gap-1">
                                  {result.keywords.slice(0, 3).map((keyword, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {keyword}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 分析类型选择 - 新的卡片形式 */}
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-4">选择分析类型</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          {
                            id: "comprehensive",
                            title: "综合财务分析",
                            description: "全面分析企业财务状况，涵盖四大维度指标",
                            icon: "📊",
                            color: "from-slate-500 to-gray-600"
                          },
                          {
                            id: "dupont",
                            title: "杜邦分析",
                            description: "ROE分解分析，剖析净资产收益率驱动因素",
                            icon: "🔍",
                            color: "from-rose-500 to-pink-500"
                          },
                          {
                            id: "profitability",
                            title: "盈利能力与收益质量",
                            description: "净资产收益率、销售净利率、毛利率等盈利指标分析",
                            icon: "📈",
                            color: "from-green-500 to-emerald-500"
                          },
                          {
                            id: "debt",
                            title: "资本结构与偿债能力", 
                            description: "流动比率、速动比率、资产负债率等偿债能力分析",
                            icon: "🏦",
                            color: "from-blue-500 to-cyan-500"
                          },
                          {
                            id: "efficiency",
                            title: "资产营运效率",
                            description: "存货周转率、应收账款周转率、总资产周转率分析",
                            icon: "⚙️",
                            color: "from-purple-500 to-violet-500"
                          },
                          {
                            id: "growth",
                            title: "成长能力",
                            description: "营业收入增长率、净利润增长率等成长性指标分析",
                            icon: "🚀",
                            color: "from-orange-500 to-red-500"
                          },
                          {
                            id: "investment",
                            title: "资本投资效率",
                            description: "投资回报率、资本配置效率和投资效益分析",
                            icon: "💰",
                            color: "from-yellow-500 to-amber-500"
                          },
                          {
                            id: "cashflow",
                            title: "现金流量分析",
                            description: "经营、投资、筹资现金流量及现金流质量分析",
                            icon: "💧",
                            color: "from-teal-500 to-cyan-500"
                          }
                        ].map((template) => (
                          <div
                            key={template.id}
                            className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 hover:shadow-md ${
                              selectedAnalysisType === template.id
                                ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                                : 'border-gray-200 bg-white hover:border-indigo-300'
                            }`}
                            onClick={() => setSelectedAnalysisType(template.id)}
                          >
                            {selectedAnalysisType === template.id && (
                              <div className="absolute top-2 right-2">
                                <CheckCircle className="h-5 w-5 text-indigo-600" />
                              </div>
                            )}
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${template.color} flex items-center justify-center text-white text-lg`}>
                                {template.icon}
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">{template.title}</h4>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">{template.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 分析按钮 */}
                    <div className="flex justify-center">
                      <Button
                        onClick={handleStreamAnalysis}
                        disabled={isReportUploading || isGeneratingReport || reportUploadResults.filter(r => r.status === 'success').length === 0}
                        className="px-8 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 text-lg font-medium"
                      >
                        {isGeneratingReport ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            分析中...
                          </>
                        ) : (
                          <>
                            <FileText className="mr-2 h-5 w-5" />
                            开始分析
                          </>
                        )}
                      </Button>
                      
                      {isGeneratingReport && (
                        <Button
                          variant="outline"
                          onClick={cancelReportGeneration}
                          disabled={isCancellingTask}
                          className="ml-3 rounded-lg border-red-200 text-red-600 hover:bg-red-50"
                        >
                          {isCancellingTask ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "中止"
                          )}
                        </Button>
                      )}
                    </div>

                    {/* 流式分析状态显示 */}
                    {isGeneratingReport && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">正在生成财务分析报告...</span>
                        </div>
                        
                        {streamStatus && (
                          <div className="mb-3 p-2 bg-blue-100 rounded text-xs text-blue-700">
                            📊 {streamStatus}
                          </div>
                        )}
                        
                        {streamContent && (
                          <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-600">实时分析内容</span>
                              <span className="text-xs text-gray-500">{streamContent.length} 字符</span>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                              <FinancialMarkdownRenderer 
                                content={streamContent}
                                className="text-xs"
                              />
                            </div>
                            
                            {isStreamComplete && (
                              <div className="mt-3 pt-3 border-t border-blue-200">
                                <div className="flex items-center gap-2 text-green-600">
                                  <CheckCircle className="h-4 w-4" />
                                  <span className="text-xs font-medium">分析完成</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="rounded-xl border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      财务分析报告
                    </CardTitle>
                    <CardDescription>
                      基于上传的财务数据生成的专业分析报告
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">{generatedReport.company_name}财务分析报告</h3>
                          <p className="text-sm text-gray-500">
                            分析类型: {
                              generatedReport.analysis_type === 'comprehensive' ? '综合财务分析' : 
                              generatedReport.analysis_type === 'dupont' ? '杜邦分析' :
                              generatedReport.analysis_type === 'profitability' ? '盈利能力与收益质量' :
                              generatedReport.analysis_type === 'debt' ? '资本结构与偿债能力' :
                              generatedReport.analysis_type === 'efficiency' ? '资产营运效率' : 
                              generatedReport.analysis_type === 'growth' ? '成长能力' :
                              generatedReport.analysis_type === 'investment' ? '资本投资效率' :
                              generatedReport.analysis_type === 'cashflow' ? '现金流量分析' :
                              generatedReport.analysis_type
                            }
                          </p>
                          <p className="text-sm text-gray-500">
                            处理文件: {generatedReport.processed_files?.join(', ')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={downloadWordReport}
                            disabled={isDownloadingReport}
                            className="rounded-lg"
                          >
                            {isDownloadingReport ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                下载中...
                              </>
                            ) : (
                              <>
                                <Download className="mr-2 h-4 w-4" />
                                下载Word
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setGeneratedReport(null)
                              setReportUploadResults([])
                            }}
                            className="rounded-lg"
                          >
                            重新分析
                          </Button>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="prose prose-sm max-w-none">
                        <div className="bg-gradient-to-br from-white to-slate-50 p-6 rounded-lg border border-slate-200 max-h-96 overflow-y-auto shadow-sm">
                          <FinancialMarkdownRenderer 
                            content={generatedReport.analysis_result}
                            className="text-sm"
                          />
                        </div>
                      </div>
                      
                      {generatedReport.financial_data_summary && (
                        <div className="bg-indigo-50 p-4 rounded-lg">
                          <h4 className="font-medium mb-2">数据摘要</h4>
                          <div className="text-sm space-y-1">
                            <p>提取的财务数据项: {generatedReport.financial_data_summary.extracted_items}</p>
                            <p>文本长度: {generatedReport.financial_data_summary.text_length} 字符</p>
                            <p>识别的类别: {generatedReport.financial_data_summary.categories_found?.join(', ') || '无'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* 可视化标签页保持现有内容 */}
            <TabsContent value="visualization" className="mt-6">
              <Card className="rounded-xl border-indigo-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    数据可视化
                  </CardTitle>
                  <CardDescription>
                    将财务数据转换为直观的图表和可视化展示
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <PieChart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">可视化功能开发中</h3>
                    <p className="text-gray-500">即将上线强大的数据可视化功能</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

export default function ProtectedFinancialAnalysisPage() {
  return (
    <AuthGuard requireAuth={true}>
      <FinancialAnalysisPage />
    </AuthGuard>
  )
}
