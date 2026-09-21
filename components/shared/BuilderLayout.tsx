/**
 * Shared vertical layout for builder library, configuration, and live preview.
 */
export function BuilderLayout({
  library,
  config,
  preview,
}: {
  library: React.ReactNode;
  config: React.ReactNode;
  preview: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6">{library}</div>
      <div className="flex flex-col gap-6">{config}</div>
      <div className="flex flex-col gap-6">{preview}</div>
    </div>
  );
}
