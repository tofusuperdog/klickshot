export default function ApiHome() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        color: "#f8fafc",
        background:
          "radial-gradient(circle at 20% 20%, rgba(56, 189, 248, 0.28), transparent 32%), radial-gradient(circle at 80% 10%, rgba(244, 63, 94, 0.22), transparent 30%), linear-gradient(135deg, #09090b 0%, #111827 48%, #18181b 100%)",
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        overflow: "hidden",
      }}
    >
      <section
        style={{
          width: "min(720px, 100%)",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 14px",
            marginBottom: "22px",
            border: "1px solid rgba(255, 255, 255, 0.16)",
            borderRadius: "999px",
            background: "rgba(255, 255, 255, 0.08)",
            color: "#cbd5e1",
            fontSize: "14px",
            letterSpacing: "0.02em",
            backdropFilter: "blur(14px)",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "999px",
              background: "#22c55e",
              boxShadow: "0 0 20px rgba(34, 197, 94, 0.9)",
            }}
          />
          API is running
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "clamp(56px, 12vw, 132px)",
            lineHeight: 0.92,
            fontWeight: 900,
            letterSpacing: "0",
            background:
              "linear-gradient(90deg, #ffffff 0%, #7dd3fc 42%, #fb7185 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            textShadow: "0 24px 80px rgba(125, 211, 252, 0.22)",
          }}
        >
          Klickshot
        </h1>

        <p
          style={{
            margin: "24px auto 0",
            maxWidth: "560px",
            color: "#cbd5e1",
            fontSize: "clamp(16px, 2.4vw, 20px)",
            lineHeight: 1.7,
          }}
        >
          Premium short-series experience, powered by a clean and ready API.
        </p>
      </section>
    </main>
  );
}
