package main

import (
	"log"
	"os"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	Server       ServerConfig
	Database     DatabaseConfig
	JWT          JWTConfig
	MinimumWords int
}

type ServerConfig struct {
	Port int
}

type DatabaseConfig struct {
	Path             string
	MigrationsFolder string
}

type JWTConfig struct {
	Secret string
	Expiry time.Duration
}

func LoadConfig() *Config {
	// Check for FWD_CONFIG_PATH environment variable
	configPath := os.Getenv("FWD_CONFIG_PATH")
	if configPath != "" {
		viper.SetConfigFile(configPath)
	} else {
		// Default to fwd-backend.toml in parent directory (workspace root)
		viper.SetConfigName("fwd-backend")
		viper.SetConfigType("toml")
		viper.AddConfigPath(".")
		viper.AddConfigPath("..")
	}

	viper.SetEnvPrefix("FWD")
	viper.AutomaticEnv()

	// Explicitly bind environment variables for nested keys
	viper.BindEnv("jwt.secret", "FWD_JWT_SECRET")

	// Set defaults
	viper.SetDefault("port", 3000)
	viper.SetDefault("database_path", "./freewriting.db")
	viper.SetDefault("migrations_folder", "./migrations")
	viper.SetDefault("jwt_expiry", "720h")
	viper.SetDefault("minimum_words", 42)

	if err := viper.ReadInConfig(); err != nil {
		log.Printf("Warning: Could not read config file: %v. Using defaults and env vars.", err)
	}

	// JWT Secret is required
	jwtSecret := viper.GetString("jwt_secret")
	if jwtSecret == "" {
		// Also try old format for backward compatibility
		jwtSecret = viper.GetString("jwt.secret")
	}
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET environment variable is required")
	}

	expiryStr := viper.GetString("jwt_expiry")
	if expiryStr == "" {
		expiryStr = viper.GetString("jwt.expiry")
	}
	expiry, err := time.ParseDuration(expiryStr)
	if err != nil {
		log.Fatalf("Invalid JWT expiry duration: %v", err)
	}

	return &Config{
		Server: ServerConfig{
			Port: viper.GetInt("port"),
		},
		Database: DatabaseConfig{
			Path:             viper.GetString("database_path"),
			MigrationsFolder: viper.GetString("migrations_folder"),
		},
		JWT: JWTConfig{
			Secret: jwtSecret,
			Expiry: expiry,
		},
		MinimumWords: viper.GetInt("minimum_words"),
	}
}
