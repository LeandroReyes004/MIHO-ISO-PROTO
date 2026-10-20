export * from './types';
export * from './BaseExtension';
export * from './es/InManga';

import { BaseExtension } from './BaseExtension';
import { InMangaExtension } from './es/InManga';
import { ExtensionConfig, MangaExtension } from './types';

/**
 * Registry of all available ported extensions.
 */
export const EXTENSION_REGISTRY: Record<
  string,
  new (config?: ExtensionConfig) => BaseExtension
> = {
  'es.inmanga': InMangaExtension,
};

/**
 * Factory to instantiate an extension by ID with runtime CORS proxy configuration.
 */
export function createExtension(
  extensionId: string,
  config?: ExtensionConfig
): MangaExtension {
  const ExtensionClass = EXTENSION_REGISTRY[extensionId];
  if (!ExtensionClass) {
    throw new Error(`Extension "${extensionId}" not found in registry.`);
  }
  return new ExtensionClass(config);
}
