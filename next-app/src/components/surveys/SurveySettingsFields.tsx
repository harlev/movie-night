import { SURVEY_SELECTION_SIZES } from '@/lib/utils/surveyConfig';

interface SurveySettingsFieldsProps {
  title?: string;
  description?: string;
  maxRankN?: number;
  isAnonymous?: boolean;
  membersOnly?: boolean;
  showResponderOptions?: boolean;
  allowResponderOptions?: boolean;
  canDisableResponderOptions?: boolean;
}

export function SurveySettingsFields({
  title = '',
  description = '',
  maxRankN = 3,
  isAnonymous = false,
  membersOnly = true,
  showResponderOptions = false,
  allowResponderOptions = true,
  canDisableResponderOptions: canDisable = false,
}: SurveySettingsFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="title" className="mb-2 block text-sm font-medium text-[var(--color-text)]">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={100}
          defaultValue={title}
          placeholder="What should we decide?"
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-medium text-[var(--color-text)]">Description (optional)</label>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={1000}
          defaultValue={description}
          placeholder="Add context for responders..."
          className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="maxRankN" className="mb-2 block text-sm font-medium text-[var(--color-text)]">Selection method</label>
        <select
          id="maxRankN"
          name="maxRankN"
          defaultValue={maxRankN}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
        >
          {SURVEY_SELECTION_SIZES.map((size) => (
            <option key={size} value={size}>
              {size === 1 ? 'Select one option' : `Rank your top ${size}`}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Ranked choices award descending points: 3/2/1 or 5/4/3/2/1.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-surface-elevated)] p-3">
          <input type="hidden" name="isAnonymous" value="false" />
          <input type="checkbox" name="isAnonymous" value="true" defaultChecked={isAnonymous} className="mt-1 h-4 w-4 accent-[var(--color-primary)]" />
          <span>
            <span className="block text-sm font-medium text-[var(--color-text)]">Anonymous responses</span>
            <span className="block text-xs text-[var(--color-text-muted)]">Do not attach or display a profile or name with a response.</span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-surface-elevated)] p-3">
          <input type="hidden" name="membersOnly" value="false" />
          <input type="checkbox" name="membersOnly" value="true" defaultChecked={membersOnly} className="mt-1 h-4 w-4 accent-[var(--color-primary)]" />
          <span>
            <span className="block text-sm font-medium text-[var(--color-text)]">Members only</span>
            <span className="block text-xs text-[var(--color-text-muted)]">Require an active member account to respond.</span>
          </span>
        </label>
      </div>

      {showResponderOptions && (
        <label className={`flex items-start gap-3 rounded-lg border border-[var(--color-border)]/60 bg-[var(--color-surface-elevated)] p-3 ${canDisable ? 'cursor-pointer' : 'opacity-80'}`}>
          <input type="hidden" name="allowResponderOptions" value="false" />
          <input
            type="checkbox"
            name="allowResponderOptions"
            value="true"
            defaultChecked={allowResponderOptions || !canDisable}
            disabled={!canDisable}
            className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
          />
          {!canDisable && <input type="hidden" name="allowResponderOptions" value="true" />}
          <span>
            <span className="block text-sm font-medium text-[var(--color-text)]">Responders may add options</span>
            <span className="block text-xs text-[var(--color-text-muted)]">
              {!canDisable
                ? 'Required until the survey has at least two admin options.'
                : 'Allow new options while the survey is live.'}
            </span>
          </span>
        </label>
      )}
    </div>
  );
}
