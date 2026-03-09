const Activity = require("../models/Activity");
const Lead = require("../models/Lead");
const Deal = require("../models/Deal");
const Call = require("../models/Call");
const Meeting = require("../models/Meeting");
const Todo = require("../models/Todo");
const Note = require("../models/Note");
const Message = require("../models/Message");

// ── LOG NEW ACTIVITY ──────────────────────────────────────────────────────────
exports.createActivity = async (req, res) => {
    try {
        const { leadId, dealId, customerId, type, note } = req.body;

        if (!type || !note) {
            return res.status(400).json({ success: false, message: "Type and note are required." });
        }

        const activity = await Activity.create({
            leadId: leadId || null,
            dealId: dealId || null,
            customerId: customerId || null,
            userId: req.user.id,
            companyId: req.user.companyId,
            type,
            note
        });

        res.status(201).json({ success: true, data: activity });
    } catch (error) {
        console.error("CREATE ACTIVITY ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── GET ACTIVITIES BY LEAD ────────────────────────────────────────────────────
exports.getActivitiesByLead = async (req, res) => {
    try {
        const activities = await Activity.find({
            leadId: req.params.leadId,
            companyId: req.user.companyId
        }).populate("userId", "name").sort({ createdAt: -1 });

        res.json({ success: true, data: activities });
    } catch (error) {
        console.error("GET ACTIVITIES ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ── UNIFIED TIMELINE (Existing + New Activities) ──────────────────────────────
exports.getActivityTimeline = async (req, res) => {
    try {
        const { leadId, customerId, dealId } = req.query;
        let match = { companyId: req.user.companyId };

        if (leadId) match.leadId = leadId;
        if (customerId) match.customerId = customerId;
        if (dealId) match.dealId = dealId;

        const [leads, deals, calls, meetings, todos, notes, messages, logActivities] = await Promise.all([
            Lead.find(leadId ? { _id: leadId, ...match } : { _id: null }),
            Deal.find(dealId ? { _id: dealId, ...match } : (customerId ? { customerId, ...match } : { _id: null })),
            Call.find(match),
            Meeting.find(match),
            Todo.find(match),
            Note.find(match),
            Message.find(match),
            Activity.find(match).populate("userId", "name")
        ]);

        const timeline = [
            ...leads.map(l => ({ type: 'lead', title: `Lead Created: ${l.name}`, date: l.createdAt, id: l._id })),
            ...deals.map(d => ({ type: 'deal', title: `Deal ${d.stage}: ${d.title}`, date: d.updatedAt, id: d._id })),
            ...calls.map(c => ({ type: 'call', title: `Call ${c.status}: ${c.title}`, date: c.startDate, id: c._id })),
            ...meetings.map(m => ({ type: 'meeting', title: `Meeting ${m.status}: ${m.title}`, date: m.startDate, id: m._id })),
            ...todos.map(t => ({ type: 'task', title: `Task ${t.status}: ${t.title}`, date: t.updatedAt, id: t._id })),
            ...notes.map(n => ({ type: 'note', title: `Note Added: ${n.title}`, date: n.createdAt, id: n._id })),
            ...messages.map(msg => ({ type: 'message', title: `${msg.type.toUpperCase()} ${msg.status}: ${msg.content.substring(0, 30)}...`, date: msg.createdAt, id: msg._id, msgType: msg.type })),
            ...logActivities.map(a => ({ type: a.type, title: a.note, date: a.createdAt, id: a._id, user: a.userId?.name }))
        ];

        timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({ success: true, data: timeline.slice(0, 50) });
    } catch (error) {
        console.error("TIMELINE ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
