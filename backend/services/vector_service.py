"use client"

import type React from "react"

import { useState, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

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

export default function FinancialAnalysisPage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 状态管理
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeTab, setActiveTab] = useState("upload")
  const [query, setQuery] = useState("")
  const [isQuerying, setIsQuerying] = useState(false)
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])
  const [qaResult, setQaResult] = useState<QAResult | null>(null)
  const [indexStats, setIndexStats] = useState<any>(null)

  // 示例分析模型
  const [analysisModels] = useState([
    {
      id: "model-001",
      name: "财务比率分析",
      description: "计算和分析关键财务比率，包括流动比率、速动比率、资产周转率等。",
      category: "财务健康",
    },
    {
      id: "model-002",
      name: "趋势分析",
      description: "分析关键财务指标的历史趋势，识别模式和异常。",
      category: "趋势预测",
    },
    {
      id: "model-003",
      name: "现金流分析",
      description: "分析现金流入和流出，评估现金流健康状况。",
      category: "流动性",
    },
    {
      id: "model-004",
      name: "盈利能力分析",
      description: "分析毛利率、净利率、ROA、ROE等盈利能力指标。",
      category: "盈利能力",
    },
    {
      id: "model-005",
      name: "杜邦分析",
      description: "使用杜邦分析法分解ROE，识别影响因素。",
      category: "盈利能力",
    },
    {
      id: "model-006",
      name: "行业对标分析",
      description: "与行业标准和竞争对手进行财务指标对比。",
      category: "竞争分析",
    },
  ])

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      // 调用上传API
      const response = await fetch('/api/financial-qa/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        throw new Error('文件上传失败')
      }

      const result = await response.json()
      
      if (result.success) {
        setUploadResults(result.results)
        setIndexStats(result.stats)
        
        toast({
          title: "文件处理完成",
          description: `成功处理 ${result.results.filter((r: UploadResult) => r.status === 'success').length} 个文件`,
        })
        
        // 自动切换到数据查询标签
        setTimeout(() => {
          setActiveTab("query")
        }, 1000)
      } else {
        throw new Error(result.error || '处理失败')
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
    }
  }

  // 处理问答查询
  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsQuerying(true)
    setQaResult(null)

    try {
      const response = await fetch('/api/financial-qa/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: query }),
      })

      if (!response.ok) {
        throw new Error('查询失败')
      }

      const result = await response.json()
      
      if (result.success) {
        setQaResult(result)
        toast({
          title: "查询完成",
          description: "已生成分析结果",
        })
      } else {
        throw new Error(result.error || '查询失败')
      }

    } catch (error) {
      console.error('查询错误:', error)
      toast({
        title: "查询失败",
        description: error instanceof Error ? error.message : "查询处理失败",
        variant: "destructive",
      })
    } finally {
      setIsQuerying(false)
    }
  }

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

    // 模拟导出过程
    setTimeout(() => {
      toast({
        title: "导出完成",
        description: `您的分析报告已导出为 ${format}。`,
      })
    }, 1500)
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
              财务分析
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setActiveTab("upload")}
                className="rounded-full text-xs h-9 md:text-sm"
              >
                <Upload className="mr-1.5 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                上传数据
              </Button>
              <Button
                onClick={() => setActiveTab("reports")}
                className="rounded-full text-xs h-9 md:text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
              >
                <BarChart3 className="mr-1.5 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                查看分析
              </Button>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 rounded-lg bg-indigo-100/50">
            <TabsTrigger
              value="upload"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-xs py-1.5"
            >
              <Upload className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden xs:inline">上传</span>
            </TabsTrigger>
            <TabsTrigger
              value="query"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-xs py-1.5"
            >
              <MessageSquare className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden xs:inline">问答</span>
            </TabsTrigger>
            <TabsTrigger
              value="visualization"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-xs py-1.5"
            >
              <BarChart3 className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden xs:inline">可视化</span>
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm text-xs py-1.5"
            >
              <FileText className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden xs:inline">报告</span>
            </TabsTrigger>
          </TabsList>

          {/* 上传数据标签页 */}
          <TabsContent value="upload" className="mt-6 space-y-6">
            <Card className="rounded-xl border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader>
                <CardTitle>上传数据文档</CardTitle>
                <CardDescription>上传财务数据文档进行分析和问答</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-indigo-200 p-10 bg-gradient-to-br from-white to-indigo-50/30">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                        <Upload className="h-8 w-8 text-indigo-600" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-lg font-medium">拖放您的文件</h3>
                        <p className="text-sm text-gray-500">支持的格式：XLSX、CSV、PDF、DOCX、TXT</p>
                      </div>
                      <div className="mt-4">
                        <Label htmlFor="data-upload" className="cursor-pointer">
                          <div className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 px-4 py-2 text-sm font-medium text-white">
                            <Upload className="mr-2 h-4 w-4" />
                            浏览文件
                          </div>
                          <Input
                            id="data-upload"
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".xlsx,.csv,.pdf,.docx,.doc,.txt"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                        </Label>
                      </div>
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
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-4 text-lg font-medium">处理选项</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="analysis-type">分析类型</Label>
                          <Select defaultValue="comprehensive">
                            <SelectTrigger id="analysis-type" className="rounded-lg border-indigo-200">
                              <SelectValue placeholder="选择类型" />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
                              <SelectItem value="comprehensive">综合财务分析</SelectItem>
                              <SelectItem value="qa">数据问答</SelectItem>
                              <SelectItem value="custom">自定义分析</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {indexStats && (
                          <div className="p-4 bg-indigo-50 rounded-lg">
                            <h4 className="font-medium mb-2">索引统计</h4>
                            <div className="text-sm space-y-1">
                              <p>文档数量: {indexStats.files?.length || 0}</p>
                              <p>文本块数量: {indexStats.total_chunks || 0}</p>
                              <p>向量维度: {indexStats.dimension || 0}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

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
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  className="rounded-full"
                  onClick={handleClearIndex}
                  disabled={!indexStats || indexStats.total_chunks === 0}
                >
                  清空索引
                </Button>
                <Button
                  disabled={isUploading}
                  onClick={() => setActiveTab("query")}
                  className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300"
                >
                  {isUploading ? "处理中..." : "开始问答"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* 数据问答标签页 */}
          <TabsContent value="query" className="mt-6 space-y-6">
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
                      ) : (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4 text-orange-500" />
                          请先上传文档
                        </span>
                      )}
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={isQuerying || !query.trim() || !indexStats}
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

          {/* 可视化标签页 */}
          <TabsContent value="visualization" className="mt-6">
            <Card className="rounded-xl border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader>
                <CardTitle>数据可视化</CardTitle>
                <CardDescription>查看和交互式探索您的财务数据</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <Label htmlFor="chart-type">图表类型</Label>
                    <Select defaultValue="bar">
                      <SelectTrigger id="chart-type" className="w-[200px] rounded-lg border-indigo-200">
                        <SelectValue placeholder="选择图表类型" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        <SelectItem value="bar">柱状图</SelectItem>
                        <SelectItem value="line">折线图</SelectItem>
                        <SelectItem value="pie">饼图</SelectItem>
                        <SelectItem value="scatter">散点图</SelectItem>
                        <SelectItem value="radar">雷达图</SelectItem>
                        <SelectItem value="heatmap">热力图</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleExport("PNG")} className="rounded-full">
                      <Download className="mr-2 h-4 w-4" />
                      导出图表
                    </Button>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="h-[300px] bg-white rounded-lg border border-indigo-100 p-4 flex items-center justify-center">
                    <BarChart3 className="h-12 w-12 text-indigo-200" />
                  </div>
                  <div className="h-[300px] bg-white rounded-lg border border-indigo-100 p-4 flex items-center justify-center">
                    <LineChart className="h-12 w-12 text-indigo-200" />
                  </div>
                  <div className="h-[300px] bg-white rounded-lg border border-indigo-100 p-4 flex items-center justify-center">
                    <PieChart className="h-12 w-12 text-indigo-200" />
                  </div>
                  <div className="h-[300px] bg-white rounded-lg border border-indigo-100 p-4 flex items-center justify-center">
                    <BarChart3 className="h-12 w-12 text-indigo-200" />
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">分析模型</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {analysisModels.map((model) => (
                      <Card key={model.id} className="border-indigo-100">
                        <CardHeader className="p-4">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{model.name}</CardTitle>
                            <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                              {model.category}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-sm text-gray-500 mb-4">{model.description}</p>
                          <Button variant="outline" size="sm" className="w-full rounded-lg">
                            应用模型
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                    <Card className="border-indigo-100 border-dashed">
                      <CardHeader className="p-4">
                        <CardTitle className="text-base">添加新模型</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 flex items-center justify-center">
                        <Button variant="ghost" size="sm" className="rounded-full h-12 w-12">
                          <Plus className="h-6 w-6 text-indigo-400" />
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 报告标签页 */}
          <TabsContent value="reports" className="mt-6">
            <Card className="rounded-xl border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
              <CardHeader>
                <CardTitle>分析报告</CardTitle>
                <CardDescription>查看和导出财务分析报告</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <Label htmlFor="report-select">选择报告</Label>
                    <Select defaultValue="q2-2023">
                      <SelectTrigger id="report-select" className="w-[250px] rounded-lg border-indigo-200">
                        <SelectValue placeholder="选择报告" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        <SelectItem value="q2-2023">2023年第二季度财务分析</SelectItem>
                        <SelectItem value="q1-2023">2023年第一季度财务分析</SelectItem>
                        <SelectItem value="annual-2022">2022年年度财务分析</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleExport("Excel")} className="rounded-full">
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExport("PDF")} className="rounded-full">
                      <FilePdf className="mr-2 h-4 w-4" />
                      PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleExport("PPT")} className="rounded-full">
                      <Presentation className="mr-2 h-4 w-4" />
                      PPT
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border border-indigo-100 p-4 md:p-6 bg-gradient-to-br from-white to-indigo-50/30 mb-6">
                  <h3 className="text-lg font-medium mb-4">2023年第二季度财务分析</h3>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-medium mb-2">执行摘要</h4>
                      <p className="text-sm text-gray-700">
                        2023年第二季度，公司整体财务表现良好，收入和利润均实现了同比和环比增长。销售额达到¥1,245,000，较上一季度增长12.5%，较去年同期增长18.3%。毛利率提高到42.8%，净利润率为15.2%。
                      </p>
                    </div>

                    <div className="h-[200px] bg-white rounded-lg border border-indigo-100 p-4 flex items-center justify-center">
                      <span className="text-sm text-gray-500">财务分析图表</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-lg border border-indigo-100">
                        <p className="text-xs text-gray-500">毛利率</p>
                        <p className="text-lg font-bold">42.8%</p>
                        <p className="text-xs text-green-500">↑ 2.3%</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-indigo-100">
                        <p className="text-xs text-gray-500">净利润率</p>
                        <p className="text-lg font-bold">15.2%</p>
                        <p className="text-xs text-green-500">↑ 1.5%</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-indigo-100">
                        <p className="text-xs text-gray-500">ROA</p>
                        <p className="text-lg font-bold">8.7%</p>
                        <p className="text-xs text-green-500">↑ 0.8%</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-indigo-100">
                        <p className="text-xs text-gray-500">ROE</p>
                        <p className="text-lg font-bold">12.4%</p>
                        <p className="text-xs text-green-500">↑ 1.2%</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:gap-6 md:grid-cols-2">
                  <Card className="border-indigo-100">
                    <CardHeader className="p-4">
                      <CardTitle className="text-base">PPT演示文稿</CardTitle>
                      <CardDescription>基于分析报告生成的演示文稿</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="h-[150px] bg-white rounded-lg border border-indigo-100 p-4 flex items-center justify-center mb-4">
                        <Presentation className="h-12 w-12 text-indigo-200" />
                      </div>
                      <Button variant="outline" size="sm" className="w-full rounded-lg">
                        <Download className="mr-2 h-4 w-4" />
                        下载PPT
                      </Button>
                    </CardContent>
                  </Card>
                  <Card className="border-indigo-100">
                    <CardHeader className="p-4">
                      <CardTitle className="text-base">交互式仪表盘</CardTitle>
                      <CardDescription>可交互的财务分析仪表盘</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="h-[150px] bg-white rounded-lg border border-indigo-100 p-4 flex items-center justify-center mb-4">
                        <BarChart3 className="h-12 w-12 text-indigo-200" />
                      </div>
                      <Button variant="outline" size="sm" className="w-full rounded-lg">
                        <ArrowRight className="mr-2 h-4 w-4" />
                        查看仪表盘
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" className="rounded-full">
                  返回
                </Button>
                <Button className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300">
                  <Download className="mr-2 h-4 w-4" />
                  导出完整报告
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
} 