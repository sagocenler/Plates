export default function Placeholder({ title, step }: { title: string; step: number }) {
  return (
    <section>
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="mt-2 text-muted">Coming in build step {step}.</p>
    </section>
  )
}
