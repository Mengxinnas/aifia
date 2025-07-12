"use client"

import type React from "react"
import { useState } from "react"
import { DashboardLayout } from "../../../components/dashboard-layout"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Textarea } from "../../../components/ui/textarea"
import { AuthGuard } from "../../../components/auth-guard"
import { UsageWarning } from '../../../components/usage-warning'
import { MessageSquare, Send } from "lucide-react"
import { useToast } from "../../../components/ui/use-toast"

export default function AccountingQAPage() {
  const { toast } = useToast()
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!question.trim()) {
      toast({
        title: "请输入问题",
        description: "请输入您的会计问题",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000))
      setAnswer("这是一个示例回答。请联系管理员获取完整功能。")
      toast({
        title: "回答已生成",
        description: "请查看下方的回答内容"
      })
    } catch (error) {
      toast({
        title: "生成失败",
        description: "请稍后重试",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthGuard requireAuth={true}>
      <DashboardLayout>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
              会计问答
            </h1>
            <UsageWarning />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                智能问答
              </CardTitle>
              <CardDescription>
                输入您的会计问题，获得专业解答
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">您的问题</label>
                <Textarea
                  placeholder="请输入您的会计问题..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={4}
                />
              </div>
              
              <Button 
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  "正在生成回答..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    提交问题
                  </>
                )}
              </Button>

              {answer && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-2">回答：</h3>
                  <p className="text-gray-700">{answer}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
