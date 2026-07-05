import { FieldWrap } from "./shared.js";
import type { SubFieldProps } from "./shared.js";

export function BooleanField({ f, value, name, disabled }: SubFieldProps) {
  const id = name.replace(/[[\].]/g, "-");
  const checked = value === true;
  return (
    <FieldWrap id={id} label={f.label} help={f.help} disabled={disabled}>
      <label class="label cursor-pointer justify-start gap-3">
        <input
          class="toggle toggle-primary"
          type="checkbox"
          id={id}
          name={name}
          value="true"
          checked={checked}
          disabled={disabled}
          onchange="var l=this.closest('label');if(l){var s=l.querySelector('.toggle-label');if(s)s.textContent=this.checked?'On':'Off'}"
        />
        <span class="label-text toggle-label">{checked ? "On" : "Off"}</span>
      </label>
    </FieldWrap>
  );
}

export function SelectField({
  f,
  value,
  name,
  disabled,
  ...extra
}: SubFieldProps & Record<string, unknown>) {
  const id = name.replace(/[[\].]/g, "-");
  const strVal = value != null ? String(value) : "";
  return (
    <FieldWrap id={id} label={f.label} help={f.help} disabled={disabled}>
      <select
        class="select select-bordered w-full"
        id={id}
        name={name}
        disabled={disabled}
        {...extra}
      >
        {(f.options ?? []).map((opt) => (
          <option value={opt.value} selected={opt.value === strVal}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrap>
  );
}
