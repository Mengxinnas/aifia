import { NextResponse } from 'next/server';
// 移除直接导入，改为懒加载
// import * as pdfParse from 'pdf-parse/lib/pdf-parse.js';

interface InvoiceInfo {
  invoiceName: string;        
  invoiceNumber: string;      
  issueDate: string;          
  buyerName: string;          
  buyerTaxId: string;         
  sellerName: string;         
  sellerTaxId: string;        
  goodsServices: string;      
  taxRate: string;            
  amount: string;             
  taxAmount: string;          
  totalAmount: string;        
}

// 懒加载PDF解析库
async function parseInvoicePDF(file: File): Promise<InvoiceInfo> {
  const buffer = await file.arrayBuffer();
  const dataBuffer = Buffer.from(new Uint8Array(buffer));
  
  try {
    // 懒加载PDF解析库
    const pdfParse = await import('pdf-parse').then(m => m.default);
    
    const pdfData = await pdfParse(dataBuffer, {
      version: false,
      max: 0,
      normalizeWhitespace: false,
    });
    
    const text = pdfData.text || '';
    
    console.log(`解析发票PDF: ${file.name}, 文本长度: ${text.length}`);
    console.log('原始文本内容:', text);
    
    // 清理文本并保持重要的结构信息
    const cleanedText = text.replace(/\n{3,}/g, '\n\n').trim();
    const lines = cleanedText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log('文本行数组:', lines);
    
    // 解析发票信息
    const invoiceInfo: InvoiceInfo = {
      invoiceName: extractInvoiceName(lines, text),
      invoiceNumber: extractInvoiceNumberSpecialImproved(lines, text),
      issueDate: extractIssueDate(lines, text),
      buyerName: extractBuyerName(lines, text),
      buyerTaxId: extractBuyerTaxIdSpecialImproved(lines, text),
      sellerName: extractSellerName(lines, text),
      sellerTaxId: extractSellerTaxIdSpecialImproved(lines, text),
      goodsServices: extractGoodsServices(lines, text),
      taxRate: extractTaxRate(lines, text),
      amount: extractAmount(lines, text),
      taxAmount: extractTaxAmount(lines, text),
      totalAmount: extractTotalAmount(lines, text)
    };
    
    console.log('提取的发票信息:', invoiceInfo);
    return invoiceInfo;
  } catch (error) {
    console.error(`解析PDF失败: ${file.name}`, error);
    throw new Error(`解析PDF发票失败: ${error.message}`);
  }
}

// 改进的发票名称提取
function extractInvoiceName(lines: string[], text: string): string {
  // 优先查找完整的发票名称
  const fullNames = [
    '电子发票（增值税专用发票）',
    '深圳增值税电子普通发票',
    '北京增值税普通发票',
    '增值税专用发票',
    '增值税普通发票',
    '增值税电子发票'
  ];
  
  for (const name of fullNames) {
    if (text.includes(name)) {
      console.log(`找到发票类型: ${name}`);
      return name;
    }
  }
  
  return '增值税发票';
}

// 改进的发票号码提取 - 更精确的定位
function extractInvoiceNumberSpecialImproved(lines: string[], text: string): string {
  console.log('专用发票：开始提取发票号码（改进版）...');
  
  // 方案1：查找"发票号码："后的数字
  const invoiceNumberPattern = /发票号码[：:]\s*(\d{15,25})/;
  const invoiceNumberMatch = text.match(invoiceNumberPattern);
  if (invoiceNumberMatch) {
    console.log(`通过发票号码标识找到: ${invoiceNumberMatch[1]}`);
    return invoiceNumberMatch[1];
  }
  
  // 方案2：在包含"发票号码"的行中或其后续行查找
  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const line = lines[i];
    
    if (line.includes('发票号码')) {
      console.log(`找到"发票号码"标识行: ${line}`);
      
      // 在当前行查找数字
      const currentLineMatch = line.match(/(\d{15,25})/);
      if (currentLineMatch) {
        console.log(`在标识行找到发票号码: ${currentLineMatch[1]}`);
        return currentLineMatch[1];
      }
      
      // 在后续3行中查找长数字
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const nextLine = lines[j];
        const longNumberMatch = nextLine.match(/\b(\d{15,25})\b/);
        if (longNumberMatch) {
          console.log(`在"发票号码"后找到长数字: ${longNumberMatch[1]} 在行: ${nextLine}`);
          return longNumberMatch[1];
        }
      }
    }
  }
  
  // 方案3：在右上角区域查找特定长度的数字
  for (let i = 0; i < Math.min(lines.length, 12); i++) {
    const line = lines[i];
    
    // 查找18-25位的数字（发票号码的常见长度）
    const possibleNumbers = line.match(/\b(\d{18,25})\b/g);
    if (possibleNumbers) {
      for (const num of possibleNumbers) {
        // 排除纳税人识别号（通常18位且包含字母）
        // 发票号码通常是纯数字且长度在20位左右
        if (num.length >= 18 && num.length <= 25) {
          console.log(`在右上角区域找到可能的发票号码: ${num} 在行: ${line}`);
          return num;
        }
      }
    }
  }
  
  // 方案4：在全文中查找最符合发票号码特征的数字
  const allLongNumbers = text.match(/\b(\d{18,25})\b/g);
  if (allLongNumbers && allLongNumbers.length > 0) {
    // 过滤掉明显不是发票号码的数字
    const filteredNumbers = allLongNumbers.filter(num => {
      // 发票号码通常以2或3开头，长度20位左右
      return num.length >= 18 && num.length <= 25 && (num.startsWith('2') || num.startsWith('3') || num.startsWith('4'));
    });
    
    if (filteredNumbers.length > 0) {
      console.log(`通过特征筛选找到发票号码: ${filteredNumbers[0]}`);
      return filteredNumbers[0];
  }
  
    // 如果没有符合特征的，返回第一个长数字
    console.log(`备用方案找到发票号码: ${allLongNumbers[0]}`);
    return allLongNumbers[0];
  }
  
  // 方案5：最后的备用方案，查找15位以上的数字
  const fallbackPattern = /\b(\d{15,})\b/;
  const fallbackMatch = text.match(fallbackPattern);
  if (fallbackMatch) {
    console.log(`最后备用方案找到: ${fallbackMatch[1]}`);
    return fallbackMatch[1];
  }
  
  console.log('未找到发票号码');
  return '';
}

// 改进的日期提取
function extractIssueDate(lines: string[], text: string): string {
  console.log('开始提取开票日期...');
  
  // 优先查找年月日格式
  const datePatterns = [
    /(\d{4})年(\d{1,2})月(\d{1,2})日/,
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
    /(\d{4})\/(\d{1,2})\/(\d{1,2})/
  ];
  
  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
    if (match) {
        const year = match[1];
        const month = match[2].padStart(2, '0');
        const day = match[3].padStart(2, '0');
        const date = `${year}-${month}-${day}`;
        console.log(`找到开票日期: ${date} 在行: ${line}`);
        return date;
    }
  }
  }
  
  return new Date().toISOString().slice(0, 10);
}

// 改进的购买方名称提取
function extractBuyerName(lines: string[], text: string): string {
  console.log('开始提取购买方名称...');
  
  // 查找购买方信息区域
  let inBuyerSection = false;
  let buyerSectionStartIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 标识购买方区域开始
    if (line.includes('购') && (line.includes('买') || line.includes('方'))) {
      inBuyerSection = true;
      buyerSectionStartIndex = i;
      console.log(`找到购买方区域开始: ${line} at index ${i}`);
      continue;
    }
    
    // 标识销售方区域开始（购买方区域结束）
    if (line.includes('销') && (line.includes('售') || line.includes('方'))) {
      inBuyerSection = false;
      console.log(`购买方区域结束: ${line} at index ${i}`);
    }
    
    // 在购买方区域内查找公司名称
    if (inBuyerSection && line.includes('公司') && line.length > 5 && line.length < 50) {
      // 排除一些标签行
      if (!line.includes('名称') && !line.includes('纳税人') && !line.includes('识别号')) {
        console.log(`在购买方区域找到公司名称: ${line}`);
        return line.trim();
      }
    }
  }
  
  // 备用方案：查找所有公司名称，选择最可能的购买方
  const companyNames = lines.filter(line => 
    line.includes('公司') && 
    line.length > 5 && 
    line.length < 50 &&
    !line.includes('名称') && 
    !line.includes('纳税人')
  );
  
  console.log('找到的所有公司名称:', companyNames);
  
  // 通常第一个是购买方
  if (companyNames.length > 0) {
    console.log(`备用方案选择购买方: ${companyNames[0]}`);
    return companyNames[0].trim();
    }
  
  return '';
}

// 修复语法错误并改进购买方纳税人识别号提取
function extractBuyerTaxIdSpecialImproved(lines: string[], text: string): string {
  console.log('专用发票：开始提取购买方纳税人识别号（改进版）...');
  
  // 方案1：在购买方区域精确查找
  let buyerSectionStart = -1;
  let buyerSectionEnd = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 找到购买方标识
    if (line.includes('购买方') || (line.includes('购') && line.includes('买') && line.includes('方'))) {
      buyerSectionStart = i;
      console.log(`找到购买方区域开始: ${line} at index ${i}`);
    }
    
    // 找到销售方标识（购买方区域结束）
    if ((line.includes('销售方') || (line.includes('销') && line.includes('售') && line.includes('方'))) && buyerSectionStart !== -1) {
      buyerSectionEnd = i;
      console.log(`购买方区域结束: ${line} at index ${i}`);
      break;
    }
  }
  
  // 在购买方区域内查找纳税人识别号
  if (buyerSectionStart !== -1) {
    const endIndex = buyerSectionEnd !== -1 ? buyerSectionEnd : buyerSectionStart + 10;
    
    console.log(`在购买方区域查找纳税人识别号，范围：${buyerSectionStart} 到 ${endIndex}`);
    
    for (let i = buyerSectionStart; i < Math.min(endIndex, lines.length); i++) {
      const line = lines[i];
      console.log(`检查购买方区域第${i}行: ${line}`);
      
      // 查找18位统一社会信用代码（字母+数字组合）
      const creditCodeMatch = line.match(/\b([0-9]{17}[0-9A-Z])\b/);
      if (creditCodeMatch) {
        const taxId = creditCodeMatch[1];
        console.log(`在购买方区域找到18位统一社会信用代码: ${taxId}`);
        return taxId;
      }
      
      // 查找15-18位纳税人识别号
      const taxIdMatch = line.match(/\b([A-Z0-9]{15,18})\b/);
      if (taxIdMatch) {
        const taxId = taxIdMatch[1];
        // 排除发票号码（过长的纯数字）
        if (taxId.length <= 18 && !taxId.match(/^\d{20,}$/)) {
          console.log(`在购买方区域找到纳税人识别号: ${taxId}`);
          return taxId;
        }
      }
    }
  }
  
  // 方案2：收集所有纳税人识别号，选择第一个（购买方）
  console.log('方案2：收集所有纳税人识别号，选择购买方的...');
  
  const allTaxIds = [];
  const taxIdPattern = /\b([0-9]{17}[0-9A-Z]|[A-Z0-9]{15,18})\b/g;
  let match;
  
  while ((match = taxIdPattern.exec(text)) !== null) {
    const taxId = match[1];
    // 排除发票号码和其他过长数字
    if (taxId.length <= 18 && !taxId.match(/^\d{20,}$/)) {
      allTaxIds.push(taxId);
      console.log(`找到可能的纳税人识别号: ${taxId}`);
    }
  }
  
  // 在发票中，购买方信息通常在前面，所以第一个找到的应该是购买方的
  if (allTaxIds.length > 0) {
    console.log(`选择第一个作为购买方纳税人识别号: ${allTaxIds[0]}`);
    return allTaxIds[0];
  }
  
  // 方案3：通过位置推断 - 查找公司名称行后的纳税人识别号
  console.log('方案3：通过公司名称后的位置查找纳税人识别号...');
  
  for (let i = 0; i < Math.min(lines.length, 20); i++) {
    const line = lines[i];
    
    // 查找任意公司名称（不使用特定字样）
    if (line.includes('公司') && line.length > 8 && line.length < 50) {
      console.log(`找到可能的公司名称: ${line} at index ${i}`);
      
      // 在该行及后续2行查找纳税人识别号
      for (let j = i; j < Math.min(i + 3, lines.length); j++) {
        const nextLine = lines[j];
        
        const taxIdMatch = nextLine.match(/\b([0-9]{17}[0-9A-Z]|[A-Z0-9]{15,18})\b/);
        if (taxIdMatch) {
          const taxId = taxIdMatch[1];
          if (taxId.length <= 18 && !taxId.match(/^\d{20,}$/)) {
            console.log(`在公司名称后找到纳税人识别号: ${taxId}`);
            return taxId;
    }
  }
      }
    }
  }
  
  console.log('未找到购买方纳税人识别号');
  return '';
}

// 改进的销售方名称提取
function extractSellerName(lines: string[], text: string): string {
  console.log('开始提取销售方名称...');
  
  // 查找销售方信息区域
  let inSellerSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 标识销售方区域开始
    if (line.includes('销') && (line.includes('售') || line.includes('方'))) {
      inSellerSection = true;
      console.log(`找到销售方区域开始: ${line} at index ${i}`);
      continue;
    }
    
    // 如果遇到其他区域标识，结束销售方区域
    if (inSellerSection && (line.includes('项目') || line.includes('合计') || line.includes('备注'))) {
      inSellerSection = false;
    }
    
    // 在销售方区域内查找公司名称
    if (inSellerSection && line.includes('公司') && line.length > 5 && line.length < 50) {
      if (!line.includes('名称') && !line.includes('纳税人') && !line.includes('识别号')) {
        console.log(`在销售方区域找到公司名称: ${line}`);
        return line.trim();
      }
    }
  }
  
  // 备用方案：查找所有公司名称，选择第二个作为销售方
  const companyNames = lines.filter(line => 
    line.includes('公司') && 
    line.length > 5 && 
    line.length < 50 &&
    !line.includes('名称') && 
    !line.includes('纳税人')
  );
  
  if (companyNames.length > 1) {
    console.log(`备用方案选择销售方: ${companyNames[1]}`);
    return companyNames[1].trim();
    }
  
  return '';
}

// 改进的销售方纳税人识别号提取（不使用特定字样）
function extractSellerTaxIdSpecialImproved(lines: string[], text: string): string {
  console.log('专用发票：开始提取销售方纳税人识别号（改进版）...');
  
  // 方案1：在销售方区域精确查找
  let sellerSectionStart = -1;
  let sellerSectionEnd = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 找到销售方标识
    if (line.includes('销售方') || (line.includes('销') && line.includes('售') && line.includes('方'))) {
      sellerSectionStart = i;
      console.log(`找到销售方区域开始: ${line} at index ${i}`);
    }
    
    // 找到表格或项目名称区域（销售方区域结束）
    if ((line.includes('项目名称') || line.includes('货物或应税劳务') || line.includes('规格型号')) && sellerSectionStart !== -1) {
      sellerSectionEnd = i;
      console.log(`销售方区域结束: ${line} at index ${i}`);
      break;
    }
  }
  
  // 在销售方区域内查找纳税人识别号
  if (sellerSectionStart !== -1) {
    const endIndex = sellerSectionEnd !== -1 ? sellerSectionEnd : sellerSectionStart + 10;
    
    console.log(`在销售方区域查找纳税人识别号，范围：${sellerSectionStart} 到 ${endIndex}`);
    
    for (let i = sellerSectionStart; i < Math.min(endIndex, lines.length); i++) {
      const line = lines[i];
      console.log(`检查销售方区域第${i}行: ${line}`);
      
      // 查找18位统一社会信用代码（字母+数字组合）
      const creditCodeMatch = line.match(/\b([0-9]{17}[0-9A-Z])\b/);
      if (creditCodeMatch) {
        const taxId = creditCodeMatch[1];
        console.log(`在销售方区域找到18位统一社会信用代码: ${taxId}`);
        return taxId;
      }
      
      // 查找15-18位纳税人识别号
      const taxIdMatch = line.match(/\b([A-Z0-9]{15,18})\b/);
      if (taxIdMatch) {
        const taxId = taxIdMatch[1];
        // 排除发票号码（过长的纯数字）
        if (taxId.length <= 18 && !taxId.match(/^\d{20,}$/)) {
          console.log(`在销售方区域找到纳税人识别号: ${taxId}`);
          return taxId;
        }
      }
    }
  }
  
  // 方案2：收集所有纳税人识别号，选择第二个（销售方）
  console.log('方案2：收集所有纳税人识别号，选择销售方的...');
  
  const allTaxIds = [];
  const taxIdPattern = /\b([0-9]{17}[0-9A-Z]|[A-Z0-9]{15,18})\b/g;
  let match;
  
  while ((match = taxIdPattern.exec(text)) !== null) {
    const taxId = match[1];
    // 排除发票号码和其他过长数字
    if (taxId.length <= 18 && !taxId.match(/^\d{20,}$/)) {
      allTaxIds.push(taxId);
      console.log(`找到可能的纳税人识别号: ${taxId}`);
    }
  }
  
  // 在发票中，销售方信息通常在购买方信息之后
  // 所以第二个找到的应该是销售方的
  if (allTaxIds.length > 1) {
    console.log(`选择第二个作为销售方纳税人识别号: ${allTaxIds[1]}`);
    return allTaxIds[1];
  }
  
  // 方案3：通过位置推断 - 查找第二个公司名称后的纳税人识别号
  console.log('方案3：查找第二个公司名称后的纳税人识别号...');
  
  let companyCount = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 查找任意公司名称（不使用特定字样）
    if (line.includes('公司') && line.length > 8 && line.length < 50 && 
        !line.includes('名称') && !line.includes('纳税人') && !line.includes('识别号')) {
      companyCount++;
      console.log(`找到第${companyCount}个公司名称: ${line} at index ${i}`);
      
      // 如果是第二个公司名称（销售方），查找其后的纳税人识别号
      if (companyCount === 2) {
        for (let j = i; j < Math.min(i + 3, lines.length); j++) {
          const nextLine = lines[j];
          
          const taxIdMatch = nextLine.match(/\b([0-9]{17}[0-9A-Z]|[A-Z0-9]{15,18})\b/);
          if (taxIdMatch) {
            const taxId = taxIdMatch[1];
            if (taxId.length <= 18 && !taxId.match(/^\d{20,}$/)) {
              console.log(`在第二个公司名称后找到销售方纳税人识别号: ${taxId}`);
              return taxId;
    }
  }
        }
        break;
      }
    }
  }
  
  console.log('未找到销售方纳税人识别号');
  return '';
}

// 改进的货物或应税劳务、服务名称提取
function extractGoodsServices(lines: string[], text: string): string {
  console.log('开始提取货物或应税劳务、服务名称...');
  
  // 方案1：精确定位表格数据行
  let tableStartIndex = -1;
  let tableEndIndex = -1;
  
  // 找到表格区域
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 表格标题行
    if (line.includes('项目名称') && (line.includes('规格型号') || line.includes('单位') || line.includes('数量'))) {
      tableStartIndex = i;
      console.log(`找到表格标题行: ${line} at index ${i}`);
    }
    
    // 表格结束标识
    if ((line.includes('合计') || line.includes('价税合计')) && tableStartIndex !== -1) {
      tableEndIndex = i;
      console.log(`找到表格结束: ${line} at index ${i}`);
      break;
    }
  }
  
  // 在表格区域内查找具体的数据行
  if (tableStartIndex !== -1) {
    const endIndex = tableEndIndex !== -1 ? tableEndIndex : tableStartIndex + 8;
    
    console.log(`在表格区域查找服务名称，范围：${tableStartIndex} 到 ${endIndex}`);
    
    for (let i = tableStartIndex + 1; i < Math.min(endIndex, lines.length); i++) {
      const line = lines[i].trim();
      console.log(`检查表格数据行第${i}行: ${line}`);
      
      // 跳过空行
      if (!line) continue;
      
      // 跳过纯数字行和金额行
      if (line.match(/^[\d\s.,￥¥%]+$/) || line.match(/^¥\d+/)) {
        continue;
      }
      
      // 查找包含服务名称的行
      // 这行可能包含多种格式：*住宿服务*住宿服务、住宿服务、6%房晚1698.11等
      if (line.match(/[\u4e00-\u9fa5]+/) && line.length > 2) {
        console.log(`找到可能包含服务名称的行: ${line}`);
        
        // 方法1：提取星号中的内容
        const starMatch = line.match(/\*([^*]+)\*/);
        if (starMatch) {
          const serviceName = starMatch[1].trim();
          if (serviceName.length > 1 && serviceName.match(/[\u4e00-\u9fa5]+/)) {
            console.log(`从星号格式提取服务名称: ${serviceName}`);
            return serviceName;
          }
        }
        
        // 方法2：提取重复的服务名称（如"住宿服务住宿服务"）
        const chineseText = line.replace(/[^\u4e00-\u9fa5]/g, '');
        if (chineseText.length >= 4) {
          // 检查是否是重复的服务名称
          for (let len = 2; len <= chineseText.length / 2; len++) {
            const pattern = chineseText.substring(0, len);
            if (chineseText === pattern.repeat(chineseText.length / len) && 
                chineseText.length % len === 0) {
              console.log(`找到重复的服务名称: ${pattern}`);
              return pattern;
            }
          }
          
          // 如果包含"服务"关键词
          if (chineseText.includes('服务') && chineseText.length <= 20) {
            console.log(`找到包含服务的名称: ${chineseText}`);
            return chineseText;
          }
        }
        
        // 方法3：查找常见服务类型
        const commonServices = [
          '住宿服务', '技术服务', '咨询服务', '物流辅助服务', '收派服务费',
          '现代服务', '增值税咨询服务费', '通信服务费', '会议服务', '餐饮服务',
          '交通运输服务', '建筑服务', '销售服务', '培训服务', '维修服务',
          '信息技术服务', '研发和技术服务', '文化创意服务', '租赁服务'
        ];
        
        for (const service of commonServices) {
          if (line.includes(service)) {
            console.log(`在表格数据行找到匹配的服务名称: ${service}`);
            return service;
    }
  }
  
        // 方法4：从复合行中提取服务名称
        // 处理类似"6%房晚1698.11"这样包含服务信息的行
        const servicePattern = line.match(/([\u4e00-\u9fa5]{2,10})/);
        if (servicePattern) {
          const possibleService = servicePattern[1];
          if (possibleService.includes('服务') || possibleService.includes('费') || 
              possibleService.length >= 4) {
            console.log(`从复合行提取服务名称: ${possibleService}`);
            return possibleService;
          }
        }
      }
    }
  }
  
  // 方案2：全文查找星号格式的内容，但返回清洁版本
  const starPattern = /\*([^*]+)\*/g;
  const starMatches = [...text.matchAll(starPattern)];
  if (starMatches.length > 0) {
    for (const match of starMatches) {
      const content = match[1].trim();
      if (content.length > 1 && content.match(/[\u4e00-\u9fa5]+/) && 
          !content.includes('¥') && !content.match(/^\d+/)) {
        console.log(`从全文星号格式提取服务名称: ${content}`);
        return content;
      }
    }
  }
  
  // 方案3：全文搜索常见服务名称
  const allCommonServices = [
    '住宿服务', '技术服务', '咨询服务', '物流辅助服务', '收派服务费',
    '现代服务', '增值税咨询服务费', '通信服务费', '会议服务', '餐饮服务',
    '交通运输服务', '建筑服务', '销售服务', '培训服务', '维修服务',
    '信息技术服务', '研发和技术服务', '文化创意服务', '物流辅助服务',
    '租赁服务', '商务辅助服务', '鉴证咨询服务'
  ];
  
  for (const service of allCommonServices) {
    if (text.includes(service)) {
      console.log(`全文搜索找到服务名称: ${service}`);
      return service;
    }
  }
  
  // 方案4：查找包含"服务"等关键词的中文内容
  const lines_with_service = lines.filter(line => 
    line.includes('服务') && line.match(/[\u4e00-\u9fa5]+/) && 
    line.length > 2 && line.length < 100
  );
  
  for (const line of lines_with_service) {
    const chineseMatches = line.match(/[\u4e00-\u9fa5]+服务/g);
    if (chineseMatches) {
      for (const match of chineseMatches) {
        if (match.length >= 4 && match.length <= 20) {
          console.log(`通过服务关键词找到: ${match}`);
          return match;
        }
      }
    }
  }
  
  console.log('未找到货物或应税劳务、服务名称');
  return '';
}

// 简化并优化的税率提取函数
function extractTaxRate(lines: string[], text: string): string {
  console.log('开始提取税率...');
  console.log('所有文本行:', lines);
  
  // 如果有*标记，表示免税
  if (text.includes('*') && !text.includes('%')) {
    return '*';
  }
  
  // 方案1：直接查找所有百分比，然后过滤
  const allPercentages = text.match(/\d+(?:\.\d+)?%/g);
  if (allPercentages) {
    console.log(`找到的所有百分比: ${allPercentages.join(', ')}`);
    
    // 过滤出合理的税率（0-30%）
    const validTaxRates = allPercentages.filter(rate => {
      const num = parseFloat(rate.replace('%', ''));
      return num >= 0 && num <= 30;
    });
    
    console.log(`有效的税率: ${validTaxRates.join(', ')}`);
    
    if (validTaxRates.length > 0) {
      // 优先选择常见税率
      const commonRates = ['6%', '13%', '9%', '3%', '1%', '0%'];
      for (const commonRate of commonRates) {
        if (validTaxRates.includes(commonRate)) {
          console.log(`选择常见税率: ${commonRate}`);
          return commonRate;
        }
      }
      
      // 如果没有常见税率，选择第一个
      console.log(`选择第一个有效税率: ${validTaxRates[0]}`);
      return validTaxRates[0];
    }
  }
  
  // 方案2：逐行查找包含税率的行
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    console.log(`检查第${i}行: "${line}"`);
    
    // 查找包含税率/征收率的表头行后的数据
    if (line.includes('税率') || line.includes('征收率')) {
      console.log(`找到税率相关行: ${line}`);
      
      // 检查当前行和后续几行
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        const checkLine = lines[j];
        console.log(`检查第${j}行寻找税率数据: "${checkLine}"`);
        
        if (checkLine.includes('%')) {
          const percentMatch = checkLine.match(/(\d+(?:\.\d+)?)%/);
          if (percentMatch) {
            const rate = percentMatch[0];
            const rateNum = parseFloat(rate.replace('%', ''));
            if (rateNum >= 0 && rateNum <= 30) {
              console.log(`从税率相关行提取: ${rate}`);
              return rate;
            }
          }
        }
      }
    }
    
    // 查找包含服务名称和百分比的数据行
    if ((line.includes('服务') || line.includes('技术')) && line.includes('%')) {
      console.log(`找到服务相关的数据行: ${line}`);
      
      const percentMatch = line.match(/(\d+(?:\.\d+)?)%/);
      if (percentMatch) {
        const rate = percentMatch[0];
        const rateNum = parseFloat(rate.replace('%', ''));
        if (rateNum >= 0 && rateNum <= 30) {
          console.log(`从服务数据行提取: ${rate}`);
          return rate;
        }
      }
    }
  }
  
  // 方案3：特殊处理，直接查找6%（最常见的服务业税率）
  if (text.includes('6%')) {
    console.log('直接找到6%');
    return '6%';
  }
  
  // 方案4：查找其他常见税率
  const commonRates = ['13%', '9%', '3%', '1%', '0%'];
  for (const rate of commonRates) {
    if (text.includes(rate)) {
      console.log(`直接找到常见税率: ${rate}`);
      return rate;
    }
  }
  
  // 方案5：查找合计行附近的税率
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('合计')) {
      console.log(`找到合计行: ${line}`);
      
      // 检查合计行前后的行
      const searchStart = Math.max(0, i - 2);
      const searchEnd = Math.min(lines.length, i + 2);
      
      for (let j = searchStart; j < searchEnd; j++) {
        const searchLine = lines[j];
        console.log(`检查合计行附近第${j}行: "${searchLine}"`);
        
        if (searchLine.includes('%')) {
          const percentMatch = searchLine.match(/(\d+(?:\.\d+)?)%/);
          if (percentMatch) {
            const rate = percentMatch[0];
            const rateNum = parseFloat(rate.replace('%', ''));
            if (rateNum >= 0 && rateNum <= 30) {
              console.log(`从合计行附近提取: ${rate}`);
              return rate;
            }
          }
        }
      }
      break;
    }
  }
  
  console.log('未找到税率');
  return '';
}

// 改进的金额提取（不含税金额）
function extractAmount(lines: string[], text: string): string {
  console.log('开始提取金额...');
  
  // 方案1：在表格数据行中查找金额
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 查找包含完整表格数据的行
    // 格式类似：1 56226.4150943396 56226.42 6% 3373.58
    if (line.match(/[\d.]+\s+[\d.]+\s+\d+%\s+[\d.]+/) ||
        line.match(/\d+\s+[\d.]+\s+[\d.]+\s+\d+%/)) {
      console.log(`找到表格数据行: ${line}`);
      
      // 提取所有数字
      const numbers = line.match(/(\d+(?:\.\d+)?)/g);
      if (numbers && numbers.length >= 3) {
        // 在发票表格中，通常格式是：数量 单价 金额 税率 税额
        // 所以金额通常是第三个较大的数字
        const validNumbers = numbers
          .map(n => parseFloat(n))
          .filter(n => n > 0 && n < 1000000);
        
        if (validNumbers.length >= 3) {
          // 找到最可能是金额的数字（通常是较大的且不是1或小数的）
          const possibleAmounts = validNumbers.filter(n => n > 10);
          if (possibleAmounts.length >= 1) {
            // 选择第一个较大的数字作为金额
            const amount = possibleAmounts[0];
            console.log(`从表格数据行提取金额: ${amount}`);
            return amount.toString();
          }
        }
      }
    }
  }
  
  // 方案2：查找"合计"行上方的金额行
  let totalLineIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('合计')) {
      totalLineIndex = i;
      break;
    }
  }
  
  if (totalLineIndex > 0) {
    // 在合计行上方查找金额
    for (let i = totalLineIndex - 1; i >= Math.max(0, totalLineIndex - 5); i--) {
      const line = lines[i];
      const numbers = line.match(/(\d+(?:\.\d+)?)/g);
      if (numbers) {
        const validNumbers = numbers
          .map(n => parseFloat(n))
          .filter(n => n > 100 && n < 1000000);
        
        if (validNumbers.length > 0) {
          const amount = validNumbers[0];
          console.log(`从合计行上方找到金额: ${amount}`);
          return amount.toString();
        }
      }
    }
  }
  
  // 方案3：查找¥符号后的金额，但排除价税合计
  const amountMatches = text.match(/¥\s*(\d+(?:\.\d+)?)/g);
  if (amountMatches && amountMatches.length > 1) {
    const amounts = amountMatches.map(match => {
      const num = match.replace(/¥\s*/, '');
      return parseFloat(num);
    }).filter(a => a > 0);
    
    if (amounts.length >= 2) {
      // 通常第一个¥金额是不含税金额，最后一个是价税合计
      const amount = amounts[0];
      console.log(`从¥符号找到金额: ${amount}`);
      return amount.toString();
    }
  }
  
  console.log('未找到金额');
  return '';
}

// 改进的税额提取
function extractTaxAmount(lines: string[], text: string): string {
  console.log('开始提取税额...');
  
  // 如果有*标记，表示免税
  if (text.includes('*') && !text.includes('%')) {
    return '*';
  }
  
  // 方案1：从合计行提取税额
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 查找合计行（不是价税合计）
    if (line.includes('合计') && !line.includes('价税合计')) {
      console.log(`找到合计行: ${line}`);
      
      // 合计行格式通常是：合计 ¥金额 ¥税额
      const amountMatches = line.match(/¥\s*(\d+(?:\.\d+)?)/g);
      if (amountMatches && amountMatches.length >= 2) {
        // 第二个¥金额通常是税额
        const taxAmountStr = amountMatches[1].replace(/¥\s*/, '');
        const taxAmount = parseFloat(taxAmountStr);
        
        if (taxAmount > 0 && taxAmount < 100000) {
          console.log(`从合计行提取税额: ${taxAmount}`);
          return taxAmount.toString();
        }
      }
      
      // 如果合计行没有¥符号，查找所有数字
      const numbers = line.match(/(\d+(?:\.\d+)?)/g);
      if (numbers && numbers.length >= 2) {
        const validNumbers = numbers
          .map(n => parseFloat(n))
          .filter(n => n > 0 && n < 100000);
        
        if (validNumbers.length >= 2) {
          // 选择较小的数字作为税额
          const sortedNumbers = validNumbers.sort((a, b) => a - b);
          const taxAmount = sortedNumbers[0];
          console.log(`从合计行数字提取税额: ${taxAmount}`);
          return taxAmount.toString();
        }
      }
    }
  }
  
  // 方案2：从表格数据行提取税额（最后一列）
  let tableStartIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('项目名称') && line.includes('税额')) {
      tableStartIndex = i;
      break;
    }
  }
  
  if (tableStartIndex !== -1) {
    for (let i = tableStartIndex + 1; i < Math.min(tableStartIndex + 10, lines.length); i++) {
      const line = lines[i];
      
      if (!line.trim() || line.includes('合计')) {
        continue;
      }
      
      console.log(`检查表格数据行第${i}行: ${line}`);
      
      // 查找包含税率和税额的数据行
      if (line.match(/\d+%/)) {
        // 提取该行最后一个合理的数字作为税额
        const numbers = line.match(/(\d+(?:\.\d+)?)/g);
        if (numbers && numbers.length > 0) {
          // 从右往左查找，排除税率中的数字
          for (let j = numbers.length - 1; j >= 0; j--) {
            const num = parseFloat(numbers[j]);
            
            // 排除明显是税率百分比的数字
            if (num > 0 && num < 50000 && num !== 6 && num !== 13 && num !== 9) {
              // 进一步验证：税额应该小于金额
              const possibleAmounts = numbers.map(n => parseFloat(n)).filter(n => n > num && n < 1000000);
              if (possibleAmounts.length > 0) {
                console.log(`从表格数据行提取税额: ${num}`);
                return num.toString();
              }
            }
          }
        }
      }
    }
  }
  
  // 方案3：通过¥符号识别税额
  const amountMatches = text.match(/¥\s*(\d+(?:\.\d+)?)/g);
  if (amountMatches && amountMatches.length >= 2) {
    const amounts = amountMatches.map(match => {
      const num = match.replace(/¥\s*/, '');
      return parseFloat(num);
    }).filter(a => a > 0);
    
    if (amounts.length >= 2) {
      // 在多个金额中，选择相对较小但不是最小的作为税额
      const sortedAmounts = amounts.sort((a, b) => a - b);
      
      // 如果有明显的大小差异，选择较小的几个中的一个
      for (let i = 0; i < sortedAmounts.length - 1; i++) {
        const amount = sortedAmounts[i];
        const nextAmount = sortedAmounts[i + 1];
        
        // 如果当前金额相对较小且与下一个金额有合理比例关系
        if (amount < 50000 && nextAmount / amount > 5) {
          console.log(`通过¥符号识别税额: ${amount}`);
          return amount.toString();
        }
      }
    }
  }
  
  console.log('未找到税额');
  return '';
}

// 改进的价税合计提取
function extractTotalAmount(lines: string[], text: string): string {
  console.log('开始提取价税合计...');
  
  // 方案1：查找价税合计标识后的金额
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('价税合计')) {
      console.log(`找到价税合计标识行: ${line}`);
      
      // 在当前行或下一行查找金额
      for (let j = i; j <= Math.min(i + 2, lines.length - 1); j++) {
        const checkLine = lines[j];
        const amountMatch = checkLine.match(/¥\s*(\d+(?:\.\d+)?)/);
        if (amountMatch) {
          const totalAmount = parseFloat(amountMatch[1]);
          console.log(`找到价税合计: ${totalAmount}`);
          return totalAmount.toString();
        }
      }
    }
  }
  
  // 方案2：查找所有¥金额，选择最大的作为价税合计
  const amountMatches = text.match(/¥\s*(\d+(?:\.\d+)?)/g);
  if (amountMatches && amountMatches.length > 0) {
    const amounts = amountMatches.map(match => {
      const num = match.replace(/¥\s*/, '');
      return parseFloat(num);
    }).filter(a => a > 0);
    
    if (amounts.length > 0) {
      // 通常最大的金额是价税合计
      const totalAmount = Math.max(...amounts);
      console.log(`从所有¥金额中找到价税合计: ${totalAmount}`);
      return totalAmount.toString();
    }
  }
  
  // 方案3：通过金额和税额计算价税合计
  const amountText = extractAmount(lines, text);
  const taxAmountText = extractTaxAmount(lines, text);
  
  if (amountText && taxAmountText && amountText !== '*' && taxAmountText !== '*') {
    const amount = parseFloat(amountText);
    const taxAmount = parseFloat(taxAmountText);
    if (!isNaN(amount) && !isNaN(taxAmount)) {
      const calculated = amount + taxAmount;
      console.log(`通过计算得到价税合计: ${calculated} (${amount} + ${taxAmount})`);
      return calculated.toString();
    }
  }
  
  console.log('未找到价税合计');
  return '';
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    console.log(`收到 ${files.length} 个发票文件`);
    
    if (!files.length) {
      return NextResponse.json(
        { error: '未上传文件' },
        { status: 400 }
      );
    }
    
    const invoices = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        console.log(`开始处理文件: ${file.name}`);
        const invoiceInfo = await parseInvoicePDF(file);
        
        invoices.push({
          id: `INV-${Date.now()}-${i}`,
          filename: file.name,
          ...invoiceInfo,
          status: '已处理',
          processedAt: new Date().toISOString()
        });
        
        console.log(`文件 ${file.name} 处理完成`);
      } catch (error) {
        console.error(`处理文件 ${file.name} 失败:`, error);
        
        invoices.push({
          id: `INV-${Date.now()}-${i}`,
          filename: file.name,
          invoiceName: '增值税发票',
          invoiceNumber: `${Date.now()}${i}`,
          issueDate: new Date().toISOString().slice(0, 10),
          buyerName: '',
          buyerTaxId: '',
          sellerName: '',
          sellerTaxId: '',
          goodsServices: file.name.replace(/\.[^/.]+$/, ""),
          taxRate: '',
          amount: '',
          taxAmount: '',
          totalAmount: '',
          status: '解析失败',
          processedAt: new Date().toISOString(),
          error: error.message
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `成功处理 ${files.length} 个发票文件`,
      invoices
    });
    
  } catch (error) {
    console.error('处理发票文件时出错:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '处理发票文件时出错' },
      { status: 500 }
    );
  }
} 


