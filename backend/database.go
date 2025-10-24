package main

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"
	"sort"

	_ "modernc.org/sqlite"
)

func InitDB(dbPath string, migrationsFolder string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Printf("ERROR: Failed to open database at %s: %v", dbPath, err)
		return nil, err
	}

	// Enable foreign keys
	if _, err := db.Exec("PRAGMA foreign_keys = ON"); err != nil {
		log.Printf("ERROR: Failed to enable foreign keys: %v", err)
		return nil, err
	}

	// Run migrations
	if err := runMigrations(db, migrationsFolder); err != nil {
		log.Printf("ERROR: Failed to run migrations: %v", err)
		return nil, err
	}

	return db, nil
}

func runMigrations(db *sql.DB, migrationsFolder string) error {
	// Get all migration files
	pattern := filepath.Join(migrationsFolder, "*.sql")
	files, err := filepath.Glob(pattern)
	if err != nil {
		log.Printf("ERROR: Failed to find migration files in %s: %v", migrationsFolder, err)
		return err
	}

	// Sort files to ensure they run in order
	sort.Strings(files)

	for _, file := range files {
		log.Printf("Running migration: %s", file)
		content, err := os.ReadFile(file)
		if err != nil {
			log.Printf("ERROR: Failed to read migration file %s: %v", file, err)
			return err
		}

		if _, err := db.Exec(string(content)); err != nil {
			log.Printf("ERROR: Failed to execute migration %s: %v", file, err)
			return err
		}
	}

	log.Println("Migrations completed successfully")
	return nil
}
