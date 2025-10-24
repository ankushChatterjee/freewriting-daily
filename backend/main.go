package main

import (
	"fmt"
	"log"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	fmt.Println("=== The Freewriting Daily ===")
	now := time.Now()
	dateStr := now.Format("Monday 2, Jan, 2006")
	fmt.Printf("\033[90m%s\033[0m\n", dateStr)

	fmt.Println("")

	cfg := LoadConfig()
	log.Printf("Configuration loaded successfully")

	// Initialize database
	db, err := InitDB(cfg.Database.Path, cfg.Database.MigrationsFolder)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()
	log.Printf("Database initialized at: %s", cfg.Database.Path)
	log.Printf("Migrations folder: %s", cfg.Database.MigrationsFolder)

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	// Middleware
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	// Health check
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// Auth routes
	api := app.Group("/api")
	auth := api.Group("/auth")
	auth.Post("/signup", SignupHandler(db, cfg))
	auth.Post("/login", LoginHandler(db, cfg))

	// Protected routes
	docs := api.Group("/docs", AuthMiddleware(cfg))
	docs.Post("/", CreateOrUpdateDocHandler(db))
	docs.Get("/today", GetTodayDocHandler(db))
	docs.Get("/history", GetHistoryHandler(db))
	docs.Get("/:date", GetDocByDateHandler(db))

	stats := api.Group("/stats", AuthMiddleware(cfg))
	stats.Get("/", GetStatsHandler(db, cfg))

	// Start server
	addr := fmt.Sprintf(":%d", cfg.Server.Port)
	log.Printf("Server starting on port %d", cfg.Server.Port)
	log.Fatal(app.Listen(addr))
}
