import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

export const generatePrescriptionPDF = (prescription, patient, doctor) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, `prescription-${Date.now()}.pdf`);
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(20).text("Clinic Prescription", { align: "center" });
    doc.moveDown();

    doc.text(`Patient: ${patient.name}`);
    doc.text(`Doctor: ${doctor.name}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    doc.text("Medicines:");
    prescription.medicines.forEach((med, index) => {
      doc.text(
        `${index + 1}. ${med.name} - ${med.dosage} - ${med.duration}`
      );
    });

    doc.moveDown();
    doc.text("Instructions:");
    doc.text(prescription.instructions || "None");

    doc.end();

    stream.on("finish", () => resolve(filePath));
    stream.on("error", reject);
  });
};
