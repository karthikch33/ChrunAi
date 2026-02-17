import { useEffect, useMemo, useState, useCallback } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { Table } from "antd";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { Sector } from "recharts";

/* -------------------- HELPERS -------------------- */

const formatRevenue = (value) => {
  if (!value) return "0";

  const num = Number(value);

  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  }

  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }

  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }

  return num.toFixed(2).replace(/\.00$/, "");
};


const clusterColors = {
  high_revenue: "#073673ff",
  mixed_revenue: "#0a6298ff",
  low_revenue: "#d37a1aff",
};

/* -------------------- COMPONENT -------------------- */

export default function Home() {
  const navigate = useNavigate();

  /* ---------- STATE ---------- */
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCluster, setActiveCluster] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  /* ---------- FETCH DATA ---------- */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          "https://churn-poc.onrender.com/clustered-data"
        );
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ---------- KPI CALCULATIONS ---------- */

  const totalRevenue = useMemo(() => {
    return data.reduce((acc, c) => acc + Number(c.total_revenue || 0), 0);
  }, [data]);

  const chartData = useMemo(() => {
    if (!data.length) return [];

    const clusterMap = {
      high_revenue: 0,
      mixed_revenue: 0,
      low_revenue: 0,
    };

    data.forEach((c) => {
      const cluster = c.cluster_name?.toLowerCase();
      if (clusterMap[cluster] !== undefined) {
        clusterMap[cluster] += 1;
      }
    });

    return Object.entries(clusterMap).map(([name, value]) => ({
      name,
      value,
    }));
  }, [data]);

  /* ---------- FILTERED TABLE DATA ---------- */

  const filteredRows = useMemo(() => {
    if (!activeCluster) return data;

    return data.filter(
      (c) => c.cluster_name?.toLowerCase() === activeCluster
    );
  }, [data, activeCluster]);

  const handlePieClick = (entry) => {
    const name = entry?.name;
    setActiveCluster((prev) => (prev === name ? null : name));
    setPagination((pg) => ({ ...pg, current: 1 }));
  };

  const handleTableChange = useCallback((p) => {
    setPagination({ current: p.current, pageSize: p.pageSize });
  }, []);

  const renderActiveShape = (props) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  } = props;

  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 10} // pop-out
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  );
};

const renderPercentLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#111827"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {(percent * 100).toFixed(0)}%
    </text>
  );
};


  /* ---------- TABLE COLUMNS ---------- */

  const columns = [
    { title: "Customer No", dataIndex: "customer" },
    { title: "Company Code", dataIndex: "company_code" },
    {
      title: "Cluster",
      dataIndex: "cluster_name",
      render: (value) => {
        const v = value;
        const bg =
          v === "high_revenue"
            ? "#e3f2fd"
            : v === "mixed_revenue"
            ? "#e1f5fe"
            : "#fff3e0";

        const color =
          v === "high_revenue"
            ? "#1565c0"
            : v === "mixed_revenue"
            ? "#0277bd"
            : "#ef6c00";

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
            }}
          >
            {v?.replace("_", " ")}
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
        <a
          onClick={() => navigate(`/customers/${record.customer}`)}
          style={{ textDecoration: "underline", cursor: "pointer" }}
        >
          Detailed Analysis
        </a>
      ),
    },
  ];

  /* ---------- LOADING ---------- */

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6">Loading data...</Typography>
      </Box>
    );
  }

  /* ---------- UI ---------- */

  return (
    <>
    <Box
  sx={{
    height: "64px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
    px: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  }}
>
  {/* LEFT: YASH LOGO */}
  <Box sx={{ display: "flex", alignItems: "center" }}>
    <img
      src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQz6s3WZNZAaKEXsBVRXuMDagabISvp0gqDRw&s"
      alt="YASH Technologies"
      height={32}
    />
  </Box>

  {/* RIGHT: SETTINGS ICON */}
</Box>

    <Box sx={{ p: 4, backgroundColor: "#f3f4f6", minHeight: "100vh" }}>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Customer Dashboard
      </Typography>

      {/* TOP SECTION */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 3 }}>

          {/* LEFT KPI SECTION */}
          {/* KPI SECTION */}
<Box
  sx={{
    flex: "0 0 25%",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  }}
>
  {/* TOTAL CUSTOMERS */}
  <Card
    sx={{
      borderRadius: "14px",
      border: "1px solid #e5e7eb",
      backgroundColor: "#f9fafb",
      boxShadow: "none",
    }}
  >
    <CardContent sx={{ p: "18px !important" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography
          sx={{
            fontSize: "14px",
            fontWeight: 500,
            color: "#6b7280",
          }}
        >
          Total Customers
        </Typography>
        <img src="/customer.png" alt="customers" width={20} />
      </Box>

      <Typography
        sx={{
          fontSize: "24px",
          fontWeight: 700,
          color: "#111827",
          mt: 1,
        }}
      >
        {data.length}
      </Typography>

      {/* <Typography
        sx={{
          fontSize: "12px",
          color: "#16a34a",
          mt: 0.5,
        }}
      >
        ↑ 8% this month
      </Typography> */}
    </CardContent>
  </Card>

  {/* TOTAL REVENUE */}
  <Card
    sx={{
      borderRadius: "14px",
      border: "1px solid #e5e7eb",
      backgroundColor: "#f9fafb",
      boxShadow: "none",
    }}
  >
    <CardContent sx={{ p: "18px !important" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography
          sx={{
            fontSize: "14px",
            fontWeight: 500,
            color: "#6b7280",
          }}
        >
          Total Revenue
        </Typography>
        <img src="/revanue.png" alt="revenue" width={20} />
      </Box>

      <Typography
        sx={{
          fontSize: "24px",
          fontWeight: 700,
          color: "#111827",
          mt: 1,
        }}
      >
        ${formatRevenue(totalRevenue)}
      </Typography>

      {/* <Typography
        sx={{
          fontSize: "12px",
          color: "#16a34a",
          mt: 0.5,
        }}
      >
        ↑ 12% this quarter
      </Typography> */}
    </CardContent>
  </Card>

  {/* ACTIVE FILTER */}
  <Card
    sx={{
      borderRadius: "14px",
      border: "1px solid #e5e7eb",
      backgroundColor: "#f9fafb",
      boxShadow: "none",
    }}
  >
    <CardContent sx={{ p: "18px !important" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography
          sx={{
            fontSize: "14px",
            fontWeight: 500,
            color: "#6b7280",
          }}
        >
          Active Cluster
        </Typography>
        <img src="/revanue.png" alt="revenue" width={20} />
      </Box>

      <Typography
        sx={{
          fontSize: "20px",
          fontWeight: 700,
          color: "#111827",
          mt: 1,
        }}
      >
        {activeCluster
          ? activeCluster.replace("_", " ")
          : "None"}
      </Typography>

      {activeCluster && (
        <Typography
          onClick={() => setActiveCluster(null)}
          sx={{
            fontSize: "12px",
            color: "#2563eb",
            mt: 0.5,
            cursor: "pointer",
          }}
        >
          Clear filter
        </Typography>
      )}
    </CardContent>
  </Card>
</Box>


          {/* RIGHT PIE SECTION */}
          <Box
  sx={{
    flex: 1,
    background: "#ffffff",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    p: 3,
    display: "flex",
    gap: 4,
    alignItems: "center",
  }}
>
  {/* LEFT - DONUT */}
  <Box sx={{ flex: 1 }}>
    <Typography
      sx={{
        fontSize: "16px",
        fontWeight: 600,
        color: "#111827",
        mb: 2,
      }}
    >
      Revenue Distribution By Cluster
    </Typography>

    <ResponsiveContainer width="100%" height={280}>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
  <ResponsiveContainer width="100%" height={260}>
    <PieChart>
      <Pie
        data={chartData}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={110}
        paddingAngle={3}
        activeIndex={
          chartData.findIndex((d) => d.name === activeCluster)
        }
        activeShape={renderActiveShape}
        label={renderPercentLabel}
        onClick={handlePieClick}
      >
        {chartData.map((entry, index) => (
          <Cell
            key={index}
            fill={clusterColors[entry.name]}
            style={{ cursor: "pointer"}}
          />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>

  {/* CUSTOM LEGEND */}
  <Box
    sx={{
      display: "flex",
      gap: 3,
      mt: 2,
      alignItems: "center",
    }}
  >
    {chartData.map((item) => {
      const isActive = activeCluster === item.name;

      return (
        <Box
          key={item.name}
          onClick={() =>
            setActiveCluster(isActive ? null : item.name)
          }
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
            opacity: activeCluster && !isActive ? 0.4 : 1,
            transition: "0.2s",
          }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: clusterColors[item.name],
            }}
          />

          <Typography
            sx={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#374151",
            }}
          >
            {item.name.replace("_", " ")}
          </Typography>
        </Box>
      );
    })}
  </Box>
</Box>

    </ResponsiveContainer>
  </Box>

  {/* RIGHT - SELECTION PANEL */}
  <Box
    sx={{
      width: "200px",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
    }}
  >
    <Typography
      sx={{
        fontSize: "13px",
        fontWeight: 500,
        color: "#6b7280",
      }}
    >
      Selected Cluster
    </Typography>

    {chartData.map((item) => {
      const isActive = activeCluster === item.name;

      return (
        <Box
          key={item.name}
          onClick={() =>
            setActiveCluster(isActive ? null : item.name)
          }
          sx={{
            padding: "15px 14px",
            borderRadius: "40px",
            textAlign: "center",
            fontSize: "13px",
            cursor: "pointer",
            marginBottom : "10px",
            border: isActive
              ? `1px solid ${clusterColors[item.name]}`
              : "1px solid #e5e7eb",
            backgroundColor: isActive
              ? `${clusterColors[item.name]}20`
              : "#f9fafb",
            color: isActive
              ? clusterColors[item.name]
              : "#374151",
            fontWeight: isActive ? 700 : 600,
            transition: "0.2s ease",
          }}
        >
          <label style={{color : `${clusterColors[item.name]}`}}>{item.name.replace("_", " ")?.toLocaleUpperCase()}</label>
        </Box>
      );
    })}
  </Box>
</Box>

        </Box>
      </Card>

      {/* TABLE SECTION */}
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" mb={2}>
          Customers Table
        </Typography>

        <Table
          columns={columns}
          dataSource={filteredRows}
          rowKey="customer"
          pagination={{
            ...pagination,
            total: filteredRows.length,
            showSizeChanger: true,
          }}
          onChange={handleTableChange}
        />
      </Card>
    </Box>
        </>
  );
}
