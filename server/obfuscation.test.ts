import { describe, it, expect } from 'vitest';
import {
  generateObfuscatedId,
  createObfuscationMap,
  obfuscateAssetName,
  obfuscateClassName,
  obfuscateLibName,
  parseDexDescriptor,
} from './obfuscation';

describe('Obfuscation Engine', () => {
  describe('generateObfuscatedId', () => {
    it('should generate unique Arabic symbol identifiers', () => {
      const id0 = generateObfuscatedId(0);
      const id1 = generateObfuscatedId(1);
      const id2 = generateObfuscatedId(2);

      expect(id0).toBeTruthy();
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id0).not.toBe(id1);
      expect(id1).not.toBe(id2);
    });

    it('should contain only Arabic symbols', () => {
      const arabicPattern = /^[\u06D6-\u06FF]+$/;
      for (let i = 0; i < 50; i++) {
        const id = generateObfuscatedId(i);
        expect(arabicPattern.test(id)).toBe(true);
      }
    });

    it('should generate deterministic IDs for same index', () => {
      const id1 = generateObfuscatedId(5);
      const id2 = generateObfuscatedId(5);
      expect(id1).toBe(id2);
    });
  });

  describe('createObfuscationMap', () => {
    it('should create a map of original to obfuscated names', () => {
      const originals = ['MainActivity.java', 'Utils.java', 'Config.java'];
      const map = createObfuscationMap(originals);

      expect(map.size).toBe(3);
      expect(map.has('MainActivity.java')).toBe(true);
      expect(map.has('Utils.java')).toBe(true);
      expect(map.has('Config.java')).toBe(true);
    });

    it('should map to unique obfuscated names', () => {
      const originals = ['a.java', 'b.java', 'c.java'];
      const map = createObfuscationMap(originals);

      const values = Array.from(map.values());
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });
  });

  describe('obfuscateAssetName', () => {
    it('should preserve file extensions', () => {
      const obfuscated = obfuscateAssetName('image.png', 0);
      expect(obfuscated).toMatch(/\.png$/);
    });

    it('should replace base name with Arabic symbols', () => {
      const obfuscated = obfuscateAssetName('config.json', 1);
      expect(obfuscated).toMatch(/\.json$/);
      expect(obfuscated).not.toContain('config');
    });

    it('should handle files without extensions', () => {
      const obfuscated = obfuscateAssetName('Dockerfile', 2);
      expect(obfuscated).toBeTruthy();
      expect(obfuscated).not.toContain('Dockerfile');
    });
  });

  describe('obfuscateClassName', () => {
    it('should replace class name with Arabic symbols', () => {
      const obfuscated = obfuscateClassName('MainActivity', 0);
      expect(obfuscated).toBeTruthy();
      expect(obfuscated).not.toContain('MainActivity');
    });

    it('should generate different names for different indices', () => {
      const name1 = obfuscateClassName('ClassA', 0);
      const name2 = obfuscateClassName('ClassB', 1);
      expect(name1).not.toBe(name2);
    });
  });

  describe('obfuscateLibName', () => {
    it('should preserve .so extension for native libraries', () => {
      const obfuscated = obfuscateLibName('libnative.so', 0);
      expect(obfuscated).toMatch(/\.so$/);
      expect(obfuscated).not.toContain('libnative');
    });

    it('should handle non-.so files', () => {
      const obfuscated = obfuscateLibName('library.jar', 1);
      expect(obfuscated).toBeTruthy();
      expect(obfuscated).not.toContain('library');
    });
  });

  describe('parseDexDescriptor', () => {
    it('should parse valid DEX descriptors', () => {
      const descriptor = 'Lcom/example/MainActivity;->onCreate(Landroid/os/Bundle;)V';
      const result = parseDexDescriptor(descriptor);

      expect(result).not.toBeNull();
      expect(result?.className).toBe('com.example.MainActivity');
      expect(result?.methodName).toBe('onCreate');
    });

    it('should handle nested classes', () => {
      const descriptor = 'Lcom/example/Outer$Inner;->method()V';
      const result = parseDexDescriptor(descriptor);

      expect(result).not.toBeNull();
      expect(result?.className).toContain('Outer$Inner');
    });

    it('should return null for invalid descriptors', () => {
      const result = parseDexDescriptor('invalid');
      expect(result).toBeNull();
    });

    it('should return null for descriptors without method', () => {
      const result = parseDexDescriptor('Lcom/example/MainActivity;');
      expect(result).toBeNull();
    });
  });
});
