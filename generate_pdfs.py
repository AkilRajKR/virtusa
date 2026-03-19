from fpdf import FPDF
import os

os.makedirs("demo_files", exist_ok=True)

# 1. Approved Case
pdf1 = FPDF()
pdf1.add_page()
pdf1.set_font("Arial", size=12)
pdf1.cell(200, 10, txt="Patient Prior Authorization Request", ln=1, align='C')
pdf1.cell(200, 10, txt="---------------------------------------------------", ln=1, align='C')
pdf1.cell(200, 10, txt="Patient Name: John Doe", ln=1)
pdf1.cell(200, 10, txt="DOB: 1980-05-15", ln=1)
pdf1.cell(200, 10, txt="Date of Service: 2026-03-09", ln=1)
pdf1.cell(200, 10, txt="Diagnosis: Primary open-angle glaucoma (H40.11XO)", ln=1)
pdf1.cell(200, 10, txt="Treatment: Selective Laser Trabeculoplasty (SLT)", ln=1)
pdf1.ln(10)
pdf1.cell(200, 10, txt="Doctor Notes:", ln=1)
pdf1.multi_cell(0, 10, txt="Patient has been using topical medications (Latanoprost) for 6 months but IOP remains elevated at 24mmHg. Patient is experiencing side effects from drops (hyperemia). Visual field testing shows early progression. Optic coherence tomography indicates thinning of nerve fiber layer. Medical necessity dictates advancing to SLT to prevent further vision loss.")
pdf1.ln(10)
pdf1.cell(200, 10, txt="Required Medical Evidence attached in file:", ln=1)
pdf1.multi_cell(0, 10, txt="- OCT Imaging Report: Confirms NFL thinning.\n- Visual Field Report: Confirms progression.\n- Prescription History: Latanoprost prescribed and filled for 6 months.")
pdf1.output("demo_files/patient_approved.pdf")

# 2. Rejected Case
pdf2 = FPDF()
pdf2.add_page()
pdf2.set_font("Arial", size=12)
pdf2.cell(200, 10, txt="Patient Prior Authorization Request", ln=1, align='C')
pdf2.cell(200, 10, txt="---------------------------------------------------", ln=1, align='C')
pdf2.cell(200, 10, txt="Patient Name: Jane Smith", ln=1)
pdf2.cell(200, 10, txt="DOB: 1992-11-20", ln=1)
pdf2.cell(200, 10, txt="Date of Service: 2026-03-09", ln=1)
pdf2.cell(200, 10, txt="Diagnosis: Lower back pain", ln=1)
pdf2.cell(200, 10, txt="Treatment: MRI of Lumbar Spine", ln=1)
pdf2.ln(10)
pdf2.cell(200, 10, txt="Doctor Notes:", ln=1)
pdf2.multi_cell(0, 10, txt="Patient complains of lower back pain starting 3 days ago after lifting boxes. No radiating pain. Advised to take rest and ibuprofen.")
pdf2.ln(10)
pdf2.cell(200, 10, txt="Required Medical Evidence attached in file:", ln=1)
pdf2.multi_cell(0, 10, txt="- None provided. Note: Standard policy requires 6 weeks of conservative therapy (PT, medication) before Advanced Imaging (MRI) is approved for routine non-radicular back pain.")
pdf2.output("demo_files/patient_rejected.pdf")

print("PDFs generated successfully.")
