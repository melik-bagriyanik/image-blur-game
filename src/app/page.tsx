"use client"; 
import Image from "next/image";
import styles from "./page.module.css";
import Button from "@mui/material/Button";
import { TextField } from "@mui/material";
import { useState, useEffect } from "react";
import Skeleton from "@mui/material/Skeleton";
import ScoreBar from "./components/ScoreBar";
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
  const [imageLoaded, setImageLoaded] = useState(false);


const fetchRandomMovie = async () => {
  const categories = ['popular', 'top_rated',  'now_playing'];
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const randomPage = Math.floor(Math.random() * 50) + 1; // 1-50 arası rastgele sayfa

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${randomCategory}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=tr-TR&page=${randomPage}`
    );
    const data = await response.json();

    // Poster'ı olanlardan rastgele seçim yap
    const moviesWithPoster = data.results.filter((movie: any) => movie.poster_path);
    if (moviesWithPoster.length === 0) {
      console.warn("Poster içermeyen sonuçlar geldi, tekrar deneniyor...");
      return fetchRandomMovie(); // poster olmayanlardan seçilirse tekrar dene
    }

    const randomMovie = moviesWithPoster[Math.floor(Math.random() * moviesWithPoster.length)];
setImageLoaded(false);
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
      <ScoreBar score={score} />
       <div style={{ flex: "1" }}>
      <main className={styles.main}>
       
        {currentMovie && (
          <div className={styles.imageContainer} >
            <div className={styles.imageContainer}>
  {!imageLoaded && (
  <Skeleton
  sx={{ bgcolor: 'grey.900' }}
  variant="rectangular"
  width="100%"
  height="100%"
/>
 
  )}
  <Image
    src={currentMovie.poster_path}
    alt="Movie Poster"
    fill
    onLoadingComplete={() => setImageLoaded(true)}
    style={{
      objectFit: "cover",
      filter: `blur(${blurLevel}px)`,
      transition: "filter 0.3s ease",
      opacity: imageLoaded ? 1 : 0,
    }}
  />
</div>

          </div>
        )}
        <div style={{ marginTop: "0" }}>
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
           style={{ background: "#DDDDDD" ,color: "#000000" ,fontSize: "16px"}}
          >
           Bluru azalt
          </Button>
        </div>
        <div className={styles.buttonsRow}>
          <TextField 
            fullWidth 
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Film adını yazın"
            disabled={showNextButton}
             style={{ background: "#ffffff" ,color: "#000000" ,borderRadius: "5px" ,fontSize: "16px",}}
          />
          <Button 
            fullWidth 
            variant="contained" 
            onClick={handleGuess}
            disabled={showNextButton}
            style={{ background: "#2E2E2E" ,color: "#ffffff",fontSize: "16px" }}
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
              style={{ background: "#C11119" ,color: "#ffffff",fontWeight: "bold",fontSize: "18px" }}
            >
              Sonraki Film
            </Button>
          </div>
        )}
      </div>
      </div>
      <div style={{ flex: "1" }}>
        <div className={styles.footer}>
          <p>Film tahmin oyunu</p>
          <p>Yapımcı: [Melik Bağrıyanık]</p>
          <p>Github: <a href="https://github.com/melikbagriyanik">https://github.com/melikbagriyanik</a></p>
        </div>
      </div>
          </div>
  );
}
