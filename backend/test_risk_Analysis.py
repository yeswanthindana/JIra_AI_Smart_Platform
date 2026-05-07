from app.services.risk_analyzer import analyze_risk

ticket = """
frames folder path
"""

result = analyze_risk(ticket)

print(result)