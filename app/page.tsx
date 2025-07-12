import type React from "react"
import Link from "next/link"
import { Button } from "../../../components/ui/button"
import { ArrowRight, BarChart3, FileText, Shield, Zap, MessageSquare, Upload, Calculator, FileCheck, Building } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg">
              <span className="text-white text-sm font-bold">🐷</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              AI_Fi财小猪
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-purple-600 transition-colors">
              功能
            </Link>
            <Link href="#advantages" className="text-sm font-medium hover:text-purple-600 transition-colors">
              优势
            </Link>
            <Link href="#about" className="text-sm font-medium hover:text-purple-600 transition-colors">
              关于我们
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button
                variant="outline"
                className="rounded-full border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all duration-300"
              >
                登录
              </Button>
            </Link>
            <Link href="/dashboard/accounting-qa">
              <Button className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300">
                开始使用
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="py-20 md:py-28 bg-gradient-to-b from-white to-purple-50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white text-4xl">
                    🐷
                  </div>
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-pink-600 to-pink-700 bg-clip-text text-transparent">
                  专业高效的AI财务、金融、审计工作专家
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                  基于AI的财务分析、票据整理、审计验证、财税审顾问一体化平台，让您的工作更智能、更高效。
                </p>
              </div>
              <div className="flex justify-center mt-6">
                <Link href="/dashboard/accounting-qa">
                  <Button
                    size="lg"
                    className="gap-1 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    立即体验 <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
                  全方位财金审智能化解决方案
                </h2>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                  从会计处理到财务分析，从审计验证到报告生成，一站式满足您的所有专业需求。
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
              <FeatureCard
                icon={<MessageSquare className="h-10 w-10 text-purple-600" />}
                title="AI会计问答"
                description="专业的AI财务顾问，即时回答复杂的会计准则、税务政策等问题，提供权威解答。"
              />
              <FeatureCard
                icon={<FileText className="h-10 w-10 text-purple-600" />}
                title="批量台账生成"
                description="智能识别发票、银行对账单、合同等文档，自动生成分类台账，大幅提升工作效率。"
              />
              <FeatureCard
                icon={<BarChart3 className="h-10 w-10 text-purple-600" />}
                title="财务分析报告"
                description="深度分析财务数据，生成专业的财务报告和PPT，支持多维度数据可视化。"
              />
              <FeatureCard
                icon={<Shield className="h-10 w-10 text-purple-600" />}
                title="智能审计验证"
                description="基于审计准则和风险模型，自动识别财务异常，生成审计建议和风险评估报告。"
              />
              <FeatureCard
                icon={<Calculator className="h-10 w-10 text-purple-600" />}
                title="批量会计处理"
                description="批量处理会计凭证，自动生成会计分录，支持多种会计制度和科目设置。"
              />
              <FeatureCard
                icon={<FileCheck className="h-10 w-10 text-purple-600" />}
                title="发票智能解析"
                description="OCR技术精准识别各类发票信息，自动提取关键数据，支持批量处理。"
              />
              <FeatureCard
                icon={<Building className="h-10 w-10 text-purple-600" />}
                title="合同批量管理"
                description="智能解析合同条款，提取关键财务信息，建立合同台账管理体系。"
              />
              <FeatureCard
                icon={<Upload className="h-10 w-10 text-purple-600" />}
                title="文档批量上传"
                description="支持多种格式文档批量上传，智能分类处理，一键生成各类财务报表。"
              />
              <FeatureCard
                icon={<Zap className="h-10 w-10 text-purple-600" />}
                title="实时数据同步"
                description="与主流财务软件无缝对接，实时同步数据，确保信息准确性和时效性。"
              />
            </div>
          </div>
        </section>

        <section id="advantages" className="py-16 md:py-24 bg-gradient-to-br from-purple-50 to-indigo-50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-purple-100 px-3 py-1 text-sm text-purple-800">
                  为什么选择AI_Fi财小猪
                </div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
                  专为财金审专业人员打造
                </h2>
                <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  深度理解中国会计准则和税务政策，为企业财务团队提供最贴合实际需求的智能化解决方案。
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                    <p>符合中国会计准则的专业AI模型</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                    <p>支持多种财务软件数据格式</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                    <p>智能风险识别和合规检查</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                    <p>可视化财务分析和报告生成</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                    <p>企业级数据安全保护</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative h-[400px] w-full overflow-hidden rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 shadow-lg">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-4">💪🐷</div>
                      <div className="text-2xl font-bold text-purple-700">AI_Fi财小猪</div>
                      <div className="text-purple-600">让财务管理更智能</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t bg-white">
        <div className="container flex flex-col gap-4 py-10 md:flex-row md:gap-8 md:py-12">
          <div className="flex flex-col gap-2 md:gap-4 lg:gap-6">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-5 h-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full">
                <span className="text-white text-xs">💪🐷</span>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI_Fi财小猪
              </span>
            </div>
            <p className="text-sm text-gray-500">智能财务管理平台，让数字会说话</p>
          </div>
          <div className="flex-1" />
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">产品功能</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-gray-500 hover:text-purple-600 transition-colors">
                    会计问答
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-500 hover:text-purple-600 transition-colors">
                    财务分析
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-500 hover:text-purple-600 transition-colors">
                    审计验证
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium">解决方案</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-gray-500 hover:text-purple-600 transition-colors">
                    中小企业
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-500 hover:text-purple-600 transition-colors">
                    会计事务所
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-500 hover:text-purple-600 transition-colors">
                    大型企业
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium">支持</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-gray-500 hover:text-purple-600 transition-colors">
                    帮助中心
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-500 hover:text-purple-600 transition-colors">
                    API文档
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-500 hover:text-purple-600 transition-colors">
                    联系我们
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium">公司</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="text-gray-500 hover:text-purple-600 transition-colors">
                    关于我们
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-500 hover:text-purple-600 transition-colors">
                    隐私政策
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-gray-500 hover:text-purple-600 transition-colors">
                    服务条款
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t">
          <div className="container py-4">
            <p className="text-center text-sm text-gray-500">
              © 2024 AI_Fi财小猪. 保留所有权利.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center space-y-4 text-center p-6 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-300 border border-purple-100">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-50">
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        <p className="text-gray-500">{description}</p>
      </div>
    </div>
  )
}
