import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import toml from '@iarna/toml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default function configPlugin() {
  return {
    name: 'vite-plugin-config',
    config(config, { command }) {
      // Determine config file path
      const configPath = process.env.FWD_UI_CONFIG_PATH || resolve(__dirname, '../fwd-ui.toml');
      
      let tomlConfig = {};
      
      // Read and parse TOML file if it exists
      if (existsSync(configPath)) {
        try {
          const configContent = readFileSync(configPath, 'utf-8');
          tomlConfig = toml.parse(configContent);
          console.log(`✓ Loaded config from: ${configPath}`);
        } catch (error) {
          console.warn(`Warning: Could not parse config file at ${configPath}:`, error.message);
        }
      } else {
        console.warn(`Warning: Config file not found at ${configPath}. Using defaults.`);
      }
      
      // Extract frontend-relevant values with defaults (env wins for local overrides, e.g. devlocal.sh)
      const apiUrl =
        process.env.VITE_API_URL || tomlConfig.api_url || 'http://localhost:3000';
      const minimumWords = tomlConfig.minimum_words || 42;
      
      // Inject as environment variables
      return {
        define: {
          'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
          'import.meta.env.VITE_MINIMUM_WORDS': JSON.stringify(minimumWords),
        }
      };
    }
  };
}

