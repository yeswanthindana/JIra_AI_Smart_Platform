from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.services.rag_chat_service import (
    ask_rag
)

# ------------------------------------------------
# ROUTER
# ------------------------------------------------

router = APIRouter()

# ------------------------------------------------
# REQUEST MODEL
# ------------------------------------------------

class AIQuestion(BaseModel):

    question: str

# ------------------------------------------------
# AI CHAT API
# ------------------------------------------------

@router.post("/ask-ai")

def ask_ai(data: AIQuestion):

    # response = ask_rag(data.question)

    # return {

    #     "question": data.question,

    #     "response": response
    # }
    return StreamingResponse(

        ask_rag(data.question),

        media_type="text/plain"
    )
