import React, { useState, useEffect } from "react";
import styles from "./style.module.css";

interface ScoreBarProps {
  score: number;
}

const ScoreBar: React.FC<ScoreBarProps> = ({ score }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedScore(score);
    }, 200);
    return () => clearTimeout(timeout);
  }, [score]);

  const getIcon = (score: number) => {
    if (score < 40) return "🎬"; // Movie beginner
    if (score < 60) return "📽️"; // Casual watcher
    if (score < 90) return "😎"; // Movie fan
    return "🤓"; // Geek
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.scoreBarContainer}>
        <div className={styles.scoreBarBackground}>
          <div
            className={styles.scoreBarFill}
            style={{ height: `${animatedScore}%` }}
          >
            <div
              className={styles.character}
              style={{ bottom: `${animatedScore - 5}%` }}
            >
              {getIcon(animatedScore)}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.labels}>
        <div className={styles.labelItem}>
          <span className={styles.dot}></span> Gerçek bir sinema tutkunu 🤓
        </div>
        <div className={styles.labelItem}>
          <span className={styles.dot}></span> Film kültürün gayet yerinde 😎
        </div>
        <div className={styles.labelItem}>
          <span className={styles.dot}></span> Arada sırada film izler 📽️
        </div>
        <div className={styles.labelItem}>
          <span className={styles.dot}></span> Yeni başlıyorsun 🎬
        </div>
      </div>
    </div>
  );
};

export default ScoreBar;
