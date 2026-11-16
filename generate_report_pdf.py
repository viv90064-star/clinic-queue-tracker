#!/usr/bin/env python3
"""
Generates a clean, print-ready 9-page PDF: Clinic_Queue_Final_MVP_Report.pdf
Using pure Python with standard PDF-1.4 format (no external libraries needed).
"""

import sys

def escape_pdf(text):
    cleaned = (
        text.replace('—', '--')
        .replace('–', '-')
        .replace('“', '"')
        .replace('”', '"')
        .replace('’', "'")
        .replace('‘', "'")
        .replace('•', '*')
        .replace('✔', '[PASS]')
        .replace('🎉', '')
        .replace('🔔', '')
        .replace('⚠️', '')
        .replace('👉', '->')
    )
    # Ensure all characters are strictly ascii
    ascii_clean = cleaned.encode('ascii', errors='replace').decode('ascii')
    return ascii_clean.replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)')

class PDFGenerator:
    def __init__(self, filename):
        self.filename = filename
        self.pages = []
        self.width = 595.28  # A4 width in points
        self.height = 841.89 # A4 height in points

    def add_page(self):
        page_stream = []
        self.pages.append(page_stream)
        return page_stream

    def draw_text(self, stream, x, y, text, font="F1", size=10, r=0, g=0, b=0):
        safe_text = escape_pdf(text)
        stream.append(f"{r} {g} {b} rg BT /{font} {size} Tf {x:.2f} {y:.2f} Td ({safe_text}) Tj ET")

    def draw_rect(self, stream, x, y, w, h, fill_rgb=None, stroke_rgb=None, line_width=1):
        cmds = []
        cmds.append(f"{line_width} w")
        if stroke_rgb:
            cmds.append(f"{stroke_rgb[0]} {stroke_rgb[1]} {stroke_rgb[2]} RG")
        if fill_rgb:
            cmds.append(f"{fill_rgb[0]} {fill_rgb[1]} {fill_rgb[2]} rg")
        cmds.append(f"{x:.2f} {y:.2f} {w:.2f} {h:.2f} re")
        if fill_rgb and stroke_rgb:
            cmds.append("B")
        elif fill_rgb:
            cmds.append("f")
        elif stroke_rgb:
            cmds.append("S")
        stream.append(" ".join(cmds))

    def draw_line(self, stream, x1, y1, x2, y2, rgb=(0.75, 0.8, 0.85), line_width=1):
        stream.append(f"{rgb[0]} {rgb[1]} {rgb[2]} RG {line_width} w {x1:.2f} {y1:.2f} m {x2:.2f} {y2:.2f} l S")

    def add_running_header_footer(self, stream, page_num):
        if page_num == 1:
            return # Cover page has no running header/footer
        # Running Header
        self.draw_text(stream, 40, 805, "MSOT  |  PRODUCT DEVELOPMENT", font="F2", size=8.5, r=0.3, g=0.4, b=0.5)
        self.draw_text(stream, 380, 805, "CLINIC QUEUE TRACKING SYSTEM", font="F2", size=8.5, r=0.3, g=0.4, b=0.5)
        self.draw_line(stream, 40, 798, 555, 798, rgb=(0.75, 0.8, 0.85), line_width=1)
        
        # Running Footer
        self.draw_line(stream, 40, 42, 555, 42, rgb=(0.8, 0.85, 0.9), line_width=0.8)
        self.draw_text(stream, 40, 30, "Candidate: Vivek Kumar  |  Roll: 2602028  |  Enrollment: 0201260028", font="F1", size=8.5, r=0.35, g=0.4, b=0.45)
        self.draw_text(stream, 510, 30, f"Page {page_num} of 9", font="F2", size=8.5, r=0.2, g=0.3, b=0.4)

    def draw_section_heading(self, stream, y, title):
        self.draw_text(stream, 40, y, title.upper(), font="F2", size=14, r=0.06, g=0.1, b=0.2)
        self.draw_line(stream, 40, y - 5, 555, y - 5, rgb=(0.06, 0.1, 0.2), line_width=1.5)
        return y - 22

    def draw_sub_heading(self, stream, y, title):
        self.draw_text(stream, 40, y, title, font="F2", size=10.5, r=0.1, g=0.18, b=0.32)
        return y - 16

    def save(self):
        pdf = bytearray()
        pdf.extend(b"%PDF-1.4\n")

        offsets = []
        num_pages = len(self.pages)
        
        # We will create objects:
        # 1: Catalog
        # 2: Pages container
        # 3: Helvetica
        # 4: Helvetica-Bold
        # 5: Helvetica-Oblique
        # 6 .. 5+num_pages: Page objects
        # 6+num_pages .. 5+2*num_pages: Content stream objects

        base_obj_count = 5
        page_obj_ids = [base_obj_count + 1 + i for i in range(num_pages)]
        stream_obj_ids = [base_obj_count + 1 + num_pages + i for i in range(num_pages)]

        # 1: Catalog
        offsets.append(len(pdf))
        pdf.extend(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")

        # 2: Pages
        kids_str = " ".join([f"{pid} 0 R" for pid in page_obj_ids])
        offsets.append(len(pdf))
        pdf.extend(f"2 0 obj\n<< /Type /Pages /Kids [{kids_str}] /Count {num_pages} >>\nendobj\n".encode("latin-1"))

        # 3: Helvetica
        offsets.append(len(pdf))
        pdf.extend(b"3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")

        # 4: Helvetica-Bold
        offsets.append(len(pdf))
        pdf.extend(b"4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n")

        # 5: Helvetica-Oblique
        offsets.append(len(pdf))
        pdf.extend(b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>\nendobj\n")

        # Page Objects
        for i in range(num_pages):
            pid = page_obj_ids[i]
            sid = stream_obj_ids[i]
            offsets.append(len(pdf))
            pdf.extend(f"{pid} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents {sid} 0 R >>\nendobj\n".encode("latin-1"))

        # Content Streams
        for i in range(num_pages):
            sid = stream_obj_ids[i]
            stream_bytes = "\n".join(self.pages[i]).encode("latin-1")
            offsets.append(len(pdf))
            pdf.extend(f"{sid} 0 obj\n<< /Length {len(stream_bytes)} >>\nstream\n".encode("latin-1"))
            pdf.extend(stream_bytes)
            pdf.extend(b"\nendstream\nendobj\n")

        # xref table
        total_objs = len(offsets) + 1
        xref_offset = len(pdf)
        pdf.extend(f"xref\n0 {total_objs}\n0000000000 65535 f \n".encode("latin-1"))
        for off in offsets:
            pdf.extend(f"{off:010d} 00000 n \n".encode("latin-1"))

        pdf.extend(f"trailer\n<< /Size {total_objs} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode("latin-1"))

        with open(self.filename, "wb") as f:
            f.write(pdf)
        print(f"✅ Generated {self.filename} with {num_pages} pages ({len(pdf)} bytes).")

def build_pdf_report():
    doc = PDFGenerator("Clinic_Queue_Final_MVP_Report.pdf")

    # =========================================================================
    # PAGE 1: COVER PAGE
    # =========================================================================
    p1 = doc.add_page()
    doc.add_running_header_footer(p1, 1)

    # University header
    doc.draw_rect(p1, 40, 785, 515, 4, fill_rgb=(0.06, 0.1, 0.2))
    doc.draw_text(p1, 230, 755, "MSOT", font="F2", size=24, r=0.06, g=0.1, b=0.2)
    doc.draw_text(p1, 140, 736, "DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING", font="F2", size=11, r=0.3, g=0.35, b=0.45)
    doc.draw_text(p1, 230, 720, "Academic Session: 2026", font="F1", size=10, r=0.4, g=0.45, b=0.5)

    doc.draw_line(p1, 80, 690, 515, 690, rgb=(0.15, 0.4, 0.85), line_width=2)

    # Project Title
    doc.draw_text(p1, 210, 650, "COURSE PROJECT REPORT", font="F2", size=12, r=0.15, g=0.4, b=0.85)
    doc.draw_text(p1, 75, 615, "CLINIC QUEUE TRACKING SYSTEM", font="F2", size=23, r=0.06, g=0.1, b=0.2)
    doc.draw_text(p1, 125, 590, "Minimum Viable Product (MVP) Final Submission & Usability Validation", font="F3", size=11.5, r=0.25, g=0.3, b=0.4)

    doc.draw_line(p1, 80, 565, 515, 565, rgb=(0.15, 0.4, 0.85), line_width=2)

    # Student Details Box
    doc.draw_rect(p1, 95, 235, 405, 275, fill_rgb=(0.97, 0.98, 0.99), stroke_rgb=(0.75, 0.8, 0.85), line_width=1.5)
    doc.draw_rect(p1, 95, 475, 405, 35, fill_rgb=(0.06, 0.1, 0.2))
    doc.draw_text(p1, 220, 487, "STUDENT CREDENTIALS", font="F2", size=11, r=1, g=1, b=1)

    details = [
        ("Candidate Name:", "Vivek Kumar"),
        ("Roll Number:", "2602028"),
        ("Enrollment Number:", "0201260028"),
        ("Course & Branch:", "B.Tech in Computer Science & Engineering"),
        ("Current Semester:", "1st Semester"),
        ("Academic Subject:", "Product Development"),
        ("Institution:", "MSOT"),
        ("Project Repository:", "https://github.com/viv90064-star/clinic-queue-tracker"),
        ("Production Web URL:", "https://clinic-queue-tracker-a3b1b.web.app"),
        ("Date of Submission:", "November 17, 2026")
    ]

    y_pos = 450
    for label, val in details:
        doc.draw_text(p1, 115, y_pos, label, font="F2", size=9.5, r=0.25, g=0.3, b=0.4)
        doc.draw_text(p1, 240, y_pos, val, font="F1", size=9.5, r=0.06, g=0.1, b=0.2)
        y_pos -= 21

    doc.draw_text(p1, 115, 120, "Submitted in partial fulfillment of the requirements for the course Product Development.", font="F3", size=9, r=0.4, g=0.45, b=0.5)
    doc.draw_rect(p1, 40, 55, 515, 4, fill_rgb=(0.06, 0.1, 0.2))

    # =========================================================================
    # PAGE 2: LIVE MVP AND GITHUB LINKS
    # =========================================================================
    p2 = doc.add_page()
    doc.add_running_header_footer(p2, 2)
    y = doc.draw_section_heading(p2, 770, "1. Live MVP and Verified GitHub Links")

    doc.draw_rect(p2, 40, y - 28, 515, 34, fill_rgb=(0.93, 0.96, 1.0), stroke_rgb=(0.2, 0.45, 0.85), line_width=1)
    doc.draw_text(p2, 50, y - 10, "VERIFIED DEPLOYED SYSTEM: The complete web MVP is deployed live on Google Cloud Firebase Hosting.", font="F2", size=9.5, r=0.1, g=0.3, b=0.7)
    doc.draw_text(p2, 50, y - 22, "Both patient and receptionist portals are operational with active Cloud Firestore persistence.", font="F1", size=9, r=0.2, g=0.25, b=0.3)
    y -= 46

    # Links Table
    links_data = [
        ("Public Web Application URL:", "https://clinic-queue-tracker-a3b1b.web.app", "Main patient lookup and queue status"),
        ("Alternative Hosting Domain:", "https://clinic-queue-tracker-a3b1b.firebaseapp.com", "Secondary Firebase global SSL domain"),
        ("Receptionist Portal URL:", "https://clinic-queue-tracker-a3b1b.web.app/reception.html", "Staff portal (reception@clinic.com / clinic123)"),
        ("Verified GitHub Repository:", "https://github.com/viv90064-star/clinic-queue-tracker", "Full source code, 9 commits, and build log"),
        ("Clickable Figma Prototype:", "https://sip-format-11274582.figma.site/", "Original 4-screen interactive low-fi wireframe")
    ]

    for label, url, desc in links_data:
        doc.draw_rect(p2, 40, y - 36, 515, 38, fill_rgb=(0.98, 0.98, 0.99), stroke_rgb=(0.85, 0.88, 0.92), line_width=1)
        doc.draw_text(p2, 50, y - 12, label, font="F2", size=9.5, r=0.06, g=0.1, b=0.2)
        doc.draw_text(p2, 215, y - 12, url, font="F2", size=9.5, r=0.15, g=0.4, b=0.85)
        doc.draw_text(p2, 50, y - 28, f"Purpose: {desc}", font="F3", size=8.5, r=0.4, g=0.45, b=0.5)
        y -= 46

    y -= 10
    y = doc.draw_sub_heading(p2, y, "Summary of What the Live Website Does")
    
    body_p2 = [
        "The Clinic Queue Tracking System is a mobile-responsive web application designed to solve waiting-time",
        "uncertainty for registered patients at busy outpatient department (OPD) clinics.",
        "",
        "1. Patient Experience (Mobile-First): Patients complete in-person front desk registration, receiving a paper",
        "   slip with their token number (e.g. 021, 022, 023, 024, 025). On their smartphones, they navigate to the",
        "   website, enter their token, and view live status: their exact place in line, number of patients ahead, an",
        "   approximate wait time (e.g. 20-30 mins), an intuitive 5-segment progress bar, and doctor delay disclaimers.",
        "",
        "2. Turn Approaching Alert: When a patient is next in line or being called, an eye-catching banner notifies",
        "   them immediately to proceed to Consultation Room 1, reducing waiting-hall crowding.",
        "",
        "3. Receptionist Queue Control: Clinic receptionists log into a password-protected dashboard to call the next",
        "   patient with one click. Queue advancement propagates to patient screens instantly without manual reloads.",
        "",
        "4. Data Privacy & Zero PHI: The system requires no patient accounts, app installs, or sensitive medical records."
    ]

    for line in body_p2:
        if line.startswith("1.") or line.startswith("2.") or line.startswith("3.") or line.startswith("4."):
            doc.draw_text(p2, 45, y, line, font="F2", size=9, r=0.1, g=0.15, b=0.25)
        else:
            doc.draw_text(p2, 45, y, line, font="F1", size=9, r=0.2, g=0.25, b=0.3)
        y -= 14

    # =========================================================================
    # PAGE 3: PRODUCT BRIEF
    # =========================================================================
    p3 = doc.add_page()
    doc.add_running_header_footer(p3, 3)
    y = doc.draw_section_heading(p3, 770, "2. Product Brief & MVP Scope")

    y = doc.draw_sub_heading(p3, y, "2.1 Problem Statement & Healthcare Context")
    doc.draw_text(p3, 40, y, "In busy outpatient department (OPD) sessions in Patna, Bihar, patients register and receive paper tokens but", font="F1", size=9, r=0.2, g=0.25, b=0.3)
    y -= 13
    doc.draw_text(p3, 40, y, "face complete uncertainty over when their consultation will occur. Because consultation durations vary, patients", font="F1", size=9, r=0.2, g=0.25, b=0.3)
    y -= 13
    doc.draw_text(p3, 40, y, "suffer acute anxiety, crowd clinic corridors, and repeatedly interrupt receptionists with status inquiries.", font="F1", size=9, r=0.2, g=0.25, b=0.3)
    y -= 22

    y = doc.draw_sub_heading(p3, y, "2.2 Target Users & One-Line MVP Scope Statement")
    doc.draw_text(p3, 40, y, "Primary Users: Registered clinic patients and accompanying family caregivers waiting for OPD consultations.", font="F1", size=9, r=0.2, g=0.25, b=0.3)
    y -= 13
    doc.draw_text(p3, 40, y, "Secondary Users: Clinic front-desk reception staff managing daily patient flow.", font="F1", size=9, r=0.2, g=0.25, b=0.3)
    y -= 20

    doc.draw_rect(p3, 40, y - 24, 515, 28, fill_rgb=(0.95, 0.96, 0.98), stroke_rgb=(0.2, 0.25, 0.35), line_width=1)
    doc.draw_text(p3, 50, y - 10, 'One-Line MVP Scope: "A simple web page where a registered patient enters a token number to see their', font="F2", size=9, r=0.06, g=0.1, b=0.2)
    doc.draw_text(p3, 50, y - 20, 'queue position and an approximate waiting-time range, kept up to date through a basic reception dashboard."', font="F2", size=9, r=0.06, g=0.1, b=0.2)
    y -= 40

    y = doc.draw_sub_heading(p3, y, "2.3 Seven-Step Registered Patient User Journey (from Assignment 1)")
    
    steps = [
        ("Step 1: Arrive at clinic", "Patient visits the healthcare clinic for a consultation during a busy OPD session."),
        ("Step 2: Register & get token", "Patient completes front-desk registration and receives a physical paper token (e.g. 025)."),
        ("Step 3: Open queue page", "Patient opens the clinic's queue-tracking URL on their smartphone browser."),
        ("Step 4: Enter token number", "Patient inputs token number into the simple field (or taps demo shortcut)."),
        ("Step 5: Check queue info", "Page displays queue status, count of patients ahead, and approximate waiting range."),
        ("Step 6: See queue updates", "When reception calls patients, the page displays updated positions and lower wait times."),
        ("Step 7: Return when turn is near", "Turn Approaching alert prompts patient to return to Consultation Room 1 on time.")
    ]

    for step_title, step_desc in steps:
        doc.draw_text(p3, 45, y, step_title, font="F2", size=8.5, r=0.1, g=0.15, b=0.25)
        doc.draw_text(p3, 185, y, step_desc, font="F1", size=8.5, r=0.25, g=0.3, b=0.35)
        doc.draw_line(p3, 45, y - 4, 550, y - 4, rgb=(0.9, 0.92, 0.94), line_width=0.5)
        y -= 17

    y -= 10
    y = doc.draw_sub_heading(p3, y, "2.4 The Four Original Must-Have Features (MoSCoW Prioritization)")
    
    moscow = [
        ("1. Patient token lookup", "Simple, low-friction token input without registration or login requirements."),
        ("2. Current queue position", "Directly resolves uncertainty by displaying exact count of patients ahead in line."),
        ("3. Approximate waiting-time range", "Helps patients plan their time; explicitly presented as an estimate (~5-7 min/patient)."),
        ("4. Receptionist queue dashboard", "Staff portal to call next patient and advance the queue so patient data stays current.")
    ]

    for feat, reason in moscow:
        doc.draw_rect(p3, 40, y - 20, 515, 23, fill_rgb=(0.98, 0.99, 1.0), stroke_rgb=(0.85, 0.88, 0.92), line_width=0.8)
        doc.draw_text(p3, 48, y - 9, feat, font="F2", size=8.5, r=0.06, g=0.1, b=0.2)
        doc.draw_text(p3, 210, y - 9, reason, font="F1", size=8.5, r=0.3, g=0.35, b=0.4)
        y -= 26

    # =========================================================================
    # PAGE 4: IMPLEMENTATION PLAN (PART 1)
    # =========================================================================
    p4 = doc.add_page()
    doc.add_running_header_footer(p4, 4)
    y = doc.draw_section_heading(p4, 770, "3. Implementation Plan & Technology Stack (1 / 2)")

    y = doc.draw_sub_heading(p4, y, "3.1 Technology Stack & Architectural Decisions")
    
    tech_stack = [
        ("Frontend Layer", "HTML5, CSS3, Vanilla JavaScript (ES6+)", "Zero build-step overhead, light payload, fast mobile performance"),
        ("Database Engine", "Firebase Cloud Firestore (NoSQL)", "Real-time document sync, offline caching, zero server setup"),
        ("Authentication", "Firebase Authentication", "Email/password security locking receptionist dashboard write actions"),
        ("Hosting & CDN", "Firebase Hosting (Free Spark Tier)", "Global CDN, automated SSL certificates, custom domain ready"),
        ("Version Control", "Git & GitHub", "Strict conventional feature commits and public repository delivery")
    ]

    doc.draw_rect(p4, 40, y - 15, 515, 18, fill_rgb=(0.9, 0.93, 0.96))
    doc.draw_text(p4, 48, y - 6, "TIER", font="F2", size=8.5, r=0.1, g=0.2, b=0.3)
    doc.draw_text(p4, 150, y - 6, "TECHNOLOGY", font="F2", size=8.5, r=0.1, g=0.2, b=0.3)
    doc.draw_text(p4, 330, y - 6, "ENGINEERING RATIONALE", font="F2", size=8.5, r=0.1, g=0.2, b=0.3)
    y -= 20

    for tier, tech, rat in tech_stack:
        doc.draw_rect(p4, 40, y - 18, 515, 20, fill_rgb=(0.99, 0.99, 1.0), stroke_rgb=(0.88, 0.9, 0.92), line_width=0.6)
        doc.draw_text(p4, 48, y - 8, tier, font="F2", size=8.5, r=0.06, g=0.1, b=0.2)
        doc.draw_text(p4, 150, y - 8, tech, font="F1", size=8.5, r=0.15, g=0.2, b=0.3)
        doc.draw_text(p4, 330, y - 8, rat, font="F3", size=8, r=0.35, g=0.4, b=0.45)
        y -= 22

    y -= 10
    y = doc.draw_sub_heading(p4, y, "3.2 Repository Directory & File Structure")
    
    files_tree = [
        ("index.html", "Screen 1: Patient Home (Token input, demo shortcut, input validation)"),
        ("queue-status.html", "Screen 2: Patient Queue Status & Screen 4: Turn Approaching view"),
        ("reception.html", "Screen 3: Receptionist Dashboard with staff authentication guard"),
        ("css/styles.css", "Shared design system, CSS custom properties, responsive mobile container"),
        ("css/patient.css", "Patient mobile components, split metric boxes, 5-segment progress bar"),
        ("css/reception.css", "Reception desktop window layout, status pills, waiting queue table"),
        ("js/firebase-config.js", "Firebase v10 modular initialization, auth bridge, and offline fallback"),
        ("js/queue-service.js", "Single source of truth for queue data, wait math, and Firestore sync"),
        ("js/patient-home.js", "Client input validation, token normalization (25 -> 025), navigation"),
        ("js/queue-status.js", "DOM controller for queue status, progress animation, and turn alerts"),
        ("js/reception.js", "Receptionist login controller, queue advancement, and reset logic"),
        ("seed/initial-queue.json", "Canonical baseline configuration for sample tokens 021-025"),
        ("firestore.rules", "Cloud Firestore security rules enforcing authenticated staff writes"),
        ("firebase.json / .firebaserc", "Hosting rewrite configuration (cleanUrls) and project mapping")
    ]

    for fname, fdesc in files_tree:
        doc.draw_text(p4, 50, y, fname, font="F2", size=8, r=0.1, g=0.3, b=0.6)
        doc.draw_text(p4, 180, y, f"-  {fdesc}", font="F1", size=8, r=0.25, g=0.3, b=0.35)
        y -= 13.5

    y -= 10
    y = doc.draw_sub_heading(p4, y, "3.3 Six-Phase Development Methodology")
    doc.draw_text(p4, 40, y, "Development followed a strict feature-driven pipeline where each feature was completed, locally verified,", font="F1", size=8.5, r=0.25, g=0.3, b=0.35)
    y -= 12
    doc.draw_text(p4, 40, y, "and committed to Git before proceeding: Planning -> Scaffolding -> Patient UI -> Reception -> Sync -> Deploy.", font="F1", size=8.5, r=0.25, g=0.3, b=0.35)

    # =========================================================================
    # PAGE 5: IMPLEMENTATION PLAN (PART 2)
    # =========================================================================
    p5 = doc.add_page()
    doc.add_running_header_footer(p5, 5)
    y = doc.draw_section_heading(p5, 770, "3. Implementation Plan & Database Design (2 / 2)")

    y = doc.draw_sub_heading(p5, y, "3.4 Cloud Firestore Database Schema")
    doc.draw_text(p5, 40, y, "The database structure is organized into two document models balancing public reads with protected writes:", font="F1", size=9, r=0.2, g=0.25, b=0.3)
    y -= 18

    # Schema Box 1
    doc.draw_rect(p5, 40, y - 75, 515, 80, fill_rgb=(0.97, 0.98, 0.99), stroke_rgb=(0.8, 0.85, 0.9), line_width=1)
    doc.draw_text(p5, 50, y - 10, "Document Path: metadata/clinic_queue (Summary State)", font="F2", size=9, r=0.06, g=0.1, b=0.2)
    doc.draw_text(p5, 50, y - 25, "  current_token: '021'          // String: Token currently in consultation with doctor", font="F1", size=8.5, r=0.2, g=0.25, b=0.3)
    doc.draw_text(p5, 50, y - 37, "  current_status: 'calling'      // String: 'calling' | 'in_consultation'", font="F1", size=8.5, r=0.2, g=0.25, b=0.3)
    doc.draw_text(p5, 50, y - 49, "  next_token: '022'             // String: Token next in line", font="F1", size=8.5, r=0.2, g=0.25, b=0.3)
    doc.draw_text(p5, 50, y - 61, "  total_waiting: 4              // Number: Count of tokens in waiting area", font="F1", size=8.5, r=0.2, g=0.25, b=0.3)
    doc.draw_text(p5, 50, y - 73, "  doctor_room: 'Room 1'         // String: Room guidance for patients", font="F1", size=8.5, r=0.2, g=0.25, b=0.3)
    y -= 95

    # Schema Box 2
    doc.draw_rect(p5, 40, y - 70, 515, 75, fill_rgb=(0.97, 0.98, 0.99), stroke_rgb=(0.8, 0.85, 0.9), line_width=1)
    doc.draw_text(p5, 50, y - 10, "Collection Path: tokens/{tokenId} (e.g. tokens/025)", font="F2", size=9, r=0.06, g=0.1, b=0.2)
    doc.draw_text(p5, 50, y - 25, "  token_id: '025'               // String: Normalized 3-digit token reference", font="F1", size=8.5, r=0.2, g=0.25, b=0.3)
    doc.draw_text(p5, 50, y - 37, "  order: 5                      // Number: Sequence order in queue", font="F1", size=8.5, r=0.2, g=0.25, b=0.3)
    doc.draw_text(p5, 50, y - 49, "  status: 'waiting'             // String: 'waiting' | 'calling' | 'completed'", font="F1", size=8.5, r=0.2, g=0.25, b=0.3)
    doc.draw_text(p5, 50, y - 61, "  created_at: Timestamp         // Timestamp: Token issuance time", font="F1", size=8.5, r=0.2, g=0.25, b=0.3)
    y -= 90

    y = doc.draw_sub_heading(p5, y, "3.5 Mathematical Waiting-Time & Position Algorithm")
    doc.draw_text(p5, 40, y, "1. Patients Ahead (N) = Waiting Tokens Ahead + (1 if doctor actively seeing patient, else 0)", font="F2", size=8.5, r=0.1, g=0.15, b=0.25)
    y -= 13
    doc.draw_text(p5, 40, y, "   Example for Token 025: 3 waiting ahead (022, 023, 024) + 1 with doctor (021) = 4 patients ahead.", font="F1", size=8.5, r=0.25, g=0.3, b=0.35)
    y -= 15
    doc.draw_text(p5, 40, y, "2. Wait-Time Range: Calculated at ~5 to 7.5 minutes per consultation:", font="F2", size=8.5, r=0.1, g=0.15, b=0.25)
    y -= 13
    doc.draw_text(p5, 40, y, "   For N=4: Min = 4 x 5 = 20 mins; Max = Round(4 x 7.5 / 5) x 5 = 30 mins -> Displays '20-30 minutes'.", font="F1", size=8.5, r=0.25, g=0.3, b=0.35)
    y -= 15
    doc.draw_text(p5, 40, y, "3. Turn Approaching Trigger: When N <= 1, inline alert activates: 'Your turn is approaching!'", font="F2", size=8.5, r=0.1, g=0.15, b=0.25)
    y -= 22

    y = doc.draw_sub_heading(p5, y, "3.6 Backend Security Rules Specification (firestore.rules)")
    doc.draw_rect(p5, 40, y - 75, 515, 80, fill_rgb=(0.95, 0.96, 0.98), stroke_rgb=(0.7, 0.75, 0.8), line_width=1)
    rules_text = [
        "rules_version = '2';",
        "service cloud.firestore {",
        "  match /databases/{database}/documents {",
        "    match /metadata/{document=**} { allow read: if true; allow write: if request.auth != null; }",
        "    match /tokens/{tokenId}        { allow read: if true; allow write: if request.auth != null; }",
        "  }",
        "}"
    ]
    for rline in rules_text:
        doc.draw_text(p5, 50, y - 10, rline, font="F1", size=8, r=0.1, g=0.15, b=0.2)
        y -= 11

    # =========================================================================
    # PAGE 6: BUILD LOG (PART 1)
    # =========================================================================
    p6 = doc.add_page()
    doc.add_running_header_footer(p6, 6)
    y = doc.draw_section_heading(p6, 770, "4. Build Log — Antigravity Engineering Record (1 / 2)")

    doc.draw_text(p6, 40, y, "This build log documents actual prompts, code actions, technical bottlenecks, and verified resolutions.", font="F1", size=8.5, r=0.2, g=0.25, b=0.3)
    y -= 18

    log_part1 = [
        ("Session 1\nNov 16", "Analyze PDFs & Figma prototype; generate implementation-plan.md", 
         "Extracted 4 wireframe screens; synthesized MoSCoW table; designed database schema.",
         "What Broke: None.\nHow Fixed: Approved by student before coding."),
        
        ("Session 2\nNov 16", "Build Feature 1: Patient Home screen with token input & Check Queue",
         "Created index.html, styles.css, patient.css, and patient-home.js. Added demo shortcut (025).",
         "What Broke: git status failed ('not a git repo').\nHow Fixed: Ran git init, configured user, made initial commit (26fc493)."),
        
        ("Session 3\nNov 16", "Verify token input validation logic and demo shortcut auto-fill",
         "Validated input trimming, digit format, and sample token whitelist (021-025).",
         "What Broke: Node.js test script threw 'command not found: node'.\nHow Fixed: Replaced test with native Python 3.9 script."),
        
        ("Session 4\nNov 16", "Build Feature 2: Patient Queue Status screen matching Sketch 2",
         "Built queue-status.html and queue-service.js. Added 5-step progress bar and disclaimer.",
         "What Broke: Generic label 'People Ahead' was unclear to testers.\nHow Fixed: Updated label to 'Patients ahead of you' (7d1eb24)."),
        
        ("Session 5\nNov 16", "Build Feature 3: Receptionist Dashboard with auth and Firestore rules",
         "Built reception.html desktop view, metric cards, queue table with Call Patient buttons.",
         "What Broke: Firebase credentials not yet created by student.\nHow Fixed: Engineered transparent local storage bridge with demo login (ab01f58).")
    ]

    for sess, prompt, worked, broke in log_part1:
        doc.draw_rect(p6, 40, y - 62, 515, 66, fill_rgb=(0.99, 0.99, 1.0), stroke_rgb=(0.85, 0.88, 0.92), line_width=0.8)
        doc.draw_text(p6, 46, y - 10, sess.split('\n')[0], font="F2", size=8, r=0.06, g=0.1, b=0.2)
        doc.draw_text(p6, 46, y - 20, sess.split('\n')[1], font="F3", size=7.5, r=0.4, g=0.45, b=0.5)
        
        doc.draw_text(p6, 105, y - 10, "Task: " + prompt[:60], font="F2", size=8, r=0.1, g=0.2, b=0.4)
        doc.draw_text(p6, 105, y - 22, "Worked: " + worked[:75], font="F1", size=7.5, r=0.2, g=0.25, b=0.3)
        doc.draw_text(p6, 105, y - 32, worked[75:150], font="F1", size=7.5, r=0.2, g=0.25, b=0.3)

        doc.draw_text(p6, 105, y - 44, broke.split('\n')[0], font="F2", size=7.5, r=0.6, g=0.1, b=0.1)
        doc.draw_text(p6, 105, y - 54, broke.split('\n')[1], font="F1", size=7.5, r=0.1, g=0.45, b=0.2)
        y -= 74

    # =========================================================================
    # PAGE 7: BUILD LOG (PART 2)
    # =========================================================================
    p7 = doc.add_page()
    doc.add_running_header_footer(p7, 7)
    y = doc.draw_section_heading(p7, 770, "4. Build Log — Antigravity Engineering Record (2 / 2)")

    log_part2 = [
        ("Session 6\nNov 16", "Connect all 3 screens, inline turn alerts, dynamic wait-time estimation",
         "Unified links, inline Turn Approaching banner (bell icon), manual refresh, automated tests.",
         "What Broke: Python test had SyntaxError: f-string backslash.\nHow Fixed: Removed nested backslash; verified 5 steps passed (b5062e9)."),
        
        ("Session 7\nNov 16", "Create GitHub repository clinic-queue-tracker and push code",
         "Configured origin remote; generated comprehensive README.md and .gitignore.",
         "What Broke: Sandbox terminal blocked direct push (no DNS).\nHow Fixed: Guided student to push in Terminal using Personal Access Token (ef4de5c)."),
        
        ("Session 8\nNov 17", "Install Firebase CLI and deploy to Firebase Hosting on free tier",
         "Configured firebase.json (cleanUrls) and firestore.indexes.json.",
         "What Broke: 'bad CPU type in executable: firebase' on Apple Silicon.\nHow Fixed: Ran 'softwareupdate --install-rosetta --agree-to-license' (0d5762b)."),
        
        ("Session 9\nNov 17", "User linked project clinic-queue-tracker-a3b1b and ran firebase deploy",
         "Mapped project in .firebaserc; deployed live to Google Firebase CDN.",
         "What Broke: None.\nHow Fixed: Terminal reported 'Deploy complete!' at clinic-queue-tracker-a3b1b.web.app (6c2ee23).")
    ]

    for sess, prompt, worked, broke in log_part2:
        doc.draw_rect(p7, 40, y - 62, 515, 66, fill_rgb=(0.99, 0.99, 1.0), stroke_rgb=(0.85, 0.88, 0.92), line_width=0.8)
        doc.draw_text(p7, 46, y - 10, sess.split('\n')[0], font="F2", size=8, r=0.06, g=0.1, b=0.2)
        doc.draw_text(p7, 46, y - 20, sess.split('\n')[1], font="F3", size=7.5, r=0.4, g=0.45, b=0.5)
        
        doc.draw_text(p7, 105, y - 10, "Task: " + prompt[:60], font="F2", size=8, r=0.1, g=0.2, b=0.4)
        doc.draw_text(p7, 105, y - 22, "Worked: " + worked[:75], font="F1", size=7.5, r=0.2, g=0.25, b=0.3)
        doc.draw_text(p7, 105, y - 32, worked[75:150], font="F1", size=7.5, r=0.2, g=0.25, b=0.3)

        doc.draw_text(p7, 105, y - 44, broke.split('\n')[0], font="F2", size=7.5, r=0.6, g=0.1, b=0.1)
        doc.draw_text(p7, 105, y - 54, broke.split('\n')[1], font="F1", size=7.5, r=0.1, g=0.45, b=0.2)
        y -= 74

    y -= 10
    y = doc.draw_sub_heading(p7, y, "Verified Git Commit History in Repository")

    commits = [
        ("6c2ee23", "chore(deploy): document successful Firebase Hosting deployment to clinic-queue-tracker-a3b1b"),
        ("025315f", "chore(deploy): link project to clinic-queue-tracker-a3b1b"),
        ("a8e4c02", "chore: add .firebaserc for Firebase project mapping"),
        ("0d5762b", "feat(firebase): add firestore live sync, indexes config, and cleanUrls for Firebase Hosting"),
        ("ef4de5c", "docs: create comprehensive README with wireframe mapping, security rules, and testing guide"),
        ("b5062e9", "feat: connect full clinic queue workflow, inline turn alerts, dynamic wait estimation, and tests"),
        ("ab01f58", "feat: implement Receptionist Dashboard, queue progression, Firebase Auth protection, and rules"),
        ("7d1eb24", "feat: implement Patient Queue Status screen with live metrics, progress bar, and turn alert"),
        ("26fc493", "feat: implement Patient Home screen with token input, demo shortcut, and validation (Feature 1)")
    ]

    for chash, cmsg in commits:
        doc.draw_text(p7, 45, y, chash, font="F2", size=7.5, r=0.15, g=0.35, b=0.7)
        doc.draw_text(p7, 95, y, cmsg, font="F1", size=7.5, r=0.2, g=0.25, b=0.3)
        y -= 12

    # =========================================================================
    # PAGE 8: FEATURE CHECKLIST
    # =========================================================================
    p8 = doc.add_page()
    doc.add_running_header_footer(p8, 8)
    y = doc.draw_section_heading(p8, 770, "5. Feature Checklist & MoSCoW Audit")

    doc.draw_text(p8, 40, y, "Audit of the four original Must-have features evaluated against the live production application:", font="F1", size=9, r=0.2, g=0.25, b=0.3)
    y -= 18

    feats_eval = [
        ("1. Patient Token Lookup", "DONE", 
         "Input field accepts token; normalizes 2-digit entries (25 -> 025); includes demo shortcut "
         "('• Try it out with sample token 025'); displays helpful error message for empty/invalid tokens; "
         "routes valid tokens to status screen with zero lag."),
        
        ("2. Current Queue Position", "DONE", 
         "Calculates and displays exact count of patients ahead (displays '04' for Token 025 initially). "
         "Correctly accounts for both waiting queue tokens and active doctor consultation in Room 1. "
         "Dynamically decrements as receptionist calls each patient."),
        
        ("3. Approximate Waiting-Time Range", "DONE", 
         "Calculates waiting range at ~5 to 7.5 mins per consultation ('20-30 minutes' for Token 025). "
         "Explicitly tagged as an *Estimate. Features an interactive 5-segment progress bar and an explicit "
         "disclaimer card explaining that times vary with consultation complexity."),
        
        ("4. Receptionist Dashboard & Controls", "DONE", 
         "Protected desktop staff dashboard at /reception.html with email/password login. Displays 3 metric "
         "cards (Current Token, Next Token, Total Waiting), patient queue table with individual 'Call Patient' "
         "buttons, 'Update Queue' action, and 'Reset Demo Queue' tool. Write actions locked by Firestore rules.")
    ]

    for title, status, reason in feats_eval:
        doc.draw_rect(p8, 40, y - 55, 515, 60, fill_rgb=(0.98, 0.99, 1.0), stroke_rgb=(0.85, 0.88, 0.92), line_width=1)
        doc.draw_text(p8, 50, y - 10, title, font="F2", size=10, r=0.06, g=0.1, b=0.2)
        doc.draw_rect(p8, 490, y - 14, 55, 16, fill_rgb=(0.85, 0.96, 0.85))
        doc.draw_text(p8, 502, y - 10, status, font="F2", size=8.5, r=0.1, g=0.5, b=0.2)
        
        doc.draw_text(p8, 50, y - 26, "Delivery Evidence: " + reason[:80], font="F1", size=8, r=0.2, g=0.25, b=0.3)
        doc.draw_text(p8, 50, y - 37, reason[80:165], font="F1", size=8, r=0.2, g=0.25, b=0.3)
        doc.draw_text(p8, 50, y - 48, reason[165:], font="F1", size=8, r=0.2, g=0.25, b=0.3)
        y -= 68

    y -= 10
    y = doc.draw_sub_heading(p8, y, "Delivery of Secondary Wireframe Features & Out-of-Scope Compliance")
    
    sec_feats = [
        ("Turn Approaching Alert", "DONE", "Inline banner (bell icon) and Screen 4 modal notify patient when turn is close."),
        ("Manual Refresh Control", "DONE", "Prominent 'Check for updates' button complements real-time storage event sync."),
        ("Patient Self-Registration", "EXCLUDED", "Deliberately excluded per MoSCoW MVP plan (tokens issued at clinic counter)."),
        ("Online Payments / SMS", "EXCLUDED", "Deliberately excluded to maintain strict MVP scope and zero operational friction.")
    ]

    for stitle, sstatus, sdesc in sec_feats:
        doc.draw_rect(p8, 40, y - 20, 515, 22, fill_rgb=(0.99, 0.99, 1.0), stroke_rgb=(0.88, 0.9, 0.92), line_width=0.6)
        doc.draw_text(p8, 50, y - 9, stitle, font="F2", size=8, r=0.1, g=0.15, b=0.25)
        doc.draw_text(p8, 200, y - 9, sdesc, font="F1", size=8, r=0.3, g=0.35, b=0.4)
        doc.draw_text(p8, 505, y - 9, sstatus, font="F2", size=7.5, r=0.15, g=0.4, b=0.2 if sstatus=="DONE" else 0.5)
        y -= 25

    # =========================================================================
    # PAGE 9: TESTING AND CONCLUSION
    # =========================================================================
    p9 = doc.add_page()
    doc.add_running_header_footer(p9, 9)
    y = doc.draw_section_heading(p9, 770, "6. Testing Verification, Conclusion & Future Improvements")

    y = doc.draw_sub_heading(p9, y, "6.1 Verified End-to-End Test Matrix")

    tests = [
        ("TC-01", "Enter Token 025 on Home", "Opens Queue Status; shows Token 025, 4 ahead, 20-30 mins wait", "PASS"),
        ("TC-02", "Click demo shortcut (025)", "Auto-populates 025 into input field immediately", "PASS"),
        ("TC-03", "Submit unknown token (999)", "Displays inline error: 'Token #999 was not found...'", "PASS"),
        ("TC-04", "Reception calls Token 022", "Token 021 completes; 025 updates to 3 ahead, 15-20 mins wait", "PASS"),
        ("TC-05", "Reception calls Token 024", "Token 025 drops to 1 ahead; Turn Approaching banner (bell) activates", "PASS"),
        ("TC-06", "Reception calls Token 025", "Token 025 becomes 0 ahead; status changes to 'Now Being Called'", "PASS"),
        ("TC-07", "Unauthenticated reception", "Direct write actions blocked; dashboard gated behind auth modal", "PASS")
    ]

    for tid, tscen, texp, tstat in tests:
        doc.draw_rect(p9, 40, y - 16, 515, 18, fill_rgb=(0.99, 0.99, 1.0), stroke_rgb=(0.88, 0.9, 0.92), line_width=0.6)
        doc.draw_text(p9, 48, y - 7, tid, font="F2", size=8, r=0.1, g=0.2, b=0.4)
        doc.draw_text(p9, 90, y - 7, tscen, font="F1", size=8, r=0.15, g=0.2, b=0.25)
        doc.draw_text(p9, 255, y - 7, texp, font="F1", size=7.5, r=0.3, g=0.35, b=0.4)
        doc.draw_text(p9, 515, y - 7, tstat, font="F2", size=8, r=0.1, g=0.55, b=0.2)
        y -= 20

    y -= 10
    y = doc.draw_sub_heading(p9, y, "6.2 Short Conclusion")
    concl = [
        "The Clinic Queue Tracking System MVP successfully demonstrates how a focused, lightweight web application",
        "can effectively solve waiting-time uncertainty for outpatient clinics. By adhering strictly to the MoSCoW MVP",
        "scope—avoiding complex patient self-registration or online payments—the product delivers immediate, practical",
        "value to patients while giving clinic receptionists a single-click queue advancement workflow. The system was",
        "thoroughly verified across mobile and desktop devices and successfully deployed to Google Cloud Firebase Hosting."
    ]
    for cline in concl:
        doc.draw_text(p9, 40, y, cline, font="F1", size=8.5, r=0.2, g=0.25, b=0.3)
        y -= 12.5

    y -= 10
    y = doc.draw_sub_heading(p9, y, "6.3 Future Improvements Roadmap (Post-MVP Extensions)")
    future_items = [
        ("Multi-Doctor & Multi-Room Support:", "Expand database schema to handle distinct queues across multiple OPD rooms."),
        ("Automated SMS / WhatsApp Alerts:", "Optional notification ping when a patient reaches 2 people ahead."),
        ("Doctor Delay Status Indicator:", "Staff toggle to broadcast doctor emergency delays to waiting patients."),
        ("Physical Slip QR Code Scanning:", "Print a scannable QR code on physical paper slips for instant zero-typing lookup.")
    ]
    for ftitle, fdesc in future_items:
        doc.draw_text(p9, 45, y, ftitle, font="F2", size=8.5, r=0.1, g=0.15, b=0.25)
        doc.draw_text(p9, 215, y, fdesc, font="F1", size=8.5, r=0.25, g=0.3, b=0.35)
        y -= 14

    doc.save()

if __name__ == "__main__":
    build_pdf_report()
