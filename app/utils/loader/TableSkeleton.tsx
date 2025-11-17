export function TableSkeleton() {
  const rows = 4;

  return (
    <>
      {/* Shimmer keyframes */}
      <style>
        {`
          @keyframes shimmer {
            0% {
              background-position: -400px 0;
            }
            100% {
              background-position: 400px 0;
            }
          }
        `}
      </style>

      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {/* Image */}
          <td style={cellStyle}>
            <div style={shimmer(imageSkeleton)} />
          </td>

          {/* Product */}
          <td style={cellStyle}>
            <div style={shimmer(line())} />
            <div style={shimmer(line(60))} />
          </td>

          {/* Inventory */}
          <td style={cellStyle}>
            <div style={shimmer(line(40))} />
          </td>

          {/* Inventory limit */}
          <td style={cellStyle}>
            <div style={shimmer(line(40))} />
          </td>

          {/* Price */}
          <td style={cellStyle}>
            <div style={shimmer(line(50))} />
          </td>

          {/* Action */}
          <td style={cellStyle}  >
            <div style={shimmer(iconSkeleton)} />
          </td>
        </tr>
      ))}
    </>
  );
}

/* ---------- STYLES ---------- */

const cellStyle = {
  padding: "12px",
  borderBottom: "1px solid #eee",
};

const baseShimmer = {
  background: "linear-gradient(90deg, #eee 0px, #f5f5f5 40px, #eee 80px)",
  backgroundSize: "800px 100%",
  animation: "shimmer 1.5s infinite linear",
};

const imageSkeleton = {
  width: "50px",
  height: "50px",
  borderRadius: "6px",
};

const iconSkeleton = {
  width: "20px",
  height: "20px",
  borderRadius: "4px",
};

function line(width = 80) {
  return {
    height: "10px",
    width: `${width}%`,
    borderRadius: "4px",
    marginBottom: "6px",
  };
}

// Apply shimmer
function shimmer(style :any) {
  return {
    ...style,
    ...baseShimmer,
  };
}
