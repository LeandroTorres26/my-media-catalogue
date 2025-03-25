"use client";
import { useState, useEffect } from "react";

export default function ChangingText({ text }: { text: string[] }) {
  const [currentText, setCurrentText] = useState(text[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentText((prevText) => {
        const currentIndex = text.indexOf(prevText);
        const nextIndex = (currentIndex + 1) % text.length;
        return text[nextIndex];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [text]);

  return <span className="text-primary">{currentText}</span>;
}
