"use client"

import type React from "react"

import { useState } from "react"
// 尝试从根目录导入
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Send, Clock, Bookmark, ThumbsUp, ThumbsDown, Copy, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import ReactMarkdown from 'react-markdown'
import { AuthGuard } from "@/components/auth-guard"
import { UsageWarning } from "@/components/usage-warning"
import { useUsageCheck } from "@/lib/usage-middleware"
import Link from "next/link"

export default function ProtectedAccountingQAPage() {
  const { toast } = useToast()
  const { checkAndProceed } = useUsageCheck()
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentResponse, setCurrentResponse] = useState<string | null>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  // 中止当前请求
  const handleAbort = () => {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
      setIsLoading(false)
      toast({
        title: "已中止",
        description: "回答生成已中止",
        variant: "default",
      })
    }
  }

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!query.trim()) {
      toast({
        title: "请输入问题",
        description: "请输入您想询问的会计问题",
        variant: "destructive"
      })
      return
    }

    // 检查使用限制
    const result = await checkAndProceed(
      'accounting-qa',
      async () => {
        // 原有的查询逻辑
        setIsLoading(true)
        setCurrentResponse("")
        
        // 创建新的 AbortController
        const controller = new AbortController()
        setAbortController(controller)
        
        try {
          const response = await fetch('/api/qa/ask', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              question: query,
              context: "您是一位财务和会计专家助手。为会计、审计和财务问题提供准确、详细和专业的答案。"
            }),
            signal: controller.signal,
          })

          if (!response.ok) {
            throw new Error(`请求失败: ${response.status}`)
          }

          // 检查是否为流式响应
          const contentType = response.headers.get('content-type')
          
          if (contentType?.includes('text/event-stream')) {
            // ✅ 处理流式响应
            await handleStreamResponse(response, controller)
          } else {
            // 处理普通JSON响应（兼容性）
            const data = await response.json()
            if (data.error) {
              throw new Error(data.error)
            }
            setCurrentResponse(data.answer)
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            console.log("请求已被用户中止")
            return
          }
          
          console.error("生成响应时出错:", error)
          toast({
            title: "错误",
            description: error instanceof Error ? error.message : "生成响应失败，请重试。",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
          setAbortController(null)
        }
      },
      (message) => {
        toast({
          title: "无法使用功能",
          description: message,
          variant: "destructive",
          duration: 8000,
          action: message.includes('15001314535') ? 
            <Button 
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText('15001314535')
                toast({
                  title: "联系方式已复制",
                  description: "15001314535",
                  duration: 3000
                })
              }}
            >
              联系购买
            </Button> : 
            <Button asChild size="sm">
              <Link href="/dashboard/pricing">购买使用包</Link>
            </Button>
        })
      }
    )
  }

  // ✅ 流式响应处理函数（支持中止）
  const handleStreamResponse = async (response: Response, controller: AbortController | null) => {
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('无法读取流式响应')
    }

    let accumulatedResponse = ''

    try {
      while (true) {
        // 检查是否已中止
        if (controller?.signal.aborted) {
          reader.cancel()
          break
        }

        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              return
            }

            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                accumulatedResponse += parsed.content
                setCurrentResponse(accumulatedResponse) // ✅ 实时更新显示
              }
            } catch (parseError) {
              // 忽略解析错误
              continue
            }
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log("流式响应已被中止")
        return
      }
      console.error('流式响应处理错误:', error)
      throw error
    }
  }

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "已复制到剪贴板",
      description: "文本已复制到您的剪贴板。",
    })
  }

  const handleSaveResponse = () => {
    toast({
      title: "响应已保存",
      description: "响应已保存到您的收藏夹。",
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  // Markdown渲染组件
  const MarkdownRenderer = ({ content }: { content: string }) => {
    const renderMarkdown = (text: string) => {
      // 首先将文本分割成行以便处理
      let lines = text.split('\n')
      let inList = false
      let listCounter = 0

      // 处理每一行
      lines = lines.map(line => {
        // 检测标准markdown标题（### 开头）
        const standardTitleMatch = line.match(/^(#{1,6})\s+(.+)$/)
        if (standardTitleMatch) {
          const level = standardTitleMatch[1].length
          const text = standardTitleMatch[2]
          
          // 根据标题级别设置样式
          switch (level) {
            case 1:
              return `<h1 class="text-xl font-bold text-indigo-900 mb-4 mt-6">${text}</h1>`
            case 2:
              return `<h2 class="text-lg font-bold text-indigo-800 mb-3 mt-5">${text}</h2>`
            case 3:
              return `<h3 class="text-base font-semibold text-indigo-700 mb-3 mt-4">${text}</h3>`
            case 4:
              return `<h4 class="text-sm font-semibold text-indigo-600 mb-2 mt-3">${text}</h4>`
            case 5:
              return `<h5 class="text-sm font-medium text-indigo-600 mb-2 mt-3">${text}</h5>`
            case 6:
              return `<h6 class="text-xs font-medium text-indigo-500 mb-2 mt-2">${text}</h6>`
            default:
              return `<h3 class="text-base font-semibold text-indigo-700 mb-3 mt-4">${text}</h3>`
          }
        }

        // 检测 ### 开头的一级标题（带有中文数字的格式）
        const mainTitleMatch = line.match(/^#{1,3}\s*([一二三四五六七八九十]+、.*)$/)
        if (mainTitleMatch) {
          return `<h1 class="text-lg font-bold text-indigo-800 mb-3 mt-4">${mainTitleMatch[1]}</h1>`
        }

        // 检测数字开头的二级标题
        const sectionMatch = line.match(/^(\d+)\.\s+(.*)$/)
        if (sectionMatch && !line.trim().startsWith('•')) {
          return `<h2 class="text-base font-semibold text-indigo-700 mb-2 mt-3">${sectionMatch[1]}. ${sectionMatch[2]}</h2>`
        }

        // 检测是否是列表项（以 • 开头）
        const bulletMatch = line.match(/^[\s]*[•-]\s+(.*)$/)
        if (bulletMatch) {
          if (!inList) {
            inList = true
            return `<ul class="list-disc ml-4 mb-2"><li class="text-gray-700">${bulletMatch[1]}</li>`
          }
          return `<li class="text-gray-700">${bulletMatch[1]}</li>`
        }

        // 检测是否是数字列表项
        const numberMatch = line.match(/^[\s]*(\d+)\.\s+(.*)$/)
        if (numberMatch && line.trim().startsWith('•')) {
          if (!inList) {
            inList = true
            listCounter = parseInt(numberMatch[1])
            return `<ol class="list-decimal ml-4 mb-2"><li class="text-gray-700" value="${listCounter}">${numberMatch[2]}</li>`
          }
          listCounter = parseInt(numberMatch[1])
          return `<li class="text-gray-700" value="${listCounter}">${numberMatch[2]}</li>`
        }

        // 如果遇到空行且在列表中，关闭列表
        if (line.trim() === '' && inList) {
          inList = false
          return '</ul></ol><p></p>'
        }

        // 处理普通段落
        if (line.trim() !== '') {
          return `<p class="mb-2 leading-relaxed">${line}</p>`
        }

        return line
      })

      // 处理其他格式
      let html = lines.join('\n')
      
      // 处理粗体
      html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-indigo-800">$1</strong>')
      
      // 处理斜体
      html = html.replace(/\*(.*?)\*/g, '<em class="italic text-indigo-600">$1</em>')
      
      // 处理代码块
      html = html.replace(/`([^`]+)`/g, '<code class="bg-indigo-50 text-indigo-800 px-1 py-0.5 rounded text-xs font-mono">$1</code>')

      // 确保所有列表都正确关闭
      if (inList) {
        html += '</ul></ol>'
      }

      return html
    }

    return (
      <div 
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      />
    )
  }

  return (
    <AuthGuard requireAuth={true}>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          {/* 添加使用量警告 */}
          <UsageWarning />
          
          <div className="flex flex-col gap-4 md:gap-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
                财税审顾问
              </h1>
            </div>

            <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card className="h-full rounded-xl border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <CardHeader className="p-3 md:p-6">
                    <CardTitle className="text-base md:text-lg">提问</CardTitle>
                    <CardDescription>获取关于财税、审计和会计问题的专家解答</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                    <form onSubmit={handleQuerySubmit} className="space-y-4">
                      <Textarea
                        placeholder="在此输入您的财税、审计或会计问题..."
                        className="min-h-[120px] md:min-h-[150px] rounded-lg border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        disabled={isLoading}
                      />
                      <div className="flex justify-end gap-2">
                        {isLoading && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleAbort}
                            className="rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-300 text-sm h-9"
                          >
                            <X className="mr-2 h-4 w-4" />
                            中止
                          </Button>
                        )}
                        <Button
                          type="submit"
                          disabled={isLoading || !query.trim()}
                          className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 text-sm h-9"
                        >
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              生成中...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              提交问题
                            </>
                          )}
                        </Button>
                      </div>
                    </form>

                    {(currentResponse || isLoading) && (
                      <div className="mt-6">
                        <div className="rounded-lg border border-indigo-100 p-3 md:p-4 bg-gradient-to-br from-white to-indigo-50/30">
                          <div className="mb-3 md:mb-4 flex items-center justify-between">
                            <h3 className="font-semibold text-indigo-700 text-sm md:text-base flex items-center">
                              {isLoading && (
                                <div className="animate-pulse w-2 h-2 bg-indigo-600 rounded-full mr-2"></div>
                              )}
                              回答
                            </h3>
                            <div className="flex gap-1 md:gap-2">
                              {isLoading && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 md:h-8 md:w-8 rounded-full hover:bg-red-100 text-red-600"
                                  onClick={handleAbort}
                                  title="中止回答"
                                >
                                  <X className="h-3 w-3 md:h-4 md:w-4" />
                                  <span className="sr-only">中止回答</span>
                                </Button>
                              )}
                              {currentResponse && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 md:h-8 md:w-8 rounded-full hover:bg-indigo-100"
                                    onClick={() => handleCopyToClipboard(currentResponse)}
                                  >
                                    <Copy className="h-3 w-3 md:h-4 md:w-4" />
                                    <span className="sr-only">复制到剪贴板</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 md:h-8 md:w-8 rounded-full hover:bg-indigo-100"
                                    onClick={handleSaveResponse}
                                  >
                                    <Bookmark className="h-3 w-3 md:h-4 md:w-4" />
                                    <span className="sr-only">保存回答</span>
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-xs md:text-sm max-h-[300px] md:max-h-[400px] overflow-y-auto">
                            {currentResponse ? (
                              <MarkdownRenderer content={currentResponse} />
                            ) : (
                              isLoading && <div className="text-gray-500">正在思考...</div>
                            )}
                            {isLoading && currentResponse && (
                              <span className="animate-pulse text-indigo-600">▊</span>
                            )}
                          </div>
                          {currentResponse && (
                            <div className="mt-3 md:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  ✨ 实时流式生成 
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">{new Date().toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4 md:space-y-6">
                <Card className="rounded-xl border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
                  <CardHeader className="p-3 md:p-4">
                    <CardTitle className="text-base md:text-lg">热门主题</CardTitle>
                    <CardDescription>常见财税审问题</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 md:p-4 pt-0 md:pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                      {[
                        // 会计准则相关
                        "IFRS 9 金融工具",
                        "收入确认 (IFRS 15)",
                        "租赁 (IFRS 16)",
                        // 税务相关
                        "企业所得税汇算清缴",
                        "增值税进项抵扣",
                        "跨境交易税务处理",
                        "税收优惠政策解读",
                        // 审计相关
                        "内部控制审计要点",
                        "舞弊风险识别",
                        "重要性水平确定",
                        "审计抽样方法",
                        // 财务相关
                        "递延税款计算",
                        "合并程序",
                        "外币换算",
                        "公允价值计量",
                        "减值测试"
                      ].map((topic, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          className="w-full justify-start rounded-lg border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-xs h-8 md:text-sm"
                          onClick={() => setQuery(`请解释${topic}并提供关键考虑因素。`)}
                          disabled={isLoading}
                        >
                          <MessageSquare className="mr-1.5 md:mr-2 h-3 w-3 md:h-4 md:w-4 text-indigo-600" />
                          <span className="truncate">{topic}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
