import os
import sys
from pathlib import Path

_BACKEND_DIR = str(Path(__file__).resolve().parent)
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from starlette.requests import Request
from fastapi import HTTPException

from main import (
    DEMO_LAND_DATA,
    login_endpoint, register_endpoint, get_current_user_profile,
    logout_endpoint, get_demo_accounts_info,
    LoginRequest, RegisterRequest,
    get_land_anomalies, get_land_evidence, get_land_risk_breakdown,
    get_intelligent_alerts, get_land_passport, get_land_story,
    ask_land_ai, AskQuery, get_lands
)
from auth_helpers import DEMO_PASSWORD, hash_password, verify_password, decode_access_token

def mock_request(token: str = None) -> Request:
    headers = []
    if token:
        headers.append((b"authorization", f"Bearer {token}".encode()))
    return Request({"type": "http", "headers": headers})

def run_tests():
    print("=" * 65)
    print("LANDTRACE360 PHASE 2.5 AUTHENTICATION & REGRESSION TEST SUITE")
    print("=" * 65)

    # 1. TEST DEMO ACCOUNTS AND PASSWORDS
    print("\n[TEST 1] Verifying Demo Accounts & Passwords...")
    demo_info = get_demo_accounts_info()
    assert "accounts" in demo_info and len(demo_info["accounts"]) == 3
    print("  PASS: Demo accounts metadata endpoint functional.")

    roles_tested = {}
    for acc in demo_info["accounts"]:
        role = acc["role"]
        email = acc["email"]
        pwd = acc["password"]

        res = login_endpoint(LoginRequest(email=email, password=pwd), db=None)
        assert "token" in res and res["token"] is not None
        assert "user" in res
        u = res["user"]
        assert u["email"] == email
        assert u["role"] == role
        assert "hashed_password" not in u
        assert "salt" not in u
        roles_tested[role] = res["token"]
        print(f"  PASS: Logged in as {acc['role_label']} ({email}) -> Token issued, Role: {role}")

    assert set(roles_tested.keys()) == {"owner", "buyer", "investigator"}, "Not all 3 roles tested!"

    # 2. TEST INVALID LOGIN ATTEMPTS
    print("\n[TEST 2] Testing Invalid Login Rejections...")
    # Wrong password
    try:
        login_endpoint(LoginRequest(email="owner@landtrace360.demo", password="WrongPassword999!"), db=None)
        assert False, "Should have raised 401 on wrong password"
    except HTTPException as e:
        assert e.status_code == 401
        print("  PASS: Rejected incorrect password with 401.")

    # Non-existent user
    try:
        login_endpoint(LoginRequest(email="nobody@landtrace360.demo", password=DEMO_PASSWORD), db=None)
        assert False, "Should have raised 401 on non-existent user"
    except HTTPException as e:
        assert e.status_code == 401
        print("  PASS: Rejected non-existent user with 401.")

    # 3. TEST REGISTRATION FLOW
    print("\n[TEST 3] Testing User Registration...")
    reg_email = "newuser.test@landtrace360.demo"
    reg_res = register_endpoint(RegisterRequest(
        full_name="Vikramaditya Roy",
        email=reg_email,
        password="ValidPassword123!",
        role="investigator"
    ), db=None)

    assert "token" in reg_res
    new_u = reg_res["user"]
    assert new_u["email"] == reg_email
    assert new_u["full_name"] == "Vikramaditya Roy"
    assert new_u["role"] == "investigator"
    assert "hashed_password" not in new_u
    print("  PASS: New user registered successfully.")

    # Test Duplicate Email Rejection
    try:
        register_endpoint(RegisterRequest(
            full_name="Duplicate Attempt",
            email=reg_email,
            password="AnotherPassword123!",
            role="buyer"
        ), db=None)
        assert False, "Should have rejected duplicate email registration"
    except HTTPException as e:
        assert e.status_code == 400
        print("  PASS: Rejected duplicate registration with 400.")

    # Test Login with newly registered user
    new_login = login_endpoint(LoginRequest(email=reg_email, password="ValidPassword123!"), db=None)
    assert new_login["user"]["email"] == reg_email
    print("  PASS: Successfully logged in with newly registered account.")

    # 4. TEST TOKEN VERIFICATION (/api/auth/me) & REFRESH SIMULATION
    print("\n[TEST 4] Testing /api/auth/me (Session Recovery & Page Refresh)...")
    investigator_token = roles_tested["investigator"]
    req = mock_request(investigator_token)
    me_res = get_current_user_profile(req, db=None)
    assert me_res["authenticated"] is True
    assert me_res["user"]["role"] == "investigator"
    assert me_res["user"]["email"] == "investigator@landtrace360.demo"
    print("  PASS: /api/auth/me restored session accurately from Bearer token.")

    # Test Missing / Tampered Token
    try:
        get_current_user_profile(mock_request("fake.invalid.token"), db=None)
        assert False, "Should reject invalid token"
    except HTTPException as e:
        assert e.status_code == 401
        print("  PASS: Rejected invalid token with 401.")

    try:
        get_current_user_profile(mock_request(None), db=None)
        assert False, "Should reject unauthenticated request"
    except HTTPException as e:
        assert e.status_code == 401
        print("  PASS: Rejected unauthenticated request with 401.")

    # 5. TEST LOGOUT AND TOKEN REVOCATION
    print("\n[TEST 5] Testing Logout & Token Invalidation...")
    buyer_token = roles_tested["buyer"]
    # Before logout
    req_before = mock_request(buyer_token)
    me_before = get_current_user_profile(req_before, db=None)
    assert me_before["authenticated"] is True

    # Logout
    logout_res = logout_endpoint(mock_request(buyer_token))
    assert logout_res["status"] == "logged_out"
    print("  PASS: /api/auth/logout succeeded.")

    # After logout, token must be revoked
    try:
        get_current_user_profile(mock_request(buyer_token), db=None)
        assert False, "Revoked token should not be accepted"
    except HTTPException as e:
        assert e.status_code == 401
        print("  PASS: Revoked token was rejected with 401.")

    # 6. VERIFY LND-1001 THROUGH LND-1008 UNTOUCHED
    print("\n[TEST 6] Verifying All 8 Demo Lands LND-1001 through LND-1008...")
    expected_ids = [f"LND-100{i}" for i in range(1, 9)]
    lands_api = get_lands(db=None)
    api_ids = [l["id"] for l in lands_api]
    for eid in expected_ids:
        assert eid in api_ids, f"Land {eid} missing!"
    print(f"  PASS: All {len(expected_ids)} demo lands verified intact.")

    # 7. VERIFY PHASE 1 & PHASE 2 REMAIN INTACT
    print("\n[TEST 7] Verifying Phase 1 & Phase 2 Features...")
    # Passport & Story
    passp = get_land_passport("LND-1001", db=None)
    assert passp["land_id"] == "LND-1001" and "qr_code_url" in passp
    story_ta = get_land_story("LND-1001", lang="ta", db=None)
    assert len(story_ta["chapters"]) == 8 and story_ta["language"] == "ta"

    # Explainable AI
    ask_res = ask_land_ai("LND-1001", AskQuery(question="Who is the current owner?", language="en"), db=None)
    assert "answer" in ask_res and "why" in ask_res and "evidence" in ask_res

    # Anomaly Detective
    anom_1004 = get_land_anomalies("LND-1004", db=None)
    assert anom_1004["total_anomalies"] >= 5

    # Evidence Explorer
    ev_1001 = get_land_evidence("LND-1001", db=None)
    assert len(ev_1001["findings"]) >= 5

    # Risk Breakdown
    risk_bd = get_land_risk_breakdown("LND-1001", db=None)
    assert len(risk_bd["dimensions"]) == 8

    # Intelligent Alerts
    alerts = get_intelligent_alerts(db=None)
    assert len(alerts) > 0

    print("  PASS: Phase 1 & Phase 2 features verified 100% operational.")

    print("\n" + "=" * 65)
    print("ALL PHASE 2.5 TESTS PASSED SUCCESSFULLY!")
    print("=" * 65)

if __name__ == "__main__":
    run_tests()
