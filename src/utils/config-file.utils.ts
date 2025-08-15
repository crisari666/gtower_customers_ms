import * as fs from 'fs';
import * as path from 'path';

export class ConfigFileUtils {
  /**
   * Reads a configuration file with fallback logic
   * First tries to read from the compiled dist directory, then falls back to src
   * @param relativePath - Path relative to the calling file (e.g., '../config/file.json')
   * @param fallbackPath - Fallback path from project root (e.g., 'src/whatsapp/config/file.json')
   * @returns The parsed file content
   */
  static readConfigFile<T = any>(relativePath: string, fallbackPath: string): T {
    try {
      // First try the compiled path (relative to __dirname)
      const compiledPath = path.join(__dirname, relativePath);
      const fileContent = fs.readFileSync(compiledPath, 'utf8');
      return JSON.parse(fileContent);
    } catch (error) {
      try {
        // Fall back to source path
        const sourcePath = path.join(process.cwd(), fallbackPath);
        const fileContent = fs.readFileSync(sourcePath, 'utf8');
        return JSON.parse(fileContent);
      } catch (fallbackError) {
        throw new Error(`Failed to read config file from both paths:\nCompiled: ${relativePath}\nSource: ${fallbackPath}\nError: ${fallbackError}`);
      }
    }
  }

  /**
   * Safely reads a configuration file with a default value
   * @param relativePath - Path relative to the calling file
   * @param fallbackPath - Fallback path from project root
   * @param defaultValue - Default value if file cannot be read
   * @returns The parsed file content or default value
   */
  static readConfigFileSafe<T = any>(
    relativePath: string, 
    fallbackPath: string, 
    defaultValue: T
  ): T {
    try {
      return this.readConfigFile<T>(relativePath, fallbackPath);
    } catch (error) {
      return defaultValue;
    }
  }
}
