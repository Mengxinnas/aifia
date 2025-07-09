import { NextResponse } from 'next/server';
// 使用pdf2json替代pdf-parse
const pdf2json = require('pdf2json');

interface OrdinaryInvoiceInfo {
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

interface PDFText {
  x: number;
  y: number;
  w: number;
  sw: number;
  text: string;
  font?: string;
  fontSize?: number;
}

/**
 * 普通电子发票专用识别程序
 * 针对普通电子发票的特殊格式和结构进行优化处理
 */
async function parseOrdinaryElectronicInvoice(file: File): Promise<OrdinaryInvoiceInfo> {
  const buffer = await file.arrayBuffer();
  const dataBuffer = Buffer.from(new Uint8Array(buffer));
  
  try {
    // 使用pdf2json解析PDF
    const pdfData = await parsePDFWithJson(dataBuffer);
    const texts = extractTextsFromPDF(pdfData);
    
    console.log(`普通电子发票解析: ${file.name}, 提取到 ${texts.length} 个文本元素`);
    
    // 输出所有文本元素用于调试
    console.log('=== 所有文本元素 ===');
    texts.forEach((text, index) => {
      console.log(`${index}: "${text.text}" (x:${text.x.toFixed(2)}, y:${text.y.toFixed(2)})`);
    });
    console.log('=== 文本元素结束 ===');
    
    // 按Y坐标排序文本，便于按行处理
    const sortedTexts = texts.sort((a, b) => a.y - b.y);
    const textLines = groupTextsByLine(sortedTexts);
    
    console.log('分组后的文本行:', textLines.slice(0, 10));
    
    // 解析普通电子发票信息
    const invoiceInfo: OrdinaryInvoiceInfo = {
      invoiceName: extractOrdinaryInvoiceNameFromJson(texts, textLines),
      invoiceNumber: extractOrdinaryInvoiceNumberFromJson(texts, textLines),
      issueDate: extractOrdinaryIssueDateFromJson(texts, textLines),
      buyerName: extractOrdinaryBuyerNameFromJson(texts, textLines),
      buyerTaxId: extractOrdinaryBuyerTaxIdFromJson(texts, textLines),
      sellerName: extractOrdinarySellerNameFromJson(texts, textLines),
      sellerTaxId: extractOrdinarySellerTaxIdFromJson(texts, textLines),
      goodsServices: extractOrdinaryGoodsServicesFromJson(texts, textLines),
      taxRate: extractOrdinaryTaxRateFromJson(texts, textLines),
      amount: extractOrdinaryAmountFromJson(texts, textLines),
      taxAmount: extractOrdinaryTaxAmountFromJson(texts, textLines),
      totalAmount: extractOrdinaryTotalAmountFromJson(texts, textLines)
    };
    
    console.log('提取的普通电子发票信息:', invoiceInfo);
    return invoiceInfo;
  } catch (error) {
    console.error(`解析普通电子发票PDF失败: ${file.name}`, error);
    throw new Error(`解析普通电子发票PDF失败: ${error.message}`);
  }
}

/**
 * 使用pdf2json解析PDF
 */
function parsePDFWithJson(buffer: Buffer): Promise<any> {
  return new Promise((resolve, reject) => {
    const pdfParser = new pdf2json();
    
    pdfParser.on('pdfParser_dataError', (error: any) => {
      reject(error);
    });
    
    pdfParser.on('pdfParser_dataReady', (data: any) => {
      resolve(data);
    });
    
    pdfParser.parseBuffer(buffer);
  });
}

/**
 * 从PDF数据中提取文本元素
 */
function extractTextsFromPDF(pdfData: any): PDFText[] {
  const texts: PDFText[] = [];
  
  if (pdfData.Pages && pdfData.Pages.length > 0) {
    // 处理第一页（发票通常在第一页）
    const page = pdfData.Pages[0];
    
    if (page.Texts) {
      page.Texts.forEach((textItem: any) => {
        if (textItem.R && textItem.R.length > 0) {
          textItem.R.forEach((run: any) => {
            if (run.T) {
              // 解码URL编码的文本
              const decodedText = decodeURIComponent(run.T);
              texts.push({
                x: textItem.x,
                y: textItem.y,
                w: textItem.w,
                sw: textItem.sw || 0,
                text: decodedText,
                font: run.TS ? run.TS.toString() : undefined,
                fontSize: run.S ? run.S : undefined
              });
            }
          });
        }
      });
    }
  }
  
  return texts;
}

/**
 * 按行分组文本元素
 */
function groupTextsByLine(texts: PDFText[]): string[] {
  const lines: { [key: number]: PDFText[] } = {};
  const tolerance = 0.5; // Y坐标容差
  
  texts.forEach(text => {
    const lineY = Math.round(text.y / tolerance) * tolerance;
    if (!lines[lineY]) {
      lines[lineY] = [];
    }
    lines[lineY].push(text);
  });
  
  // 按Y坐标排序，然后在每行内按X坐标排序
  const sortedLines = Object.keys(lines)
    .map(y => parseFloat(y))
    .sort((a, b) => a - b)
    .map(y => {
      return lines[y]
        .sort((a, b) => a.x - b.x)
        .map(t => t.text)
        .join(' ')
        .trim();
    })
    .filter(line => line.length > 0);
  
  return sortedLines;
}

/**
 * 提取普通电子发票名称（使用位置信息）
 */
function extractOrdinaryInvoiceNameFromJson(texts: PDFText[], lines: string[]): string {
  console.log('开始提取普通电子发票名称...');
  
  // 在PDF顶部区域查找发票标题
  const topTexts = texts.filter(t => t.y < 3); // 顶部3个单位内
  
  const ordinaryInvoiceKeywords = [
    '增值税普通发票', '普通发票', '电子普通发票', 
    '增值税电子普通发票', '普通发票(电子)', '普通发票（电子）'
  ];
  
  // 优先在顶部文本中查找
  for (const text of topTexts) {
    for (const keyword of ordinaryInvoiceKeywords) {
      if (text.text.includes(keyword)) {
        console.log(`在顶部找到发票类型: ${text.text}`);
        return text.text;
      }
    }
  }
  
  // 在所有行中查找
  for (const line of lines) {
    for (const keyword of ordinaryInvoiceKeywords) {
      if (line.includes(keyword)) {
        console.log(`在文本行找到发票类型: ${line}`);
        return line;
      }
    }
  }
  
  return '增值税普通发票';
}

/**
 * 提取普通电子发票号码（修正版 - 精确识别发票号码字段）
 */
function extractOrdinaryInvoiceNumberFromJson(texts: PDFText[], lines: string[]): string {
  console.log('开始提取普通电子发票号码...');
  
  // 方法1：查找完整的"发票号码：数字"格式
  for (const text of texts) {
    // 匹配"发票号码："后直接跟数字的格式
    const directMatch = text.text.match(/发票号码[：:]\s*(\d{6,12})/);
    if (directMatch) {
      console.log(`直接匹配到发票号码: ${directMatch[1]}`);
      return directMatch[1];
    }
  }
  
  // 方法2：查找"发票号码"标识，然后在其附近查找数字
  const invoiceNumberLabels = texts.filter(t => 
    t.text.includes('发票号码') && 
    !t.text.includes('代码') // 排除"发票代码"
  );
  
  if (invoiceNumberLabels.length > 0) {
    const label = invoiceNumberLabels[0];
    console.log(`找到发票号码标识: "${label.text}" 位置: x=${label.x}, y=${label.y}`);
    
    // 在标识右侧查找6-12位数字（发票号码通常是8位）
    const rightTexts = texts.filter(t => 
      t.x > label.x && 
      Math.abs(t.y - label.y) < 0.8 && // 同一行
      /^\d{6,12}$/.test(t.text.trim()) // 6-12位纯数字
    );
    
    // 按距离排序，选择最近的
    rightTexts.sort((a, b) => a.x - b.x);
    
    if (rightTexts.length > 0) {
      console.log(`在发票号码标识右侧找到: ${rightTexts[0].text}`);
      return rightTexts[0].text.trim();
    }
    
    // 如果右侧没找到，尝试查找下一行（有些发票格式是换行的）
    const belowTexts = texts.filter(t => 
      t.y > label.y && 
      t.y <= label.y + 1.2 && 
      Math.abs(t.x - label.x) < 3 && // 在标识下方附近
      /^\d{6,12}$/.test(t.text.trim())
    );
    
    if (belowTexts.length > 0) {
      console.log(`在发票号码标识下方找到: ${belowTexts[0].text}`);
      return belowTexts[0].text.trim();
    }
    
    // 扩大搜索范围，在标识周围更大区域查找
    const nearbyTexts = texts.filter(t => 
      t.x >= label.x - 2 && 
      t.x <= label.x + 8 && 
      t.y >= label.y - 0.5 && 
      t.y <= label.y + 2 &&
      /^\d{6,12}$/.test(t.text.trim()) &&
      t.text.trim() !== label.text.trim() // 排除标识本身
    );
    
    if (nearbyTexts.length > 0) {
      // 按距离排序
      nearbyTexts.sort((a, b) => {
        const distA = Math.sqrt(Math.pow(a.x - label.x, 2) + Math.pow(a.y - label.y, 2));
        const distB = Math.sqrt(Math.pow(b.x - label.x, 2) + Math.pow(b.y - label.y, 2));
        return distA - distB;
      });
      
      console.log(`在发票号码标识附近找到: ${nearbyTexts[0].text}`);
      return nearbyTexts[0].text.trim();
    }
  }
  
  // 方法3：在右上角区域查找典型的发票号码格式
  const rightTopTexts = texts.filter(t => t.x > 10 && t.y < 8);
  
  // 查找8位数字（最常见的发票号码格式）
  for (const text of rightTopTexts) {
    if (/^\d{8}$/.test(text.text.trim())) {
      // 验证不是日期相关的数字
      const num = text.text.trim();
      if (!num.startsWith('20') && !num.startsWith('19')) {
        console.log(`在右上角找到8位发票号码: ${num}`);
        return num;
      }
    }
  }
  
  // 查找其他长度的数字
  for (const text of rightTopTexts) {
    if (/^\d{6,12}$/.test(text.text.trim())) {
      const num = text.text.trim();
      // 排除明显的日期、代码等
      if (!num.startsWith('20') && 
          !num.startsWith('19') && 
          !num.startsWith('044') && // 排除发票代码
          !num.startsWith('172')) {
        console.log(`在右上角找到发票号码: ${num}`);
        return num;
      }
    }
  }
  
  // 方法4：在所有文本中查找，但要严格过滤
  const allNumberTexts = texts.filter(t => /^\d{6,12}$/.test(t.text.trim()));
  
  for (const text of allNumberTexts) {
    const num = text.text.trim();
    // 更严格的过滤条件
    if (num.length === 8 && // 8位是最常见的发票号码长度
        !num.startsWith('20') && 
        !num.startsWith('19') &&
        !num.startsWith('044') &&
        !num.startsWith('911') && // 排除税号
        !num.startsWith('172')) {
      console.log(`全局搜索找到8位发票号码: ${num}`);
      return num;
    }
  }
  
  console.log('未找到发票号码');
  return '';
}

/**
 * 辅助函数：验证发票号码的合理性
 */
function isValidInvoiceNumber(number: string): boolean {
  // 发票号码通常是6-12位数字
  if (!/^\d{6,12}$/.test(number)) {
    return false;
  }
  
  // 排除明显的日期格式
  if (number.startsWith('20') || number.startsWith('19')) {
    return false;
  }
  
  // 排除发票代码（通常以0开头且较长）
  if (number.startsWith('044') || number.startsWith('0')) {
    return false;
  }
  
  // 排除税号格式
  if (number.startsWith('911') || number.startsWith('914')) {
    return false;
  }
  
  // 排除校验码格式（通常很长）
  if (number.length > 10) {
    return false;
  }
  
  return true;
}

/**
 * 提取开票日期（修正版 - 处理空格分隔的日期格式）
 */
function extractOrdinaryIssueDateFromJson(texts: PDFText[], lines: string[]): string {
  console.log('开始提取普通电子发票开票日期...');
  console.log('所有文本行:', lines);
  
  // 方法1：在文本行中查找包含开票日期的行
  for (const line of lines) {
    if (line.includes('开票日期')) {
      console.log(`找到包含开票日期的行: "${line}"`);
      
      // 处理多种日期格式
      const datePatterns = [
        // 标准格式：开票日期: 2023年03月07日
        /开票日期[：:\s]*(\d{4})年(\d{1,2})月(\d{1,2})日/,
        // 空格分隔格式：开票日期: 2023  03  07 年 月 日
        /开票日期[：:\s]*(\d{4})\s+(\d{1,2})\s+(\d{1,2})\s*年\s*月\s*日/,
        // 简化空格格式：2023  03  07
        /(\d{4})\s+(\d{1,2})\s+(\d{1,2})/,
        // 连续格式：20230307
        /(\d{4})(\d{2})(\d{2})/
      ];
      
      for (const pattern of datePatterns) {
        const match = line.match(pattern);
        if (match) {
          const year = match[1];
          const month = match[2].padStart(2, '0');
          const day = match[3].padStart(2, '0');
          const date = `${year}-${month}-${day}`;
          
          // 验证日期合理性
          const dateObj = new Date(date);
          if (dateObj.getFullYear() >= 2020 && dateObj.getFullYear() <= new Date().getFullYear() + 1) {
            console.log(`从文本行提取到开票日期: ${date} (原文: ${line})`);
            return date;
          }
        }
      }
    }
  }
  
  // 方法2：在单个文本元素中查找
  for (const text of texts) {
    if (text.text.includes('开票日期')) {
      console.log(`找到包含开票日期的文本: "${text.text}"`);
      
      // 处理完整格式在同一个文本元素中的情况
      const fullDateMatch = text.text.match(/开票日期[：:\s]*(\d{4})\s*年?\s*(\d{1,2})\s*月?\s*(\d{1,2})\s*日?/);
      if (fullDateMatch) {
        const year = fullDateMatch[1];
        const month = fullDateMatch[2].padStart(2, '0');
        const day = fullDateMatch[3].padStart(2, '0');
        const date = `${year}-${month}-${day}`;
        console.log(`从单个文本元素提取到开票日期: ${date}`);
        return date;
      }
    }
  }
  
  // 方法3：查找包含"开票日期"的文本，然后在其附近查找日期数字
  const dateLabels = texts.filter(t => t.text.includes('开票日期'));
  
  if (dateLabels.length > 0) {
    const label = dateLabels[0];
    console.log(`找到开票日期标识: "${label.text}" 位置: x=${label.x}, y=${label.y}`);
    
    // 在标识附近查找年份（2023）
    const nearbyTexts = texts.filter(t => 
      Math.abs(t.x - label.x) < 15 && 
      Math.abs(t.y - label.y) < 2
    );
    
    console.log('开票日期附近的文本:', nearbyTexts.map(t => `"${t.text}" (x:${t.x}, y:${t.y})`));
    
    // 查找年份
    let year = null, month = null, day = null;
    
    for (const text of nearbyTexts) {
      // 查找2020-2030年份
      const yearMatch = text.text.match(/(202\d)/);
      if (yearMatch && !year) {
        year = yearMatch[1];
        console.log(`找到年份: ${year}`);
      }
      
      // 查找月份（01-12）
      const monthMatch = text.text.match(/\b(0?[1-9]|1[0-2])\b/);
      if (monthMatch && !month && yearMatch) {
        month = monthMatch[1].padStart(2, '0');
        console.log(`找到月份: ${month}`);
      }
      
      // 查找日期（01-31）
      const dayMatch = text.text.match(/\b(0?[1-9]|[12]\d|3[01])\b/);
      if (dayMatch && !day && yearMatch && monthMatch) {
        day = dayMatch[1].padStart(2, '0');
        console.log(`找到日期: ${day}`);
      }
    }
    
    if (year && month && day) {
      const date = `${year}-${month}-${day}`;
      console.log(`通过附近文本组合得到开票日期: ${date}`);
      return date;
    }
  }
  
  // 方法4：在所有文本中查找2023年的日期格式
  for (const text of texts) {
    // 查找空格分隔的日期格式
    const spaceMatch = text.text.match(/(202\d)\s+(\d{1,2})\s+(\d{1,2})/);
    if (spaceMatch) {
      const year = spaceMatch[1];
      const month = spaceMatch[2].padStart(2, '0');
      const day = spaceMatch[3].padStart(2, '0');
      const date = `${year}-${month}-${day}`;
      console.log(`找到空格分隔的日期: ${date} (原文: ${text.text})`);
      return date;
    }
    
    // 查找标准年月日格式
    const standardMatch = text.text.match(/(202\d)年(\d{1,2})月(\d{1,2})日/);
    if (standardMatch) {
      const year = standardMatch[1];
      const month = standardMatch[2].padStart(2, '0');
      const day = standardMatch[3].padStart(2, '0');
      const date = `${year}-${month}-${day}`;
      console.log(`找到标准年月日格式: ${date}`);
      return date;
    }
  }
  
  // 方法5：从文本行中提取纯数字日期
  for (const line of lines) {
    // 查找 2023  03  07 这种格式
    const spaceNumberMatch = line.match(/(202\d)\s+(\d{1,2})\s+(\d{1,2})/);
    if (spaceNumberMatch) {
      const year = spaceNumberMatch[1];
      const month = spaceNumberMatch[2].padStart(2, '0');
      const day = spaceNumberMatch[3].padStart(2, '0');
      const date = `${year}-${month}-${day}`;
      console.log(`从文本行提取空格数字日期: ${date} (原文: ${line})`);
      return date;
    }
  }
  
  console.log('未能提取到开票日期，使用当前日期');
  return new Date().toISOString().slice(0, 10);
}

/**
 * 提取购买方名称（使用位置信息）
 */
function extractOrdinaryBuyerNameFromJson(texts: PDFText[], lines: string[]): string {
  console.log('开始提取普通电子发票购买方名称...');
  
  // 查找"购买方"标识的位置
  const buyerLabels = texts.filter(t => 
    t.text.includes('购买方') || t.text.includes('收票方')
  );
  
  if (buyerLabels.length > 0) {
    const buyerLabel = buyerLabels[0];
    
    // 在购买方标识下方查找公司名称
    const belowTexts = texts.filter(t => 
      t.y > buyerLabel.y && 
      t.y <= buyerLabel.y + 5 &&
      (t.text.includes('公司') || t.text.includes('企业') || t.text.includes('中心'))
    );
    
    for (const text of belowTexts) {
      if (text.text.length > 3 && text.text.length < 50 &&
          !text.text.includes('销售方') && 
          !text.text.includes('纳税人识别号')) {
        console.log(`在购买方区域找到: ${text.text}`);
        return text.text;
      }
    }
  }
  
  // 查找第一个公司名称（通常是购买方）
  const companyTexts = texts.filter(t => 
    (t.text.includes('公司') || t.text.includes('企业')) &&
    t.text.length > 3 && t.text.length < 50
  );
  
  if (companyTexts.length > 0) {
    console.log(`备用方案找到购买方: ${companyTexts[0].text}`);
    return companyTexts[0].text;
  }
  
  return '';
}

/**
 * 提取购买方纳税人识别号（使用位置信息）
 */
function extractOrdinaryBuyerTaxIdFromJson(texts: PDFText[], lines: string[]): string {
  console.log('开始提取普通电子发票购买方纳税人识别号...');
  
  // 查找"购买方"区域的纳税人识别号
  const buyerLabels = texts.filter(t => t.text.includes('购买方'));
  
  if (buyerLabels.length > 0) {
    const buyerLabel = buyerLabels[0];
    
    const belowTexts = texts.filter(t => 
      t.y > buyerLabel.y && t.y <= buyerLabel.y + 5
    );
    
    for (const text of belowTexts) {
      const taxIdMatch = text.text.match(/([A-Z0-9]{15,18})/);
      if (taxIdMatch && taxIdMatch[1].length <= 18) {
        console.log(`在购买方区域找到纳税人识别号: ${taxIdMatch[1]}`);
        return taxIdMatch[1];
      }
    }
  }
  
  // 全局查找第一个纳税人识别号
  for (const text of texts) {
    const taxIdMatch = text.text.match(/([A-Z0-9]{15,18})/);
    if (taxIdMatch && taxIdMatch[1].length <= 18) {
      console.log(`全局查找找到纳税人识别号: ${taxIdMatch[1]}`);
      return taxIdMatch[1];
    }
  }
  
  return '';
}

/**
 * 提取销售方名称（使用位置信息）
 */
function extractOrdinarySellerNameFromJson(texts: PDFText[], lines: string[]): string {
  console.log('开始提取普通电子发票销售方名称...');
  
  // 查找"销售方"标识的位置
  const sellerLabels = texts.filter(t => 
    t.text.includes('销售方') || t.text.includes('开票方')
  );
  
  if (sellerLabels.length > 0) {
    const sellerLabel = sellerLabels[0];
    
    const belowTexts = texts.filter(t => 
      t.y > sellerLabel.y && 
      t.y <= sellerLabel.y + 5 &&
      (t.text.includes('公司') || t.text.includes('企业'))
    );
    
    for (const text of belowTexts) {
      if (text.text.length > 3 && text.text.length < 50) {
        console.log(`在销售方区域找到: ${text.text}`);
        return text.text;
      }
    }
  }
  
  // 查找第二个公司名称（通常是销售方）
  const companyTexts = texts.filter(t => 
    (t.text.includes('公司') || t.text.includes('企业')) &&
    t.text.length > 3 && t.text.length < 50
  );
  
  if (companyTexts.length > 1) {
    console.log(`备用方案找到销售方: ${companyTexts[1].text}`);
    return companyTexts[1].text;
  }
  
  return '';
}

/**
 * 提取销售方纳税人识别号（使用位置信息）
 */
function extractOrdinarySellerTaxIdFromJson(texts: PDFText[], lines: string[]): string {
  console.log('开始提取普通电子发票销售方纳税人识别号...');
  
  // 查找所有纳税人识别号，选择第二个（销售方）
  const taxIds = [];
  
  for (const text of texts) {
    const taxIdMatch = text.text.match(/([A-Z0-9]{15,18})/);
    if (taxIdMatch && taxIdMatch[1].length <= 18) {
      taxIds.push(taxIdMatch[1]);
    }
  }
  
  if (taxIds.length > 1) {
    console.log(`找到销售方纳税人识别号: ${taxIds[1]}`);
    return taxIds[1];
  }
  
  return '';
}

/**
 * 提取普通电子发票货物或服务名称（重新修正版）
 */
function extractOrdinaryGoodsServicesFromJson(texts: PDFText[], lines: string[]): string {
  console.log('开始提取普通电子发票货物或服务名称...');
  console.log('所有文本元素:', texts.map(t => `"${t.text}" (x:${t.x}, y:${t.y})`));
  
  // 方法1：直接查找包含"*物流辅助服务*"或类似格式的文本
  for (const text of texts) {
    const content = text.text.trim();
    
    // 查找包含*号且包含服务关键词的文本
    if (content.includes('*') && 
        (content.includes('物流') || 
         content.includes('辅助') || 
         content.includes('收派') ||
         content.includes('服务'))) {
      console.log(`直接匹配找到服务名称: "${content}"`);
      return content;
    }
  }
  
  // 方法2：查找表格数据区域
  // 先找到表格标题行
  const tableHeaderTexts = texts.filter(t => 
    t.text.includes('货物或应税劳务') || 
    t.text.includes('服务名称') ||
    (t.text.includes('货物') && t.text.includes('服务'))
  );
  
  let tableDataY = null;
  if (tableHeaderTexts.length > 0) {
    tableDataY = tableHeaderTexts[0].y;
    console.log(`找到表格标题，Y坐标: ${tableDataY}`);
  }
  
  // 如果找到了表格标题，在其下方查找数据
  if (tableDataY !== null) {
    const dataRowTexts = texts.filter(t => 
      t.y > tableDataY && 
      t.y <= tableDataY + 3 && // 表格数据行范围
      t.x < 6 && // 第一列的X坐标范围
      t.text.trim().length > 0 &&
      !t.text.includes('合计') &&
      !t.text.includes('价税')
    );
    
    console.log('表格数据区域的文本:', dataRowTexts.map(t => `"${t.text}" (x:${t.x}, y:${t.y})`));
    
    // 查找最长的、包含服务相关内容的文本
    let bestMatch = null;
    let maxScore = 0;
    
    for (const text of dataRowTexts) {
      const content = text.text.trim();
      let score = 0;
      
      // 评分规则
      if (content.includes('*')) score += 3;
      if (content.includes('物流')) score += 2;
      if (content.includes('辅助')) score += 2;
      if (content.includes('收派')) score += 2;
      if (content.includes('服务')) score += 1;
      if (content.includes('费')) score += 1;
      if (content.length > 5) score += 1;
      
      console.log(`文本"${content}"评分: ${score}`);
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = content;
      }
    }
    
    if (bestMatch) {
      console.log(`通过评分找到最佳匹配: "${bestMatch}"`);
      return bestMatch;
    }
    
    // 如果评分没找到，尝试拼接同一行的多个文本片段
    const rowGroups = {};
    dataRowTexts.forEach(t => {
      const rowKey = Math.round(t.y * 10); // 按Y坐标分组
      if (!rowGroups[rowKey]) rowGroups[rowKey] = [];
      rowGroups[rowKey].push(t);
    });
    
    for (const rowKey in rowGroups) {
      const rowTexts = rowGroups[rowKey].sort((a, b) => a.x - b.x);
      const combinedText = rowTexts.map(t => t.text.trim()).join('');
      
      if (combinedText.length > 3 && 
          (combinedText.includes('服务') || combinedText.includes('物流'))) {
        console.log(`通过行拼接找到服务名称: "${combinedText}"`);
        return combinedText;
      }
    }
  }
  
  // 方法3：在特定Y坐标范围内查找（基于发票布局）
  const serviceTexts = texts.filter(t => 
    t.y > 4 && t.y < 12 && // 表格区域的Y坐标范围
    t.x < 8 && // 第一列区域
    t.text.trim().length > 2
  );
  
  console.log('特定区域的文本:', serviceTexts.map(t => `"${t.text}" (x:${t.x}, y:${t.y})`));
  
  for (const text of serviceTexts) {
    const content = text.text.trim();
    
    // 检查是否包含服务相关内容
    if (content.includes('物流') || 
        content.includes('辅助') || 
        content.includes('收派') ||
        content.includes('*')) {
      console.log(`在特定区域找到服务名称: "${content}"`);
      return content;
    }
  }
  
  // 方法4：查找所有包含"服务"的文本，排除标题
  const allServiceTexts = texts.filter(t => 
    t.text.includes('服务') && 
    !t.text.includes('货物或应税劳务') && 
    !t.text.includes('服务名称') &&
    t.text.trim().length > 2
  );
  
  if (allServiceTexts.length > 0) {
    // 选择最具描述性的服务名称
    allServiceTexts.sort((a, b) => b.text.length - a.text.length);
    console.log(`通过服务关键词找到: "${allServiceTexts[0].text}"`);
    return allServiceTexts[0].text.trim();
  }
  
  // 方法5：在所有文本中查找特定的服务类型
  const specificServices = [
    '*物流辅助服务*收派服务费',
    '物流辅助服务收派服务费',
    '*物流辅助服务*',
    '收派服务费',
    '物流辅助服务',
    '物流服务',
    '收派服务'
  ];
  
  for (const service of specificServices) {
    for (const text of texts) {
      if (text.text.includes(service) || 
          text.text.replace(/\s+/g, '').includes(service.replace(/\s+/g, ''))) {
        console.log(`通过特定服务匹配找到: "${text.text}"`);
        return text.text.trim();
      }
    }
  }
  
  // 方法6：查找任何包含中文且位置合理的文本作为备选
  const chineseTexts = texts.filter(t => 
    /[\u4e00-\u9fa5]/.test(t.text) &&
    t.text.length > 2 &&
    t.y > 4 && t.y < 12 &&
    !t.text.includes('名称') &&
    !t.text.includes('纳税人') &&
    !t.text.includes('地址') &&
    !t.text.includes('开户行')
  );
  
  if (chineseTexts.length > 0) {
    // 选择最可能的中文内容
    for (const text of chineseTexts) {
      if (text.text.length > 3) {
        console.log(`备选方案找到中文内容: "${text.text}"`);
        return text.text.trim();
      }
    }
  }
  
  console.log('未找到货物或服务名称，使用默认值');
  return '服务费';
}

/**
 * 辅助函数：清理和标准化服务名称
 */
function cleanServiceName(serviceName: string): string {
  if (!serviceName) return '服务费';
  
  let cleaned = serviceName.trim();
  
  // 处理*号包围的格式，提取主要服务名称
  const starMatch = cleaned.match(/\*([^*]+)\*/);
  if (starMatch) {
    // 如果有*号包围的内容，提取出来
    const mainService = starMatch[1];
    // 保留*号外的其他描述性内容
    const remaining = cleaned.replace(/\*[^*]+\*/, '').trim();
    
    if (remaining.length > 0) {
      cleaned = `${mainService}${remaining}`;
    } else {
      cleaned = mainService;
    }
  }
  
  // 移除多余的空格和特殊字符
  cleaned = cleaned.replace(/\s+/g, '');
  
  return cleaned || '服务费';
}

/**
 * 提取税率（修正版 - 确保能识别13%）
 */
function extractOrdinaryTaxRateFromJson(texts: PDFText[], lines: string[]): string {
  console.log('开始提取普通电子发票税率...');
  
  // 检查免税标识
  const hasStarOnly = texts.some(t => t.text.trim() === '*');
  const hasPercent = texts.some(t => t.text.includes('%'));
  
  if (hasStarOnly && !hasPercent) {
    console.log('识别为免税发票');
    return '*';
  }
  
  // 查找表格"税率"列
  const taxRateHeaders = texts.filter(t => 
    t.text.includes('税率') || t.text.includes('征收率')
  );
  
  if (taxRateHeaders.length > 0) {
    const header = taxRateHeaders[0];
    console.log(`找到税率列标题: ${header.text} 位置: x=${header.x}, y=${header.y}`);
    
    // 在税率列下方查找税率值
    const belowTexts = texts.filter(t => 
      Math.abs(t.x - header.x) < 3 && // 同一列
      t.y > header.y && 
      t.y <= header.y + 6 &&
      t.text.includes('%')
    );
    
    for (const text of belowTexts) {
      const rateMatch = text.text.match(/(\d+(?:\.\d+)?)%/);
      if (rateMatch) {
        const rate = parseFloat(rateMatch[1]);
        if (rate >= 0 && rate <= 30) {
          console.log(`在税率列找到: ${rateMatch[0]}`);
          return rateMatch[0];
        }
      }
    }
  }
  
  // 优先查找常见税率（包括13%）
  const commonRates = ['13%', '9%', '6%', '3%', '1%', '0%'];
  
  for (const rate of commonRates) {
    for (const text of texts) {
      if (text.text.includes(rate)) {
        console.log(`找到常见税率: ${rate}`);
        return rate;
      }
    }
  }
  
  // 查找任何有效的百分比（扩大到30%以支持各种税率）
  for (const text of texts) {
    const rateMatch = text.text.match(/(\d+(?:\.\d+)?)%/);
    if (rateMatch) {
      const rate = parseFloat(rateMatch[1]);
      if (rate >= 0 && rate <= 30) {
        console.log(`找到税率: ${rateMatch[0]}`);
        return rateMatch[0];
      }
    }
  }
  
  return '13%'; // 默认改为13%，因为这是常见税率
}

/**
 * 提取金额（修正版 - 更精确地从合计行金额列提取）
 */
function extractOrdinaryAmountFromJson(texts: PDFText[], lines: string[]): string {
  console.log('开始提取普通电子发票金额...');
  console.log('所有文本行:', lines);
  
  // 方法1：从文本行中查找合计行
  for (const line of lines) {
    if (line.includes('合') && line.includes('计') && 
        !line.includes('价税合计') && 
        line.includes('¥')) {
      console.log(`找到合计行: "${line}"`);
      
      // 提取所有¥金额
      const amountMatches = line.match(/¥\s*(\d+\.?\d*)/g);
      if (amountMatches && amountMatches.length >= 1) {
        const amounts = amountMatches.map(match => {
          const num = match.replace(/¥\s*/, '');
          return parseFloat(num);
        }).filter(amount => amount > 0);
        
        if (amounts.length >= 2) {
          // 排序，通常较大的是金额，较小的是税额
          amounts.sort((a, b) => b - a);
          console.log(`合计行找到多个金额: ${amounts.join(', ')}，选择较大的: ${amounts[0]}`);
          return amounts[0].toString();
        } else if (amounts.length === 1) {
          console.log(`合计行找到金额: ${amounts[0]}`);
          return amounts[0].toString();
        }
      }
    }
  }
  
  // 方法2：精确定位合计行和金额列的交叉点
  const totalLabels = texts.filter(t => 
    (t.text.trim() === '合' && 
     texts.some(other => other.text.trim() === '计' && Math.abs(other.y - t.y) < 0.5)) ||
    t.text.includes('合计')
  );
  
  const amountHeaders = texts.filter(t => 
    (t.text.includes('金') && t.text.includes('额')) ||
    t.text.trim() === '金额'
  );
  
  if (totalLabels.length > 0 && amountHeaders.length > 0) {
    const totalY = totalLabels[0].y;
    const amountX = amountHeaders[0].x;
    
    console.log(`合计行Y坐标: ${totalY}, 金额列X坐标: ${amountX}`);
    
    // 在交叉位置查找金额
    const intersectionTexts = texts.filter(t => 
      Math.abs(t.y - totalY) < 1 && // 合计行
      Math.abs(t.x - amountX) < 4 && // 金额列，增大范围
      (t.text.includes('¥') || /^\d+\.?\d*$/.test(t.text.trim()))
    );
    
    console.log('合计行金额列交叉位置的文本:', intersectionTexts.map(t => `"${t.text}" (x:${t.x}, y:${t.y})`));
    
    for (const text of intersectionTexts) {
      const amountMatch = text.text.match(/¥?\s*(\d+\.?\d*)/);
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1]);
        if (amount > 10 && amount < 1000000) {
          console.log(`在交叉位置找到金额: ${amount}`);
          return amount.toString();
        }
      }
    }
  }
  
  // 方法3：在合计行查找第一个较大的金额
  if (totalLabels.length > 0) {
    const totalY = totalLabels[0].y;
    
    const sameLineTexts = texts.filter(t => 
      Math.abs(t.y - totalY) < 0.8 && 
      (t.text.includes('¥') || /\d+\.?\d*/.test(t.text)) &&
      !t.text.includes('%')
    );
    
    const amounts = [];
    for (const text of sameLineTexts) {
      const amountMatch = text.text.match(/¥?\s*(\d+\.?\d*)/);
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1]);
        if (amount > 0 && amount < 1000000) {
          amounts.push({
            value: amount,
            x: text.x,
            text: text.text
          });
        }
      }
    }
    
    if (amounts.length > 0) {
      // 选择较大的金额（通常是不含税金额）
      amounts.sort((a, b) => b.value - a.value);
      console.log(`合计行所有金额: ${amounts.map(a => `${a.value}(${a.text})`).join(', ')}`);
      console.log(`选择最大金额: ${amounts[0].value}`);
      return amounts[0].value.toString();
    }
  }
  
  return '';
}

/**
 * 提取税额（修正版 - 精确提取5.97）
 */
function extractOrdinaryTaxAmountFromJson(texts: PDFText[], lines: string[]): string {
  console.log('开始提取普通电子发票税额...');
  
  // 检查免税
  const hasStarOnly = texts.some(t => t.text.trim() === '*');
  if (hasStarOnly) {
    return '*';
  }
  
  // 查找"合计"行的税额
  const totalLabels = texts.filter(t => 
    t.text.trim() === '合' || 
    t.text.trim() === '计' || 
    t.text.includes('合计')
  );
  
  if (totalLabels.length > 0) {
    const totalY = totalLabels[0].y;
    console.log(`找到合计行，Y坐标: ${totalY}`);
    
    const sameLineTexts = texts.filter(t => 
      Math.abs(t.y - totalY) < 0.8 && 
      t.text.includes('¥')
    );
    
    const amounts = [];
    
    for (const text of sameLineTexts) {
      const amountMatch = text.text.match(/¥\s*(\d+\.?\d*)/);
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1]);
        if (amount >= 0 && amount < 100000) {
          amounts.push(amount);
          console.log(`合计行找到金额: ${amount} 来自文本: ${text.text}`);
        }
      }
    }
    
    if (amounts.length >= 2) {
      // 排序后取较小的数字作为税额
      amounts.sort((a, b) => a - b);
      console.log(`合计行金额排序: ${amounts.join(', ')}，选择较小的: ${amounts[0]}`);
      return amounts[0].toString();
    }
  }
  
  // 查找表格"税额"列
  const taxHeaders = texts.filter(t => 
    (t.text.includes('税') && t.text.includes('额')) ||
    t.text.trim() === '税额'
  );
  
  if (taxHeaders.length > 0) {
    const header = taxHeaders[0];
    
    const belowTexts = texts.filter(t => 
      Math.abs(t.x - header.x) < 3 && 
      t.y > header.y && 
      t.y <= header.y + 5 &&
      (t.text.includes('¥') || /\d+\.?\d*/.test(t.text))
    );
    
    for (const text of belowTexts) {
      const amountMatch = text.text.match(/¥?\s*(\d+\.?\d*)/);
      if (amountMatch) {
        const taxAmount = parseFloat(amountMatch[1]);
        if (taxAmount >= 0 && taxAmount < 50000) {
          console.log(`从税额列提取: ${taxAmount}`);
          return taxAmount.toString();
        }
      }
    }
  }
  
  return '';
}

/**
 * 提取价税合计（修正版 - 精确从价税合计行提取）
 */
function extractOrdinaryTotalAmountFromJson(texts: PDFText[], lines: string[]): string {
  console.log('开始提取普通电子发票价税合计...');
  console.log('所有文本行:', lines);
  
  // 方法1：从文本行中查找价税合计行
  for (const line of lines) {
    if (line.includes('价税合计') || 
        (line.includes('小写') && line.includes('¥'))) {
      console.log(`找到价税合计相关行: "${line}"`);
      
      // 提取¥后的金额
      const amountMatch = line.match(/¥\s*(\d+\.?\d*)/);
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1]);
        if (amount > 0 && amount < 1000000) {
          console.log(`从价税合计行提取: ${amount}`);
          return amount.toString();
        }
      }
    }
  }
  
  // 方法2：查找"价税合计"或"小写"标识
  const totalLabels = texts.filter(t => 
    t.text.includes('价税合计') ||
    (t.text.includes('小写') && !t.text.includes('大写'))
  );
  
  if (totalLabels.length > 0) {
    const label = totalLabels[0];
    console.log(`找到价税合计标识: "${label.text}" 位置: x=${label.x}, y=${label.y}`);
    
    // 在标识同一行或附近查找¥金额
    const nearbyTexts = texts.filter(t => 
      ((Math.abs(t.y - label.y) < 0.8 && t.x > label.x) || // 同行右侧
       (t.y > label.y && t.y <= label.y + 1.5 && Math.abs(t.x - label.x) < 8)) && // 下方
      t.text.includes('¥')
    );
    
    console.log('价税合计附近包含¥的文本:', nearbyTexts.map(t => `"${t.text}" (x:${t.x}, y:${t.y})`));
    
    for (const text of nearbyTexts) {
      const amountMatch = text.text.match(/¥\s*(\d+\.?\d*)/);
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1]);
        if (amount > 0 && amount < 1000000) {
          console.log(`在价税合计附近找到: ${amount}`);
          return amount.toString();
        }
      }
    }
  }
  
  // 方法3：查找"(小写)"标识附近的金额
  const xiaoxieLabels = texts.filter(t => 
    t.text.includes('小写') && t.text.includes(')')
  );
  
  if (xiaoxieLabels.length > 0) {
    const label = xiaoxieLabels[0];
    console.log(`找到小写标识: "${label.text}"`);
    
    // 在小写标识同一行或右侧查找¥金额
    const nearbyTexts = texts.filter(t => 
      Math.abs(t.y - label.y) < 0.8 && 
      t.x >= label.x &&
      t.text.includes('¥')
    );
    
    for (const text of nearbyTexts) {
      const amountMatch = text.text.match(/¥\s*(\d+\.?\d*)/);
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1]);
        if (amount > 0) {
          console.log(`在小写标识附近找到: ${amount}`);
          return amount.toString();
        }
      }
    }
  }
  
  // 方法4：查找所有¥金额，选择最大的（通常是价税合计）
  const allAmountTexts = texts.filter(t => t.text.includes('¥'));
  const amounts = [];
  
  for (const text of allAmountTexts) {
    const amountMatch = text.text.match(/¥\s*(\d+\.?\d*)/);
    if (amountMatch) {
      const amount = parseFloat(amountMatch[1]);
      if (amount > 0) {
        amounts.push(amount);
      }
    }
  }
  
  if (amounts.length > 0) {
    const maxAmount = Math.max(...amounts);
    console.log(`所有¥金额: ${amounts.join(', ')}，选择最大的: ${maxAmount}`);
    return maxAmount.toString();
  }
  
  return '';
}

/**
 * API 路由处理函数
 * 专门处理普通电子发票的识别请求
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    console.log(`普通电子发票处理器（pdf2json版）：收到 ${files.length} 个发票文件`);
    
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
        console.log(`开始处理普通电子发票文件: ${file.name}`);
        const invoiceInfo = await parseOrdinaryElectronicInvoice(file);
        
        invoices.push({
          id: `ORD-INV-${Date.now()}-${i}`,
          filename: file.name,
          ...invoiceInfo,
          status: '已处理',
          processedAt: new Date().toISOString(),
          invoiceType: '普通电子发票'
        });
        
        console.log(`普通电子发票文件 ${file.name} 处理完成`);
      } catch (error) {
        console.error(`处理普通电子发票文件 ${file.name} 失败:`, error);
        
        invoices.push({
          id: `ORD-INV-${Date.now()}-${i}`,
          filename: file.name,
          invoiceName: '增值税普通发票',
          invoiceNumber: `${Date.now()}${i}`,
          issueDate: new Date().toISOString().slice(0, 10),
          buyerName: '',
          buyerTaxId: '',
          sellerName: '',
          sellerTaxId: '',
          goodsServices: file.name.replace(/\.[^/.]+$/, ""),
          taxRate: '3%',
          amount: '',
          taxAmount: '',
          totalAmount: '',
          status: '解析失败',
          processedAt: new Date().toISOString(),
          invoiceType: '普通电子发票',
          error: error.message
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `成功处理 ${files.length} 个普通电子发票文件`,
      invoices,
      processorType: '普通电子发票专用处理器（pdf2json版）'
    });
    
  } catch (error) {
    console.error('普通电子发票处理器出错:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '处理普通电子发票文件时出错' },
      { status: 500 }
    );
  }
} 