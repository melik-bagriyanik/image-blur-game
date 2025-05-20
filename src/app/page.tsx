"use client"; 
import Image from "next/image";
import styles from "./page.module.css";
import Button from "@mui/material/Button";
import { TextField } from "@mui/material";
import { useState, useEffect } from "react";

interface Movie {
  title: string;
  poster_path: string;
}

// String similarity function
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (s1.length === 0 || s2.length === 0) return 0;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  return (longer.length - editDistance(longer, shorter)) / longer.length;
}

// Levenshtein distance implementation
function editDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1, // substitution
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1      // insertion
        );
      }
    }
  }

  return dp[m][n];
}

export default function Home() {
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [blurLevel, setBlurLevel] = useState(20);
  const [guess, setGuess] = useState("");
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");
  const [showNextButton, setShowNextButton] = useState(false);

  const fetchRandomMovie = async () => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=tr-TR`
      );
      const data = await response.json();
      const randomMovie = data.results[Math.floor(Math.random() * data.results.length)];
      setCurrentMovie({
        title: randomMovie.title,
        poster_path: `https://image.tmdb.org/t/p/w500${randomMovie.poster_path}`,
      });
      setBlurLevel(20);
      setGuess("");
      setMessage("");
      setShowNextButton(false);
    } catch (error) {
      console.error("Error fetching movie:", error);
    }
  };

  useEffect(() => {
    fetchRandomMovie();
  }, []);

  const handleReduceBlur = () => {
    const newBlurLevel = Math.max(0, blurLevel - 5);
    setBlurLevel(newBlurLevel);
    
    if (newBlurLevel === 0) {
      setMessage("Bilemedin! Doğru cevap: " + currentMovie?.title);
      setShowNextButton(true);
    }
  };

  const handleGuess = () => {
    if (!currentMovie) return;
    
    const similarity = calculateSimilarity(guess, currentMovie.title);
    
    if (similarity >= 0.8) {
      setScore((prev) => prev + 10);
      setMessage(`Doğru tahmin! +10 puan (Benzerlik: ${Math.round(similarity * 100)}%)`);
      setBlurLevel(0);
      setTimeout(() => {
        fetchRandomMovie();
      }, 2000);
    } else {
      setMessage("Yanlış tahmin, tekrar dene!");
    }
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {currentMovie && (
          <div style={{ position: "relative", width: "300px", height: "430px" }}>
            <Image
              src={currentMovie.poster_path}
              alt="Movie Poster"
              fill
              style={{
                objectFit: "cover",
                filter: `blur(${blurLevel}px)`,
                transition: "filter 0.3s ease",
              }}
            />
          </div>
        )}
        <div style={{ marginTop: "20px" }}>
          <p>Puan: {score}</p>
          {message && <p>{message}</p>}
        </div>
      </main>
      <div className={styles.ButtonsContainer}>
        <div className={styles.CenterRow}>
          <Button 
            fullWidth 
            variant="contained" 
            onClick={handleReduceBlur}
            disabled={blurLevel === 0}
          >
            Aç
          </Button>
        </div>
        <div className={styles.buttonsRow}>
          <TextField 
            fullWidth 
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Film adını yazın"
            disabled={showNextButton}
          />
          <Button 
            fullWidth 
            variant="contained" 
            onClick={handleGuess}
            disabled={showNextButton}
          >
            Tahmin et
          </Button>
        </div>
        {showNextButton && (
          <div className={styles.CenterRow} style={{ marginTop: "10px" }}>
            <Button 
              fullWidth 
              variant="contained" 
              color="secondary"
              onClick={fetchRandomMovie}
            >
              Sonraki Film
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
