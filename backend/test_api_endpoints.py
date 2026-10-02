import os
import sys

from main import (
    get_dashboard_stats, get_lands, get_lands_for_sale, search_lands,
    get_land, get_history, get_owners, get_documents, get_cases, get_mortgages,
    get_risk, get_dna, get_land_passport, get_land_story, ask_land_ai, AskQuery
)

def test_endpoints():
    print("Testing core endpoint handlers directly...")
    
    # Dashboard
    dash = get_dashboard_stats(db=None)
    assert dash is not None and "total_lands" in dash
    print("  get_dashboard_stats: OK ->", dash)
    
    # Lands list
    lands = get_lands(db=None)
    assert len(lands) >= 8, f"Expected at least 8 lands, got {len(lands)}"
    print(f"  get_lands: OK ({len(lands)} lands)")
    
    # Lands for sale
    sale = get_lands_for_sale(db=None)
    assert isinstance(sale, list)
    print(f"  get_lands_for_sale: OK ({len(sale)} for sale)")
    
    # Search
    search_res = search_lands(q="LND-1001", db=None)
    assert len(search_res) > 0 and search_res[0]["id"] == "LND-1001"
    print("  search_lands: OK")
    
    # Land Profile endpoints for LND-1001 & LND-1006
    for lid in ["LND-1001", "LND-1006"]:
        land = get_land(lid, db=None)
        assert land["id"] == lid
        hist = get_history(lid, db=None)
        assert len(hist) > 0
        owners = get_owners(lid, db=None)
        assert len(owners) > 0
        docs = get_documents(lid, db=None)
        assert isinstance(docs, list)
        cases = get_cases(lid, db=None)
        assert isinstance(cases, list)
        mort = get_mortgages(lid, db=None)
        assert isinstance(mort, list)
        risk = get_risk(lid, db=None)
        assert "overall_score" in risk
        dna = get_dna(lid, db=None)
        assert "overall_health" in dna
        
        # Land Passport
        passp = get_land_passport(lid, db=None)
        assert passp["land_id"] == lid
        assert "disclaimer" in passp
        assert "Demo / Synthetic Project Data" in passp["disclaimer"]
        
        # AI Land Story
        story_en = get_land_story(lid, lang="en", db=None)
        assert len(story_en["chapters"]) == 8
        story_ta = get_land_story(lid, lang="ta", db=None)
        assert len(story_ta["chapters"]) == 8 and story_ta["language"] == "ta"
        story_hi = get_land_story(lid, lang="hi", db=None)
        assert len(story_hi["chapters"]) == 8 and story_hi["language"] == "hi"
        
        print(f"  Handlers for {lid} (details, hist, docs, cases, mort, risk, dna, passport, story [en,ta,hi]): ALL OK")

    # Ask endpoint
    ask_payloads = [
        ("Who owns this land?", "en"),
        ("Does this land have a mortgage?", "ta"),
        ("Why is this land considered high risk?", "hi")
    ]
    for q_txt, lang in ask_payloads:
        q = AskQuery(question=q_txt, language=lang)
        res = ask_land_ai("LND-1001", q, db=None)
        assert "answer" in res and "why" in res and "evidence" in res
        print(f"  ask_land_ai ('{q_txt[:25]}...', {lang}): OK")

    print("\nALL HANDLERS VERIFIED SUCCESSFULLY WITHOUT ERRORS!")

if __name__ == "__main__":
    test_endpoints()
