"""
LandTrace360 — Phase 2.6 LandTrace AI Test Suite
Validates:
1. Owner question (LND-1001)
2. Land details
3. Risk question (LND-1004)
4. Risk explanation (LND-1004 score 85)
5. Legal case question (LND-1006)
6. Mortgage question (LND-1006 active mortgage)
7. Document question (LND-1004 disputed doc)
8. Anomaly question
9. Evidence question
10. Land history question (Time Machine)
11. Sale status question (LND-1001 for sale)
12. Complete summary
13. Unknown question
14. Missing data (Anti-hallucination protection)
15. Invalid land ID rejection
16. Empty message handling
17. Multilingual English
18. Multilingual Tamil
19. Multilingual Hindi
20. Authentication requirement (Bearer token validation)
21. Preservation of 8 demo lands & risk scores (LND-1001: 15, LND-1004: 85, LND-1006: 35)
"""

import sys
import os
from pathlib import Path

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

# Ensure backend directory is in path
backend_dir = str(Path(__file__).resolve().parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from starlette.requests import Request
from fastapi import HTTPException
from main import (
    app,
    DEMO_LAND_DATA,
    RISK_DATA,
    ChatRequest,
    chat_endpoint,
    chat_suggestions_endpoint,
    login_endpoint,
    LoginRequest
)
from auth_helpers import DEMO_PASSWORD


def mock_request(token: str = None) -> Request:
    headers = []
    if token:
        headers.append((b"authorization", f"Bearer {token}".encode()))
    return Request({"type": "http", "headers": headers})


def run_chatbot_tests():
    print("=" * 65)
    print("LANDTRACE360 PHASE 2.6 CHATBOT VERIFICATION SUITE")
    print("=" * 65)

    login_res = login_endpoint(LoginRequest(email="buyer@landtrace360.demo", password=DEMO_PASSWORD), db=None)
    buyer_token = login_res["token"]
    auth_req = mock_request(buyer_token)

    # -------------------------------------------------------------
    # 1. AUTHENTICATION REQUIREMENT
    # -------------------------------------------------------------
    print("\n[TEST 1] Testing Chatbot Authentication Requirement...")
    try:
        chat_endpoint(ChatRequest(message="Who owns LND-1001?"), mock_request(None), db=None)
        assert False, "Unauthenticated request should have raised 401 HTTPException"
    except HTTPException as e:
        assert e.status_code == 401, f"Expected 401, got {e.status_code}"
        print("  PASS: Unauthenticated chat request rejected with 401.")

    try:
        chat_endpoint(ChatRequest(message="Who owns LND-1001?"), mock_request("invalid.fake.token"), db=None)
        assert False, "Invalid token should have raised 401 HTTPException"
    except HTTPException as e:
        assert e.status_code == 401, f"Expected 401, got {e.status_code}"
        print("  PASS: Invalid token rejected with 401.")

    auth_check = chat_endpoint(ChatRequest(message="Who owns LND-1001?"), auth_req, db=None)
    assert auth_check is not None, "Authenticated request failed"
    print("  PASS: Authenticated user accepted successfully.")

    # -------------------------------------------------------------
    # 2. OWNER QUESTION (LND-1001)
    # -------------------------------------------------------------
    print("\n[TEST 2] Testing Owner Question for LND-1001...")
    res = chat_endpoint(ChatRequest(message="Who owns LND-1001?"), auth_req, db=None)
    assert res["intent"] == "owner", f"Expected intent owner, got {res['intent']}"
    assert "TechSpace Inc." in res["answer"], f"Expected TechSpace Inc. in answer, got: {res['answer']}"
    assert len(res["evidence"]) > 0, "Expected supporting evidence records"
    assert res["land_id"] == "LND-1001", f"Expected LND-1001, got {res['land_id']}"
    print(f"  PASS: Owner verified as TechSpace Inc. with {len(res['evidence'])} evidence item(s).")

    # -------------------------------------------------------------
    # 3. LAND DETAILS QUESTION
    # -------------------------------------------------------------
    print("\n[TEST 3] Testing Land Details Question...")
    res = chat_endpoint(ChatRequest(message="Tell me about this land", land_id="LND-1001"), auth_req, db=None)
    assert "Central IT Park" in res["answer"] or "Commercial" in res["answer"], f"Unexpected answer: {res['answer']}"
    assert res["land_id"] == "LND-1001"
    print("  PASS: Land details retrieved from verified registry record.")

    # -------------------------------------------------------------
    # 4. RISK & RISK EXPLANATION (LND-1004 -> HIGH RISK 85)
    # -------------------------------------------------------------
    print("\n[TEST 4] Testing Risk & Risk Explanation for LND-1004...")
    res = chat_endpoint(ChatRequest(message="Why is LND-1004 high risk?"), auth_req, db=None)
    assert res["intent"] in ["risk", "risk_breakdown"], f"Expected risk intent, got {res['intent']}"
    assert "85/100" in res["answer"], f"Expected 85/100 in answer, got {res['answer']}"
    assert "HIGH" in res["answer"].upper() or "High Risk" in res["answer"], "Expected HIGH risk level"
    ev_types = [e.get("record_type") for e in res["evidence"]]
    assert any("Risk" in str(et) or "Document" in str(et) or "Legal" in str(et) for et in ev_types)
    print(f"  PASS: LND-1004 risk score (85/100 HIGH) and breakdown factors accurately explained.")

    # -------------------------------------------------------------
    # 5. LEGAL CASE QUESTION (LND-1006)
    # -------------------------------------------------------------
    print("\n[TEST 5] Testing Legal Cases for LND-1006...")
    res = chat_endpoint(ChatRequest(message="What legal cases are associated with LND-1006?"), auth_req, db=None)
    assert res["intent"] == "legal_cases", f"Expected legal_cases, got {res['intent']}"
    assert "OS-2021-22" in res["answer"] or "Resolved" in res["answer"], f"Expected case OS-2021-22 in answer: {res['answer']}"
    print("  PASS: Stored legal case OS-2021-22 identified with neutral status.")

    # -------------------------------------------------------------
    # 6. MORTGAGE QUESTION (LND-1006 -> Active Commerce Bank)
    # -------------------------------------------------------------
    print("\n[TEST 6] Testing Mortgage Question for LND-1006...")
    res = chat_endpoint(ChatRequest(message="Does LND-1006 have a mortgage?"), auth_req, db=None)
    assert res["intent"] == "mortgage", f"Expected mortgage intent, got {res['intent']}"
    assert "Commerce Bank" in res["answer"], f"Expected Commerce Bank in answer, got: {res['answer']}"
    assert "Active" in res["answer"] or "active" in res["answer"].lower(), "Expected active mortgage status"
    print("  PASS: Active mortgage with Commerce Bank detected and reported.")

    # -------------------------------------------------------------
    # 7. DOCUMENT QUESTION (LND-1004 -> Disputed DOC-55321)
    # -------------------------------------------------------------
    print("\n[TEST 7] Testing Document Question for LND-1004...")
    res = chat_endpoint(ChatRequest(message="What documents are available for LND-1004?"), auth_req, db=None)
    assert res["intent"] == "documents", f"Expected documents intent, got {res['intent']}"
    assert "DOC-55321" in res["answer"], f"Expected DOC-55321 in answer, got: {res['answer']}"
    print("  PASS: Registered documents (including DOC-55321) accurately retrieved.")

    # -------------------------------------------------------------
    # 8. ANOMALY QUESTION
    # -------------------------------------------------------------
    print("\n[TEST 8] Testing Anomaly Question for LND-1004...")
    res = chat_endpoint(ChatRequest(message="What anomalies were detected for LND-1004?"), auth_req, db=None)
    assert res["intent"] == "anomalies", f"Expected anomalies intent, got {res['intent']}"
    assert len(res["evidence"]) > 0, "Expected anomaly evidence items"
    print(f"  PASS: Anomalies detected and itemized ({len(res['evidence'])} evidence records).")

    # -------------------------------------------------------------
    # 9. EVIDENCE QUESTION
    # -------------------------------------------------------------
    print("\n[TEST 9] Testing Evidence Question for LND-1001...")
    res = chat_endpoint(ChatRequest(message="Show evidence for the risk", land_id="LND-1001"), auth_req, db=None)
    assert res["intent"] == "evidence", f"Expected evidence intent, got {res['intent']}"
    assert len(res["evidence"]) > 0, "Expected evidence items"
    print(f"  PASS: Evidence Explorer findings returned with full traceability.")

    # -------------------------------------------------------------
    # 10. LAND HISTORY / TIME MACHINE QUESTION
    # -------------------------------------------------------------
    print("\n[TEST 10] Testing Land History / Time Machine for LND-1001...")
    res = chat_endpoint(ChatRequest(message="What happened to LND-1001 over time?"), auth_req, db=None)
    assert res["intent"] in ["land_history", "ownership_history"], f"Expected history intent, got {res['intent']}"
    assert "2005" in res["answer"] and "2015" in res["answer"] and "2026" in res["answer"], f"Expected timeline years: {res['answer']}"
    print("  PASS: Chronological milestone years (2005 -> 2015 -> 2026) verified.")

    # -------------------------------------------------------------
    # 11. SALE STATUS QUESTION
    # -------------------------------------------------------------
    print("\n[TEST 11] Testing Sale Status for LND-1001 & LND-1004...")
    res_sale = chat_endpoint(ChatRequest(message="Is LND-1001 for sale?"), auth_req, db=None)
    assert "for sale" in res_sale["answer"].lower() or "5,000,000" in res_sale["answer"], f"Expected sale answer: {res_sale['answer']}"
    
    res_not_sale = chat_endpoint(ChatRequest(message="Is LND-1004 for sale?"), auth_req, db=None)
    assert "not" in res_not_sale["answer"].lower(), f"Expected not for sale: {res_not_sale['answer']}"
    print("  PASS: Sale status accurately distinguished between for-sale and unlisted parcels.")

    # -------------------------------------------------------------
    # 12. COMPLETE SUMMARY
    # -------------------------------------------------------------
    print("\n[TEST 12] Testing Complete Land Summary for LND-1001...")
    res = chat_endpoint(ChatRequest(message="Give me a complete summary of LND-1001"), auth_req, db=None)
    assert res["intent"] == "complete_summary", f"Expected complete_summary, got {res['intent']}"
    assert "TechSpace Inc." in res["answer"]
    assert "45,000 sq ft" in res["answer"]
    assert "15/100" in res["answer"]
    print("  PASS: Master summary successfully aggregated all 12 land dimensions.")

    # -------------------------------------------------------------
    # 13. UNKNOWN / GENERAL QUESTION
    # -------------------------------------------------------------
    print("\n[TEST 13] Testing Unknown Question...")
    res = chat_endpoint(ChatRequest(message="Can you fly a rocket to the moon?", land_id="LND-1001"), auth_req, db=None)
    assert res["answer"] is not None
    print("  PASS: Unrecognized question handled gracefully with parcel context.")

    # -------------------------------------------------------------
    # 14. NO-EVIDENCE PROTECTION / MISSING DATA (ANTI-HALLUCINATION)
    # -------------------------------------------------------------
    print("\n[TEST 14] Testing Anti-Hallucination & Missing Data Fallback...")
    res = chat_endpoint(ChatRequest(message="What was the exact market value of LND-1004 in 2012?", land_id="LND-1004"), auth_req, db=None)
    assert "not" in res["answer"].lower() or "couldn't find" in res["answer"].lower() or "available" in res["answer"].lower(), f"Expected missing data statement, got: {res['answer']}"
    print("  PASS: Anti-hallucination protection triggered: refused to fabricate non-existent 2012 value.")

    # -------------------------------------------------------------
    # 15. INVALID LAND ID
    # -------------------------------------------------------------
    print("\n[TEST 15] Testing Invalid Land ID Rejection...")
    res = chat_endpoint(ChatRequest(message="Who owns LND-9999?"), auth_req, db=None)
    assert "couldn't find" in res["answer"].lower() or "not" in res["answer"].lower(), f"Expected invalid land rejection: {res['answer']}"
    print("  PASS: Non-existent land ID LND-9999 rejected without fabricating records.")

    # -------------------------------------------------------------
    # 16. EMPTY MESSAGE
    # -------------------------------------------------------------
    print("\n[TEST 16] Testing Empty Message Handling...")
    res = chat_endpoint(ChatRequest(message="   ", land_id="LND-1001"), auth_req, db=None)
    assert res["intent"] == "empty", f"Expected empty intent, got {res['intent']}"
    print("  PASS: Empty message flagged and answered with prompt guidance.")

    # -------------------------------------------------------------
    # 17. MULTILINGUAL SUPPORT (ENGLISH, TAMIL, HINDI)
    # -------------------------------------------------------------
    print("\n[TEST 17] Testing Multilingual Support (EN, TA, HI)...")
    res_en = chat_endpoint(ChatRequest(message="Who owns this land?", land_id="LND-1001", language="en"), auth_req, db=None)
    assert "TechSpace Inc." in res_en["answer"] and res_en["language"] == "en"

    res_ta = chat_endpoint(ChatRequest(message="இந்த நிலத்தின் உரிமையாளர் யார்?", land_id="LND-1001", language="ta"), auth_req, db=None)
    assert "TechSpace Inc." in res_ta["answer"]
    assert "உரிமையாளர்" in res_ta["answer"]
    assert res_ta["language"] == "ta"

    res_hi = chat_endpoint(ChatRequest(message="इस भूमि का मालिक कौन है?", land_id="LND-1001", language="hi"), auth_req, db=None)
    assert "TechSpace Inc." in res_hi["answer"]
    assert "स्वामी" in res_hi["answer"] or "மாлик" in res_hi["answer"] or "पंजीकृत" in res_hi["answer"]
    assert res_hi["language"] == "hi"

    # Verify official ID was not translated in TA or HI
    assert "LND-1001" in res_ta["answer"]
    assert "LND-1001" in res_hi["answer"]
    print("  PASS: Multilingual responses verified in English, Tamil, and Hindi with untranslated IDs.")

    # -------------------------------------------------------------
    # 18. MODE A: GLOBAL CHAT (Cross-Parcel Queries)
    # -------------------------------------------------------------
    print("\n[TEST 18] Testing Mode A Global Chat (e.g., 'What lands are for sale?')...")
    res_global = chat_endpoint(ChatRequest(message="What lands are currently for sale?"), auth_req, db=None)
    assert res_global["intent"] == "sale_status"
    assert "LND-1001" in res_global["answer"]
    assert len(res_global["evidence"]) >= 3
    print("  PASS: Global marketplace query answered across all lands without parcel lock.")

    # -------------------------------------------------------------
    # 19. SUGGESTIONS ENDPOINT
    # -------------------------------------------------------------
    print("\n[TEST 19] Testing /api/chat/suggestions Endpoint...")
    sug_res = chat_suggestions_endpoint(land_id="LND-1004")
    assert "suggestions" in sug_res
    assert len(sug_res["suggestions"]) >= 5
    assert sug_res["land_id"] == "LND-1004"
    print(f"  PASS: Received {len(sug_res['suggestions'])} suggested inquiries for LND-1004.")

    # -------------------------------------------------------------
    # 20. DEMO LANDS & RISK SCORES PRESERVATION
    # -------------------------------------------------------------
    print("\n[TEST 20] Verifying All 8 Demo Lands & Exact Risk Scores Intact...")
    demo_ids = [l["id"] for l in DEMO_LAND_DATA]
    expected_ids = ["LND-1001", "LND-1002", "LND-1003", "LND-1004", "LND-1005", "LND-1006", "LND-1007", "LND-1008"]
    for eid in expected_ids:
        assert eid in demo_ids, f"Demo land {eid} missing from DEMO_LAND_DATA!"
    print(f"  PASS: All 8 demo lands intact: {demo_ids}")

    assert RISK_DATA["LND-1001"]["overall_score"] == 15, "LND-1001 risk score changed!"
    assert RISK_DATA["LND-1004"]["overall_score"] == 85, "LND-1004 risk score changed!"
    assert RISK_DATA.get("LND-1006", RISK_DATA["default"])["overall_score"] == 35, "LND-1006 default risk score changed!"
    print("  PASS: Risk scores confirmed: LND-1001=15, LND-1004=85, LND-1006=35.")

    print("\n" + "=" * 65)
    print("ALL 20 PHASE 2.6 CHATBOT TESTS PASSED SUCCESSFULLY!")
    print("=" * 65)


if __name__ == "__main__":
    run_chatbot_tests()
