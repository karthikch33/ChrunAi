import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Box, Typography } from "@mui/material";
import { Table, Tag } from "antd";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";

const chartColors = ["#174a8b", "#3e8ebf", "#f2993a"];

const formatRevenue = (val) => {
  const str = val.toFixed(2);
  const [intPart, decimalPart] = str.split(".");
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${formatted}.${decimalPart}`;
};

export default function Home() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [activeSlice, setActiveSlice] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("https://churn-poc.onrender.com/clustered-data");
      const json = await res.json();
      setData(json);
    };
    fetchData();
  }, []);

  // KPI values
  const totalRevenue = useMemo(
    () => data.reduce((acc, c) => acc + c.total_revenue, 0),
    [data]
  );

  const clusterCounts = useMemo(() => {
    const map = { high_revenue: 0, mixed_revenue: 0, low_revenue: 0 };
    data.forEach((c) => map[c.cluster_name.toLowerCase()]++);
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [data]);

  const filteredRows = useMemo(() => {
    if (!activeSlice) return data;
    return data.filter(
      (c) => c.cluster_name.toLowerCase() === activeSlice
    );
  }, [data, activeSlice]);

  const columns = [
    { title: "Customer No", dataIndex: "customer" },
    { title: "Company Code", dataIndex: "company_code" },
    {
      title: "Cluster",
      dataIndex: "cluster_name",
      render: (value) => {
        const v = value.toLowerCase();
    
        let bg = "";
        let color = "";
    
        if (v === "high_revenue") {
          bg = "#e3f2fd";
          color = "#1565c0";
        } else if (v === "mixed_revenue") {
          bg = "#e1f5fe";
          color = "#0277bd";
        } else {
          bg = "#fff3e0";
          color = "#ef6c00";
        }
    
        return (
          <span
            style={{
              backgroundColor: bg,
              color: color,
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 500,
              textTransform: "capitalize",
              display: "inline-block",
            }}
          >
            {v.replace("_", " ")}
          </span>
        );
      },
    },
    {
      title: "Total Revenue (USD)",
      dataIndex: "total_revenue",
      render: (v) => `$${formatRevenue(v)}`,
    },
    {
      title: "Revenue Rank",
      dataIndex: "revenue_rank_in_cluster",
    },
    {
      title: "Action",
      render: (_, record) => (
        <a onClick={() => navigate(`/customers/${record.customer}`)} style={{textDecoration : 'underline'}}>
          Detailed Analaysis
        </a>
      ),
    },
  ];

  return (
    <Box
      sx={{
        backgroundColor: "#f3f4f6",
        minHeight: "100vh",
        padding: "32px",
      }}
    >
      {/* PAGE TITLE */}
      <Typography
        variant="h5"
        sx={{ fontWeight: 600, marginBottom: "24px" }}
      >
        Customer Dashboard
      </Typography>

      {/* KPI + PIE ROW */}
      <Box
        sx={{
          display: "flex",
          gap: "24px",
          marginBottom: "32px",
          flexWrap: "wrap",
          background : "#fff",
          padding : '30px',
          borderRadius : '20px'
        }}
      >
        {/* KPI COLUMN */}
        <Box sx={{ width: "280px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <Box sx={cardStyle}>
            <Typography sx={kpiLabel}>Total Customers</Typography>
            <Typography sx={kpiValue}>{data.length}</Typography>
          </Box>

          <Box sx={cardStyle}>
            <Typography sx={kpiLabel}>Total Revenue</Typography>
            <Typography sx={kpiValue}>
              ${formatRevenue(totalRevenue)}
            </Typography>
          </Box>

          <Box sx={cardStyle}>
            <Typography sx={kpiLabel}>Active Filter</Typography>
            <Typography sx={kpiValue}>
              {activeSlice || "None"}
            </Typography>
          </Box>
        </Box>

        {/* PIE CARD */}
        {/* REVENUE DISTRIBUTION CARD */}
<Box
  sx={{
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    padding: "20px",
    display: "flex",
    gap: "32px",
    width : '70%',
    backgroundColor : "rgba(0,0,0,0.1)",
    alignItems: "center",
    minHeight: "340px",
  }}
>
  {/* LEFT SIDE */}
  <Box sx={{ flex: 1 }}>
    <Typography
      sx={{
        fontWeight: 600,
        fontSize: "16px",
      }}
      className="ant-modal-header"
    >
      Revenue Distribution By Cluster
    </Typography>

    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={clusterCounts}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={65}
          outerRadius={110}
          paddingAngle={4}
          onClick={(entry) =>
            setActiveSlice(
              activeSlice === entry.name ? null : entry.name
            )
          }
        >
          {clusterCounts.map((entry, index) => (
            <Cell
              key={index}
              fill={
                entry.name === "high_revenue"
                  ? "#174a8b"
                  : entry.name === "mixed_revenue"
                  ? "#3e8ebf"
                  : "#f2993a"
              }
              style={{
                cursor: "pointer",
                opacity:
                  activeSlice && activeSlice !== entry.name
                    ? 0.5
                    : 1,
                transition: "opacity 0.3s ease",
              }}
            />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </Box>

  {/* RIGHT SIDE FILTER PANEL */}
  <Box
    sx={{
      width: "220px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    }}
  >
    <Typography
      sx={{
        fontWeight: 500,
        fontSize: "14px",
        color: "#6b7280",
        marginBottom: "8px",
      }}
    >
      Selected Cluster
    </Typography>

    {["high_revenue", "mixed_revenue", "low_revenue"].map((cluster) => {
      const isActive = activeSlice === cluster;

      return (
        <Box
          key={cluster}
          onClick={() =>
            setActiveSlice(isActive ? null : cluster)
          }
          sx={{
            padding: "8px 14px",
            borderRadius: "20px",
            border: isActive
              ? "1px solid #174a8b"
              : "1px solid #e5e7eb",
            backgroundColor: isActive
              ? "#e3f2fd"
              : "#f9fafb",
            color: isActive ? "#174a8b" : "#374151",
            fontSize: "13px",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            "&:hover": {
              backgroundColor: "#f3f4f6",
            },
          }}
        >
          {cluster.replace("_", " ")}
        </Box>
      );
    })}
  </Box>
</Box>

      </Box>

      {/* TABLE CARD */}
      <Box
        sx={{
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          padding: "24px",
        }}
      >
        <Typography
          variant="h6"
          sx={{ marginBottom: "16px", fontWeight: 600 }}
        >
          Customer Details
        </Typography>

        <Table
          columns={columns}
          dataSource={filteredRows}
          rowKey="customer"
          pagination={{ pageSize: 8 }}
        />
      </Box>
    </Box>
  );
}

/* ---------- STYLES ---------- */

const cardStyle = {
  background: "white",
  borderRadius: "12px",
  padding: "20px",
  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
};

const kpiLabel = {
  fontSize: "14px",
  color: "#6b7280",
  marginBottom: "6px",
};

const kpiValue = {
  fontSize: "22px",
  fontWeight: 600,
};
