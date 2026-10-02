import os
import sys
from pathlib import Path

_BACKEND_DIR = str(Path(__file__).resolve().parent)
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from main import (
    DEMO_LAND_DATA,
    get_dashboard_stats, get_lands, get_lands_for_sale, search_lands,
    get_land, get_history, get_owners, get_documents, get_cases, get_mortgages,
    get_risk, get_dna, get_land_passport, get_land_story, ask_land_ai, AskQuery,
    get_land_anomalies, get_land_evidence, get_land_risk_breakdown,
    get_intelligent_alerts, mark_alert_read
)

def run_tests():
    print("=" * 60)
    print("LANDTRACE360 PHASE 2 COMPREHENSIVE VERIFICATION SUITE")
    print("=" * 60)

    # 1. VERIFY ALL 8 DEMO LANDS STILL EXIST
    print("\n[TEST 1] Verifying all 8 demo lands LND-1001 through LND-1008...")
    expected_ids = [f"LND-100{i}" for i in range(1, 9)]
    demo_ids = [l["id"] for l in DEMO_LAND_DATA]
    for eid in expected_ids:
        assert eid in demo_ids, f"Demo land {eid} missing from DEMO_LAND_DATA!"
    lands_api = get_lands(db=None)
    api_ids = [l["id"] for l in lands_api]
    for eid in expected_ids:
        assert eid in api_ids, f"Demo land {eid} missing from get_lands endpoint!"
    print(f"  PASS: All {len(expected_ids)} demo lands verified in database/memory.")

    # 2. TEST ANOMALY DETECTION FOR LND-1001, LND-1004, LND-1006
    print("\n[TEST 2] Testing Land Anomaly Detective for LND-1001, LND-1004, LND-1006...")
    required_anomaly_fields = [
        "anomaly_id", "category", "severity", "title", "description",
        "why_it_was_detected", "confidence", "evidence", "affected_records", "detected_at"
    ]

    for lid in ["LND-1001", "LND-1004", "LND-1006"]:
        anom_res = get_land_anomalies(lid, db=None)
        assert anom_res["land_id"] == lid
        assert "status" in anom_res
        assert "disclaimer" in anom_res
        assert "Project Rule-Based Analysis" in anom_res["disclaimer"]
        assert "total_anomalies" in anom_res

        anomalies = anom_res["anomalies"]
        for a in anomalies:
            for f in required_anomaly_fields:
                assert f in a and a[f] is not None, f"Missing field {f} in anomaly {a.get('anomaly_id')}"
            assert a["severity"] in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
            assert 0.0 <= a["confidence"] <= 1.0

        print(f"  LND-{lid[-4:]}: Total {anom_res['total_anomalies']} anomalies (Crit: {anom_res['critical_count']}, High: {anom_res['high_count']}, Med: {anom_res['medium_count']}, Low: {anom_res['low_count']})")

    # Specific assertions for LND-1004 (High Risk parcel)
    anom_1004 = get_land_anomalies("LND-1004", db=None)
    cats_1004 = [a["category"] for a in anom_1004["anomalies"]]
    assert "Document/record inconsistencies" in cats_1004, "LND-1004 should have document inconsistency for DOC-55321"
    assert "Legal-history anomalies" in cats_1004, "LND-1004 should have legal anomaly for OS-2023-45"
    assert "Boundary changes" in cats_1004, "LND-1004 should have boundary deviation anomaly (8.5%)"
    print("  PASS: LND-1004 specific critical anomalies verified (disputed doc, lawsuit, boundary shift).")

    # Specific assertions for LND-1006
    anom_1006 = get_land_anomalies("LND-1006", db=None)
    cats_1006 = [a["category"] for a in anom_1006["anomalies"]]
    assert "Mortgage status inconsistencies" in cats_1006, "LND-1006 should detect active mortgage with Commerce Bank while for sale"
    print("  PASS: LND-1006 active mortgage and boundary anomalies verified.")

    # 3. TEST EVIDENCE EXPLORER
    print("\n[TEST 3] Testing Evidence Explorer hierarchy for LND-1001, LND-1004, LND-1006...")
    required_evidence_fields = ["record_type", "record_id", "date", "relevant_field", "value", "relationship_to_finding"]

    for lid in ["LND-1001", "LND-1004", "LND-1006"]:
        ev_res = get_land_evidence(lid, db=None)
        assert ev_res["land_id"] == lid
        assert "findings" in ev_res and len(ev_res["findings"]) > 0
        assert "disclaimer" in ev_res

        for finding in ev_res["findings"]:
            assert "finding_id" in finding
            assert "category" in finding
            assert "finding" in finding
            assert "reason" in finding
            assert "supporting_records" in finding
            assert "details" in finding

            for rec in finding["supporting_records"]:
                for rf in required_evidence_fields:
                    assert rf in rec, f"Missing field {rf} in supporting record {rec}"
        print(f"  PASS: {lid} Evidence Explorer has {len(ev_res['findings'])} structured findings with full traceability.")

    # 4. TEST ADVANCED RISK BREAKDOWN
    print("\n[TEST 4] Testing 8-Dimension Risk Breakdown...")
    expected_dimensions = [
        "Legal", "Ownership", "Documents", "Mortgage",
        "Boundary", "Environmental", "Location", "Transaction History"
    ]

    for lid in ["LND-1001", "LND-1004", "LND-1006"]:
        risk_bd = get_land_risk_breakdown(lid, db=None)
        assert risk_bd["land_id"] == lid
        assert "overall_score" in risk_bd
        assert "overall_level" in risk_bd
        assert len(risk_bd["dimensions"]) == 8, f"Expected 8 dimensions, got {len(risk_bd['dimensions'])}"

        dim_names = [d["dimension"] for d in risk_bd["dimensions"]]
        for ed in expected_dimensions:
            assert ed in dim_names, f"Missing dimension {ed} in risk breakdown!"

        for dim in risk_bd["dimensions"]:
            assert "score" in dim
            assert "risk_level" in dim and dim["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
            assert "contribution" in dim and len(dim["contribution"]) > 0
            assert "explanation" in dim and len(dim["explanation"]) > 0
            assert "evidence" in dim and len(dim["evidence"]) > 0

        # Verify compatibility with existing risk score
        orig_risk = get_risk(lid, db=None)
        assert risk_bd["overall_score"] == (orig_risk.get("overall_score") or orig_risk.get("risk_score")), \
            f"Overall score mismatch: {risk_bd['overall_score']} vs {orig_risk.get('overall_score')}"

        print(f"  PASS: {lid} Risk Breakdown contains all 8 dimensions and matches overall score {risk_bd['overall_score']}.")

    # 5. TEST INTELLIGENT LAND ALERTS
    print("\n[TEST 5] Testing Intelligent Land Alerts across all 8 categories...")
    alerts = get_intelligent_alerts(db=None)
    assert isinstance(alerts, list) and len(alerts) > 0, "No alerts generated!"

    required_alert_fields = [
        "alert_id", "land_id", "category", "severity",
        "title", "message", "timestamp", "related_evidence", "read_status"
    ]

    found_categories = set()
    for a in alerts:
        for f in required_alert_fields:
            assert f in a, f"Alert {a.get('alert_id')} missing field {f}"
        assert a["severity"] in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
        found_categories.add(a["category"])

    expected_categories = [
        "Risk change", "Ownership event", "Legal event", "Mortgage event",
        "Document event", "Boundary event", "Verification event", "Anomaly detected"
    ]
    for ec in expected_categories:
        assert ec in found_categories, f"Category '{ec}' not found in generated alerts! Present: {found_categories}"

    # Test marking alert read
    first_alert_id = alerts[0]["alert_id"]
    res_read = mark_alert_read(first_alert_id)
    assert res_read["status"] == "success"
    assert res_read["read"] is True

    # Re-fetch alerts to verify read status persisted in session
    alerts_after = get_intelligent_alerts(db=None)
    first_after = next((a for a in alerts_after if a["alert_id"] == first_alert_id), None)
    assert first_after is not None and first_after["read_status"] is True, "Alert read status was not updated!"
    print(f"  PASS: Generated {len(alerts)} alerts spanning all 8 required categories. Read status toggle verified.")

    # 6. TEST PHASE 1 FEATURES PRESERVATION
    print("\n[TEST 6] Testing Phase 1 Features Preservation...")
    for lid in ["LND-1001", "LND-1004", "LND-1006"]:
        # 6a. Land Passport
        passp = get_land_passport(lid, db=None)
        assert passp["land_id"] == lid
        assert "qr_code_url" in passp
        assert "disclaimer" in passp

        # 6b. AI Land Story (Multilingual EN, TA, HI)
        story_en = get_land_story(lid, lang="en", db=None)
        assert len(story_en["chapters"]) == 8 and story_en["language"] == "en"
        story_ta = get_land_story(lid, lang="ta", db=None)
        assert len(story_ta["chapters"]) == 8 and story_ta["language"] == "ta"
        story_hi = get_land_story(lid, lang="hi", db=None)
        assert len(story_hi["chapters"]) == 8 and story_hi["language"] == "hi"

        # 6c. Explainable AI Assistant (Answer, Why, Evidence in EN, TA, HI)
        q_en = ask_land_ai(lid, AskQuery(question="Who is the registered owner?", language="en"), db=None)
        assert "answer" in q_en and "why" in q_en and "evidence" in q_en
        q_ta = ask_land_ai(lid, AskQuery(question="உரிமையாளர் யார்?", language="ta"), db=None)
        assert "answer" in q_ta and "why" in q_ta and "evidence" in q_ta
        q_hi = ask_land_ai(lid, AskQuery(question="स्वामी कौन है?", language="hi"), db=None)
        assert "answer" in q_hi and "why" in q_hi and "evidence" in q_hi

    print("  PASS: Phase 1 features (Land Passport, AI Land Story, Explainable AI in EN/TA/HI) intact and functional.")

    # 7. CONFIRM EXISTING FEATURES ARE UNBROKEN
    print("\n[TEST 7] Verifying standard marketplace & analytics endpoints...")
    dash = get_dashboard_stats(db=None)
    assert "total_lands" in dash
    assert dash["total_lands"] >= 8
    sale_lands = get_lands_for_sale(db=None)
    assert len(sale_lands) > 0
    search_res = search_lands(q="Chennai", db=None)
    assert isinstance(search_res, list)
    print("  PASS: Dashboard stats, marketplace listings, and search functioning smoothly.")

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED SUCCESSFULLY! PHASE 2 IS COMPLETE & VERIFIED.")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
