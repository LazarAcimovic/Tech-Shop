import React from "react";

const SuccessPage = () => {
  const styles = {
    container: {
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
      color: "white",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: "20px",
      textAlign: "center",
    },
    icon: {
      fontSize: "6rem",
      marginBottom: "20px",
      color: "#00ff99",
      textShadow: "0 0 20px #00ff99",
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
      backgroundColor: "#00ff99",
      border: "none",
      borderRadius: "50px",
      color: "#111",
      cursor: "pointer",
      boxShadow: "0 4px 15px rgba(0, 255, 153, 0.6)",
      transition: "all 0.3s ease",
    },
    buttonHover: {
      backgroundColor: "#00cc7a",
      boxShadow: "0 6px 20px rgba(0, 204, 122, 0.8)",
    },
  };

  const [hover, setHover] = React.useState(false);

  return (
    <div style={styles.container}>
      <div style={styles.icon} aria-label="Success checkmark">
        ✅
      </div>
      <p style={styles.message}>Hvala na kupovini!</p>
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

export default SuccessPage;
