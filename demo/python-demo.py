import os
import time
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool

from agenttrace.client import AgentTraceClient
from agenttrace.langchain import AgentTraceCallbackHandler

# 1. Initialize AgentTrace Client
# In a real demo, set your project_id and endpoint
client = AgentTraceClient(
    endpoint="https://api-puce-zeta.vercel.app/api", # Live Vercel API
    project_id="AI Research Lab"
)

# 2. Define a simple tool
@tool
def get_market_price(symbol: str) -> str:
    """Get the current market price of a stock."""
    # This action will be cryptographically signed by AgentTrace
    return f"The price of {symbol} is $150.25"

# 3. Setup LangChain Agent
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a financial assistant."),
    ("user", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

# Mock LLM for demo purposes (so it runs without an API key)
from langchain_community.llms import FakeListLLM
llm = ChatOpenAI(model="gpt-4o", api_key="sk-fake") # Just for structure

# 4. THE WEDGE: Add the AgentTrace Callback
# This is the "One Line" that enables forensics
trace_handler = AgentTraceCallbackHandler(client)

print(f"🚀 Starting Agent Session: {client.session_id}")
print("🔗 Forensic Chain active. All signatures generated locally.\n")

# Run a simple tool invocation sequence
print("🤖 Agent: Checking market price...")
# Simulate the tool call for the demo
with client.trace("Get Market Price", kind="tool_invoke") as span:
    span.set_input({"symbol": "AAPL"})
    result = get_market_price("AAPL")
    span.set_output(result)
    print(f"🛠️ Tool Result: {result}")

print("\n🤖 Agent: Analyzing trends...")
with client.trace("Trend Analysis", kind="llm_call") as span:
    span.set_input("Analyze the price trend for AAPL.")
    time.sleep(1) # Simulate thinking
    res = "The trend is bullish with strong support at $145."
    span.set_output(res)
    print(f"🧠 Analysis: {res}")

print("\n✅ Session Complete. Flushing forensic proof to the cloud...")
client.flush_sync()

print(f"\n📊 VIEW IN DASHBOARD: https://dashboard-flame-chi-23.vercel.app/sessions")
print(f"🔍 VERIFY INTEGRITY: https://dashboard-flame-chi-23.vercel.app/verify")
