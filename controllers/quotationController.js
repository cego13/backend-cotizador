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

    // === Función para dibujar el marco verde ===
    const drawPageBorder = () => {
      const margin = 20;
      const width = doc.page.width - margin * 2;
      const height = doc.page.height - margin * 2;
      doc
        .save()
        .lineWidth(3)
        .strokeColor("#1b5e20")
        .rect(margin, margin, width, height)
        .stroke()
        .restore();
    };

    // === Función para dibujar la franja verde superior e inferior ===
      const drawTopBand = () => {
      doc.save();
      doc.opacity(0.5);
      doc.rect(0, 0, doc.page.width, 40).fill("#7FBF60");
      doc.restore();
    };

      const drawBottomBand = () => {
    doc.save();
    doc.opacity(0.5);
    doc.rect(0, doc.page.height - 40, doc.page.width, 40).fill("#7FBF60");
    doc.restore();
  };
  
  

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

    // === Renderizado de encabezado y fondo ===
    const renderHeader = (isFirstPage = false) => {
      // Dibuja las franjas verdes (superior e inferior)
      drawTopBand();
      drawBottomBand();
      // Marca de agua con logo solo en la primera página
            if (logoBuffer) {
        doc.save();
        doc.opacity(0.1);

        const logoWidth = 620; // más grande que antes (300 → 420)
        const logoHeight = 420; // mismo valor para mantener proporción cuadrada
        const x = (doc.page.width - logoWidth) ;
        const y = (doc.page.height - logoHeight) / 2.5;

        doc.image(logoBuffer, x, y, { width: logoWidth, height: logoHeight });
        doc.restore();
      }

      // Si es la primera página, dibujar marco al final para no tapar el borde
      if (isFirstPage) drawPageBorder();
      doc.moveDown(2);
    };

    // === Dibuja encabezado de la primera página ===
    renderHeader(true);

    // === En cada nueva página ===
    doc.on("pageAdded", () => {
      renderHeader(false);
      drawPageBorder();
    });

    // === Cuerpo ===
    let y = 175;

    doc.fillColor("#000");
    doc.font("Helvetica-Bold").fontSize(18)
      .text(`COTIZACION ${quotation.quotationNumber}`, 45, 45, { align: "weidth" });

    doc.font("Helvetica").fontSize(10)
      .text(`${fechaFormateada}`, 150, 50, { align: "right" });

  
          // === Nombre de la empresa (izquierda) y logo (derecha) en la misma línea ===
      const topY = 100; // altura donde se alinean ambos

      // Nombre de la empresa (izquierda)
      doc.font("Helvetica-Bold")
        .fontSize(18)
        .fillColor("#000")
        .text(`${quotation.company.name}`, 40, topY);

      // Logo de la empresa (derecha)
      if (logoBuffer) {
        const logoWidth = 60;
        const logoHeight = 50;
        const logoX = doc.page.width - logoWidth - 50; // margen derecho
        const logoY = topY - 20; // pequeño ajuste para centrarlo con el texto

        doc.image(logoBuffer, logoX, logoY, { width: logoWidth, height: logoHeight });
      }

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

    if (quotation.client?.contactPosition) {
      doc.font("Helvetica").text(quotation.client.contactPosition.toUpperCase(), 40, y);
      y += 15;
    } else {
      doc.font("Helvetica").text("ESTIMADO/A:", 40, y);
      y += 15;
    }

    if (quotation.client?.contactName) {
      doc.font("Helvetica-Bold").text(quotation.client.contactName.toUpperCase(), 40, y);
    }

    y += 25;
    doc.font("Helvetica").text("Cordial saludo.", 40, y);
    y += 25;

    if (quotation.customMessage) {
      doc.font("Helvetica").fontSize(10).fillColor("#000");
      doc.text(quotation.customMessage, 50, y + 10, { width: 500, align: "justify" });
      y = doc.y + 20;
    }

    // === TABLA DE PRODUCTOS ===
    const drawTable = (startY) => {
  const colX = { desc: 50, qty: 320, unit: 390, total: 470 };
  const colW = { desc: 270, qty: 60, unit: 70, total: 80 };

  // --- Encabezado con verde translúcido ---
  doc.save();
  doc.opacity(0.15); // Verde más suave, transparente
  doc.rect(colX.desc, startY, 500, 22).fill("#1b5e20");
  doc.restore();

  // --- Texto del encabezado ---
  doc.fillColor("#000").font("Helvetica-Bold").fontSize(10);
  doc.text("Descripción", colX.desc + 5, startY + 6, { width: colW.desc });
  doc.text("Cant.", colX.qty + 5, startY + 6, { width: colW.qty, align: "center" });
  doc.text("V. Unitario", colX.unit + 5, startY + 6, { width: colW.unit, align: "center" });
  doc.text("Total", colX.total + 5, startY + 6, { width: colW.total, align: "center" });

  // --- Bordes del encabezado ---
  doc.strokeColor("#000").lineWidth(0.6)
    .rect(colX.desc, startY, 500, 22)
    .stroke();

  const colLinesHeader = [colX.desc, colX.qty, colX.unit, colX.total, colX.total + colW.total];
  colLinesHeader.forEach(x => {
    doc.moveTo(x, startY)
      .lineTo(x, startY + 22)
      .strokeColor("#000")
      .lineWidth(0.6)
      .stroke();
  });

  // --- Filas de contenido ---
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

    // --- Salto de página ---
    if (yPos + rowHeight > 750) {
      doc.addPage();
      yPos = 100;
    }

    // --- Fondo alternado translúcido ---
    if (index % 2 === 0) {
      doc.save();
      doc.opacity(0.0);
      doc.rect(colX.desc, yPos, 500, rowHeight).fill("#1b5e20");
      doc.restore();
    }

    // --- Bordes de la fila ---
    doc.strokeColor("#000").lineWidth(0.4)
      .rect(colX.desc, yPos, 500, rowHeight)
      .stroke();

    const colLines = [colX.desc, colX.qty, colX.unit, colX.total, colX.total + colW.total];
    colLines.forEach(x => {
      doc.moveTo(x, yPos)
        .lineTo(x, yPos + rowHeight)
        .strokeColor("#000")
        .lineWidth(0.4)
        .stroke();
    });

    // --- Contenido de la fila ---
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#000")
      .text(desc.toUpperCase(), colX.desc + 5, yPos + 3, textOptions);

      if (longDesc) {
      const leftMargin = 15;
      doc.font("Helvetica")
        .fontSize(9)
        .fillColor("#000")
        .text(longDesc, colX.desc + leftMargin, yPos + descHeight + 5, {
          width: colW.desc - leftMargin - 5, // se reduce el ancho total del texto
          align: "left",
        });
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

    // === Firma ===
    y += 40;
    if (quotation.notes) {
      doc.fontSize(10).fillColor("#000").text("Observaciones:", 40, y, { underline: true });
      y = doc.y + 10;
      doc.text(quotation.notes, 40, y, { width: 500, align: "justify" });
      y = doc.y + 30;
    }

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
    if (logoBuffer) doc.image(logoBuffer, 50, y + 55, { width: 70, height: 70, fit: [60, 60] });
    

    doc.end();
  } catch (err) {
    next(err);
  }
};