"use client"; 
import Image from "next/image";
import styles from "./page.module.css";
import Button from "@mui/material/Button";
import { TextField } from "@mui/material";
import { useState, useEffect } from "react";
import Skeleton from "@mui/material/Skeleton";
import ScoreBar from "./components/ScoreBar";
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import ShareIcon from '@mui/icons-material/Share';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import MenuIcon from '@mui/icons-material/Menu';

interface Movie {
  title: string;
  original_title: string;
  poster_path: string;
  director?: string;
  overview?: string;
  release_date?: string;
  id: number;
}

interface LeaderboardEntry {
  name: string;
  score: number;
  movieCount: number;
}

// String similarity function
function calculateSimilarity(str1: string, str2: string): number {
  // Stringleri normalize et
  const normalizeString = (str: string) => {
    return str.toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Alfanumerik olmayan karakterleri kaldır
      .replace(/the/g, '') // "the" kelimesini kaldır
      .replace(/a/g, '') // "a" kelimesini kaldır
      .replace(/an/g, '') // "an" kelimesini kaldır
      .replace(/der/g, '') // "der" kelimesini kaldır
      .replace(/die/g, '') // "die" kelimesini kaldır
      .replace(/das/g, '') // "das" kelimesini kaldır
      .replace(/le/g, '') // "le" kelimesini kaldır
      .replace(/la/g, '') // "la" kelimesini kaldır
      .replace(/les/g, '') // "les" kelimesini kaldır
      .replace(/il/g, '') // "il" kelimesini kaldır
      .replace(/el/g, '') // "el" kelimesini kaldır
      .replace(/los/g, '') // "los" kelimesini kaldır
      .replace(/las/g, ''); // "las" kelimesini kaldır
  };

  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);
  
  if (s1.length === 0 || s2.length === 0) return 0;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;
  
  // Eğer biri diğerinin içinde geçiyorsa bonus puan ver
  if (longer.includes(shorter)) {
    return 0.9;
  }

  // Eğer kelimelerin çoğu eşleşiyorsa bonus puan ver
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const commonWords = words1.filter(word => words2.includes(word));
  if (commonWords.length >= Math.min(words1.length, words2.length) * 0.7) {
    return 0.85;
  }
  
  return (longer.length - editDistance(longer, shorter)) / longer.length;
}

// Levenshtein distance implementation
// This function calculates the edit distance between two strings
// which is used to determine how similar they are.
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
  const [movieCount, setMovieCount] = useState(0);
  const [message, setMessage] = useState("");
  const [showNextButton, setShowNextButton] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [blurReductions, setBlurReductions] = useState(0);
  const [showMovieInfo, setShowMovieInfo] = useState(false);
  const [showInsufficientPoints, setShowInsufficientPoints] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [username, setUsername] = useState("");
  const [showUsernameModal, setShowUsernameModal] = useState(true);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const fetchMovieDetails = async (movieId: number) => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=tr-TR&append_to_response=credits`
      );
      const data = await response.json();
      
      const director = data.credits.crew.find((person: any) => person.job === "Director")?.name;
      
      setCurrentMovie(prev => prev ? {
        ...prev,
        director: director || "Bilinmiyor",
        overview: data.overview,
        release_date: data.release_date
      } : null);
    } catch (error) {
      console.error("Error fetching movie details:", error);
    }
  };

  const handleGetMovieInfo = () => {
    if (score >= 3 && currentMovie) {
      setScore(prev => prev - 3);
      setShowMovieInfo(true);
      if (!currentMovie.director) {
        fetchMovieDetails(currentMovie.id);
      }
    } else {
      setShowInsufficientPoints(true);
      setTimeout(() => setShowInsufficientPoints(false), 2000);
    }
  };

  const handleCloseModal = () => {
    setShowMovieInfo(false);
  };

  const fetchRandomMovie = async () => {
    const categories = ['top_rated'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const randomPage = Math.floor(Math.random() * 50) + 1;

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${randomCategory}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=tr-TR&page=${randomPage}`
      );
      const data = await response.json();

      const moviesWithPoster = data.results.filter(
        (movie: any) =>
          movie.poster_path &&
          !["cn", "zh", "ru","ja"].includes(movie.original_language)
      );

      if (moviesWithPoster.length === 0) {
        console.warn("Uygun film bulunamadı, tekrar deneniyor...");
        return fetchRandomMovie();
      }

      const randomMovie = moviesWithPoster[Math.floor(Math.random() * moviesWithPoster.length)];
      
      setImageLoaded(false);
      setCurrentMovie({
        title: randomMovie.title,
        original_title: randomMovie.original_title,
        poster_path: `https://image.tmdb.org/t/p/w500${randomMovie.poster_path}`,
        id: randomMovie.id
      });

      setBlurLevel(20);
      setGuess("");
      setMessage("");
      setShowNextButton(false);
      setBlurReductions(0);
      setShowMovieInfo(false);
      setMovieCount(prev => prev + 1);
    } catch (error) {
      console.error("Error fetching movie:", error);
    }
  };

  useEffect(() => {
    fetchRandomMovie();
  }, []);

  useEffect(() => {
    const savedLeaderboard = localStorage.getItem('leaderboard');
    if (savedLeaderboard) {
      setLeaderboard(JSON.parse(savedLeaderboard));
    }
  }, []);

  const handleReduceBlur = () => {
    const newBlurLevel = Math.max(0, blurLevel - 5);
    setBlurLevel(newBlurLevel);
    setBlurReductions(prev => prev + 1);
    
    if (newBlurLevel === 0) {
      setMessage("Bilemedin! Doğru cevap: " + currentMovie?.title);
      setShowNextButton(true);
    }
  };

  const handleUsernameSubmit = () => {
    if (username.trim()) {
      setShowUsernameModal(false);
    }
  };

  const updateLeaderboard = () => {
    // Mevcut leaderboard'u kopyala
    const updatedLeaderboard = [...leaderboard];
    
    // Aynı isimdeki kullanıcının mevcut skorunu bul
    const existingUserIndex = updatedLeaderboard.findIndex(entry => entry.name === username);
    
    // Yeni skor
    const newEntry = { name: username, score, movieCount };
    
    if (existingUserIndex !== -1) {
      // Eğer yeni skor daha yüksekse güncelle
      if (score > updatedLeaderboard[existingUserIndex].score) {
        updatedLeaderboard[existingUserIndex] = newEntry;
      }
    } else {
      // Yeni kullanıcı ekle
      updatedLeaderboard.push(newEntry);
    }
    
    // Skorlara göre sırala ve en yüksek 5'i al
    const sortedLeaderboard = updatedLeaderboard
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    setLeaderboard(sortedLeaderboard);
    localStorage.setItem('leaderboard', JSON.stringify(sortedLeaderboard));
  };

  const handleGuess = () => {
    if (!currentMovie) return;
    
    const similarityWithTitle = calculateSimilarity(guess, currentMovie.title);
    const similarityWithOriginalTitle = calculateSimilarity(guess, currentMovie.original_title);
    const similarity = Math.max(similarityWithTitle, similarityWithOriginalTitle);
    
    if (similarity >= 0.65) {
      const pointsToAdd = Math.max(0, 10 - (blurReductions * 2));
      setScore((prev) => prev + pointsToAdd);
      const correctTitle = similarityWithTitle >= similarityWithOriginalTitle ? currentMovie.title : currentMovie.original_title;
      setMessage(`Doğru tahmin! +${pointsToAdd} puan (Benzerlik: ${Math.round(similarity * 100)}%)`);
      setBlurLevel(0);
      setTimeout(() => {
        fetchRandomMovie();
        updateLeaderboard();
      }, 2000);
    } else {
      setMessage("Yanlış tahmin, tekrar dene!");
    }
  };

  const handleShare = async () => {
    const shareText = `🎬 Film Tahmin Oyunu'nda ${movieCount} filmde ${score} puan topladım! 💪\n\nBu skoru geçebilir misin? 😎\n\nhttps://github.com/melik-bagriyanik`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Film Tahmin Oyunu Skorum',
          text: shareText
        });
      } catch (error) {
        console.error('Paylaşım hatası:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(shareText);
      setShareMessage("Skorunuz kopyalandı! Paylaşmak için yapıştırın.");
      setTimeout(() => setShareMessage(""), 2000);
    }
  };

  return (
    <>
      <div className={styles.page}>
        <ScoreBar score={score} />
        <div className={styles.middleColumn}>
          <main className={styles.main}>
            {currentMovie && (
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
                    pointerEvents: "none",
                  }}
                />
              </div>
            )}
            <div className={styles.infoWidget} >
              <p className={styles.infoText}> Puan: {score} | Film Sayısı: {movieCount}</p>
              {message && <p className={styles.messageText}>{message}</p>}
              {showInsufficientPoints && (
                <p className={styles.insufficientPoints}>Film bilgisi almak için en az 3 puan gerekli!</p>
              )}
            </div>
          </main>
          <div className={styles.ButtonsContainer}>
            <div className={styles.CenterRow}>
              <Button 
                fullWidth 
                variant="contained" 
                onClick={handleReduceBlur}
                disabled={blurLevel === 0}
                style={{ background: "#DDDDDD", color: "#000000", fontSize: "14px", padding: "6px",marginTop: "15px" }}
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !showNextButton) {
                    handleGuess();
                  }
                }}
                style={{ 
                  background: "#ffffff",
                  color: "#000000",
                  borderRadius: "5px",
                  fontSize: "14px",
                }}
              />
              <Button 
                fullWidth 
                variant="contained" 
                onClick={handleGuess}
                disabled={showNextButton}
                style={{ 
                  background: "#2E2E2E",
                  color: "#ffffff",
                  fontSize: "14px",
                  padding: "6px"
                }}
              >
                Tahmin et
              </Button>
            </div>

            <div className={styles.buttonsRow}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleGetMovieInfo}
                disabled={showNextButton}
                style={{
                  background: "#121B41",
                  color: "#ffffff",
                  fontSize: "14px",
                  padding: "6px",
                  height:"42px"
                }}
              >
                Film Bilgisi Al (3 puan)
              </Button>
            </div>

            {showNextButton ? (
              <div className={styles.CenterRow} style={{ marginTop: "5px" }}>
                <Button 
                  fullWidth 
                  variant="contained" 
                  color="secondary"
                  onClick={fetchRandomMovie}
                  style={{ background: "#C11119", color: "#ffffff", fontWeight: "bold", fontSize: "16px", padding: "6px" }}
                >
                  Sonraki Film
                </Button>
              </div>
            ): (
              <div className={styles.CenterRow} style={{ marginTop: "5px" }}>
                <Button 
                  fullWidth 
                  variant="contained" 
                  color="primary"
                  onClick={fetchRandomMovie}
                  style={{ background: "#2E2E2E", color: "#ffffff", fontWeight: "bold", fontSize: "16px", padding: "6px" }}
                >
                  Yeni Film
                </Button>
              </div>
            )}
          </div>
        </div>
         
        <div className={styles.lastColumn} style={{ flex: "1" }}>
          <div className={styles.footer}>
              <div className={styles.scoreRule}>
              <p>Minimum film sayısıyla maximum puanı topla!</p>
            </div>
            <div className={styles.leaderboardContainer}>
              <h3>En İyiler</h3>
              <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '15px', fontSize: '14px' }}>En yüksek puanlı 5 oyuncu</p>
              <TableContainer component={Paper} className={styles.leaderboardTable}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>İsim</TableCell>
                      <TableCell align="right">Puan</TableCell>
                      <TableCell align="right">Film</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaderboard.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell>{entry.name}</TableCell>
                        <TableCell align="right">{entry.score}</TableCell>
                        <TableCell align="right">{entry.movieCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          
            <div className={styles.scoringInfo}>
              <h3>Puanlama Sistemi</h3>
              <div className={styles.scoreRule}>
                <span className={styles.scoreDot}></span>
                <p>Blur azaltmadan bilme: <span className={styles.scoreValue}>+10 puan</span></p>
              </div>
              <div className={styles.scoreRule}>
                <span className={styles.scoreDot}></span>
                <p>Her blur azaltmada: <span className={styles.scoreValue}>-2 puan</span></p>
              </div>
              <div className={styles.scoreRule}>
                <span className={styles.scoreDot}></span>
                <p>Film bilgisi almak: <span className={styles.scoreValue}>-3 puan</span></p>
              </div>
            </div>
            <div className={styles.footerContent}>
              <p style={{display:"flex"}} >Bu oyun, film bilgilerini <a href="https://www.themoviedb.org/">TMDb API</a> kullanarak sunmaktadır.</p>
             
              <p>Yapımcı: [Melik Bağrıyanık]</p>
              <p style={{display:"flex"}}>Github: <a href="https://github.com/melik-bagriyanik">https://github.com/melik-bagriyanik</a></p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.mobileMenuButton}>
        <Button
          variant="contained"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          startIcon={<MenuIcon />}
          style={{
            background: "#121B41",
            color: "#ffffff",
            fontSize: "14px",
            padding: "6px",
            width: "100%"
          }}
        >
          En İyiler
        </Button>
      </div>

      <Modal
        open={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        aria-labelledby="mobile-menu-modal"
      >
        <Box className={styles.mobileMenuContent}>
          <div className={styles.modalHeader}>
            <h2>En İyiler</h2>
            <Button onClick={() => setShowMobileMenu(false)} className={styles.closeButton}>×</Button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.leaderboardContainer}>
              <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '15px', fontSize: '14px' }}>En yüksek puanlı 5 oyuncu</p>
              <TableContainer component={Paper} className={styles.leaderboardTable}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>İsim</TableCell>
                      <TableCell align="right">Puan</TableCell>
                      <TableCell align="right">Film</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaderboard.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell>{entry.name}</TableCell>
                        <TableCell align="right">{entry.score}</TableCell>
                        <TableCell align="right">{entry.movieCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          </div>
        </Box>
      </Modal>

      <div className={styles.mobileShareButton}>
        <Button
          variant="contained"
          onClick={handleShare}
          startIcon={<ShareIcon />}
          style={{
            background: "#121B41",
            color: "#ffffff",
            fontSize: "14px",
            padding: "6px",
            width: "100%"
          }}
          sx={{
            '&:hover': {
              background: "#121B41"
            }
          }}
        >
          Skorunu Paylaş
        </Button>
      </div>

      <Modal
        open={showMovieInfo}
        onClose={handleCloseModal}
        aria-labelledby="movie-info-modal"
        aria-describedby="movie-information"
      >
        <Box className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h2>Film Hakkında Bilgiler</h2>
            <Button onClick={handleCloseModal} className={styles.closeButton}>×</Button>
          </div>
          <div className={styles.modalBody}>
            <div className={styles.movieInfo}>
              <p><strong>Yönetmen:</strong> {currentMovie?.director}</p>
              <p><strong>Çıkış Tarihi:</strong> {currentMovie?.release_date}</p>
              <p><strong>Özet:</strong> {currentMovie?.overview}</p>
            </div>
          </div>
        </Box>
      </Modal>

      <Modal
        open={showUsernameModal}
        onClose={() => {}}
        aria-labelledby="username-modal"
      >
        <Box className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h2>Hoş Geldin!</h2>
          </div>
          <div className={styles.modalBody}>
            <p style={{marginBottom: '10px'}}>En iyiler listesinde yer almak istiyorsan adını yaz!</p>
            <TextField
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="İsminizi yazın"
              style={{ marginBottom: '20px' ,background: "#ffffff", color: "#000000", borderRadius: "5px", fontSize: "14px" }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleUsernameSubmit}
                disabled={!username.trim()}
                style={{ background: "#121B41", color: "#ffffff" }}
              >
                Başla
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setUsername("Misafir");
                  setShowUsernameModal(false);
                }}
                style={{ 
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  color: "#ffffff"
                }}
              >
                Hayır, teşekkürler
              </Button>
            </div>
          </div>
        </Box>
      </Modal>
    </>
  );  
}
