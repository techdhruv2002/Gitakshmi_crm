const Lead = require("../models/Lead");
const Deal = require("../models/Deal");
const Customer = require("../models/Customer");
const Contact = require("../models/Contact");
const { runAutomation } = require("../utils/automationEngine");
const { calculateLeadScore, assignLeadAutomatically } = require("../utils/leadManagement");

/* ================= CREATE LEAD ================= */
exports.createLead = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    // STEP 11 — DUPLICATE LEAD DETECTION (Stability)
    let existingLead = await Lead.findOne({
      $or: [{ email: req.body.email }, { phone: req.body.phone }],
      companyId: req.user.companyId,
      isDeleted: false
    });

    if (existingLead) {
      existingLead.notes = (existingLead.notes || "") + "\n\nDuplicate Creation Attempt: " + (req.body.notes || "No notes");
      await existingLead.save();
      console.log("Existing Lead updated instead of creating new:", existingLead._id);
      return res.json({ success: true, message: "Lead already exists, updated notes.", data: existingLead });
    }

    const lead = await Lead.create({
      ...req.body,
      companyId: req.user.companyId,
      branchId: req.user.branchId || req.body.branchId || null,
      createdBy: req.user.id,
      assignedTo: req.user.role === "sales" ? req.user.id : (req.body.assignedTo || null)
    });

    if (req.body.sourceId) {
      const LeadSource = require("../models/LeadSource");
      const sourceObj = await LeadSource.findById(req.body.sourceId);
      if (sourceObj) {
        lead.source = sourceObj.name;
        await lead.save();
      }
    }

    // Module 2: Automatic Lead Assignment if unassigned
    if (!lead.assignedTo) {
      await assignLeadAutomatically(lead._id, req.user.companyId, lead.branchId);
    }

    // Module 1: AI Lead Scoring
    await calculateLeadScore(lead._id);

    // Refresh lead data for response
    const finalizedLead = await Lead.findById(lead._id).populate("assignedTo", "name email");

    // Run Automations
    await runAutomation("lead_created", req.user.companyId, { record: finalizedLead, userId: req.user.id, ...finalizedLead.toObject() });

    console.log("Lead created:", finalizedLead._id, "for company:", req.user.companyId);

    res.status(201).json({
      success: true,
      message: "Lead Created successfully",
      data: finalizedLead
    });

  } catch (error) {
    console.error("CREATE LEAD ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ================= GET LEADS ================= */
exports.getLeads = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { search, status } = req.query;
    let filter = { isDeleted: false };
    if (search) filter.name = { $regex: search, $options: "i" };
    if (status) filter.status = status;

    if (req.user.role !== "super_admin") {
      filter.companyId = req.user.companyId;
      if (req.user.role === "branch_manager") {
        filter.branchId = req.user.branchId;
      }
      if (req.user.role === "sales") {
        filter.assignedTo = req.user.id;
      }
    }

    const leads = await Lead.find(filter)
      .populate("assignedTo", "name email role")
      .populate("createdBy", "name email")
      .populate("sourceId")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: leads });

  } catch (error) {
    console.error("GET LEADS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ================= UPDATE LEAD ================= */
exports.updateLead = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const query = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;
    if (req.user.role === "sales") query.assignedTo = req.user.id;

    const { companyId, branchId, createdBy, isDeleted, isConverted, ...safeBody } = req.body;

    const previousLead = await Lead.findOne(query);
    if (!previousLead) return res.status(404).json({ success: false, message: "Lead not found" });

    const updateData = { ...req.body };
    if (req.body.sourceId) {
      const LeadSource = require("../models/LeadSource");
      const sourceObj = await LeadSource.findById(req.body.sourceId);
      if (sourceObj) {
        updateData.source = sourceObj.name;
      }
    }

    const lead = await Lead.findOneAndUpdate(
      query,
      updateData,
      { new: true }
    );

    // STEP 8 — CUSTOMER CREATION on "Won"
    if (safeBody.status && safeBody.status.toLowerCase() === "won" && previousLead.status.toLowerCase() !== "won") {
      if (!lead.isConverted) {
        const Customer = require("../models/Customer");
        const Contact = require("../models/Contact");

        const customer = await Customer.create({
          name: lead.companyName || lead.name + " Account",
          phone: lead.phone,
          email: lead.email,
          companyId: lead.companyId,
          branchId: lead.branchId,
          createdBy: req.user.id
        });

        const contact = await Contact.create({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          customerId: customer._id,
          companyId: lead.companyId,
          branchId: lead.branchId,
          assignedTo: lead.assignedTo || req.user.id,
          createdBy: req.user.id
        });

        lead.isConverted = true;
        await lead.save();
      }
    }

    res.json({ success: true, data: lead });
  } catch (error) {
    console.error("UPDATE LEAD ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= ASSIGN LEAD ================= */
exports.assignLead = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { assignedTo } = req.body;
    if (!assignedTo) return res.status(400).json({ success: false, message: "assignedTo is required" });

    const query = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;

    const lead = await Lead.findOneAndUpdate(
      query,
      { assignedTo },
      { new: true }
    ).populate("assignedTo", "name email");

    if (!lead) return res.status(404).json({ success: false, message: "Lead not found or access denied" });

    const { createNotification } = require("../utils/notificationService");
    await createNotification({
      userId: assignedTo,
      companyId: lead.companyId,
      title: "New Lead Assigned",
      message: `You have been assigned a new lead: ${lead.name}`,
      type: "info"
    });

    res.json({ success: true, message: "Lead assigned successfully", data: lead });
  } catch (error) {
    console.error("ASSIGN LEAD ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ================= DELETE LEAD (Soft Delete) ================= */
exports.deleteLead = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const query = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;
    if (req.user.role === "sales") query.assignedTo = req.user.id;

    const lead = await Lead.findOneAndUpdate(query, { isDeleted: true });
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    res.json({ success: true, message: "Lead Deleted Successfully" });

  } catch (error) {
    console.error("DELETE LEAD ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= CONVERT LEAD TO DEAL ================= */
exports.convertLead = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });

    const query = { _id: req.params.id, companyId: req.user.companyId };
    if (req.user.role === "branch_manager") query.branchId = req.user.branchId;
    if (req.user.role === "sales") query.assignedTo = req.user.id;

    const lead = await Lead.findOne(query);

    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found in your access scope" });
    }

    if (lead.isConverted) {
      return res.status(400).json({ success: false, message: "Lead already converted" });
    }

    const customer = await Customer.create({
      name: lead.companyName || lead.name + " Account",
      phone: lead.phone,
      email: lead.email,
      companyId: lead.companyId,
      branchId: lead.branchId,
      createdBy: req.user.id
    });

    const contact = await Contact.create({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      customerId: customer._id,
      companyId: lead.companyId,
      branchId: lead.branchId,
      assignedTo: lead.assignedTo || req.user.id,
      createdBy: req.user.id
    });

    const deal = await Deal.create({
      title: lead.name + " Opportunity",
      value: lead.value || 0,
      stage: "New",
      leadId: lead._id,
      customerId: customer._id,
      contactId: contact._id,
      companyId: lead.companyId,
      branchId: lead.branchId || null,
      assignedTo: lead.assignedTo || req.user.id,
      createdBy: req.user.id
    });

    lead.isConverted = true;
    lead.status = "Won";
    await lead.save();

    await runAutomation("deal_created", lead.companyId, { record: deal, userId: req.user.id });

    res.json({
      success: true,
      message: "Lead Converted to Customer & Deal Successfully",
      data: { customer, contact, deal }
    });

  } catch (error) {
    console.error("CONVERT LEAD ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};