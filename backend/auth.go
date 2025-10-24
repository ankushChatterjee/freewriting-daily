package main

import (
	"database/sql"
	"log"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type Claims struct {
	UserID   int    `json:"user_id"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	return string(bytes), err
}

func checkPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

func generateToken(userID int, username string, cfg *Config) (string, error) {
	claims := Claims{
		UserID:   userID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(cfg.JWT.Expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.JWT.Secret))
}

func validateToken(tokenString string, cfg *Config) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(cfg.JWT.Secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fiber.ErrUnauthorized
}

func SignupHandler(db *sql.DB, cfg *Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req SignupRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
		}

		// Validate username
		req.Username = strings.TrimSpace(req.Username)
		if len(req.Username) < 3 || len(req.Username) > 50 {
			return c.Status(400).JSON(fiber.Map{"error": "Username must be 3-50 characters"})
		}

		// Validate password
		if len(req.Password) < 8 {
			return c.Status(400).JSON(fiber.Map{"error": "Password must be at least 8 characters"})
		}

		// Hash password
		hash, err := hashPassword(req.Password)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to hash password"})
		}

		// Insert user
		result, err := db.Exec(
			"INSERT INTO users (username, password_hash) VALUES (?, ?)",
			req.Username, hash,
		)
		if err != nil {
			if strings.Contains(err.Error(), "UNIQUE constraint failed") {
				return c.Status(400).JSON(fiber.Map{"error": "Username already exists"})
			}
			log.Printf("ERROR: Failed to create user %s: %v", req.Username, err)
			return c.Status(500).JSON(fiber.Map{"error": "Failed to create user"})
		}

		userID, _ := result.LastInsertId()

		// Generate token
		token, err := generateToken(int(userID), req.Username, cfg)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to generate token"})
		}

		user := User{
			ID:        int(userID),
			Username:  req.Username,
			CreatedAt: time.Now(),
		}

		return c.Status(201).JSON(AuthResponse{
			Token: token,
			User:  user,
		})
	}
}

func LoginHandler(db *sql.DB, cfg *Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		var req LoginRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
		}

		// Get user from database
		var user User
		err := db.QueryRow(
			"SELECT id, username, password_hash, created_at FROM users WHERE username = ?",
			req.Username,
		).Scan(&user.ID, &user.Username, &user.PasswordHash, &user.CreatedAt)

		if err == sql.ErrNoRows {
			return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
		}
		if err != nil {
			log.Printf("ERROR: Failed to query user %s: %v", req.Username, err)
			return c.Status(500).JSON(fiber.Map{"error": "Database error"})
		}

		// Check password
		if !checkPassword(req.Password, user.PasswordHash) {
			return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
		}

		// Generate token
		token, err := generateToken(user.ID, user.Username, cfg)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to generate token"})
		}

		return c.JSON(AuthResponse{
			Token: token,
			User:  user,
		})
	}
}

func AuthMiddleware(cfg *Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(401).JSON(fiber.Map{"error": "Missing authorization header"})
		}

		// Extract token from "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(401).JSON(fiber.Map{"error": "Invalid authorization header format"})
		}

		claims, err := validateToken(parts[1], cfg)
		if err != nil {
			return c.Status(401).JSON(fiber.Map{"error": "Invalid or expired token"})
		}

		// Store user info in context
		c.Locals("userID", claims.UserID)
		c.Locals("username", claims.Username)

		return c.Next()
	}
}
