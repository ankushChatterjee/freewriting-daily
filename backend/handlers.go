package main

import (
	"database/sql"
	"log"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
)

func countWords(text string) int {
	text = strings.TrimSpace(text)
	if text == "" {
		return 0
	}
	words := strings.Fields(text)
	return len(words)
}

func getCurrentDate() string {
	return time.Now().UTC().Format("2006-01-02")
}

func CreateOrUpdateDocHandler(db *sql.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID := c.Locals("userID").(int)

		var req DocRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
		}

		// Calculate word count (no validation, allow any word count)
		wordCount := countWords(req.Content)

		currentDate := getCurrentDate()

		// Check if doc exists for today
		var existingID int
		err := db.QueryRow(
			"SELECT id FROM docs WHERE user_id = ? AND date = ?",
			userID, currentDate,
		).Scan(&existingID)

		now := time.Now().UTC()

		if err == sql.ErrNoRows {
			// Create new doc
			result, err := db.Exec(
				"INSERT INTO docs (user_id, content, word_count, date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
				userID, req.Content, wordCount, currentDate, now, now,
			)
			if err != nil {
				log.Printf("ERROR: Failed to create document for user %d on date %s: %v", userID, currentDate, err)
				return c.Status(500).JSON(fiber.Map{"error": "Failed to create document"})
			}

			docID, _ := result.LastInsertId()
			doc := Doc{
				ID:        int(docID),
				UserID:    userID,
				Content:   req.Content,
				WordCount: wordCount,
				Date:      currentDate,
				CreatedAt: now,
				UpdatedAt: now,
			}

			return c.Status(201).JSON(doc)
		} else if err != nil {
			log.Printf("ERROR: Failed to query document for user %d on date %s: %v", userID, currentDate, err)
			return c.Status(500).JSON(fiber.Map{"error": "Database error"})
		}

		// Update existing doc
		_, err = db.Exec(
			"UPDATE docs SET content = ?, word_count = ?, updated_at = ? WHERE id = ?",
			req.Content, wordCount, now, existingID,
		)
		if err != nil {
			log.Printf("ERROR: Failed to update document %d for user %d: %v", existingID, userID, err)
			return c.Status(500).JSON(fiber.Map{"error": "Failed to update document"})
		}

		doc := Doc{
			ID:        existingID,
			UserID:    userID,
			Content:   req.Content,
			WordCount: wordCount,
			Date:      currentDate,
			UpdatedAt: now,
		}

		return c.JSON(doc)
	}
}

func GetTodayDocHandler(db *sql.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID := c.Locals("userID").(int)
		currentDate := getCurrentDate()

		var doc Doc
		err := db.QueryRow(
			"SELECT id, user_id, content, word_count, date, created_at, updated_at FROM docs WHERE user_id = ? AND date = ?",
			userID, currentDate,
		).Scan(&doc.ID, &doc.UserID, &doc.Content, &doc.WordCount, &doc.Date, &doc.CreatedAt, &doc.UpdatedAt)

		if err == sql.ErrNoRows {
			return c.Status(404).JSON(fiber.Map{"error": "No document for today"})
		}
		if err != nil {
			log.Printf("ERROR: Failed to get today's document for user %d on date %s: %v", userID, currentDate, err)
			return c.Status(500).JSON(fiber.Map{"error": "Database error"})
		}

		return c.JSON(doc)
	}
}

func GetDocByDateHandler(db *sql.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID := c.Locals("userID").(int)
		date := c.Params("date")

		// Validate date format
		if _, err := time.Parse("2006-01-02", date); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid date format. Use YYYY-MM-DD"})
		}

		var doc Doc
		err := db.QueryRow(
			"SELECT id, user_id, content, word_count, date, created_at, updated_at FROM docs WHERE user_id = ? AND date = ?",
			userID, date,
		).Scan(&doc.ID, &doc.UserID, &doc.Content, &doc.WordCount, &doc.Date, &doc.CreatedAt, &doc.UpdatedAt)

		if err == sql.ErrNoRows {
			return c.Status(404).JSON(fiber.Map{"error": "No document for this date"})
		}
		if err != nil {
			log.Printf("ERROR: Failed to get document for user %d on date %s: %v", userID, date, err)
			return c.Status(500).JSON(fiber.Map{"error": "Database error"})
		}

		return c.JSON(doc)
	}
}

func GetHistoryHandler(db *sql.DB) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID := c.Locals("userID").(int)

		// Pagination
		page := c.QueryInt("page", 1)
		limit := c.QueryInt("limit", 30)
		if page < 1 {
			page = 1
		}
		if limit < 1 || limit > 100 {
			limit = 30
		}
		offset := (page - 1) * limit

		rows, err := db.Query(
			"SELECT id, user_id, content, word_count, date, created_at, updated_at FROM docs WHERE user_id = ? ORDER BY date DESC LIMIT ? OFFSET ?",
			userID, limit, offset,
		)
		if err != nil {
			log.Printf("ERROR: Failed to query history for user %d (page %d, limit %d): %v", userID, page, limit, err)
			return c.Status(500).JSON(fiber.Map{"error": "Database error"})
		}
		defer rows.Close()

		docs := []Doc{}
		for rows.Next() {
			var doc Doc
			if err := rows.Scan(&doc.ID, &doc.UserID, &doc.Content, &doc.WordCount, &doc.Date, &doc.CreatedAt, &doc.UpdatedAt); err != nil {
				log.Printf("ERROR: Failed to scan document row for user %d: %v", userID, err)
				return c.Status(500).JSON(fiber.Map{"error": "Failed to scan document"})
			}
			docs = append(docs, doc)
		}

		return c.JSON(docs)
	}
}

func GetStatsHandler(db *sql.DB, cfg *Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID := c.Locals("userID").(int)
		days := c.QueryInt("days", 30)
		if days < 1 {
			days = 30
		}

		minWords := cfg.MinimumWords

		// Get total days written (only count docs with minimum words)
		var totalDaysWritten int
		err := db.QueryRow(
			"SELECT COUNT(*) FROM docs WHERE user_id = ? AND word_count >= ?",
			userID, minWords,
		).Scan(&totalDaysWritten)
		if err != nil {
			log.Printf("ERROR: Failed to get total days written for user %d: %v", userID, err)
			return c.Status(500).JSON(fiber.Map{"error": "Failed to get total days"})
		}

		// Calculate current streak (only count docs with minimum words)
		currentStreak := 0
		currentDate := time.Now().UTC()

		for {
			dateStr := currentDate.Format("2006-01-02")
			var count int
			err := db.QueryRow(
				"SELECT COUNT(*) FROM docs WHERE user_id = ? AND date = ? AND word_count >= ?",
				userID, dateStr, minWords,
			).Scan(&count)

			if err != nil {
				log.Printf("ERROR: Failed to query streak for user %d on date %s: %v", userID, dateStr, err)
				break
			}
			if count == 0 {
				break
			}
			currentStreak++
			currentDate = currentDate.AddDate(0, 0, -1)
		}

		// Get words per day for last N days (only count docs with minimum words)
		endDate := time.Now().UTC()
		startDate := endDate.AddDate(0, 0, -days+1)

		rows, err := db.Query(
			"SELECT date, word_count FROM docs WHERE user_id = ? AND date >= ? AND date <= ? AND word_count >= ? ORDER BY date DESC",
			userID, startDate.Format("2006-01-02"), endDate.Format("2006-01-02"), minWords,
		)
		if err != nil {
			log.Printf("ERROR: Failed to query word counts for user %d (last %d days): %v", userID, days, err)
			return c.Status(500).JSON(fiber.Map{"error": "Failed to get word counts"})
		}
		defer rows.Close()

		wordsPerDay := []WordCountByDate{}
		for rows.Next() {
			var wc WordCountByDate
			if err := rows.Scan(&wc.Date, &wc.WordCount); err != nil {
				log.Printf("ERROR: Failed to scan word count row for user %d: %v", userID, err)
				return c.Status(500).JSON(fiber.Map{"error": "Failed to scan word count"})
			}
			wordsPerDay = append(wordsPerDay, wc)
		}

		stats := Stats{
			CurrentStreak:    currentStreak,
			TotalDaysWritten: totalDaysWritten,
			WordsPerDay:      wordsPerDay,
		}

		return c.JSON(stats)
	}
}
