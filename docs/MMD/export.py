import subprocess
import os
import shutil
import concurrent.futures
import time
from pathlib import Path
from colorama import Fore, Style, init

# 初始化colorama
init()

def compile_mermaid_file(mmd_file, output_dir, scale):
    """编译单个Mermaid文件"""
    output_file = output_dir / (mmd_file.stem + ".png")
    cmd = [
        "mmdc",
        "-i", str(mmd_file),
        "-o", str(output_file),
        "--scale", str(scale)
    ]
    print(f"{Fore.CYAN}编译：{Fore.GREEN}{mmd_file.name} {Fore.WHITE}→ {Fore.GREEN}{output_file.name}{Style.RESET_ALL}")
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)
        if "Generating single mermaid chart" in result.stderr:
            print(f"{Fore.BLUE}Generating single mermaid chart{Style.RESET_ALL}")
        return True, mmd_file.name
    except subprocess.CalledProcessError as e:
        print(f"{Fore.RED}[错误] 无法编译 {mmd_file.name}: {e}{Style.RESET_ALL}")
        return False, mmd_file.name

def batch_compile_mermaid(input_dir, output_dir, dpi=600, max_workers=None):
    """并行批量编译Mermaid文件"""
    input_dir = Path(input_dir)
    output_dir = Path(output_dir)
    
    # 清空输出目录
    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    scale = dpi / 96  # Mermaid 默认 DPI 是 96
    
    # 获取所有mmd文件
    mmd_files = list(input_dir.glob("*.mmd"))
    total_files = len(mmd_files)
    
    print(f"{Fore.YELLOW}开始处理 {total_files} 个Mermaid文件...{Style.RESET_ALL}")
    start_time = time.time()
    
    # 使用线程池并行处理
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(compile_mermaid_file, mmd_file, output_dir, scale) 
                   for mmd_file in mmd_files]
        
        # 收集结果
        success_count = 0
        for future in concurrent.futures.as_completed(futures):
            success, filename = future.result()
            if success:
                success_count += 1
    
    elapsed_time = time.time() - start_time
    print(f"{Fore.GREEN}完成！成功编译 {success_count}/{total_files} 个文件，用时 {elapsed_time:.2f} 秒{Style.RESET_ALL}")

# 示例调用
if __name__ == "__main__":
    batch_compile_mermaid("files", "png", dpi=400)