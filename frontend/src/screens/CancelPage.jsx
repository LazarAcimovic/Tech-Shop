import React from "react";

const CancelPage = () => {
  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)",
      color: "white",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: "20px",
      textAlign: "center",
    },
    icon: {
      fontSize: "6rem",
      marginBottom: "20px",
      color: "#ffb3a7",
      textShadow: "0 0 20px #ffb3a7",
    },
    heading: {
      fontSize: "3rem",
      marginBottom: "10px",
    },
    message: {
      fontSize: "1.3rem",
      marginBottom: "40px",
      maxWidth: "600px",
      lineHeight: "1.5",
    },
    button: {
      padding: "15px 40px",
      fontSize: "1.2rem",
      backgroundColor: "#ff4b2b",
      border: "none",
      borderRadius: "50px",
      color: "#fff",
      cursor: "pointer",
      boxShadow: "0 4px 15px rgba(255, 75, 43, 0.6)",
      transition: "all 0.3s ease",
    },
    buttonHover: {
      backgroundColor: "#ff1f00",
      boxShadow: "0 6px 20px rgba(255, 31, 0, 0.8)",
    },
  };

  const [hover, setHover] = React.useState(false);

  return (
    <div style={styles.container}>
      <div style={styles.icon} aria-label="Cancel cross mark">
        ❌
      </div>
      <p style={styles.message}>
        Vaša uplata je otkazana ili nije uspešna. Molimo pokušajte ponovo ili
        nas kontaktirajte ukoliko imate pitanja.
      </p>
      <button
        style={
          hover ? { ...styles.button, ...styles.buttonHover } : styles.button
        }
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => (window.location.href = "/")}
      >
        Povratak na početnu
      </button>
    </div>
  );
};

export default CancelPage;
