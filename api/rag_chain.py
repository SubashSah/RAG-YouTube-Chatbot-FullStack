# api/rag_chain.py

import re
import os
from dotenv import load_dotenv
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.prompts import PromptTemplate
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEndpointEmbeddings, ChatHuggingFace, HuggingFaceEndpoint
from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser

# ---- Configuration ----
load_dotenv()
HF_API_KEY = os.getenv("HF_API_KEY")
TRANSCRIPT_LANG = ["en"]

# ---- Helper functions ----
def get_video_id(youtube_url: str) -> str:
    pattern = r"(?:v=|\/)([0-9A-Za-z_-]{11}).*"
    match = re.search(pattern, youtube_url)
    if not match:
        raise ValueError("Invalid YouTube URL")
    return match.group(1)

def fetch_transcript(youtube_url: str):
    video_id = get_video_id(youtube_url)
    try:
        transcript_list = YouTubeTranscriptApi().fetch(video_id, languages=TRANSCRIPT_LANG)
        transcript = " ".join(snippet.text for snippet in transcript_list)
        return transcript
    except TranscriptsDisabled:
        return "This video has transcripts disabled."
    except NoTranscriptFound:
        return "No transcript available in the requested language."
    except Exception as e:
        return f"Unexpected error: {e}"

def split_transcript(transcript: str):
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=50)
    chunks = splitter.create_documents([transcript])
    return chunks

# ---- Embeddings and Retriever ----
embeddings = HuggingFaceEndpointEmbeddings(
    repo_id="sentence-transformers/all-mpnet-base-v2",
    huggingfacehub_api_token=HF_API_KEY
)

def create_vector_store(chunks):
    return FAISS.from_documents(chunks, embeddings)

def create_retriever(vector_store):
    return vector_store.as_retriever(search_type="similarity", search_kwargs={"k":3})

# ---- Prompt Template ----
prompt = PromptTemplate(
    template="""
You are a helpful assistant.
Answer only from the provided transcript context.
If the context is insufficient, just say you don't know.

context: {context}
Question: {question}
""",
    input_variables=['context', 'question']
)

# ---- LLM Setup ----
def get_llm(repo_id):
    return HuggingFaceEndpoint(
        repo_id=repo_id,
        task="text-generation",
        huggingfacehub_api_token=HF_API_KEY
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
    parallel_chain = RunnableParallel({
        "context" : retriever | RunnableLambda(format_docs),
        "question" : RunnablePassthrough()
    })
    main_chain = parallel_chain | prompt | RunnableLambda(get_response) | parser
    return main_chain