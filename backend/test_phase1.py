import os
import sys
import main
from main import (
    DEMO_LAND_DATA, _build_land_passport, _build_land_story, ask_land_ai, AskQuery
)

print('=== 1. VERIFY 8 DEMO LANDS ===')
expected_lands = [f'LND-100{i}' for i in range(1, 9)]
existing_ids = [l['id'] for l in DEMO_LAND_DATA]
assert all(el in existing_ids for el in expected_lands), f'Missing demo lands! Found: {existing_ids}'
print(f'All 8 demo lands present: {expected_lands}')

print('\n=== 2. VERIFY LAND PASSPORT FOR LND-1001 & LND-1006 ===')
for lid in ['LND-1001', 'LND-1006']:
    p = _build_land_passport(lid)
    required_keys = [
        'land_id', 'survey_number', 'subdivision', 'location', 'current_owner',
        'land_type', 'area_sqft', 'verification_status', 'risk_score',
        'land_dna_score', 'legal_status', 'mortgage_status', 'document_status',
        'last_updated', 'passport_generated_at', 'qr_code_url', 'disclaimer'
    ]
    for k in required_keys:
        assert k in p and p[k] is not None, f'Missing passport key {k} in {lid}'
    assert 'Not an Official Government Land Record' in p['disclaimer']
    print(f'Passport for {lid}:')
    print(f"  Owner: {p['current_owner']}, Survey: {p['survey_number']}, Risk: {p['risk_score']}, DNA: {p['land_dna_score']}")
    print(f"  Legal: {p['legal_status']}, Mortgage: {p['mortgage_status']}")
    print(f"  QR: {p['qr_code_url']}")
    print(f"  Disclaimer: {p['disclaimer']}")

print('\n=== 3. VERIFY AI LAND STORY FOR LND-1001 & LND-1006 ===')
for lid in ['LND-1001', 'LND-1006']:
    for lang in ['en', 'ta', 'hi']:
        s = _build_land_story(lid, lang=lang)
        assert len(s['chapters']) == 8, f'Expected 8 chapters in story, got {len(s["chapters"])}'
        assert 'AI-generated summary' in s['disclaimer']
        for ch in s['chapters']:
            assert 'step' in ch and 'stage' in ch and 'summary' in ch and 'evidence' in ch
            assert ch['summary'], f'Empty summary in chapter {ch["key"]}'
            assert ch['evidence'] is not None, f'Missing evidence in chapter {ch["key"]}'
        print(f"Story for {lid} ({lang}): 8 stages generated with evidence. Title: {s['title']}")

print('\n=== 4. VERIFY EXPLAINABLE AI (ANSWER, WHY, EVIDENCE) ===')
# Test owner question (EN)
q_owner = AskQuery(question='Who is the owner of this property?', language='en')
res_owner = ask_land_ai('LND-1001', q_owner, None)
assert 'answer' in res_owner and 'why' in res_owner and 'evidence' in res_owner
assert 'TechSpace Inc.' in res_owner['answer']
print('Owner Query (EN):')
print('  Answer:', res_owner['answer'])
print('  Why:', res_owner['why'])
print('  Evidence count:', len(res_owner['evidence']))

# Test mortgage question (TA)
q_mort = AskQuery(question='Does this land have a mortgage?', language='ta')
res_mort = ask_land_ai('LND-1001', q_mort, None)
print('Mortgage Query (TA):')
print('  Answer:', res_mort['answer'])
print('  Why:', res_mort['why'])
print('  Evidence count:', len(res_mort['evidence']))

# Test high risk question (HI)
q_risk = AskQuery(question='Why is this land considered high risk?', language='hi')
res_risk = ask_land_ai('LND-1002', q_risk, None)
print('Risk Query (HI):')
print('  Answer:', res_risk['answer'])
print('  Why:', res_risk['why'])
print('  Evidence count:', len(res_risk['evidence']))

# Test unknown land / missing evidence explicit message
q_unknown = AskQuery(question='Tell me about ownership', language='en')
res_unknown = ask_land_ai('LND-9999', q_unknown, None)
assert 'No supporting record is available' in res_unknown['evidence'][0]['value']
print('Non-existent Land Fallback Evidence Check: Passed!')

print('\nALL PHASE 1 BACKEND VERIFICATIONS SUCCEEDED!')
