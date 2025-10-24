package main

import "time"

type User struct {
	ID           int       `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

type Doc struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Content   string    `json:"content"`
	WordCount int       `json:"word_count"`
	Date      string    `json:"date"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type SignupRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type DocRequest struct {
	Content string `json:"content"`
}

type Stats struct {
	CurrentStreak    int               `json:"current_streak"`
	TotalDaysWritten int               `json:"total_days_written"`
	WordsPerDay      []WordCountByDate `json:"words_per_day"`
}

type WordCountByDate struct {
	Date      string `json:"date"`
	WordCount int    `json:"word_count"`
}
