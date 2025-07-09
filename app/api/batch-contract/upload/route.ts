import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import pdfParse from 'pdf-parse';
import JSZip from 'jszip';

// DeepSeek API配置，参考会计问答模块
const DEEPSEEK_API_KEY = 'sk-c0c506ed07dc47a6b3713506a2ebd3c3';
const DEEPSEEK_API_BASE = 'https://api.deepseek.com';

// 文件大小限制：10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Word文档解析函数
async function parseDocxWithJSZip(buffer: ArrayBuffer, filename: string): Promise<string> {
  try {
    console.log(`开始使用JSZip解析DOCX文件: ${filename}`);
    const zip = await JSZip.loadAsync(buffer);
    
    // 获取document.xml
    const docFile = zip.file('word/document.xml');
    if (!docFile) {
      throw new Error('无法找到document.xml文件');
    }
    
    const xmlContent = await docFile.async('text');
    console.log(`成功读取XML内容，长度: ${xmlContent.length}`);
    
    // 简单但有效的XML文本提取
    let text = xmlContent
      .replace(/<w:t[^>]*>/g, '')           // 移除w:t开始标签
      .replace(/<\/w:t>/g, '\n')           // w:t结束标签替换为换行
      .replace(/<w:br[^>]*\/>/g, '\n')     // 换行符
      .replace(/<w:p[^>]*>/g, '\n')        // 段落开始
      .replace(/<[^>]*>/g, ' ')            // 移除所有其他标签
      .replace(/&amp;/g, '&')             // 恢复特殊字符
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')                // 合并多个空格
      .replace(/\n\s*\n/g, '\n')           // 合并多个换行
      .trim();
    
    console.log(`解析完成，提取文本长度: ${text.length}`);
    return text;
  } catch (error) {
    console.error('JSZip解析DOCX失败:', error);
    throw new Error(`DOCX解析失败: ${error.message}`);
  }
}

// 从文件名提取合同信息
function extractContractInfoFromFilename(filename: string): any {
  const defaultData = {
    contractNumber: '',
    contractName: '',
    contractType: '未分类',
    signDate: '',
    effectiveDate: '',
    expiryDate: '',
    partyA: '',
    partyB: '',
    deliverables: '',
    contractAmount: '',
    qualityStandard: '',
    paymentTerms: '',
    performanceLocation: '',
    performancePeriod: '',
    executionStatus: '待确认',
    liability: '',
    remarks: '基于文件名分析，需要核实具体内容'
  };

  try {
    const cleanName = filename.replace(/\.[^/.]+$/, "");
    defaultData.contractName = cleanName;

    // 提取年份
    const yearMatch = cleanName.match(/(20\d{2})/);
    if (yearMatch) {
      const year = yearMatch[1];
      defaultData.signDate = `${year}-01-01`;
      defaultData.effectiveDate = `${year}-01-01`;
    }

    // 更详细的合同类型和交付标的分析
    if (cleanName.includes('技术服务') || cleanName.includes('服务合同')) {
      defaultData.contractType = '技术服务合同';
      
      // 尝试从文件名提取具体服务内容
      if (cleanName.includes('软件')) {
        defaultData.deliverables = '软件开发及技术服务';
      } else if (cleanName.includes('系统')) {
        defaultData.deliverables = '信息系统开发及维护服务';
      } else if (cleanName.includes('网站')) {
        defaultData.deliverables = '网站建设及技术支持服务';
      } else {
        defaultData.deliverables = '技术开发及支持服务';
      }
    } else if (cleanName.includes('审计')) {
      defaultData.contractType = '审计服务合同';
      
      if (cleanName.includes('财务审计') || cleanName.includes('年度审计')) {
        defaultData.deliverables = '年度财务报表审计服务';
      } else if (cleanName.includes('专项审计')) {
        defaultData.deliverables = '专项审计及相关咨询服务';
      } else if (cleanName.includes('内控')) {
        defaultData.deliverables = '内部控制审计及评价服务';
      } else {
        defaultData.deliverables = '审计及相关咨询服务';
      }
    } else if (cleanName.includes('咨询')) {
      defaultData.contractType = '咨询服务合同';
      
      if (cleanName.includes('管理咨询')) {
        defaultData.deliverables = '管理咨询及改进建议服务';
      } else if (cleanName.includes('财务咨询')) {
        defaultData.deliverables = '财务咨询及规划服务';
      } else {
        defaultData.deliverables = '专业咨询及建议服务';
      }
    }

    // 提取当事人信息
    const partyPattern = /(\S+?)(?:与|和)(\S+?)(?:技术服务合同|服务合同|合同|协议)/;
    const partyMatch = cleanName.match(partyPattern);
    if (partyMatch) {
      defaultData.partyA = partyMatch[1];
      defaultData.partyB = partyMatch[2];
    }

    // 检测修订版
    if (cleanName.includes('修订')) {
      defaultData.remarks += '，修订版合同';
    }

  } catch (error) {
    console.error('从文件名提取信息时出错:', error);
  }

  return defaultData;
}

// 解析文件内容
async function parseFile(file: File): Promise<any> {
  console.log(`正在处理合同文件: ${file.name}, 类型: ${file.type}, 大小: ${file.size} 字节`);
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`文件 ${file.name} 超过10MB限制`);
  }
  
  const buffer = await file.arrayBuffer();
  const fileType = file.name.split('.').pop()?.toLowerCase();
  
  try {
    if (fileType === 'pdf') {
      console.log(`开始处理PDF文件: ${file.name}`);
      const data = await pdfParse(new Uint8Array(buffer));
      console.log(`成功解析PDF，文本长度: ${data.text.length}, 文件: ${file.name}`);
      
      return {
        type: 'pdf',
        filename: file.name,
        content: data.text,
        extractedData: extractContractDataFromText(data.text)
      };
    } else if (fileType === 'docx') {
      console.log(`开始处理Word DOCX文件: ${file.name}`);
      try {
        const text = await parseDocxWithJSZip(buffer, file.name);
        
        if (text.length < 50) {
          console.warn('提取的文本内容较少，可能解析不完整');
        }
        
        return {
          type: 'docx',
          filename: file.name,
          content: text,
          extractedData: extractContractDataFromText(text)
        };
      } catch (docxError) {
        console.error(`DOCX文件解析失败: ${file.name}`, docxError);
        
        // 降级处理：基于文件名分析
        const filenameData = extractContractInfoFromFilename(file.name);
        
        return {
          type: 'docx_fallback',
          filename: file.name,
          content: `Word文档解析失败：${docxError.message}

已基于文件名进行智能分析：
- 合同名称：${filenameData.contractName}
- 合同类型：${filenameData.contractType}
- 甲方：${filenameData.partyA || '待确认'}
- 乙方：${filenameData.partyB || '待确认'}
- 签订时间：${filenameData.signDate || '待确认'}

建议：请将Word文档转换为PDF格式后重新上传，以获得更准确的内容解析。`,
          extractedData: filenameData,
          error: docxError.message
        };
      }
    } else if (fileType === 'doc') {
      console.log(`不支持老版本Word文件: ${file.name}，将基于文件名分析`);
      const filenameData = extractContractInfoFromFilename(file.name);
      
      return {
        type: 'doc_unsupported',
        filename: file.name,
        content: `不支持老版本Word(.doc)格式。建议转换为PDF或新版Word(.docx)格式。

已基于文件名进行分析：
${JSON.stringify(filenameData, null, 2)}`,
        extractedData: filenameData
      };
    } else if (['xlsx', 'xls'].includes(fileType || '')) {
      console.log(`开始处理Excel文件: ${file.name}`);
      const workbook = XLSX.read(new Uint8Array(buffer), {type: 'array'});
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      return {
        type: 'excel',
        filename: file.name,
        content: data,
        extractedData: extractContractDataFromExcel(data)
      };
    } else if (fileType === 'txt') {
      console.log(`开始处理文本文件: ${file.name}`);
      const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
      
      return {
        type: 'text',
        filename: file.name,
        content: text,
        extractedData: extractContractDataFromText(text)
      };
    } else {
      console.log(`不支持的文件类型: ${fileType}`);
      const filenameData = extractContractInfoFromFilename(file.name);
      
      return {
        type: 'unsupported',
        filename: file.name,
        content: `不支持的文件格式: ${fileType}。支持的格式：PDF、DOCX、TXT、Excel`,
        extractedData: filenameData
      };
    }
  } catch (error) {
    console.error(`解析文件失败: ${file.name}`, error);
    
    // 错误降级处理
    const filenameData = extractContractInfoFromFilename(file.name);
    return {
      type: 'error',
      filename: file.name,
      content: `文件处理出错: ${error.message}`,
      extractedData: filenameData,
      error: error.message
    };
  }
}

// 从文本中提取合同数据
function extractContractDataFromText(text: string): any {
  const defaultData = {
    contractNumber: '',
    contractName: '未知合同',
    contractType: '未分类',
    signDate: new Date().toISOString().slice(0, 10),
    effectiveDate: '',
    expiryDate: '',
    partyA: '',
    partyB: '',
    deliverables: '',
    contractAmount: '',
    qualityStandard: '',
    paymentTerms: '',
    performanceLocation: '',
    performancePeriod: '',
    executionStatus: '',
    liability: '',
    remarks: ''
  };

  if (!text || text.length < 10) {
    return defaultData;
  }

  const cleanText = text.replace(/\s+/g, ' ').trim();
  const originalText = text;

  try {
    // 增强的金额提取逻辑
    defaultData.contractAmount = extractAmountFromText(cleanText, originalText);

    // 增强的交付标的提取
    defaultData.deliverables = extractDeliverablesFromText(cleanText, originalText);

    // 增强的合同类型判断
    if (cleanText.includes('审计') || cleanText.includes('审核')) {
      defaultData.contractType = '审计服务合同';
    } else if (cleanText.includes('技术服务') || cleanText.includes('技术开发')) {
      defaultData.contractType = '技术服务合同';
    } else if (cleanText.includes('咨询')) {
      defaultData.contractType = '咨询服务合同';
    } else if (cleanText.includes('建设') || cleanText.includes('施工')) {
      defaultData.contractType = '建设工程合同';
    } else if (cleanText.includes('采购') || cleanText.includes('供货')) {
      defaultData.contractType = '采购合同';
    }

    // 日期提取
    const datePatterns = [
      /签署日期[：:\s]*(20\d{2}[年-]\d{1,2}[月-]\d{1,2}日?)/i,
      /签订日期[：:\s]*(20\d{2}[年-]\d{1,2}[月-]\d{1,2}日?)/i,
      /合同日期[：:\s]*(20\d{2}[年-]\d{1,2}[月-]\d{1,2}日?)/i
    ];
    
    for (const pattern of datePatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        const dateStr = match[1].replace(/[年月日]/g, '-').replace(/--/g, '-').replace(/-$/, '');
        if (dateStr.match(/20\d{2}-\d{1,2}-\d{1,2}/)) {
          defaultData.signDate = dateStr;
          break;
        }
      }
    }

    // 履行期限提取
    const performancePeriodPatterns = [
      /履行期限[：:\s]*([^，,。；\n]*)/i,
      /工期[：:\s]*([^，,。；\n]*)/i,
      /服务期限[：:\s]*([^，,。；\n]*)/i
    ];
    
    for (const pattern of performancePeriodPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1].trim()) {
        defaultData.performancePeriod = match[1].trim();
        break;
      }
    }

    // 履行地点提取
    const locationPatterns = [
      /履行地点[：:\s]*([^，,。；\n]*)/i,
      /工作地点[：:\s]*([^，,。；\n]*)/i,
      /服务地点[：:\s]*([^，,。；\n]*)/i
    ];
    
    for (const pattern of locationPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1].trim()) {
        defaultData.performanceLocation = match[1].trim();
        break;
      }
    }

  } catch (error) {
    console.error('提取合同数据时出错:', error);
  }

  return defaultData;
}

// 专门的金额提取函数
function extractAmountFromText(cleanText: string, originalText: string): string {
  console.log('开始金额提取，文本长度:', cleanText.length);
  
  // 第一步：尝试直接匹配标准格式的金额
  const standardAmount = extractStandardAmount(cleanText);
  if (standardAmount) {
    console.log('找到标准格式金额:', standardAmount);
    return standardAmount;
  }

  // 第二步：尝试表格格式的金额提取
  const tableAmount = extractAmountFromTable(originalText);
  if (tableAmount) {
    console.log('找到表格格式金额:', tableAmount);
    return tableAmount;
  }

  // 第三步：尝试上下文相关的金额提取
  const contextAmount = extractAmountFromContext(cleanText);
  if (contextAmount) {
    console.log('找到上下文金额:', contextAmount);
    return contextAmount;
  }

  // 第四步：尝试大写数字转换
  const chineseAmount = extractChineseAmount(cleanText);
  if (chineseAmount) {
    console.log('找到中文大写金额:', chineseAmount);
    return chineseAmount;
  }

  // 第五步：全文数字搜索（最后的备选方案）
  const fallbackAmount = extractFallbackAmount(cleanText);
  if (fallbackAmount) {
    console.log('找到备选金额:', fallbackAmount);
    return fallbackAmount;
  }

  console.log('未找到任何金额信息');
  return '';
}

// 标准格式金额提取
function extractStandardAmount(text: string): string {
  const amountPatterns = [
    // 基本金额模式
    /(?:合同金额|总价|费用|审计费|服务费|价款|项目费用|总费用|总金额|委托费用|咨询费|技术费|管理费)[：:\s]*(?:为)?(?:人民币)?[￥¥]?\s*([\d,，.]+)(?:元|万元|千元)?/gi,
    
    // 更多变体
    /(?:总计|小计|合计|共计)[：:\s]*(?:人民币)?[￥¥]?\s*([\d,，.]+)(?:元|万元|千元)?/gi,
    /(?:金额|价格|费用标准)[：:\s]*(?:人民币)?[￥¥]?\s*([\d,，.]+)(?:元|万元|千元)?/gi,
    
    // 带括号的金额
    /(?:合同金额|总价|费用)[：:\s]*(?:人民币)?[￥¥]?\s*([\d,，.]+)(?:元|万元|千元)?\s*[（(][^)）]*[）)]/gi,
    
    // 多行格式
    /(?:合同金额|总价)[：:\s]*\n?\s*(?:人民币)?[￥¥]?\s*([\d,，.]+)(?:元|万元|千元)?/gi,
    
    // 带单位说明的格式
    /(?:本合同|项目|服务).*?(?:金额|费用|价格)[：:\s]*(?:人民币)?[￥¥]?\s*([\d,，.]+)(?:元|万元|千元)?/gi,
    
    // 审计特定格式
    /(?:审计|财务审计|专项审计).*?(?:费用|收费)[：:\s]*(?:人民币)?[￥¥]?\s*([\d,，.]+)(?:元|万元|千元)?/gi,
    
    // 咨询服务格式
    /(?:咨询|顾问|技术服务).*?(?:费用|收费|报酬)[：:\s]*(?:人民币)?[￥¥]?\s*([\d,，.]+)(?:元|万元|千元)?/gi
  ];

  for (const pattern of amountPatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      if (match[1] && match[1].trim()) {
        let amount = match[1].replace(/[，,]/g, '');
        
        // 处理单位转换
        const fullMatch = match[0].toLowerCase();
        if (fullMatch.includes('万元')) {
          amount = (parseFloat(amount) * 10000).toString();
        } else if (fullMatch.includes('千元')) {
          amount = (parseFloat(amount) * 1000).toString();
        }
        
        // 验证是否为有效数字
        if (!isNaN(parseFloat(amount)) && parseFloat(amount) > 0) {
          return amount;
        }
      }
    }
  }
  
  return '';
}

// 表格格式金额提取
function extractAmountFromTable(originalText: string): string {
  // 尝试识别表格中的金额信息
  const lines = originalText.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 查找包含金额关键词的行
    if (/(?:金额|价格|费用|总计|合计)/i.test(line)) {
      // 在当前行和后续几行中查找数字
      for (let j = i; j < Math.min(i + 3, lines.length); j++) {
        const targetLine = lines[j];
        const numberMatch = targetLine.match(/[￥¥]?\s*([\d,，.]+)(?:元|万元|千元)?/);
        
        if (numberMatch && numberMatch[1]) {
          let amount = numberMatch[1].replace(/[，,]/g, '');
          
          // 处理单位
          if (targetLine.includes('万元')) {
            amount = (parseFloat(amount) * 10000).toString();
          } else if (targetLine.includes('千元')) {
            amount = (parseFloat(amount) * 1000).toString();
          }
          
          if (!isNaN(parseFloat(amount)) && parseFloat(amount) > 0) {
            return amount;
          }
        }
      }
    }
  }
  
  return '';
}

// 上下文相关的金额提取
function extractAmountFromContext(text: string): string {
  // 寻找价格相关的上下文
  const contextPatterns = [
    // 在价格、费用附近查找数字
    /(?:价格|费用|金额|收费).*?([\d,，.]+).*?(?:元|万元|千元)/gi,
    /(?:付款|支付|结算).*?([\d,，.]+).*?(?:元|万元|千元)/gi,
    /(?:总共|共|总).*?([\d,，.]+).*?(?:元|万元|千元)/gi,
    
    // 寻找 XXX万元 或 XXX元 的独立表述
    /([\d,，.]+)\s*万元/gi,
    /([\d,，.]+)\s*千元/gi,
    /[￥¥]\s*([\d,，.]+)(?:\s*元)?/gi
  ];

  for (const pattern of contextPatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      if (match[1] && match[1].trim()) {
        let amount = match[1].replace(/[，,]/g, '');
        
        // 处理单位转换
        if (match[0].includes('万元')) {
          amount = (parseFloat(amount) * 10000).toString();
        } else if (match[0].includes('千元')) {
          amount = (parseFloat(amount) * 1000).toString();
        }
        
        // 验证数字合理性（过滤掉明显不是金额的数字）
        const numValue = parseFloat(amount);
        if (!isNaN(numValue) && numValue >= 100 && numValue <= 100000000) {
          return amount;
        }
      }
    }
  }
  
  return '';
}

// 中文大写数字转换
function extractChineseAmount(text: string): string {
  // 查找中文大写金额
  const chineseNumberMap: { [key: string]: number } = {
    '零': 0, '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
    '壹': 1, '贰': 2, '叁': 3, '肆': 4, '伍': 5, '陆': 6, '柒': 7, '捌': 8, '玖': 9,
    '十': 10, '拾': 10, '百': 100, '佰': 100, '千': 1000, '仟': 1000, '万': 10000, '萬': 10000
  };

  // 简单的中文数字匹配（这里可以根据需要扩展）
  const chineseAmountPattern = /(?:人民币)?([壹贰叁肆伍陆柒捌玖拾佰仟万萬]+)元/g;
  const matches = [...text.matchAll(chineseAmountPattern)];
  
  for (const match of matches) {
    if (match[1]) {
      // 这里可以实现中文数字转阿拉伯数字的逻辑
      // 简化处理：查找相邻的阿拉伯数字
      const context = text.substring(Math.max(0, match.index! - 50), Math.min(text.length, match.index! + 50));
      const numberMatch = context.match(/([\d,，.]+)/);
      
      if (numberMatch && numberMatch[1]) {
        const amount = numberMatch[1].replace(/[，,]/g, '');
        if (!isNaN(parseFloat(amount)) && parseFloat(amount) > 0) {
          return amount;
        }
      }
    }
  }
  
  return '';
}

// 备选金额提取（最后的尝试）
function extractFallbackAmount(text: string): string {
  // 查找所有数字，过滤出可能是金额的
  const numberPattern = /([\d,，.]+)/g;
  const matches = [...text.matchAll(numberPattern)];
  
  const candidates = [];
  
  for (const match of matches) {
    if (match[1]) {
      const amount = match[1].replace(/[，,]/g, '');
      const numValue = parseFloat(amount);
      
      // 过滤条件：数字大小在合理范围内，且不是日期、电话等
      if (!isNaN(numValue) && 
          numValue >= 1000 && 
          numValue <= 10000000 && 
          !match[1].includes('.') && // 排除小数（可能是比例）
          match[1].length >= 4 && // 至少4位数
          match[1].length <= 8) { // 不超过8位数
        
        // 检查上下文，排除明显不是金额的数字
        const index = match.index!;
        const before = text.substring(Math.max(0, index - 20), index).toLowerCase();
        const after = text.substring(index, Math.min(text.length, index + 20)).toLowerCase();
        
        // 排除日期、电话、编号等
        if (!before.includes('年') && 
            !before.includes('月') && 
            !before.includes('电话') && 
            !before.includes('手机') && 
            !before.includes('编号') && 
            !after.includes('年') &&
            !after.includes('月')) {
          
          candidates.push({
            amount: amount,
            context: before + match[1] + after,
            value: numValue
          });
        }
      }
    }
  }
  
  // 如果有多个候选，选择最合理的一个
  if (candidates.length > 0) {
    // 优先选择有货币相关关键词的上下文
    const withCurrency = candidates.filter(c => 
      c.context.includes('元') || 
      c.context.includes('￥') || 
      c.context.includes('¥') || 
      c.context.includes('费') ||
      c.context.includes('价') ||
      c.context.includes('金')
    );
    
    if (withCurrency.length > 0) {
      return withCurrency[0].amount;
    }
    
    // 否则选择数值最合理的（通常是5000-1000000之间的数字）
    const reasonable = candidates.filter(c => c.value >= 5000 && c.value <= 1000000);
    if (reasonable.length > 0) {
      return reasonable[0].amount;
    }
    
    // 最后选择第一个候选
    return candidates[0].amount;
  }
  
  return '';
}

// 从Excel中提取合同数据
function extractContractDataFromExcel(data: any[]): any {
  const defaultData = {
    contractNumber: '',
    contractName: '未知合同',
    signDate: new Date().toISOString().slice(0, 10),
    effectiveDate: '',
    expiryDate: '',
    partyA: '',
    partyB: '',
    contractAmount: '',
    paymentTerms: '',
    performancePeriod: '',
    executionStatus: '',
    liability: '',
    remarks: ''
  };

  if (Array.isArray(data) && data.length > 0) {
    const firstRow = data[0] as any;
    
    // 尝试从Excel中提取数据
    for (const key in firstRow) {
      const value = firstRow[key];
      if (typeof value === 'string') {
        if (key.includes('编号') || key.includes('合同号')) {
          defaultData.contractNumber = value;
        } else if (key.includes('名称') || key.includes('标题')) {
          defaultData.contractName = value;
        } else if (key.includes('甲方')) {
          defaultData.partyA = value;
        } else if (key.includes('乙方')) {
          defaultData.partyB = value;
        } else if (key.includes('金额')) {
          defaultData.contractAmount = value;
        }
      }
    }
  }

  return defaultData;
}

// 增强的合同信息提取函数
function extractContractDataFromTextEnhanced(text: string): any {
  const defaultData = {
    contractNumber: '',
    contractName: '未知合同',
    contractType: '未分类',
    signDate: '',
    effectiveDate: '',
    expiryDate: '',
    partyA: '',
    partyB: '',
    deliverables: '',
    contractAmount: '',
    qualityStandard: '',
    paymentTerms: '',
    performanceLocation: '',
    performancePeriod: '',
    executionStatus: '',
    liability: '',
    remarks: ''
  };

  if (!text || text.length < 10) {
    return defaultData;
  }

  const cleanText = text.replace(/\s+/g, ' ').trim();

  // 增强的甲方提取
  const partyAPatterns = [
    /(?:甲\s*方|委托方|发包方|买方|客户)[：:\s]*([^，,。；\n()（）]*?)(?=乙方|受托方|承包方|卖方|服务方|地址|电话|法定代表人|联系人|$)/i,
    /委托人[：:\s]*([^，,。；\n()（）]*?)(?=受托人|地址|电话|$)/i,
    /发包人[：:\s]*([^，,。；\n()（）]*?)(?=承包人|地址|电话|$)/i
  ];
  
  for (const pattern of partyAPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1].trim() && match[1].trim().length > 1) {
      defaultData.partyA = match[1].trim().replace(/[()（）]/g, '');
      break;
    }
  }

  // 增强的乙方提取
  const partyBPatterns = [
    /(?:乙\s*方|受托方|承包方|卖方|服务方)[：:\s]*([^，,。；\n()（）]*?)(?=甲方|委托方|发包方|买方|地址|电话|法定代表人|联系人|$)/i,
    /受托人[：:\s]*([^，,。；\n()（）]*?)(?=委托人|地址|电话|$)/i,
    /承包人[：:\s]*([^，,。；\n()（）]*?)(?=发包人|地址|电话|$)/i
  ];
  
  for (const pattern of partyBPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1].trim() && match[1].trim().length > 1) {
      defaultData.partyB = match[1].trim().replace(/[()（）]/g, '');
      break;
    }
  }

  // 增强的合同编号提取
  const contractNumberPatterns = [
    /(?:合同编号|合同号|协议编号)[：:\s]*([A-Za-z0-9\-_/]+)/i,
    /编号[：:\s]*([A-Za-z0-9\-_/]+)/i
  ];
  
  for (const pattern of contractNumberPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1].trim()) {
      defaultData.contractNumber = match[1].trim();
      break;
    }
  }

  // 增强的金额提取
  const amountPatterns = [
    /(?:合同金额|总价|费用|审计费|服务费|价款)[：:\s]*(?:人民币)?[￥¥]?\s*([\d,，.]+)(?:元|万元)?/i,
    /总计[：:\s]*(?:人民币)?[￥¥]?\s*([\d,，.]+)(?:元|万元)?/i,
    /金额[：:\s]*(?:人民币)?[￥¥]?\s*([\d,，.]+)(?:元|万元)?/i
  ];
  
  for (const pattern of amountPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      let amount = match[1].replace(/[，,]/g, '');
      if (cleanText.includes('万元')) {
        amount = (parseFloat(amount) * 10000).toString();
      }
      defaultData.contractAmount = amount;
      break;
    }
  }

  // 增强的合同类型判断
  if (cleanText.includes('审计') || cleanText.includes('审核')) {
    defaultData.contractType = '审计服务合同';
  } else if (cleanText.includes('技术服务') || cleanText.includes('技术开发')) {
    defaultData.contractType = '技术服务合同';
  } else if (cleanText.includes('咨询')) {
    defaultData.contractType = '咨询服务合同';
  } else if (cleanText.includes('建设') || cleanText.includes('施工')) {
    defaultData.contractType = '建设工程合同';
  } else if (cleanText.includes('采购') || cleanText.includes('供货')) {
    defaultData.contractType = '采购合同';
  }

  // 日期提取
  const datePatterns = [
    /签署日期[：:\s]*(20\d{2}[年-]\d{1,2}[月-]\d{1,2}日?)/i,
    /签订日期[：:\s]*(20\d{2}[年-]\d{1,2}[月-]\d{1,2}日?)/i,
    /合同日期[：:\s]*(20\d{2}[年-]\d{1,2}[月-]\d{1,2}日?)/i
  ];
  
  for (const pattern of datePatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      const dateStr = match[1].replace(/[年月日]/g, '-').replace(/--/g, '-').replace(/-$/, '');
      if (dateStr.match(/20\d{2}-\d{1,2}-\d{1,2}/)) {
        defaultData.signDate = dateStr;
        break;
      }
    }
  }

  // 履行期限提取
  const performancePeriodPatterns = [
    /履行期限[：:\s]*([^，,。；\n]*)/i,
    /工期[：:\s]*([^，,。；\n]*)/i,
    /服务期限[：:\s]*([^，,。；\n]*)/i
  ];
  
  for (const pattern of performancePeriodPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1].trim()) {
      defaultData.performancePeriod = match[1].trim();
      break;
    }
  }

  // 履行地点提取
  const locationPatterns = [
    /履行地点[：:\s]*([^，,。；\n]*)/i,
    /工作地点[：:\s]*([^，,。；\n]*)/i,
    /服务地点[：:\s]*([^，,。；\n]*)/i
  ];
  
  for (const pattern of locationPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1].trim()) {
      defaultData.performanceLocation = match[1].trim();
      break;
    }
  }

  return defaultData;
}

// 增强的DeepSeek分析函数
async function analyzeContractsWithDeepSeekEnhanced(parsedFiles: any[]): Promise<any[]> {
  try {
    console.log(`开始使用DeepSeek分析${parsedFiles.length}个合同文件`);

    if (!DEEPSEEK_API_KEY) {
      console.error('缺少DEEPSEEK_API_KEY，使用增强的本地提取');
      return enhancedLocalExtraction(parsedFiles);
    }

    // 分批处理大量文件
    const batchSize = 3; // 每批最多处理3个文件
    const results = [];
    
    for (let i = 0; i < parsedFiles.length; i += batchSize) {
      const batch = parsedFiles.slice(i, i + batchSize);
      const batchResult = await processBatchWithDeepSeek(batch);
      results.push(...batchResult);
    }
    
    return results;
  } catch (error) {
    console.error('DeepSeek分析过程中发生错误:', error);
    return enhancedLocalExtraction(parsedFiles);
  }
}

// 增强的本地提取作为备选方案
function enhancedLocalExtraction(parsedFiles: any[]): any[] {
  return parsedFiles.map((file, index) => {
    // 结合文件内容和文件名进行分析
    const contentData = file.content ? extractContractDataFromTextEnhanced(file.content) : {};
    const filenameData = extractContractInfoFromFilename(file.filename);
    
    // 智能合并数据
    return {
      contractNumber: contentData.contractNumber || filenameData.contractNumber || `HT${Date.now()}${index}`,
      contractName: contentData.contractName !== '未知合同' ? contentData.contractName : 
                   (filenameData.contractName || file.filename?.replace(/\.[^/.]+$/, "") || '未知合同'),
      contractType: contentData.contractType !== '未分类' ? contentData.contractType : filenameData.contractType,
      signDate: contentData.signDate || filenameData.signDate || new Date().toISOString().slice(0, 10),
      effectiveDate: contentData.effectiveDate || filenameData.effectiveDate || '',
      expiryDate: contentData.expiryDate || filenameData.expiryDate || '',
      partyA: contentData.partyA || filenameData.partyA || '待确认',
      partyB: contentData.partyB || filenameData.partyB || '待确认',
      deliverables: contentData.deliverables || filenameData.deliverables || '按合同约定',
      contractAmount: contentData.contractAmount || filenameData.contractAmount || '待确认',
      qualityStandard: contentData.qualityStandard || filenameData.qualityStandard || '符合行业标准',
      paymentTerms: contentData.paymentTerms || filenameData.paymentTerms || '按约定支付',
      performanceLocation: contentData.performanceLocation || filenameData.performanceLocation || '合同约定地点',
      performancePeriod: contentData.performancePeriod || filenameData.performancePeriod || '待确认',
      executionStatus: '待执行',
      liability: contentData.liability || '按合同约定承担违约责任',
      remarks: `提取状态: ${file.error ? '解析失败' : '正常'}, 数据来源: ${contentData.partyA ? '文档内容' : '文件名分析'}`
    };
  });
}

// 调用DeepSeek分析合同
async function analyzeContractsWithDeepSeek(parsedFiles: any[]): Promise<any[]> {
  try {
    console.log(`开始使用DeepSeek分析${parsedFiles.length}个合同文件`);

    if (!DEEPSEEK_API_KEY) {
      console.error('缺少DEEPSEEK_API_KEY，使用默认合同数据');
      return generateDefaultContractEntries(parsedFiles);
    }

    // 构建增强的分析上下文
    const context = `你是资深的合同分析专家，请仔细分析以下合同文档，准确提取关键信息。

【语义理解指南】
合同要素的多种表述方式：
- 甲方/乙方：可能表述为委托方/受托方、发包方/承包方、买方/卖方、当事人等
- 合同金额：可能表述为合同价款、总价、费用、审计费、服务费等
- 交付标的：可能表述为服务内容、工作内容、审计范围、交付物等
- 支付条件：可能表述为付款方式、结算方式、费用支付等
- 履行地点：可能表述为工作地点、服务地点、项目地点等
- 签订日期：可能表述为合同日期、签署日期、订立日期等
- 生效日期：可能表述为合同生效时间、开始时间等

【合同文档内容】
${parsedFiles.map(file => `
==================
文件名：${file.filename}
文件类型：${file.type}
解析状态：${file.error ? '解析出错' : '正常'}
文档内容：
${typeof file.content === 'string' 
  ? file.content.length > 3000 
    ? file.content.substring(0, 3000) + '\n...(内容较长，已截取前3000字符)'
    : file.content
  : JSON.stringify(file.content, null, 2)
}
==================
`).join('\n\n')}

【提取要求】
1. 仔细阅读文档全文，理解合同的实际内容
2. 识别真实的当事人名称（完整的公司/机构名称）
3. 提取准确的金额数字（去除货币符号，只保留数字）
4. 理解合同的核心服务或产品内容
5. 识别真实的时间信息（转换为YYYY-MM-DD格式）
6. 如果信息不明确，标注"待确认"而不是编造

【输出格式】
请严格按照以下JSON数组格式返回：
[
  {
    "contractNumber": "从文档中提取的真实合同编号",
    "contractName": "从文档内容确定的合同名称",
    "contractType": "根据实际内容判断的合同类型（如：审计服务合同、咨询服务合同等）",
    "signDate": "YYYY-MM-DD",
    "effectiveDate": "YYYY-MM-DD",
    "expiryDate": "YYYY-MM-DD",
    "partyA": "甲方真实全称",
    "partyB": "乙方真实全称",
    "deliverables": "具体的服务内容或交付标的",
    "contractAmount": "纯数字金额",
    "qualityStandard": "质量标准或验收标准",
    "paymentTerms": "具体的支付条款",
    "performanceLocation": "具体的履行地点",
    "performancePeriod": "履行期限",
    "executionStatus": "待执行",
    "liability": "违约责任条款",
    "remarks": "重要补充说明"
  }
]

请基于文档实际内容进行分析，不要基于文件名猜测。`;

    console.log('准备调用DeepSeek API分析合同');
    
    const response = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "你是专业的合同分析专家，拥有丰富的法律文书理解经验。你能够准确识别合同中的关键信息，理解不同表述方式的语义含义，确保信息提取的准确性和完整性。"
          },
          {
            role: "user", 
            content: context
          }
        ],
        temperature: 0.1,  // 降低随机性，提高准确性
        max_tokens: 4000,  // 增加token限制
        top_p: 0.95
      })
    });

    if (!response.ok) {
      console.error(`DeepSeek API请求失败: ${response.status}`);
      return generateDefaultContractEntries(parsedFiles);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('无效的API响应结构');
      return generateDefaultContractEntries(parsedFiles);
    }
    
    const content = data.choices[0].message.content;
    console.log('DeepSeek响应成功，内容长度:', content.length);
    console.log('DeepSeek响应内容预览:', content.substring(0, 500));
    
    // 解析JSON数组
    try {
      const jsonMatch = content.match(/\[\s*\{.*\}\s*\]/s) || 
                        content.match(/```json\s*(\[\s*\{.*\}\s*\])\s*```/s) ||
                        content.match(/```\s*(\[\s*\{.*\}\s*\])\s*```/s);
                        
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsedContracts = JSON.parse(jsonStr);
        
        if (!Array.isArray(parsedContracts) || parsedContracts.length === 0) {
          throw new Error('解析结果不是有效的数组');
        }
        
        console.log('成功解析DeepSeek返回的合同数据，条目数:', parsedContracts.length);
        return parsedContracts;
      } else {
        console.warn('未能从DeepSeek响应中提取JSON数组，使用默认数据');
        return generateDefaultContractEntries(parsedFiles);
      }
    } catch (jsonError) {
      console.error('解析DeepSeek返回的JSON失败:', jsonError);
      return generateDefaultContractEntries(parsedFiles);
    }
  } catch (error) {
    console.error('DeepSeek分析过程中发生错误:', error);
    return generateDefaultContractEntries(parsedFiles);
  }
}

// 生成默认合同条目
function generateDefaultContractEntries(parsedFiles: any[]): any[] {
  return parsedFiles.map((file, index) => {
    const baseData = file.extractedData || {};
    const today = new Date().toISOString().slice(0, 10);
    
    return {
      contractNumber: baseData.contractNumber || `HT${Date.now()}${index}`,
      contractName: baseData.contractName || file.filename?.replace(/\.[^/.]+$/, "") || '未知合同',
      contractType: baseData.contractType || '服务合同',
      signDate: baseData.signDate || today,
      effectiveDate: baseData.effectiveDate || today,
      expiryDate: baseData.expiryDate || '',
      partyA: baseData.partyA || '甲方',
      partyB: baseData.partyB || '乙方',
      deliverables: baseData.deliverables || '按合同约定',
      contractAmount: baseData.contractAmount || '100000',
      qualityStandard: baseData.qualityStandard || '符合行业标准',
      paymentTerms: baseData.paymentTerms || '按约定支付',
      performanceLocation: baseData.performanceLocation || '合同约定地点',
      performancePeriod: baseData.performancePeriod || '12个月',
      executionStatus: baseData.executionStatus || '待执行',
      liability: baseData.liability || '按合同约定',
      remarks: baseData.remarks || '无'
    };
  });
}

// 在POST函数中增加处理状态跟踪
export async function POST(request: Request) {
  console.log('接收到批量合同上传请求');
  
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    // 处理状态跟踪
    const processingStatus = {
      totalFiles: files.length,
      successfullyParsed: 0,
      failedToParse: 0,
      aiAnalyzed: 0,
      fallbackUsed: 0,
      details: [] as any[]
    };
    
    // 解析所有合同文件
    const parsedContents = await Promise.all(
      files.map(async (file, index) => {
        try {
          const result = await parseFile(file);
          processingStatus.successfullyParsed++;
          processingStatus.details.push({
            filename: file.name,
            status: 'success',
            contentLength: result.content?.length || 0
          });
          return result;
        } catch (error) {
          processingStatus.failedToParse++;
          processingStatus.details.push({
            filename: file.name,
            status: 'failed',
            error: error.message
          });
          // 返回基于文件名的分析结果
          return {
            type: 'filename_only',
            filename: file.name,
            content: '',
            extractedData: extractContractInfoFromFilename(file.name),
            error: error.message
          };
        }
      })
    );
    
    // 使用DeepSeek分析合同
    let contracts;
    try {
      contracts = await analyzeContractsWithDeepSeekEnhanced(parsedContents);
      processingStatus.aiAnalyzed = contracts.length;
    } catch (error) {
      contracts = enhancedLocalExtraction(parsedContents);
      processingStatus.fallbackUsed = contracts.length;
    }
    
    // 返回详细的处理结果
    return NextResponse.json({
      success: true,
      message: `处理完成：成功解析${processingStatus.successfullyParsed}个文件，${processingStatus.failedToParse}个文件解析失败`,
      contracts: contracts,
      processingStatus: processingStatus,
      recommendations: generateRecommendations(processingStatus)
    });
    
  } catch (error) {
    console.error('处理合同上传文件时出错:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '处理合同上传文件时出错' },
      { status: 500 }
    );
  }
}

// 生成改进建议
function generateRecommendations(status: any): string[] {
  const recommendations = [];
  
  if (status.failedToParse > 0) {
    recommendations.push("建议将解析失败的文档转换为PDF格式后重新上传");
  }
  
  if (status.fallbackUsed > 0) {
    recommendations.push("部分文档使用了本地分析，建议检查网络连接或稍后重试以获得更准确的AI分析结果");
  }
  
  if (status.successfullyParsed < status.totalFiles * 0.8) {
    recommendations.push("解析成功率较低，建议确保文档格式正确且内容清晰");
  }
  
  return recommendations;
}

// 专门的交付标的提取函数
function extractDeliverablesFromText(cleanText: string, originalText: string): string {
  console.log('开始交付标的提取，文本长度:', cleanText.length);
  
  // 第一步：尝试直接匹配标准格式的交付标的
  const standardDeliverables = extractStandardDeliverables(cleanText);
  if (standardDeliverables) {
    console.log('找到标准格式交付标的:', standardDeliverables);
    return standardDeliverables;
  }

  // 第二步：尝试从服务内容章节提取
  const serviceContent = extractServiceContent(cleanText);
  if (serviceContent) {
    console.log('找到服务内容:', serviceContent);
    return serviceContent;
  }

  // 第三步：尝试从工作范围提取
  const workScope = extractWorkScope(cleanText);
  if (workScope) {
    console.log('找到工作范围:', workScope);
    return workScope;
  }

  // 第四步：尝试从项目描述提取
  const projectDescription = extractProjectDescription(cleanText);
  if (projectDescription) {
    console.log('找到项目描述:', projectDescription);
    return projectDescription;
  }

  // 第五步：根据合同类型智能推断
  const typeBasedDeliverables = inferDeliverablesFromType(cleanText);
  if (typeBasedDeliverables) {
    console.log('根据类型推断交付标的:', typeBasedDeliverables);
    return typeBasedDeliverables;
  }

  console.log('未找到具体交付标的信息');
  return '按合同约定提供服务';
}

// 标准格式交付标的提取
function extractStandardDeliverables(text: string): string {
  const deliverablePatterns = [
    // 直接匹配交付标的
    /(?:交付标的|服务内容|工作内容|项目内容|合同标的)[：:\s]*([^。；\n]{10,200})/gi,
    
    // 匹配服务范围
    /(?:服务范围|工作范围|业务范围|项目范围)[：:\s]*([^。；\n]{10,200})/gi,
    
    // 匹配具体服务
    /(?:提供|完成|承担|负责)[：:\s]*([^。；\n]{10,150})/gi,
    
    // 匹配审计相关
    /(?:审计|审核|核查)[：:\s]*([^。；\n]{10,150})/gi,
    
    // 匹配咨询相关
    /(?:咨询|顾问|技术支持)[：:\s]*([^。；\n]{10,150})/gi,
    
    // 匹配工程相关
    /(?:建设|施工|设计)[：:\s]*([^。；\n]{10,150})/gi
  ];

  for (const pattern of deliverablePatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      if (match[1] && match[1].trim()) {
        const content = match[1].trim();
        
        // 过滤掉无意义的内容
        if (isValidDeliverableContent(content)) {
          return cleanupDeliverableContent(content);
        }
      }
    }
  }
  
  return '';
}

// 从服务内容章节提取
function extractServiceContent(text: string): string {
  // 查找服务内容相关的章节
  const sectionPatterns = [
    /(?:第[一二三四五六七八九十\d]+[条章节]?\s*)?(?:服务内容|工作内容|项目内容|业务内容)[：:\s]*\n?([^第]{20,500})/gi,
    /(?:二|2|三|3|四|4|五|5)[、．\.\s]*(?:服务内容|工作内容|项目内容)[：:\s]*([^一二三四五六七八九十]{20,400})/gi,
    /(?:服务|工作|项目)(?:内容|范围|要求)[：:\s]*\n?([^。；]{30,400})/gi
  ];

  for (const pattern of sectionPatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      if (match[1] && match[1].trim()) {
        const content = match[1].trim();
        
        // 清理内容并验证
        const cleaned = cleanupSectionContent(content);
        if (cleaned && cleaned.length > 10) {
          return cleaned;
        }
      }
    }
  }
  
  return '';
}

// 从工作范围提取
function extractWorkScope(text: string): string {
  const scopePatterns = [
    // 具体的工作范围描述
    /(?:工作范围|服务范围|业务范围)[：:\s]*([^。；\n]{20,300})/gi,
    
    // 包含"包括"、"含"等关键词的范围描述
    /(?:服务|工作|项目).*?(?:包括|含|涵盖)[：:\s]*([^。；]{30,300})/gi,
    
    // 审计范围
    /(?:审计范围|审核范围|核查范围)[：:\s]*([^。；\n]{20,300})/gi,
    
    // 技术服务范围
    /(?:技术服务|技术支持|技术咨询).*?(?:范围|内容)[：:\s]*([^。；\n]{20,300})/gi
  ];

  for (const pattern of scopePatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      if (match[1] && match[1].trim()) {
        const content = match[1].trim();
        
        if (isValidDeliverableContent(content)) {
          return cleanupDeliverableContent(content);
        }
      }
    }
  }
  
  return '';
}

// 从项目描述提取
function extractProjectDescription(text: string): string {
  const projectPatterns = [
    // 项目描述
    /(?:项目|工程).*?(?:描述|说明|概述)[：:\s]*([^。；]{30,300})/gi,
    
    // 具体项目内容
    /(?:本项目|该项目|此项目)[：:\s]*([^。；]{30,300})/gi,
    
    // 委托事项
    /(?:委托|委托事项|委托内容)[：:\s]*([^。；]{20,300})/gi,
    
    // 合同目的
    /(?:合同目的|目的|宗旨)[：:\s]*([^。；]{20,300})/gi
  ];

  for (const pattern of projectPatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      if (match[1] && match[1].trim()) {
        const content = match[1].trim();
        
        if (isValidDeliverableContent(content)) {
          return cleanupDeliverableContent(content);
        }
      }
    }
  }
  
  return '';
}

// 根据合同类型智能推断交付标的
function inferDeliverablesFromType(text: string): string {
  const lowerText = text.toLowerCase();
  
  // 审计服务相关
  if (text.includes('审计') || text.includes('审核')) {
    const auditTypes = [];
    
    if (text.includes('财务审计') || text.includes('年度审计')) {
      auditTypes.push('年度财务报表审计');
    }
    if (text.includes('专项审计')) {
      auditTypes.push('专项审计服务');
    }
    if (text.includes('内控审计') || text.includes('内部控制')) {
      auditTypes.push('内部控制审计');
    }
    if (text.includes('税务审计')) {
      auditTypes.push('税务审计服务');
    }
    if (text.includes('合规审计')) {
      auditTypes.push('合规性审计');
    }
    
    if (auditTypes.length > 0) {
      return auditTypes.join('、') + '等审计服务';
    }
    
    return '财务审计服务';
  }
  
  // 技术服务相关
  if (text.includes('技术服务') || text.includes('技术开发') || text.includes('技术支持')) {
    const techServices = [];
    
    if (text.includes('软件开发') || text.includes('系统开发')) {
      techServices.push('软件系统开发');
    }
    if (text.includes('技术咨询')) {
      techServices.push('技术咨询服务');
    }
    if (text.includes('技术培训')) {
      techServices.push('技术培训服务');
    }
    if (text.includes('系统集成')) {
      techServices.push('系统集成服务');
    }
    if (text.includes('运维') || text.includes('维护')) {
      techServices.push('运维支持服务');
    }
    
    if (techServices.length > 0) {
      return techServices.join('、');
    }
    
    return '技术开发及支持服务';
  }
  
  // 咨询服务相关
  if (text.includes('咨询') || text.includes('顾问')) {
    const consultingTypes = [];
    
    if (text.includes('管理咨询')) {
      consultingTypes.push('管理咨询服务');
    }
    if (text.includes('财务咨询')) {
      consultingTypes.push('财务咨询服务');
    }
    if (text.includes('法律咨询')) {
      consultingTypes.push('法律咨询服务');
    }
    if (text.includes('战略咨询')) {
      consultingTypes.push('战略咨询服务');
    }
    
    if (consultingTypes.length > 0) {
      return consultingTypes.join('、');
    }
    
    return '专业咨询服务';
  }
  
  // 建设工程相关
  if (text.includes('建设') || text.includes('施工') || text.includes('工程')) {
    if (text.includes('设计')) {
      return '工程设计服务';
    }
    if (text.includes('监理')) {
      return '工程监理服务';
    }
    if (text.includes('施工')) {
      return '工程施工服务';
    }
    
    return '建设工程相关服务';
  }
  
  // 采购相关
  if (text.includes('采购') || text.includes('供货') || text.includes('设备')) {
    const equipment = extractEquipmentInfo(text);
    if (equipment) {
      return equipment;
    }
    
    return '设备采购及供货';
  }
  
  return '';
}

// 提取设备信息
function extractEquipmentInfo(text: string): string {
  const equipmentPatterns = [
    /(?:采购|供应|提供)[：:\s]*([^。；]{10,100})/gi,
    /(?:设备|产品|材料)[：:\s]*([^。；]{10,100})/gi
  ];

  for (const pattern of equipmentPatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      if (match[1] && match[1].trim()) {
        const content = match[1].trim();
        if (content.length > 5 && !content.includes('甲方') && !content.includes('乙方')) {
          return content;
        }
      }
    }
  }
  
  return '';
}

// 验证交付标的内容是否有效
function isValidDeliverableContent(content: string): boolean {
  if (!content || content.length < 5) {
    return false;
  }
  
  // 排除无意义的内容
  const invalidPatterns = [
    /^[：:\s]+$/,  // 只有冒号和空格
    /^[。；，,\s]+$/,  // 只有标点符号
    /^(甲方|乙方|委托方|受托方)/,  // 以当事人开头
    /^[0-9\-\/]+$/,  // 只有数字和符号
    /电话|地址|联系/,  // 联系信息
    /签字|盖章|日期/  // 签署信息
  ];
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(content)) {
      return false;
    }
  }
  
  return true;
}

// 清理交付标的内容
function cleanupDeliverableContent(content: string): string {
  let cleaned = content
    .replace(/[：:\s]*$/, '')  // 删除末尾的冒号和空格
    .replace(/^[：:\s]+/, '')  // 删除开头的冒号和空格
    .replace(/\s+/g, ' ')     // 合并多个空格
    .trim();
  
  // 移除常见的无用后缀
  cleaned = cleaned.replace(/等$/, '');
  cleaned = cleaned.replace(/。$/, '');
  
  // 如果内容太长，截取合理长度
  if (cleaned.length > 150) {
    cleaned = cleaned.substring(0, 150) + '...';
  }
  
  return cleaned;
}

// 清理章节内容
function cleanupSectionContent(content: string): string {
  let cleaned = content
    .replace(/第[一二三四五六七八九十\d]+[条章节]/g, '')  // 移除条款编号
    .replace(/[1-9]\.[1-9]/g, '')  // 移除数字编号
    .replace(/\([1-9]\)/g, '')     // 移除括号编号
    .replace(/\s+/g, ' ')          // 合并空格
    .trim();
  
  // 提取第一个完整的句子或段落
  const sentences = cleaned.split(/[。；]/).filter(s => s.trim().length > 10);
  if (sentences.length > 0) {
    let result = sentences[0].trim();
    
    // 如果第一句话太短，尝试加上第二句
    if (result.length < 30 && sentences.length > 1) {
      result += '；' + sentences[1].trim();
    }
    
    return result;
  }
  
  return cleaned.length > 150 ? cleaned.substring(0, 150) + '...' : cleaned;
} 