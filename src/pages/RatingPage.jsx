import { useState } from "react";
import { supabase } from "../services/supabase";

const FLOWER = "🌸";
const STAR = "★";

function Star({ index, value, onPick, onHover }) {
  const fill = Math.max(0, Math.min(1, value - index));

  const valueAt = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return index + (event.clientX - rect.left < rect.width / 2 ? 0.5 : 1);
  };

  return (
    <button
      type="button"
      aria-label={`Rate ${index + 1} stars`}
      onClick={(event) => onPick(valueAt(event))}
      onPointerMove={(event) => {
        if (event.pointerType === "mouse") onHover(valueAt(event));
      }}
      onPointerLeave={() => onHover(0)}
      style={{
        position: "relative",
        border: "none",
        background: "transparent",
        padding: "2px",
        fontSize: "clamp(34px, 9vw, 46px)",
        lineHeight: 1,
        cursor: "pointer",
      }}
    >
      <span style={{ color: "#e5e7eb" }}>{STAR}</span>
      <span
        style={{
          position: "absolute",
          left: 2,
          top: 2,
          width: `${fill * 100}%`,
          overflow: "hidden",
          whiteSpace: "nowrap",
          color: "#d97706",
          pointerEvents: "none",
        }}
      >
        {STAR}
      </span>
    </button>
  );
}

export function RatingPage({ token: tokenProp, onDone }) {
  const token =
    tokenProp || new URLSearchParams(window.location.search).get("rate");

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("idle");
  const [errMsg, setErrMsg] = useState("");

  const shown = hover || rating;

  const goHome = () => {
    if (onDone) {
      onDone();
    } else {
      window.location.href = window.location.origin;
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!rating || status === "sending") return;

    if (!supabase) {
      setErrMsg("Supabase is not configured.");
      setStatus("error");
      return;
    }

    setStatus("sending");
    setErrMsg("");

    try {
      const { error } = await supabase.rpc("submit_rating", {
        p_token: token,
        p_rating: rating,
        p_comment: comment.trim() || null,
      });

      if (error) throw error;

      setStatus("done");
    } catch (error) {
      console.error("submit_rating failed:", error);
      setErrMsg(error?.message || "Please try again.");
      setStatus("error");
    }
  };

  const pageStyle = {
    minHeight: "100vh",
    width: "100%",
    boxSizing: "border-box",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    background:
      "linear-gradient(135deg, #fff7f9 0%, #fce7f3 50%, #fffaf5 100%)",
    fontFamily: "Arial, sans-serif",
    color: "#332532",
  };

  const cardStyle = {
    width: "100%",
    maxWidth: 440,
    background: "#ffffff",
    border: "1px solid #f4dce8",
    borderRadius: 24,
    overflow: "hidden",
    boxShadow: "0 20px 55px rgba(116, 48, 82, 0.13)",
  };

  const headerStyle = {
    padding: "30px 20px",
    textAlign: "center",
    color: "#ffffff",
    background: "linear-gradient(135deg, #8f345f, #d45b8c)",
  };

  const bodyStyle = {
    padding: "28px 24px",
    textAlign: "center",
  };

  const buttonStyle = {
    width: "100%",
    padding: "15px 20px",
    border: "none",
    borderRadius: 999,
    background: "linear-gradient(135deg, #a63f70, #d45b8c)",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    cursor: "pointer",
  };

  const Brand = () => (
    <div style={headerStyle}>
      <div style={{ fontSize: 42, marginBottom: 10 }}>{FLOWER}</div>
      <h1 style={{ margin: 0, fontSize: 22, color: "#ffffff" }}>
        Fleurs by Blossoms Craft
      </h1>
      <p style={{ margin: "8px 0 0", fontSize: 13, opacity: 0.9 }}>
        A little love in every bloom
      </p>
    </div>
  );

  if (!token) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <Brand />
          <div style={bodyStyle}>
            <h2>Invalid rating link</h2>
            <p>Please open the rating link from your order.</p>
            <button type="button" style={buttonStyle} onClick={goHome}>
              Back to menu
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (status === "done") {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <Brand />
          <div style={bodyStyle}>
            <h2 style={{ fontSize: 28 }}>Thank you! 🌸</h2>
            <p style={{ color: "#81727d", lineHeight: 1.6 }}>
              Your feedback was received. Thank you for supporting our flower
              shop!
            </p>
            <button type="button" style={buttonStyle} onClick={goHome}>
              Back to menu
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <Brand />

        <form style={bodyStyle} onSubmit={submit}>
          <p
            style={{
              display: "inline-block",
              padding: "7px 13px",
              borderRadius: 999,
              background: "#fce7f3",
              color: "#9d3d6c",
              fontSize: 12,
              fontWeight: "bold",
            }}
          >
            YOUR FEEDBACK MATTERS
          </p>

          <h2 style={{ margin: "8px 0", fontSize: 28 }}>
            Rate your order
          </h2>

          <p style={{ color: "#81727d", lineHeight: 1.6 }}>
            How was your flower? We would love to hear from you.
          </p>

          <div
            role="group"
            aria-label="Choose your rating"
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 4,
              margin: "18px 0 8px",
            }}
          >
            {[0, 1, 2, 3, 4].map((index) => (
              <Star
                key={index}
                index={index}
                value={shown}
                onPick={(value) => {
                  setRating(value);
                  setHover(0);
                }}
                onHover={setHover}
              />
            ))}
          </div>

          <p
            style={{
              minHeight: 22,
              margin: "0 0 22px",
              color: shown ? "#a63f70" : "#9b8b96",
              fontSize: 14,
              fontWeight: shown ? "bold" : "normal",
            }}
          >
            {shown
              ? `${shown} / 5 stars`
              : "Tap a star to rate · Half-star ratings available"}
          </p>

          <label
            htmlFor="rating-comment"
            style={{
              display: "block",
              textAlign: "left",
              marginBottom: 8,
              fontSize: 14,
              fontWeight: "bold",
            }}
          >
            Your comment <span style={{ fontWeight: "normal" }}>(optional)</span>
          </label>

          <textarea
            id="rating-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Tell us what you loved..."
            rows={4}
            maxLength={1000}
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1px solid #eadde5",
              borderRadius: 14,
              padding: 14,
              marginBottom: 18,
              fontFamily: "inherit",
              fontSize: 15,
              resize: "vertical",
            }}
          />

          {status === "error" && (
            <p
              role="alert"
              style={{
                color: "#b91c1c",
                background: "#fff1f2",
                borderRadius: 12,
                padding: 12,
                fontSize: 13,
                overflowWrap: "anywhere",
              }}
            >
              Failed to submit your rating. {errMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={!rating || status === "sending"}
            style={{
              ...buttonStyle,
              opacity: !rating || status === "sending" ? 0.6 : 1,
              cursor: !rating || status === "sending" ? "not-allowed" : "pointer",
            }}
          >
            {status === "sending" ? "Sending..." : "Submit rating"}
          </button>

          <p style={{ color: "#a0929b", fontSize: 12, marginTop: 18 }}>
            Thank you for choosing Fleurs 🌸
          </p>
        </form>
      </section>
    </main>
  );
}