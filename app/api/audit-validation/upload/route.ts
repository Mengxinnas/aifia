import { NextResponse } from 'next/server'

// 测试方案：验证API调用是否正常
async function testDeepseekAPI() {
    try {
        const testQuestion = "测试问题";
        const testContext = "测试上下文";
        const result = await callDeepseek(testQuestion, testContext);
        console.log("测试结果:", result);
    } catch (error) {
        console.error("测试失败:", error);
    }
}

// 取消注释下面这行来运行测试
// testDeepseekAPI();

// Deepseek v3 API 配置
const DEEPSEEK_API_KEY = "sk-c0c506ed07dc47a6b3713506a2ebd3c3"
const DEEPSEEK_API_BASE = "https://api.deepseek.com"

// 支持的文件类型
const SUPPORTED_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]

// 解析文件内容（这里只做简单示例，实际可根据类型扩展）
async function parseFile(file: File): Promise<string> {
    const buffer = await file.arrayBuffer()
    // 这里只返回文件名和大小，实际可用第三方库解析内容
    return `文件名: ${file.name}, 大小: ${file.size} 字节`
}

// 调用Deepseek v3 API进行分析
async function callDeepseek(question: string, context: string): Promise<string> {
    if (!DEEPSEEK_API_KEY) {
        throw new Error('DEEPSEEK_API_KEY未配置')
    }

    const payload = {
        model: "deepseek-chat",
        messages: [
            { role: "system", content: "你是专业的审计与验证助手，请结合用户上传的审计文档内容和问题，给出详细分析、异常点和风险提示。" },
            { role: "user", content: `文档内容：${context}\n\n用户问题：${question}` }
        ],
        temperature: 0.3,
        max_tokens: 1200
    }

    console.log('准备调用Deepseek，问题:', question, '上下文:', context)
    const response = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify(payload)
    })

    const text = await response.text()
    console.log('Deepseek响应状态:', response.status)
    console.log('Deepseek响应内容:', text)

    if (!response.ok) {
        throw new Error(`Deepseek API错误: ${text}`)
    }

    let data
    try {
        data = JSON.parse(text)
    } catch (e) {
        throw new Error('Deepseek返回内容无法解析为JSON')
    }

    return data.choices?.[0]?.message?.content || '未获取到有效分析结果'
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];
        const question = formData.get('question')?.toString() || '';

        // 检查：必须有文件或问题，二者不能都为空
        if (files.length === 0 && !question) {
            return NextResponse.json({ error: '未上传文件且未输入问题' }, { status: 400 });
        }

        // 解析所有文件内容（如果有文件）
        let context = '';
        if (files.length > 0) {
            const parsedContents = await Promise.all(
                files.map(file => parseFile(file))
            );
            context = parsedContents.join('\n');
        }

        // 调用Deepseek v3分析
        const answer = await callDeepseek(question, context);

        // 生成任务ID
        const taskId = `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

        return NextResponse.json({
            success: true,
            message: '分析完成',
            taskId,
            answer
        });
    } catch (error) {
        console.error('处理上传文件时出错:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : '处理上传文件时出错' },
            { status: 500 }
        );
    }
} 