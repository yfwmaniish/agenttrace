"""Tests for AgentTrace Python SDK — mirrors TypeScript core + SDK tests."""

from agenttrace import AgentTraceClient, generate_keypair, verify_chain, find_tamper_point


def test_keypair_generation():
    kp = generate_keypair()
    assert kp["publicKey"]
    assert kp["privateKey"]
    assert len(kp["fingerprint"]) == 16


def test_client_init():
    client = AgentTraceClient()
    assert client.session_id
    assert client.chain_length == 0


def test_span_creates_signed_record():
    client = AgentTraceClient()
    span = client.start_span("test_span", kind="llm_call")
    span.set_input({"prompt": "Hello"})
    span.set_output({"response": "Hi"})
    span.end()

    assert client.chain_length == 1
    record = client.get_records()[0]
    assert record["span"]["name"] == "test_span"
    assert record["signature"]
    assert record["chainHash"]


def test_chain_linkage():
    client = AgentTraceClient()
    s1 = client.start_span("step_1"); s1.end()
    s2 = client.start_span("step_2"); s2.end()
    s3 = client.start_span("step_3"); s3.end()

    records = client.get_records()
    assert records[1]["previousHash"] == records[0]["chainHash"]
    assert records[2]["previousHash"] == records[1]["chainHash"]


def test_chain_verification_passes():
    client = AgentTraceClient()
    for i in range(5):
        span = client.start_span(f"action_{i}", kind="agent_step")
        span.set_input({"step": i})
        span.set_output({"result": f"done_{i}"})
        span.end()

    result = verify_chain(client.get_records())
    assert result["valid"] is True
    assert result["chainLength"] == 5


def test_tamper_detection():
    client = AgentTraceClient()
    s1 = client.start_span("a"); s1.end()
    s2 = client.start_span("b"); s2.end()

    records = client.get_records()
    records[1]["span"]["name"] = "TAMPERED"

    result = verify_chain(records)
    assert result["valid"] is False


def test_context_manager():
    client = AgentTraceClient()
    with client.trace("my_op", kind="llm_call") as span:
        span.set_input({"q": "test"})
        span.set_output({"a": "result"})

    assert client.chain_length == 1


def test_context_manager_captures_errors():
    client = AgentTraceClient()
    try:
        with client.trace("failing") as span:
            raise ValueError("boom")
    except ValueError:
        pass

    assert client.chain_length == 1
    assert client.get_records()[0]["span"]["status"] == "error"


def test_merkle_root():
    client = AgentTraceClient()
    s1 = client.start_span("a"); s1.end()
    s2 = client.start_span("b"); s2.end()
    root = client.get_merkle_root()
    assert len(root) == 64


def test_find_tamper_point_none_for_valid():
    client = AgentTraceClient()
    s1 = client.start_span("a"); s1.end()
    assert find_tamper_point(client.get_records()) is None
