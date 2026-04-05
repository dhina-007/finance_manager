const transectionModel = require("../models/transectionModel");
const moment = require("moment");

const toDate = (value) => {
  if (value == null) return undefined;
  if (value instanceof Date) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const buildTransactionFields = (body) => ({
  userid: String(body.userid ?? ""),
  amount: Number(body.amount),
  type: body.type,
  category: body.category,
  reference: body.reference ?? body.refrence ?? "",
  description: body.description ?? "",
  date: toDate(body.date),
});
const getAllTransection = async (req, res) => {
  try {
    const { frequency, selectedDate, type } = req.body;
    const transections = await transectionModel.find({
      ...(frequency !== "custom"
        ? {
            date: {
              $gt: moment().subtract(Number(frequency), "d").toDate(),
            },
          }
        : {
            date: {
              $gte: selectedDate[0],
              $lte: selectedDate[1],
            },
          }),
      userid: req.body.userid,
      ...(type !== "all" && { type }),
    })
      .lean();
    const normalized = transections.map((doc) => ({
      ...doc,
      reference: doc.reference || doc.refrence || "",
    }));
    res.status(200).json(normalized);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

const deleteTransection = async (req, res) => {
  try {
    const deleted = await transectionModel.findOneAndDelete({
      _id: req.body.transactionId,
    });
    if (!deleted) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(200).send("Transaction Deleted");
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message || "Failed to delete transaction",
    });
  }
};

const editTransection = async (req, res) => {
  try {
    const raw = req.body.payload || {};
    const fields = buildTransactionFields({
      ...raw,
      userid: raw.userid ?? raw.userId ?? req.body.userid,
    });
    const update = {
      amount: fields.amount,
      type: fields.type,
      category: fields.category,
      reference: fields.reference,
      description: fields.description,
      ...(fields.date && { date: fields.date }),
    };
    if (!Number.isFinite(update.amount)) {
      return res.status(400).json({ message: "amount must be a valid number" });
    }
    await transectionModel.findOneAndUpdate(
      { _id: req.body.transactionId },
      update
    );
    res.status(200).send("Edit Succesfully");
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message || "Failed to update transaction",
    });
  }
};

const addTransection = async (req, res) => {
  try {
    const fields = buildTransactionFields(req.body);
    if (!fields.userid) {
      return res.status(400).json({ message: "userid is required" });
    }
    if (!Number.isFinite(fields.amount)) {
      return res.status(400).json({ message: "amount must be a valid number" });
    }
    if (!fields.date) {
      return res.status(400).json({ message: "date is required" });
    }
    const newTransection = new transectionModel(fields);
    await newTransection.save();
    res.status(201).send("Transection Created");
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message || "Failed to create transaction",
    });
  }
};

module.exports = {
  getAllTransection,
  addTransection,
  editTransection,
  deleteTransection,
};
