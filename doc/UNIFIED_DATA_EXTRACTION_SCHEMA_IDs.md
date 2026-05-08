This system is dealing with two document types:

Student ID (institution-issued)
National ID (government-issued)

This system needs:

A unified extraction schema
Document-specific extensions
Strong validation rules (not just OCR dumping text)

This is the base JSON you will always use to return regardless of document type:

1. UNIFIED DATA EXTRACTION SCHEMA (CORE)

{
  "document_type": "STUDENT_ID | NATIONAL_ID",
  "confidence_score": 0.0,

  "personal_info": {
    "full_name": "",
    "first_name": "",
    "middle_name": "",
    "last_name": "",
    "date_of_birth": "YYYY-MM-DD",
    "gender": "Male | Female",
    "nationality": ""
  },

  "document_info": {
    "id_number": "",
    "serial_number": "",
    "issue_date": "YYYY-MM-DD",
    "expiry_date": "YYYY-MM-DD"
  },

  "biometric": {
    "face_detected": true,
    "face_match_score": 0.0
  },

  "raw_text": "",
  "extraction_metadata": {
    "image_quality_score": 0.0,
    "blur_detected": false,
    "tilt_angle": 0.0,
    "glare_detected": false
  }
}

2. STUDENT ID EXTENSION SCHEMA

Extend the base like this:

{
  "document_type": "STUDENT_ID",

  "student_info": {
    "registration_number": "",
    "student_id": "",
    "university_name": "",
    "faculty": "",
    "department": "",
    "year_of_study": "1 | 2 | 3 | 4 | 5"
  },

  "validation_flags": {
    "valid_university_format": true,
    "valid_registration_format": true,
    "is_expired": false
  }
}

3. NATIONAL ID EXTENSION SCHEMA

{
  "document_type": "NATIONAL_ID",

  "national_id_info": {
    "id_number": "",
    "place_of_birth": "",
    "district_of_birth": "",
    "residential_address": ""
  },

  "security_features": {
    "hologram_detected": true,
    "mrz_detected": true,
    "barcode_detected": true,
    "chip_detected": true
  },

  "validation_flags": {
    "valid_id_format": true,
    "is_expired": false,
    "possible_tampering": false
  }
}