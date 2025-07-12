import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { DashboardLayout } from "../../components/dashboard-layout"
import { Button } from "../../components/ui/button"
import { BarChart, LineChart } from "../../components/ui/chart"
import {
  FileText,
  MessageSquare,
  Shield,
  Upload,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  History,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import { Separator } from "../../components/ui/separator"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
              仪表盘
            </h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="rounded-full text-sm h-9">
                导出
              </Button>
              <Button className="rounded-full text-sm h-9 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300">
                新建报告
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:gap-6 grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-xl border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">已处理文档</CardTitle>
              <FileText className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">1,248</div>
              <p className="text-xs text-gray-500">较上月 +12%</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">会计查询</CardTitle>
              <MessageSquare className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">342</div>
              <p className="text-xs text-gray-500">较上月 +8%</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">批量处理</CardTitle>
              <Upload className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">56</div>
              <p className="text-xs text-gray-500">较上月 +2%</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 md:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">审计报告</CardTitle>
              <Shield className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">24</div>
              <p className="text-xs text-gray-500">较上月 +4%</p>
            </CardContent>
          </Card>
        </div>

        {/* 历史记录 Section */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent flex items-center">
              <History className="mr-2 h-5 w-5 text-indigo-600" />
              历史记录
            </h2>
            <Button variant="outline" size="sm" className="rounded-full">
              查看全部
            </Button>
          </div>

          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
            {[
              { title: "月度财务报表分析", date: "2023-06-25 14:30", type: "财务分析" },
              { title: "供应商发票对账", date: "2023-06-24 10:15", type: "批量台账" },
              { title: "季度审计准备", date: "2023-06-23 16:45", type: "审计与验证" },
            ].map((session, i) => (
              <Card
                key={i}
                className="rounded-xl border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <CardHeader className="p-3 md:p-4">
                  <CardTitle className="text-sm md:text-base truncate">{session.title}</CardTitle>
                  <CardDescription className="text-xs flex justify-between">
                    <span>{session.date}</span>
                    <span className="text-indigo-600">{session.type}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 md:p-4 pt-0 md:pt-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-xs h-8"
                  >
                    继续会话
                    <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Separator className="my-4" />

        {/* 功能区 Section */}
        <div>
          <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent mb-4">
            功能区
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<MessageSquare className="h-10 w-10 text-indigo-600" />}
              title="会计问答"
              description="使用我们专业的语言模型获取复杂会计和财务问题的准确答案。"
              href="/dashboard/accounting-qa"
            />
            <FeatureCard
              icon={<FileText className="h-10 w-10 text-indigo-600" />}
              title="批量台账"
              description="上传各类文档并自动生成分类台账，支持发票、银行对账单、库存记录和合同等。"
              href="/dashboard/batch-ledger"
            />
            <FeatureCard
              icon={<BarChart3 className="h-10 w-10 text-indigo-600" />}
              title="财务分析"
              description="上传数据文档进行查询、分析和可视化，生成综合财务分析报告和PPT。"
              href="/dashboard/financial-analysis"
            />
            <FeatureCard
              icon={<Shield className="h-10 w-10 text-indigo-600" />}
              title="审计与验证"
              description="上传相关文档，基于风险模型和审计准则进行审计，生成审计解释和结论。"
              href="/dashboard/audit"
            />
          </div>
        </div>

        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="rounded-xl border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="p-3 md:p-6">
              <CardTitle className="text-base md:text-lg">最近会计查询</CardTitle>
              <CardDescription>AI 回答的最新问题</CardDescription>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
              <div className="space-y-3 md:space-y-4">
                {[
                  "如何根据 IFRS 16 处理租赁修改？",
                  "关联方交易的披露要求是什么？",
                  "如何计算暂时性差异的递延税款？",
                  "外币交易的处理方法是什么？",
                ].map((query, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <MessageSquare className="mt-1 h-4 w-4 text-indigo-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">{query}</p>
                      <p className="text-xs text-gray-500">{new Date(Date.now() - i * 3600000).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-xs h-8 md:text-sm"
                  asChild
                >
                  <Link href="/dashboard/accounting-qa">
                    查看所有查询
                    <ArrowRight className="ml-2 h-3 w-3 md:h-4 md:w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="p-3 md:p-6">
              <CardTitle className="text-base md:text-lg">最近处理的文档</CardTitle>
              <CardDescription>系统处理的最新文档</CardDescription>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
              <div className="space-y-3 md:space-y-4">
                {[
                  { id: "DOC-2023-001", amount: "¥1,245.00", status: "已处理" },
                  { id: "DOC-2023-002", amount: "¥3,450.00", status: "已处理" },
                  { id: "DOC-2023-003", amount: "¥780.50", status: "处理中" },
                  { id: "DOC-2023-004", amount: "¥2,100.00", status: "待处理" },
                ].map((doc, i) => (
                  <div key={i} className="flex items-start justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <FileText className="mt-1 h-4 w-4 text-indigo-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{doc.id}</p>
                        <p className="text-xs text-gray-500">{doc.amount}</p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "text-xs font-medium shrink-0",
                        doc.status === "已处理"
                          ? "text-green-500"
                          : doc.status === "处理中"
                            ? "text-orange-500"
                            : "text-gray-500",
                      )}
                    >
                      {doc.status}
                    </div>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-xs h-8 md:text-sm"
                  asChild
                >
                  <Link href="/dashboard/batch-ledger">
                    查看所有文档
                    <ArrowRight className="ml-2 h-3 w-3 md:h-4 md:w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="p-3 md:p-6">
              <CardTitle className="text-base md:text-lg">审计提醒</CardTitle>
              <CardDescription>最近的审计发现和提醒</CardDescription>
            </CardHeader>
            <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
              <div className="space-y-3 md:space-y-4">
                {[
                  {
                    title: "收入确认不一致",
                    description: "第二季度报告中的收入确认可能存在问题",
                    type: "warning",
                  },
                  {
                    title: "缺少文档",
                    description: "3笔交易缺少支持文档",
                    type: "warning",
                  },
                  {
                    title: "对账完成",
                    description: "六月份银行对账成功完成",
                    type: "success",
                  },
                  {
                    title: "合规检查通过",
                    description: "第二季度所有税务合规检查均已通过",
                    type: "success",
                  },
                ].map((alert, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {alert.type === "warning" ? (
                      <AlertTriangle className="mt-1 h-4 w-4 text-orange-500 shrink-0" />
                    ) : (
                      <CheckCircle className="mt-1 h-4 w-4 text-green-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium truncate">{alert.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{alert.description}</p>
                    </div>
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-xs h-8 md:text-sm"
                  asChild
                >
                  <Link href="/dashboard/audit">
                    查看所有提醒
                    <ArrowRight className="ml-2 h-3 w-3 md:h-4 md:w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Link 
          href="/debug-user"
          className="text-xs text-gray-500 hover:text-indigo-600 underline"
        >
          调试用户信息
        </Link>
      </div>
    </DashboardLayout>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode
  title: string
  description: string
  href: string
}) {
  return (
    <Link href={href}>
      <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm border border-indigo-100 hover:shadow-md hover:border-indigo-200 transition-all duration-300 h-full">
        <div className="mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 p-3 rounded-full">{icon}</div>
        <h3 className="text-xl font-bold mb-2 bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
          {title}
        </h3>
        <p className="text-gray-500">{description}</p>
      </div>
    </Link>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}
