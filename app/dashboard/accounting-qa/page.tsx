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

// ... 在文件中找到动态导入的地方，将其改为：
// const { getCurrentUser } = await import('../../../lib/supabase')

// ... 保持其余代码不变
