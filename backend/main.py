from fastapi import FastAPI
from pydantic import BaseModel
from agent.agent import run_agent

app = FastAPI()

class ChatRequest(BaseModel):
    message: str
    user_id: str

@app.post("/chat")
def chat(req: ChatRequest):

    response = run_agent(req.message, req.user_id)

    return {"response": response}