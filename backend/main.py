import argparse
from app import app
import uvicorn
import dotenv
import llmlib as llmlib

dotenv.load_dotenv()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the backend server.")
    parser.add_argument("--port", type=int, default=5080, help="Port to run the server on")
    args = parser.parse_args()
    uvicorn.run("main:app", host="127.0.0.1", port=args.port, reload=True)
