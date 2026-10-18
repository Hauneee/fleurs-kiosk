import { useState } from "react";
import { supabase } from "../services/supabase";

const FLOWER = "\u{1F338}";
const STAR = "\u2605";

export function RatingPage({ token: tokenProp, onDone }) {
  const token =
    tokenProp || new URLSearchParams(window.location.search).get("rate");

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | done | error
  const [errMsg, setErrMsg] = useState("");

  const goHome = () => {
    if (onDone) onDone();
    else window.location.href = window.location.origin;
  };

  const submit = async () => {
    if (!rating) return;
    setStatus("sending");
    if (!supabase) {
      setErrMsg("Supabase is not configured.");
      setStatus("error");
      return;
    }
    const { error } = await supabase.rpc("submit_rating", {
      p_token: token,
      p_rating: rating,
      p_comment: comment.trim() || null,
    });
    if (error) {
      console.error("submit_rating failed:", error);
      setErrMsg(error.message);
      setStatus("error");
    } else {
      setStatus("done");
    }
  };

  const ink = "#1f2937";
  const box = {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    boxSizing: "border-box",
    background: "#fff7ed",
    fontFamily: "Arial, sans-serif",
    color: ink,
  };
  const card = {
    background: "#fff",
    borderRadius: 24,
    maxWidth: 420,
    width: "100%",
    margin: "0 auto",
    textAlign: "center",
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
    overflow: "hidden",
    color: ink,
  };
  const header = {
    background: "linear-gradient(135deg,#f59e0b,#ec4899)",
    color: "#fff",
    padding: "24px 16px",
  };
  const body = { padding: 28 };
  const btn = {
    background: "#f59e0b",
    color: "#fff",
    border: "none",
    borderRadius: 999,
    padding: "14px 28px",
    fontWeight: "bold",
    fontSize: 16,
    cursor: "pointer",
  };

  const Brand = () => (
    <div style={header}>
      <div style={{ fontSize: 36, lineHeight: 1 }}>{FLOWER}</div>
      <div style={{ fontSize: 22, fontWeight: "bold", marginTop: 6, color: "#fff" }}>
        Fleurs by Blossoms Craft
      </div>
    </div>
  );

  if (!token) {
    return (
      <div style={box}>
        <div style={card}>
          <Brand />
          <div style={body}>
            <h2 style={{ color: ink }}>Invalid rating link</h2>
            <button style={btn} onClick={goHome}>Back to menu</button>
          </div>
        </div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div style={box}>
        <div style={card}>
          <Brand />
          <div style={body}>
            <h2 style={{ color: ink }}>Thank you! {FLOWER}</h2>
            <p style={{ color: "#6b7280" }}>Your feedback was received.</p>
            <button style={btn} onClick={goHome}>Back to menu</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={box}>
      <div style={card}>
        <Brand />
        <div style={body}>
          <h2 style={{ color: ink, margin: "0 0 6px" }}>Rate your order</h2>
          <p style={{ color: "#6b7280", margin: 0 }}>How was your flower?</p>

          <div style={{ fontSize: 44, margin: "14px 0" }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                onClick={() => { setRating(n); setHover(0); }}
                onPointerEnter={(e) => e.pointerType === "mouse" && setHover(n)}
                onPointerLeave={() => setHover(0)}
                style={{
                  cursor: "pointer",
                  color: n <= (hover || rating) ? "#f59e0b" : "#d1d5db",
                }}
              >
                {STAR}
              </span>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more (optional)"
            rows={3}
            style={{
              width: "100%",
              boxSizing: "border-box",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              padding: 12,
              marginBottom: 16,
              fontFamily: "inherit",
              color: ink,
              background: "#fff",
            }}
          />

          {status === "error" && (
            <p style={{ color: "#dc2626", margin: "0 0 12px" }}>
              Something went wrong. Please try again.
              <br />
              <small>{errMsg}</small>
            </p>
          )}

          <button
            style={{ ...btn, opacity: rating ? 1 : 0.5 }}
            disabled={!rating || status === "sending"}
            onClick={submit}
          >
            {status === "sending" ? "Sending..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}