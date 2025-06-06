import React, { useState, useEffect, useCallback } from "react";
import { Form, Input, message, Modal, Select, Table, DatePicker } from "antd";
import {
  UnorderedListOutlined,
  AreaChartOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import Layout from "./../components/Layout/Layout";
import axios from "axios";
import Spinner from "./../components/Spinner";
import moment from "moment";
import Analytics from "../components/Analytics";

const { RangePicker } = DatePicker;

const HomePage = () => {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allTransection, setAllTransection] = useState([]);
  const [frequency, setFrequency] = useState("7");
  const [selectedDate, setSelectedate] = useState([]);
  const [type, setType] = useState("all");
  const [viewData, setViewData] = useState("table");
  const [editable, setEditable] = useState(null);

  // Ant Design Form instance
  const [form] = Form.useForm();

  // Sync form values with editable state
  useEffect(() => {
    if (editable) {
      form.setFieldsValue({
        ...editable,
        date: moment(editable.date, "YYYY-MM-DD"), // Convert date for DatePicker
      });
    } else {
      form.resetFields();
    }
  }, [editable, form]);

  // Get all transactions (Wrapped in useCallback)
  const getAllTransactions = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      setLoading(true);
      const res = await axios.post("https://finance-manager-ajlr.onrender.com/transections/get-transection", {
        userid: user._id,
        frequency,
        selectedDate,
        type,
      });
      setAllTransection(res.data);
    } catch (error) {
      message.error("Fetch Issue with Transaction");
    }
    setLoading(false);
  }, [frequency, selectedDate, type]); // Dependencies

  // Trigger getAllTransactions on Dependency Change
  useEffect(() => {
    getAllTransactions();
  }, [getAllTransactions]);

  // Delete handler with refetch
  const handleDelete = async (record) => {
    try {
      setLoading(true);
      await axios.post("https://finance-manager-ajlr.onrender.com/transections/delete-transection", {
        transactionId: record._id,
      });
      message.success("Transaction Deleted");
      getAllTransactions(); // Refetch after delete
    } catch (error) {
      message.error("Unable to delete");
    }
    setLoading(false);
  };

  // Form handling for Add/Edit
  const handleSubmit = async (values) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      setLoading(true);
      if (editable) {
        await axios.post("https://finance-manager-ajlr.onrender.com/transections/edit-transection", {
          payload: {
            ...values,
            userId: user._id,
          },
          transactionId: editable._id,
        });
        message.success("Transaction Updated Successfully");
      } else {
        await axios.post("https://finance-manager-ajlr.onrender.com/transections/add-transection", {
          ...values,
          userid: user._id,
        });
        message.success("Transaction Added Successfully");
      }
      setShowModal(false);
      setEditable(null);
      getAllTransactions(); // Refetch after add/edit
    } catch (error) {
      message.error("Failed to add transaction");
    }
    setLoading(false);
  };

  // Table columns
  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      render: (text) => <span>{moment(text).format("YYYY-MM-DD")}</span>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
    },
    {
      title: "Type",
      dataIndex: "type",
    },
    {
      title: "Category",
      dataIndex: "category",
    },
    {
      title: "Reference",
      dataIndex: "reference",
    },
    {
      title: "Actions",
      render: (text, record) => (
        <div>
          <EditOutlined
            onClick={() => {
              setEditable(record);
              setShowModal(true);
            }}
          />
          <DeleteOutlined
            className="mx-2"
            onClick={() => {
              handleDelete(record);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <Layout>
      {loading && <Spinner />}
      <div className="filters">
        <div>
          <h6>Select Frequency</h6>
          <Select value={frequency} onChange={(values) => setFrequency(values)}>
            <Select.Option value="7">LAST 1 Week</Select.Option>
            <Select.Option value="30">LAST 1 Month</Select.Option>
            <Select.Option value="365">LAST 1 Year</Select.Option>
            <Select.Option value="custom">Custom</Select.Option>
          </Select>
          {frequency === "custom" && (
            <RangePicker
              value={selectedDate}
              onChange={(values) => setSelectedate(values)}
            />
          )}
        </div>
        <div>
          <h6>Select Type</h6>
          <Select value={type} onChange={(values) => setType(values)}>
            <Select.Option value="all">ALL</Select.Option>
            <Select.Option value="income">INCOME</Select.Option>
            <Select.Option value="expense">EXPENSE</Select.Option>
          </Select>
        </div>
        <div className="switch-icons">
          <UnorderedListOutlined
            className={`mx-2 ${
              viewData === "table" ? "active-icon" : "inactive-icon"
            }`}
            onClick={() => setViewData("table")}
          />
          <AreaChartOutlined
            className={`mx-2 ${
              viewData === "analytics" ? "active-icon" : "inactive-icon"
            }`}
            onClick={() => setViewData("analytics")}
          />
        </div>
        <div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            Add New
          </button>
        </div>
      </div>
      <div className="content">
        {viewData === "table" ? (
          <Table columns={columns} dataSource={allTransection} rowKey="_id" />
        ) : (
          <Analytics allTransection={allTransection} />
        )}
      </div>
      <Modal
        title={editable ? "Edit Transaction" : "Add Transection"}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditable(null);
          form.resetFields();  // Clear form on cancel
        }}
        footer={false}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item label="Amount" name="amount" required>
            <Input type="number" />
          </Form.Item>
          <Form.Item label="Type" name="type" required>
            <Select>
              <Select.Option value="income">Income</Select.Option>
              <Select.Option value="expense">Expense</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Category" name="category" required>
            <Select>
              <Select.Option value="salary">Salary</Select.Option>
              <Select.Option value="tip">Tip</Select.Option>
              <Select.Option value="project">Project</Select.Option>
              <Select.Option value="food">Food</Select.Option>
              <Select.Option value="movie">Movie</Select.Option>
              <Select.Option value="bills">Bills</Select.Option>
              <Select.Option value="medical">Medical</Select.Option>
              <Select.Option value="fee">Fee</Select.Option>
              <Select.Option value="tax">Tax</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Date" name="date" required>
            <DatePicker format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item label="Reference" name="reference">
            <Input type="text" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input type="text" />
          </Form.Item>
          <div className="d-flex justify-content-end">
            <button type="submit" className="btn btn-primary">
              SAVE
            </button>
          </div>
        </Form>
      </Modal>
    </Layout>
  );
};

export default HomePage;
