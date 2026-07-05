/**
 * APK Obfuscation Engine
 * Handles renaming of assets, classes.dex identifiers, and lib files using Arabic symbols
 */

// Arabic symbols for obfuscation
const ARABIC_SYMBOLS = ['ۗ', 'ۙ', 'ۦ', 'ۘ', 'ۗۙ', 'ۗۦ', 'ۙۦ', 'ۗۘ', 'ۦۗ', 'ۘۗ', 'ۙۗ', 'ۦۙ'];

/**
 * Generate a unique obfuscated identifier using Arabic symbols
 */
export function generateObfuscatedId(index: number): string {
  const symbolCount = ARABIC_SYMBOLS.length;
  let id = '';
  let num = index;

  while (num >= 0) {
    id = ARABIC_SYMBOLS[num % symbolCount] + id;
    num = Math.floor(num / symbolCount) - 1;
    if (num < 0) break;
  }

  return id || ARABIC_SYMBOLS[0];
}

/**
 * Create a mapping of original names to obfuscated names
 */
export function createObfuscationMap(originalNames: string[]): Map<string, string> {
  const map = new Map<string, string>();
  originalNames.forEach((name, index) => {
    map.set(name, generateObfuscatedId(index));
  });
  return map;
}

/**
 * Obfuscate asset filenames
 * Preserves file extensions but renames the base name
 */
export function obfuscateAssetName(originalName: string, index: number): string {
  const parts = originalName.split('.');
  const extension = parts.length > 1 ? '.' + parts.pop() : '';
  const obfuscatedBase = generateObfuscatedId(index);
  return obfuscatedBase + extension;
}

/**
 * Obfuscate a class name (Java identifier format)
 * Converts to Arabic symbol identifier
 */
export function obfuscateClassName(originalClass: string, index: number): string {
  return generateObfuscatedId(index);
}

/**
 * Obfuscate a method name
 */
export function obfuscateMethodName(originalMethod: string, index: number): string {
  return generateObfuscatedId(index);
}

/**
 * Obfuscate lib file names
 * Preserves .so extension for native libraries
 */
export function obfuscateLibName(originalName: string, index: number): string {
  const isSoFile = originalName.endsWith('.so');
  const obfuscatedBase = generateObfuscatedId(index);
  return isSoFile ? obfuscatedBase + '.so' : obfuscatedBase;
}

/**
 * Extract class and method names from a DEX descriptor
 * DEX format: Lcom/example/ClassName;->methodName(Ljava/lang/String;)V
 */
export function parseDexDescriptor(descriptor: string): { className: string; methodName: string } | null {
  const match = descriptor.match(/^L([^;]+);->([^(]+)/);
  if (!match) return null;
  return {
    className: match[1].replace(/\//g, '.'),
    methodName: match[2],
  };
}

/**
 * Obfuscate a DEX descriptor string
 */
export function obfuscateDexDescriptor(
  descriptor: string,
  classMap: Map<string, string>,
  methodMap: Map<string, string>
): string {
  const parsed = parseDexDescriptor(descriptor);
  if (!parsed) return descriptor;

  const obfuscatedClass = classMap.get(parsed.className) || generateObfuscatedId(classMap.size);
  const obfuscatedMethod = methodMap.get(parsed.methodName) || generateObfuscatedId(methodMap.size);

  // Reconstruct descriptor with obfuscated names
  const obfuscatedPath = obfuscatedClass.replace(/\./g, '/');
  return `L${obfuscatedPath};->${obfuscatedMethod}`;
}

/**
 * Simple DEX file structure parser (minimal implementation)
 * This extracts string references that likely contain class/method names
 */
export function extractStringsFromDex(buffer: Buffer): string[] {
  const strings: string[] = [];

  // DEX file magic: 64 65 78 0a 30 33 35 00 (dex\n035\0)
  if (!buffer.toString('hex', 0, 4).startsWith('6465780a')) {
    return strings;
  }

  // This is a simplified extraction - a full DEX parser would be much more complex
  // For now, we'll look for common patterns in the binary data
  const text = buffer.toString('binary');
  const stringPattern = /[\x20-\x7e]{4,}/g;
  const matches = text.match(stringPattern);

  if (matches) {
    strings.push(...matches.filter(s => s.includes('.')));
  }

  return strings;
}

/**
 * Obfuscation statistics
 */
export interface ObfuscationStats {
  assetsObfuscated: number;
  classesObfuscated: number;
  methodsObfuscated: number;
  libsObfuscated: number;
  totalSize: number;
  obfuscatedSize: number;
}

export function createEmptyStats(): ObfuscationStats {
  return {
    assetsObfuscated: 0,
    classesObfuscated: 0,
    methodsObfuscated: 0,
    libsObfuscated: 0,
    totalSize: 0,
    obfuscatedSize: 0,
  };
}
