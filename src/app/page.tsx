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

export default function Home() {
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [blurLevel, setBlurLevel] = useState(20);
  const [guess, setGuess] = useState("");
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState("");

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
    } catch (error) {
      console.error("Error fetching movie:", error);
    }
  };

  useEffect(() => {
    fetchRandomMovie();
  }, []);

  const handleReduceBlur = () => {
    setBlurLevel((prev) => Math.max(0, prev - 5));
  };

  const handleGuess = () => {
    if (!currentMovie) return;
    
    if (guess.toLowerCase() === currentMovie.title.toLowerCase()) {
      setScore((prev) => prev + 10);
      setMessage("Doğru tahmin! +10 puan");
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
          <div style={{ position: "relative", width: "300px", height: "450px" }}>
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
          />
          <Button 
            fullWidth 
            variant="contained" 
            onClick={handleGuess}
          >
            Tahmin et
          </Button>
        </div>
      </div>
    </div>
  );
}
