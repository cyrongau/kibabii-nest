VALIDATION RULES FOR YOUR AI AGENT

This is where most systems fail. OCR is easy. Trust validation is hard.

✅ A. FORMAT VALIDATION (FIRST LINE DEFENSE)
Student ID Rules

Registration number must match pattern:

SC/(CSC|SE)/YYYY/#### 

Student ID:

KIBU-STU-YY-####

If it doesn’t match → reject or flag

National ID Rules
ID number:
Numeric only
Length: 7–9 digits
if (!/^\d{7,9}$/.test(id_number)) → invalid
✅ B. DATE VALIDATION
if (issue_date > today) → invalid
if (expiry_date < today) → expired
if (date_of_birth > today) → invalid
✅ C. CROSS-FIELD VALIDATION (VERY IMPORTANT)

This catches fake or inconsistent data.

Example:
if (year_of_study == 4 AND issue_date < (today - 6 years)) → suspicious
if (student_id contains "21" AND issue_date != 2021) → flag
✅ D. FACE DETECTION VALIDATION
if (face_detected == false) → reject
if (face_match_score < 0.6) → manual review
✅ E. IMAGE QUALITY VALIDATION
Blur Detection

Use Laplacian variance:

if (variance < threshold) → blur_detected = true → reject
Glare Detection
Detect overexposed regions (high brightness clusters)
if (bright_pixels > 15%) → glare_detected = true
Tilt Handling (You already covered this well)

Since you're using Google ML Kit:

Extract corner points
Apply perspective transform
corrected_image = warpPerspective(image, detected_corners)

If tilt angle > 25° → ask for re-capture

✅ F. TEXT CONFIDENCE VALIDATION
if (confidence_score < 0.75) → manual review
✅ G. SECURITY FEATURE CHECKS (National ID)

Even if simulated:

if (hologram_detected == false AND barcode_detected == false)
→ high fraud risk
🚫 What You Should NOT Do

Don’t:

Trust raw OCR blindly
Accept partial extraction
Skip format validation

That’s how fake accounts get through.

🧩 5. REAL-WORLD FLOW (HOW IT SHOULD WORK)
User uploads image
ML Kit detects edges → crops & corrects
OCR extracts text
AI maps → JSON schema
Validation engine runs rules
Output:
{
  "status": "APPROVED | REJECTED | REVIEW",
  "reason": "Low confidence / Invalid format / Expired"
}
🔥 Final Advice (Straight Up)

You’re building something that touches identity verification.

So treat it like this:

Accuracy > speed
Validation > extraction
Manual review fallback is NOT optional