import type { Contribution } from "./model";
import type { ContributionCreated } from "./events";
import type { Clock, ContributionRepository, ContributionService, IdGenerator } from "./ports";
import { contentValidators, textProjectionFor, type ContributionInput } from "./validation";

/** Raised when input fails validation — the transport maps it to a gentle message. */
export class ContributionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContributionValidationError";
  }
}

/**
 * The write use-case. Pure application logic behind the ContributionService port:
 * it validates the contribution against its type's content schema, builds the
 * ContributionCreated event, and asks the repository to persist both atomically.
 * It depends only on domain ports — it has no idea Supabase exists.
 *
 * Identity follows contribution: the only identity here is an anonymous visitor id.
 * Continuations (a parent contribution) arrive in a later PR; a new contribution is
 * its own lineage root.
 */
export class ContributeService implements ContributionService {
  constructor(
    private readonly repo: ContributionRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async contribute(visitorId: string, input: ContributionInput): Promise<Contribution> {
    const validator = contentValidators[input.type];
    if (!validator) {
      throw new ContributionValidationError(`This kind of contribution isn’t available yet.`);
    }
    const parsed = validator.safeParse(input.content);
    if (!parsed.success) {
      throw new ContributionValidationError(parsed.error.issues[0]?.message ?? "That can’t be saved yet.");
    }
    const content = parsed.data as Record<string, unknown>;

    const id = this.ids.next();
    const event: ContributionCreated = {
      type: "ContributionCreated",
      aggregateType: "contribution",
      aggregateId: id,
      payloadVersion: 1,
      occurredAt: this.clock.now(),
      payload: { contributionId: id, type: input.type, authorVisitorId: visitorId, parentId: null },
      idempotencyKey: `ContributionCreated:${id}`,
    };

    return this.repo.create(
      {
        id,
        type: input.type,
        authorVisitorId: visitorId,
        content,
        textProjection: textProjectionFor(input.type, content),
        lang: input.lang ?? null,
        region: null,
        parentId: null,
        rootId: id, // a new top-level contribution is its own lineage root
        depth: 0,
      },
      event,
    );
  }
}
