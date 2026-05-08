1. WHAT YOU SHOULD EXTRACT (ESSENTIALS ONLY)

You don’t want to extract everything. You want decision-critical data.

🔑 Core Principle:

Extract what affects identity, money, time, and legal responsibility

📦 2. TENANCY AGREEMENT JSON SCHEMA

This will work for:

Custom landlord documents ✅
System-generated agreements ✅
🧾 FULL EXTRACTION SCHEMA
{
  "document_type": "TENANCY_AGREEMENT",
  "document_ref": "KN-TA-2025-2963",
  "version": "2.4",

  "parties": {
    "landlord": {
      "name": "Kibabii Nest Management",
      "phone": "+254769729129",
      "email": "admin@kibabiinest.co.ke",
      "address": "ACK Road, Kibabii",
      "is_verified_entity": true
    },
    "tenant": {
      "full_name": "",
      "student_id": "",
      "university": "",
      "phone": "",
      "email": "",
      "emergency_contact": ""
    }
  },

  "property": {
    "property_name": "Kibabii Orange House",
    "room_number": "",
    "property_ref": "LR/TUUTI-B0465"
  },

  "lease": {
    "start_date": "",
    "end_date": "",
    "academic_year": "2025/2026",
    "duration_months": 0
  },

  "financials": {
    "monthly_rent": 0,
    "security_deposit": 0,
    "admin_fee": 0,
    "utilities_estimate": 0,
    "total_due_at_signing": 0,
    "rent_due_day": 5,
    "late_fee": 500,
    "late_fee_trigger_day": 10
  },

  "payment_methods": {
    "mpesa_paybill": "522522",
    "mpesa_account_format": "KIBABII-[RoomNo]",
    "bank_name": "KCB Bungoma",
    "cash_allowed": true
  },

  "rules_summary": {
    "quiet_hours": "22:00-06:00",
    "visitor_hours": "08:00-21:00",
    "overnight_guests_allowed": false,
    "smoking_allowed": false,
    "alcohol_allowed": false
  },

  "obligations": {
    "tenant_must_pay_rent": true,
    "no_subletting": true,
    "must_report_damage": true,
    "landlord_must_maintain_property": true,
    "deposit_refund_days": 30
  },

  "termination": {
    "notice_period_days": 30,
    "early_termination_penalty": "1_month_rent",
    "eviction_trigger_days": 30
  },

  "signatures": {
    "tenant_signed": false,
    "tenant_name": "",
    "tenant_signed_at": "",
    "landlord_signed": true,
    "landlord_name": "Alex Thompson Wanyonyi",
    "signature_method": "digital"
  },

  "verification": {
    "qr_present": true,
    "verification_url": "verify.kibabiinest.co.ke",
    "document_hash": "",
    "timestamp": "2026-05-06T16:06:58",
    "tamper_detected": false
  },

  "extraction_metadata": {
    "confidence_score": 0.0,
    "missing_fields": [],
    "inconsistencies": []
  }
}
⚙️ 3. VALIDATION RULES
✅ A. PARTY VALIDATION
if tenant.full_name == null → reject
if tenant.student_id does not match system → reject

💡 Connect this to your student ID verification pipeline
→ That’s how you prevent fake tenants

✅ B. LEASE VALIDATION
if start_date >= end_date → invalid
if duration_months < 1 → invalid
if academic_year != system_current_academic_year → flag
✅ C. FINANCIAL VALIDATION
if monthly_rent <= 0 → reject
if security_deposit < monthly_rent → flag
if total_due_at_signing != (deposit + admin_fee + rent)
→ inconsistency
✅ D. PAYMENT FRAUD PREVENTION

This is critical in Kenya (M-Pesa abuse risk):

if mpesa_paybill/till number isnot in approved_landlord_accounts → reject
if mpesa-account_number isnot in approved_landlord_accounts → reject
if mpesa_account_format missing → flag
if bank settlement account number isnot in approved_landlord_accounts → reject

✅ E. SIGNATURE VALIDATION (VERY IMPORTANT)
if tenant_signed == false → booking cannot proceed
if tenant_name != extracted_name → reject
✅ F. TIMESTAMP VALIDATION
if timestamp > now → invalid
if timestamp < (now - 2 years) → flag as stale
✅ G. DOCUMENT AUTHENTICITY
if qr_present == false AND document_hash == null
→ high fraud risk
✅ H. RULE CONSISTENCY CHECK (SMART VALIDATION)

Example:

if overnight_guests_allowed == true
AND rules_summary contradicts
→ inconsistency flag
🧠 4. HANDLING CUSTOM LANDLORD DOCUMENTS (YOUR HARD CASE)

This is where most systems break.

Strategy:
Step 1: AI Classification
document_type = detect("tenancy agreement")
Step 2: Semantic Mapping (NOT just OCR)

Example:

Raw Text	Map To
"Rent payable monthly"	monthly_rent
"Deposit equal to one month"	security_deposit
"Lease period"	lease.start_date / end_date
Step 3: Confidence Scoring per Field
{
  "monthly_rent": {
    "value": 6500,
    "confidence": 0.91
  }
}
Step 4: Missing Critical Fields
if monthly_rent missing → reject
if tenant_name missing → reject
if lease_dates missing → reject
🔥 5. WHAT IS “CRITICAL” VS “OPTIONAL”
🔴 MUST HAVE (Reject if missing)
Tenant Name
Landlord Name
Property Name / Ref
Lease Dates
Monthly Rent
Signature block
🟡 SHOULD HAVE (Flag if missing)
Deposit
Payment method
Rules summary
🟢 NICE TO HAVE
Maintenance clauses
Visitor policies
📱 6. REAL APP FLOW (FOR YOUR SYSTEM)
OPTION 1: Custom Upload
Upload document
OCR + AI parsing
Extract → JSON
Validate
Show structured preview to student
Student signs
OPTION 2: System Generated

Skip OCR → directly structured → higher trust

🚨 HARD TRUTH

If you don’t enforce:

Field validation
Signature validation
Payment verification

👉 Your platform becomes a fraud marketplace