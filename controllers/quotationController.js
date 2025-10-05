const { validationResult } = require("express-validator");
const Quotation = require("../models/Quotation");
const PDFDocument = require("pdfkit");
const axios = require("axios");

// 🧩 Validación de request
const handleValidation = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const err = new Error("Validación fallida");
    err.status = 400;
    err.details = errors.array();
    throw err;
  }
};

// ✅ Crear cotización
exports.createQuotation = async (req, res, next) => {
  try {
    handleValidation(req);
    const quotation = new Quotation(req.body);
    await quotation.save();
    res.status(201).json(quotation);
  } catch (err) {
    if (err.code === 11000) err.message = "El número de cotización ya existe.";
    next(err);
  }
};

// ✅ Listar cotizaciones
exports.getQuotations = async (req, res, next) => {
  try {
    const quotations = await Quotation.find({ isDeleted: false })
      .populate("company", "name email logoUrl representative nit")
      .populate("client", "name email phone city");
    res.json(quotations);
  } catch (err) {
    next(err);
  }
};

// ✅ Obtener cotización por ID
exports.getQuotationById = async (req, res, next) => {
  try {
    handleValidation(req);
    const { id } = req.params;
    const quotation = await Quotation.findOne({ _id: id, isDeleted: false })
      .populate("company", "name email logoUrl representative nit")
      .populate("client", "name email phone city");
    if (!quotation) return res.status(404).json({ message: "Cotización no encontrada" });
    res.json(quotation);
  } catch (err) {
    next(err);
  }
};

// ✅ Actualizar cotización
exports.updateQuotation = async (req, res, next) => {
  try {
    handleValidation(req);
    const { id } = req.params;
    const quotation = await Quotation.findOneAndUpdate(
      { _id: id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );
    if (!quotation) return res.status(404).json({ message: "Cotización no encontrada" });
    res.json(quotation);
  } catch (err) {
    next(err);
  }
};

// ✅ Eliminar (borrado lógico)
exports.deleteQuotation = async (req, res, next) => {
  try {
    handleValidation(req);
    const { id } = req.params;
    const quotation = await Quotation.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!quotation) return res.status(404).json({ message: "Cotización no encontrada" });
    res.json({ message: "Cotización eliminada", quotationId: quotation._id });
  } catch (err) {
    next(err);
  }
};

// ✅ Generar y enviar PDF (multi-página + fondo en todas)
exports.generateQuotationPDF = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id)
      .populate("company")
      .populate("client")
      .lean();

    if (!quotation) return res.status(404).json({ message: "Cotización no encontrada" });

    const date = new Date();
    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    const fechaFormateada = `${meses[date.getMonth()]} ${date.getDate()} de ${date.getFullYear()}`;

    const doc = new PDFDocument({ margin: 40, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=${quotation.quotationNumber}.pdf`);
    doc.pipe(res);

    // === Logo ===
    let logoBuffer = null;
    if (quotation.company.logoUrl) {
      try {
        const response = await axios.get(quotation.company.logoUrl, { responseType: "arraybuffer" });
        logoBuffer = Buffer.from(response.data, "base64");
      } catch {
        console.log("❌ No se pudo cargar el logo de la empresa");
      }
    }

    // === Encabezado ===
    const renderHeader = () => {
      doc.rect(0, 0, doc.page.width, 70).fill("#1b5e20");
      doc.fillColor("#fff").font("Helvetica-Bold").fontSize(20)
        .text(`COTIZACIÓN N° ${quotation.quotationNumber}`, 40, 25);
      doc.font("Helvetica").fontSize(10)
        .text(`Granada, ${fechaFormateada}`, 400, 45, { align: "right" });
      if (logoBuffer) doc.image(logoBuffer, 500, 5, { width: 50 });
      if (logoBuffer) {
        doc.save();
        doc.opacity(0.08);
        doc.image(logoBuffer, (doc.page.width - 300) / 2, (doc.page.height - 300) / 2, { width: 300 });
        doc.restore();
      }
      doc.moveDown(2);
    };
    renderHeader();
    doc.on("pageAdded", renderHeader);

    // === Cuerpo ===
    let y = 175;

    // Empresa emisora
    doc.fontSize(12).fillColor("#1b5e20").text("EMPRESA EMISORA", 40, 90);
    doc.moveTo(40, 105).lineTo(560, 105).stroke("#1b5e20");
    doc.font("Helvetica-Bold").fontSize(18).fillColor("#000").text(`${quotation.company.name}`, 40, 115);

    let yEmpresa = doc.y + 10;
    doc.font("Helvetica").fontSize(10);
    if (quotation.company.nit) doc.text(`NIT: ${quotation.company.nit}`, 40, yEmpresa);

    // Datos del cliente
    doc.font("Helvetica").fontSize(11).fillColor("#000").text("SEÑORES:", 40, y);
    y += 15;
    if (quotation.client?.name) {
      doc.font("Helvetica-Bold").text(quotation.client.name.toUpperCase(), 40, y);
      y += 25;
    }
    doc.font("Helvetica").text("ESTIMADO/A:", 40, y);
    if (quotation.client?.contactName) {
      y += 15;
      doc.font("Helvetica-Bold").text(quotation.client.contactName.toUpperCase(), 40, y);
    }

    y += 25;
    doc.font("Helvetica").text("Cordial saludo.", 40, y);
    y += 25;

    // Mensaje personalizado
    if (quotation.customMessage) {
      doc.font("Helvetica").fontSize(10).fillColor("#000");
      doc.text(quotation.customMessage, 50, y + 10, { width: 500, align: "justify" });
      y = doc.y + 20;
    }

   // === TABLA DE PRODUCTOS (continua sin repetir encabezado) ===
const drawTable = (startY) => {
  const colX = { desc: 50, qty: 320, unit: 390, total: 470 };
  const colW = { desc: 270, qty: 60, unit: 70, total: 80 };

  // Dibujar encabezado solo una vez
  doc.save();
  doc.rect(colX.desc, startY, 500, 22).fill("#1b5e20");
  doc.restore();
  doc.fillColor("#fff").font("Helvetica-Bold").fontSize(10);
  doc.text("Descripción", colX.desc + 5, startY + 6, { width: colW.desc });
  doc.text("Cant.", colX.qty + 5, startY + 6, { width: colW.qty, align: "center" });
  doc.text("V. Unitario", colX.unit + 5, startY + 6, { width: colW.unit, align: "center" });
  doc.text("Total", colX.total + 5, startY + 6, { width: colW.total, align: "center" });
  doc.fillColor("#000");

  let yPos = startY + 22;

  quotation.items.forEach((item, index) => {
    const desc = item.description || "";
    const longDesc = item.longDescription || "";
    const quantity = item.quantity || 0;
    const unit = item.unitPrice || 0;
    const total = item.total || 0;

    const textOptions = { width: colW.desc - 5, align: "left" };
    const descHeight = doc.heightOfString(desc.toUpperCase(), textOptions);
    const longDescHeight = longDesc ? doc.heightOfString(longDesc, textOptions) : 0;
    const rowHeight = descHeight + longDescHeight + 8;

    // Si la fila no cabe, agregar nueva página con margen superior
    if (yPos + rowHeight > 750) {
      doc.addPage();
      yPos = 100; // margen superior nuevo para no superponerse con encabezado
    }

    // Fondo alternado
    if (index % 2 === 0) {
      doc.save();
doc.opacity(0.2); // más bajo = más transparente
if (index % 2 === 0) doc.rect(colX.desc, yPos, 500, rowHeight).fill("#f9f9f9");
doc.restore();
doc.opacity(1);
    }

    // Bordes de fila
    doc.strokeColor("#ddd").lineWidth(0.5)
      .rect(colX.desc, yPos, 500, rowHeight)
      .stroke();

    // Texto
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#000")
      .text(desc.toUpperCase(), colX.desc + 5, yPos + 3, textOptions);

    if (longDesc) {
      doc.font("Helvetica").fontSize(9).fillColor("#555")
        .text(longDesc, colX.desc + 5, yPos + descHeight + 5, textOptions);
    }

    doc.font("Helvetica").fontSize(10).fillColor("#000");
    doc.text(quantity, colX.qty, yPos + 5, { width: colW.qty, align: "center" });
    doc.text(`$${unit.toLocaleString()}`, colX.unit, yPos + 5, { width: colW.unit, align: "right" });
    doc.text(`$${total.toLocaleString()}`, colX.total, yPos + 5, { width: colW.total, align: "right" });

    yPos += rowHeight;
  });

  return yPos;
};

y = drawTable(y);


    // === Totales ===
    y += 15;
    if (y > 700) { doc.addPage(); y = 120; }
    doc.fontSize(10);
    doc.text("Subtotal:", 400, y);
    doc.text(`$${quotation.subtotal.toLocaleString()}`, 480, y, { width: 80, align: "right" });
    y += 15;
    doc.text("IVA (19%):", 400, y);
    doc.text(`$${quotation.iva.toLocaleString()}`, 480, y, { width: 80, align: "right" });
    y += 15;
    doc.font("Helvetica-Bold");
    doc.text("TOTAL:", 400, y);
    doc.text(`$${quotation.total.toLocaleString()}`, 480, y, { width: 80, align: "right" });
    doc.font("Helvetica");

    // === Observaciones ===
    y += 40;
    if (quotation.notes) {
      doc.fontSize(10).fillColor("#000").text("Observaciones:", 40, y, { underline: true });
      y = doc.y + 10;
      doc.text(quotation.notes, 40, y, { width: 500, align: "justify" });
      y = doc.y + 30;
    }

    // === Firma ===
    y += 15;
    if (y > 700) { doc.addPage(); y = 120; }
    doc.fontSize(10).fillColor("#000").text("Cordialmente,", 40, y);
    y += 15;
    const rep = quotation.company.representative || {};
    if (rep.signatureUrl) {
      try {
        const response = await axios.get(rep.signatureUrl, { responseType: "arraybuffer" });
        const signatureBuffer = Buffer.from(response.data, "base64");
        doc.image(signatureBuffer, 40, y, { width: 100, height: 50 });
        y += 60;
      } catch {
        doc.text("[Firma no disponible]", 40, y);
        y += 15;
      }
    }
    doc.font("Helvetica-Bold").fontSize(13);
    doc.text((rep.name || "").toUpperCase(), 40, y);
    doc.text((rep.position || "").toUpperCase(), 40, y + 15);
    doc.fontSize(10);
    doc.text(rep.email || "", 40, y + 30);
    doc.text(`Contacto: ${rep.phone || ""}`, 40, y + 45);

    doc.end();
  } catch (err) {
    next(err);
  }
};


