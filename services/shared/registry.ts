/**
 * Generic provider registry.
 *
 * Every service domain (llm, stt, tts, embeddings) owns one instance,
 * mapping a provider id to a lazy factory. Adding a new provider is:
 *   1. implement the domain interface,
 *   2. `registry.register("id", () => new MyProvider())`.
 *
 * No business logic changes — the active provider is selected at runtime
 * (typically from an env var) via `resolve()`.
 */
export class ProviderRegistry<TId extends string, TProvider> {
  private readonly factories = new Map<TId, () => TProvider>();
  private readonly instances = new Map<TId, TProvider>();

  /** Register (or replace) the factory for a provider id. */
  register(id: TId, factory: () => TProvider): this {
    this.factories.set(id, factory);
    this.instances.delete(id);
    return this;
  }

  has(id: TId): boolean {
    return this.factories.has(id);
  }

  /** All registered provider ids. */
  ids(): TId[] {
    return [...this.factories.keys()];
  }

  /**
   * Create a fresh provider instance. Throws if the id is not registered.
   */
  create(id: TId): TProvider {
    const factory = this.factories.get(id);
    if (!factory) {
      const known = this.ids().join(", ") || "none";
      throw new Error(`No provider registered for id "${id}". Registered: ${known}.`);
    }
    return factory();
  }

  /**
   * Return a memoized singleton for the id (created on first use). Prefer
   * this for stateless providers to avoid re-reading config on every call.
   */
  resolve(id: TId): TProvider {
    const existing = this.instances.get(id);
    if (existing) return existing;
    const created = this.create(id);
    this.instances.set(id, created);
    return created;
  }
}
