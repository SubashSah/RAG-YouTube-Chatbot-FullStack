from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from rag_chain import (
    fetch_transcript,
    split_transcript,
    create_vector_store,
    create_retriever,
    build_chain,
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Global variables
# --------------------------------------------------

current_video_url = None
current_chain = None


# --------------------------------------------------
# Request Models
# --------------------------------------------------


class LoadVideoRequest(BaseModel):
    youtube_url: str


class QuestionRequest(BaseModel):
    question: str


# --------------------------------------------------
# Root Endpoint
# --------------------------------------------------


@app.get("/")
def root():
    return {"message": "YouTube RAG Chatbot API running!"}


# --------------------------------------------------
# Load Video Endpoint
# --------------------------------------------------


@app.post("/load-video")
def load_video(req: LoadVideoRequest):

    global current_video_url
    global current_chain

    # Avoid rebuilding if same video is already loaded
    try:
        if req.youtube_url == current_video_url:
            return {"message": "Video already loaded."}

        transcript = fetch_transcript(req.youtube_url)

        chunks = split_transcript(transcript)

        vector_store = create_vector_store(chunks)

        retriever = create_retriever(vector_store)

        current_chain = build_chain(retriever)

        current_video_url = req.youtube_url

        return {"message": "Video loaded successfully."}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(
            status_code=500, detail="An unexpected server error occurred."
        )


# --------------------------------------------------
# Ask Question Endpoint
# --------------------------------------------------


@app.post("/ask")
def ask_question(req: QuestionRequest):

    global current_chain

    if current_chain is None:
        raise HTTPException(status_code=409, detail="Please load a YouTube video first")

    answer = current_chain.invoke(req.question)

    return {"answer": answer}
