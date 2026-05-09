// Tiny shared field primitives for the wizard. Kept in-namespace to
// avoid bloating the global components/ui/ surface for one-off form
// scaffolding. Promoted later if other forms need the same shape.

type FieldLabelProps = {
  id: string;
  required?: boolean;
  children: React.ReactNode;
};

export function FieldLabel({ id, required, children }: FieldLabelProps) {
  return (
    <label htmlFor={id} className="text-text mb-1 block text-sm font-medium">
      {children}
      {required ? (
        <span aria-hidden="true" className="text-state-error ml-0.5">
          *
        </span>
      ) : null}
    </label>
  );
}

type FieldErrorProps = {
  id: string;
  message?: string;
};

export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-state-error mt-1 text-xs">
      {message}
    </p>
  );
}
