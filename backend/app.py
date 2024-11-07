from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from langchain_google_genai import ChatGoogleGenerativeAI
import os
import logging
import dotenv

dotenv.load_dotenv()

if "GOOGLE_API_KEY" not in os.environ:
    logging.error("GOOGLE_API_KEY not set.")
    exit(1)

llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)

app = FastAPI()

@app.get("/ws")
async def get():
    return JSONResponse({"message": "This is a websocket endpoint. You should connect to it using a websocket client."})

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_json({"type": "init"})
    chats = [
        { "type": "ai", "content": "Hello! I am a helpful assistant that can answer questions." },
    ]
    await websocket.send_json({"type": "get-chats", "chats": chats})
    while True:
        try:
            data = await websocket.receive_json()
        except:
            logging.warning("Connection closed.")
            break
        type = data["type"]
        if type == "set-chats":
            chats = data["chats"]
        if type == "get-chats":
            await websocket.send_json({"type": "get-chats", "chats": chats})
        if type == "send-message":
            prompt = data["prompt"]
            chats.append({ "type": "human", "content": prompt })
            await websocket.send_json({"type": "get-chats", "chats": chats})
            messages = [msg for chat in chats for msg in [(chat["type"], chat["content"])] ]
            chats.append({ "type": "ai", "content": "" })
            await websocket.send_json({"type": "get-chats", "chats": chats})
            try:
                async for chunk in llm.astream(messages):
                    logging.info(chunk.content)
                    chats[-1]["content"] += chunk.content
                    await websocket.send_json({"type": "llm-chunk", "content": chunk.content})
                await websocket.send_json({"type": "get-chats", "chats": chats})
            except Exception as e:
                logging.error(e)
                await websocket.send_json({"type": "llm-chunk", "content": "I am out of resources. Please try again later."})
                await websocket.send_json({"type": "get-chats", "chats": chats})
                break

# serve dist vite project
#@app.get("/", response_class=HTMLResponse)
#async def read_root():
#    return FileResponse("dist/index.html")
#app.mount("/", StaticFiles(directory="dist"), name="/")
