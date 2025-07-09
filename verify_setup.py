#!/usr/bin/env python3
"""验证系统Python环境设置"""
import sys
import importlib

def check_module(module_name):
    try:
        importlib.import_module(module_name)
        return True
    except ImportError:
        return False

def main():
    print("=== 验证系统Python环境 ===")
    print(f"Python版本: {sys.version}")
    print(f"Python路径: {sys.executable}")
    
    required_modules = [
        "fastapi",
        "uvicorn",
        "pydantic",
        "pandas",
        "numpy", 
        "jieba",
        "faiss",
        "sklearn",
        "docx",
        "openpyxl"
    ]
    
    print("\n检查依赖模块:")
    all_ok = True
    for module in required_modules:
        if check_module(module):
            print(f"✓ {module}")
        else:
            print(f"✗ {module} - 缺失")
            all_ok = False
    
    if all_ok:
        print("\n✓ 所有依赖都已正确安装！")
        print("现在可以运行: cd backend && python3 app.py")
    else:
        print("\n✗ 有依赖缺失，请先运行 install_dependencies.py")

if __name__ == "__main__":
    main() 