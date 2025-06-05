import torch
import time

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using device:", device)

# 연산 크기 설정
size = 40960  # 필요 시 더 키워서 GPU 메모리 사용량 증가
a = torch.randn(size, size, device=device)
b = torch.randn(size, size, device=device)

# print("Starting infinite GPU load...")

try:
    while True:
        # GPU 연산 반복 (곱셈 결과를 재사용)
        c = torch.matmul(a, b)
        a = c
        # 가끔 쉬어줘야 watchdog 에러 방지 가능 (특히 일부 서버에서)
        time.sleep(0.01)

except KeyboardInterrupt:
    print("Stopped by user.")
