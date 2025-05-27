# dummy_gpu_keepalive.py
import torch
import time

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Dummy tensor to keep GPU active
x = torch.randn(100, 100).to(device)
for _ in range(1000):
    x = x @ x  # matrix multiplication to use GPU
    time.sleep(10)  # adjust for minimal usage
