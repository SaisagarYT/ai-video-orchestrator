from typing import Union
from fastapi import FastAPI

app = FastAPI(title="AI ")

@app.get('/health')
def read_root():
    return {"status":"ok"}


