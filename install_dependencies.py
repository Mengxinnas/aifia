#!/usr/bin/env python3
"""
全局Python环境依赖安装脚本
"""
import subprocess
import sys
import os

def run_command(command):
    """执行命令并显示输出"""
    print(f"执行: {command}")
    try:
        result = subprocess.run(command, shell=True, check=True, 
                              capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"错误: {e}")
        if e.stderr:
            print(f"错误详情: {e.stderr}")
        return False

def main():
    print("=== 在系统全局Python环境中安装财务分析项目依赖 ===")
    print(f"当前Python版本: {sys.version}")
    print(f"Python路径: {sys.executable}")
    
    # 读取requirements.txt中的依赖
    requirements_file = os.path.join(os.path.dirname(__file__), "requirements.txt")
    
    if os.path.exists(requirements_file):
        print(f"\n从 {requirements_file} 安装依赖...")
        success = run_command(f"{sys.executable} -m pip install -r {requirements_file}")
        if not success:
            print("从requirements.txt安装失败，尝试单独安装关键依赖...")
    else:
        print("requirements.txt不存在，安装关键依赖...")
    
    # 关键依赖列表
    critical_packages = [
        "fastapi>=0.68.0",
        "uvicorn>=0.15.0", 
        "pydantic>=2.0.0",
        "pandas>=1.5.0",
        "numpy>=1.24.0",
        "pymupdf>=1.21.1",
        "python-docx>=0.8.11",
        "openpyxl>=3.1.0",
        "jieba>=0.42.1",
        "faiss-cpu>=1.7.4",
        "scikit-learn>=1.3.0",
        "python-dotenv>=0.19.0",
        "aiohttp>=3.8.5",
        "requests>=2.28.0",
        "psutil>=5.8.0"
    ]
    
    print("\n安装关键依赖包...")
    failed_packages = []
    
    for package in critical_packages:
        print(f"\n安装 {package}...")
        success = run_command(f"{sys.executable} -m pip install {package}")
        if not success:
            failed_packages.append(package)
    
    print("\n=== 安装完成 ===")
    
    if failed_packages:
        print(f"以下包安装失败: {failed_packages}")
        print("请手动安装这些包或检查网络连接")
    else:
        print("所有依赖安装成功！")
    
    # 验证关键依赖
    print("\n验证关键依赖...")
    test_imports = [
        "fastapi",
        "uvicorn", 
        "pandas",
        "numpy",
        "jieba",
        "sklearn"
    ]
    
    for module in test_imports:
        try:
            __import__(module)
            print(f"✓ {module} 可用")
        except ImportError:
            print(f"✗ {module} 不可用")

if __name__ == "__main__":
    main() 