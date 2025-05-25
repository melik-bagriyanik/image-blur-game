import React, { useState, useEffect } from 'react';
import styles from './style.module.css';

interface ScoreBarProps {
  score: number;
}

const ScoreBar: React.FC<ScoreBarProps> = ({ score }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedScore(score);
    }, 100);
    return () => clearTimeout(timeout);
  }, [score]);

  const getIcon = (score: number) => {
    if (score < 30) return '😵';
    if (score < 60) return '📽️';
    if (score < 100) return '🎬';
    return '🤓';
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.scoreBarContainer}>
        <div className={styles.scoreBarBackground}>
          <div
            className={styles.scoreBarFill}
            style={{ height: `${animatedScore}%` }}
          >
      <div className={styles.styleText}>{score}</div>
            {/* <div className={styles.icon}>{getIcon(animatedScore)}</div> */}
          </div>
        </div>
      </div>
          <div className={styles.labels}>
        <div className={styles.labelItem}>
          <span className={styles.dot}></span> Tam bir Geek! 🤓
        </div>
        <div className={styles.labelItem}>
          <span className={styles.dot}></span> Film işi senden sorulur 😵
        </div>
        <div className={styles.labelItem}>
          <span className={styles.dot}></span> Yılda bir sinemaya gider 📽️
        </div>
        <div className={styles.labelItem}>
          <span className={styles.dot}></span> Film Cahili 🎬
        </div>
      </div>
    </div>
  );
};

export default ScoreBar;
