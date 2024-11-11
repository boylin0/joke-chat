from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse, FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import logging
import llmlib as llmlib

app = FastAPI()

DEFAULT_CHATS = [
    {
        "type": "system",
        "content": """
        Your name is Funny, you speaks traditional Chinese in Taiwan.
        You are very funny and you like to make jokes.
        every time you speak, you will make a joke.
        you should speak only in traditional Chinese even i ask you in other language.
        """,
    },
    {"type": "ai", "content": "問我問題吧！"},
]

@app.get("/ws")
async def get():
    return JSONResponse(
        {
            "message": "This is a websocket endpoint. You should connect to it using a websocket client."
        }
    )


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):

    llm = llmlib.get_llm()

    await websocket.accept()

    # Initialize chats with DEFAULT_CHATS
    chats = DEFAULT_CHATS.copy()  # Use copy to avoid modifying the original
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
            chats.append({"type": "human", "content": prompt})
            await websocket.send_json({"type": "get-chats", "chats": chats})
            messages = [
                msg for chat in chats for msg in [(chat["type"], chat["content"])]
            ]
            chats.append({"type": "ai", "content": ""})
            await websocket.send_json({"type": "get-chats", "chats": chats})
            try:
                async for chunk in llm.astream(messages):
                    logging.info(chunk.content)
                    chats[-1]["content"] += chunk.content
                    await websocket.send_json(
                        {"type": "llm-chunk", "content": chunk.content}
                    )
                await websocket.send_json({"type": "get-chats", "chats": chats})
            except Exception as e:
                logging.error(e)
                chats[-1]["content"] += f"\n\n{e}"
            finally:
                await websocket.send_json({"type": "get-chats", "chats": chats})

        if type == "clear-chats":
            chats = DEFAULT_CHATS.copy()
            await websocket.send_json({"type": "get-chats", "chats": chats})


# serve dist vite project
# @app.get("/", response_class=HTMLResponse)
# async def read_root():
#    return FileResponse("dist/index.html")
# app.mount("/", StaticFiles(directory="dist"), name="/")
