# api/rag_chain.py

import re
import os
from urllib.parse import urlparse, parse_qs
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import PromptTemplate
from langchain_community.vectorstores import FAISS
from langchain_huggingface import (
    HuggingFaceEndpointEmbeddings,
    ChatHuggingFace,
    HuggingFaceEndpoint,
)
from langchain_core.runnables import (
    RunnableParallel,
    RunnablePassthrough,
    RunnableLambda,
)
from langchain_core.output_parsers import StrOutputParser

# ---- Configuration ----
load_dotenv()
HF_API_KEY = os.getenv("HF_API_KEY")
TRANSCRIPT_LANG = ["en"]


# ---- Helper functions ----
def get_video_id(youtube_url: str) -> str:
    parsed_url = urlparse(youtube_url)

    # Handle normal YouTube URLs
    if parsed_url.netloc in ("www.youtube.com", "youtube.com"):
        video_id = parse_qs(parsed_url.query).get("v", [None])[0]

    # Handle youtu.be URLs
    elif parsed_url.netloc == "youtu.be":
        video_id = parsed_url.path.lstrip("/")

    else:
        raise ValueError("Invalid YouTube URL")

    if not video_id or len(video_id) != 11:
        raise ValueError("Invalid YouTube URL")

    return video_id


def fetch_transcript(youtube_url: str):
    video_id = get_video_id(youtube_url)
    try:
        transcript_list = YouTubeTranscriptApi().fetch(
            video_id, languages=TRANSCRIPT_LANG
        )
        transcript = " ".join(snippet.text for snippet in transcript_list)
        return transcript
    except TranscriptsDisabled:
        raise ValueError("Transcripts are disabled for this video.")
    except NoTranscriptFound:
        raise ValueError("Unable to retrieve English transcripts for this video.")
    except Exception as e:
        raise  # we can remove t his expect exception line entirely. works as same.


def split_transcript(transcript: str):
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=50)
    chunks = splitter.create_documents([transcript])
    return chunks


# ---- Embeddings and Retriever ----
embeddings = HuggingFaceEndpointEmbeddings(
    repo_id="sentence-transformers/all-mpnet-base-v2",
    huggingfacehub_api_token=HF_API_KEY,
)


def create_vector_store(chunks):
    return FAISS.from_documents(chunks, embeddings)


def create_retriever(vector_store):
    return vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 3})


# ---- Prompt Template ----
prompt = PromptTemplate(
    template="""
You are a friendly AI assistant that answers questions about a YouTube video.

Use the provided transcript context to answer any question related to the video.

If the user asks a casual conversational question (such as greetings, thanks, asking how you are, asking your name, or other normal human conversation), respond naturally and politely.

If the user asks about the video but the answer cannot be found in the transcript, clearly say that the information is not available in the video's transcript. Do not make up or guess any information.

If the user asks something unrelated to the video that requires factual knowledge outside the transcript, politely explain that you can only answer questions based on the video's transcript.

Context:
{context}

Question:
{question}
""",
    input_variables=["context", "question"],
)


# ---- LLM Setup ----
def get_llm(repo_id):
    return HuggingFaceEndpoint(
        repo_id=repo_id, task="text-generation", huggingfacehub_api_token=HF_API_KEY
    )


# Notebook names exactly preserved
Qwen_llm = get_llm("Qwen/Qwen2.5-7B-Instruct")
Meta_llm = get_llm("meta-llama/Meta-Llama-3-8B-Instruct")

Qwen_model = ChatHuggingFace(llm=Qwen_llm)
Meta_model = ChatHuggingFace(llm=Meta_llm)


def get_response(prompt_text):
    """Tries Qwen first; falls back to Meta if unavailable."""
    try:
        print("⚡ Using Qwen2.5-7B-Instruct-v0.3 ...")
        response = Qwen_model.invoke(prompt_text)
        return response
    except Exception as e:
        print(f"❌ Qwen2.5-7B failed: {e}")
        print("🔁 Switching to /Meta-Llama-3-8B ...")
        try:
            response = Meta_model.invoke(prompt_text)
            return response
        except Exception as e2:
            print(f"❌ /Meta-Llama-3-8B also failed: {e2}")
            return "Both models are currently unavailable. Please try again later."


# ---- Chain Setup ----
parser = StrOutputParser()


def format_docs(retrieved_docs):
    return " \n".join(doc.page_content for doc in retrieved_docs)


def build_chain(retriever):
    parallel_chain = RunnableParallel(
        {
            "context": retriever | RunnableLambda(format_docs),
            "question": RunnablePassthrough(),
        }
    )
    main_chain = parallel_chain | prompt | RunnableLambda(get_response) | parser
    return main_chain
