/** Matches store readEnabled: only explicit false is off. */
export function isModuleEnabled(enabled: boolean | undefined): boolean {
  return enabled !== false;
}

const REVERT_CHECKBOX_ON_HTMX_ERROR =
  "var c=this.checked;this.checked=!c;var l=this.closest('label');if(l){var s=l.querySelector('.toggle-label');if(s)s.textContent=this.checked?'On':'Off'}";

export function StatusDot({
  namespace,
  enabled,
  oob,
}: {
  namespace: string;
  enabled: boolean | undefined;
  oob?: boolean;
}) {
  const on = isModuleEnabled(enabled);
  return (
    <span
      id={`status-dot-${namespace}`}
      class={`status-dot ${on ? "status-green" : "status-muted"}`}
      {...(oob ? { "hx-swap-oob": "true" } : {})}
    />
  );
}

export function EnabledToggle({
  namespace,
  enabled,
}: {
  namespace: string;
  enabled: boolean | undefined;
}) {
  const on = isModuleEnabled(enabled);
  const toggleId = `enabled-toggle-${namespace}`;
  return (
    <div id={toggleId}>
      <label class="flex cursor-pointer items-center justify-end gap-3">
        <span class="text-sm text-base-content/80 toggle-label">{on ? "On" : "Off"}</span>
        <input
          class="toggle toggle-success"
          type="checkbox"
          name="enabled"
          value="true"
          checked={on}
          hx-put={`/htmx/modules/${namespace}/enabled`}
          hx-trigger="change"
          hx-target={`#${toggleId}`}
          hx-swap="outerHTML"
          hx-include="this"
          hx-on:response-error={REVERT_CHECKBOX_ON_HTMX_ERROR}
          hx-on:send-error={REVERT_CHECKBOX_ON_HTMX_ERROR}
        />
      </label>
    </div>
  );
}

/** HTMX response fragment: re-render toggle + OOB sidebar status dot. */
export function EnabledToggleResponse({
  namespace,
  enabled,
}: {
  namespace: string;
  enabled: boolean;
}) {
  return (
    <>
      <EnabledToggle namespace={namespace} enabled={enabled} />
      <StatusDot namespace={namespace} enabled={enabled} oob />
    </>
  );
}
