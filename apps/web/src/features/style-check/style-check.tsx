/** @jsxImportSource @emotion/react */
"use client";

import { css } from "@emotion/react";
import Link from "next/link";
import { useState } from "react";

const cardStyle = css({
  boxSizing: "border-box",
  maxWidth: 640,
  margin: "64px auto",
  padding: 32,
  borderRadius: 20,
  backgroundColor: "#eef2ff",
  color: "#172554",
  fontFamily: "system-ui, sans-serif",
  lineHeight: 1.7,
  "@media (max-width: 680px)": { margin: "24px 8px", padding: 24 },
});
const secondaryStyle = css({ border: "2px solid #6366f1" });
const buttonStyle = css({
  display: "block",
  margin: "24px 0",
  padding: "12px 20px",
  border: 0,
  borderRadius: 8,
  backgroundColor: "#4338ca",
  color: "#fff",
  font: "inherit",
  cursor: "pointer",
  "&:hover": { backgroundColor: "#3730a3" },
  "&:focus-visible": { outline: "3px solid #818cf8", outlineOffset: 4 },
});
const activeStyle = css({ backgroundColor: "#166534", "&:hover": { backgroundColor: "#14532d" } });
const linkStyle = css({ color: "#3730a3", textUnderlineOffset: 4 });

type StyleCheckProps = {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  secondary?: boolean;
};

export function StyleCheck({ title, description, href, linkLabel, secondary }: StyleCheckProps) {
  const [active, setActive] = useState(false);

  return (
    <main css={[cardStyle, secondary && secondaryStyle]}>
      <h1>{title}</h1>
      <p>{description}</p>
      <button css={[buttonStyle, active && activeStyle]} aria-pressed={active} onClick={() => setActive(!active)}>
        {active ? "스타일 변경 확인 완료" : "버튼 스타일 변경 확인"}
      </button>
      <Link css={linkStyle} href={href}>{linkLabel}</Link>
    </main>
  );
}
