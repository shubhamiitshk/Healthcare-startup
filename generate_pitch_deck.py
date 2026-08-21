from fpdf import FPDF
import math

class Deck(FPDF):
    def __init__(self):
        super().__init__(orientation='L', unit='mm', format='A4')
        self.set_auto_page_break(auto=False)
        self.set_margins(0, 0, 0)
        # Brand
        self.B = (22, 71, 114)
        self.G = (27, 186, 141)
        self.D = (35, 35, 40)
        self.GY = (130, 130, 140)
        self.LG = (246, 247, 250)
        self.W = (255, 255, 255)
        self.R = (220, 53, 69)
        self.A = (245, 158, 11)
        self.P = (120, 60, 160)
        self.T = (0, 130, 140)
        self.LB = (219, 234, 254)
        self.LGR = (209, 250, 229)
        self.LR = (254, 226, 226)
        self.LA = (254, 243, 199)

    def bg(self):
        self.set_fill_color(*self.W)
        self.rect(0, 0, 297, 210, 'F')

    def topbar(self, title, subtitle=''):
        self.set_fill_color(*self.B)
        self.rect(0, 0, 297, 30, 'F')
        self.set_fill_color(*self.G)
        self.rect(0, 27, 297, 3, 'F')
        self.set_font('Helvetica', 'B', 20)
        self.set_text_color(*self.W)
        self.set_xy(20, 6)
        self.cell(257, 12, title)
        if subtitle:
            self.set_font('Helvetica', '', 9)
            self.set_text_color(180, 200, 220)
            self.set_xy(20, 18)
            self.cell(257, 8, subtitle)

    def botbar(self, n):
        self.set_fill_color(*self.LG)
        self.rect(0, 204, 297, 6, 'F')
        self.set_font('Helvetica', '', 7)
        self.set_text_color(*self.GY)
        self.set_xy(20, 205)
        self.cell(200, 4, 'CatchQ  |  IIT Kharagpur Platinum Jubilee Seed Fund Application')
        self.set_xy(250, 205)
        self.cell(27, 4, f'{n} / 14', align='R')

    def card(self, x, y, w, h, fill=None, border=None):
        fc = fill or self.W
        self.set_fill_color(*fc)
        if border:
            self.set_draw_color(*border)
            self.set_line_width(0.3)
            self.rect(x, y, w, h, 'DF')
        else:
            self.rect(x, y, w, h, 'F')

    def txt(self, x, y, t, sz=10, c=None, f='Helvetica', s='', a='L', h=5):
        self.set_font(f, s, sz)
        self.set_text_color(*(c or self.D))
        self.set_xy(x, y)
        self.cell(0, h, t, align=a)

    def mtxt(self, x, y, t, sz=10, c=None, f='Helvetica', s='', w=250, h=5, a='L'):
        self.set_font(f, s, sz)
        self.set_text_color(*(c or self.D))
        self.set_xy(x, y)
        self.multi_cell(w, h, t, align=a)

    def dot(self, x, y, r, c):
        self.set_fill_color(*c)
        self.ellipse(x, y, r, r, 'F')

    def bar(self, x, y, w, h, c):
        self.set_fill_color(*c)
        self.rect(x, y, w, h, 'F')

    def stat(self, x, y, w, h, val, lbl, c):
        self.card(x, y, w, h, self.W, (230, 230, 235))
        self.bar(x, y, w, 3, c)
        self.set_font('Helvetica', 'B', 18)
        self.set_text_color(*c)
        self.set_xy(x, y + 6)
        self.cell(w, 8, val, align='C')
        self.set_font('Helvetica', '', 8)
        self.set_text_color(*self.GY)
        self.set_xy(x, y + 17)
        self.cell(w, 5, lbl, align='C')

    def progress_bar(self, x, y, w, h, pct, c):
        self.card(x, y, w, h, self.LG)
        self.bar(x, y, int(w * pct / 100), h, c)

    def numbered_item(self, x, y, num, title, detail, accent):
        self.dot(x, y + 1, 6, accent)
        self.set_font('Helvetica', 'B', 7)
        self.set_text_color(*self.W)
        self.set_xy(x, y + 1.5)
        self.cell(6, 4, str(num), align='C')
        self.set_font('Helvetica', 'B', 8.5)
        self.set_text_color(*self.D)
        self.set_xy(x + 9, y)
        self.cell(0, 5, title)
        self.set_font('Helvetica', '', 7)
        self.set_text_color(*self.GY)
        self.set_xy(x + 9, y + 6)
        self.multi_cell(0, 3.5, detail)

    def feature_row(self, x, y, icon, title, desc, accent):
        self.dot(x, y + 2, 4, accent)
        self.set_font('Helvetica', 'B', 6)
        self.set_text_color(*self.W)
        self.set_xy(x, y + 2.5)
        self.cell(4, 3, icon, align='C')
        self.set_font('Helvetica', 'B', 8)
        self.set_text_color(*self.D)
        self.set_xy(x + 9, y)
        self.cell(100, 5, title)
        self.set_font('Helvetica', '', 7)
        self.set_text_color(*self.GY)
        self.set_xy(x + 9, y + 5.5)
        self.multi_cell(100, 3.5, desc)


d = Deck()

# ================================================================
# SLIDE 1: TITLE
# ================================================================
d.add_page()
d.set_fill_color(*d.B)
d.rect(0, 0, 297, 210, 'F')
# decorative circles
d.set_fill_color(30, 90, 140)
d.ellipse(-30, -30, 100, 100, 'F')
d.ellipse(250, 170, 80, 80, 'F')
d.ellipse(200, -20, 50, 50, 'F')
# green bar
d.bar(20, 65, 60, 4, d.G)
# title
d.txt(20, 75, 'CatchQ', 52, d.W, s='B')
d.txt(20, 100, "India's AI-Powered Clinic & Hospital Operating System", 17, (200, 220, 240))
# tags
tx = 20
for t in ['Healthcare', 'SaaS', 'B2B', 'AI']:
    tw = d.get_string_width(t) + 14
    d.card(tx, 118, tw, 11, d.G)
    d.txt(tx + 7, 119.5, t, 8, d.W, s='B')
    tx += tw + 5
# line
d.set_draw_color(*d.G)
d.set_line_width(0.8)
d.line(20, 140, 130, 140)
# subtitle
d.txt(20, 147, 'IIT Kharagpur Platinum Jubilee Seed Fund Application', 14, (180, 200, 220), s='B')
d.txt(20, 162, '[Your Name]  |  [Your Email]  |  [Your Phone]', 10, (150, 170, 190))
d.txt(20, 174, 'Confidential  |  June 2026', 8, (120, 140, 160))

# ================================================================
# SLIDE 2: THE PROBLEM
# ================================================================
d.add_page()
d.bg()
d.topbar('The Problem', "India's healthcare is broken at the clinic level - and it costs Rs. 60,000 Cr/year")
d.botbar(2)

# 8 problem cards in 2 rows of 4
problems = [
    ('Scheduling Chaos', '10 Lakh+ clinics use phone\nregisters. Staff waste 5+ hrs/day\non phone tag. Double-bookings\nare the norm, not the exception.', d.R),
    ('Long Wait Times', 'Average OPD wait is 45-90\nminutes. Patients arrive early,\nwait endlessly. No real-time\nqueue visibility anywhere.', d.A),
    ('Revenue Drain', '30-40% no-show rate costs\neach clinic Rs. 2-5 Lakhs/month.\nNo automated reminders or\npatient retention system.', d.R),
    ('Paper Reports', 'Patient reports are paper-based.\nNo centralized health records.\nPatients lose reports, repeat\nunnecessary expensive tests.', d.A),
    ('No AI Assist', 'Patients cannot understand lab\nreports. Wrong specialist visits\nwaste time, money, and delay\ncritical treatment.', (180, 80, 0)),
    ('Pharmacy Gap', 'Patients forget medicine schedules.\nFamilies dont know when meds\nrun out. No link between doctor\nprescriptions and pharmacy.', d.A),
    ('Bed Crisis', 'Emergency patients wait for beds.\nManual ward management. No\nreal-time bed tracking. Families\nleft in the dark.', d.R),
    ('Massive Loss', 'Rs. 60,000 Cr+ lost annually to\nhealthcare operational inefficiency.\nIndia loses more than the GDP\nof small countries to this.', (150, 40, 40)),
]

y_start = 36
for i, (title, detail, color) in enumerate(problems):
    col = i % 4
    row = i // 4
    x = 12 + col * 70
    y = y_start + row * 54
    # card
    d.card(x, y, 67, 50, d.W, (235, 235, 240))
    # left accent bar
    d.bar(x, y, 3, 50, color)
    # number circle
    d.dot(x + 8, y + 5, 8, color)
    d.set_font('Helvetica', 'B', 9)
    d.set_text_color(*d.W)
    d.set_xy(x + 8, y + 6)
    d.cell(8, 6, str(i + 1), align='C')
    # title
    d.txt(x + 20, y + 5, title, 9, d.D, s='B')
    # detail
    d.mtxt(x + 7, y + 18, detail, 7, d.GY, w=54, h=3.8)

# warning callout
cy = 148
d.card(12, cy, 273, 16, d.LA, d.A)
d.dot(20, cy + 3.5, 4, d.A)
d.set_font('Helvetica', 'B', 7)
d.set_text_color(*d.W)
d.set_xy(20, cy + 3.5)
d.cell(4, 3, '!', align='C')
d.txt(28, cy + 2.5, 'THE REAL PROBLEM:', 8, (160, 90, 0), s='B')
d.txt(28, cy + 8, "Existing solutions cost Rs. 50,000+/month and don't integrate WhatsApp - where 90% of Indian patients communicate daily.", 7.5, (140, 90, 0))

# ================================================================
# SLIDE 3: OUR SOLUTION
# ================================================================
d.add_page()
d.bg()
d.topbar('Our Solution', 'A unified platform that digitizes the entire patient journey - from booking to post-visit care')
d.botbar(3)

# Left column: FOR CLINICS
d.txt(20, 36, 'FOR CLINICS', 13, d.B, s='B')
d.bar(20, 42, 50, 1.5, d.G)

clinic_features = [
    ('WhatsApp + App + Web', 'Patients book via any channel. All bookings auto-sync to clinic dashboard in real-time.'),
    ('Real-Time Queue', 'Socket.io live updates. Patients track position on phone. Clinic displays queue on Smart TV.'),
    ('Doctor Scheduling', '15+ specialties. Weekly schedules with fees, slots, booking windows. Zero double-booking.'),
    ('Billing & Receipts', 'Auto invoice generation. Print receipts. Track Cash/UPI/Card. Revenue analytics dashboard.'),
    ('Bed Management', 'Ward tracking with color-coded beds. Emergency allocation. Admission/discharge. Family alerts.'),
    ('Follow-ups', 'Automated cron-based reminders. Patient retention workflows. Family member booking support.'),
]

yy = 48
for title, desc in clinic_features:
    d.feature_row(20, yy, '>', title, desc, d.G)
    yy += 16

# Right column: FOR PATIENTS
d.txt(160, 36, 'FOR PATIENTS', 13, d.G, s='B')
d.bar(160, 42, 50, 1.5, d.B)

patient_features = [
    ('30-Second Booking', 'Open app or send WhatsApp message. AI suggests right doctor. Pick a slot. Done.'),
    ('Live Queue Updates', 'Real-time position and estimated wait time on phone. Arrive just in time, not hours early.'),
    ('AI Report Analysis', 'Upload lab report. AI explains medical findings in simple language. Know what tests mean.'),
    ('Healing Tracker', 'Computer vision compares medical images over time. Tracks recovery progress automatically.'),
    ('Smart Pharmacy', 'Family gets alert when medicines run low. Auto-order from delivery apps or local pharmacy.'),
    ('Voice Booking', 'Speak to book appointment. Multilingual support. Works without smartphone or internet.'),
]

yy = 48
for title, desc in patient_features:
    d.feature_row(160, yy, '>', title, desc, d.B)
    yy += 16

# Pricing bar
d.bar(0, 190, 297, 14, d.G)
d.txt(0, 192.5, 'Plans from Rs. 2,999/month  |  14-day free trial  |  No setup fees  |  Cancel anytime', 9, d.W, s='B', a='C')

# ================================================================
# SLIDE 4: PLATFORM ARCHITECTURE
# ================================================================
d.add_page()
d.bg()
d.topbar('Platform Architecture', 'Modern, scalable tech stack powering India clinic digitization')
d.botbar(4)

# Architecture diagram - vertical flow with boxes
layers = [
    # (x, y, w, h, title, sub, color)
    (95, 36, 107, 16, 'Patient Touchpoints', 'WhatsApp  |  Mobile App (iOS/Android)  |  Web Portal', d.G),
    (95, 62, 107, 16, 'Backend Core', 'NestJS  +  PostgreSQL  +  TypeORM  +  Socket.io', d.B),
    (30, 90, 80, 16, 'Clinic Dashboard', 'Next.js 15  |  shadcn/ui  |  Tailwind', d.B),
    (120, 90, 77, 16, 'Auth & Real-time', 'Firebase JWT  |  Phone OTP  |  WebSocket', (27, 120, 90)),
    (207, 90, 67, 16, 'Data Layer', 'PostgreSQL  |  TypeORM  |  Migrations', (100, 100, 120)),
    (15, 118, 85, 16, 'AI Engine', 'RAG  |  Computer Vision  |  NLP  |  Voice', d.R),
    (110, 118, 85, 16, 'Pharmacy Module', 'Inventory  |  Alerts  |  Delivery APIs', d.P),
    (205, 118, 77, 16, 'Bed Management', 'Wards  |  Emergency  |  Family Alerts', d.T),
]

for x, y, w, h, title, sub, color in layers:
    d.card(x, y, w, h, color)
    d.txt(x + 5, y + 2, title, 9, d.W, s='B')
    d.txt(x + 5, y + 8, sub, 6.5, (210, 225, 240))

# Connecting arrows
arrows = [
    (148, 52, 148, 62),   # top -> backend
    (148, 78, 70, 90),    # backend -> dashboard
    (148, 78, 158, 90),   # backend -> auth
    (148, 78, 240, 90),   # backend -> data
    (70, 106, 57, 118),   # dashboard -> AI
    (158, 106, 152, 118), # auth -> pharmacy
    (240, 106, 243, 118), # data -> beds
]
for x1, y1, x2, y2 in arrows:
    d.set_draw_color(*d.GY)
    d.set_line_width(0.4)
    d.line(x1, y1, x2, y2)
    # arrowhead
    angle = math.atan2(y2 - y1, x2 - x1)
    ax = x2 - 3 * math.cos(angle - 0.4)
    ay = y2 - 3 * math.sin(angle - 0.4)
    bx = x2 - 3 * math.cos(angle + 0.4)
    by = y2 - 3 * math.sin(angle + 0.4)
    d.set_fill_color(*d.GY)
    d.set_draw_color(*d.GY)
    # small triangle
    d.set_line_width(0.2)
    d.line(x2, y2, ax, ay)
    d.line(x2, y2, bx, by)

# Tech stack row
d.txt(20, 148, 'TECHNOLOGY STACK', 10, d.B, s='B')
d.bar(20, 154, 30, 1, d.G)
techs = ['NestJS', 'Next.js 15', 'TypeORM', 'PostgreSQL', 'Socket.io', 'Firebase', 'React Native', 'Redux', 'shadcn/ui', 'Tailwind']
tx = 20
for t in techs:
    tw = d.get_string_width(t) + 12
    d.card(tx, 160, tw, 9, d.LG)
    d.txt(tx + 6, 161, t, 6.5, d.D, s='B')
    tx += tw + 3

# Platform stats
d.txt(20, 176, 'PLATFORM SCALE', 10, d.B, s='B')
d.bar(20, 182, 30, 1, d.G)
stats_data = [
    ('30+', 'REST API\nEndpoints'),
    ('14', 'Admin\nPages'),
    ('11', 'Mobile\nScreens'),
    ('7', 'Database\nTables'),
    ('22', 'Landing\nComponents'),
    ('6', 'Backend\nModules'),
]
sx = 20
for val, lbl in stats_data:
    d.card(sx, 188, 42, 16, d.LG)
    d.txt(sx + 2, 189, val, 12, d.G, s='B')
    d.mtxt(sx + 14, 189, lbl, 6, d.GY, w=26, h=3.5)
    sx += 45

# ================================================================
# SLIDE 5: HOW IT WORKS
# ================================================================
d.add_page()
d.bg()
d.topbar('How It Works', 'From message to appointment to post-visit care - entirely digital')
d.botbar(5)

steps = [
    ('01', 'BOOK', 'Patient sends WhatsApp\nor opens mobile app.\nAI suggests right doctor\nbased on symptoms.', d.G),
    ('02', 'CONFIRM', 'Instant booking\nconfirmation. Calendar\nsync. Pre-visit\nquestionnaire if needed.', d.B),
    ('03', 'TRACK', 'Real-time queue\nposition on phone.\n"You are #3. Est.\nwait: 15 minutes."', (27, 120, 90)),
    ('04', 'VISIT', 'Smart queue display\nat clinic. Doctor sees\nlive patient list.\nNo paper, no chaos.', d.A),
    ('05', 'PAY', 'Digital receipt via\nWhatsApp. Payment\ntracked: UPI/Card/\nCash. Auto-billing.', d.P),
    ('06', 'REPORT', 'AI reads lab report.\nExplains in simple\nlanguage. Flags\nabnormal values.', d.R),
    ('07', 'FOLLOW', 'Automated follow-up\nreminder. Next\nappointment auto-\nsuggested.', d.T),
    ('08', 'REFILL', 'Pharmacy alert when\nmeds run low.\nFamily notified.\nAuto-order option.', (100, 60, 140)),
]

# Phone mockups in 2 rows of 4
for i, (num, title, desc, color) in enumerate(steps):
    col = i % 4
    row = i // 4
    x = 12 + col * 71
    y = 36 + row * 58

    # phone frame
    d.card(x, y, 65, 52, (45, 45, 50))
    # screen
    d.card(x + 3, y + 3, 59, 42, d.W)
    # status bar
    d.bar(x + 3, y + 3, 59, 5, color)
    d.txt(x + 5, y + 3.5, '9:41', 4.5, d.W)
    # signal dots
    for j in range(3):
        d.dot(x + 50 + j * 5, y + 4.5, 1.5, d.W if j == 0 else (180, 180, 190))
    # step circle
    d.dot(x + 23, y + 13, 10, color)
    d.set_font('Helvetica', 'B', 10)
    d.set_text_color(*d.W)
    d.set_xy(x + 23, y + 14.5)
    d.cell(10, 7, num, align='C')
    # title
    d.txt(x + 3, y + 26, title, 8, color, s='B', a='C')
    # desc
    d.mtxt(x + 5, y + 32, desc, 6, d.GY, w=55, h=3.2, a='C')

# arrows between phones
for i in range(7):
    col = i % 4
    row = i // 4
    if col < 3:
        ax = 12 + (col + 1) * 71 - 8
        ay = 36 + row * 58 + 26
        d.set_font('Helvetica', 'B', 14)
        d.set_text_color(200, 200, 210)
        d.set_xy(ax, ay)
        d.cell(8, 6, '>', align='C')
    elif row == 0:
        # arrow from row 1 end to row 2 start
        ax = 12 + 3 * 71 + 65
        ay = 36 + 26
        d.set_font('Helvetica', 'B', 14)
        d.set_text_color(200, 200, 210)
        d.set_xy(ax - 8, ay)
        d.cell(8, 6, 'v', align='C')

# bottom tagline
d.bar(0, 156, 297, 1, d.LG)
d.txt(0, 160, 'PATIENT JOURNEY', 11, d.B, s='B', a='C')
d.txt(0, 168, 'Every touchpoint is digital, real-time, and designed for zero friction', 9, d.GY, a='C')

# ================================================================
# SLIDE 6: DASHBOARD FEATURES
# ================================================================
d.add_page()
d.bg()
d.topbar('Dashboard Features', 'Complete clinic management system - 8 modules, already built and operational')
d.botbar(6)

features = [
    ('DASHBOARD', 'Real-time stats: Patients Today,\nAppointments, Queue, Performance.\n7-day trend charts. Quick actions.', d.B, '6 KPIs'),
    ('QUEUE', 'Per-doctor live queue. Status:\nwaiting/serving/completed/skipped.\nSocket.io real-time updates.', d.G, 'Real-time'),
    ('DOCTORS', 'CRUD for 15+ specialties.\nWeekly scheduling. Fees config.\nAvailability windows per slot.', (27, 120, 90), '15+ Specs'),
    ('APPOINTMENTS', 'Full lifecycle: book, reschedule,\ncancel. Filter by doctor/date/status.\nPatient phone search.', d.A, 'Full CRUD'),
    ('BILLING', 'Invoice generation. Print receipts.\nPayment mode tracking: Cash/UPI/\nCard. Discount management.', d.R, '3 Modes'),
    ('FOLLOW-UPS', 'Cron-based daily reminders.\nPatient retention workflows.\nFamily member booking support.', d.P, 'Automated'),
    ('PATIENT APP', 'Phone OTP login. Browse doctors\nby specialty. Real-time queue.\nAppointment receipt on mobile.', d.T, '11 Screens'),
    ('LANDING PAGE', '22 marketing components. Pricing\ntiers. Feature showcase. WhatsApp\nwidget. App download links.', (100, 100, 120), '22 Parts'),
]

for i, (title, desc, color, badge) in enumerate(features):
    col = i % 4
    row = i // 4
    x = 12 + col * 71
    y = 36 + row * 60

    # card with shadow
    d.card(x + 1, y + 1, 68, 55, (215, 215, 220))
    d.card(x, y, 68, 55, d.W)
    # top accent bar
    d.bar(x, y, 68, 4, color)
    # icon circle
    d.dot(x + 7, y + 10, 8, color)
    d.set_font('Helvetica', 'B', 8)
    d.set_text_color(*d.W)
    d.set_xy(x + 7, y + 11)
    d.cell(8, 6, title[0], align='C')
    # title
    d.txt(x + 18, y + 8, title, 8.5, d.D, s='B')
    # badge
    bw = d.get_string_width(badge) + 8
    d.card(x + 68 - bw - 3, y + 8, bw, 6.5, color)
    d.txt(x + 68 - bw - 3, y + 8.5, badge, 5.5, d.W, s='B', a='C')
    # divider line
    d.set_draw_color(*color)
    d.set_line_width(0.3)
    d.line(x + 5, y + 20, x + 63, y + 20)
    # desc
    d.mtxt(x + 5, y + 23, desc, 7, d.D, w=60, h=3.8)

# ================================================================
# SLIDE 7: AI INNOVATION
# ================================================================
d.add_page()
d.bg()
d.topbar('AI Innovation', 'Four AI capabilities that will transform Indian healthcare SaaS')
d.botbar(7)

ai_features = [
    ('SMART DOCTOR MATCHING',
     'Patient describes symptoms ->\nAI analyzes -> recommends\nright specialist immediately.\n\nExample: "Chest pain + breath-\lessness" -> Cardiologist.\n\nImpact: Reduces wrong\nconsultations by 40%.',
     d.BLUE if hasattr(d, 'BLUE') else d.B, 'Symptom -> Specialist'),
    ('REPORT ANALYSIS (RAG)',
     'Lab report uploaded -> AI parses\n-> explains in patient language.\n\nExample: "Cholesterol 240 mg/dL\n(high). Reduce fried food.\nFollow up in 3 months."\n\nImpact: 90% of patients\nunderstand their results.',
     d.G, 'Report -> Insight'),
    ('COMPUTER VISION',
     'Medical images compared over\ntime to track healing progress.\n\nExample: Wound Day 1 vs Day 7\n-> "65% healing detected".\n\nImpact: Objective recovery\ntracking, early complication\ndetection.',
     d.R, 'Image -> Progress %'),
    ('VOICE AGENT',
     'Voice-based appointment booking\nin multiple Indian languages.\n\nExample: "Kal ko appointment\nkaro Dr. Sharma se" -> Booked.\n\nImpact: Accessibility for\nilliterate and elderly patients\nwithout smartphones.',
     d.P, 'Voice -> Booking'),
]

for i, (title, desc, color, badge) in enumerate(ai_features):
    x = 12 + i * 71
    y = 36

    # card background
    d.card(x, y, 68, 120, d.W, (230, 230, 235))
    # colored header
    d.bar(x, y, 68, 28, color)
    d.txt(x + 4, y + 3, title, 9, d.W, s='B')
    # badge
    bw = d.get_string_width(badge) + 10
    d.card(x + 4, y + 15, bw, 7, d.W)
    d.txt(x + 4, y + 15.5, badge, 5.5, color, s='B')
    # divider
    d.set_draw_color(*color)
    d.set_line_width(0.4)
    d.line(x + 5, y + 31, x + 63, y + 31)
    # content
    d.mtxt(x + 5, y + 34, desc, 7, d.D, w=58, h=4)

# insight box
d.card(12, 162, 273, 16, d.LGR, d.G)
d.txt(18, 164, 'Key Insight:', 8, (20, 100, 50), s='B')
d.txt(52, 164, 'AI in healthcare market will reach $45 Billion by 2030. CatchQ is building these capabilities from Day 1 - not as an afterthought.', 7.5, (30, 80, 40))

# ================================================================
# SLIDE 8: HOSPITAL BED MANAGEMENT
# ================================================================
d.add_page()
d.bg()
d.topbar('Hospital Bed Management', 'Real-time bed tracking for emergency and ward operations')
d.botbar(8)

# stat cards
d.stat(12, 36, 64, 28, '48', 'Total Beds', d.B)
d.stat(82, 36, 64, 28, '31', 'Occupied (65%)', d.R)
d.stat(152, 36, 64, 28, '12', 'Available (25%)', d.G)
d.stat(222, 36, 64, 28, '3', 'Emergency Free', d.A)

# left: features
d.txt(18, 72, 'KEY CAPABILITIES', 10, d.B, s='B')
d.bar(18, 78, 30, 1, d.G)

bed_features = [
    ('Ward Grid', 'Color-coded bed status: Available (green), Occupied (red), Reserved (amber), Maintenance (gray)'),
    ('Emergency Queue', 'Priority-based bed allocation. Emergency patients get beds in under 5 minutes vs 30+ min manual'),
    ('Admission Tracking', 'Patient admission, expected discharge date, actual discharge, transfer between wards'),
    ('Family Alerts', 'Real-time bed status notifications to family members. No more calling reception repeatedly'),
    ('Ward Setup', 'Create wards: ICU, General, Emergency, OT, Maternity, Pediatric. Set capacity and bed types'),
    ('Equipment', 'Track per-bed: ventilator, cardiac monitor, oxygen, isolation capability. Match patient needs'),
    ('Billing Link', 'Auto-add daily bed charges to patient bill. Different rates per bed type. No manual entry'),
]

yy = 84
for title, desc in bed_features:
    d.numbered_item(18, yy, bed_features.index((title, desc)) + 1, title, desc, d.G)
    yy += 12

# right: bed grid mockup
d.txt(160, 72, 'BED STATUS GRID', 10, d.B, s='B')
d.bar(160, 78, 30, 1, d.G)

wards_data = [
    ('ICU', 8, [1, 1, 0, 1, 0, 1, 1, 0]),
    ('General A', 10, [0, 1, 1, 0, 0, 1, 1, 0, 1, 0]),
    ('Emergency', 6, [1, 0, 1, 0, 1, 0]),
    ('Maternity', 6, [0, 0, 1, 1, 0, 0]),
    ('Pediatric', 6, [1, 0, 0, 1, 0, 1]),
]

gy = 84
for ward_name, count, statuses in wards_data:
    d.txt(160, gy, ward_name, 7.5, d.D, s='B')
    for j, occ in enumerate(statuses):
        bx = 195 + j * 11
        color = d.R if occ else d.G
        d.card(bx, gy - 1, 9, 9, color)
    gy += 14

# legend
d.txt(160, gy + 4, 'Legend:', 7, d.GY, s='B')
d.card(185, gy + 3, 8, 6, d.G)
d.txt(195, gy + 4, 'Available', 6.5, d.GY)
d.card(222, gy + 3, 8, 6, d.R)
d.txt(232, gy + 4, 'Occupied', 6.5, d.GY)
d.card(256, gy + 3, 8, 6, d.A)
d.txt(266, gy + 4, 'Reserved', 6.5, d.GY)

# ================================================================
# SLIDE 9: TRACTION & METRICS
# ================================================================
d.add_page()
d.bg()
d.topbar('Traction & Metrics', 'What we have built and the impact it delivers')
d.botbar(9)

# left: What's Built
d.txt(18, 36, 'WHAT WE HAVE BUILT', 11, d.B, s='B')
d.bar(18, 42, 35, 1.5, d.G)

built_items = [
    ('11', 'Mobile app screens'),
    ('8', 'Admin dashboard pages'),
    ('30+', 'REST API endpoints'),
    ('Socket.io', 'Real-time WebSocket gateway'),
    ('22', 'Landing page components'),
    ('11', 'Database tables (core + beds)'),
    ('6', 'Backend modules'),
    ('14', 'Pitch deck slides'),
]

yy = 48
for val, desc in built_items:
    # card with colored left border
    d.card(18, yy, 132, 13, d.LG)
    d.bar(18, yy, 3, 13, d.G)
    d.txt(24, yy + 3, val, 9, d.G, s='B')
    d.set_font('Helvetica', '', 7)
    d.set_text_color(*d.D)
    d.set_xy(24 + d.get_string_width(val) + 4, yy + 3)
    d.cell(100, 7, desc, align='L')
    yy += 15

# right: Impact Metrics
d.txt(162, 36, 'IMPACT METRICS', 11, d.B, s='B')
d.bar(162, 42, 35, 1.5, d.G)

# Big stat cards - 2x2 grid with proper spacing
d.stat(162, 48, 58, 36, 'TBD', 'Revenue Increase\nfor Clinics', d.G)
d.stat(225, 48, 58, 36, 'TBD', 'No-Show Rate\nReduction', d.R)
d.stat(162, 90, 58, 36, 'TBD', 'Staff Time Saved\nEvery Day', d.B)
d.stat(225, 90, 58, 36, 'TBD', 'Patient Satisfaction\nTarget', (27, 120, 90))

# Testimonial box with accent
d.card(12, 135, 273, 20, d.LB)
d.bar(12, 135, 4, 20, d.B)
d.set_font('Helvetica', 'B', 22)
d.set_text_color(*d.B)
d.set_xy(20, 135)
d.cell(10, 10, '"')
d.set_font('Helvetica', 'B', 8)
d.set_xy(30, 137)
d.cell(200, 6, 'CatchQ streamlines our queue and reduces patient wait times significantly.')
d.set_font('Helvetica', '', 7)
d.set_text_color(*d.GY)
d.set_xy(30, 144)
d.cell(200, 6, 'The real-time dashboard has transformed how we manage daily operations.')
d.set_font('Helvetica', 'I', 7)
d.set_xy(175, 150)
d.cell(100, 5, '- Clinic Owner, Gurugram  |  Beta User')

# Bottom: validation
d.card(12, 162, 273, 16, d.LGR, d.G)
d.bar(12, 162, 4, 16, d.G)
d.txt(20, 164.5, 'Validation:', 8, (20, 100, 50), s='B')
d.txt(52, 164.5, 'Platform tested with beta clinics. Working end-to-end from booking to billing.', 7.5, (30, 80, 40))

# ================================================================
# SLIDE 10: BUSINESS MODEL
# ================================================================
d.add_page()
d.bg()
d.topbar('Business Model', 'Multiple revenue streams for sustainable growth')
d.botbar(10)

# Pricing cards
plans = [
    ('Starter', 'Rs. 2,999', '/month', 'For small clinics\n(1-2 doctors)', [
        'WhatsApp booking', 'Up to 2 doctors', 'Basic queue mgmt',
        'Digital receipts', 'Email support', 'Mobile app access'
    ], d.GY, False),
    ('Professional', 'Rs. 5,999', '/month', 'For growing clinics\n(3-5 doctors)', [
        'Everything in Starter', 'Up to 5 doctors', 'Smart TV display',
        'Advanced analytics', 'Auto reminders', 'Priority support'
    ], d.G, True),
    ('Enterprise', 'Rs. 9,999', '/month', 'For hospitals\n& chain clinics', [
        'Everything in Pro', 'Unlimited doctors', 'Multi-location',
        'API access', 'Dedicated manager', '24/7 phone support'
    ], d.B, False),
]

for i, (name, price, period, target, feats, color, popular) in enumerate(plans):
    x = 15 + i * 94
    y = 36
    # card with shadow
    d.card(x + 1, y + 1, 88, 102, (215, 215, 220))
    d.card(x, y, 88, 102, d.W)
    # top accent
    d.bar(x, y, 88, 5, color)
    # popular badge
    if popular:
        d.card(x + 20, y - 6, 48, 10, d.G)
        d.txt(x + 20, y - 4.5, 'MOST POPULAR', 7, d.W, s='B', a='C')
    # plan name
    d.txt(x + 3, y + 10, name, 14, d.D, s='B', a='C')
    # price
    d.txt(x + 3, y + 26, price, 22, color, s='B', a='C')
    d.txt(x + 3, y + 38, period, 9, d.GY, a='C')
    # target
    d.mtxt(x + 5, y + 46, target, 7.5, d.GY, w=78, h=3.5, a='C')
    # divider
    d.set_draw_color(*color)
    d.set_line_width(0.5)
    d.line(x + 8, y + 58, x + 80, y + 58)
    # features
    fy = y + 62
    for f in feats:
        d.txt(x + 8, fy, '+', 7, d.G, s='B')
        d.txt(x + 14, fy, f, 7, d.D)
        fy += 7.5

# Revenue streams
d.txt(18, 148, 'REVENUE STREAMS', 10, d.B, s='B')
d.bar(18, 154, 30, 1, d.G)

streams = [
    ('SaaS', 'Monthly subscriptions\n(recurring revenue)', d.G, 'PRIMARY'),
    ('TXN', '1-2% per payment\ntransaction', d.B, 'PER TXN'),
    ('Pharmacy', '5-10% commission\non medicine orders', d.P, 'COMMISSION'),
    ('AI Add-on', 'Rs. 999/month\npremium AI features', d.R, 'ADD-ON'),
    ('Bed Module', 'Rs. 4,999/month\nhospital bed tracking', d.T, 'MODULE'),
]

sx = 18
for icon, desc, color, badge in streams:
    # card with shadow
    d.card(sx + 1, 161, 50, 28, (215, 215, 220))
    d.card(sx, 160, 50, 28, d.LG)
    d.bar(sx, 160, 50, 4, color)
    d.txt(sx + 3, 167, icon, 9, color, s='B')
    d.mtxt(sx + 3, 174, desc, 6, d.GY, w=44, h=3.5)
    # badge
    bw2 = d.get_string_width(badge) + 6
    d.card(sx + 44 - bw2, 163, bw2, 5.5, color)
    d.txt(sx + 44 - bw2, 163.5, badge, 4.5, d.W, s='B', a='C')
    sx += 54

# ================================================================
# SLIDE 11: MARKET OPPORTUNITY
# ================================================================
d.add_page()
d.bg()
d.topbar('Market Opportunity', 'Massive addressable market with clear product-market fit')
d.botbar(11)

# India market
d.txt(18, 36, 'INDIA  (PRIMARY MARKET)', 12, d.B, s='B')
d.bar(18, 43, 35, 1.5, d.G)

india_stats = [
    ('10 Lakh+', 'Clinics as total\naddressable market', d.G),
    ('30,000+', 'Hospitals needing\nbed management', d.B),
    ('Rs. 50K Cr+', 'Healthcare IT\nmarket by 2028', d.A),
    ('90%', 'Patients prefer\nWhatsApp', d.P),
]

for i, (val, lbl, color) in enumerate(india_stats):
    x = 18 + i * 68
    d.card(x, 48, 63, 24, d.W, (230, 230, 235))
    d.bar(x, 48, 63, 3, color)
    d.txt(x + 3, 53, val, 13, color, s='B')
    d.mtxt(x + 3, 61, lbl, 6.5, d.GY, w=57, h=3.5)

# Global market
d.txt(18, 80, 'GLOBAL  (EXPANSION MARKET)', 12, d.B, s='B')
d.bar(18, 87, 35, 1.5, d.A)

global_stats = [
    ('$1.2 Billion', 'Queue Management\nMarket by 2028', d.G),
    ('$8.4 Billion', 'Clinic Management\nMarket by 2028', d.B),
    ('$45 Billion', 'AI in Healthcare\nby 2030', d.R),
]

for i, (val, lbl, color) in enumerate(global_stats):
    x = 18 + i * 90
    d.card(x, 92, 85, 24, d.W, (230, 230, 235))
    d.bar(x, 92, 85, 3, color)
    d.txt(x + 3, 97, val, 13, color, s='B')
    d.mtxt(x + 3, 105, lbl, 6.5, d.GY, w=79, h=3.5)

# Growth targets table
d.txt(18, 126, '3-YEAR GROWTH ROADMAP', 11, d.B, s='B')
d.bar(18, 132, 35, 1.5, d.G)

# table header
d.bar(18, 138, 261, 9, d.B)
cols = ['Timeline', 'Clinics Onboarded', 'Doctors on Platform', 'Annual Recurring Revenue', 'Market Share']
widths = [50, 55, 52, 55, 49]
cx = 18
for col, w in zip(cols, widths):
    d.txt(cx + 2, 139, col, 7, d.W, s='B')
    cx += w

# table rows
rows = [
    ['Year 1 (2027)', '10,000 clinics', '25,000 doctors', 'Rs. 3-5 Cr ARR', '0.1%'],
    ['Year 2 (2028)', '50,000 clinics', '1,25,000 doctors', 'Rs. 20-30 Cr ARR', '0.5%'],
    ['Year 3 (2029)', '2,00,000 clinics', '5,00,000 doctors', 'Rs. 100+ Cr ARR', '2.0%'],
]
for i, row in enumerate(rows):
    ry = 147 + i * 10
    if i % 2 == 0:
        d.bar(18, ry, 261, 9, d.LG)
    cx = 18
    for val, w in zip(row, widths):
        d.txt(cx + 2, ry + 1.5, val, 7.5, d.D)
        cx += w

# TAM/SAM/SOM
d.txt(18, 182, 'MARKET SIZING', 10, d.B, s='B')
d.bar(18, 188, 25, 1, d.G)

tam = [('TAM', 'Rs. 50,000 Cr', 'Total clinic IT spend'), ('SAM', 'Rs. 5,000 Cr', 'SaaS-able segment'), ('SOM', 'Rs. 500 Cr', 'Year 3 target')]
sx = 18
for label, val, desc in tam:
    d.card(sx, 192, 82, 12, d.LG)
    d.txt(sx + 3, 193, label, 8, d.G, s='B')
    d.txt(sx + 18, 193, val, 8, d.D, s='B')
    d.txt(sx + 52, 193.5, desc, 6, d.GY)
    sx += 86

# ================================================================
# SLIDE 12: TEAM
# ================================================================
d.add_page()
d.bg()
d.topbar('Team', 'The people building India clinic operating system')
d.botbar(12)

d.txt(0, 42, 'TEAM', 14, d.B, s='B', a='C')

roles = [
    ('Founder & CEO', '[Your Name]', 'Business strategy,\nproduct vision,\nhealthcare domain expertise', d.B),
    ('Co-founder & CTO', '[Name]', 'Full-stack development,\nsystem architecture,\nAI/ML engineering', d.G),
    ('Advisor', '[Name]', 'Healthcare industry mentor,\nIIT KGP network,\nstrategic partnerships', d.A),
]

for i, (role, name, desc, color) in enumerate(roles):
    x = 30 + i * 89
    y = 55
    # card
    d.card(x, y, 80, 65, d.W, (230, 230, 235))
    # top accent
    d.bar(x, y, 80, 4, color)
    # avatar circle
    d.dot(x + 30, y + 10, 14, color)
    initial = name[0] if name[0] != '[' else '?'
    d.set_font('Helvetica', 'B', 12)
    d.set_text_color(*d.W)
    d.set_xy(x + 30, y + 12)
    d.cell(14, 10, initial, align='C')
    # role
    d.txt(x + 3, y + 30, role, 9, color, s='B', a='C')
    # name
    d.txt(x + 3, y + 38, name, 10, d.D, s='B', a='C')
    # desc
    d.mtxt(x + 5, y + 46, desc, 7, d.GY, w=70, h=3.5, a='C')

d.txt(0, 135, 'Add team credentials, logos, and photos here', 9, d.GY, a='C')

# ================================================================
# SLIDE 13: ASK & USE OF FUNDS
# ================================================================
d.add_page()
d.bg()
d.topbar('Ask & Use of Funds', 'Investment to scale CatchQ across India')
d.botbar(13)

# amount banner
d.card(60, 36, 177, 18, d.LGR, d.G)
d.txt(60, 38.5, 'SEEKING: Rs. 30-35 LAKHS  (SEED FUND)', 12, d.G, s='B', a='C')

# Allocation table
d.txt(18, 62, 'USE OF FUNDS', 11, d.B, s='B')
d.bar(18, 68, 25, 1, d.G)

d.bar(18, 74, 261, 9, d.B)
d.txt(20, 75, 'Category', 8, d.W, s='B')
d.txt(110, 75, 'Alloc %', 8, d.W, s='B')
d.txt(145, 75, 'Description', 8, d.W, s='B')

funds = [
    ('AI Engine Development', '30%', 'RAG, Computer Vision, Voice Agent', d.B),
    ('Sales & Marketing', '25%', 'Pilot deployments, clinic onboarding', d.G),
    ('Pharmacy Integration', '15%', 'Medicine alerts, delivery API', d.P),
    ('Hospital Bed Mgmt', '15%', 'Ward tracking, emergency allocation', d.T),
    ('Infrastructure & Ops', '10%', 'Hosting, domain, dev tools', d.A),
    ('Legal & Compliance', '5%', 'HIPAA compliance, data protection', d.R),
]

for i, (cat, pct, desc, color) in enumerate(funds):
    ry = 83 + i * 9
    if i % 2 == 0:
        d.bar(18, ry, 261, 8, d.LG)
    d.dot(21, ry + 1.5, 3, color)
    d.txt(27, ry + 1, cat, 7.5, d.D, s='B')
    d.txt(110, ry + 1, pct, 7.5, color, s='B')
    d.txt(145, ry + 1, desc, 7.5, d.GY)

# Visual bar chart
d.txt(18, 142, 'ALLOCATION BREAKDOWN', 10, d.B, s='B')
d.bar(18, 148, 25, 1, d.G)

bar_data = [('AI 30%', 30, d.B), ('Sales 25%', 25, d.G), ('Pharmacy 15%', 15, d.P), ('Bed 15%', 15, d.T), ('Ops 10%', 10, d.A), ('Legal 5%', 5, d.R)]
bx = 18
for label, pct, color in bar_data:
    w = pct * 2.4
    d.bar(bx, 154, w, 12, color)
    if w > 20:
        d.txt(bx + 2, 156, label, 6.5, d.W, s='B')
    bx += w

# Timeline
d.card(12, 174, 273, 14, d.LB, d.B)
d.txt(18, 176.5, 'Timeline:', 8, d.B, s='B')
d.txt(44, 176.5, 'Funds deployed over 12 months with quarterly milestone reviews. Expected ROI: 10x within 3 years.', 7.5, d.D)

# ================================================================
# SLIDE 14: VISION
# ================================================================
d.add_page()
d.set_fill_color(*d.B)
d.rect(0, 0, 297, 210, 'F')
# decorative
d.set_fill_color(30, 90, 140)
d.ellipse(-30, -30, 100, 100, 'F')
d.ellipse(250, 170, 80, 80, 'F')
d.ellipse(200, -20, 50, 50, 'F')

# green bar
d.bar(20, 60, 60, 4, d.G)

# vision text
d.txt(20, 70, "To become India's #1", 28, d.W, s='B')
d.txt(20, 92, 'Clinic & Hospital', 34, d.W, s='B')
d.txt(20, 116, 'Operating System', 34, d.W, s='B')

# divider
d.set_draw_color(*d.G)
d.set_line_width(1.2)
d.line(20, 132, 130, 132)

# vision description
d.mtxt(20, 138, "Making healthcare accessible by eliminating appointment friction,\nenabling AI-assisted diagnosis, connecting pharmacies to patients,\nand managing hospital beds efficiently - for 10 Lakh+ clinics\nand 50 Crore+ patients.", 11, (190, 210, 230), w=200, h=6)

# tagline
d.txt(20, 168, "Healthcare shouldn't start with waiting.", 16, d.G, s='B')
d.txt(20, 180, 'It should start with CatchQ.', 16, d.G, s='B')

# contact
d.txt(20, 196, '[Your Name]  |  [Your Email]  |  [Your Phone]', 9, (150, 170, 190))
d.txt(20, 202, 'IIT Kharagpur Platinum Jubilee Seed Fund', 8, (120, 140, 160))

# ================================================================
# SAVE
# ================================================================
out = r"C:\Users\sumit\Downloads\Catchq\CatchQ_SeedFund_PitchDeck.pdf"
d.output(out)
print(f"PDF generated: {out}")
print("14 professional infographic slides")
